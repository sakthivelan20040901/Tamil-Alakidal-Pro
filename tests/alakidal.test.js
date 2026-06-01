const {
  parseTamilToUnits,
  analyseSeer,
  analyseKural,
  getVaipadu,
  isKutriyalukar
} = require('../alakidal_logic');

// ======================================================
// parseTamilToUnits()
// ======================================================

describe('parseTamilToUnits()', () => {

  test('Standalone Kuril (அ)', () => {
    const result = parseTamilToUnits('அ');

    expect(result).toEqual([
      { text: 'அ', type: 'K' }
    ]);
  });

  test('Standalone Nedil (ஆ)', () => {
    const result = parseTamilToUnits('ஆ');

    expect(result).toEqual([
      { text: 'ஆ', type: 'N' }
    ]);
  });

  test('Detect Otru (த்)', () => {
    const result = parseTamilToUnits('த்');

    expect(result).toEqual([
      { text: 'த்', type: 'O' }
    ]);
  });

});

// ======================================================
// getVaipadu()
// ======================================================

describe('getVaipadu()', () => {

  test('தேமா', () => {
    expect(
      getVaipadu(['நேர்', 'நேர்'])
    ).toBe('தேமா');
  });

  test('புளிமா', () => {
    expect(
      getVaipadu(['நிரை', 'நேர்'])
    ).toBe('புளிமா');
  });

  test('கூவிளம்', () => {
    expect(
      getVaipadu(['நேர்', 'நிரை'])
    ).toBe('கூவிளம்');
  });

  test('கருவிளம்', () => {
    expect(
      getVaipadu(['நிரை', 'நிரை'])
    ).toBe('கருவிளம்');
  });

});

// ======================================================
// analyseSeer()
// ======================================================

describe('analyseSeer()', () => {

  test('அகர → புளிமா', () => {
    const result = analyseSeer('அகர', false);

    expect(result.asais).toEqual([
      'நிரை',
      'நேர்'
    ]);

    expect(result.vaipadu).toBe('புளிமா');
  });

  test('ஆதி → தேமா', () => {
    const result = analyseSeer('ஆதி', false);

    expect(result.asais).toEqual([
      'நேர்',
      'நேர்'
    ]);

    expect(result.vaipadu).toBe('தேமா');
  });

  test('முதல → புளிமா', () => {
    const result = analyseSeer('முதல', false);

    expect(result.asais).toEqual([
      'நிரை',
      'நேர்'
    ]);

    expect(result.vaipadu).toBe('புளிமா');
  });

  test('எழுத்தெல்லாம் → புளிமாங்காய்', () => {
    const result = analyseSeer('எழுத்தெல்லாம்', false);
    expect(result.vaipadu).toBe('புளிமாங்காய்');
  });

});

// ======================================================
// Kutriyalugaram Tests
// ======================================================

describe('Kutriyalugaram', () => {

  test('உலகு is kutriyalukar', () => {
    expect(isKutriyalukar('உலகு')).toBe(true);
  });

  test('ஆதி is NOT kutriyalukar', () => {
    expect(isKutriyalukar('ஆதி')).toBe(false);
  });

  test('Final உலகு -> பிறப்பு', () => {
    const result = analyseSeer('உலகு', true);
    expect(result.vaipadu).toBe('பிறப்பு');
  });

});

// ======================================================
// Full Kural Test
// ======================================================

describe('analyseKural()', () => {

  test('Thirukkural #1', () => {
    const kural = `அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு`;
    const result = analyseKural(kural);

    expect(result.summary.totalSeers).toBe(7);
    expect(result.summary.finalVaipadu).toBe('பிறப்பு');
  });

});

// ======================================================
// Punctuation Handling
// ======================================================

describe('Punctuation Handling', () => {

  test('Remove comma', () => {
    const result = analyseSeer('அகர,', false);
    expect(result.clean).toBe('அகர');
  });

});

// ======================================================
// Edge Cases
// ======================================================

describe('Edge Cases', () => {

  test('Single character அ', () => {
    const result = analyseSeer('அ', false);
    expect(result.asais).toEqual(['நேர்']);
  });

  test('Single character ஆ', () => {
    const result = analyseSeer('ஆ', false);
    expect(result.asais).toEqual(['நேர்']);
  });

});