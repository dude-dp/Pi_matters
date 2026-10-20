// Pi Matters · Turbo Swarm Web Worker Miner
// Autonomous in-browser BBP computation, 5-bit natural alphabet decoding & linguistic matcher

(function () {
  let isMining = false;
  let leaseSize = 500;
  let sessionDigitsMined = 0;
  let sessionWordsFound = 0;

  // ---------------- Mathematical Engine (BBP Spigot Formula) ---------------- //

  function modPow(base, exp, modulus) {
    if (modulus === 1) return 0;
    let result = 1n;
    let b = BigInt(base) % BigInt(modulus);
    let e = BigInt(exp);
    const m = BigInt(modulus);

    while (e > 0n) {
      if (e & 1n) {
        result = (result * b) % m;
      }
      b = (b * b) % m;
      e >>= 1n;
    }

    return Number(result);
  }

  function seriesSum(j, d) {
    let s = 0;
    for (let k = 0; k <= d; k++) {
      const denominator = 8 * k + j;
      const numerator = modPow(16, d - k, denominator);
      s += numerator / denominator;
      s = s - Math.floor(s);
    }
    let termPower = 1.0;
    for (let k = d + 1; ; k++) {
      termPower /= 16.0;
      if (termPower === 0 || termPower < 1e-15) break;
      const term = termPower / (8 * k + j);
      if (term < 1e-17) break;
      s += term;
      s = s - Math.floor(s);
    }
    return s;
  }

  function bbpFraction(d) {
    const s1 = seriesSum(1, d);
    const s4 = seriesSum(4, d);
    const s5 = seriesSum(5, d);
    const s6 = seriesSum(6, d);

    let frac = 4.0 * s1 - 2.0 * s4 - s5 - s6;
    frac = frac - Math.floor(frac);
    if (frac < 0) frac += 1.0;
    return frac;
  }

  function getPiHexDigit(d) {
    const frac = bbpFraction(d);
    const digitVal = Math.floor(16.0 * frac);
    return digitVal.toString(16).toUpperCase();
  }

  function getPiHexDigits(startDigit, count) {
    let hex = '';
    for (let i = 0; i < count; i++) {
      hex += getPiHexDigit(startDigit + i);
    }
    return hex;
  }

  function hexToBinary(hex) {
    let binary = '';
    for (let i = 0; i < hex.length; i++) {
      const val = parseInt(hex[i], 16);
      if (!isNaN(val)) {
        binary += val.toString(2).padStart(4, '0');
      }
    }
    return binary;
  }

  // ---------------- 5-Bit Natural Alphabet Decoder ---------------- //

  function fiveBitToChar(val) {
    if (val === 0 || val === 31) return ' ';
    if (val >= 1 && val <= 26) return String.fromCharCode(64 + val); // 1 = 'A'
    if (val === 27) return '.';
    if (val === 28) return ',';
    if (val === 29) return '!';
    if (val === 30) return '?';
    return ' ';
  }

  // ---------------- Lexicon & Grammatical Classification ---------------- //

  const DICTIONARY_WORDS = [
    "PI", "GOD", "LIFE", "SOUL", "LOVE", "MIND", "TIME", "SPACE", "STAR", "SUN", "MOON", "EARTH",
    "ATOM", "WAVE", "LIGHT", "DARK", "VOID", "FIRE", "WIND", "WATER", "CODE", "DATA", "MATH", "BYTE",
    "TRUE", "WORD", "NAME", "PATH", "SEEK", "FIND", "KNOW", "THINK", "HOPE", "DREAM", "WISH", "FREE",
    "PEACE", "TRUTH", "FORCE", "POWER", "NATURE", "HUMAN", "BEING", "REALITY", "COSMOS", "INFINITE",
    "ETERNAL", "SPIRIT", "WISDOM", "REASON", "LOGIC", "CHAOS", "ORDER", "BEAUTY", "SECRET", "SILENCE",
    "FATE", "DESTINY", "CHANCE", "KARMA", "ESSENCE", "ORIGIN", "SPARK", "GENIUS", "INSIGHT", "INTENT",
    "WORLD", "PLANET", "ORBIT", "GRAVITY", "ENERGY", "MATTER", "FIELD", "PULSAR", "QUASAR", "NEBULA",
    "AURORA", "ZENITH", "HORIZON", "COMET", "SOLAR", "LUNAR", "STELLAR", "ASTRAL", "GALAXY", "CLUSTER",
    "OCEAN", "SEA", "TIDE", "SURF", "RIVER", "STREAM", "BROOK", "LAKE", "POND", "RAIN", "STORM", "MIST",
    "CLOUD", "FOG", "DEW", "FROST", "SNOW", "ICE", "HAIL", "WIND", "BREEZE", "GALE", "FLAME", "EMBER",
    "SPARK", "SMOKE", "ASH", "DUST", "CLAY", "ROCK", "STONE", "PEBBLE", "SAND", "SOIL", "CAVE", "CLIFF",
    "HILL", "PEAK", "VALLEY", "CANON", "DESERT", "ISLAND", "REEF", "SHORE", "COAST", "BEACH", "FOREST",
    "WOODS", "GROVE", "JUNGLE", "TREE", "OAK", "PINE", "CEDAR", "BIRCH", "LEAF", "BRANCH", "ROOT",
    "SEED", "PLANT", "FLOWER", "ROSE", "LILY", "LOTUS", "BLOOM", "GRASS", "MOSS", "FERN", "HERB",
    "BIRD", "EAGLE", "HAWK", "DOVE", "SWAN", "OWL", "RAVEN", "CROW", "LARK", "ROBIN", "FISH", "WHALE",
    "SHARK", "DOLPHIN", "CORAL", "LION", "TIGER", "BEAR", "WOLF", "FOX", "DEER", "STAG", "HORSE",
    "COLT", "BULL", "RAM", "LAMB", "DOG", "CAT", "HARE", "SEAL", "OTTER", "SWAN", "FALCON", "VIPER",
    "MAN", "MEN", "WOMAN", "WOMEN", "CHILD", "YOUTH", "BABY", "ELDER", "FRIEND", "FAMILY", "PEOPLE",
    "PERSON", "CITIZEN", "HERO", "LEADER", "RULER", "KING", "QUEEN", "PRINCE", "KNIGHT", "MASTER",
    "ARTIST", "POET", "SAGE", "PILGRIM", "SAILOR", "SOLDIER", "FARMER", "BUILDER", "MAKER", "GUIDE",
    "HOME", "HOUSE", "CABIN", "CASTLE", "TOWER", "TEMPLE", "SHRINE", "DOME", "HALL", "ROOM", "GATE",
    "DOOR", "WALL", "ROOF", "ARCH", "PILLAR", "BRIDGE", "ROAD", "PATH", "STREET", "CITY", "TOWN",
    "VILLAGE", "PORT", "HARBOR", "HAVEN", "MARKET", "PLAZA", "COURT", "ALTAR", "THRONE",
    "SEEK", "FIND", "DISCOVER", "REVEAL", "UNVEIL", "KNOW", "LEARN", "TEACH", "THINK", "PONDER",
    "WONDER", "DREAM", "ENVISION", "HOPE", "BELIEVE", "TRUST", "LOVE", "CHERISH", "CARE", "HEAL",
    "COMFORT", "BLESS", "CREATE", "DESIGN", "CRAFT", "BUILD", "SHAPE", "MOLD", "WEAVE", "SPIN",
    "DRAW", "PAINT", "WRITE", "COMPOSE", "SING", "CHANT", "PLAY", "DANCE", "SPEAK", "UTTER",
    "WHISPER", "CALL", "SHOUT", "HEAR", "LISTEN", "ATTEND", "SEE", "WATCH", "GAZE", "BEHOLD",
    "LOOK", "SCAN", "TRACE", "TRACK", "WALK", "TREAD", "STRIDE", "RUN", "SPRINT", "RACE",
    "FLY", "SOAR", "GLIDE", "HOVER", "LEAP", "BOUND", "CLIMB", "SCALE", "ASCEND", "RISE",
    "FALL", "DROP", "DESCEND", "PLUNGE", "DIVE", "SWIM", "FLOAT", "DRIFT", "SAIL", "VOYAGE",
    "JOURNEY", "TRAVEL", "WANDER", "ROAM", "REST", "SLEEP", "AWAKEN", "WAKE", "STIR", "BREATHE",
    "LIVE", "THRIVE", "FLOURISH", "GROW", "EXPAND", "SHINE", "RADIATE", "GLOW", "BEAM", "FLASH",
    "SPARKLE", "IGNITE", "BURN", "BLAZE", "KINDLE", "FLOW", "STREAM", "SURGE", "POUR", "RUSH",
    "STAND", "ENDURE", "PERSIST", "PREVAIL", "SUCCEED", "ACHIEVE", "TRIUMPH", "OVERCOME",
    "NODE", "HOST", "LINK", "LOOP", "BIT", "BITS", "BYTE", "BYTES", "CHIP", "CORE", "CPU", "GPU",
    "RAM", "ROM", "DISK", "FILE", "ARRAY", "QUEUE", "STACK", "TREE", "GRAPH", "TABLE", "HASH",
    "BLOCK", "CHAIN", "TOKEN", "ROOT", "LEAF", "PORT", "SOCKET", "PACKET", "FRAME", "STREAM",
    "BUFFER", "CACHE", "STATE", "STORE", "EVENT", "SIGNAL", "THREAD", "FIBER", "PROCESS", "TASK",
    "PIPELINE", "ROUTER", "GATEWAY", "PROXY", "CLIENT", "SERVER", "WORKER", "SERVICE", "DAEMON",
    "DATABASE", "QUERY", "INDEX", "CURSOR", "RECORD", "ENTRY", "SCHEMA", "TRANSACT", "COMMIT",
    "ROLLBACK", "SYNC", "ASYNC", "PROMISE", "FUTURE", "CHANNEL", "LOCK", "MUTEX", "ATOMIC",
    "BINARY", "DIGIT", "OCTAL", "HEX", "RADIX", "FLOAT", "INT", "STRING", "CHAR", "CODE",
    "SYNTAX", "PARSER", "LEXER", "AST", "BYTECODE", "OPCODE", "MEMORY", "ADDRESS", "POINTER",
    "OFFSET", "STRIDE", "SPIGOT", "FORMULA", "SERIES", "SUM", "MATRIX", "VECTOR", "TENSOR",
    "PURE", "CLEAR", "LUCID", "BRIGHT", "LUMINOUS", "RADIANT", "SHINING", "GOLDEN", "SILVER",
    "AZURE", "VERDANT", "VIBRANT", "CRYSTAL", "SERENE", "TRANQUIL", "CALM", "PEACEFUL", "STILL",
    "QUIET", "SILENT", "GENTLE", "TENDER", "KIND", "NOBLE", "BRAVE", "VALIANT", "BOLD",
    "FEARLESS", "TRUE", "FAITHFUL", "LOYAL", "HONEST", "JUST", "RIGHT", "SACRED", "HOLY",
    "DIVINE", "MYSTIC", "SECRET", "HIDDEN", "COSMIC", "STELLAR", "INFINITE", "BOUNDLESS", "ETERNAL",
    "TIMELESS", "ENDLESS", "VAST", "IMMENSE", "DEEP", "PROFOUND", "WISE", "CLEVER", "KEEN",
    "SHARP", "QUICK", "SWIFT", "FLEET", "AGILE", "NIMBLE", "STRONG", "ROBUST", "HARDY",
    "SOLID", "STEADY", "SECURE", "SAFE", "ALIVE", "VITAL", "WHOLE", "SOUND", "NEW", "FRESH",
    "NOVEL", "ANCIENT", "PRIME", "GRAND", "GREAT", "FINE", "SWEET", "WARM", "COOL", "SOFT",
    "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "ANY", "CAN", "HAD", "HER", "WAS", "ONE",
    "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "NOW", "OLD", "TWO", "WAY", "WHO", "BOY",
    "DID", "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE", "THAT", "WITH", "HAVE", "THIS", "WILL",
    "YOUR", "FROM", "THEY", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "VERY", "WHEN", "WHICH", "ABOUT",
    "AFTER", "AGAIN", "COULD", "FIRST", "LITTLE", "NEVER", "OTHER", "SHALL", "THEIR", "THERE", "THESE",
    "WHERE", "WHILE", "WOULD", "EVERY", "FOUND", "BETWEEN", "WITHOUT", "THROUGH", "BEFORE", "AROUND", "ALWAYS"
  ];

  const DICT_SET = new Set(DICTIONARY_WORDS);

  const ADJ_SET = new Set([
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

  const NOUN_SET = new Set([
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

  const VERB_SET = new Set([
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

  const PREP_SET = new Set([
    'IN', 'ON', 'AT', 'TO', 'FOR', 'WITH', 'FROM', 'BY', 'INTO', 'OVER',
    'UNDER', 'AFTER', 'BEFORE', 'BETWEEN', 'WITHOUT', 'THROUGH', 'AROUND'
  ]);

  const PRON_SET = new Set([
    'I', 'YOU', 'HE', 'SHE', 'IT', 'WE', 'THEY', 'ALL', 'WHO', 'THIS', 'THAT'
  ]);

  function classifyPhrase(words) {
    if (words.length <= 1) {
      const word = words[0] || '';
      let rarityTier = 'COMMON';
      if (word.length >= 6) rarityTier = 'RARE';
      else if (word.length >= 4) rarityTier = 'UNCOMMON';
      return { isPhrase: false, phraseType: 'WORD', label: 'Single Word', rarityTier };
    }

    const [w1, w2, w3] = words;
    if (words.length === 3 && w1 && w2 && w3) {
      if ((PRON_SET.has(w1) || NOUN_SET.has(w1)) && VERB_SET.has(w2) && (NOUN_SET.has(w3) || ADJ_SET.has(w3))) {
        return { isPhrase: true, phraseType: 'TRI_SENTENCE', label: 'Subject + Verb + Object', rarityTier: 'MYTHIC' };
      }
      return { isPhrase: true, phraseType: 'COMPOUND', label: '3-Word Sequence', rarityTier: 'MYTHIC' };
    }

    if (ADJ_SET.has(w1) && NOUN_SET.has(w2)) {
      return { isPhrase: true, phraseType: 'ADJ_NOUN', label: 'Adjective + Noun', rarityTier: 'EPIC' };
    }
    if ((PRON_SET.has(w1) || NOUN_SET.has(w1)) && VERB_SET.has(w2)) {
      return { isPhrase: true, phraseType: 'SUBJ_VERB', label: 'Subject + Verb', rarityTier: 'EPIC' };
    }
    if (PREP_SET.has(w1) && NOUN_SET.has(w2)) {
      return { isPhrase: true, phraseType: 'PREP_NOUN', label: 'Preposition + Noun', rarityTier: 'EPIC' };
    }
    if (VERB_SET.has(w1) && (NOUN_SET.has(w2) || ADJ_SET.has(w2))) {
      return { isPhrase: true, phraseType: 'VERB_NOUN', label: 'Verb + Object', rarityTier: 'EPIC' };
    }

    return { isPhrase: true, phraseType: 'COMPOUND', label: 'Compound Bigram', rarityTier: 'EPIC' };
  }

  // ---------------- High-Throughput Lexical Matcher ---------------- //

  function scanHexForMatches(hex, startDigitIndex) {
    const minLength = 3;
    const maxLength = 10;
    const bitShifts = [0, 1, 2, 3, 4];
    const binary = hexToBinary(hex);
    const matches = [];
    const seenKeys = new Set();

    for (const bitOffset of bitShifts) {
      const chars = [];
      for (let b = bitOffset; b + 5 <= binary.length; b += 5) {
        const val = parseInt(binary.slice(b, b + 5), 2);
        chars.push({ char: fiveBitToChar(val), bitPos: b });
      }

      const fullString = chars.map(c => c.char).join('');
      const tokens = [];

      // Single word detection
      for (let len = minLength; len <= maxLength; len++) {
        for (let i = 0; i + len <= fullString.length; i++) {
          const candidate = fullString.slice(i, i + len).toUpperCase();
          if (!/^[A-Z]+$/.test(candidate)) continue;

          if (DICT_SET.has(candidate)) {
            const startBit = chars[i].bitPos;
            const endBit = chars[i + len - 1].bitPos + 5;
            tokens.push({ word: candidate, charStart: i, charEnd: i + len, bitStart: startBit, bitEnd: endBit });

            const hexDigitStart = startDigitIndex + Math.floor(startBit / 4);
            const hexDigitEnd = startDigitIndex + Math.ceil(endBit / 4);
            const key = `WORD-${candidate}-${hexDigitStart}-${hexDigitEnd}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const localHexStart = Math.max(0, Math.floor(startBit / 4) - 4);
              const localHexEnd = Math.min(hex.length, Math.ceil(endBit / 4) + 4);
              const hexSnippet = hex.slice(localHexStart, localHexEnd);
              const binarySnippet = binary.slice(Math.max(0, startBit - 5), Math.min(binary.length, endBit + 5));
              const decodedAscii = fullString.slice(Math.max(0, i - 2), Math.min(fullString.length, i + len + 2));
              const classification = classifyPhrase([candidate]);

              matches.push({
                word: candidate,
                length: candidate.length,
                digitStart: hexDigitStart,
                digitEnd: hexDigitEnd,
                hexSnippet,
                binarySnippet,
                decodedAscii,
                bitOffset,
                isPhrase: false,
                phraseType: 'WORD',
                phraseLabel: classification.label,
                rarityTier: classification.rarityTier,
                wordCount: 1,
                encoding: '5-BIT'
              });
            }
          }
        }
      }

      // Multi-word phrase stitching
      if (tokens.length >= 2) {
        tokens.sort((a, b) => a.charStart - b.charStart || a.charEnd - b.charEnd);
        for (let i = 0; i < tokens.length; i++) {
          const t1 = tokens[i];
          for (let j = i + 1; j < tokens.length; j++) {
            const t2 = tokens[j];
            const gap = t2.charStart - t1.charEnd;
            if (gap < 0) continue;
            if (gap > 1) break;

            const phraseWord = `${t1.word} ${t2.word}`;
            const hexDigitStart = startDigitIndex + Math.floor(t1.bitStart / 4);
            const hexDigitEnd = startDigitIndex + Math.ceil(t2.bitEnd / 4);
            const key = `PHRASE-${phraseWord}-${hexDigitStart}-${hexDigitEnd}`;

            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const classification = classifyPhrase([t1.word, t2.word]);
              const hexSnippet = hex.slice(Math.max(0, Math.floor(t1.bitStart / 4) - 2), Math.min(hex.length, Math.ceil(t2.bitEnd / 4) + 2));
              const binarySnippet = binary.slice(Math.max(0, t1.bitStart - 5), Math.min(binary.length, t2.bitEnd + 5));
              const decodedAscii = fullString.slice(Math.max(0, t1.charStart - 2), Math.min(fullString.length, t2.charEnd + 2));

              matches.push({
                word: phraseWord,
                length: phraseWord.length,
                digitStart: hexDigitStart,
                digitEnd: hexDigitEnd,
                hexSnippet,
                binarySnippet,
                decodedAscii,
                bitOffset,
                isPhrase: true,
                phraseType: classification.phraseType,
                phraseLabel: classification.label,
                rarityTier: classification.rarityTier,
                wordCount: 2,
                encoding: '5-BIT'
              });
            }
          }
        }
      }
    }

    return matches;
  }

  // ---------------- Mining Swarm Loop ---------------- //

  async function mineNextChunk() {
    if (!isMining) return;

    try {
      // 1. Lease a disjoint chunk of Pi digits
      const leaseRes = await fetch(`/api/lease-job?size=${leaseSize}`);
      if (!leaseRes.ok) {
        throw new Error(`Lease failed with status ${leaseRes.status}`);
      }
      const leaseData = await leaseRes.json();
      const { startDigit, blockSize } = leaseData;

      // 2. High-speed BBP computation in Worker Thread
      const t0 = performance.now();
      const hex = getPiHexDigits(startDigit, blockSize);
      const mathTimeMs = performance.now() - t0;

      // 3. Scan for English words & multi-word phrases
      const matches = scanHexForMatches(hex, startDigit);

      const totalTimeMs = performance.now() - t0;
      const digitsPerSec = Math.round((blockSize / (totalTimeMs / 1000)));

      sessionDigitsMined += blockSize;
      sessionWordsFound += matches.length;

      // Notify main thread of live progress
      self.postMessage({
        type: 'PROGRESS',
        startDigit,
        blockSize,
        hexSnippet: hex.slice(0, 32),
        digitsPerSec,
        mathTimeMs,
        totalTimeMs,
        sessionDigitsMined,
        sessionWordsFound,
        matches
      });

      // 4. Submit discoveries with Cryptographic Spot-Checking
      const contributeRes = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDigit,
          count: blockSize,
          hexSnippet: hex.slice(0, 32),
          discoveries: matches
        })
      });

      if (contributeRes.ok) {
        const contributeData = await contributeRes.json();
        self.postMessage({
          type: 'COMMITTED',
          startDigit,
          blockSize,
          acceptedDiscoveries: contributeData.acceptedDiscoveries,
          matches
        });
      }

      // Schedule next chunk seamlessly
      if (isMining) {
        setTimeout(mineNextChunk, 20);
      }
    } catch (err) {
      console.warn('[Miner Worker] Chunk error:', err);
      self.postMessage({ type: 'ERROR', error: String(err) });
      if (isMining) {
        setTimeout(mineNextChunk, 3000); // Backoff on network failure
      }
    }
  }

  // ---------------- Message Handler ---------------- //

  self.onmessage = function (e) {
    const data = e.data || {};
    if (data.type === 'START') {
      if (isMining) return;
      isMining = true;
      if (data.leaseSize) leaseSize = data.leaseSize;
      self.postMessage({ type: 'STATUS', status: 'MINING' });
      mineNextChunk();
    } else if (data.type === 'STOP') {
      isMining = false;
      self.postMessage({ type: 'STATUS', status: 'PAUSED' });
    }
  };
})();
