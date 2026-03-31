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
            background: linear-gradient(135deg, rgba(0, 78, 146, 0.98) 0%, rgba(0, 160, 160, 0.98) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            border-radius: 28px;
            z-index: 9999999;
            transform: translateY(calc(100% + 40px));
            transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
            font-family: 'Outfit', 'Inter', system-ui, sans-serif;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }
        #cookie-banner.visible {
            transform: translateY(0);
        }
        .cb-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 30px 40px;
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        @media (min-width: 900px) {
            .cb-container {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 50px;
            }
        }
        .cb-content {
            flex: 1;
        }
        .cb-content h3 {
            margin: 0 0 8px 0;
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
            letter-spacing: -0.01em;
        }
        .cb-content p {
            margin: 0;
            font-size: 15.5px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 400;
        }
        .cb-actions {
            display: flex;
            gap: 15px;
            flex-shrink: 0;
        }
        @media (max-width: 640px) {
            .cb-actions {
                flex-direction: column;
                width: 100%;
            }
        }
        .cb-btn {
            padding: 16px 32px;
            border-radius: 18px;
            font-size: 15px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            text-align: center;
            white-space: nowrap;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }
        #btn-cookie-reject {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        #btn-cookie-reject:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        #btn-cookie-accept {
            background: #ffffff;
            color: #004e92;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        #btn-cookie-accept:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
            background: #f8fafc;
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
