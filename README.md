## Peerio client translations

Peerio client apps implement translations with Peerio.Translator library

### Translation workflow

1. New strings are added to 'dev' branch of peerio-copy/client.json
2. When ready, dev branch is getting merged to master
3. Github hook triggers Peerio service which uploads updated file to transifex
4. Strings get translated on transifex site
5. Developers run transifex client on mobile repository to download translation files

### developers

___Tools and environment___

1. install transifex client
```
brew install python
sudo pip install transifex-client
```
2. clone peerio-copy repository
3. switch to dev branch 
4. link peerio-copy to peerio-client-mobile
```
cd peerio-copy
bower link
cd ../peerio-client-mobile
bower link peerio-copy
```

___updating files___

1. `bower-installer` will copy latest `client_en_.json` from linked peerio-copy package to peerio-client-mobile/locales folder
2. `gulp localize` will pull latest translations file from transifex (except english)
3. `gulp compile` will copy all translations from /locales folder to /www/locales

___tools___

1. `gulp find-unused-locale-strings` does what it says
2. `gulp find-duplicate-locale-strings` does what it says

___using translator api___

Translation function is available as `t()` or `window.t()` or `Peerio.Translator.t()` or `Peerio.Translator.translate()`

1. regular string
  ```
  t('stringKey')
  ```

2. string with variable placeholders
  ```
  // "progress": "uploading {current} from {max}"
  t('progress', {current:5, max:100})
  ```

3. strings with segments/wrappers
  ```
  // "link": "click \<url>here</>"
  t('link', {url: segment => <a href=''>segment</a>)
  ```

Do not cache localized strings, remember that locale can change on the fly.
If you absolutely have to do it - listen to locale change event to rebuild the cache.

### translators

1. use `{#hashKey}` to reference another string 
  ```
  {
    "greet": "Hello",
    "personalGreet": "{#greet}, friend!"
  }
  ```

2. don't change anything inside curly braces 
  ```
  "bla bla {i'm a variable set by developers}"
  ```

3. if you see a segment, get the idea of what it means from the name, and don't change anything inside angle brackets
  ```
  "<url>click here</> to get happy"
  "this is really <emphasis>important</>"
  ```
