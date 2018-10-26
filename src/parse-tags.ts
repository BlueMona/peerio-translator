import { RawTranslationMap, TranslationMap, Segment } from './translator';

// Finds strings containing tags and converts them into array of string segments
// array can contain plain strings and {name:string, text:string} objects for the tags to replace/wrap
export function parseTags(rawTranslation: RawTranslationMap): void {
  const tagExp = /(<([a-zA-Z0-9_-]+)>(.*?)<\/>|<([a-zA-Z0-9_-]+)\/>)/g;
  for (const key in rawTranslation) {
    let str = rawTranslation[key];
    if (!str && str !== '') str = key;
    let segments: Segment[] | null = null;
    let position = 0;
    let match = tagExp.exec(str);
    while (match !== null) {
      segments = segments || [];
      const tagName = match[4] || match[2];
      const tagContent = match[3] || '';
      // check if we need to push a plain text segment
      if (match.index > position) {
        segments.push(str.substring(position, match.index));
      }
      segments.push({ name: tagName, text: tagContent });
      position = tagExp.lastIndex;
      match = tagExp.exec(str);
    }
    if (segments) {
      // tail, if any
      if (position !== 0 && position < str.length) {
        segments.push(str.substring(position));
      }
      (rawTranslation as TranslationMap)[key] = segments;
    }
  }
}
