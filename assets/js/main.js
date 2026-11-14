// Runs on every page: shared widgets, menu, language switch, quote list and chat.
import { $, $$, readSpanishFromPage, savedLang, setLang, start } from './core.js';
import { loadNames } from './names.js';
import { initQuote, paintAddButtons } from './quote.js';
import { mountWidgets } from './widgets.js';
import { initChat } from './chat.js';

start('widgets', mountWidgets);
// Spanish is read from the page itself, so it has to happen after the widgets are in it.
start('texts', readSpanishFromPage);

start('scroll reveal', () => {
  const sections = $$('.rv');
  if (!sections.length || !('IntersectionObserver' in window)) return;   // without it, sections simply stay visible
  // Whatever is already on screen (or above it) stays visible; only sections further down get the fade-in.
  sections.filter(el => el.getBoundingClientRect().top < window.innerHeight).forEach(el => el.classList.add('vis'));
  document.documentElement.classList.add('reveal');
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('vis');
    io.unobserve(entry.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  sections.filter(el => !el.classList.contains('vis')).forEach(el => io.observe(el));
});

start('mobile menu', () => {
  const button = $('.nav-toggle');
  const menu = $('#mn');
  const setMenu = open => { menu.classList.toggle('open', open); button.setAttribute('aria-expanded', open); };
  button.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      const returnFocus = menu.contains(document.activeElement);
      setMenu(false);
      if (returnFocus) button.focus();
    }
  });
});

start('quote list', initQuote);
start('chat', initChat);
start('footer year', () => { $('#yr').textContent = new Date().getFullYear(); });

start('languages', () => {
  $$('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
  // Product names come from a separate file per language; the add buttons carry translated labels.
  document.addEventListener('carbelec:lang', () => { loadNames(); paintAddButtons(); });
  // The saved language is applied once every module of the page has run, so all of them hear the change.
  const applySaved = () => { if (savedLang() !== 'es') setLang(savedLang(), false); };
  // (Module scripts run before DOMContentLoaded, one after another.)
  if (document.readyState === 'complete') applySaved();
  else document.addEventListener('DOMContentLoaded', applySaved);
});
