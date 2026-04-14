(function () {
  window.currentLang = localStorage.getItem('al_lang') || 'en';

  function applyLang(lang) {
    const label = lang === 'en' ? 'FR' : 'EN';
    document.querySelectorAll('.lang-btn').forEach(btn => { btn.textContent = label; });
    document.querySelectorAll('[data-en]').forEach(el => { el.innerHTML = el.dataset[lang]; });
    document.querySelectorAll('[data-ph-en]').forEach(el => {
      el.placeholder = lang === 'en' ? el.dataset.phEn : el.dataset.phFr;
    });
  }

  window.toggleLang = function () {
    window.currentLang = window.currentLang === 'en' ? 'fr' : 'en';
    localStorage.setItem('al_lang', window.currentLang);
    applyLang(window.currentLang);
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (window.currentLang === 'fr') applyLang('fr');
    else applyLang('en');
  });
})();
