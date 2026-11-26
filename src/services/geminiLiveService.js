import { GoogleGenAI, Modality } from '@google/genai';
import { env } from '../config/env.js';
export class GeminiLiveSession {
  constructor({ onPartial, onFinal, onError }) {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
    this.onError = onError;
    this.session = null;
    this.ready = false;
    this.pendingText = '';
  }

  async connect() {
    if (!env.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }
    const ai = new GoogleGenAI({ apiKey: env.gemini.apiKey, apiVersion: 'v1beta' });

    this.session = await ai.live.connect({
      model: env.gemini.model,
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction:
          'You are a real-time multilingual speech transcriber. Transcribe exactly ' +
          'what is spoken, including code-mixed speech (e.g. Hindi and English mixed ' +
          'in the same sentence). Output only the transcription text, no commentary, ' +
          'no translation, preserve the original language(s) as spoken.',
        inputAudioTranscription: {},
      },
      callbacks: {
  onopen: () => {
    console.log('[Gemini] Connection opened');
    this.ready = true;
  },

  onmessage: (message) => {
    this.handleMessage(message);
  },

  onerror: (err) => {
    this.onError?.(err);
  },

  onclose: (event) => {
    this.ready = false;
  },
},
    });

    return this;
  }

  handleMessage(message) {
  const content = message?.serverContent;

  if (!content) {
    return;
  }

  // Live, interim transcription
  const interim = content.interimInputTranscription?.text;

  if (interim) {
    this.onPartial?.(interim);
  }

  // Finalized transcription
  const finalText = content.inputTranscription?.text;

  if (finalText) {
    this.onFinal?.(finalText);
  }

  if (content.turnComplete) {
  }
}

  /**
   * @param {Buffer} pcmChunk raw 16-bit PCM, 16kHz mono
   */

async sendAudioChunk(pcmChunk) {
  if (!this.ready || !this.session) {
    return;
  }

  try {
    await this.session.sendRealtimeInput({
      audio: {
        data: pcmChunk.toString('base64'),
        mimeType: 'audio/pcm;rate=16000',
      },
    });

    this.audioChunkCount = (this.audioChunkCount || 0) + 1;

    if (this.audioChunkCount % 20 === 0) {
    }
  } catch (err) {
    this.onError?.(err);
  }
}

  close() {
    this.ready = false;
    try {
      this.session?.close();
    } catch {
      // ignore close errors
    }
  }
}
