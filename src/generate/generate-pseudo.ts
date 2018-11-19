import { parseTags } from '../compile/parse-tags';

const prefix = '[[!!';
const suffix = '!!]]';

const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

const lookalikes: Readonly<{ [letter: string]: string }> = {
  a: 'α',
  b: 'ḅ',
  c: 'ͼ',
  d: 'ḍ',
  e: 'ḛ',
  f: 'ϝ',
  g: 'ḡ',
  h: 'ḥ',
  i: 'ḭ',
  j: 'ĵ',
  k: 'ḳ',
  l: 'ḽ',
  m: 'ṃ',
  n: 'ṇ',
  o: 'ṓ',
  p: 'ṗ',
  q: 'ʠ',
  r: 'ṛ',
  s: 'ṡ',
  t: 'ṭ',
  u: 'ṵ',
  v: 'ṽ',
  w: 'ẁ',
  x: 'ẋ',
  y: 'ẏ',
  z: 'ẓ',
  A: 'Ḁ',
  B: 'Ḃ',
  C: 'Ḉ',
  D: 'Ḍ',
  E: 'Ḛ',
  F: 'Ḟ',
  G: 'Ḡ',
  H: 'Ḥ',
  I: 'Ḭ',
  J: 'Ĵ',
  K: 'Ḱ',
  L: 'Ḻ',
  M: 'Ṁ',
  N: 'Ṅ',
  O: 'Ṏ',
  P: 'Ṕ',
  Q: 'Ǫ',
  R: 'Ṛ',
  S: 'Ṣ',
  T: 'Ṫ',
  U: 'Ṳ',
  V: 'Ṿ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ŷ',
  Z: 'Ż'
};

export function generatePseudo<T extends { [key: string]: string }>(rawTranslation: T): T {
  const pseudo = {} as T;
  for (const [k, v] of Object.entries(rawTranslation)) {
    pseudo[k] = `${prefix} ${pseudoLocalize(v)} ${suffix}`;
  }
  return pseudo;
}

function pseudoLocalize(str: string): string {
  const maybeSegments = parseTags(str);

  if (Array.isArray(maybeSegments)) {
    return maybeSegments
      .map<string>(seg => {
        if (typeof seg === 'string') {
          return pseudoReplaceSegment(seg);
        }
        return seg.text ? `<${seg.name}>${pseudoReplaceSegment(seg.text)}</>` : `<${seg.name}/>`;
      })
      .join('');
  }

  return pseudoReplaceSegment(str);
}

function pseudoReplaceSegment(str: string): string {
  const varExp = /\{[a-zA-Z0-9_-]+\}/g;

  let match = varExp.exec(str);
  const didMatch = match !== null;

  let sections: string[] = [];
  let position = 0;
  while (match !== null) {
    // check if we need to push a plain text segment
    if (match.index > position) {
      sections.push(toPseudo(str.substring(position, match.index)));
    }
    // push the var
    sections.push(match[0]);
    position = varExp.lastIndex;
    match = varExp.exec(str);
  }

  if (didMatch) {
    // tail, if any
    if (position !== 0 && position < str.length) {
      sections.push(toPseudo(str.substring(position)));
    }
    return sections.join('');
  }
  return toPseudo(str);
}

function toPseudo(str: string): string {
  return [...str]
    .map<string>(char => {
      const l = lookalikes[char];
      if (l) {
        if (vowels.has(char)) {
          return `${l}${l}`;
        }
        return l;
      }
      return char;
    })
    .join('');
}
