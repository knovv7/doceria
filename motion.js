(() => {
  'use strict';

  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !('IntersectionObserver' in window)) return;

  // Executado no head para evitar que a página apareça antes da apresentação.
  root.classList.add('motion-enabled', 'intro-active');
  let intro;
  let revealObserver;
  let introTimer;
  let exitTimer;
  let finished = false;
  let leaving = false;
  let inertElements = [];

  function revealEverything() {
    revealObserver?.disconnect();
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('in-view'));
  }

  function unlockPage() {
    if (finished) return;
    finished = true;
    clearTimeout(introTimer);
    clearTimeout(exitTimer);
    clearTimeout(safetyTimer);
    const restoreFocus = intro?.contains(document.activeElement);
    if (intro) intro.hidden = true;
    root.classList.remove('intro-active');
    root.classList.add('site-ready');
    inertElements.forEach(({ element, wasInert }) => { element.inert = wasInert; });
    if (restoreFocus) {
      const main = document.querySelector('main');
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
    }
    startReveals();
  }

  // Se outro script falhar, o visitante ainda consegue acessar toda a página.
  const safetyTimer = setTimeout(() => {
    unlockPage();
    root.classList.remove('motion-enabled');
    revealEverything();
  }, 5000);

  function startReveals() {
    if (preference.matches || !root.classList.contains('motion-enabled')) {
      revealEverything();
      return;
    }
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  }

  function leaveIntro() {
    if (leaving || finished) return;
    leaving = true;
    clearTimeout(introTimer);
    root.classList.add('site-ready');
    intro.classList.add('is-leaving');
    exitTimer = setTimeout(unlockPage, 680);
  }

  function initialize() {
    if (finished || preference.matches) return;
    intro = document.getElementById('brand-intro');
    if (!intro) { unlockPage(); return; }

    // Os cards criados pelo app já existem quando DOMContentLoaded é disparado.
    document.querySelectorAll('.sweet-footer-main > *, .sweet-footer-bottom').forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--index', index % 3);
    });
    document.querySelectorAll('.pickup-card, .care-card').forEach((element, index) => {
      element.style.setProperty('--index', index);
    });

    inertElements = [...document.querySelectorAll('header, main, footer, .skip-link')].map(element => ({ element, wasInert: element.inert }));
    inertElements.forEach(({ element }) => { element.inert = true; });
    intro.hidden = false;
    intro.focus({ preventScroll: true });
    intro.querySelector('.intro-skip').addEventListener('click', leaveIntro);
    intro.addEventListener('keydown', event => { if (event.key === 'Escape') leaveIntro(); });
    introTimer = setTimeout(leaveIntro, 1700);

    // Uma navegação por teclado também revela imediatamente o destino focado.
    document.addEventListener('focusin', event => {
      const target = event.target.closest('.reveal');
      if (target) { target.classList.add('in-view'); revealObserver?.unobserve(target); }
    });
  }

  preference.addEventListener('change', event => {
    if (!event.matches) return;
    unlockPage();
    root.classList.remove('motion-enabled');
    revealEverything();
  });
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
