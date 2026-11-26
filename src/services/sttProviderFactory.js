import { GeminiLiveSession } from './geminiLiveService.js';
import { WhisperLiveSession } from './whisperLiveService.js';
import { env } from '../config/env.js';

export function createSttSession(callbacks) {
  if (env.sttProvider === 'whisper') {
    return new WhisperLiveSession(callbacks);
  }
  return new GeminiLiveSession(callbacks);
}
