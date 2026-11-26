import WebSocket from 'ws';
import { env } from '../config/env.js';

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
