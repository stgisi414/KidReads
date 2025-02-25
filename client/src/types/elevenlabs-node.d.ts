
declare module 'elevenlabs-node' {
  export default class Voice {
    constructor(config: { apiKey: string });
    textToSpeech(text: string, options: { voiceId: string, fileName: string }): Promise<ArrayBuffer>;
  }
}
