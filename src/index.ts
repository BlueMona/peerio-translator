import { makeStringReplacements } from './string-replacement';
import { parseTags } from './parse-tags';
import { substituteReferences } from './substitute-references';

export const _WARN_NO_ID = (id: string) =>
  `No translation string found for id "${id}". Returning the id instead.`;

export const _WARN_NO_URL = (id: string, urlId: string) =>
  `A translation string wants a URL, but the URL map doesn't contain a corresponding entry: "${urlId}" (in id ${id})`;

export const _WARN_NO_TAG = (id: string, tagName: string) =>
  `A translation string with a tag was requested, but no handler was provided or registered ahead of time.\n(Tag <${tagName}> in id "${id}")`;

type TemplateHandler = (text: string, param: string | null) => unknown;

/** Map of raw ("uncompiled") strings for translation. */
export interface RawTranslationMap {
  [key: string]: string;
}

export type Tag = { text: string; name: string };
export type Segment = string | Tag;

/** Map of compiled strings, some broken into segments, ready for use */
export interface TranslationMap {
  [key: string]: string | Segment[];
}
interface ParameterMap {
  [param: string]: string | number | TemplateHandler;
}

let translation: TranslationMap = {};
let locale: string | null = null;

const replacements: { regex: RegExp; str: string }[] = [];
const tagHandlers: { [tag: string]: TemplateHandler | undefined } = {};
let urlMap: { [key: string]: string } = {};

export function setLocale(newLocale: string, newTranslation: RawTranslationMap): void {
  if (locale === newLocale) {
    return;
  }
  compileTranslation(newTranslation);
  translation = newTranslation;
  locale = newLocale;
}

/**
 * Configure string replacements, eg. to replace all instances of "Peerio" with
 * "Krusty-O" in all translation strings. Not recommended for complex use cases.
 *
 * Call before invoking `setLocale`.
 */
export function setStringReplacement(pattern: string, replacement: string): void {
  replacements.push({ regex: new RegExp(pattern, 'gm'), str: replacement });
}

/**
 * Configure a tag handler, eg. a function that takes the contents of a tag like
 * `head <b>hello</> tail` and returns some result, usually another string or a
 * JSX element.
 *
 * Call before invoking `setLocale`.
 */
export function setTagHandler(tag: string, handler: TemplateHandler): void {
  tagHandlers[tag] = handler;
}

/**
 * Configure the URL map.
 *
 * Call before invoking `setLocale`.
 */
export function setUrlMap(map: { [key: string]: string }): void {
  urlMap = map;
}

export function has(id: string): boolean {
  return translation.hasOwnProperty(id);
}

export function t(id: string, params?: ParameterMap): string | unknown[] {
  const ret = translation[id];

  if (!ret) {
    console.warn(_WARN_NO_ID(id));
    return id;
  }

  // regular (not tagged) string
  if (!Array.isArray(ret)) {
    return replaceVars(ret, params);
  }

  return ret.map(seg => {
    // plaintext segment
    if (typeof seg === 'string') {
      return replaceVars(seg, params);
    }

    // tag segment
    const { name: tagName, text } = seg;
    const tagContent = replaceVars(text, params);

    // we try to get tag handler from parameters (has priority) or predefined handlers
    let handler = (params && params[tagName]) || tagHandlers[tagName];

    // "param" can currently only be a url.
    let param: string | null = null;

    // then we try to see if it's an anchor tag
    if (!handler && tagName.startsWith('a-')) {
      handler = tagHandlers.a;
      const urlName = tagName.split('-')[1];
      param = urlMap[urlName];
      if (!param) {
        console.warn(_WARN_NO_URL(id, urlName));
      }
    }

    if (!handler || typeof handler !== 'function') {
      console.warn(_WARN_NO_TAG(id, tagName));
      return tagContent;
    }

    return handler(tagContent, param);
  });
}

export function tu(id: string, params?: ParameterMap): string | unknown[] {
  const ret = t(id, params);
  if (typeof ret !== 'string') {
    console.error(
      `Can't uppercase translation entity with id (${id}) since it's not a string!\n${JSON.stringify(
        ret
      )}`
    );
    return ret;
  }
  return ret.toUpperCase();
}

function replaceVars(str: string, params?: ParameterMap): string {
  if (!params) return str;
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'function') continue;
    str = replaceOneVariable(str, `{${key}}`, value);
  }
  return str;
}

function replaceOneVariable(str: string, find: string, repl: { toString(): string }): string {
  const ret = str.replace(find, repl.toString());
  if (ret === str) return ret;
  return replaceOneVariable(ret, find, repl);
}

/** prepares translation file for use. */
function compileTranslation(rawTranslation: RawTranslationMap): void {
  // iterating here because substituteReferences needs to be recursive
  for (const key of Object.keys(rawTranslation)) {
    substituteReferences(rawTranslation, key);
  }
  parseTags(rawTranslation);
  makeStringReplacements(rawTranslation, replacements);
}
