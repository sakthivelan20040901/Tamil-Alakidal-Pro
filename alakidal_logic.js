/**
 * alakidal_logic.js
 * ═══════════════════════════════════════════════════════════════
 * திருக்குறள் அலகிடல் — சீர், அசை, வாய்பாடு தர்க்கம்
 * Thirukkural Alakidal — Pure logic, no UI dependencies
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PULLI          = '்';   // virama (pulli)
const AYUTHAM        = 'ஃ';   // aytham

// Vowel signs that make a syllable நெடில் (long)
// ா  ீ  ூ  ே  ோ  ௌ  ை (ை is 'ai' which is traditionally Nedil)
const NEDIL_SIGNS    = 'ாீூேோௌை';

// Vowel signs that make a syllable குறில் (short)
// ி  ு  ெ  ொ
const KURIL_SIGNS    = 'ிுெொ';

// All vowel signs combined (for look-ahead in parseTamilToUnits)
const ALL_VOWEL_SIGNS = NEDIL_SIGNS + KURIL_SIGNS;

// Standalone நெடில் vowels (no consonant base)
const NEDIL_STANDALONE = 'ஆஈஊஏஐஓஔ';

// Standalone குறில் vowels (அ, இ, உ, எ, ஒ)
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
 * Walks the word character by character, emitting tokens:
 * { text: string, type: 'K' | 'N' | 'O' }
 */
function parseTamilToUnits(word) {
  const units = [];
  const chars = Array.from(word);
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const next = chars[i + 1] || '';

    if (next === PULLI || char === AYUTHAM) {
      // ஒற்று token
      units.push({ text: char + (next === PULLI ? PULLI : ''), type: 'O' });
      if (next === PULLI) i++;
    } else {
      let isNedil = false;
      // Guard against JS String.prototype.includes("") returning true
      const hasVowelSign = next !== '' && ALL_VOWEL_SIGNS.includes(next);

      if (hasVowelSign) {
        isNedil = NEDIL_SIGNS.includes(next);
      } else {
        isNedil = NEDIL_STANDALONE.includes(char);
      }

      const len = hasVowelSign ? 2 : 1;
      units.push({ 
        text: chars.slice(i, i + len).join(''), 
        type: isNedil ? 'N' : 'K' 
      });
      if (hasVowelSign) i++;
    }
  }
  return units;
}

// ═══════════════════════════════════════════════════════════════
// Step 2: Group tokens into அசை segments
// ═══════════════════════════════════════════════════════════════

function groupUnitsIntoSegments(units) {
  const segments = [];
  let i = 0;
  let pendingO = [];

  while (i < units.length) {
    let seg = [...pendingO]; // prepend any buffered O tokens
    pendingO = [];

    if (i < units.length && units[i].type === 'O') {
      // Buffer leading / inter-segment ஒற்று tokens
      while (i < units.length && units[i].type === 'O') {
        pendingO.push(units[i]);
        i++;
      }
      continue;
    }

    if (i < units.length) {
      // Take the first non-O token
      const firstToken = units[i];
      seg.push(firstToken);
      i++;

      // If first was K and immediate next exists and is non-O: take it (K+K or K+N)
      if (firstToken.type === 'K' && i < units.length && units[i].type !== 'O') {
        seg.push(units[i]);
        i++;
      }
    }

    // Absorb trailing O tokens into the current segment
    while (i < units.length && units[i].type === 'O') {
      seg.push(units[i]);
      i++;
    }

    if (seg.length > 0) {
      segments.push(seg);
    }
  }

  // If there are still buffered O tokens at the end of the word, attach them to the last segment
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

function isKutriyalukar(word) {
  const chars = Array.from(word);
  if (chars.length < 2) return false;
  return chars[chars.length - 1] === 'ு' &&
         KUTRIYA_BASE.has(chars[chars.length - 2]);
}

function getEtruVaipadu(word, asaiTypes) {
  if (isKutriyalukar(word)) {
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
// Public APIs
// ═══════════════════════════════════════════════════════════════

function analyseSeer(word, isFinal) {
  const clean     = word.replace(/[.,!?;:'"«»]/g, '');
  const units     = parseTamilToUnits(clean);
  const segments  = groupUnitsIntoSegments(units);
  const asaiObjs  = segments.map(classifySegment);
  const asaiTypes = asaiObjs.map(a => a.asaiType);
  const split     = asaiObjs.map(a => a.raw).join(' / ');
  const vaipadu   = isFinal ? getEtruVaipadu(clean, asaiTypes) : getVaipadu(asaiTypes);

  return { word, clean, split, asais: asaiTypes, vaipadu, isFinal };
}

// ═══════════════════════════════════════════════════════════════
// History Management
// ═══════════════════════════════════════════════════════════════

const HISTORY_KEY = 'AlaKidal_History';
const MAX_HISTORY = 50;

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
// Universal Consolidated Export Module
// ═══════════════════════════════════════════════════════════════

const AlaKidal = {
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

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = AlaKidal;
} else {
  window.AlaKidal = AlaKidal;
}