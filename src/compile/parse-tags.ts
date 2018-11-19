import { RawTranslationMap, TranslationMap, Segment } from '../interfaces';

/**
 * Finds strings containing tags and converts them into array of string
 * segments. array can contain plain strings and `{ name:string, text:string }`
 * objects for the tags to replace/wrap
 */
export function parseAllTags(rawTranslation: RawTranslationMap): void {
  for (const key in rawTranslation) {
    let str = rawTranslation[key];
    if (!str && str !== '') str = key;

    const maybeSegments = parseTags(str);

    if (Array.isArray(maybeSegments)) {
      (rawTranslation as TranslationMap)[key] = maybeSegments;
    }
  }
}

export function parseTags(str: string): Segment[] | false {
  // Either a tag like <something>(text, or nothing)</> OR a self-closing tag
  // like <whatever/>. No support for nested or overlapping tags.
  const tagExp = /<([a-zA-Z0-9_-]+)>(.*?)<\/>|<([a-zA-Z0-9_-]+)\/>/g;

  let match = tagExp.exec(str);
  const didMatch = match !== null;

  let segments: Segment[] = [];
  let position = 0;
  while (match !== null) {
    const tagName = match[3] || match[1];
    const tagContent = match[2] || '';

    // check if we need to push a plain text segment
    if (match.index > position) {
      segments.push(str.substring(position, match.index));
    }

    segments.push({ name: tagName, text: tagContent });
    position = tagExp.lastIndex;
    match = tagExp.exec(str);
  }

  if (didMatch) {
    // tail, if any
    if (position !== 0 && position < str.length) {
      segments.push(str.substring(position));
    }
    return segments;
  }
  return false;
}
