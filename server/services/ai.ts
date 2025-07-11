import 'dotenv/config';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is required");
}

// List of sensitive topics to filter out
const SENSITIVE_TOPICS = [
  // Religious terms
  'god', 'jesus', 'church', 'mosque', 'temple', 'pray', 'religion', 'bible', 'quran', 'torah',
  // Political terms
  'president', 'election', 'politics', 'democrat', 'republican', 'congress', 'government', 'political',
  'vote', 'campaign'
];

// List of forbidden words and topics for content filtering
const FORBIDDEN_WORDS = [
  // Violence/Death
  'kill', 'killed', 'killing', 'kills', 'shoot', 'shot', 'shooting', 'shoots', 'stab', 'stabbed', 'stabbing', 'stabs', 'die', 'died', 'dying', 'death', 'dead', 'murder', 'murdered', 'murdering', 'murders', 'war', 'fight', 'fighting', 'fights', 'bomb', 'bombs', 'bombing', 'explode', 'exploded', 'exploding', 'explosion', 'explosions', 'weapon', 'weapons', 'gun', 'guns', 'attack', 'attacked', 'attacking', 'attacks', 'assault', 'assaulted', 'assaulting', 'slay', 'slew', 'slaying', 'slain', 'massacre', 'massacred', 'massacring', 'slaughter', 'slaughtered', 'slaughtering', 'execute', 'executed', 'executing', 'execution', 'executions', 'assassinate', 'assassinated', 'assassinating', 'assassination', 'homicide', 'suicide', 'glock', 'ruger', 'm4', 'm16', 'm24', 'm249', 'm4a1', 'm4a1s', 'm4a1u', 'm4a1m', 'ak47', 'ak47u', 'ak47m', 'ak47s', 'ak47m', 'pistol', 'rifle', 'knife', 'knives',

  // Satanic/Demonic
  'devil', 'demon', 'satan', 'hell', 'lucifer', 'beezlebub', 'demonize', 'demonic', 'satanic', 'satanism', 'occult', 'damnation', 'infernal',

  // Body Parts/Bodily Functions (Highly explicit and vulgar terms)
  'pussy', 'vagina', 'penis', 'dick', 'cock', 'ass', 'anus', 'rectum', 'testicles', 'breasts', 'tits', 'titties', 'asshole', 'butthole', 'cum', 'jizz', 'semen', 'ejaculate', 'ejaculation', 'clitoris', 'vagina', 'labia', 'prostate', 'scrotum', 'cunt',

  // Hate/Discrimination
  'hate', 'hated', 'hating', 'hates', 'racist', 'racism', 'nazi', 'fascist', 'bigot', 'bigotry', 'supremacist', 'supremacy', 'discrimination', 'discriminatory', 'segregation', 'genocide', 'ethnic cleansing', 'holocaust',
    //Slurs
  'nigger', 'nigga', 'chink', 'gook', 'wetback', 'spic', 'kike', 'faggot', 'dyke', 'tranny', 'retarded', 'retard', // and other widely recognized slurs.  A comprehensive list is impractical, but focus on the most egregious and commonly used.

  // Sex/Sexual Acts (Explicit and graphic terms)
  'sex', 'fuck', 'fucked', 'fucking', 'fucker', 'motherfucker', 'blowjob', 'handjob', 'rimjob', 'screwing', 'rape', 'raped', 'raping', 'rapist', 'molest', 'molested', 'molesting', 'molester', 'pedophile', 'pedophilia', 'incest', 'bestiality', 'orgy', 'threesome', 'gangbang', 'porn', 'pornography', 'pornographic',

  // Drugs/Alcohol
  'drug', 'drugs', 'alcohol', 'drunk', 'intoxicated', 'cocaine', 'heroin', 'marijuana', 'weed', 'meth', 'methamphetamine', 'crack', 'lsd', 'ecstasy', 'mdma', 'opioids', 'amphetamine', 'narcotics', 'high', 'stoned', 'wasted', 'plastered', 'hammered', 'booze',

  // Swearing/Cursing
  'damn', 'bitch', 'bastard', 'shit', 'shitty', 'bullshit', 'goddamn', 'hell' /*if not already in satanic section*/, 'asshole', 'piss', 'crap',

  // Other Potentially Problematic Words
  // 'religion', 'god' - REMOVED.  These are too broad and likely to cause false positives.  Only include specific, malicious uses in other categories (e.g., hateful slurs).
  'blood', 'gore', 'bloody', 'gory', 'suicidal',

    //Misinformation/Harmful content: added to cover broader cases
    'hoax', 'fake news', 'disinformation', 'misinformation', 'conspiracy', 'propaganda',

];

function containsSensitiveContent(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return SENSITIVE_TOPICS.some(topic => 
    normalizedText.includes(topic.toLowerCase()) ||
    normalizedText.split(/\s+/).some(word => 
      topic.toLowerCase() === word.toLowerCase()
    )
  );
}

function containsForbiddenContent(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => 
    normalizedText.includes(word.toLowerCase()) ||
    normalizedText.split(/\s+/).some(token => 
      word.toLowerCase() === token.toLowerCase()
    )
  );
}

// Dictionary of common homophones (words that sound the same but are spelled differently)
const HOMOPHONES: Record<string, string[]> = {
  // Names and common words that cause recognition issues
  'mei': ['may', 'mae'],
  'may': ['mei', 'mae'],
  'mae': ['may', 'mei'],
  'lee': ['li', 'leigh'],
  'li': ['lee', 'leigh'],
  'leigh': ['lee', 'li'],
  'chen': ['chin', 'chan'],
  'juan': ['wan', 'won'],
  'nguyen': ['win', 'when'],
  'liu': ['lou', 'loo'],
  'wong': ['wang'],
  'zhao': ['chow', 'chou'],
  'xu': ['shoe', 'shoo'],
  'wu': ['woo'],
  
  // Common English homophones
  'would': ['wood'],
  'wood': ['would'],
  'their': ['there', "they're"],
  'there': ['their', "they're"],
  "they're": ['their', 'there'],
  'to': ['too', 'two'],
  'too': ['to', 'two'],
  'two': ['to', 'too'],
  'sea': ['see'],
  'see': ['sea'],
  'blue': ['blew'],
  'blew': ['blue'],
  'red': ['read'],
  'read': ['red'],
  'write': ['right', 'rite'],
  'right': ['write', 'rite'],
  'rite': ['right', 'write'],
  'where': ['wear', 'ware'],
  'wear': ['where', 'ware'],
  'ware': ['where', 'wear'],
  'knight': ['night'],
  'night': ['knight'],
  'know': ['no'],
  'no': ['know'],
  'bare': ['bear'],
  'bear': ['bare'],
  'pare': ['pair', 'pear'],
  'pair': ['pare', 'pear'],
  'pear': ['pare', 'pair'],
  'here': ['hear'],
  'hear': ['here'],
  'four': ['for', 'fore'],
  'for': ['four', 'fore'],
  'fore': ['four', 'for'],
  'deer': ['dear'],
  'dear': ['deer'],
  'cell': ['sell'],
  'sell': ['cell'],
  'wait': ['weight'],
  'weight': ['wait'],
  'hole': ['whole'],
  'whole': ['hole']
};

// Helper function for number normalization
function normalizeNumbers(word: string): string[] {
  // Dictionary mapping words to their numerical equivalents
  const wordToNumber: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
    'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
    'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
    'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
    'hundred': '100', 'thousand': '1000', 'million': '1000000'
  };

  // Dictionary mapping numbers to their word equivalents
  const numberToWord: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen',
    '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
    '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty',
    '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety',
    '100': 'hundred', '1000': 'thousand', '1000000': 'million'
  };

  // Remove any punctuation and convert to lowercase
  const normalizedWord = word.toLowerCase().replace(/[.,!?]$/, '');
  
  // Check if the word is a number word
  if (wordToNumber[normalizedWord]) {
    return [normalizedWord, wordToNumber[normalizedWord]];
  }
  
  // Check if the word is a digit
  if (/^\d+$/.test(normalizedWord) && numberToWord[normalizedWord]) {
    return [normalizedWord, numberToWord[normalizedWord]];
  }
  
  // If it's neither, just return the original word
  return [normalizedWord];
}
// Get all possible homophone variants of a word - now with proper name support
function getHomophones(word: string): string[] {
  // Preserve capitalization for later check
  const originalWord = word.replace(/[.,!?]$/, '');
  
  // Normalize to lowercase for dictionary lookup
  const normalizedWord = originalWord.toLowerCase();
  
  // Check if the word has special capitalization pattern (like a proper name)
  const isProperName = /^[A-Z][a-z]+$/.test(originalWord);
  const result: string[] = [normalizedWord];
  
  if (isProperName) {
    console.log(`Detected proper name: "${originalWord}"`);
    // Add additional lowercase version for proper name matching
    if (!result.includes(originalWord.toLowerCase())) {
      result.push(originalWord.toLowerCase());
    }
  }
  
  // Check if we have this word in our homophone dictionary
  if (HOMOPHONES[normalizedWord]) {
    result.push(...HOMOPHONES[normalizedWord]);
  }
  
  // Check if this word is a homophone variant of another word
  for (const [mainWord, variants] of Object.entries(HOMOPHONES)) {
    if (variants.includes(normalizedWord)) {
      // Add the main word and other variants if not already added
      if (!result.includes(mainWord)) {
        result.push(mainWord);
      }
      
      variants.forEach(variant => {
        if (variant !== normalizedWord && !result.includes(variant)) {
          result.push(variant);
        }
      });
      
      break; // Exit after finding first match
    }
  }
  
  // If the result only has the normalized word, just return that
  if (result.length === 1) {
    return result;
  }
  
  // Log all forms for debugging
  console.log(`Homophone forms for "${originalWord}":`, result);
  return result;
}

// Compare two words, handling special cases for better matching
// Sound-alike checking specifically for common pronunciation patterns
function soundsLike(word1: string, word2: string): boolean {
  // Common sound pattern replacements to check
  const commonPairs = [
    ['would', 'wood'],
    ['hear', 'here'],
    ['there', 'their'],
    ['to', 'too'],
    ['for', 'four'],
    ['by', 'buy'],
    ['wear', 'where'],
    ['new', 'knew'],
    ['blue', 'blew'],
    ['hole', 'whole'],
    ['wait', 'weight'],
    ['made', 'maid'],
    ['sun', 'son'],
    ['our', 'hour'],
    ['sea', 'see'],
    ['write', 'right'],
    ['no', 'know'],
    ['two', 'too'],
    ['your', 'you\'re'],
    ['knight', 'night'],
    ['so', 'sew']
  ];
  
  // Convert both words to lowercase for comparison
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  // Check direct pairs
  for (const [word1, word2] of commonPairs) {
    if ((w1 === word1 && w2 === word2) || (w1 === word2 && w2 === word1)) {
      console.log(`Sound pattern match: "${w1}" sounds like "${w2}"`);
      return true;
    }
  }
  
  return false;
}

function compareWordsLocally(word1: string, word2: string): number {
  // Normalize both words
  const normalizedWord1 = word1.toLowerCase().replace(/[.,!?]$/, '');
  const normalizedWord2 = word2.toLowerCase().replace(/[.,!?]$/, '');
  
  // Direct match after normalization
  if (normalizedWord1 === normalizedWord2) {
    return 1.0;
  }
  
  // Check for specific sound-alike patterns (especially for would/wood)
  if (soundsLike(normalizedWord1, normalizedWord2)) {
    return 1.0;
  }
  
  // Check for homophone matches (e.g., "Mei" vs "may")
  const word1Homophones = getHomophones(normalizedWord1);
  const word2Homophones = getHomophones(normalizedWord2);
  
  // Check for homophone matches first
  for (const form1 of word1Homophones) {
    for (const form2 of word2Homophones) {
      if (form1 === form2) {
        console.log(`Homophone match found: "${normalizedWord1}" sounds like "${normalizedWord2}"`);
        return 1.0; // Perfect match between homophones
      }
    }
  }
  
  // Check for numerical equivalence (e.g., "seven" vs "7")
  const word1Forms = normalizeNumbers(normalizedWord1);
  const word2Forms = normalizeNumbers(normalizedWord2);
  
  // Check if any form of word1 matches any form of word2
  for (const form1 of word1Forms) {
    for (const form2 of word2Forms) {
      if (form1 === form2) {
        console.log(`Number form match found: "${normalizedWord1}" equals "${normalizedWord2}"`);
        return 1.0; // Perfect match between normalized forms
      }
    }
  }
  
  // Simple pluralization check (remove trailing 's')
  if (normalizedWord1.endsWith('s') && normalizedWord1.slice(0, -1) === normalizedWord2) {
    return 0.9;
  }
  if (normalizedWord2.endsWith('s') && normalizedWord2.slice(0, -1) === normalizedWord1) {
    return 0.9;
  }
  
  // Possessive check (apostrophe s)
  if (normalizedWord1.endsWith("'s") && normalizedWord1.slice(0, -2) === normalizedWord2) {
    return 0.9;
  }
  if (normalizedWord2.endsWith("'s") && normalizedWord2.slice(0, -2) === normalizedWord1) {
    return 0.9;
  }
  
  // Calculate Levenshtein distance for minor typos/misspellings
  // (This is a simplified version - in production, you'd want a more efficient algorithm)
  let distance = 0;
  const maxLen = Math.max(normalizedWord1.length, normalizedWord2.length);
  
  for (let i = 0; i < Math.min(normalizedWord1.length, normalizedWord2.length); i++) {
    if (normalizedWord1[i] !== normalizedWord2[i]) {
      distance++;
    }
  }
  
  // Account for difference in length
  distance += Math.abs(normalizedWord1.length - normalizedWord2.length);
  
  // Convert distance to similarity score
  if (maxLen === 0) return 1.0;
  const similarityFromDistance = 1 - (distance / maxLen);
  
  return Math.max(0, similarityFromDistance);
}

// Helper function to clean up repeated words in speech recognition
function cleanRepeatedWords(input: string): string {
  // Check if the input has multiple words
  const words = input.split(/\s+/);
  if (words.length <= 1) return input;
  
  // Process words to remove adjacent duplicates
  const cleanedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    // Only add if this word isn't the same as the previous one
    if (i === 0 || words[i].toLowerCase() !== words[i-1].toLowerCase()) {
      cleanedWords.push(words[i]);
    }
  }
  
  return cleanedWords.join(' ');
}

export async function compareWords(userWord: string, targetWord: string): Promise<number> {
  try {
    // Clean up any repeated words in the user input
    const cleanedUserWord = cleanRepeatedWords(userWord);
    
    if (cleanedUserWord !== userWord) {
      console.log(`Cleaned repeated words: "${userWord}" → "${cleanedUserWord}"`);
    }
    
    // Special handling for "would" and "wood" pair
    const word1Lower = cleanedUserWord.toLowerCase();
    const word2Lower = targetWord.toLowerCase();
    
    if ((word1Lower === "would" && word2Lower === "wood") || 
        (word1Lower === "wood" && word2Lower === "would")) {
      console.log(`Special case match: "${cleanedUserWord}" sounds like "${targetWord}"`);
      return 1.0;
    }
    
    // First, try local comparison with number normalization
    const localSimilarity = compareWordsLocally(cleanedUserWord, targetWord);
    
    // If we're very confident in the local match, return it immediately
    if (localSimilarity >= 0.9) {
      console.log(`Local comparison gave high confidence match (${localSimilarity}) between "${cleanedUserWord}" and "${targetWord}"`);
      return localSimilarity;
    }
    
    // For less certain matches, consult the Gemini API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

    const prompt = {
      contents: [{
        parts: [{
          text: `You are an advanced reading assistant helping children learn to read. 
          
          Compare these two words and determine if they match semantically (meaning they're the same word, accounting for potential misspellings, plurals, or slight variations).
          Pay special attention to number words that may be written in different formats (e.g., "seven" vs "7").

          User's spoken word: "${cleanedUserWord}"
          Target word in the text: "${targetWord}"
          
          Return only a similarity score between 0 and 1, where:
          - 1 means they're the same word or extremely close variations
          - 0.9 means they're the same word with minor variations (like plurals or slight misspellings)
          - 0.7-0.8 means they're semantically related or similar words
          - 0.5-0.6 means they're somewhat related 
          - 0-0.4 means they're completely different words
          
          Output only the numerical score, nothing else.`
        }]
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return localSimilarity; // Fall back to local similarity on API error
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    
    // Parse the similarity score from the response
    // We expect just a number, but handle potential formatting
    const score = parseFloat(content);
    
    if (isNaN(score) || score < 0 || score > 1) {
      console.warn("Invalid similarity score from API:", content);
      return localSimilarity; // Fall back to local similarity on invalid response
    }
    
    // Return the maximum of the local and API similarity scores
    const finalScore = Math.max(localSimilarity, score);
    console.log(`Final similarity score: ${finalScore} (local: ${localSimilarity}, API: ${score})`);
    return finalScore;
  } catch (error) {
    console.error('Error comparing words:', error);
    // Fall back to local similarity score on error
    return compareWordsLocally(userWord, targetWord);
  }
}

export interface PhonemeMapping {
  ipa: string;      // IPA phoneme
  display: string;  // English letter representation
}

export async function getPhonemesBreakdown(text: string): Promise<Record<string, PhonemeMapping[]>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;
  
  const prompt = {
    contents: [{
      parts: [{
        text: `You are a language expert helping children learn to read using International Phonetic Alphabet (IPA).
        
        I'll provide a story text. Break down each word into letters and their corresponding IPA phonemes.
        
        Story text: "${text}"
        
        Return a JSON object where:
        - Each key is a word from the text (lowercase, without punctuation)
        - Each value is an array of objects, with each object containing:
          - "ipa": the IPA phoneme for that part of the word
          - "display": the corresponding English letter(s) from the original word
        
        USE THESE EXACT IPA SYMBOLS:
        Vowels: i (ee in feet), ɪ (i in bit), e (e in bed), æ (a in cat), ɑ (a in father), 
               ɒ (o in lot), ɔ (aw in caught), ʊ (oo in foot), u (oo in food), 
               ʌ (u in cut), ɜ (ur in bird), ə (a in about)
        
        Diphthongs: eɪ (ay in day), aɪ (i in price), ɔɪ (oy in boy), aʊ (ow in cow), 
                   oʊ (o in go), ɪə (ear in near), eə (air in square), ʊə (ure in cure)
        
        Consonants: p, b, t, d, k, ɡ, tʃ (ch in chair), dʒ (j in joy), 
                   f, v, θ (th in thin), ð (th in this), s, z, ʃ (sh in ship), 
                   ʒ (s in measure), h, m, n, ŋ (ng in sing), l, ɹ (r in red), 
                   j (y in yes), w
        
        IMPORTANT: For the letter "e" in words like "went", "send", "get", "tell", use the short "i" sound (ɪ) as in "sit" rather than the "e" sound.
        
        Examples:
        - "seat" would be [{"ipa": "s", "display": "s"}, {"ipa": "i", "display": "ea"}, {"ipa": "t", "display": "t"}]
        - "loved" would be [{"ipa": "l", "display": "l"}, {"ipa": "ʌ", "display": "o"}, {"ipa": "v", "display": "v"}, {"ipa": "d", "display": "ed"}]
        - "Lily" would be [{"ipa": "l", "display": "L"}, {"ipa": "ɪ", "display": "i"}, {"ipa": "l", "display": "l"}, {"ipa": "i", "display": "y"}]
        - "hello" would be [{"ipa": "h", "display": "h"}, {"ipa": "ə", "display": "e"}, {"ipa": "l", "display": "l"}, {"ipa": "oʊ", "display": "lo"}]
        - "the" would be [{"ipa": "ð", "display": "th"}, {"ipa": "ə", "display": "e"}]
        - "went" would be [{"ipa": "w", "display": "w"}, {"ipa": "ɪ", "display": "e"}, {"ipa": "n", "display": "n"}, {"ipa": "t", "display": "t"}]
        
        The "display" field should always contain the original English letter(s) from the word that make that sound.
        Do not add any extra characters to the phonemes.
        Make sure the "display" fields when combined exactly match the original word.
        
        Ensure the format is exactly a JSON object without any additional text.`
      }]
    }]
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      console.error(`Error from Gemini API: ${response.status} ${response.statusText}`);
      // Return empty object if API fails
      return {};
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    
    try {
      // Try to extract JSON from the response
      let jsonString = '';
      let openBraces = 0;
      let started = false;

      // Manual parsing to extract the JSON object, accounting for multiline responses
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
          started = true;
          openBraces++;
        }
        
        if (started) {
          jsonString += content[i];
        }
        
        if (content[i] === '}') {
          openBraces--;
          if (openBraces === 0 && started) {
            break;
          }
        }
      }
      
      // If we found a JSON string, parse it
      if (jsonString) {
        return JSON.parse(jsonString);
      } else {
        // If no JSON object found, try to find it in the text
        const cleanedContent = content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedContent);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response was:', content);
      // Return empty object if parsing fails
      return {};
    }
  } catch (error) {
    console.error('Error getting phonemes breakdown:', error);
    // Return empty object if anything fails
    return {};
  }
}

export async function smartWordGrouping(text: string): Promise<string[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `You are a reading assistant helping young children learn to read. 
        Given the following text, break it down into an array of word groups that make sense to be read together.
        
        CRITICAL GROUPING RULES - MUST FOLLOW ALL OF THESE:
        1. Always group articles (a, an, the) with the nouns they modify. Never leave "a", "an", or "the" as standalone units.
        2. Group all compound words together (e.g., "kung fu", "ice cream", "New York").
        3. Group all stop words with their following word (e.g., "in the", "of a", "to be").
        4. Keep all proper names together (e.g., "Mei Lin", "Santa Claus").
        5. Group adjectives with their nouns (e.g., "big dog", "happy child").
        6. Keep idiomatic expressions and common phrases together.
        7. Group numbers with their units (e.g., "10 feet", "5 minutes").
        8. Group prepositions with their objects when possible.
        9. IMPORTANT: Preserve all punctuation marks (periods, commas, etc.) at the end of words or phrases.
        
        Input text: "${text}"
        
        Output format: Return a JSON array of strings, where each string is a word or group of words that should be read together.
        Example output format: ["Once upon", "a time", "there was", "a little", "girl", "named", "Mei Lin."]
        
        IMPORTANT: Check your output to ensure NO articles (a, an, the) are left as standalone entries.
        IMPORTANT: Make sure to keep all punctuation marks (periods, commas, etc.) at the end of words or phrases.`
      }]
    }]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      console.error(`Error from Gemini API: ${response.status} ${response.statusText}`);
      // Fallback: just split by spaces if API fails
      return text.split(/\s+/);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    
    let wordGroups: string[];
    
    try {
      // Try to parse the JSON array from the response
      // The response might be wrapped in backticks or have extra text
      // Try to extract JSON from the response, handling multiline content
      let jsonString = '';
      let openBrackets = 0;
      let started = false;

      // Manual parsing of the JSON array to handle multiline content
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '[') {
          started = true;
          openBrackets++;
        }
        
        if (started) {
          jsonString += content[i];
        }
        
        if (content[i] === ']') {
          openBrackets--;
          if (openBrackets === 0 && started) {
            break;
          }
        }
      }

      // If we found a JSON string, parse it
      if (jsonString) {
        wordGroups = JSON.parse(jsonString);
      } else {
        // If no JSON array found, try to find the array in the text
        const cleanedContent = content.replace(/```json|```/g, '').trim();
        wordGroups = JSON.parse(cleanedContent);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response was:', content);
      // Fallback to simple splitting if parsing fails
      return text.split(/\s+/);
    }

    console.log('Smart word grouping result:', wordGroups);
    return wordGroups;
  } catch (error) {
    console.error('Error in smart word grouping:', error);
    // Fallback: just split by spaces if anything fails
    return text.split(/\s+/);
  }
}

export async function generateStory(topic: string): Promise<{content: string, words: string[]}> {
  // Validate topic first
  if (containsSensitiveContent(topic)) {
    throw new Error("Sorry, this topic contains sensitive content. Please try a different topic.");
  }

  if (containsForbiddenContent(topic)) {
    throw new Error("Sorry, this topic contains inappropriate content. Please try a different topic.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const prompt = {
    contents: [{
      parts: [{
        text: `Write a very short, simple and engaging story (2-3 sentences) about ${topic} for a young child learning to read. 
        Use simple words and basic sentence structure.
        Make sure to use periods at the end of each sentence.
        The story should be engaging but easy to understand.
        Do not include any religious, political, or controversial content.
        Keep the content appropriate for young children.`
      }]
    }]
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();

    // Double check the generated content
    if (containsSensitiveContent(content)) {
      throw new Error("Generated content contains sensitive topics. Please try again with a different topic.");
    }

    if (containsForbiddenContent(content)) {
      throw new Error("Generated content contains inappropriate content. Please try again with a different topic.");
    }

    // Use smart word grouping to get a better word array with compound words
    let words: string[];
    
    try {
      // First try the smart AI-based word grouping
      console.log('Using smart word grouping for story...');
      words = await smartWordGrouping(content);
      console.log('Smart grouping successful, produced groups:', words);
    } catch (groupingError) {
      console.error('Smart grouping failed, falling back to simple split:', groupingError);
      // Fallback: Split into words, keeping punctuation attached to words
      words = content.match(/[\w']+(?:[.,!?])?/g) || [];
    }

    console.log('Generated story content:', { content, wordCount: words.length });

    return {
      content,
      words
    };
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
}