const moment = require('moment');
const _ = require('lodash');
// currently loaded translation dictionary
let translation = null;
// regexps cache for substituting variables in translation strings
let regexpCache = {};

let currentLocale = null;

function loadLocale(localeName, localeProvider) {
    if (currentLocale === localeName) return;
    moment.locale(localeName);
    currentLocale = localeName;
    translation = localeProvider[localeName];
    compileTranslation();
}

function has(id) {
    return !!translation[id];
}

function t(id, params, segmentParams) {
    let ret = translation[id] || id;

    // processing variables
    const interpolateParams = arg => {
        let s = arg;
        if (params) {
            _.forOwn(params, (val, varName) => {
                const regex = regexpCache[varName];
                if (regex) {
                    s = s.replace(regex, val);
                }
            });
        }
        return s;
    };

    // processing segments
    if (ret.forEach) {
        const original = ret;
        ret = [];
        original.forEach(segment => {
            // simple string segment
            if (typeof segment === 'string') {
                ret.push(segment);
                return;
            }
            // segment with placeholders
            const segmentProcessor = segmentParams && segmentParams[segment.name] || null;
            if (typeof segmentProcessor === 'function') {
                ret.push(segmentProcessor(interpolateParams(segment.text)));
            } else {
                // this should not happen normally, but in case there is mistake in locale
                    // or in code - we'll show unprocessed segment text
                ret.push(segment.text);
            }
        });
    }
    // attempt to make a fail-safe logic, by providing the client code with return type it expects
        // even if there is a mixup with locales
    if (segmentParams && !ret.forEach) {
        ret = [ret];
    }
    if (!segmentParams && ret.forEach) {
        ret = ret.join('');
    }

    // processing variables
    if (params) {
        _.forOwn(params, (val, varName) => {
            const regex = regexpCache[varName];
            if (regex) {
                ret = segmentParams
                ? ret.map(segment =>
                          (_.isObject(segment) ? segment : segment.replace(regex, val)))
                : ret.replace(regex, params[varName]);
            }
        });
    }
    return ret;
}

function compileTranslation() {
    // iterating here because substituteReferences needs to be recursive
    _.forOwn(translation, (str, key) => {
        substituteReferences(key);
    });
    buildRegexpCache();
    parseSegments();
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
    _.forOwn(replacements, (val, r) => {
        str = str.replace(new RegExp(`\{#${r}\}`, 'g'), val);
    });
    // saving processed string
    translation[key] = str;
}

function buildRegexpCache() {
    regexpCache = {};
    const varExp = /\{([a-zA-Z0-9_]+)\}/g;
    _.forOwn(translation, (str) => {
        let match = varExp.exec(str);
        while (match !== null) {
            // found variable name for future substitutions
            const varName = match[1];
            if (regexpCache[varName]) {
                // generating replacement regexp
                regexpCache[varName] = new RegExp(`\{${varName}\}`, 'g');
            }
            match = varExp.exec(str);
        }
    });
}

function parseSegments() {
    const segmentExp = /<([a-zA-Z0-9_]+)>(.*?)<\/>/g;
    _.forOwn(translation, (str, key) => {
        let segments = null;
        let position = 0;
        let match = segmentExp.exec(str);
        while (match !== null) {
            segments = segments || [];
            const segmentName = match[1];
            const segmentText = match[2];
            // check if we need to push a plain text segment
            if (match.index > position) {
                segments.push(str.substr(position, match.index));
            }
            segments.push({ name: segmentName, text: segmentText });
            position = segmentExp.lastIndex;
            match = segmentExp.exec(str);
        }

        if (segments) {
            // tail, if any
            if (position !== 0 && position < str.length) {
                segments.push(str.substr(position));
            }
            translation[key] = segments;
        }
    });
}

/*
    function loadTranslationFile(locale) {
    const url = 'locales/' + locale + '.json';
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        if (xhr.overrideMimeType)
            xhr.overrideMimeType('text/plain');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0)
                    resolve(xhr.responseText);
                else
                    reject();
            }
        };

        xhr.open('GET', url);
        xhr.send('');
    });
}*/

module.exports = {
    loadLocale,
    t,
    has
};
