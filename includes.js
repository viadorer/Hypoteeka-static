// includes.js - Unified loader for nav and footer across all pages
(function () {
  function ensureContainer(id, position) {
    var el = document.getElementById(id);
    if (el) return el;

    el = document.createElement('div');
    el.id = id;
    if (position === 'start') {
      // Prefer placing as the first child inside <body>
      document.body.insertBefore(el, document.body.firstChild);
    } else {
      // Default to end of body
      document.body.appendChild(el);
    }
    return el;
  }

  function loadInclude(targetId, url) {
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
        return res.text();
      })
      .then(function (html) {
        var target = document.getElementById(targetId);
        if (!target) target = ensureContainer(targetId, 'end');
        // Inject HTML
        target.innerHTML = html;

        // Execute any scripts contained in the injected HTML
        try {
          var scripts = target.querySelectorAll('script');
          scripts.forEach(function (oldScript) {
            var newScript = document.createElement('script');
            // Copy attributes
            for (var i = 0; i < oldScript.attributes.length; i++) {
              var attr = oldScript.attributes[i];
              newScript.setAttribute(attr.name, attr.value);
            }
            // Inline script content
            if (oldScript.textContent) {
              newScript.textContent = oldScript.textContent;
            }
            // Replace the old script with the new one to trigger execution
            oldScript.parentNode.replaceChild(newScript, oldScript);
          });
        } catch (e) {
          console.warn('Nepodařilo se spustit skripty v include', url, e);
        }
      })
      .catch(function (err) {
        console.error('Chyba při načítání souboru', url + ':', err);
      });
  }

  function init() {
    // Ensure containers exist
    ensureContainer('nav-container', 'start');
    ensureContainer('footer-container', 'end');

    // Globally hide embedded videos (YouTube/Vimeo iframes and HTML5 video tags)
    // This is injected once per page load to apply site-wide without editing each page.
    (function hideVideos() {
      try {
        var style = document.createElement('style');
        style.setAttribute('data-injected', 'hide-videos');
        style.textContent = [
          'iframe[src*="youtube.com"],',
          'iframe[src*="youtu.be"],',
          'iframe[src*="vimeo.com"],',
          'video { display: none !important; }'
        ].join('\n');
        document.head.appendChild(style);
      } catch (e) {
        console.warn('Nepodařilo se injektovat styl pro skrytí videí:', e);
      }
    })();

    // Load partials
    loadInclude('nav-container', '/nav.html');
    loadInclude('footer-container', '/footer.html');

    // Cookie consent banner (centralized)
    (function cookieConsent() {
      try {
        var CONSENT_KEY = 'cookieConsent';
        var consent = localStorage.getItem(CONSENT_KEY);

        // If a decision exists, do nothing
        if (consent === 'accepted' || consent === 'rejected') return;

        // Create banner
        var banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.style.position = 'fixed';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.bottom = '0';
        banner.style.zIndex = '9999';
        banner.style.background = 'rgba(255,255,255,0.98)';
        banner.style.boxShadow = '0 -4px 16px rgba(0,0,0,0.08)';
        banner.style.borderTop = '1px solid #e5e7eb';
        banner.innerHTML = [
          '<div style="max-width: 960px; margin: 0 auto; padding: 16px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">',
          '  <div style="flex: 1 1 520px; min-width: 260px; color: #111827; font-size: 14px; line-height: 1.5;">',
          '    Tento web používá soubory cookies pro zlepšení funkčnosti a analýzu návštěvnosti. Podrobnosti najdete v zásadách ochrany soukromí.',
          '  </div>',
          '  <div style="display: flex; gap: 8px; margin-left: auto;">',
          '    <button id="reject-cookies" style="padding: 10px 14px; border-radius: 9999px; border: 1px solid #0D3D66; background: #fff; color: #0D3D66; font-weight: 600;">Odmítnout</button>',
          '    <button id="accept-cookies" style="padding: 10px 14px; border-radius: 9999px; border: 0; background: #0D3D66; color: #fff; font-weight: 600;">Přijmout</button>',
          '  </div>',
          '</div>'
        ].join('');
        document.body.appendChild(banner);

        var acceptBtn = document.getElementById('accept-cookies');
        var rejectBtn = document.getElementById('reject-cookies');
        if (acceptBtn) acceptBtn.addEventListener('click', function () {
          localStorage.setItem(CONSENT_KEY, 'accepted');
          if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
        });
        if (rejectBtn) rejectBtn.addEventListener('click', function () {
          localStorage.setItem(CONSENT_KEY, 'rejected');
          if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
        });
      } catch (e) {
        console.warn('Cookie consent init failed:', e);
      }
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
