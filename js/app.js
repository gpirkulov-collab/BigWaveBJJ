/* Big Wave BJJ — Main Application */
(function () {
  'use strict';

  /* ==============================
     Navigation
     ============================== */
  function initNavigation() {
    var hamburger = document.querySelector('.nav__hamburger');
    var mobileNav = document.querySelector('.nav__mobile');
    var nav = document.querySelector('.nav');

    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
      });

      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          hamburger.classList.remove('active');
          mobileNav.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }

    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('nav--scrolled', window.scrollY > 50);
      }, { passive: true });
    }

    highlightActiveLink();
  }

  function highlightActiveLink() {
    var path = location.pathname;
    var page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var linkPage = href.substring(href.lastIndexOf('/') + 1) || 'index.html';
      link.classList.toggle('active', linkPage === page);
    });
  }

  /* ==============================
     Language Switcher
     ============================== */
  function initLangSwitcher() {
    document.querySelectorAll('.lang-switcher').forEach(function (switcher) {
      var current = switcher.querySelector('.lang-switcher__current');
      var options = switcher.querySelectorAll('.lang-switcher__option');

      if (current) {
        current.addEventListener('click', function (e) {
          e.stopPropagation();
          switcher.classList.toggle('open');
        });
      }

      options.forEach(function (opt) {
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          var lang = opt.getAttribute('data-lang');
          if (lang) {
            i18n.setLanguage(lang);
            reloadDynamicContent(lang);
          }
          switcher.classList.remove('open');
        });
      });
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('.lang-switcher.open').forEach(function (s) {
        s.classList.remove('open');
      });
    });
  }

  function reloadDynamicContent(lang) {
    if (document.querySelector('.events__grid')) {
      loadEvents(lang);
    }
  }

  /* ==============================
     Scroll Animations
     ============================== */
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.fade-up, .fade-in');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ==============================
     Animated Counters
     ============================== */
  function initCounters() {
    var counters = document.querySelectorAll('.counter__number');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var raw = el.getAttribute('data-target');
    if (!raw) return;

    var hasSuffix = raw.endsWith('+');
    var target = parseInt(raw, 10);
    if (isNaN(target)) return;

    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.floor(eased * target);
      el.textContent = current + (hasSuffix ? '+' : '');
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ==============================
     Testimonials Slider
     ============================== */
  function initTestimonials() {
    var track = document.querySelector('.testimonials__track');
    var dots = document.querySelectorAll('.testimonials__dot');
    if (!track || !dots.length) return;

    var slides = track.children;
    var total = slides.length;
    var currentIndex = 0;
    var autoplayInterval = null;

    function goTo(index) {
      currentIndex = ((index % total) + total) % total;
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goTo(i);
        resetAutoplay();
      });
    });

    function startAutoplay() {
      autoplayInterval = setInterval(function () {
        goTo(currentIndex + 1);
      }, 5000);
    }

    function resetAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }

    goTo(0);
    startAutoplay();
  }

  /* ==============================
     Events Page
     ============================== */
  function initEvents() {
    var grid = document.querySelector('.events__grid');
    if (!grid) return;

    loadEvents(i18n.getCurrentLang());
    initEventFilters();
  }

  function loadEvents(lang) {
    var grid = document.querySelector('.events__grid');
    if (!grid) return;

    var path = getDataPath('data/events.json');

    function render(events) {
      events.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });

      grid.innerHTML = '';

      if (!events.length) {
        grid.innerHTML = '<div class="events__empty">' + i18n.t('events.empty') + '</div>';
        return;
      }

      events.forEach(function (ev) {
        grid.appendChild(createEventCard(ev, lang));
      });

      applyActiveFilter();
    }

    if (location.protocol === 'file:') {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && (xhr.status === 0 || xhr.status === 200)) {
          try { render(JSON.parse(xhr.responseText)); } catch (e) { /* silent */ }
        }
      };
      xhr.send();
      return;
    }

    fetch(path)
      .then(function (res) { return res.json(); })
      .then(render)
      .catch(function () {
        grid.innerHTML = '<div class="events__empty">Failed to load events.</div>';
      });
  }

  function getDataPath(file) {
    if (location.protocol === 'file:') {
      var pagePath = location.pathname;
      var dir = pagePath.substring(0, pagePath.lastIndexOf('/') + 1);
      return dir + file;
    }
    return file;
  }

  function createEventCard(ev, lang) {
    var card = document.createElement('div');
    card.className = 'event-card fade-up visible';
    card.setAttribute('data-type', ev.type);

    var title = (typeof ev.title === 'object') ? (ev.title[lang] || ev.title.en) : ev.title;
    var desc = (typeof ev.description === 'object') ? (ev.description[lang] || ev.description.en) : ev.description;
    var loc = (typeof ev.location === 'object') ? (ev.location[lang] || ev.location.en) : ev.location;
    var details = (typeof ev.details === 'object') ? (ev.details[lang] || ev.details.en) : (ev.details || '');
    var badgeClass = 'event-card__badge event-card__badge--' + ev.type;
    var badgeLabel = ev.type.charAt(0).toUpperCase() + ev.type.slice(1);

    var dateFormatted = formatDate(ev.date, lang);

    card.innerHTML =
      '<div class="event-card__header">' +
        '<h3>' + escapeHTML(title) + '</h3>' +
        '<span class="' + badgeClass + '">' + escapeHTML(badgeLabel) + '</span>' +
      '</div>' +
      '<div class="event-card__body">' +
        '<div class="event-card__meta">' +
          '<span>' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
            escapeHTML(dateFormatted + (ev.time ? ', ' + ev.time : '')) +
          '</span>' +
          '<span>' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
            escapeHTML(loc) +
          '</span>' +
        '</div>' +
        '<p class="event-card__description">' + escapeHTML(desc) + '</p>' +
      '</div>' +
      '<div class="event-card__details">' +
        '<div class="event-card__details-inner">' +
          '<p>' + escapeHTML(details) + '</p>' +
        '</div>' +
      '</div>' +
      '<button class="event-card__toggle" aria-expanded="false">' +
        '<span>' + i18n.t('events.details') + '</span>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>';

    var toggle = card.querySelector('.event-card__toggle');
    var detailsEl = card.querySelector('.event-card__details');
    toggle.addEventListener('click', function () {
      var isOpen = detailsEl.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelector('span').textContent = i18n.t(isOpen ? 'events.collapse' : 'events.details');
    });

    return card;
  }

  function initEventFilters() {
    var buttons = document.querySelectorAll('.filter-btn');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyActiveFilter();
      });
    });
  }

  function applyActiveFilter() {
    var activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return;

    var filter = activeBtn.getAttribute('data-filter');
    var cards = document.querySelectorAll('.event-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var type = card.getAttribute('data-type');
      var show = !filter || filter === 'all' || type === filter;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    var empty = document.querySelector('.events__empty');
    if (visibleCount === 0 && !empty) {
      var grid = document.querySelector('.events__grid');
      var msg = document.createElement('div');
      msg.className = 'events__empty';
      msg.textContent = i18n.t('events.empty');
      grid.appendChild(msg);
    } else if (visibleCount > 0 && empty) {
      empty.remove();
    }
  }

  function formatDate(dateStr, lang) {
    try {
      var d = new Date(dateStr + 'T00:00:00');
      var localeMap = { en: 'en-GB', ru: 'ru-RU', me: 'sr-Latn-ME' };
      return d.toLocaleDateString(localeMap[lang] || 'en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==============================
     Contact Form
     ============================== */
  function initContactForm() {
    var form = document.querySelector('.contact-form form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      submitForm(form);
    });
  }

  function validateForm(form) {
    var valid = true;
    clearErrors(form);

    var name = form.querySelector('[name="name"]');
    var email = form.querySelector('[name="email"]');
    var message = form.querySelector('[name="message"]');

    if (name && !name.value.trim()) {
      showFieldError(name);
      valid = false;
    }

    if (email) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        showFieldError(email);
        valid = false;
      }
    }

    if (message && !message.value.trim()) {
      showFieldError(message);
      valid = false;
    }

    return valid;
  }

  function showFieldError(input) {
    input.classList.add('error');
    var errEl = input.parentElement.querySelector('.form-error');
    if (errEl) errEl.style.display = 'block';
  }

  function clearErrors(form) {
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
    });
    form.querySelectorAll('.form-error').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function submitForm(form) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    var data = {
      name: (form.querySelector('[name="name"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      phone: (form.querySelector('[name="phone"]') || {}).value || '',
      message: (form.querySelector('[name="message"]') || {}).value || ''
    };

    var promises = [];

    if (SITE_CONFIG.telegram.enabled && SITE_CONFIG.telegram.botToken && SITE_CONFIG.telegram.chatId) {
      promises.push(sendTelegram(data));
    }

    if (SITE_CONFIG.formspree.enabled && SITE_CONFIG.formspree.endpoint) {
      promises.push(sendFormspree(data));
    }

    if (!promises.length) {
      promises.push(Promise.reject(new Error('No submission method configured')));
    }

    Promise.all(promises)
      .then(function () {
        form.reset();
        clearErrors(form);
        var success = document.querySelector('.form-success');
        if (success) success.classList.add('show');
        setTimeout(function () {
          if (success) success.classList.remove('show');
        }, 5000);
      })
      .catch(function () {
        alert(i18n.t('contacts.formError') || 'Something went wrong. Please try again.');
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function sendTelegram(data) {
    var text =
      'New message from BigWaveBJJ.com\n\n' +
      'Name: ' + data.name + '\n' +
      'Email: ' + data.email + '\n' +
      (data.phone ? 'Phone: ' + data.phone + '\n' : '') +
      'Message: ' + data.message;

    return fetch('https://api.telegram.org/bot' + SITE_CONFIG.telegram.botToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: SITE_CONFIG.telegram.chatId,
        text: text
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('Telegram API error');
    });
  }

  function sendFormspree(data) {
    return fetch(SITE_CONFIG.formspree.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('Formspree error');
    });
  }

  /* ==============================
     Leaflet Map
     ============================== */
  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    var lat = SITE_CONFIG.club.mapLat;
    var lng = SITE_CONFIG.club.mapLng;

    var map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup('<strong>Big Wave BJJ</strong><br>' + SITE_CONFIG.club.address)
      .openPopup();
  }

  /* ==============================
     Init
     ============================== */
  document.addEventListener('DOMContentLoaded', function () {
    i18n._init().then(function () {
      initNavigation();
      initLangSwitcher();
      initScrollAnimations();
      initCounters();
      initTestimonials();
      initEvents();
      initContactForm();
      initMap();
    }).catch(function (err) {
      console.warn('i18n init failed, proceeding with defaults:', err);
      initNavigation();
      initLangSwitcher();
      initScrollAnimations();
      initCounters();
      initTestimonials();
      initEvents();
      initContactForm();
      initMap();
    });
  });
})();
