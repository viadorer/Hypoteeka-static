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

        // If Alpine.js is present, initialize it for the newly injected subtree
        try {
          if (window.Alpine && typeof window.Alpine.initTree === 'function') {
            window.Alpine.initTree(target);
          }
        } catch (e) {
          console.warn('Alpine init on injected include failed:', e);
        }

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

    // Cookie consent (granular) with conditional tracker loading
    (function consentManager() {
      var CONSENT_KEY = 'cookieConsentV2';
      var GA_ID = 'G-Q6HN5J19BT'; // existing measurement ID from index.html
      var HJ_ID = 6436713; // existing Hotjar ID from index.html

      function getConsent() {
        try {
          var raw = localStorage.getItem(CONSENT_KEY);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (_) {
          return null;
        }
      }

      function saveConsent(obj) {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(obj));
      }

      function loadGA() {
        if (window.__gaLoaded) return;
        window.__gaLoaded = true;
        // Define dataLayer/gtag and load script
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_ID);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
      }

      function loadHotjar() {
        if (window.__hjLoaded) return;
        window.__hjLoaded = true;
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:HJ_ID,hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      }

      function applyConsent(consent) {
        // Necessary cookies have no scripts to load here.
        if (consent && consent.analytics === true) {
          loadGA();
          loadHotjar();
        }
      }

      // Public API to open settings
      window.openCookieSettings = function openCookieSettings() {
        renderModal(getConsent());
      };

      function closeAndRemove(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }

      function renderBanner() {
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
          '    Tento web používá cookies pro zajištění základních funkcí a pro analýzu návštěvnosti. Svá nastavení můžete upravit.',
          '  </div>',
          '  <div style="display: flex; gap: 8px; margin-left: auto;">',
          '    <button id="banner-settings" style="padding: 10px 14px; border-radius: 9999px; border: 1px solid #0D3D66; background: #fff; color: #0D3D66; font-weight: 600;">Nastavení</button>',
          '    <button id="banner-reject" style="padding: 10px 14px; border-radius: 9999px; border: 1px solid #0D3D66; background: #fff; color: #0D3D66; font-weight: 600;">Odmítnout</button>',
          '    <button id="banner-accept" style="padding: 10px 14px; border-radius: 9999px; border: 0; background: #0D3D66; color: #fff; font-weight: 600;">Přijmout vše</button>',
          '  </div>',
          '</div>'
        ].join('');
        document.body.appendChild(banner);

        banner.querySelector('#banner-accept').addEventListener('click', function(){
          var c = { necessary: true, analytics: true, marketing: false, ts: Date.now() };
          saveConsent(c);
          applyConsent(c);
          closeAndRemove(banner);
        });
        banner.querySelector('#banner-reject').addEventListener('click', function(){
          var c = { necessary: true, analytics: false, marketing: false, ts: Date.now() };
          saveConsent(c);
          // do not load trackers
          closeAndRemove(banner);
        });
        banner.querySelector('#banner-settings').addEventListener('click', function(){
          closeAndRemove(banner);
          renderModal(getConsent());
        });
      }

      function renderModal(existing) {
        var modal = document.createElement('div');
        modal.id = 'cookie-modal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.zIndex = '10000';
        modal.style.background = 'rgba(0,0,0,0.4)';
        modal.innerHTML = [
          '<div role="dialog" aria-modal="true" style="max-width: 720px; margin: 10vh auto; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden;">',
          '  <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">',
          '    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">Nastavení cookies</h2>',
          '  </div>',
          '  <div style="padding: 20px 24px;">',
          '    <div style="margin-bottom: 16px;">',
          '      <label style="display: flex; align-items: flex-start; gap: 12px;">',
          '        <input type="checkbox" id="c-necessary" checked disabled>',
          '        <div><div style="font-weight:600; color:#111827;">Nezbytné</div><div style="font-size:14px; color:#6b7280;">Vždy aktivní – zajišťují základní funkce webu.</div></div>',
          '      </label>',
          '    </div>',
          '    <div style="margin-bottom: 16px;">',
          '      <label style="display: flex; align-items: flex-start; gap: 12px;">',
          '        <input type="checkbox" id="c-analytics">',
          '        <div><div style="font-weight:600; color:#111827;">Analytické</div><div style="font-size:14px; color:#6b7280;">Pomáhají nám pochopit, jak se web používá (Google Analytics, Hotjar).</div></div>',
          '      </label>',
          '    </div>',
          '    <div style="margin-bottom: 8px;">',
          '      <label style="display: flex; align-items: flex-start; gap: 12px;">',
          '        <input type="checkbox" id="c-marketing">',
          '        <div><div style="font-weight:600; color:#111827;">Marketingové</div><div style="font-size:14px; color:#6b7280;">Využívají se pro personalizaci a remarketing.</div></div>',
          '      </label>',
          '    </div>',
          '  </div>',
          '  <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display:flex; gap:8px; justify-content: flex-end;">',
          '    <button id="m-reject" style="padding:10px 14px; border-radius:9999px; border:1px solid #0D3D66; background:#fff; color:#0D3D66; font-weight:600;">Odmítnout vše</button>',
          '    <button id="m-save" style="padding:10px 14px; border-radius:9999px; border:1px solid #0D3D66; background:#fff; color:#0D3D66; font-weight:600;">Uložit nastavení</button>',
          '    <button id="m-accept" style="padding:10px 14px; border-radius:9999px; border:0; background:#0D3D66; color:#fff; font-weight:600;">Přijmout vše</button>',
          '  </div>',
          '</div>'
        ].join('');
        document.body.appendChild(modal);

        var analyticsInput = modal.querySelector('#c-analytics');
        var marketingInput = modal.querySelector('#c-marketing');
        if (existing) {
          analyticsInput.checked = !!existing.analytics;
          marketingInput.checked = !!existing.marketing;
        }

        modal.querySelector('#m-accept').addEventListener('click', function(){
          var c = { necessary: true, analytics: true, marketing: true, ts: Date.now() };
          saveConsent(c);
          applyConsent(c);
          closeAndRemove(modal);
        });
        modal.querySelector('#m-reject').addEventListener('click', function(){
          var c = { necessary: true, analytics: false, marketing: false, ts: Date.now() };
          saveConsent(c);
          closeAndRemove(modal);
        });
        modal.querySelector('#m-save').addEventListener('click', function(){
          var c = { necessary: true, analytics: !!analyticsInput.checked, marketing: !!marketingInput.checked, ts: Date.now() };
          saveConsent(c);
          applyConsent(c);
          closeAndRemove(modal);
        });
        // Close on backdrop click
        modal.addEventListener('click', function(e){
          if (e.target === modal) closeAndRemove(modal);
        });
      }

      try {
        var existing = getConsent();
        if (existing) {
          applyConsent(existing);
        } else {
          renderBanner();
        }
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
