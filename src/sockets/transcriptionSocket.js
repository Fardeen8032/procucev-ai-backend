import { v4 as uuidv4 } from 'uuid';
import { createSttSession } from '../services/sttProviderFactory.js';
import { createTranscription } from '../db/transcriptionRepo.js';

export function registerTranscriptionSocket(io) {
  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    let sttSession = null;
    let sessionId = null;
    let fullText = '';
    let startedAt = null;
    let audioChunksReceived = 0;

    socket.on('session:start', async () => {
      try {
        console.log('[Socket] Session start requested');

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
            console.log('[Socket] Partial transcript:', text);
            socket.emit('transcript:partial', { text });
          },

          onFinal: (text) => {
            console.log('[Socket] Final transcript:', text);
            fullText = fullText
              ? `${fullText} ${text}`
              : text;
            socket.emit('transcript:final', { text });
          },

          onError: (err) => {
            console.error('[Socket] STT error:', err);
            socket.emit('session:error', {
              message: err.message || String(err),
            });
          },
        });

        await newSession.connect();
        sttSession = newSession;

        console.log('[Socket] STT session ready');
        socket.emit('session:started', { sessionId });

      } catch (err) {
        console.error('[Socket] Session start failed:', err);
        socket.emit('session:error', {
          message: err.message || String(err),
        });
      }
    });

    socket.on('audio:chunk', async (chunk) => {
      if (!sttSession) {
        console.log('[Socket] STT session not ready');
        return;
      }

      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      try {
        await sttSession.sendAudioChunk(buffer);
      } catch (err) {
        console.error('[Socket] Audio forwarding failed:', err);
      }
    });

    socket.on('session:stop', async () => {
      console.log('[Socket] Session stop requested');

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
        console.error('[Socket] Save failed:', err);
        socket.emit('session:error', {
          message: err.message || String(err),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
      sttSession?.close();
      sttSession = null;
    });
  });
}
