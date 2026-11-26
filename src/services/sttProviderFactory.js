import { GeminiLiveSession } from './geminiLiveService.js';
import { WhisperLiveSession } from './whisperLiveService.js';
import { env } from '../config/env.js';

/**
 * Pluggable STT backend. Default is Gemini Live (cloud). Set
 * STT_PROVIDER=whisper to use a self-hosted open-source service instead,
 * e.g. an open-source `faster-whisper` / `whisper.cpp` websocket server.
 */
export function createSttSession(callbacks) {
  if (env.sttProvider === 'whisper') {
    return new WhisperLiveSession(callbacks);
  }
  return new GeminiLiveSession(callbacks);
}
