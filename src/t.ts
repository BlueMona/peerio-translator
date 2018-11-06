import { translation, tagHandlers, urlMap } from './state';

import { TemplateHandler } from './interfaces';

interface ParameterMap {
  [param: string]: string | number | TemplateHandler;
}

export const _WARN_NO_ID = (id: string) =>
  `No translation string found for id "${id}". Returning the id instead.`;

export const _WARN_NO_URL = (id: string, urlId: string) =>
  `A translation string wants a URL, but the URL map doesn't contain a corresponding entry: "${urlId}" (in id ${id})`;

export const _WARN_NO_TAG = (id: string, tagName: string) =>
  `A translation string with a tag was requested, but no handler was provided or registered ahead of time.\n(Tag <${tagName}> in id "${id}")`;

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

export function has(id: string): boolean {
  return translation.hasOwnProperty(id);
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
