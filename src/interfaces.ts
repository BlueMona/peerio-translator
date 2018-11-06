export type TemplateHandler = (text: string, param: string | null) => unknown;

/** Map of raw ("uncompiled") strings for translation. */
export interface RawTranslationMap {
  [key: string]: string;
}

type Tag = {
  text: string;
  name: string;
};
export type Segment = string | Tag;

export type StringReplacements = { regex: RegExp; str: string }[];

/** Map of compiled strings, some broken into segments, ready for use */
export interface TranslationMap {
  [key: string]: string | Segment[];
}
