/* eslint-disable */
// hackish way to "require" translator.js without compiling and packaging :-D
// all translator.js functions are globally available since it was loaded not as a module
const module = {
  exports: null
};

// Order matters!
describe('Translator', () => {
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
    segMix5: 'head {var1} <partSeg>{#greet}hello {var}</> tail{#greet}'
  }
  // 01 ----------------------------------------------------------------------------------------------------------------
  it('should set locale', () => {
    setLocale('es', es);
    locale.should.equal('es');
    translation.should.eql(es);
  });
  // 02 ----------------------------------------------------------------------------------------------------------------
  it('should return key for inexistant string', () => {
    const expected = 'asdfasdf';
    const actual = t(expected);
    actual.should.equal(expected);
  });

  it('should return plain string', () => {
    const expected = es.testKey;
    const actual = t('testKey');
    actual.should.equal(expected);
  });

  it('should respond to "has" calls properly', () => {
    has('testKey').should.be.true;
    has('testKey1').should.be.false;
    has('').should.be.false;
    has().should.be.false;
    has('0').should.be.true;
  });

  it('should respond to "tu" (translateUppercase) calls properly', () => {
    tu('testKey').should.equal(es.testKey.toUpperCase());
    tu('testKey1').should.equal('TESTKEY1');
  });
  // 03 ----------------------------------------------------------------------------------------------------------------
  it('should change locale', () => {
    setLocale('ru', ru);
    locale.should.equal('ru');
    translation.should.eql(ru);
  })
  // 04 ----------------------------------------------------------------------------------------------------------------
  it('should substitute references', () => {
    t('personalGreet').should.equal('Hello, friend!');
  });

  it('should substitute repeated references', () => {
    t('doubleGreet').should.equal('Hello, friend, Hello!');
  });

  it('should not fail on wrong references', () => {
    t('invalidRef').should.equal('nope');
  });

  it('should substitute variable', () => {
    t('cusomVar', {two: '2'}).should.equal('one 2');
    t('cusomVar1', {two: '2'}).should.equal('one { two }');
    t('cusomVar2', {'t wo': '2'}).should.equal('one 2');
  });
  
  it('should not fail on missing/excessive variables',()=>{
      t('cusomVar', {three: '2'}).should.equal('one {two}');
  });

  it('should substitute repeated variables', () => {
    t('cusomVarRepeat', {two: '2'}).should.equal('one 2 2');
  });

  it('should substitute multiple variables', () => {
    t('cusomVarMulti', {
      two: '2',
      three: '3'
    }).should.equal('one 2 3');
    
    t('cusomVarMultiRepeat', {
      two: '2',
      three: '3'
    }).should.equal('one 2 3 2');
  });

    function wrapper(text){
        return '!'+text+'!';    
    }
  it('should process basic segments', () => {
      t('seg', {fullSeg: wrapper}).should.eql(['!hello!']);
      t('seg').should.eql(['hello']);
      t('seg2',{fullSeg: wrapper}).should.eql(['!{var}!']);
      t('seg2',{fullSeg: wrapper, var: 'qwer'}).should.eql(['!qwer!']);
      t('seg2',{var: 'qwer'}).should.eql(['qwer']);
      t('segPartial',{partSeg: wrapper}).should.eql(['head ','!hello!', ' tail'])
      t('segMulti', {partSeg:wrapper, partSeg2:wrapper}).should.eql(['head ','!hello!','!hello!',' tail']);
  });

  it('should process a mix of segments and variables', () => {
      t('segMix1',{partSeg:wrapper}).should.eql(['head ','!hello {var}!', ' tail']);
      t('segMix1',{partSeg:wrapper, var:'qwer'}).should.eql(['head ','!hello qwer!', ' tail']);
      t('segMix1',{var:'qwer'}).should.eql(['head ','hello qwer', ' tail']);
      t('segMix1').should.eql(['head ','hello {var}', ' tail']);
      
      t('segMix2',{partSeg:wrapper}).should.eql(['!hello {var}!']);
      t('segMix2',{partSeg:wrapper, var: 22}).should.eql(['!hello 22!']);
      t('segMix2',{var:22}).should.eql(['hello 22']);
      t('segMix2').should.eql(['hello {var}']);

      t('segMix3',{partSeg:wrapper, var: 'asdf'}).should.eql(['!hello asdf asdf!', ' asdf']);
      t('segMix3',{partSeg:wrapper}).should.eql(['!hello {var} {var}!', ' {var}']);

      t('segMix4',{partSeg:wrapper, var: 'asdf',var1: 'qwer'}).should.eql(['head qwer ','!hello asdf!', ' tail']);
      t('segMix5',{partSeg:wrapper, var: 'asdf',var1: 'qwer'}).should.eql(['head qwer ','!Hellohello asdf!', ' tailHello']);  
  });

});
