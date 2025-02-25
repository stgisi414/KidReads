declare module 'elevenlabs-node' {
  export default class Voice {
    constructor(config: { apiKey: string; voiceId: string });
    textToSpeech(text: string): Promise<ArrayBuffer>;
  }
}
