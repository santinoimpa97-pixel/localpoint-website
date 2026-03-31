# Plan: Google Analytics Integration

Integrate Google Analytics 4 (GA4) across the entire website to track visitors and key actions (WhatsApp clicks, bookings), while maintaining GDPR compliance through a centralized cookie consent logic.

## Prerequisites

- [ ] **Measurement ID**: Obtain a Measurement ID (e.g., `G-XXXXXXXXXX`) from the Google Analytics 4 Property settings.

## Proposed Changes

### [New Component] Cookie & Analytics Manager (`src/cookie-manager.js`) [NEW]

- Create a centralized script to handle:
    - Injecting the Cookie Banner HTML into the page if not present.
    - Managing `localStorage` for user consent.
    - Loading the GA4 script only after consent is given.
    - Providing a helper function for event tracking (e.g., `trackEvent`).

### [Component] Global Styles (`src/style.css`)

- [MODIFY] [style.css](file:///C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/style.css)
    - Ensure `.cookie-banner` and related styles are robust for all pages (some are already there).

### [Component] HTML Pages (`index.html`, `tourist-services.html`, etc.)

- [MODIFY] All HTML files:
    - Remove hardcoded cookie banner HTML (to avoid duplication).
    - Include `<script type="module" src="/src/cookie-manager.js"></script>`.
    - Add `data-track` attributes to key buttons for automatic tracking.

### [Component] Event Tracking

- Implement tracking for:
    - **WhatsApp Clicks**: Track when a user clicks any WhatsApp floating button or booking link.
    - **Form Submissions**: Track successful reservation requests in `tourist-services.html`.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1. **Consent Check**: Open the site in Incognito mode. Verify GA4 does NOT load until "Accetta" is clicked in the banner.
2. **Real-time Report**: Open Google Analytics Real-time report and verify page views appearing after consent.
3. **Event Check**: Click a WhatsApp button and check if the event `whatsapp_click` appears in the GA4 DebugView or Real-time report.
4. **Cross-page Tracking**: Navigate from Home to Tourist Services and verify the session continues.
