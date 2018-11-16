import { makeStringReplacements } from './string-replacement';
import { parseAllTags } from './parse-tags';
import { substituteReferences } from './substitute-references';

import { RawTranslationMap, StringReplacements } from '../interfaces';

/** Prepares translation file for use. Usually invoked via `setLocale`. */
export function compileTranslation(
  rawTranslation: RawTranslationMap,
  replacements: StringReplacements
): void {
  // iterating here because substituteReferences needs to be recursive
  for (const key of Object.keys(rawTranslation)) {
    substituteReferences(rawTranslation, key);
  }
  parseAllTags(rawTranslation);
  makeStringReplacements(rawTranslation, replacements);
}
