import { setLocale, t, tu, has, _WARN_NO_ID, _WARN_NO_TAG } from '../src';

// Order matters!
describe('Translator', () => {
  console.warn = jest.fn();

  afterEach(() => {
    (console.warn as any).mockClear();
  });

  // simple test cases translation
  const es = {
    testKey: 'testVal',
    '0': ''
  };

  // complex test cases translation
  const ru = {
    greet: 'Hello',
    personalGreet: '{#greet}, friend!',
    doubleGreet: '{#greet}, friend, {#greet}!',
    invalidRef: '{#nope}',
    cusomVar: 'one {two}',
    cusomVar1: 'one { two }',
    cusomVar2: 'one {t wo}',
    cusomVarRepeat: 'one {two} {two}',
    cusomVarMulti: 'one {two} {three}',
    cusomVarMultiRepeat: 'one {two} {three} {two}',
    seg: '<fullSeg>hello</>',
    seg2: '<fullSeg>{var}</>',
    segPartial: 'head <partSeg>hello</> tail',
    segMulti: 'head <partSeg>hello</><partSeg2>hello</> tail',
    segMix1: 'head <partSeg>hello {var}</> tail',
    segMix2: '<partSeg>hello {var}</>',
    segMix3: '<partSeg>hello {var} {var}</> {var}',
    segMix4: 'head {var1} <partSeg>hello {var}</> tail',
    segMix5: 'head {var1} <partSeg>{#greet}hello {var}</> tail{#greet}',
    selfClose: 'head <smiley/> tail',
    refTag: 'head {#selfClose} tail'
  };

  // 01 ----------------------------------------------------------------------------------------------------------------
  it('should set locale and warn about errors', () => {
    setLocale('es', es);

    expect(console.warn).toHaveBeenCalledWith(
      'Ref not found while trying to substitute translation references: "0". The key itself will be used instead.'
    );

    // FIXME: test behaviour, not implementation
    // expect(locale).toBe('es');
    // expect(translation).toBe(es);
  });

  // 02 ----------------------------------------------------------------------------------------------------------------
  it('should return key and warn for non-existing translation key', () => {
    const expected = 'asdfasdf';
    const actual = t(expected);
    expect(actual).toBe(expected);

    expect(console.warn).toHaveBeenCalledWith(_WARN_NO_ID('asdfasdf'));
  });

  it('should return plain string', () => {
    const expected = es.testKey;
    const actual = t('testKey');
    expect(actual).toBe(expected);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should respond to "has" calls properly', () => {
    expect(has('testKey')).toBe(true);
    expect(has('testKey1')).toBe(false);
    expect(has('')).toBe(false);
    expect(has('0')).toBe(true);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should respond to "tu" (translateUppercase) calls properly', () => {
    expect(tu('testKey')).toBe(es.testKey.toUpperCase());
    expect(tu('testKey1')).toBe('TESTKEY1');

    expect(console.warn).toHaveBeenCalledWith(_WARN_NO_ID('testKey1'));
  });

  // 03 ----------------------------------------------------------------------------------------------------------------
  it('should change locale', () => {
    setLocale('ru', ru);

    expect(console.warn).toHaveBeenCalledWith(
      'Ref not found while trying to substitute translation references: "nope". The key itself will be used instead.'
    );

    // FIXME: test behaviour, not implementation
    // expect(locale).toBe('ru');
    // expect(translation).toBe(ru);
  });

  // 04 ----------------------------------------------------------------------------------------------------------------
  it('should substitute references', () => {
    expect(t('personalGreet')).toBe('Hello, friend!');

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should substitute repeated references', () => {
    expect(t('doubleGreet')).toBe('Hello, friend, Hello!');

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should not fail on wrong references', () => {
    expect(t('invalidRef')).toBe('nope');

    // It should have warned at load time, so we expect no call here
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should substitute variable', () => {
    expect(t('cusomVar', { two: '2' })).toBe('one 2');
    expect(t('cusomVar1', { two: '2' })).toBe('one { two }');
    expect(t('cusomVar2', { 't wo': '2' })).toBe('one 2');

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should not fail on missing/excessive variables', () => {
    expect(t('cusomVar', { three: '2' })).toBe('one {two}');

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should substitute repeated variables', () => {
    expect(t('cusomVarRepeat', { two: '2' })).toBe('one 2 2');

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should substitute multiple variables', () => {
    expect(
      t('cusomVarMulti', {
        two: '2',
        three: '3'
      })
    ).toBe('one 2 3');

    expect(t('cusomVarMultiRepeat', { two: '2', three: '3' })).toBe('one 2 3 2');

    expect(console.warn).not.toHaveBeenCalled();
  });

  function wrapper(text: string): string {
    return '!' + text + '!';
  }

  it('should process basic segments', () => {
    expect(t('seg', { fullSeg: wrapper })).toEqual(['!hello!']);
    expect(t('seg2', { fullSeg: wrapper })).toEqual(['!{var}!']);
    expect(t('seg2', { fullSeg: wrapper, var: 'qwer' })).toEqual(['!qwer!']);
    expect(t('segPartial', { partSeg: wrapper })).toEqual(['head ', '!hello!', ' tail']);
    expect(t('segMulti', { partSeg: wrapper, partSeg2: wrapper })).toEqual([
      'head ',
      '!hello!',
      '!hello!',
      ' tail'
    ]);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should process segments but warn on missing tag param 1', () => {
    expect(t('seg')).toEqual(['hello']);

    expect(console.warn).toHaveBeenCalledWith(_WARN_NO_TAG('seg', 'fullSeg'));
  });

  it('should process segments but warn on missing tag param 2', () => {
    expect(t('seg2', { var: 'qwer' })).toEqual(['qwer']);

    expect(console.warn).toHaveBeenCalledWith(_WARN_NO_TAG('seg2', 'fullSeg'));
  });

  it('should process a mix of segments and variables', () => {
    expect(t('segMix1', { partSeg: wrapper })).toEqual(['head ', '!hello {var}!', ' tail']);
    expect(t('segMix1', { partSeg: wrapper, var: 'qwer' })).toEqual([
      'head ',
      '!hello qwer!',
      ' tail'
    ]);

    expect(t('segMix2', { partSeg: wrapper })).toEqual(['!hello {var}!']);
    expect(t('segMix2', { partSeg: wrapper, var: 22 })).toEqual(['!hello 22!']);

    expect(t('segMix3', { partSeg: wrapper, var: 'asdf' })).toEqual(['!hello asdf asdf!', ' asdf']);
    expect(t('segMix3', { partSeg: wrapper })).toEqual(['!hello {var} {var}!', ' {var}']);

    expect(t('segMix4', { partSeg: wrapper, var: 'asdf', var1: 'qwer' })).toEqual([
      'head qwer ',
      '!hello asdf!',
      ' tail'
    ]);
    expect(t('segMix5', { partSeg: wrapper, var: 'asdf', var1: 'qwer' })).toEqual([
      'head qwer ',
      '!Hellohello asdf!',
      ' tailHello'
    ]);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should process a mix of segments and variables but warn on missing tags', () => {
    expect(t('segMix1', { var: 'qwer' })).toEqual(['head ', 'hello qwer', ' tail']);
    expect(t('segMix1')).toEqual(['head ', 'hello {var}', ' tail']);

    expect(t('segMix2', { var: 22 })).toEqual(['hello 22']);
    expect(t('segMix2')).toEqual(['hello {var}']);

    expect(console.warn).toHaveBeenCalledTimes(4);
  });

  it('should handle self-closing tags', () => {
    expect(t('selfClose', { smiley: () => ':)' })).toEqual(['head ', ':)', ' tail']);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should handle a reference to a string with tags', () => {
    expect(t('refTag', { smiley: () => ':)' })).toEqual(['head head ', ':)', ' tail tail']);

    expect(console.warn).not.toHaveBeenCalled();
  });
});
