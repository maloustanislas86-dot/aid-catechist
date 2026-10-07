/**
 * Lumière — script commun
 * - Icônes Lucide
 * - Menu mobile
 * - Filtrage des ressources par catégorie + recherche (ressources.html)
 * - Validation dynamique du formulaire (contact.html)
 */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Icônes ---------- */
  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  /* ---------- Menu mobile ---------- */
  function initMobileMenu() {
    const btn = $('#menu-toggle');
    const menu = $('#mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      btn.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
      menu.classList.toggle('hidden', isOpen);
      $('[data-icon-open]', btn).classList.toggle('hidden', !isOpen);
      $('[data-icon-close]', btn).classList.toggle('hidden', isOpen);
    });
  }

  /* ---------- Année du pied de page ---------- */
  function initYear() {
    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- Filtrage des ressources ---------- */
  function initResourceFilter() {
    const grid = $('#resource-grid');
    if (!grid) return;

    const buttons = $$('[data-filter]');
    const cards = $$('[data-category]', grid);
    const search = $('#resource-search');
    const count = $('#resource-count');
    const empty = $('#resource-empty');
    const reset = $('#resource-reset');

    const ACTIVE = ['bg-electric', 'border-electric', 'text-white', 'shadow-glow'];
    const INACTIVE = ['bg-white/5', 'border-white/10', 'text-slate-300', 'hover:border-electric/50', 'hover:text-white'];
    const validFilters = new Set(buttons.map((b) => b.dataset.filter));

    const normalize = (str) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Catégorie initiale depuis l'URL (ex. ressources.html?categorie=audio)
    const fromUrl = new URLSearchParams(window.location.search).get('categorie');
    let currentFilter = validFilters.has(fromUrl) ? fromUrl : 'all';
    let query = '';

    function render() {
      let visible = 0;

      cards.forEach((card) => {
        const matchCategory = currentFilter === 'all' || card.dataset.category === currentFilter;
        const matchText = !query || normalize(card.textContent).includes(query);
        const show = matchCategory && matchText;
        const wasHidden = card.classList.contains('hidden');

        card.classList.toggle('hidden', !show);
        if (show) {
          visible++;
          if (wasHidden && card.animate) {
            card.animate(
              [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
              { duration: 280, easing: 'ease-out' }
            );
          }
        }
      });

      buttons.forEach((btn) => {
        const active = btn.dataset.filter === currentFilter;
        btn.setAttribute('aria-pressed', String(active));
        ACTIVE.forEach((c) => btn.classList.toggle(c, active));
        INACTIVE.forEach((c) => btn.classList.toggle(c, !active));
      });

      if (count) count.textContent = `${visible} ressource${visible > 1 ? 's' : ''}`;
      if (empty) empty.classList.toggle('hidden', visible !== 0);
    }

    function syncUrl() {
      const url = new URL(window.location.href);
      if (currentFilter === 'all') url.searchParams.delete('categorie');
      else url.searchParams.set('categorie', currentFilter);
      window.history.replaceState(null, '', url);
    }

    buttons.forEach((btn) =>
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        syncUrl();
        render();
      })
    );

    if (search) {
      search.addEventListener('input', () => {
        query = normalize(search.value);
        render();
      });
    }

    if (reset) {
      reset.addEventListener('click', () => {
        currentFilter = 'all';
        query = '';
        if (search) search.value = '';
        syncUrl();
        render();
      });
    }

    render();
  }

  /* ---------- Validation du formulaire de contact ---------- */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const successBox = $('#form-success');
    const errorBox = $('#form-errors');
    const submitBtn = $('#submit-btn');
    const submitLabel = $('[data-label]', submitBtn);
    const messageCount = $('#message-count');
    const newMessageBtn = $('#form-new');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE_RE = /^\+?[\d\s.\-()]{8,20}$/;
    const MIN_MESSAGE = 20;

    // Chaque règle retourne un message d'erreur, ou '' si le champ est valide.
    const rules = {
      name: (el) => {
        const v = el.value.trim();
        if (!v) return 'Le nom est requis.';
        if (v.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
        return '';
      },
      email: (el) => {
        const v = el.value.trim();
        if (!v) return 'L’adresse e-mail est requise.';
        if (!EMAIL_RE.test(v)) return 'Format invalide (ex. nom@domaine.com).';
        return '';
      },
      phone: (el) => {
        const v = el.value.trim();
        if (v && !PHONE_RE.test(v)) return 'Numéro de téléphone invalide.';
        return '';
      },
      subject: (el) => (el.value ? '' : 'Veuillez choisir un sujet.'),
      message: (el) => {
        const len = el.value.trim().length;
        if (!len) return 'Le message est requis.';
        if (len < MIN_MESSAGE) return `Encore ${MIN_MESSAGE - len} caractère${MIN_MESSAGE - len > 1 ? 's' : ''} minimum.`;
        return '';
      },
      consent: (el) => (el.checked ? '' : 'Votre accord est nécessaire pour envoyer le message.')
    };

    const touched = new Set();

    function setFieldState(el, message) {
      const errorEl = $(`#${el.name}-error`);
      const invalid = Boolean(message);
      const isOptionalEmpty = el.name === 'phone' && !el.value.trim();

      el.setAttribute('aria-invalid', String(invalid));

      if (el.type !== 'checkbox') {
        el.classList.toggle('border-red-500/70', invalid);
        el.classList.toggle('border-emerald-500/60', !invalid && !isOptionalEmpty);
        el.classList.toggle('border-white/10', isOptionalEmpty && !invalid);
        el.classList.toggle('focus:border-electric', !invalid);
      }

      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.toggle('hidden', !invalid);
        errorEl.classList.toggle('flex', invalid);
      }
    }

    function validateField(el) {
      const rule = rules[el.name];
      if (!rule) return true;
      const message = rule(el);
      setFieldState(el, message);
      return !message;
    }

    function clearStates() {
      Object.keys(rules).forEach((name) => {
        const el = form.elements[name];
        el.removeAttribute('aria-invalid');
        el.classList.remove('border-red-500/70', 'border-emerald-500/60');
        el.classList.add('border-white/10');
        const errorEl = $(`#${name}-error`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.add('hidden');
          errorEl.classList.remove('flex');
        }
      });
      touched.clear();
      errorBox.classList.add('hidden');
      errorBox.classList.remove('flex');
    }

    function updateCount() {
      const el = form.elements.message;
      const len = el.value.length;
      messageCount.textContent = `${len} / ${el.maxLength}`;
      messageCount.classList.toggle('text-amber-400', len > el.maxLength * 0.9);
    }

    // Validation au fil de la saisie (après un premier passage dans le champ)
    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];

      el.addEventListener('blur', () => {
        touched.add(name);
        validateField(el);
      });

      const live = () => {
        if (name === 'message') updateCount();
        if (touched.has(name) || el.type === 'checkbox' || el.tagName === 'SELECT') {
          touched.add(name);
          validateField(el);
        }
        // Masquer le résumé dès que tout est corrigé
        if (!errorBox.classList.contains('hidden')) {
          const allValid = Object.keys(rules).every((n) => !rules[n](form.elements[n]));
          if (allValid) {
            errorBox.classList.add('hidden');
            errorBox.classList.remove('flex');
          }
        }
      };
      el.addEventListener('input', live);
      el.addEventListener('change', live);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let firstInvalid = null;
      Object.keys(rules).forEach((name) => {
        const el = form.elements[name];
        touched.add(name);
        if (!validateField(el) && !firstInvalid) firstInvalid = el;
      });

      if (firstInvalid) {
        errorBox.classList.remove('hidden');
        errorBox.classList.add('flex');
        firstInvalid.focus();
        return;
      }

      errorBox.classList.add('hidden');
      errorBox.classList.remove('flex');
      submitBtn.disabled = true;
      submitLabel.textContent = 'Envoi en cours…';

      const payload = Object.fromEntries(new FormData(form).entries());

      // Envoi simulé : remplacez ce bloc par un appel fetch() vers votre serveur
      // ou un service de formulaires, par ex. :
      // fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setTimeout(() => {
        console.info('Message prêt à être envoyé :', payload);
        submitBtn.disabled = false;
        submitLabel.textContent = 'Envoyer le message';
        form.reset();
        clearStates();
        updateCount();
        form.classList.add('hidden');
        successBox.classList.remove('hidden');
      }, 1200);
    });

    if (newMessageBtn) {
      newMessageBtn.addEventListener('click', () => {
        successBox.classList.add('hidden');
        form.classList.remove('hidden');
        form.elements.name.focus();
      });
    }

    updateCount();
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderIcons();
    initMobileMenu();
    initYear();
    initResourceFilter();
    initContactForm();
  });
})();