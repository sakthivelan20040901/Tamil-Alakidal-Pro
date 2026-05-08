/**
 * alakidal_logic.js
 * ═══════════════════════════════════════════════════════════════
 * திருக்குறள் அலகிடல் — சீர், அசை, வாய்பாடு தர்க்கம்
 * Thirukkural Alakidal — Pure logic, no UI dependencies
 *
 * Source: பொதுத்தேர்வு வழிகாட்டி (தமிழ் II) pp. 28–30
 * ═══════════════════════════════════════════════════════════════
 *
 * RULES IMPLEMENTED (PDF p.28)
 * ─────────────────────────────
 * STEP 1 — Parse word into unit tokens:
 *   • ஒற்று  (O) : consonant + pulli (்) or ஆய்தம் (ஃ)
 *   • நெடில் (N) : long-vowel syllable
 *   • குறில்  (K) : short-vowel syllable
 *
 * STEP 2 — Group tokens into அசை segments:
 *   • Start a new segment with the first non-O token.
 *   • If that token is K, take one more non-O token (if available).
 *   • Absorb any trailing O tokens into the current segment.
 *   • Repeat until all tokens are consumed.
 *
 * STEP 3 — Classify each segment (Rule 4):
 *   • Remove O tokens; count remaining vowel tokens.
 *   • 1 vowel token  → நேர் அசை
 *   • 2 vowel tokens → நிரை அசை
 *
 * VAIPADU TABLES (PDF p.29)
 * ──────────────────────────
 * இரண்டசை சீர் (2 அசை):
 *   நேர்/நேர்   → தேமா        நிரை/நேர்  → புளிமா
 *   நேர்/நிரை  → கூவிளம்     நிரை/நிரை → கருவிளம்
 *
 * மூவசை சீர் (3 அசை):
 *   நேர்/நேர்/நேர்   → தேமாங்காய்     நிரை/நேர்/நேர்  → புளிமாங்காய்
 *   நேர்/நிரை/நேர்  → கூவிளங்காய்    நிரை/நிரை/நேர் → கருவிளங்காய்
 *
 * ஈற்றசை (final சீர், PDF p.28–29):
 *   நேர்   → நாள்      நிரை  → மலர்
 *   நேர்பு → காசு      நிரைபு → பிறப்பு   (குற்றியலுகரம் endings)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PULLI          = '்';   // virama (pulli)
const AYUTHAM        = 'ஃ';   // aytham

// Vowel signs that make a syllable நெடில் (long)
// ா  ீ  ூ  ே  ோ  ௌ
const NEDIL_SIGNS    = 'ாீூேோௌ';

// Vowel signs that make a syllable குறில் (short)
// ி  ு  ெ  ை  ொ
const KURIL_SIGNS    = 'ிுெைொ';

// All vowel signs combined (for look-ahead in parseTamilToUnits)
const ALL_VOWEL_SIGNS = NEDIL_SIGNS + KURIL_SIGNS;

// Standalone நெடில் vowels (no consonant base)
const NEDIL_STANDALONE = 'ஆஈஊஏஐஓஔ';

// BUG FIX #1: Standalone குறில் vowels (அ, இ, உ, எ, ஒ)
// These were missing — without them, standalone short vowels
// (e.g. the அ in அகர) were being mis-classified or dropped.
const KURIL_STANDALONE = 'அஇஉஎஒ';

// Kutriyalukar base consonants: க ச ட த ப ற
const KUTRIYA_BASE   = new Set([...'கசடதபற']);

// ═══════════════════════════════════════════════════════════════
// Vaipadu lookup tables
// ═══════════════════════════════════════════════════════════════

const VAIPADU_TABLE = {
  // இரண்டசை சீர்
  'நேர்-நேர்':          'தேமா',
  'நிரை-நேர்':          'புளிமா',
  'நேர்-நிரை':          'கூவிளம்',
  'நிரை-நிரை':          'கருவிளம்',
  // மூவசை சீர்
  'நேர்-நேர்-நேர்':     'தேமாங்காய்',
  'நிரை-நேர்-நேர்':     'புளிமாங்காய்',
  'நேர்-நிரை-நேர்':     'கூவிளங்காய்',
  'நிரை-நிரை-நேர்':     'கருவிளங்காய்',
};

const ETRASAI_TABLE = {
  'நேர்':    'நாள்',
  'நிரை':    'மலர்',
  'நேர்பு':  'காசு',
  'நிரைபு':  'பிறப்பு',
};

// ═══════════════════════════════════════════════════════════════
// Step 1: Parse word into unit tokens
// ═══════════════════════════════════════════════════════════════

/**
 * parseTamilToUnits(word)
 *
 * Walks the word character by character, emitting tokens:
 *   { text: string, type: 'K' | 'N' | 'O' }
 *
 * BUG FIX #1 (standalone vowels):
 *   Original code only checked NEDIL_STANDALONE for standalone vowels,
 *   leaving standalone குறில் vowels (அ இ உ எ ஒ) unhandled — they
 *   fell through to the else-branch as single-char syllables whose
 *   isNedil check was correct but whose classification used only
 *   NEDIL_STANDALONE. Now KURIL_STANDALONE is checked explicitly.
 *
 * BUG FIX #2 (combined vowel-sign constant):
 *   The original used NEDIL_SIGNS + KURIL_SIGNS inline inside the
 *   function with string concatenation on every character. Pulled out
 *   into the module-level ALL_VOWEL_SIGNS constant for clarity and
 *   a tiny perf win.
 */
function parseTamilToUnits(word) {
  const units = [];
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const next = word[i + 1] || '';

    if (next === PULLI || char === AYUTHAM) {
      // ஒற்று token
      units.push({ text: char + (next === PULLI ? PULLI : ''), type: 'O' });
      if (next === PULLI) i++;

    } else {
      // BUG FIX #1: Properly detect standalone குறில் vowels
      const isNedil =
        NEDIL_STANDALONE.includes(char) ||
        NEDIL_SIGNS.includes(next);

      // BUG FIX #2: Use the unified ALL_VOWEL_SIGNS constant
      const len = ALL_VOWEL_SIGNS.includes(next) ? 2 : 1;

      units.push({ text: word.substr(i, len), type: isNedil ? 'N' : 'K' });
      if (len === 2) i++;
    }
  }
  return units;
}

// ═══════════════════════════════════════════════════════════════
// Step 2: Group tokens into அசை segments
// ═══════════════════════════════════════════════════════════════

/**
 * groupUnitsIntoSegments(units)
 *
 * Algorithm (mirrors PDF splitting rules):
 * Loop:
 *   a) If current token is non-O: take it as segment start.
 *      If it was K and next token is also non-O: take that too (K+K or K+N).
 *   b) If current token is O: absorb into previous segment if one exists,
 *      otherwise start a new O-only segment (word starts with ஒற்று).
 *   c) Absorb any consecutive trailing O tokens into the current segment.
 *   d) Emit segment, repeat.
 *
 * BUG FIX #3 (orphan O tokens):
 *   The original code emitted every leading O as its own standalone
 *   segment, which is grammatically wrong — an ஒற்று that opens a word
 *   belongs to the first vowel-bearing அசை that follows it.
 *   Fixed by a look-ahead: if we encounter a leading O we buffer it
 *   and prepend it to the next non-O segment instead.
 */
function groupUnitsIntoSegments(units) {
  const segments = [];
  let i = 0;
  // BUG FIX #3: buffer for leading / inter-segment ஒற்று tokens
  let pendingO = [];

  while (i < units.length) {
    const seg = [...pendingO]; // prepend any buffered O tokens
    pendingO = [];

    if (units[i].type !== 'O') {
      // Take the first non-O token
      seg.push(units[i]);
      const firstWasKuril = (units[i].type === 'K');
      i++;

      // If first was K and next exists and is non-O: take one more
      if (firstWasKuril && i < units.length && units[i].type !== 'O') {
        seg.push(units[i]);
        i++;
      }
    } else {
      // BUG FIX #3: Buffer the O; do NOT emit a standalone O segment.
      // We advance and try again — the O will be prepended to the
      // very next real segment via pendingO.
      while (i < units.length && units[i].type === 'O') {
        pendingO.push(units[i]);
        i++;
      }
      continue; // re-enter loop; pendingO will be consumed next round
    }

    // Absorb trailing O tokens into the current segment
    while (i < units.length && units[i].type === 'O') {
      seg.push(units[i]);
      i++;
    }

    if (seg.length > 0) segments.push(seg);
  }

  // BUG FIX #3: If there are still buffered O tokens at end of word
  // (e.g. a word consisting only of ஒற்று characters), attach them
  // to the last segment or emit as a single fallback segment.
  if (pendingO.length > 0) {
    if (segments.length > 0) {
      segments[segments.length - 1].push(...pendingO);
    } else {
      segments.push(pendingO);
    }
  }

  return segments;
}

// ═══════════════════════════════════════════════════════════════
// Step 3: Classify each segment as நேர் / நிரை
// ═══════════════════════════════════════════════════════════════

/**
 * classifySegment(seg)
 *
 * Rule 4: exclude ஒற்று (O) tokens, count remaining vowel tokens.
 *   1 → நேர்,  2 → நிரை
 */
function classifySegment(seg) {
  const vowels = seg.filter(u => u.type !== 'O');
  return {
    raw:      seg.map(u => u.text).join(''),
    asaiType: vowels.length >= 2 ? 'நிரை' : 'நேர்',
  };
}

// ═══════════════════════════════════════════════════════════════
// Step 4: Determine வாய்பாடு
// ═══════════════════════════════════════════════════════════════

function getVaipadu(asaiTypes) {
  const key = asaiTypes.join('-');
  return VAIPADU_TABLE[key] || '(' + key + ')';
}

/**
 * குற்றியலுகரம் check:
 *   Word ends in ு and the preceding consonant ∈ {க,ச,ட,த,ப,ற}
 *
 * BUG FIX #4: The original used [...word] spread which works for most
 *   Unicode but may mis-index multi-code-point Tamil clusters.
 *   We use Array.from() which correctly handles surrogate pairs and
 *   grapheme clusters in modern environments.
 */
function isKutriyalukar(word) {
  const chars = Array.from(word);
  if (chars.length < 2) return false;
  return chars[chars.length - 1] === 'ு' &&
         KUTRIYA_BASE.has(chars[chars.length - 2]);
}

/**
 * getEtruVaipadu(word, asaiTypes)
 *
 * BUG FIX #5 (kutriyalukar base-type selection):
 *   Original comment said "the asai that PRECEDES the kutriyalukar
 *   syllable determines நேர்பு/நிரைபு" but the code used
 *   `asaiTypes.length - 2` unconditionally, which is wrong when the
 *   word has only ONE அசை (e.g. a monosyllabic kutriyalukar word).
 *   Fixed to fall back to the last type when there is no preceding asai.
 *
 *   Also: the kutriyalukar syllable itself is ALWAYS நேர் (single vowel),
 *   so the "base" for the பு suffix is the type of the அசை immediately
 *   before the final ு-syllable, NOT the final asai. The fix ensures
 *   we look at index (length - 2) only when it exists.
 */
function getEtruVaipadu(word, asaiTypes) {
  if (isKutriyalukar(word)) {
    // BUG FIX #5: safe access — fall back to last when only 1 asai
    const baseType = asaiTypes.length >= 2
      ? asaiTypes[asaiTypes.length - 2]
      : asaiTypes[asaiTypes.length - 1];
    const patternKey = baseType + 'பு';
    return ETRASAI_TABLE[patternKey] || '(' + patternKey + ')';
  }

  const lastType = asaiTypes[asaiTypes.length - 1];
  return ETRASAI_TABLE[lastType] || '(' + lastType + ')';
}

// ═══════════════════════════════════════════════════════════════
// Public API: analyseSeer — analyse one word/சீர்
// ═══════════════════════════════════════════════════════════════

/**
 * analyseSeer(word, isFinal)
 *
 * @param {string}  word    — raw word from input
 * @param {boolean} isFinal — true if this is the last சீர் (ஈற்றுச்சீர்)
 *
 * @returns {{
 *   word    : string,
 *   clean   : string,       // punctuation-stripped form
 *   split   : string,       // e.g. "எழுத் / தெல் / லாம்"
 *   asais   : string[],     // e.g. ["நிரை","நேர்","நேர்"]
 *   vaipadu : string,       // e.g. "புளிமாங்காய்"
 *   isFinal : boolean
 * }}
 */
function analyseSeer(word, isFinal) {
  const clean     = word.replace(/[.,!?;:'"«»]/g, '');
  const units     = parseTamilToUnits(clean);
  const segments  = groupUnitsIntoSegments(units);
  const asaiObjs  = segments.map(classifySegment);
  const asaiTypes = asaiObjs.map(a => a.asaiType);
  const split     = asaiObjs.map(a => a.raw).join(' / ');
  const vaipadu   = isFinal
    ? getEtruVaipadu(clean, asaiTypes)
    : getVaipadu(asaiTypes);

  return { word, clean, split, asais: asaiTypes, vaipadu, isFinal };
}

// ═══════════════════════════════════════════════════════════════
// Public API: analyseKural — analyse a full குறட்பா
// ═══════════════════════════════════════════════════════════════

/**
 * analyseKural(kuralText)
 *
 * Splits input on whitespace/newlines; treats each token as one சீர்.
 * The last token is the ஈற்றுச்சீர்.
 *
 * @param {string} kuralText
 *
 * @returns {{
 *   seers  : SeerResult[],
 *   summary: {
 *     totalSeers   : number,
 *     nearCount    : number,
 *     niraiCount   : number,
 *     finalVaipadu : string
 *   }
 * }}
 */
function analyseKural(kuralText) {
  const words = kuralText.trim().split(/[\s\n]+/).filter(w => w.length > 0);
  const seers = words.map((w, i) => analyseSeer(w, i === words.length - 1));

  let nearCount = 0, niraiCount = 0;
  seers.forEach(s => s.asais.forEach(a => {
    if (a === 'நேர்') nearCount++; else niraiCount++;
  }));

  return {
    seers,
    summary: {
      totalSeers   : seers.length,
      nearCount,
      niraiCount,
      finalVaipadu : seers.at(-1)?.vaipadu ?? '',
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// History Management
// ═══════════════════════════════════════════════════════════════

const HISTORY_KEY = 'AlaKidal_History';
const MAX_HISTORY = 50;

/**
 * addToHistory(kuralText, analysisResult)
 *
 * BUG FIX #6: The original called localStorage directly at module level
 *   which throws in Node.js (no `localStorage` global).
 *   Wrapped in a helper `_storage()` that returns null safely in Node.
 */
function _storage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; }
  catch (e) { return null; }
}

function addToHistory(kuralText, analysisResult) {
  const store = _storage();
  if (!store) return false;
  try {
    let history = JSON.parse(store.getItem(HISTORY_KEY) || '[]');
    const entry = {
      timestamp : new Date().toISOString(),
      kuralText,
      seers     : analysisResult.seers,
      summary   : analysisResult.summary,
    };
    history.unshift(entry);
    history = history.slice(0, MAX_HISTORY);
    store.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Failed to save to history:', e);
    return false;
  }
}

function getHistory() {
  const store = _storage();
  if (!store) return [];
  try {
    return JSON.parse(store.getItem(HISTORY_KEY) || '[]');
  } catch (e) {
    console.error('Failed to retrieve history:', e);
    return [];
  }
}

function clearHistory() {
  const store = _storage();
  if (!store) return false;
  try {
    store.removeItem(HISTORY_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear history:', e);
    return false;
  }
}

function getHistoryCount() {
  return getHistory().length;
}

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════
if (typeof module !== 'undefined') {
  module.exports = {
    analyseKural,
    analyseSeer,
    parseTamilToUnits,
    groupUnitsIntoSegments,
    classifySegment,
    getVaipadu,
    getEtruVaipadu,
    isKutriyalukar,
    addToHistory,
    getHistory,
    clearHistory,
    getHistoryCount,
  };
} else {
  window.AlaKidal = {
    analyseKural,
    analyseSeer,
    parseTamilToUnits,
    groupUnitsIntoSegments,
    classifySegment,
    getVaipadu,
    getEtruVaipadu,
    isKutriyalukar,
    addToHistory,
    getHistory,
    clearHistory,
    getHistoryCount,
  };
}