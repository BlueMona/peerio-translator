import { TranslationMap, Segment } from './translator';

export function makeStringReplacements(
  translation: TranslationMap,
  replacements: { regex: RegExp; str: string }[]
): void {
  if (replacements.length === 0) return;
  for (const [key, val] of Object.entries(translation)) {
    if (typeof val !== 'string') {
      translation[key] = replaceInSegment(val, replacements);
    } else {
      translation[key] = replaceOne(val, replacements);
    }
  }
}

function replaceOne(str: string, replacements: { regex: RegExp; str: string }[]): string {
  for (const r of replacements) {
    str = str.replace(r.regex, r.str);
  }
  return str;
}

function replaceInSegment(
  segs: Segment[],
  replacements: { regex: RegExp; str: string }[]
): Segment[] {
  return segs.map(seg => {
    if (typeof seg === 'string') {
      return replaceOne(seg, replacements);
    } else {
      return { ...seg, text: replaceOne(seg.text, replacements) };
    }
  });
}
