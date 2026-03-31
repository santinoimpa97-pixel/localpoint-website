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
    if (document.getElementById('cookie-banner')) return;

    const bannerStyle = `
        #cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            z-index: 999999;
            transform: translateY(100%);
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }
        #cookie-banner.visible {
            transform: translateY(0);
        }
        .cb-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        @media (min-width: 768px) {
            .cb-container {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 40px;
            }
        }
        .cb-content h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .cb-content p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
            color: #4b5563;
        }
        .cb-actions {
            display: flex;
            gap: 12px;
            flex-shrink: 0;
        }
        @media (max-width: 640px) {
            .cb-actions {
                flex-direction: column;
                width: 100%;
            }
        }
        .cb-btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            text-align: center;
            white-space: nowrap;
        }
        #btn-cookie-reject {
            background: transparent;
            color: #4b5563;
            border: 1px solid #d1d5db;
        }
        #btn-cookie-reject:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        #btn-cookie-accept {
            background: #004e92;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 78, 146, 0.2);
        }
        #btn-cookie-accept:hover {
            background: #003870;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0, 78, 146, 0.3);
        }
    `;

    const styleTag = document.createElement('style');
    styleTag.textContent = bannerStyle;
    document.head.appendChild(styleTag);

    const bannerHtml = `
        <div id="cookie-banner">
            <div class="cb-container">
                <div class="cb-content">
                    <h3><span>🍪</span> Informativa sui Cookie</h3>
                    <p>
                        Utilizziamo cookie tecnici per il funzionamento del sito e, con il tuo consenso, cookie statistici (Google Analytics) per migliorare la tua esperienza. 
                        Scegliendo "Accetta tutti", acconsenti all'uso dei cookie.
                    </p>
                </div>
                <div class="cb-actions">
                    <button id="btn-cookie-reject" class="cb-btn">Solo necessari</button>
                    <button id="btn-cookie-accept" class="cb-btn">Accetta tutti</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    // Animate banner sliding up
    setTimeout(() => {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.add('visible');
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
