/**
 * Lexical Grammar and Semantic Classification Engine for Pi Discoveries
 * Built on open-source WordNet parts of speech.
 */

export const ADJECTIVES = new Set([
  'TRUE', 'PURE', 'DEEP', 'HIGH', 'DARK', 'BRIGHT', 'CLEAR', 'WILD', 'CALM',
  'WIDE', 'LONG', 'FAST', 'SLOW', 'COLD', 'WARM', 'HOT', 'SOFT', 'HARD',
  'SWEET', 'KIND', 'BRAVE', 'BOLD', 'NOBLE', 'WISE', 'SAFE', 'ALIVE',
  'AWAKE', 'STILL', 'QUIET', 'LOUD', 'MAGIC', 'GREAT', 'GRAND', 'HOLY',
  'SACRED', 'SECRET', 'LUCKY', 'HAPPY', 'SILENT', 'GOLDEN', 'NEW', 'OLD',
  'GOOD', 'BEST', 'REAL', 'FREE', 'BLUE', 'RED', 'FINE', 'VIBRANT', 'LUCID',
  'LUMINOUS', 'RADIANT', 'SHINING', 'SILVER', 'AZURE', 'CRYSTAL', 'SERENE',
  'TRANQUIL', 'PEACEFUL', 'GENTLE', 'TENDER', 'VALIANT', 'FEARLESS', 'FAITHFUL',
  'LOYAL', 'HONEST', 'JUST', 'RIGHT', 'DIVINE', 'MYSTIC', 'HIDDEN', 'COSMIC',
  'STELLAR', 'INFINITE', 'BOUNDLESS', 'ETERNAL', 'TIMELESS', 'ENDLESS', 'VAST',
  'IMMENSE', 'PROFOUND', 'CLEVER', 'KEEN', 'SHARP', 'QUICK', 'SWIFT', 'FLEET',
  'AGILE', 'NIMBLE', 'STRONG', 'ROBUST', 'HARDY', 'SOLID', 'STEADY', 'SECURE',
  'VITAL', 'WHOLE', 'SOUND', 'FRESH', 'NOVEL', 'ANCIENT', 'PRIME', 'SOLAR', 'LUNAR'
]);

export const NOUNS = new Set([
  'GOD', 'LIFE', 'SOUL', 'LOVE', 'MIND', 'TIME', 'SPACE', 'STAR', 'SUN', 'MOON',
  'EARTH', 'ATOM', 'WAVE', 'LIGHT', 'DARK', 'VOID', 'FIRE', 'WIND', 'WATER',
  'CODE', 'DATA', 'MATH', 'BYTE', 'BYTES', 'WORD', 'NAME', 'PATH', 'TRUTH', 'FORCE',
  'POWER', 'NATURE', 'HUMAN', 'BEING', 'REALITY', 'COSMOS', 'SPIRIT', 'WISDOM',
  'REASON', 'LOGIC', 'CHAOS', 'ORDER', 'BEAUTY', 'SECRET', 'SILENCE', 'WORLD',
  'PEOPLE', 'MAN', 'MEN', 'WOMAN', 'WOMEN', 'CHILD', 'FRIEND', 'FAMILY', 'HOME',
  'HOUSE', 'ROOM', 'DOOR', 'WALL', 'TREE', 'FOREST', 'BIRD', 'FISH', 'DOG',
  'CAT', 'LION', 'WOLF', 'ROSE', 'RIVER', 'OCEAN', 'SEA', 'MOUNTAIN', 'HILL',
  'ROAD', 'CITY', 'TOWN', 'BOOK', 'PAGE', 'SONG', 'MUSIC', 'ART', 'HAND',
  'EYE', 'FACE', 'HEAD', 'HEART', 'BODY', 'VOICE', 'SOUND', 'BREATH', 'GOLD',
  'IRON', 'STONE', 'ROCK', 'CLOUD', 'RAIN', 'SNOW', 'ICE', 'SKY', 'KING',
  'QUEEN', 'HERO', 'LEADER', 'STORY', 'TALE', 'MEMORY', 'SHADOW', 'MIRROR',
  'WINDOW', 'NODE', 'HOST', 'LINK', 'LOOP', 'BIT', 'BITS', 'CHIP', 'CORE', 'CPU',
  'RAM', 'ROM', 'DISK', 'FILE', 'GRAPH', 'HASH', 'ROOT', 'LEAF', 'PORT',
  'CLOUD', 'EDGE', 'WORKER', 'PROXY', 'ROUTER', 'STATE', 'FLOW', 'DAY', 'WAY', 'BOY',
  'FATE', 'DESTINY', 'SPARK', 'GENIUS', 'INSIGHT', 'PLANET', 'ORBIT', 'GRAVITY',
  'ENERGY', 'MATTER', 'FIELD', 'PULSAR', 'NEBULA', 'AURORA', 'HORIZON', 'COMET',
  'GALAXY', 'TIDE', 'STREAM', 'FLAME', 'EMBER', 'ASH', 'DUST', 'SAND', 'ISLAND',
  'EAGLE', 'HAWK', 'DOVE', 'SWAN', 'OWL', 'RAVEN', 'KNIGHT', 'MASTER', 'POET',
  'SAGE', 'PILGRIM', 'TOWER', 'TEMPLE', 'CASTLE', 'GATE', 'ARRAY', 'QUEUE', 'STACK',
  'TABLE', 'BLOCK', 'CHAIN', 'TOKEN', 'PACKET', 'BUFFER', 'THREAD', 'SCHEMA'
]);

export const VERBS = new Set([
  'SEEK', 'FIND', 'KNOW', 'THINK', 'HOPE', 'DREAM', 'WISH', 'WALK', 'RUN',
  'FLY', 'SWIM', 'JUMP', 'FALL', 'RISE', 'STAND', 'SIT', 'LOOK', 'SEE',
  'HEAR', 'LISTEN', 'SPEAK', 'TELL', 'TALK', 'WRITE', 'READ', 'SING', 'DANCE',
  'PLAY', 'WORK', 'BUILD', 'MAKE', 'GIVE', 'TAKE', 'HOLD', 'KEEP', 'LEAVE',
  'COME', 'GO', 'MOVE', 'STOP', 'WAIT', 'HELP', 'FEEL', 'TOUCH', 'SMILE',
  'LAUGH', 'CRY', 'LIVE', 'DIE', 'BORN', 'GROW', 'CHANGE', 'BEGIN', 'END',
  'SAVE', 'LOST', 'WIN', 'LOSE', 'FIGHT', 'HEAL', 'BURN', 'SHINE', 'GLOW',
  'FLOW', 'STAY', 'PASS', 'CALL', 'PUSH', 'PULL', 'CAN', 'WILL', 'HAVE',
  'PUT', 'SAY', 'LET', 'BOOT', 'INIT', 'DISCOVER', 'REVEAL', 'UNVEIL', 'LEARN',
  'TEACH', 'PONDER', 'WONDER', 'ENVISION', 'BELIEVE', 'TRUST', 'CHERISH', 'CARE',
  'COMFORT', 'BLESS', 'CREATE', 'DESIGN', 'CRAFT', 'SHAPE', 'MOLD', 'WEAVE',
  'SPIN', 'DRAW', 'PAINT', 'COMPOSE', 'CHANT', 'UTTER', 'WHISPER', 'SHOUT',
  'ATTEND', 'WATCH', 'GAZE', 'BEHOLD', 'SCAN', 'TRACE', 'TRACK', 'TREAD',
  'STRIDE', 'SPRINT', 'RACE', 'SOAR', 'GLIDE', 'HOVER', 'LEAP', 'BOUND',
  'CLIMB', 'SCALE', 'ASCEND', 'DESCEND', 'PLUNGE', 'DIVE', 'FLOAT', 'DRIFT',
  'SAIL', 'VOYAGE', 'JOURNEY', 'TRAVEL', 'WANDER', 'ROAM', 'REST', 'SLEEP',
  'AWAKEN', 'WAKE', 'STIR', 'BREATHE', 'THRIVE', 'FLOURISH', 'EXPAND', 'RADIATE',
  'BEAM', 'FLASH', 'SPARKLE', 'IGNITE', 'BLAZE', 'KINDLE', 'STREAM', 'SURGE',
  'POUR', 'RUSH', 'ENDURE', 'PERSIST', 'PREVAIL', 'SUCCEED', 'ACHIEVE', 'TRIUMPH'
]);

export const PREPOSITIONS = new Set([
  'IN', 'ON', 'AT', 'TO', 'FOR', 'WITH', 'FROM', 'BY', 'INTO', 'OVER',
  'UNDER', 'AFTER', 'BEFORE', 'BETWEEN', 'WITHOUT', 'THROUGH', 'AROUND'
]);

export const PRONOUNS = new Set([
  'I', 'YOU', 'HE', 'SHE', 'IT', 'WE', 'THEY', 'ALL', 'WHO', 'THIS', 'THAT'
]);

export type PhraseType =
  | 'WORD'
  | 'ADJ_NOUN'
  | 'SUBJ_VERB'
  | 'PREP_NOUN'
  | 'VERB_NOUN'
  | 'TRI_SENTENCE'
  | 'COMPOUND';

export type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'MYTHIC';

/**
 * Classifies a multi-word sequence into a recognized syntactic pattern.
 */
export function classifyPhrase(words: string[]): {
  isPhrase: boolean;
  phraseType: PhraseType;
  label: string;
  rarityTier: RarityTier;
} {
  if (words.length <= 1) {
    const word = words[0] || '';
    let rarityTier: RarityTier = 'COMMON';
    if (word.length >= 6) rarityTier = 'RARE';
    else if (word.length >= 4) rarityTier = 'UNCOMMON';

    return {
      isPhrase: false,
      phraseType: 'WORD',
      label: 'Single Word',
      rarityTier
    };
  }

  const [w1, w2, w3] = words;

  // 3-word combinations (Trigrams)
  if (words.length === 3 && w1 && w2 && w3) {
    if ((PRONOUNS.has(w1) || NOUNS.has(w1)) && VERBS.has(w2) && (NOUNS.has(w3) || ADJECTIVES.has(w3))) {
      return {
        isPhrase: true,
        phraseType: 'TRI_SENTENCE',
        label: 'Subject + Verb + Object',
        rarityTier: 'MYTHIC'
      };
    }
    return {
      isPhrase: true,
      phraseType: 'COMPOUND',
      label: '3-Word Sequence',
      rarityTier: 'MYTHIC'
    };
  }

  // 2-word combinations (Bigrams)
  if (ADJECTIVES.has(w1) && NOUNS.has(w2)) {
    return {
      isPhrase: true,
      phraseType: 'ADJ_NOUN',
      label: 'Adjective + Noun',
      rarityTier: 'EPIC'
    };
  }

  if ((PRONOUNS.has(w1) || NOUNS.has(w1)) && VERBS.has(w2)) {
    return {
      isPhrase: true,
      phraseType: 'SUBJ_VERB',
      label: 'Subject + Verb',
      rarityTier: 'EPIC'
    };
  }

  if (PREPOSITIONS.has(w1) && NOUNS.has(w2)) {
    return {
      isPhrase: true,
      phraseType: 'PREP_NOUN',
      label: 'Preposition + Noun',
      rarityTier: 'EPIC'
    };
  }

  if (VERBS.has(w1) && (NOUNS.has(w2) || ADJECTIVES.has(w2))) {
    return {
      isPhrase: true,
      phraseType: 'VERB_NOUN',
      label: 'Verb + Object',
      rarityTier: 'EPIC'
    };
  }

  return {
    isPhrase: true,
    phraseType: 'COMPOUND',
    label: 'Compound Bigram',
    rarityTier: 'EPIC'
  };
}
