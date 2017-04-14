/* eslint-disable guard-for-in, no-prototype-builtins, no-param-reassign, no-confusing-arrow */
let translation = {};
let locale = null;
const replacements = [];
const tagHandlers = {};
let urlMap = {};

function setLocale(newLocale, newTranslation) {
    if (locale === newLocale) {
        return;
    }
    locale = newLocale;
    translation = newTranslation;
    compileTranslation();
}

/**
 *
 * @param {string} pattern
 * @param {string} replacement
 */
function setStringReplacement(pattern, replacement) {
    replacements.push({ regex: new RegExp(pattern, 'gm'), str: replacement });
}

function setTagHandler(tag, fn) {
    tagHandlers[tag] = fn;
}

function setUrlMap(map) {
    urlMap = map;
}

function has(id) {
    return translation.hasOwnProperty(id);
}

function t(id, params) {
    let ret = translation[id] || id;

    // regular(not tagged) string
    if (!Array.isArray(ret)) {
        return params ? replaceVars(ret, params) : ret;
    }

    // this is taggged string
    // leaving original segment info intact
    ret = ret.slice();
    // if (!params) return ret.map(s => typeof (s) === 'string' ? s : s.text);
    // iterating segments
    for (let i = 0; i < ret.length; i++) {
        // plaintext segment
        if (typeof (ret[i]) === 'string') {
            ret[i] = replaceVars(ret[i], params);
            continue;
        }
        // tag segment
        const tagName = ret[i].name;
        const tagContent = replaceVars(ret[i].text, params);
        // we try to get tag handler from parameters (has priority) or predefined handlers
        let handler = (params && params[tagName]) || tagHandlers[tagName];
        let param = null;
        // then we try to see if it's an anchor tag
        if (!handler && tagName.startsWith('a-')) {
            handler = tagHandlers.a;
            param = urlMap[tagName.split('-')[1]];
        }
        if (!handler || typeof (handler) !== 'function') ret[i] = tagContent;
        else ret[i] = handler(tagContent, param);
    }
    return ret;
}

function tu(id, params) {
    return t(id, params).toUpperCase();
}

function replaceVars(str, params) {
    if (!params) return str;
    for (const key in params) {
        if (typeof (params[key]) === 'function') continue;
        str = replaceOneVariable(str, `{${key}}`, params[key]);
    }
    return str;
}

function replaceOneVariable(str, find, repl) {
    const ret = str.replace(find, repl);
    if (ret === str) return ret;
    return replaceOneVariable(ret, find, repl);
}

// prepares translation file for use
function compileTranslation() {
    if (translation.__peerioTranslatorCompiled) {
        return;
    }
    // iterating here because substituteReferences needs to be recursive
    for (const key in translation) {
        substituteReferences(key);
    }
    parseTags();
    makeStringReplacements();
    translation.__peerioTranslatorCompiled = true;
}

// for specified key, finds if there are any references to other keys
// and replaces original references with referenced strings, recursively
function substituteReferences(key) {
    // fallback is needed, because key might be a wrong reference from the string
    let str = translation[key] || key;
    const refs = {};
    const refExp = /\{#([a-zA-Z0-9_]+)\}/g;
    let match = refExp.exec(str);
    while (match !== null) {
        // found reference key
        const ref = match[1];
        // processing it first, so we don't use unprocessed string
        substituteReferences(ref);
        if (!refs[ref]) {
            // saving ref string to replace later
            refs[ref] = t(ref);
        }
        match = refExp.exec(str);
    }
    // replacing all referenced strings
    for (const r in refs) {
        str = str.replace(new RegExp(`\{#${r}\}`, 'g'), refs[r]);
    }
    // saving processed string
    translation[key] = str;
}

// Finds strings containing tags and converts them into array of string segments
// array can contain plain strings and {name:string, text:string} objects for the tags to replace/wrap
function parseTags() {
    const tagExp = /<([a-zA-Z0-9_\-]+)>(.*?)<\/>/g;
    for (const key in translation) {
        let str = translation[key];
        if (!str && str !== '') str = key;
        let segments = null;
        let position = 0;
        let match = tagExp.exec(str);
        while (match !== null) {
            segments = segments || [];
            const tagName = match[1];
            const tagContent = match[2];
            // check if we need to push a plain text segment
            if (match.index > position) {
                segments.push(str.substring(position, match.index));
            }
            segments.push({ name: tagName, text: tagContent });
            position = tagExp.lastIndex;
            match = tagExp.exec(str);
        }

        if (segments) {
            // tail, if any
            if (position !== 0 && position < str.length) {
                segments.push(str.substring(position));
            }
            translation[key] = segments;
        }
    }
}

function makeStringReplacements() {
    if (replacements.length === 0) return;

    for (const key in translation) {
        const val = translation[key];
        if (typeof val !== 'string') {
            replaceInSegment(val);
        } else {
            translation[key] = replaceOne(val);
        }
    }
}

function replaceOne(str) {
    for (const r of replacements) {
        str = str.replace(r.regex, r.str);
    }
    return str;
}

function replaceInSegment(seg) {
    for (let i = 0; i < seg.length; i++) {
        if (typeof (seg[i]) === 'string') {
            seg[i] = replaceOne(seg[i]);
        } else {
            seg[i].text = replaceOne(seg[i].text);
        }
    }
}

module.exports = {
    setLocale,
    t,
    tu,
    has,
    setStringReplacement,
    setTagHandler,
    setUrlMap
};
