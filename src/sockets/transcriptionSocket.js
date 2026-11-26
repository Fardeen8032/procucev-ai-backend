import { v4 as uuidv4 } from 'uuid';
import { createSttSession } from '../services/sttProviderFactory.js';
import { createTranscription } from '../db/transcriptionRepo.js';

export function registerTranscriptionSocket(io) {
  io.on('connection', (socket) => {

    let sttSession = null;
    let sessionId = null;
    let fullText = '';
    let startedAt = null;
    let audioChunksReceived = 0;

    socket.on('session:start', async () => {
      try {

        // Prevent duplicate sessions
        if (sttSession) {
          sttSession.close();
          sttSession = null;
        }

        sessionId = uuidv4();
        fullText = '';
        startedAt = Date.now();
        audioChunksReceived = 0;

        const newSession = createSttSession({
          onPartial: (text) => {
            socket.emit('transcript:partial', { text });
          },

          onFinal: (text) => {
            fullText = fullText
              ? `${fullText} ${text}`
              : text;
            socket.emit('transcript:final', { text });
          },

          onError: (err) => {
            socket.emit('session:error', {
              message: err.message || String(err),
            });
          },
        });

        await newSession.connect();
        sttSession = newSession;

        socket.emit('session:started', { sessionId });

      } catch (err) {
        socket.emit('session:error', {
          message: err.message || String(err),
        });
      }
    });

    socket.on('audio:chunk', async (chunk) => {
      if (!sttSession) {
        return;
      }

      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      try {
        await sttSession.sendAudioChunk(buffer);
      } catch (err) {
      }
    });

    socket.on('session:stop', async () => {

      sttSession?.close();
      sttSession = null;

      if (!sessionId || !fullText.trim()) {
        socket.emit('session:saved', null);
        return;
      }

      try {
        const record = await createTranscription({
          sessionId,
          text: fullText.trim(),
          languages: [],
          durationMs: startedAt
            ? Date.now() - startedAt
            : null,
          status: 'completed',
        });

        socket.emit('session:saved', record);
      } catch (err) {
        socket.emit('session:error', {
          message: err.message || String(err),
        });
      }
    });

    socket.on('disconnect', () => {
      sttSession?.close();
      sttSession = null;
    });
  });
}
