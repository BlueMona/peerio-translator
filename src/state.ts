import { compileTranslation } from './compile';

import {
  TemplateHandler,
  TranslationMap,
  RawTranslationMap,
  StringReplacements
} from './interfaces';

export let translation: TranslationMap = {};
let locale: string | null = null;

/**
 * Initialize the translation library. Must be called before any invocation of
 * `t()`, etc.
 *
 * @param newLocale Locale identifier, eg. 'en'
 * @param newTranslation Map of identifiers to translation strings for this
 *                       locale, eg. `"button_takeAPicture": "Take a <b>picture</>"`
 */
export function setLocale(newLocale: string, newTranslation: RawTranslationMap): void {
  if (locale === newLocale) {
    return;
  }
  compileTranslation(newTranslation, replacements);
  translation = newTranslation;
  locale = newLocale;
}

export const replacements: StringReplacements = [];

/**
 * Configure string replacements, eg. to replace all instances of "Peerio" with
 * "Krusty-O" in all translation strings. Not recommended for complex use cases.
 *
 * Call before invoking `setLocale`.
 */
export function setStringReplacement(pattern: string, replacement: string): void {
  replacements.push({ regex: new RegExp(pattern, 'gm'), str: replacement });
}

export const tagHandlers: { [tag: string]: TemplateHandler | undefined } = {};

/**
 * Configure a tag handler, eg. a function that takes the contents of a tag like
 * `head <b>hello</> tail` and returns some result, usually another string or a
 * JSX element.
 */
export function setTagHandler(tag: string, handler: TemplateHandler): void {
  tagHandlers[tag] = handler;
}

export let urlMap: { [key: string]: string } = {};

/**
 * Configure the URL map.
 */
export function setUrlMap(map: { [key: string]: string }): void {
  urlMap = map;
}
