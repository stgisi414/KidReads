// IPA phoneme dictionary for ElevenLabs text-to-speech API
// This dictionary maps IPA symbols to ElevenLabs compatible SSML tags

/**
 * Provides a mapping of IPA symbols to ElevenLabs SSML phoneme tags
 * @returns Dictionary mapping IPA symbols to their ElevenLabs SSML representation
 */
export function buildElevenLabsPhoneDictionary(): Record<string, string> {
  const phoneDictionary: Record<string, string> = {
    // Vowels (using IPA symbols)
    "i": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"i\">i</phoneme><break time=\"0.2s\" />", 
    "ɪ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ɪ\">ɪ</phoneme><break time=\"0.2s\" />",  // Example: "bit"
    "e": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"e\">e</phoneme><break time=\"0.2s\" />",  // Example: "bed"
    "æ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"æ\">æ</phoneme><break time=\"0.2s\" />",  // Example: "cat"
    "ɑ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ɑ\">ɑ</phoneme><break time=\"0.2s\" />",  // Example: "father"
    "ɒ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ɒ\">ɒ</phoneme><break time=\"0.2s\" />",  // Example: "lot"
    "ɔ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ɔ\">ɔ</phoneme><break time=\"0.2s\" />",  // Example: "caught"
    "ʊ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ʊ\">ʊ</phoneme><break time=\"0.2s\" />",  // Example: "put"
    "u": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"u\">u</phoneme><break time=\"0.2s\" />",  // Example: "food"
    "ʌ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ʌ\">ʌ</phoneme><break time=\"0.2s\" />",  // Example: "cut"
    "ɜ": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ɜ\">ɜ</phoneme><break time=\"0.2s\" />",  // Example: "bird"
    "ə": "<break time=\"0.2s\" /><phoneme alphabet=\"ipa\" ph=\"ə\">ə</phoneme><break time=\"0.2s\" />",  // Example: "about"

    // Diphthongs (combinations of vowel sounds)
    "eɪ": "<phoneme alphabet=\"ipa\" ph=\"eɪ\">eɪ</phoneme>", // Example: "say"
    "aɪ": "<phoneme alphabet=\"ipa\" ph=\"aɪ\">aɪ</phoneme>", // Example: "my"
    "ɔɪ": "<phoneme alphabet=\"ipa\" ph=\"ɔɪ\">ɔɪ</phoneme>", // Example: "boy"
    "aʊ": "<phoneme alphabet=\"ipa\" ph=\"aʊ\">aʊ</phoneme>", // Example: "now"
    "oʊ": "<phoneme alphabet=\"ipa\" ph=\"oʊ\">oʊ</phoneme>", // Example: "go"
    "ɪə": "<phoneme alphabet=\"ipa\" ph=\"ɪə\">ɪə</phoneme>", // Example: "near"
    "eə": "<phoneme alphabet=\"ipa\" ph=\"eə\">eə</phoneme>", // Example: "hair"
    "ʊə": "<phoneme alphabet=\"ipa\" ph=\"ʊə\">ʊə</phoneme>", // Example: "pure"

    // Consonants (using IPA symbols)
    "p": "<phoneme alphabet=\"ipa\" ph=\"p\">p</phoneme>",
    "b": "<phoneme alphabet=\"ipa\" ph=\"b\">b</phoneme>",
    "t": "<phoneme alphabet=\"ipa\" ph=\"t\">t</phoneme>",
    "d": "<phoneme alphabet=\"ipa\" ph=\"d\">d</phoneme>",
    "k": "<phoneme alphabet=\"ipa\" ph=\"k\">k</phoneme>",
    "ɡ": "<phoneme alphabet=\"ipa\" ph=\"ɡ\">guh</phoneme>",
    "tʃ": "<phoneme alphabet=\"ipa\" ph=\"tʃ\">tʃ</phoneme>", // Example: "church"
    "dʒ": "<phoneme alphabet=\"ipa\" ph=\"dʒ\">dʒ</phoneme>", // Example: "judge"
    "f": "<phoneme alphabet=\"ipa\" ph=\"f\">f</phoneme>",
    "v": "<phoneme alphabet=\"ipa\" ph=\"v\">v</phoneme>",
    "θ": "<phoneme alphabet=\"ipa\" ph=\"θ\">θ</phoneme>", // Example: "thin"
    "ð": "<phoneme alphabet=\"ipa\" ph=\"ð\">ð</phoneme>", // Example: "this"
    "s": "<phoneme alphabet=\"ipa\" ph=\"s\">s</phoneme>",
    "z": "<phoneme alphabet=\"ipa\" ph=\"z\">z</phoneme>",
    "ʃ": "<phoneme alphabet=\"ipa\" ph=\"ʃ\">ʃ</phoneme>", // Example: "ship"
    "ʒ": "<phoneme alphabet=\"ipa\" ph=\"ʒ\">ʒ</phoneme>", // Example: "measure"
    "h": "<phoneme alphabet=\"ipa\" ph=\"h\">h</phoneme>",
    "m": "<phoneme alphabet=\"ipa\" ph=\"m\">m</phoneme>",
    "n": "<phoneme alphabet=\"ipa\" ph=\"n\">n</phoneme>",
    "ŋ": "<phoneme alphabet=\"ipa\" ph=\"ŋ\">ŋ</phoneme>", // Example: "sing"
    "l": "<phoneme alphabet=\"ipa\" ph=\"l\">l</phoneme>",
    "ɹ": "<phoneme alphabet=\"ipa\" ph=\"ɹ\">ɹ</phoneme>", // Example: "red"
    "j": "<phoneme alphabet=\"ipa\" ph=\"j\">j</phoneme>", // Example: "yes"
    "w": "<phoneme alphabet=\"ipa\" ph=\"w\">wuh</phoneme>"
  };

  return phoneDictionary;
}

// Mapping from simple phonetic notation to IPA symbols
export const simpleToIPAMap: Record<string, string> = {
  // Vowels
  "/ee/": "i",
  "/i/": "ɪ",
  "/e/": "e",
  "/a/": "æ",
  "/ah/": "ɑ",
  "/o/": "ɒ",
  "/aw/": "ɔ",
  "/oo/": "ʊ",
  "/u/": "u",
  "/uh/": "ʌ",
  "/er/": "ɜ",
  "/ə/": "ə",
  
  // Diphthongs
  "/ay/": "eɪ",
  "/ai/": "aɪ",
  "/oi/": "ɔɪ",
  "/ow/": "aʊ",
  "/oh/": "oʊ",
  "/ea/": "ɪə",
  "/air/": "eə",
  "/ure/": "ʊə",
  
  // Consonants
  "/p/": "p",
  "/b/": "b",
  "/t/": "t",
  "/d/": "d",
  "/k/": "k",
  "/g/": "ɡ",
  "/ch/": "tʃ",
  "/j/": "dʒ",
  "/f/": "f",
  "/v/": "v",
  "/th/": "θ",
  "/th-v/": "ð", // Voiced th
  "/s/": "s",
  "/z/": "z",
  "/sh/": "ʃ",
  "/zh/": "ʒ",
  "/h/": "h",
  "/m/": "m",
  "/n/": "n",
  "/ng/": "ŋ",
  "/l/": "l",
  "/r/": "ɹ",
  "/y/": "j",
  "/w/": "w",
  
  // Common special cases
  "/ĭ/": "ɪ",
  "/ll/": "l"
};

/**
 * Converts a simple phonetic notation to an IPA symbol
 * @param simple Simple phonetic notation (e.g., "/s/", "/th/")
 * @returns Corresponding IPA symbol if available, or the original input
 */
export function convertSimpleToIPA(simple: string): string {
  return simpleToIPAMap[simple] || simple.replace(/\//g, '');
}

/**
 * Wraps an IPA symbol in the appropriate ElevenLabs SSML phoneme tag
 * @param ipaSymbol IPA symbol to wrap in SSML
 * @returns SSML string with phoneme tag
 */
export function wrapIPAInSSML(ipaSymbol: string): string {
  return `<phoneme alphabet="ipa" ph="${ipaSymbol}">${ipaSymbol}</phoneme>`;
}