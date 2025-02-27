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

// Get all possible homophone variants of a word
function getHomophones(word: string): string[] {
  const normalizedWord = word.toLowerCase().replace(/[.,!?]$/, '');
  
  // Check if we have this word in our homophone dictionary
  if (HOMOPHONES[normalizedWord]) {
    return [normalizedWord, ...HOMOPHONES[normalizedWord]];
  }
  
  // Check if this word is a homophone variant of another word
  for (const [mainWord, variants] of Object.entries(HOMOPHONES)) {
    if (variants.includes(normalizedWord)) {
      return [normalizedWord, mainWord, ...variants.filter(v => v !== normalizedWord)];
    }
  }
  
  // If no homophones found, return just the original word
  return [normalizedWord];
}

// Compare two words, handling special cases for better matching
function compareWordsLocally(word1: string, word2: string): number {
  // Normalize both words
  const normalizedWord1 = word1.toLowerCase().replace(/[.,!?]$/, '');
  const normalizedWord2 = word2.toLowerCase().replace(/[.,!?]$/, '');
  
  // Direct match after normalization
  if (normalizedWord1 === normalizedWord2) {
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

export async function compareWords(userWord: string, targetWord: string): Promise<number> {
  try {
    // First, try local comparison with number normalization
    const localSimilarity = compareWordsLocally(userWord, targetWord);
    
    // If we're very confident in the local match, return it immediately
    if (localSimilarity >= 0.9) {
      console.log(`Local comparison gave high confidence match (${localSimilarity}) between "${userWord}" and "${targetWord}"`);
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

          User's spoken word: "${userWord}"
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
        text: `Write a very short, simple story (2-3 sentences) about ${topic} for a young child learning to read. 
        Use simple words and basic sentence structure.
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

    // Split into words, keeping punctuation attached to words
    const words = content.match(/[\w']+(?:[.,!?])?/g) || [];

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