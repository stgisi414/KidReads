import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useElevenLabs } from "@/hooks/use-elevenlabs";
import { useGoogleTTS } from "@/hooks/use-google-tts";
import type { Story } from "@shared/schema";
import { Share2, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import lessonCompleteSound from "../assets/lesson_complete.mp3";
import Cookies from 'js-cookie';
import './StoryPlayer.css';

// List of forbidden words and topics for content filtering
const FORBIDDEN_WORDS = [
  // ========================= Violence/Death =========================
  // --- Weapons ---
  'kill', 'killed', 'killing', 'kills',
  'shoot', 'shot', 'shooting', 'shoots',
  'stab', 'stabbed', 'stabbing', 'stabs',
  'gun', 'guns',
  'weapon', 'weapons',
  'knife', 'knives',
  'glock', 'ruger',
  'bullet', 'ammo',
  'ammunition', 'bazooka', 'rocket launcher', 'sword', 
  // Specific gun brands
  'm4', 'm16', 'm24', 'm249', 'm4a1', 'm4a1s', 'm4a1u', 'm4a1m', // Specific weapon types
  'ak47', 'ak47u', 'ak47m', 'ak47s', 'ak47m', // Specific weapon types
  'pistol', 'rifle',
  'grenade', 'bomb', 'bombs', 'bombing', 'missile', 'artillery', 'cannon', 'tank', 'machine gun', 'shotgun', 'sniper rifle',

  // --- Violent Acts ---
  'die', 'died', 'dying', 'death', 'dead',
  'murder', 'murdered', 'murdering', 'murders',
  'war', 'fight', 'fighting', 'fights',
  'attack', 'attacked', 'attacking', 'attacks',
  'assault', 'assaulted', 'assaulting', 'assaults',
  'slay', 'slew', 'slaying', 'slain',
  'massacre', 'massacred', 'massacring', 'massacres',
  'slaughter', 'slaughtered', 'slaughtering', 'slaughters',
  'execute', 'executed', 'executing', 'execution', 'executions',
  'assassinate', 'assassinated', 'assassinating', 'assassination',
  'homicide', 'suicide',
  'explode', 'exploded', 'exploding', 'explosion', 'explosions',

  // --- More Violent Verbs ---
  'mutilate', 'torture', 'dismember', 'behead', 'lynch', 'strangle', 'suffocate', 'drown', 'immolate', 'poison', 'terrorize', 'kidnap', 'hold hostage',
  'rape', 'raped', 'raping', 'rapist', // Although also in sex, violence context is important
  'abuse', 'abused', 'abusing', 'abuser', // General abuse, can be violent

  // --- Types of Abuse/Violence ---
  'domestic abuse', 'child abuse', 'torture', 'lynching', 'beheading', 'mutilation', 'dismemberment', 'cannibalism', 'genocide', 'ethnic cleansing', 'strangulation', 'suffocation', 'drowning', 'immolation', 'poisoning', 'terrorism', 'hostage taking', 'kidnapping',

  // ========================= Satanic/Demonic =========================
  'devil', 'demon', 'satan', 'hell', 'lucifer', 'beezlebub', 'beelzebub', // Misspellings included for broader coverage
  'demonize', 'demonic', 'satanic', 'satanism', 'occult', 'damnation', 'infernal',
  'belial', 'asmodeus', 'leviathan', 'abaddon', 'baal', 'moloch', // More demon names
  'aghori', 'voodoo', 'witchcraft', 'black magic', 'dark arts', 'necromancy', 'séance', 'ouija', 'tarot', // Related practices - context matters, but often problematic
  'blasphemy', 'sacrilege', 'desecration', 'heresy', 'pact with devil', 'soul selling', 'cursing', 'hexing', // Related concepts

  // ========================= Body Parts/Bodily Functions (Explicit/Vulgar) =========================
  // --- Explicit Sexual Terms ---
  'pussy', 'vagina', 'penis', 'dick', 'cock',
  'ass', 'anus', 'rectum', 'testicles',
  'breasts', 'tits', 'titties',
  'asshole', 'butthole',
  'cum', 'jizz', 'semen', 'ejaculate', 'ejaculation',
  'clitoris', 'labia', 'prostate', 'scrotum', 'cunt',
  'scat', 'watersports', 'golden shower', 'fisting', 'analingus', 'fellatio', 'cunnilingus', 'poonanny', 'vulva', 'vulvar', 'vulvate', 'vulvature', 'vulvatured', 'vulvatureing', 'vulvatured',

  // --- Bodily Fluids/Excrement ---
  'blood', 'gore', 'bloody', 'gory', 'guts', 'viscera', 'entrails', 'marrow', 'pus', 'gangrene', 'sepsis', 'maggots', 'rot', 'decay', 'decompose', 'putrefy', 'cadaver', 'corpse', 'skeleton', 'skull', 'bones', 'innards', 'excrement', 'feces', 'vomit', 'mucus', 'phlegm', 'snot', 'bile', 'puke', 'poop', 'shit', 'shitty', 'shitty', 'shitty', 'shit', 'pee', 'peepee', 'peepee', 'peepee',

  // --- Derogatory Body Descriptions (Context Dependent - Use with Caution) ---
  'fat', 'obese', 'skinny', 'anorexic', 'bulimic', 'ugly', 'hideous', 'disgusting' /*when referring to appearance*/, 'deformed', 'crippled', 'handicapped', //  Context is crucial; these can be used clinically or descriptively, but also hurtfully. Disability slurs in Hate section are more direct.

  // ========================= Hate/Discrimination =========================
  'hate', 'hated', 'hating', 'hates', 'racist', 'racism', 'nazi', 'fascist', 'bigot', 'bigotry', 'supremacist', 'supremacy', 'discrimination', 'discriminatory', 'segregation', 'genocide', 'ethnic cleansing', 'holocaust', 'dehumanization', 'othering', 'demonization of groups', 'scapegoating',

  // --- Slurs (Racial/Ethnic) ---
  'nigger', 'nigga', 'chink', 'gook', 'wetback', 'spic', 'kike',
  'coon', 'coons', 'jap', 'japs', 'raghead', 'sand nigger', 'beaner', 'cracker', 'honky', 'oreo', 'uncle tom', 'yellow peril',

  // --- Slurs (LGBTQ+) ---
  'faggot', 'dyke', 'tranny', 'trannie', // and misspellings
  'queer', /*Reclaimed, but still used as slur*/ 'homo', 'lezbo', 'shemale', 'it' /*dehumanizing for trans people*/, 'shim', 'fruit', 'nancy boy', 'bulldyke',

  // --- Slurs (Ableist) ---
  'retarded', 'retard', 'crip', 'cripple', 'spaz', 'mongo', 'mongoloid', 'derp', 'idiot', 'moron', 'imbecile', 'feeble-minded',

  // --- Slurs (Religious) ---
  'christ killer', 'mick', 'hymie', 'raghead', 'towelhead',

  // --- Slurs (Sexist/Misogynistic) ---
  'slut', 'whore', 'bimbo', 'airhead', 'drama queen', 'hysterical', 'nagging', 'battleaxe', 'ballbreaker', 'castrating bitch', 'gold digger', 'man-hater', 'feminazi',

  // --- Slurs (Xenophobic/Anti-Immigrant) ---
  'foreigner', 'alien', 'illegal alien', 'anchor baby', 'go back to where you came from', 'invader', 'infestation', 'swarm', 'vermin',

  // --- Types of Discrimination ---
  'ageism', 'sexism', 'homophobia', 'transphobia', 'xenophobia', 'antisemitism', 'islamophobia', 'ableism', 'misogyny', 'misandry', 'classism', 'lookism', 'colorism', 'casteism',

  // ========================= Sex/Sexual Acts (Explicit/Graphic) =========================
  'sex', 'fuck', 'fucked', 'fucking', 'fucker', 'motherfucker',
  'blowjob', 'handjob', 'rimjob', 'rimming', 'pegging',
  'screwing', 'rape', 'raped', 'raping', 'rapist', 'molest', 'molested', 'molesting', 'molester', 'pedophile', 'pedophilia', 'incest', 'bestiality', 'orgy', 'threesome', 'gangbang',
  'porn', 'pornography', 'pornographic',
  'masturbation', 'orgasm', 'come shot', 'horny', 'horndog', 'randy', 'lustful', 'lascivious', 'promiscuous', 'unchaste',
  'bdsm', 'bondage', 'domination', 'submission', 'sadism', 'masochism', 'rape culture', 'victim blaming' /*in rape context*/, 'slut shaming', 'whore shaming', 'body count' /*sexual context*/, 'cuckold', 'voyeurism', 'exhibitionism', 'fetish',

  // ========================= Drugs/Alcohol =========================
  'drug', 'drugs', 'alcohol', 'drunk', 'intoxicated',
  'cocaine', 'heroin', 'marijuana', 'weed', 'meth', 'methamphetamine', 'crack', 'lsd', 'ecstasy', 'mdma', 'opioids', 'amphetamine', 'narcotics',
  'high', 'stoned', 'wasted', 'plastered', 'hammered', 'booze',
  'peyote', 'ayahuasca', 'psilocybin', 'ketamine', 'ghb', 'pcp', 'spice', 'k2', 'bath salts', 'lean', 'purple drank', 'oxycodone', 'fentanyl', 'xanax', 'valium', 'adderall', 'ritalin', 'nicotine', 'tobacco', 'cigarettes', 'vape', 'e-cigarette', 'hookah', 'shisha', 'opium', 'hashish', 'crack cocaine', 'crystal meth', 'speed', 'uppers', 'downers', 'benzos', 'stimulants', 'depressants', 'hallucinogens', 'psychedelics', 'inhalants', 'nitrous oxide', 'glue sniffing', 'huffing', 'poppers',
  'addict', 'addiction', 'alcoholic', 'drug abuse', 'drug dependency', 'overdose', 'rehab', 'detox', 'withdrawal', 'sober', 'sobering', 'relapse',

  // ========================= Swearing/Cursing =========================
  'damn', 'bitch', 'bastard', 'shit', 'shitty', 'bullshit', 'goddamn', 'hell', /*if not already in satanic section*/ 'asshole', 'piss', 'crap',
  'bloody', 'bugger', 'git', 'wanker', 'twat', 'arse', 'bollocks', 'minge', 'knobhead', 'bellend', 'prick', 'scumbag', 'douchebag', 'motherfucker', 'son of a bitch', 'damn it', 'to hell with', 'go to hell', 'in hell', 'what the hell', 'hell no', 'hell yes', 'oh hell', 'for the hell of it', 'like hell', 'holy shit', 'son of a gun', 'dadgum', 'doggone', 'gee whiz', 'gosh darn', 'shoot', /*mild curse*/ 'dang', 'confounded', 'plague take it', 'pox on it', 'rot in hell', 'burn in hell',

  // ========================= Other Potentially Problematic Words =========================
  'gore', 'gory', 'suicidal', 'suicide', 'self-harm', 'self-mutilation', 'cut myself', 'slit wrists', 'overdose myself', 'hang myself', 'shoot myself', 'end my life', 'take my life', 'jump off a building', 'step in front of a train', 'pills', 'razor blades', 'noose', 'gun to my head', 'poison myself', 'drown myself', 'burn myself', 'starve myself', 'depressed' /*suicide context*/, 'hopeless', 'worthless', 'life is meaningless', 'i want to die', 'i wish i were dead', 'i can\'t go on', 'i\'m done with life', 'goodbye world', 'farewell cruel world', 'i\'m checking out', 'signing off', 'i\'m out of here',
  'groomer', 'grooming', 'predator', 'pimp', 'lure', 'entice', 'manipulate' /*grooming context*/, 'coerce' /*grooming context*/, 'undermine' /*grooming context*/, 'isolate' /*grooming context*/, 'secret' /*grooming context*/, 'promise' /*grooming context*/, 'gift' /*grooming context*/, 'attention' /*grooming context*/, 'special' /*grooming context*/, 'trust' /*grooming context*/, 'confide' /*grooming context*/, 'alone time', 'one-on-one', 'private', 'bedroom', 'sleepover', 'vacation', 'trip', 'getaway', 'hotel room', 'motel', 'cabin', 'camping', 'road trip', 'out of town', 'away from parents', 'just us', 'no adults', 'no supervision', 'don\'t tell', 'keep it secret', 'our little secret', 'promise me you won\'t tell', 'this is just between us', 'nobody needs to know', 'it\'s our special secret', 'we\'ll keep it quiet', 'zip your lips', 'mum\'s the word', 'don\'t breathe a word', 'not a peep', 'hush hush', 'quiet down', 'keep it under wraps', 'off the record', 'between you and me', 'just you and i', 'nobody else', 'just us two', 'private matter', 'personal business', 'confidential', 'classified', 'hush-hush', 'cloak and dagger', 'secretive', 'furtive', 'covert', 'undercover', 'clandestine', 'surreptitious', 'stealthy', 'sneak',

  // ========================= Misinformation/Harmful Content =========================
  'hoax', 'fake news', 'disinformation', 'misinformation', 'conspiracy', 'propaganda',

  // --- Conspiracy Theories ---
  'vaccine hoax', 'vaccine causes autism', 'vaccine conspiracy', 'anti-vax', // Vaccines
  'flat earth', // Flat Earth
  'illuminati', 'new world order', 'reptilian overlords', 'lizard people', 'deep state', 'qanon', // General Conspiracy
  'chemtrails', // Chemtrails
  'birtherism', // Birtherism
  'moon landing hoax', 'faked moon landing', // Moon Landing
  '9/11 truthers', 'sandy hook hoax', // Tragedy denial
  'weather manipulation', 'HAARP conspiracy', // Weather/Tech Conspiracy
  'secret societies', 'shadow government', 'globalist agenda', // Secret government
  'climate change hoax', // Climate denial
  'stolen election', 'election fraud', 'rigged election', 'voter fraud', // Election conspiracies
  'plandemic', 'scamdemic', 'covid hoax', 'virus hoax', 'germ theory hoax', 'big pharma conspiracy', // Covid conspiracies

  // --- Pseudoscience/Quackery ---
  'miracle cure', 'snake oil', 'cure-all', 'false cure', 'unproven treatment', 'pseudoscience', 'astrology', 'numerology', 'crystal healing', 'homeopathy', 'iridology', 'reflexology', 'faith healing', 'energy healing', 'reiki', 'chakra healing', 'aura reading', 'past life regression',

  // --- Fringe/Unproven Beliefs ---
  'alien abduction', 'ufology', 'ancient aliens', 'atlantis', 'lemuria', 'nibiru', 'mayan calendar 2012', 'crop circles', 'psychic powers', 'telepathy', 'clairvoyance', 'precognition', 'telekinesis', 'remote viewing', 'ghost hunting', 'spirit communication', 'séance', 'ouija board', 'tarot reading', 'palmistry', 'fortune telling', 'cold reading', 'hot reading', 'mind reading', 'hypnosis', 'subliminal messaging', 'brainwashing', 'mind control', 'deprogramming',

  // --- Harmful Groups/Ideologies (Already covered somewhat, but reiterate for clarity) ---
  'cults', 'religious extremism', 'hate groups', 'white supremacy', 'neo-nazism', 'kkk', 'hate speech', 'violence', 'terrorism', 'extremism', 'radicalization', 'indoctrination', 'brainwashing', 'thought control', 'groupthink',

  // --- Logical Fallacies/Misleading Tactics (Used in harmful content) ---
  'echo chamber', 'filter bubble', 'confirmation bias', 'cognitive dissonance', 'misleading statistics', 'cherry picking data', 'false balance', 'appeal to authority', 'appeal to emotion', 'straw man argument', 'ad hominem attack', 'slippery slope fallacy', 'bandwagon fallacy', 'false dilemma', 'red herring', 'poisoning the well', 'burden of proof fallacy', 'argument from ignorance', 'appeal to nature fallacy', 'anecdotal evidence', 'personal testimony', 'hearsay', 'rumor', 'urban legend', 'myth', 'folklore', 'superstition',

  // --- Questionable Sources/Journalism ---
  'junk science', 'bad science', 'fake science', 'biased source', 'unreliable source', 'questionable source', 'dubious source', 'disreputable source', 'sensationalism', 'clickbait', 'yellow journalism', 'tabloid journalism', 'infotainment', 'edutainment',

  // --- Financial Scams/Misinformation ---
  'get rich quick scheme', 'pyramid scheme', 'ponzi scheme', 'multi-level marketing', 'mlm', 'network marketing', 'direct selling', 'affinity fraud', 'romance scam', 'online dating scam', 'nigerian prince scam', 'lottery scam', 'inheritance scam', 'tax scam', 'irs scam', 'tech support scam', 'grandparent scam', 'emergency scam', 'disaster relief scam', 'charity scam', 'investment scam', 'cryptocurrency scam', 'nft scam', 'rug pull', 'pump and dump', 'phishing scam', 'vishing scam', 'smishing scam', 'bait and switch', 'false advertising', 'misleading advertising', 'deceptive advertising', 'greenwashing', 'pinkwashing', 'bluewashing', 'astroturfing', 'sockpuppeting', 'shilling', 'paid endorsement', 'sponsored content', 'native advertising', 'advertorial', 'infomercial', 'direct response advertising', 'hard sell', 'high pressure sales tactics', 'bait and hook', 'loss leader', 'upselling', 'cross-selling', 'bundling', 'discount scam', 'clearance scam', 'going out of business sale scam', 'liquidation sale scam', 'limited time offer scam', 'urgency scam', 'scarcity scam', 'fear mongering', 'panic buying', 'price gouging', 'price fixing', 'market manipulation', 'insider trading', 'front running', 'wash trading', 'spoofing', 'layering', 'market timing', 'technical analysis', 'fundamental analysis', 'day trading', 'swing trading', 'margin trading', 'short selling', 'leverage trading', 'options trading', 'futures trading', 'forex trading', 'cryptocurrency trading', 'algorithmic trading', 'high frequency trading', 'dark pools', 'flash crash', 'black swan event', 'systemic risk', 'financial contagion', 'economic collapse', 'market crash', 'stock market bubble', 'housing bubble', 'debt crisis', 'sovereign debt crisis', 'currency crisis', 'banking crisis', 'financial crisis', 'global recession', 'economic depression', 'stagflation', 'hyperinflation', 'deflationary spiral', 'economic inequality', 'wealth gap', 'poverty', 'unemployment', 'inflation', 'interest rates', 'federal reserve', 'central bank', 'monetary policy', 'fiscal policy', 'quantitative easing', 'bailout', 'stimulus package', 'austerity measures', 'debt ceiling', 'national debt', 'government shutdown', 'trade war', 'tariffs', 'sanctions', 'embargo', 'protectionism', 'free trade', 'globalization', 'supply chain disruption', 'inflationary pressures', 'cost of living crisis', 'energy crisis', 'food crisis', 'water crisis', 'climate change', 'global warming', 'environmental degradation', 'pollution', 'deforestation', 'biodiversity loss', 'extinction event', 'pandemics', 'epidemics', 'public health crisis', 'healthcare system collapse', 'hospital overcrowding', 'ventilator shortage', 'ppe shortage',

  // ========================= Health Misinformation/Disinformation =========================
  'medical misinformation', 'health disinformation', 'vaccine hesitancy', 'anti-mask sentiment', 'social distancing fatigue', 'lockdown fatigue',

  // --- Economic/Financial Hardship (Used to incite fear/panic in misinformation contexts) ---
  'economic hardship', 'job losses', 'business closures', 'supply chain bottlenecks', 'inflationary pressures', 'consumer price index', 'producer price index', 'economic recession', 'economic depression',

  // --- Social/Political Unrest (Used to incite fear/panic in misinformation contexts) ---
  'social unrest', 'political instability', 'geopolitical tensions', 'war', 'conflict', 'terrorism', 'cyber warfare', 'information warfare',
];

interface StoryPlayerProps {
  story: Story;
}

const VOICE_OPTIONS = [
  { id: "UGTtbzgh3HObxRjWaSpr", name: "🧑🏾 Knox" },
  { id: "pPdl9cQBQq4p6mRkZy2Z", name: "👩‍🦱 Venna" },
  { id: "dyTPmGzuLaJM15vpN3DS", name: "👦 Titus" }
] as const;

// Mapping from ElevenLabs voice IDs to Google Cloud TTS voice IDs
const ELEVENLABS_TO_GOOGLE_VOICE_MAP: Record<string, string> = {
  "UGTtbzgh3HObxRjWaSpr": "en-US-Neural2-D", // Knox -> Male voice
  "pPdl9cQBQq4p6mRkZy2Z": "en-US-Neural2-F", // Venna -> Female voice
  "dyTPmGzuLaJM15vpN3DS": "en-US-Neural2-A"  // Titus -> Child-like voice
} as const;

// Define stop words that should be grouped with the following word
const STOP_WORDS = new Set([
  // Articles
  'the', 'a', 'an',
  // Prepositions
  'to', 'in', 'on', 'at', 'for', 'by', 'with', 'from', 'of', 'into', 'onto', 'upon', 'within', 'without', 'through', 'between', 'among', 'across', 'behind', 'beside', 'beyond', 'under', 'over', 'after', 'before',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'yet', 'so',
  // Personal Pronouns
  'he', 'she', 'it', 'they', 'we', 'you', 'i',
  // Possessive Pronouns and Adjectives
  'his', 'her', 'their', 'its', 'my', 'your', 'our',
  // Demonstrative Pronouns
  'this', 'that', 'these', 'those',
  // Other connecting words
  'as', 'if', 'when', 'while', 'where', 'how', 'than', 'too',
  //Commonly used adverbs
  'very', 'quite', 'much', 'more', 'less', 'most', 'even',
  //spelled numbers
  'zero', 'one', 'two', 'three', 'four', 'five', 'six',
]);

interface PhonemeObject {
  text: string;
  phonemes: string[];
}

interface WordGroup {
  text: string;
  words: string[];
  startIndex: number;
  // For nested structure in adult mode
  sentences?: Array<{
    text: string;
    words: string[];
  }>;
  // For phoneme mode
  phonemes?: PhonemeObject[];
}

// Check if content contains any forbidden words
const containsForbiddenContent = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => normalizedText.includes(word.toLowerCase()));
};

// Move pure functions outside component
const NUMBER_WORDS: Record<string, string> = {
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
  'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
  'eighteen': '18', 'nineteen': '19', 'twenty': '20'
};

const normalizeNumber = (word: string): string[] => {
  // Remove spaces between letters (e.g. "s e v e n" -> "seven")
  const withoutSpaces = word.toLowerCase().replace(/\s+/g, '').trim();
  let forms = [word, withoutSpaces];

  // If it's a number word, add its digit form
  if (NUMBER_WORDS[withoutSpaces]) {
    forms.push(NUMBER_WORDS[withoutSpaces]);
  }

  // If it's a digit, add its word form
  for (const [wordNum, digit] of Object.entries(NUMBER_WORDS)) {
    if (word === digit || withoutSpaces === digit) {
      forms.push(wordNum);
      break;
    }
  }

  return forms;
};

const calculateWordSimilarity = (word1: string, word2: string): number => {
  const forms1 = normalizeNumber(word1.toLowerCase().trim());
  const forms2 = normalizeNumber(word2.toLowerCase().trim());

  // Try all combinations of normalized forms
  let maxSimilarity = 0;
  for (const form1 of forms1) {
    for (const form2 of forms2) {
      if (form1 === form2) return 1;
      if (form1.includes(form2) || form2.includes(form1)) return 0.9;

      let matches = 0;
      const longer = form1.length > form2.length ? form1 : form2;
      const shorter = form1.length > form2.length ? form2 : form1;

      for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) matches++;
      }

      const similarity = matches / longer.length;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
  }

  return maxSimilarity;
};

export default function StoryPlayer({ story }: StoryPlayerProps) {
  const { toast } = useToast();
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // State declarations
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<typeof VOICE_OPTIONS[number]['id']>(
    // Try to get saved voice from cookie, default to Brian if not found
    (Cookies.get('preferredVoice') as typeof VOICE_OPTIONS[number]['id']) || "UGTtbzgh3HObxRjWaSpr"
  );
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [readingMode, setReadingMode] = useState<'child' | 'adult' | 'phoneme'>('child');
  const [sentences, setSentences] = useState<WordGroup[]>([]);
  const [phonemeGroups, setPhonemeGroups] = useState<WordGroup[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState<number>(0);

  // Refs
  const stopRecordingRef = useRef<() => void>(() => {});
  const activeTimerRef = useRef<number | null>(null);
  const activeStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  const handleRecognitionEnd = useCallback(() => {
    // Keep active state longer to show the user their input is still being processed
    setTimeout(() => {
      setIsActive(false);
      // Add additional delay before resetting the pending state
      if (!isMobileDevice) {
        setTimeout(() => setIsPending(false), 500);
      }
    }, 1000); // Extended from immediate to 1000ms delay
  }, [isMobileDevice]);

  const compareWordsWithAI = async (userWord: string, targetWord: string): Promise<number> => {
    try {
      // Always use AI comparison regardless of mode for better matching
      console.log('Using AI comparison for words:', { userWord, targetWord });
      const response = await fetch('/api/compare-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userWord, targetWord }),
      });
      
      if (!response.ok) {
        console.error('Error comparing words with AI:', response.statusText);
        // Fall back to local comparison if API call fails
        return calculateWordSimilarity(userWord, targetWord);
      }
      
      const result = await response.json();
      console.log('AI similarity result:', result);
      return result.similarity;
    } catch (error) {
      console.error('Error using AI comparison:', error);
      // Fall back to local comparison if API call fails
      return calculateWordSimilarity(userWord, targetWord);
    }
  };

  const handleTranscriptionUpdate = useCallback(async (transcript: string) => {
    if (isPending) return;

    // Preserve original case for reference in logs
    const originalHeard = transcript.trim();
    
    // Now lowercase for actual comparison
    const heardText = originalHeard.toLowerCase();
    setLastHeard(heardText);

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    // Preserve original case for reference in logs
    const originalExpected = currentGroup.text.replace(/[.,!?]$/, '').trim();
    
    // Now lowercase for actual comparison
    const expectedText = originalExpected.toLowerCase();
    
    // Log all variations for debugging
    console.log('Comparison details:', { 
      originalHeard,
      heardText,
      originalExpected, 
      expectedText,
      currentWordIndex,
      readingMode
    });

    // Lower threshold on mobile devices and for child mode to be more forgiving
    const similarityThreshold = isMobileDevice ? 0.4 : 0.45;
    
    // Explicit debug for proper names - log this special case
    if (expectedText.match(/^[A-Z][a-z]+$/) && /^[a-z]+$/.test(heardText)) {
      console.log('Detected potential proper name comparison:', { originalExpected, heardText });
    }
    
    // Always use AI comparison for better matching, regardless of mode
    // This ensures homophone matching works in both child and adult modes
    const similarity = await compareWordsWithAI(heardText, expectedText);
      
    console.log(`Similarity score (${readingMode} mode):`, similarity);

    if (similarity >= similarityThreshold ||
      heardText === expectedText ||
      heardText.includes(expectedText) ||
      expectedText.includes(heardText)) {

      setIsPending(true);
      stopRecordingRef.current();
      setIsActive(false);

      if (currentGroupIndex < wordGroups.length - 1) {
        const remainingWords = wordGroups.length - (currentGroupIndex + 1);
        const toastMessage = (() => {
          if (remainingWords === 0) {
            return {
              title: "Amazing finish! 🎯",
              description: `Perfect! You said "${currentGroup.text}" - You've completed the story!`
            };
          } else if (remainingWords === 1) {
            return {
              title: "Almost there! 🎨",
              description: `Excellent! You said "${currentGroup.text}" - Just one word to go!`
            };
          } else if (remainingWords === 2) {
            return {
              title: "Keep going! 🌈",
              description: `Great job with "${currentGroup.text}" - Only two more words!`
            };
          } else if (remainingWords === 3) {
            return {
              title: "You're on fire! 🔥",
              description: `Wonderful! You said "${currentGroup.text}" - Just three more words!`
            };
          } else if (remainingWords >= 4 && remainingWords <= 7) {
            return {
              title: "Fantastic progress! ⭐",
              description: `Well done! You said "${currentGroup.text}" - ${remainingWords} words to go!`
            };
          } else if (remainingWords >= 8 && remainingWords <= 15) {
            return {
              title: "Great job! 🌟",
              description: `You correctly said "${currentGroup.text}" - Keep up the momentum!`
            };
          } else {
            return {
              title: "Excellent! 🎈",
              description: `You correctly said "${currentGroup.text}"!`
            };
          }
        })();

        toast(toastMessage);

        const delay = isMobileDevice ? 0 : 500;
        setTimeout(() => {
          setCurrentGroupIndex(prev => prev + 1);
          setIsPending(false);
        }, delay);
      } else {
        setShowCelebration(true);
        setIsPending(false);
        toast({
          title: "Congratulations! 🎉",
          description: "You've completed the story!"
        });
      }
    } else {
      if (!isMobileDevice || transcript.endsWith('.')) {
        toast({
          title: "Almost there! 💪",
          description: `Try saying "${currentGroup.text}" again.`
        });
      }
    }
  }, [currentGroupIndex, wordGroups, isPending, isMobileDevice, readingMode, toast]);

  const { startRecording, stopRecording, isRecording, transcript } = useSpeechRecognition({
    language: "en-US",
    onTranscriptionUpdate: handleTranscriptionUpdate,
    onRecognitionEnd: handleRecognitionEnd,
    continuous: false,
    interimResults: !isMobileDevice,
    initializeOnMount: false
  });


  const { speak: elevenLabsSpeak } = useElevenLabs();
  const { speak: googleTTSSpeak } = useGoogleTTS();

  // Speak function: three implementations for child mode, adult mode, and phoneme mode
  const speak = async (text: string, options: { voiceId: string }) => {
    try {
      setIsSpeaking(true);
      
      // For adult mode with TRUE word-by-word INDIVIDUAL playback
      if (readingMode === 'adult' && currentGroupIndex < wordGroups.length) {
        const currentSentence = wordGroups[currentGroupIndex];
        
        // Make sure we have the nested structure
        if (!currentSentence.sentences || currentSentence.sentences.length === 0) {
          console.error("Missing nested sentence structure");
          await elevenLabsSpeak(text, { voiceId: options.voiceId });
          return;
        }
        
        // Extract individual words from the sentence
        const words = currentSentence.sentences.map(s => s.text);
        
        console.log("Reading with nested array:", currentSentence.text);
        console.log("Word structure:", words);
        
        // EXPLICITLY PLAY EACH WORD INDIVIDUALLY
        // This means multiple calls to ElevenLabs, one for each word
        for (let i = 0; i < words.length; i++) {
          // Update the current word index to highlight the appropriate word
          setCurrentWordIndex(i);
          
          // Send ONLY the current word to ElevenLabs
          const currentWord = words[i];
          console.log(`Playing individual word: "${currentWord}"`);
          
          // Each word gets its own individual API call and audio playback
          await elevenLabsSpeak(currentWord, { voiceId: options.voiceId });
          
          // Small delay between words for more natural rhythm
          if (i < words.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Reset highlighting after all words played
        setCurrentWordIndex(-1);
      } 
      // For phoneme mode with sequential highlighting during slow playback
      else if (readingMode === 'phoneme' && currentGroupIndex < wordGroups.length) {
        const currentWord = wordGroups[currentGroupIndex];
        
        // Make sure we have the phoneme structure
        if (!currentWord.phonemes || currentWord.phonemes.length === 0) {
          console.error("Missing phoneme structure");
          await elevenLabsSpeak(text, { voiceId: options.voiceId });
          return;
        }
        
        console.log("Reading with phonemes:", currentWord.text);
        console.log("Phoneme structure:", currentWord.phonemes);
        
        await phonemePlayback(currentWord, options.voiceId);
      } 
      else {
        // Child mode - unchanged, just read the individual word 
        await elevenLabsSpeak(text, { voiceId: options.voiceId });
      }
    } catch (error) {
      console.error('Error in speak function:', error);
      toast({
        title: "Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsSpeaking(false);
      }, 300);
    }
  };

  // Save voice preference when it changes
  useEffect(() => {
    Cookies.set('preferredVoice', selectedVoice, { expires: 365 }); // Expires in 1 year
  }, [selectedVoice]);

  // Get IPA phoneme breakdowns for words in Phoneme mode
  const fetchPhonemeGroups = useCallback(async () => {
    if (!story.content) return;
    
    try {
      console.log('Fetching IPA phoneme breakdowns for story content...');
      const response = await fetch('/api/phoneme-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: story.content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get phoneme breakdowns');
      }
      
      const data = await response.json();
      const phonemeData = data.phonemes || {};
      
      console.log('Received IPA phoneme breakdown:', phonemeData);
      
      // Create word groups with phoneme breakdowns
      const newPhonemeGroups: WordGroup[] = [];
      
      // Process each word and its phonemes
      const words = story.words;
      for (let i = 0; i < words.length; i++) {
        // Support multi-word phrases by splitting the word group
        const wordGroup = words[i];
        const cleanWordGroup = wordGroup.replace(/[.,!?]$/, '').toLowerCase(); // Remove punctuation and lowercase
        
        // Split multiple words in a group to handle phoneme lookup
        const individualWords = cleanWordGroup.split(/\s+/);
        const allPhonemesForGroup: PhonemeObject[] = [];
        let allWordsHavePhonemes = true;
        
        // Process each individual word in the group
        for (const individualWord of individualWords) {
          if (phonemeData[individualWord]) {
            const phonemes = phonemeData[individualWord];
            
            // Create phoneme objects for the word, using the IPA symbols directly
            const phonemeObjects = phonemes.map((phoneme: string) => ({
              text: phoneme, // The IPA symbol itself
              phonemes: [phoneme]
            }));
            
            // Add each phoneme to the group's collection
            allPhonemesForGroup.push(...phonemeObjects);
          } else {
            // Mark that this word group is incomplete
            allWordsHavePhonemes = false;
            console.log(`No IPA phoneme breakdown found for word: ${individualWord} in group: ${cleanWordGroup}`);
            break;
          }
        }
        
        if (allWordsHavePhonemes && allPhonemesForGroup.length > 0) {
          // All words in the group have phonemes
          newPhonemeGroups.push({
            text: words[i], // Keep original word with punctuation
            words: [words[i]],
            startIndex: i,
            phonemes: allPhonemesForGroup
          });
        } else {
          // If any word in the group doesn't have phonemes, use the word group as is
          console.log(`Using word group without phoneme breakdown: ${cleanWordGroup}`);
          newPhonemeGroups.push({
            text: words[i],
            words: [words[i]],
            startIndex: i,
            phonemes: [{
              text: words[i],
              phonemes: [words[i]]
            }]
          });
        }
      }
      
      setPhonemeGroups(newPhonemeGroups);
      
      // If currently in phoneme mode, update the word groups
      if (readingMode === 'phoneme') {
        setWordGroups(newPhonemeGroups);
      }
      
    } catch (error) {
      console.error('Error fetching phoneme breakdowns:', error);
      toast({
        title: "Error",
        description: "Failed to load phoneme breakdowns. Some features may be limited.",
        variant: "destructive"
      });
    }
  }, [story, readingMode, toast]);



  // Check for inappropriate content when story is loaded
  useEffect(() => {
    if (containsForbiddenContent(story.topic) || containsForbiddenContent(story.content)) {
      toast({
        title: "⚠️ Content Warning",
        description: "This story may contain inappropriate content for children.",
        variant: "default"
      });
    }
    
    // Load phoneme breakdown data when story changes
    fetchPhonemeGroups();
  }, [story, toast, fetchPhonemeGroups]);

  // Store the stopRecording function in a ref
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Use smart word grouping API for better compound word handling
  const fetchSmartWordGroups = async (content: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/smart-word-grouping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get smart word groups');
      }
      
      const data = await response.json();
      return data.wordGroups;
    } catch (error) {
      console.error('Error fetching smart word groups:', error);
      // Fallback: split by spaces
      return content.split(/\s+/);
    }
  };
  
  // Get phoneme breakdown for each word in the story
  const fetchPhonemeBreakdown = async (content: string): Promise<Record<string, string[]>> => {
    try {
      const response = await fetch('/api/phoneme-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get phoneme breakdown');
      }
      
      const data = await response.json();
      return data.phonemes;
    } catch (error) {
      console.error('Error fetching phoneme breakdown:', error);
      // Fallback: empty object
      return {};
    }
  };
  
  // Process story words into groups
  useEffect(() => {
    // Helper function to process the words
    const processWords = async () => {
      // Create word groups for child mode
      const childGroups: WordGroup[] = [];
      const words = story.words;
      const hasPunctuation = (word: string) => /[.,!?]/.test(word);
      
      // Try to get smart grouping for existing stories
      try {
        if (story.content) {
          console.log('Attempting smart word grouping for better compound word detection...');
          const response = await fetch('/api/smart-word-grouping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: story.content })
          });
          
          if (response.ok) {
            const data = await response.json();
            const smartGroups = data.wordGroups;
            
            if (smartGroups && smartGroups.length > 0) {
              console.log('Using smart word groups:', smartGroups);
              // Create child groups from smart words
              for (let i = 0; i < smartGroups.length; i++) {
                childGroups.push({
                  text: smartGroups[i],
                  words: [smartGroups[i]],
                  startIndex: i
                });
              }
              
              // Create sentence groups for adult mode
              const sentenceGroups: WordGroup[] = [];
              let currentSentence: string[] = [];
              let startIndex = 0;
              
              // Group into sentences - preserve punctuation
              for (let i = 0; i < smartGroups.length; i++) {
                const word = smartGroups[i];
                currentSentence.push(word);
                
                if (/[.!?]$/.test(word) || i === smartGroups.length - 1) {
                  // Create sentence text with proper spacing and preserving punctuation
                  const sentenceText = currentSentence.join(' ');
                  
                  sentenceGroups.push({
                    text: sentenceText,
                    words: [...currentSentence],
                    startIndex: startIndex,
                    sentences: currentSentence.map(w => ({
                      text: w,
                      words: [w]
                    }))
                  });
                  
                  currentSentence = [];
                  startIndex = i + 1;
                }
              }
              
              setWordGroups(readingMode === 'child' ? childGroups : sentenceGroups);
              setSentences(sentenceGroups);
              return; // Exit early since we used smart grouping
            }
          }
        }
      } catch (error) {
        console.error('Smart word grouping failed, falling back to default:', error);
      }
      
      // Fallback to original grouping logic
      console.log('Using fallback word grouping method');
      let i = 0;
      while (i < words.length) {
        const currentWord = words[i].toLowerCase();
  
        // Check if current word is a stop word and there's a next word without breaking the groups at punctuation
        if (STOP_WORDS.has(currentWord.replace(/[.,!?]$/, '')) &&
           i + 1 < words.length &&
           !hasPunctuation(words[i])) {
          const group = {
            text: `${words[i]} ${words[i + 1]}`,
            words: [words[i], words[i + 1]],
            startIndex: i
          };
          childGroups.push(group);
          i += 2;
        } else {
          const group = {
            text: words[i],
            words: [words[i]],
            startIndex: i
          };
          childGroups.push(group);
          i += 1;
        }
      }

      // Create sentence groups for adult mode with nested word structure
      const sentenceGroups: WordGroup[] = [];
      let currentSentence: string[] = [];
      let startIndex = 0;
      
      // First, separate words into sentences
      for (let index = 0; index < words.length; index++) {
        const word = words[index];
        currentSentence.push(word);
        
        // Check for end of sentence
        if (/[.!?]$/.test(word) || index === words.length - 1) {
          const sentenceText = currentSentence.join(' ');
          
          // Create sentence group with individual words as a nested array
          sentenceGroups.push({
            text: sentenceText,
            words: [...currentSentence], // Clone array to prevent reference issues
            startIndex: startIndex,
            // Create a nested structure of individual words
            sentences: currentSentence.map(w => ({
              text: w,
              words: [w]
            }))
          });
          
          currentSentence = [];
          startIndex = index + 1;
        }
      }

      setWordGroups(readingMode === 'child' ? childGroups : sentenceGroups);
      setSentences(sentenceGroups);
    };

    // Process the words when component mounts or dependencies change
    processWords();
  }, [story, readingMode]);

  const handleModeChange = (mode: 'child' | 'adult' | 'phoneme') => {
    if (mode === readingMode) return;

    setReadingMode(mode);
    setCurrentGroupIndex(0);
    setCurrentWordIndex(0);
    setCurrentPhonemeIndex(0);
    setShowCelebration(false);
    setLastHeard("");
    setIsActive(false);

    // Update word groups based on mode
    if (mode === 'adult') {
      setWordGroups(sentences);
    } else if (mode === 'phoneme') {
      // If phoneme groups not loaded yet, they will be loaded in the useEffect
      if (phonemeGroups.length > 0) {
        setWordGroups(phonemeGroups);
      }
    } else {
      // Default child mode
      setWordGroups(wordGroups);
    }
  };

  const resetStory = () => {
    setCurrentGroupIndex(0);
    setCurrentWordIndex(0);
    setCurrentPhonemeIndex(0);
    setShowCelebration(false);
    setLastHeard("");
    setIsActive(false);
    setIsLiked(false); // Reset like state
  };
  
  // Function to read individual phonemes with proper highlighting using IPA phonemes
  const phonemePlayback = async (word: WordGroup, voiceId: string) => {
    if (!word.phonemes || word.phonemes.length === 0) return;
    
    try {
      // First read the whole word to demonstrate proper pronunciation
      // Use ElevenLabs for the whole word since it can handle regular words well
      await elevenLabsSpeak(word.text, { voiceId });
      
      // Add a slight pause between whole word and phoneme-by-phoneme reading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then play and highlight each phoneme individually using Google TTS
      for (let i = 0; i < word.phonemes.length; i++) {
        // Update the current phoneme index to highlight the appropriate phoneme
        setCurrentPhonemeIndex(i);
        
        // Send ONLY the current phoneme to Google TTS, using IPA phoneme tags
        const currentPhoneme = word.phonemes[i];
        console.log(`Playing individual phoneme: "${currentPhoneme.text}" using Google TTS with IPA`);
        
        // Map ElevenLabs voice ID to Google voice
        // Default to a standard voice if no mapping exists
        const googleVoiceId = ELEVENLABS_TO_GOOGLE_VOICE_MAP[voiceId] || "en-US-Wavenet-F";
        
        // Play phoneme with Google TTS, enabling IPA phoneme formatting
        await googleTTSSpeak(currentPhoneme.text, { 
          voiceId: googleVoiceId,
          languageCode: "en-US",
          useIPAPhonemes: true, // Enable IPA phoneme formatting
        });
        
        // Slightly longer delay between phonemes for clarity
        if (i < word.phonemes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased even more for better clarity with SSML breaks
        }
      }
      
      // Reset highlighting after all phonemes played
      setCurrentPhonemeIndex(-1);
      
    } catch (error) {
      console.error('Error in phoneme playback:', error);
      // Reset the phoneme index even if there was an error
      setCurrentPhonemeIndex(-1);
    }
  };



  const playWelcomeMessage = useCallback(async (voiceId: typeof VOICE_OPTIONS[number]['id']) => {
    const welcomeMessages = {
      "UGTtbzgh3HObxRjWaSpr": "Hi, I'm Knox! Let's read together and have fun!",
      "pPdl9cQBQq4p6mRkZy2Z": "Hi, I'm Venna! I'm ready to help you read!",
      "dyTPmGzuLaJM15vpN3DS": "Hi, I'm Titus! Let's begin reading!"
    } as const;

    const message = welcomeMessages[voiceId];
    if (message) {
      try {
        await speak(message, { voiceId });
      } catch (error) {
        console.error('Error playing welcome message:', error);
      }
    }
  }, [speak]);

  const readWord = async () => {
    if (isActive || isSpeaking || isPending) return;

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    setIsActive(true);
    setLastHeard("");
    setIsPending(false);

    try {
      if (readingMode === 'adult') {
        // Reset word index explicitly at the beginning
        setCurrentWordIndex(0);
        
        // For adult mode, read the whole sentence but highlight word by word
        console.log('Reading sentence:', currentGroup.text);
        
        // For adult mode, read the whole sentence but highlight word by word
        await speak(currentGroup.text, {
          voiceId: selectedVoice
        });
        
        // Add a small delay before starting the microphone
        await new Promise(resolve => setTimeout(resolve, 300));
        await startRecording();
      } else {
        // Child mode - original behavior
        const wordToRead = `"${currentGroup.text}"`;
        console.log('Reading group:', wordToRead);
        
        await speak(wordToRead, {
          voiceId: selectedVoice
        });
        
        // Add a small delay before starting the microphone
        await new Promise(resolve => setTimeout(resolve, 300));
        await startRecording();
      }
    } catch (error) {
      console.error('Error in readWord:', error);
      setIsActive(false);
      setIsPending(false);
      toast({
        title: "⛔ Error",
        description: "Failed to read the word. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      
      // Clean up word timer on unmount
      if (wordTimerRef.current) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
    };
  }, [isRecording, stopRecording]);

  const handleLike = async () => {
    if (isLiked || isLoading) return; // Prevent multiple clicks while loading

    setIsLoading(true); // Set loading state to true
    try {
      const response = await apiRequest("POST", `/api/stories/${story.id}/like`);
      if (!response.ok) {
        throw new Error('Failed to like story');
      }
      setIsLiked(true);
      // Invalidate the story query to refetch with updated likes
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story.id}`] });
      toast({
        title: "Liked! 💖",
        description: "Thanks for showing your appreciation!"
      });
    } catch (error) {
      toast({
        title: "⛔ Error",
        description: "Failed to like the story. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false); // Set loading state to false on error
    } finally {
      setIsLoading(false); // Ensure loading state is always reset
    }
  };

  const handleShare = async () => {
    const shareText = `I completed reading a story about ${story.topic}!`;
    const shareUrl = `${window.location.origin}/read/${story.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KidReads Story',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({
          title: "Copied! 📋",
          description: "Share link copied to clipboard!"
        });
      } catch (error) {
        toast({
          title: "⛔ Error",
          description: "Failed to copy share link.",
          variant: "destructive"
        });
      }
    }
  };

  const playCompletionSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Error playing completion sound:', error);
      });
    }
  };

  useEffect(() => {
    if (isActive && !isSpeaking) {
      activeStartTimeRef.current = Date.now();
      activeTimerRef.current = window.setInterval(() => {
        const stuckDuration = Date.now() - activeStartTimeRef.current;
        // Extended the stuck detection time from 3000ms to 8000ms
        // This allows the microphone to listen longer before auto-resetting
        if (stuckDuration > 8000 && !isSpeaking) {
          console.log('Detected stuck state, resetting button...');
          setIsActive(false);
          setIsPending(false);
          stopRecording();
          toast({
            title: "🔁 Auto-Reset",
            description: "Microphone state was reset due to inactivity"
          });
        }
      }, 2000);
      return () => {
        if (activeTimerRef.current) {
          window.clearInterval(activeTimerRef.current);
          activeTimerRef.current = null;
        }
      };
    } else {
      if (activeTimerRef.current) {
        window.clearInterval(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    }
  }, [isActive, isSpeaking, stopRecording]);

  return (
    <div className="text-center relative">
      <audio ref={audioRef} src={lessonCompleteSound} preload="auto" />

      {/* Mode Selection Buttons */}
      <div className="overflow-x-auto mb-4 max-w-full px-2 scrollbar-hide">
        <div className="flex gap-4 min-w-max justify-center">
          <Button
            variant={readingMode === 'child' ? 'default' : 'outline'}
            size="sm"
            className="text-lg px-4 py-2 whitespace-nowrap"
            onClick={() => handleModeChange('child')}
            disabled={isActive || isSpeaking || isPending}
          >
            👶 Word Mode
          </Button>
          <Button
            variant={readingMode === 'adult' ? 'default' : 'outline'}
            size="sm"
            className="text-lg px-4 py-2 whitespace-nowrap"
            onClick={() => handleModeChange('adult')}
            disabled={isActive || isSpeaking || isPending}
          >
            🧑‍💼 Sentence Mode
          </Button>
          <Button
            variant={readingMode === 'phoneme' ? 'default' : 'outline'}
            size="sm"
            className="text-lg px-4 py-2 whitespace-nowrap"
            onClick={() => handleModeChange('phoneme')}
            disabled={isActive || isSpeaking || isPending}
          >
            🔤 Phoneme Mode
          </Button>
        </div>
      </div>

      {/* Scrollbar styling moved to StoryPlayer.css */}

      <div className="p-1">
        {/* Voice selection dropdown */}
        <select
          value={selectedVoice}
          onChange={(e) => {
            const newVoiceId = e.target.value as typeof VOICE_OPTIONS[number]['id'];
            setSelectedVoice(newVoiceId);
            playWelcomeMessage(newVoiceId);
          }}
          className="w-full max-w-sm mx-auto block px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          disabled={isActive || isSpeaking || isPending}
        >
          {VOICE_OPTIONS.map(voice => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700 mb-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span>{story.likes || 0} {story.likes === 1 ? 'like' : 'likes'}</span>
        </div>

        {/* Story content display */}
        <div className="max-w-2xl mx-auto text-xl leading-relaxed break-words whitespace-pre-wrap mb-4">
          {wordGroups.map((group, groupIndex) => {
            // Adult mode - sentence display with individual word highlighting
            if (readingMode === 'adult' && groupIndex === currentGroupIndex && group.sentences) {
              return (
                <span key={group.startIndex} className="inline mx-1">
                  {group.sentences?.map((sentence, wordIdx) => (
                    <span
                      key={`${group.startIndex}-${wordIdx}`}
                      className={`inline-block mx-[2px] ${
                        wordIdx === currentWordIndex && isSpeaking
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {sentence.text}{wordIdx < (group.sentences?.length || 0) - 1 ? ' ' : ''}
                    </span>
                  ))}
                </span>
              );
            } 
            // Phoneme mode - word display with individual phoneme highlighting
            else if (readingMode === 'phoneme' && groupIndex === currentGroupIndex && group.phonemes) {
              return (
                <span key={group.startIndex} className="inline-flex flex-col mx-1 border-2 border-blue-300 rounded-md p-2 bg-blue-50">
                  {/* Display the whole word first */}
                  <span className="font-bold text-2xl mb-2 text-blue-600">{group.text}</span>
                  
                  {/* Display phonemes below */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {group.phonemes.map((phoneme: PhonemeObject, phoneIdx) => (
                      <span
                        key={`${group.startIndex}-ph-${phoneIdx}`}
                        className={`inline-block px-2 py-1 rounded-md ${
                          phoneIdx === currentPhonemeIndex && isSpeaking
                            ? 'bg-green-200 text-green-800 font-bold'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {phoneme.text}
                      </span>
                    ))}
                  </div>
                </span>
              );
            } 
            // Child mode or non-current groups
            else {
              return (
                <span
                  key={group.startIndex}
                  className={`inline-block mx-1 ${
                    groupIndex === currentGroupIndex
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  {group.text}
                </span>
              );
            }
          })}
        </div>

        {/* Read button */}
        <div className="flex justify-center mb-4">
          <Button
            size="lg"
            onClick={readWord}
            disabled={isActive || isSpeaking || isPending || currentGroupIndex >= wordGroups.length}
          >
            {isActive ? (
              <div className="animate-pulse">👂 Listening...</div>
            ) : isSpeaking ? (
              <div className="animate-pulse">👄 Speaking...</div>
            ) : (
              <>
                <Play className="w-6 h-6 mr-2" />
                {readingMode === 'child' && "Read Along"}
                {readingMode === 'adult' && "Read Sentence"}
                {readingMode === 'phoneme' && "Read Phonemes"}
              </>
            )}
          </Button>
        </div>

        {/* Progress and controls 
        <div className="flex justify-between items-center px-4">
          <Button
            variant="outline"
            onClick={resetStory}
            disabled={isActive || isSpeaking || isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isActive || isSpeaking || isPending}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleLike}
              disabled={isLiked || isLoading || isActive || isSpeaking || isPending}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Liked!' : 'Like'}
            </Button>
          </div>
        </div>
        */}

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{
              width: `${(currentGroupIndex / wordGroups.length) * 100}%`
            }}
          />
        </div>

        {/* Last heard text */}
        <div className="mt-4 text-sm text-gray-500">
          🎙️ Last heard: "{lastHeard}"
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999999]"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center"
            onClick={e => e.stopPropagation()}
            onMouseEnter={playCompletionSound}
          >
            <h2 className="text-3xl font-bold mb-4">Amazing Job! 🌟</h2>
            <p className="text-xl mb-6">You've completed the story!</p>
            <div
              className="text-6xl mb-6 cursor-pointer hover:scale-110 transition-transform"
              onClick={playCompletionSound}
            >
              🎉
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={handleLike}
                className="flex items-center gap-2"
                disabled={isLiked || isLoading}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button onClick={resetStory}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Read Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}