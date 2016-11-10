/* eslint-disable guard-for-in, no-prototype-builtins, no-param-reassign, no-confusing-arrow */
let translation = {};
let locale = null;
const replacements = [];

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
function setStringReplacement(pattern, replacement){
    replacements.push({regex: new RegExp(pattern, 'g'), str: replacement});
}

function has(id) {
    return translation.hasOwnProperty(id);
}

function t(id, params) {
    let ret = translation[id] || id;

    // this is segmented string
    if (Array.isArray(ret)) {
        // leaving original segment info intact
        ret = ret.slice();
        if (!params) return ret.map(s => typeof (s) === 'string' ? s : s.text);
        // iterating segments
        for (let i = 0; i < ret.length; i++) {
            // plaintext segment
            if (typeof (ret[i]) === 'string') {
                ret[i] = replaceVars(ret[i], params);
                continue;
            }
            // dynamic segment
            const text = replaceVars(ret[i].text, params);
            const func = params[ret[i].name];
            if (!func || typeof(func)!=='function') ret[i] = text;
            else ret[i] = func(text);
        }
        return ret;
    }
    return params ? replaceVars(ret, params) : ret;
}

function tu(id, params) {
    return t(id, params).toUpperCase();
}

function replaceVars(str, params) {
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
    // iterating here because substituteReferences needs to be recursive
    for (const key in translation) {
        substituteReferences(key);
    }
    parseSegments();
    makeStringReplacements();
}

// for specified key, finds if there are any references to other keys
// and replaces original references with referenced strings, recursively
function substituteReferences(key) {
    // fallback is needed, because key might be a wrong reference from the string
    let str = translation[key] || key;
    const replacements = {};
    const refExp = /\{#([a-zA-Z0-9_]+)\}/g;
    let match = refExp.exec(str);
    while (match !== null) {
        // found reference key
        const ref = match[1];
        // processing it first, so we don't use unprocessed string
        substituteReferences(ref);
        if (!replacements[ref]) {
            // saving ref string to replace later
            replacements[ref] = t(ref);
        }
        match = refExp.exec(str);
    }
    // replacing all referenced strings
    for (const r in replacements) {
        str = str.replace(new RegExp(`\{#${r}\}`, 'g'), replacements[r]);
    }
    // saving processed string
    translation[key] = str;
}

// Finds strings containing segments and converts them into array of segments
// array can contain plain strings and {name:string, text:string} objects for the segments to replace/wrap
function parseSegments() {
    const segmentExp = /<([a-zA-Z0-9_]+)>(.*?)<\/>/g;
    for (const key in translation) {
        let str = translation[key];
        if(!str && str !== '') str = key;
        let segments = null;
        let position = 0;
        let match = segmentExp.exec(str);
        while (match !== null) {
            segments = segments || [];
            const segmentName = match[1];
            const segmentText = match[2];
            // check if we need to push a plain text segment
            if (match.index > position) {
                segments.push(str.substring(position, match.index));
            }
            segments.push({ name: segmentName, text: segmentText });
            position = segmentExp.lastIndex;
            match = segmentExp.exec(str);
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

function makeStringReplacements(){
    for(const key in translation){
        let str = translation[key];
        const isSegment = typeof str !== 'string';
        if(isSegment){
            str = str.text;
        }
        for(const r of replacements){
            str = str.replace(r.regex, r.str);
        }
        if(isSegment){
            translation[key].text = str;
        } else {
            translation[key] = str;
        }

    }
}


module.exports = {
    setLocale,
    t,
    tu,
    has,
    setStringReplacement
};
