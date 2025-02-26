import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { Story } from "@shared/schema";
import { Share2, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import lessonCompleteSound from "../assets/lesson_complete.mp3";

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
  'glock', 'ruger', // Specific gun brands
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
  'scat', 'watersports', 'golden shower', 'fisting', 'analingus', 'fellatio', 'cunnilingus',

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
  { id: "en-US-Neural2-H", name: "Male" },
  { id: "en-US-Neural2-F", name: "Female" }
] as const;

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

interface WordGroup {
  text: string;
  words: string[];
  startIndex: number;
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
  word = word.toLowerCase().trim();
  let forms = [word];

  // If it's a number word, add its digit form
  if (NUMBER_WORDS[word]) {
    forms.push(NUMBER_WORDS[word]);
  }

  // If it's a digit, add its word form
  for (const [wordNum, digit] of Object.entries(NUMBER_WORDS)) {
    if (word === digit) {
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
  const [selectedVoice, setSelectedVoice] = useState<typeof VOICE_OPTIONS[number]['id']>("en-US-Neural2-H");
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // Refs
  const stopRecordingRef = useRef<() => void>(() => {});
  const activeTimerRef = useRef<number | null>(null);
  const activeStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRecognitionEnd = useCallback(() => {
    setIsActive(false);
    if (!isMobileDevice) {
      setTimeout(() => setIsPending(false), 300);
    }
  }, [isMobileDevice]);

  const handleTranscriptionUpdate = useCallback((transcript: string) => {
    if (isPending) return;

    const heardText = transcript.toLowerCase().trim();
    setLastHeard(heardText);

    const currentGroup = wordGroups[currentGroupIndex];
    if (!currentGroup) return;

    const expectedText = currentGroup.text.toLowerCase().replace(/[.,!?]$/, '').trim();
    console.log('Comparing:', { heard: heardText, expected: expectedText });

    const similarityThreshold = isMobileDevice ? 0.4 : 0.5;
    const similarity = calculateWordSimilarity(heardText, expectedText);
    console.log('Similarity:', similarity);

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
  }, [currentGroupIndex, wordGroups, isPending, isMobileDevice]);

  const { startRecording, stopRecording, isRecording, transcript, recognition } = useSpeechRecognition({
    language: "en-US",
    onTranscriptionUpdate: handleTranscriptionUpdate,
    onRecognitionEnd: handleRecognitionEnd,
    continuous: false,
    interimResults: !isMobileDevice,
    initializeOnMount: false
  });


  const speak = async (text: string, options: any) => {
    try {
      setIsSpeaking(true);
      // Assuming originalSpeak is still available from useElevenLabs
      //  Replace with your actual implementation if different.
      await options.speak(text, options);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Check for inappropriate content when story is loaded
  useEffect(() => {
    if (containsForbiddenContent(story.topic) || containsForbiddenContent(story.content)) {
      toast({
        title: "⚠️ Content Warning",
        description: "This story may contain inappropriate content for children.",
        variant: "default"
      });
    }
  }, [story, toast]);


  // Store the stopRecording function in a ref
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Process story words into groups
  useEffect(() => {
    const groups: WordGroup[] = [];
    const words = story.words;
    const hasPunctuation = (word: string) => /[.,!?]/.test(word);

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
        groups.push(group);
        i += 2;
      } else {
        const group = {
          text: words[i],
          words: [words[i]],
          startIndex: i
        };
        groups.push(group);
        i += 1;
      }
    }

    console.log('Created word groups:', groups);
    setWordGroups(groups);
  }, [story.words]);

  useEffect(() => {
    if (isActive && !isSpeaking) {
      activeStartTimeRef.current = Date.now();
      activeTimerRef.current = window.setInterval(() => {
        const stuckDuration = Date.now() - activeStartTimeRef.current;
        if (stuckDuration > 3000 && !isSpeaking) {
          console.log('Detected stuck state, resetting button...');
          setIsActive(false);
          setIsPending(false);
          if (recognition) {
            try {
              recognition.abort();
              recognition.stop();
            } catch (error) {
              console.error('Error stopping recognition:', error);
            }
          }
          toast({
            title: "Auto-Reset",
            description: "Microphone state was reset due to inactivity",
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
  }, [isActive, isSpeaking, recognition]);



  const resetStory = () => {
    setCurrentGroupIndex(0);
    setShowCelebration(false);
    setLastHeard("");
    setIsActive(false);
    setIsLiked(false); // Reset like state
  };

  const playWelcomeMessage = useCallback(async (voiceId: typeof VOICE_OPTIONS[number]['id']) => {
    const welcomeMessages = {
      "en-US-Neural2-H": "Hi, I'm a male voice! Let's read together and have fun!",
      "en-US-Neural2-F": "Hi, I'm a female voice! I'm ready to help you read!"
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

    const wordToRead = `"${currentGroup.text}"`;
    console.log('Reading group:', wordToRead);

    setIsActive(true);
    setLastHeard("");
    setIsPending(false);

    try {
      await speak(wordToRead, {
        voiceId: selectedVoice,
        speak:  useElevenLabs().speak // Pass speak function from hook
      });

      if (!isMobileDevice) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      await startRecording();
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

  return (
    <div className="text-center relative">
      <audio ref={audioRef} src={lessonCompleteSound} preload="auto" />
      <div className="p-1">
        <div className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700 mb-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span>{story.likes || 0} likes</span>
        </div>

        <div className="max-w-2xl mx-auto text-xl leading-relaxed break-words whitespace-pre-wrap">
          {wordGroups.map((group, groupIndex) => (
            <span
              key={group.startIndex}
              className={`inline-block mx-1 ${
                groupIndex === currentGroupIndex
                  ? 'text-2xl font-semibold text-primary'
                  : 'text-gray-600'
              }`}
            >
              {group.text}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <select
            value={selectedVoice}
            onChange={(e) => {
              const newVoiceId = e.target.value as typeof VOICE_OPTIONS[number]['id'];
              setSelectedVoice(newVoiceId);
              playWelcomeMessage(newVoiceId);
            }}
            className="w-full max-w-sm mx-auto block px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          >
            {VOICE_OPTIONS.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>

          <Button
            size="lg"
            onClick={readWord}
            disabled={isActive || isSpeaking || isPending}
            className={`w-full max-w-sm mx-auto ${isActive ? "animate-pulse bg-green-500" : ""}`}
          >
            <Play className="mr-2 h-4 w-4" />
            {isActive ? "Listening..." : isSpeaking ? "Speaking..." : "Read Word"}
          </Button>

          {lastHeard && (
            <div className="text-sm text-gray-600">
              Last heard: "{lastHeard}"
            </div>
          )}

          {currentGroupIndex === wordGroups.length - 1 && (
            <p className="mt-4 text-green-600">Last word! Keep going!</p>
          )}

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">🎙️ Live Transcript</h3>
            <p className="text-gray-600 min-h-[2rem] transition-all">
              {isActive ? (
                transcript ?
                  <span className="animate-pulse">{transcript}</span> :
                  <span className="animate-pulse">Listening...</span>
              ) : (
                transcript || "Ready to listen..."
              )}
            </p>
          </div>
        </div>

        {showCelebration && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
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
    </div>
  );
}