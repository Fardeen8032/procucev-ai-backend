import WebSocket from 'ws';
import { env } from '../config/env.js';

/**
 * Adapter for a self-deployed open-source streaming STT service exposing a
 * websocket endpoint that accepts raw PCM16 audio chunks and emits JSON
 * messages like { type: 'partial'|'final', text }. Compatible with
 * self-hosted servers such as whisper_streaming / faster-whisper-server.
 * Same interface as GeminiLiveSession so it is a drop-in replacement.
 */
export class WhisperLiveSession {
  constructor({ onPartial, onFinal, onError }) {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
    this.onError = onError;
    this.ws = null;
    this.ready = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(env.whisperWsUrl);

      this.ws.on('open', () => {
        this.ready = true;
        resolve(this);
      });

      this.ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'partial') this.onPartial?.(msg.text);
          if (msg.type === 'final') this.onFinal?.(msg.text);
        } catch (err) {
          this.onError?.(err);
        }
      });

      this.ws.on('error', (err) => {
        this.onError?.(err);
        reject(err);
      });

      this.ws.on('close', () => {
        this.ready = false;
      });
    });
  }

  sendAudioChunk(pcmChunk) {
    if (!this.ready || !this.ws) return;
    this.ws.send(pcmChunk);
  }

  close() {
    this.ready = false;
    this.ws?.close();
  }
}
