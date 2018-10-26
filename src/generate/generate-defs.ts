import { substituteReferences } from '../substitute-references';

const PREFIX = '// prettier-ignore\nexport interface LocalizationStrings {';
const SUFFIX = '}';
const INDENT = '  ';

export function generateDefs(rawTranslation: { [key: string]: string }): string {
  // first we need to substitute references, since they impact the return types
  for (const key of Object.keys(rawTranslation)) {
    substituteReferences(rawTranslation, key);
  }

  const types = getParamAndReturnTypes(rawTranslation);

  const defs = [PREFIX];
  for (const [id, { paramTypes, returnType }] of Object.entries(types)) {
    const params: string[] = [];
    if (paramTypes) {
      for (const [key, value] of Object.entries(paramTypes)) {
        params.push(`'${key}': ${value}`);
      }
    }
    defs.push(
      `${INDENT}'${id}': (${
        params.length > 0 ? `params: { ${params.join(', ')} }` : ''
      }) => ${returnType};`
    );
  }
  defs.push(SUFFIX);

  return defs.join('\n');
}

export function getParamAndReturnTypes(translation: { [key: string]: string }) {
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
    didMatch = true;

    do {
      if (tagMatch[3]) {
        // Self-closing; no params
        paramTypes[tagMatch[3]] = '() => JSX.Element';
      } else if (tagMatch[1]) {
        paramTypes[tagMatch[1]] = '(text: string) => JSX.Element';
      } else {
        throw new Error(`Can't parse result of tag regex!`);
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

export function getReturnType(templateString: string): string {
  // Either a tag like <something>(text, or nothing)</> OR a self-closing tag
  // like <whatever/>. No support for nested or overlapping tags.
  const tagExp = /<([a-zA-Z0-9_-]+)>(.*?)<\/>|<([a-zA-Z0-9_-]+)\/>/g;

  let match = tagExp.exec(templateString);
  const didMatch = match !== null;

  let returnTuple: string[] = [];

  let position = 0;
  while (match !== null) {
    // check if we need to push a plain text segment
    if (match.index > position) {
      returnTuple.push('string');
    }

    returnTuple.push('JSX.Element');
    position = tagExp.lastIndex;
    match = tagExp.exec(templateString);
  }

  if (didMatch) {
    // tail, if any
    if (position !== 0 && position < templateString.length) {
      returnTuple.push('string');
    }
    return `[${returnTuple.join(', ')}]`;
  }

  return 'string';
}
