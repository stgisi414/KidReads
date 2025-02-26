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