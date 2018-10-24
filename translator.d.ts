type TemplateParam = (text: string) => any;

declare module 'peerio-translator' {
  export function setLocale(locale: string, translation: { [key: string]: string }): void;
  export function t(id: string, params?: any): any;
  export function tu(id: string, params?: any): any;
  export function has(id: string): boolean;
  export function setStringReplacement(pattern: string, replacement: string): void;
  export function setTagHandler(tag: string, handler: TemplateParam): void;
  export function setUrlMap(map: { [key: string]: string }): void;
}
