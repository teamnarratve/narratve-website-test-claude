/* Google Analytics 4 bootstrap (only loaded when site.json → analytics.ga4 is set). */
(function () {
  var el = document.currentScript;
  var id = el && el.getAttribute('data-id');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
})();
