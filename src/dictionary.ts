/**
 * Comprehensive curated dictionary of common and interesting English words
 * (lengths 3 to 12). Avoids spammy 1-2 letter words so discoveries are genuine.
 */
export const DICTIONARY: string[] = [
  // Core & Philosophical
  "PI", "GOD", "LIFE", "SOUL", "LOVE", "MIND", "TIME", "SPACE", "STAR", "SUN", "MOON", "EARTH",
  "ATOM", "WAVE", "LIGHT", "DARK", "VOID", "FIRE", "WIND", "WATER", "CODE", "DATA", "MATH", "BYTE",
  "TRUE", "WORD", "NAME", "PATH", "SEEK", "FIND", "KNOW", "THINK", "HOPE", "DREAM", "WISH", "FREE",
  "PEACE", "TRUTH", "FORCE", "POWER", "NATURE", "HUMAN", "BEING", "REALITY", "COSMOS", "INFINITE",
  "ETERNAL", "SPIRIT", "WISDOM", "REASON", "LOGIC", "CHAOS", "ORDER", "BEAUTY", "SECRET", "SILENCE",

  // Common Nouns (Nature, Objects, People)
  "WORLD", "PEOPLE", "MAN", "MEN", "WOMAN", "WOMEN", "CHILD", "FRIEND", "FAMILY", "HOME", "HOUSE",
  "ROOM", "DOOR", "WALL", "TREE", "FOREST", "BIRD", "FISH", "DOG", "CAT", "LION", "WOLF", "ROSE",
  "RIVER", "OCEAN", "SEA", "MOUNTAIN", "HILL", "ROAD", "CITY", "TOWN", "BOOK", "PAGE", "SONG",
  "MUSIC", "ART", "HAND", "EYE", "FACE", "HEAD", "HEART", "BODY", "VOICE", "SOUND", "BREATH",
  "GOLD", "IRON", "STONE", "ROCK", "CLOUD", "RAIN", "SNOW", "ICE", "SKY", "BLUE", "RED", "GOLD",
  "KING", "QUEEN", "HERO", "LEADER", "STORY", "TALE", "MEMORY", "SHADOW", "MIRROR", "WINDOW",

  // Verbs & Actions
  "WALK", "RUN", "FLY", "SWIM", "JUMP", "FALL", "RISE", "STAND", "SIT", "LOOK", "SEE", "HEAR",
  "LISTEN", "SPEAK", "TELL", "TALK", "WRITE", "READ", "SING", "DANCE", "PLAY", "WORK", "BUILD",
  "MAKE", "GIVE", "TAKE", "HOLD", "KEEP", "LEAVE", "COME", "GO", "MOVE", "STOP", "WAIT", "HELP",
  "FEEL", "TOUCH", "SMILE", "LAUGH", "CRY", "LIVE", "DIE", "BORN", "GROW", "CHANGE", "BEGIN", "END",
  "SAVE", "LOST", "WIN", "LOSE", "FIGHT", "HEAL", "BURN", "SHINE", "GLOW", "FLOW", "STAY", "PASS",

  // Computing & Science
  "NODE", "HOST", "LINK", "LOOP", "BIT", "BITS", "BYTES", "CHIP", "CORE", "CPU", "RAM", "ROM",
  "DISK", "FILE", "TREE", "GRAPH", "HASH", "ROOT", "LEAF", "PORT", "PING", "PONG", "SEND", "RECV",
  "USER", "AUTH", "PASS", "SALT", "SYNC", "ASYNC", "WAIT", "CALL", "FUNC", "TYPE", "CAST", "INIT",
  "EXIT", "HALT", "BOOT", "LOAD", "DUMP", "TEST", "DEBUG", "PUSH", "PULL", "MERGE", "CLONE", "FORK",
  "CLOUD", "EDGE", "WORKER", "FETCH", "PROXY", "ROUTER", "QUERY", "STORE", "CACHE", "STATE", "FLOW",

  // Adjectives & Qualities
  "GOOD", "BEST", "FINE", "PURE", "DEEP", "HIGH", "WIDE", "LONG", "FAST", "SLOW", "COLD", "WARM",
  "HOT", "SOFT", "HARD", "CALM", "WILD", "BRIGHT", "CLEAR", "SWEET", "DEAR", "KIND", "BRAVE", "BOLD",
  "NOBLE", "WISE", "SAFE", "ALIVE", "AWAKE", "STILL", "QUIET", "LOUD", "MAGIC", "GREAT", "GRAND",
  "HOLY", "SACRED", "SECRET", "LUCKY", "HAPPY", "PEACEFUL", "SILENT", "GOLDEN", "VIBRANT", "LUCID",

  // Additional 3-5 Letter High-Frequency English Words
  "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "ANY", "CAN", "HAD", "HER", "WAS", "ONE",
  "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO",
  "WAY", "WHO", "BOY", "DID", "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE", "THAT", "WITH", "HAVE",
  "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME",
  "VERY", "WHEN", "WHICH", "ABOUT", "AFTER", "AGAIN", "COULD", "FIRST", "GREAT", "LITTLE", "NEVER",
  "OTHER", "RIGHT", "SHALL", "THEIR", "THERE", "THESE", "THINK", "WHERE", "WHILE", "WOULD", "EVERY",
  "FOUND", "STILL", "BETWEEN", "WITHOUT", "THROUGH", "BEFORE", "AROUND", "ALWAYS", "ANOTHER"
];

// Build a fast lookup Set (normalized to UPPERCASE)
export const DICTIONARY_SET = new Set<string>(DICTIONARY.map(w => w.toUpperCase()));
