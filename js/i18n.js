/* Big Wave BJJ — Internationalization Engine */
(function () {
  'use strict';

  const cache = {};
  let currentLang = null;
  let translations = {};

  function getByPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
  }

  function detectLanguage() {
    const stored = localStorage.getItem('lang');
    if (stored && SITE_CONFIG.supportedLangs.includes(stored)) return stored;

    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('ru')) return 'ru';
    if (nav.startsWith('sr') || nav.startsWith('hr') || nav.startsWith('bs') || nav.startsWith('cnr')) return 'me';

    return SITE_CONFIG.defaultLang;
  }

  function loadJSON(lang) {
    return new Promise(function (resolve, reject) {
      if (cache[lang]) {
        resolve(cache[lang]);
        return;
      }

      const path = getLocalePath(lang);

      if (location.protocol === 'file:') {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 0 || xhr.status === 200) {
              try {
                var data = JSON.parse(xhr.responseText);
                cache[lang] = data;
                resolve(data);
              } catch (e) {
                reject(new Error('Failed to parse ' + lang + '.json'));
              }
            } else {
              reject(new Error('Failed to load ' + lang + '.json'));
            }
          }
        };
        xhr.send();
        return;
      }

      fetch(path)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          cache[lang] = data;
          resolve(data);
        })
        .catch(reject);
    });
  }

  function getLocalePath(lang) {
    if (location.protocol === 'file:') {
      var pagePath = location.pathname;
      var dir = pagePath.substring(0, pagePath.lastIndexOf('/') + 1);
      return dir + 'locales/' + lang + '.json';
    }
    return 'locales/' + lang + '.json';
  }

  function applyTranslations(data) {
    translations = data;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = getByPath(data, key);
      if (val !== null) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = getByPath(data, key);
      if (val !== null) el.setAttribute('placeholder', val);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      var val = getByPath(data, key);
      if (val !== null) el.setAttribute('alt', val);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var val = getByPath(data, key);
      if (val !== null) el.innerHTML = val;
    });

    document.documentElement.setAttribute('lang', currentLang);

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      var descVal = getByPath(data, 'meta.description');
      if (descVal) metaDesc.setAttribute('content', descVal);
    }
  }

  function updateSwitcherUI(lang) {
    document.querySelectorAll('.lang-switcher__current span').forEach(function (el) {
      el.textContent = lang.toUpperCase();
    });

    document.querySelectorAll('.lang-switcher__option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });
  }

  function setLanguage(lang) {
    if (!SITE_CONFIG.supportedLangs.includes(lang)) {
      lang = SITE_CONFIG.defaultLang;
    }

    currentLang = lang;
    localStorage.setItem('lang', lang);
    updateSwitcherUI(lang);

    return loadJSON(lang).then(function (data) {
      applyTranslations(data);
      document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: lang } }));
      return data;
    });
  }

  function getCurrentLang() {
    return currentLang || detectLanguage();
  }

  function t(key) {
    return getByPath(translations, key) || key;
  }

  // Initialize on first load
  currentLang = detectLanguage();

  window.i18n = {
    setLanguage: setLanguage,
    getCurrentLang: getCurrentLang,
    t: t,
    _init: function () {
      return setLanguage(getCurrentLang());
    }
  };
})();
