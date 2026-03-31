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
            bottom: 24px;
            left: 24px;
            right: 24px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
            border-radius: 24px;
            z-index: 9999999;
            transform: translateY(calc(100% + 40px));
            transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
            font-family: 'Outfit', 'Inter', system-ui, sans-serif;
            overflow: hidden;
        }
        #cookie-banner.visible {
            transform: translateY(0);
        }
        .cb-container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 24px 32px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        @media (min-width: 900px) {
            .cb-container {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 48px;
            }
        }
        .cb-content {
            flex: 1;
        }
        .cb-content h3 {
            margin: 0 0 6px 0;
            font-size: 19px;
            font-weight: 800;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: -0.01em;
        }
        .cb-content p {
            margin: 0;
            font-size: 14.5px;
            line-height: 1.6;
            color: #475569;
            font-weight: 400;
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
            padding: 14px 28px;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            text-align: center;
            white-space: nowrap;
            letter-spacing: 0.01em;
        }
        #btn-cookie-reject {
            background: #f1f5f9;
            color: #64748b;
            border: 1px solid transparent;
        }
        #btn-cookie-reject:hover {
            background: #e2e8f0;
            color: #475569;
        }
        #btn-cookie-accept {
            background: linear-gradient(135deg, #004e92 0%, #003870 100%);
            color: #ffffff;
            box-shadow: 0 8px 20px rgba(0, 78, 146, 0.25);
        }
        #btn-cookie-accept:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(0, 78, 146, 0.4);
            filter: brightness(1.1);
        }
        #btn-cookie-accept:active {
            transform: translateY(0);
        }
    `;

    const styleTag = document.createElement('style');
    styleTag.textContent = bannerStyle;
    document.head.appendChild(styleTag);

    const bannerHtml = `
        <div id="cookie-banner">
            <div class="cb-container">
                <div class="cb-content">
                    <h3><span>🍪</span> Personalizza la tua esperienza</h3>
                    <p>
                        Usiamo i cookie per ottimizzare il sito e analizzare il traffico in modo anonimo. 
                        La tua privacy è importante per noi: scegli come procedere per navigare al meglio.
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
