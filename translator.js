(function (translator) {
    'use strict';

    // currently loaded translation dictionary
    var translation = null;
    // regexps cache for substituting variables in translation strings
    var regexpCache = {};

    translator.locale = null;

    translator.loadLocale = function (locale) {
        if (translator.locale === locale) return Promise.resolve();
        return loadTranslationFile(locale)
            .then(function (text) {
                translation = JSON.parse(text);
                compileTranslation();
                translator.locale = locale;
                //TODO change to agnostic event system
                if(window.Peerio && Peerio.Action) Peerio.Action.localeChanged();
            })
            .catch(function (err) {
                console.error('Failed to load locale {0}. {1}', locale, err);
                return Promise.reject(err);
            });
    };

    translator.has = function (id) {
        return !!translation[id];
    };

    translator.t = translator.translate = function (id, params, segmentParams) {
        var ret = translation[id] || id;

        // processing variables
        var interpolateParams = function (s) {
            if (params) {
                for (var varName in params) {
                    var regex = regexpCache[varName];
                    if (!regex) continue;
                    s = s.replace(regex, params[varName]);
                }
            }
            return s;
        };

        // processing segments
        if (ret.forEach) {
            var original = ret;
            ret = [];
            original.forEach(function (segment) {
                // simple string segment
                if (typeof segment === 'string') {
                    ret.push(segment);
                    return;
                }
                // segment with placeholders
                var segmentProcessor = segmentParams && segmentParams[segment.name] || null;
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
            for (var varName in params) {
                var regex = regexpCache[varName];
                if (!regex) continue;
                ret = segmentParams
                    ? ret.map(function (segment) {
                    return (_.isObject(segment) ? segment : segment.replace(regex, params[varName]))
                })
                    : ret.replace(regex, params[varName]);
            }
        }
        return ret;
    };

    function compileTranslation() {
        //iterating here because substituteReferences needs to be recursive
        for (var key in translation) {
            substituteReferences(key);
        }
        buildRegexpCache();
        parseSegments();
    }

    // for specified key, finds if there are any references to other keys
    // and replaces original references with referenced strings, recursively
    function substituteReferences(key) {
        // fallback is needed, because key might be a wrong reference from the string
        var str = translation[key] || key;
        var match, replacements = {};
        var refExp = /\{#([a-zA-Z0-9_]+)\}/g;

        while ((match = refExp.exec(str)) !== null) {
            // found reference key
            var ref = match[1];
            // processing it first, so we don't use unprocessed string
            substituteReferences(ref);
            if (replacements[ref]) continue;
            // saving ref string to replace later
            replacements[ref] = translator.t(ref);
        }
        // replacing all referenced strings
        for (var r in replacements) {
            str = str.replace(new RegExp('\{#' + r + '\}', 'g'), replacements[r]);
        }
        // saving processed string
        translation[key] = str;
    }

    function buildRegexpCache() {
        regexpCache = {};
        var varExp = /\{([a-zA-Z0-9_]+)\}/g;
        var match;
        for (var key in translation) {
            var str = translation[key];
            while ((match = varExp.exec(str)) !== null) {
                // found variable name for future substitutions
                var varName = match[1];
                if (regexpCache[varName]) continue;
                // generating replacement regexp
                regexpCache[varName] = new RegExp('\{' + varName + '\}', 'g');
            }
        }
    }

    function parseSegments() {
        var segmentExp = /<([a-zA-Z0-9_]+)>(.*?)<\/>/g;
        var match;
        for (var key in translation) {
            var str = translation[key];
            var segments = null;
            var position = 0;

            while ((match = segmentExp.exec(str)) !== null) {
                segments = segments || [];
                var segmentName = match[1];
                var segmentText = match[2];
                // check if we need to push a plain text segment
                if (match.index > position) {
                    segments.push(str.substr(position, match.index));
                }
                segments.push({name: segmentName, text: segmentText});
                position = segmentExp.lastIndex;
            }

            if (segments) {
                // tail, if any
                if (position != 0 && position < str.length) {
                    segments.push(str.substr(position));
                }
                translation[key] = segments;
            }
        }
    }

    function loadTranslationFile(locale) {
        var url = 'locales/' + locale + '.json';
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
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.translator = self.translator || {}));
