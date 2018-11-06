import { RawTranslationMap } from '../interfaces';

export const _WARN_SUBSTITUTE_REF_NOT_FOUND = (key: string) =>
  `Ref not found while trying to substitute translation references: "${key}". The key itself will be used instead.`;

/**
 * for specified key, finds if there are any references to other keys and
 * replaces original references with referenced strings, recursively
 */
export function substituteReferences(rawTranslation: RawTranslationMap, key: string): void {
  let str = rawTranslation[key];

  if (!str) {
    console.warn(_WARN_SUBSTITUTE_REF_NOT_FOUND(key));
    str = key;
  }

  // Note that this function depends on the regex being redeclared on every
  // invocation rather that placed in the upper scope
  const refExp = /\{#([a-zA-Z0-9_]+)\}/g;

  const refs: { [ref: string]: string } = {};
  let match = refExp.exec(str);
  while (match !== null) {
    // found reference key
    const ref = match[1];
    // processing it first, so we don't use unprocessed string
    substituteReferences(rawTranslation, ref);
    if (!refs[ref]) {
      refs[ref] = rawTranslation[ref];
    }
    match = refExp.exec(str);
  }

  // replacing all referenced strings
  for (const r in refs) {
    str = str.replace(new RegExp(`\{#${r}\}`, 'g'), refs[r]); // eslint-disable-line no-useless-escape
  }

  rawTranslation[key] = str;
}
