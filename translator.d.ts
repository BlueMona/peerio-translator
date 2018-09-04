type VarParam = { toString: () => string };
type TemplateParam = (text: string) => any;
type Params = { [key: string]: VarParam | TemplateParam };
type Result = string | Array<any>;

declare module 'peerio-translator' {
  export function setLocale(locale: string, translation: { [key: string]: string }): void;
  export function t(id: string, params?: Params): Result;
  export function tu(id: string, params?: Params): Result;
  export function has(id: string): boolean;
  export function setStringReplacement(pattern: string, replacement: string): void;
  export function setTagHandler(tag: string, handler: TemplateParam): void;
  export function setUrlMap(map: { [key: string]: string }): void;
}
