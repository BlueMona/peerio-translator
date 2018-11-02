import { substituteReferences } from '../compile/substitute-references';

const INCLUDE_SNIPPETS = true;
const MAX_SNIPPET_LENGTH = 60;

/**
 * Defines a set of tags for which, in templated translation strings, a
 * corresponding function parameter will not be required to be passed in. Link
 * tags (`<a-whatever>`) also don't require a corresponding function.
 */
const PREDEFINED_TAGS: ReadonlySet<string> = new Set(['br', 'i', 'b']);

const PREAMBLE =
  '// This file was automatically generated. Do not edit by hand!\n// prettier-ignore';
const PREFIX = 'export interface LocalizationStrings {';
const SUFFIX = '}';
const INDENT = '  ';

/**
 * Parse all translation strings and return a string representing the generated
 * typedefs, ready to be written to a file.
 *
 * @param rawTranslation The "raw" translation, as might be imported directly
 *                       from eg. `en.json`.
 */
export function generateDefs(rawTranslation: { [key: string]: string }): string {
  // first we need to substitute references, since they impact the return types
  for (const key of Object.keys(rawTranslation)) {
    substituteReferences(rawTranslation, key);
  }

  const types = getParamAndReturnTypes(rawTranslation);

  const defsFile = [PREAMBLE, PREFIX];
  for (const [id, { paramTypes, returnType }] of Object.entries(types)) {
    if (INCLUDE_SNIPPETS) {
      // Insert a snippet of the raw translation as a hint for usage.
      const rawStr = rawTranslation[id];
      const snippet = rawStr.substr(0, MAX_SNIPPET_LENGTH);
      const isTruncated = snippet.length < rawStr.length;
      defsFile.push(`/** ${snippet}${isTruncated ? '…' : ''} */`);
    }

    const params: string[] = [];
    if (paramTypes) {
      for (const [key, value] of Object.entries(paramTypes)) {
        params.push(`'${key}': ${value}`);
      }
    }
    defsFile.push(
      `${INDENT}'${id}': (${
        params.length > 0 ? `params: { ${params.join(', ')} }` : ''
      }) => ${returnType};`
    );
  }
  defsFile.push(SUFFIX);

  return defsFile.join('\n');
}

function getParamAndReturnTypes(translation: { [key: string]: string }) {
  const types: {
    [key: string]: { paramTypes: { [param: string]: string } | null; returnType: string };
  } = {};

  for (const [key, templateString] of Object.entries(translation)) {
    if (!templateString && templateString !== '') {
      // as specified by usage, if a value is absent the key itself is the return value.
      console.warn(`Missing translation value: ${key}`);
      types[key] = { paramTypes: null, returnType: 'string' };
    } else {
      types[key] = {
        paramTypes: getParamTypes(templateString),
        returnType: getReturnType(templateString)
      };
    }
  }

  return types;
}

function getParamTypes(templateString: string): { [param: string]: string } | null {
  // Either a tag like <something>(text, or nothing)</> OR a self-closing tag
  // like <whatever/>. No support for nested or overlapping tags.
  const tagExp = /<([a-zA-Z0-9_-]+)>(.*?)<\/>|<([a-zA-Z0-9_-]+)\/>/g;
  const varExp = /\{([a-zA-Z0-9_-]+)\}/g;

  let didMatch = false;

  const paramTypes: { [param: string]: string } = {};

  // Parse tags:
  let tagMatch = tagExp.exec(templateString);
  if (tagMatch !== null) {
    do {
      const tag = tagMatch[3] || tagMatch[1];
      const isParam = !tag.startsWith('a-') && !PREDEFINED_TAGS.has(tag);
      if (isParam) {
        didMatch = true;
        if (tagMatch[3]) {
          // Self-closing; no params
          paramTypes[tagMatch[3]] = '() => JSX.Element';
        } else if (tagMatch[1]) {
          paramTypes[tagMatch[1]] = '(text: string) => JSX.Element';
        } else {
          throw new Error(`Can't parse result of tag regex!`);
        }
      }

      tagMatch = tagExp.exec(templateString);
    } while (tagMatch !== null);
  }

  // Parse vars:
  let varMatch = varExp.exec(templateString);
  if (varMatch !== null) {
    didMatch = true;

    do {
      const varName = varMatch[1];

      paramTypes[varName] = 'string | number';

      varMatch = varExp.exec(templateString);
    } while (varMatch !== null);
  }

  if (didMatch) {
    return paramTypes;
  }
  return null;
}

function getReturnType(templateString: string): string {
  // Either a tag like <something>(text, or nothing)</> OR a self-closing tag
  // like <whatever/>. No support for nested or overlapping tags.
  const tagExp = /<([a-zA-Z0-9_-]+)>(.*?)<\/>|<([a-zA-Z0-9_-]+)\/>/g;

  if (tagExp.test(templateString)) {
    return 'React.ReactChild[]';
  }

  return 'string';
}
