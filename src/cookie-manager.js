// src/cookie-manager.js
const GA_MEASUREMENT_ID = 'G-LJXG9E7JG2';

export function initCookieManager() {
    const consent = localStorage.getItem('cookieConsent');
    
    if (consent === 'accepted') {
        loadGoogleAnalytics();
    } else if (!consent) {
        showCookieBanner();
    }

    setupTrackingListeners();
}

function showCookieBanner() {
    // Check if banner already exists to prevent duplicates
    if (document.getElementById('cookie-banner')) return;

    const bannerHtml = `
        <div id="cookie-banner" class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 z-[100] transform transition-transform duration-500 translate-y-full">
            <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex-1 max-w-3xl">
                    <h3 class="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>🍪</span> Informativa sui Cookie
                    </h3>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        Utilizziamo cookie tecnici per il funzionamento del sito e, con il tuo consenso, cookie di profilazione e statistici (Google Analytics) per migliorare la tua esperienza e offrirti servizi personalizzati. 
                        Scegliendo "Accetta tutti", acconsenti all'uso di tutti i cookie.
                    </p>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <button id="btn-cookie-reject" class="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all text-sm whitespace-nowrap">
                        Rifiuta non necessari
                    </button>
                    <button id="btn-cookie-accept" class="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 transition-all text-sm whitespace-nowrap">
                        Accetta tutti
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    // Animate banner sliding up
    setTimeout(() => {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.remove('translate-y-full');
    }, 100);

    const acceptBtn = document.getElementById('btn-cookie-accept');
    const rejectBtn = document.getElementById('btn-cookie-reject');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            const banner = document.getElementById('cookie-banner');
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.remove(), 500);
            
            localStorage.setItem('cookieConsent', 'accepted');
            loadGoogleAnalytics();
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            const banner = document.getElementById('cookie-banner');
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.remove(), 500);
            
            localStorage.setItem('cookieConsent', 'rejected');
        });
    }
}

function loadGoogleAnalytics() {
    // Avoid loading twice
    if (document.getElementById('ga-script')) return;

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); }
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
}

// Helper per tracciare eventi manuali da altre parti del codice
export function trackEvent(eventName, eventParams = {}) {
    if (localStorage.getItem('cookieConsent') === 'accepted' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
    }
}
window.trackEvent = trackEvent;

function setupTrackingListeners() {
    document.addEventListener('click', (e) => {
        // Find closest element with data-track attribute
        const trackingElement = e.target.closest('[data-track]');
        if (trackingElement) {
            const eventName = trackingElement.getAttribute('data-track');
            const eventTarget = trackingElement.getAttribute('data-track-target') || trackingElement.href || trackingElement.textContent.trim();
            
            trackEvent(eventName, {
                target: eventTarget,
                page: window.location.pathname
            });
        }
    });

    // Special listener for WhatsApp buttons (in case they don't have data-track but have .whatsapp-link class or wa.me href)
    document.addEventListener('click', (e) => {
        const waLink = e.target.closest('a[href*="wa.me"]');
        if (waLink && !waLink.hasAttribute('data-track')) {
            trackEvent('whatsapp_click', {
                target: waLink.href,
                page: window.location.pathname
            });
        }
    });

    // Submits on typical forms
    document.addEventListener('submit', (e) => {
        const formId = e.target.id;
        if (formId) {
            trackEvent('form_submit', {
                form_id: formId,
                page: window.location.pathname
            });
        }
    });
}

// Init when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieManager);
} else {
    initCookieManager();
}
