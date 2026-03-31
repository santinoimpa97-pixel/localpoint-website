# Plan: Add Shipping Partners Section

Replace the current SVG-based shipping partner logos with high-quality images in the partners marquee section.

## Proposed Changes

### [Component] Home Page (`index.html`)

- [MODIFY] [index.html](file:///C:/Users/projo/.gemini/antigravity/scratch/localpoint/index.html)
    - Locate the `#partners-strip` section (around line 416).
    - Replace the `<svg>` elements within `.ps-card` for all partners with `<img>` tags.
    - **Poste Italiane**: Use `https://i.postimg.cc/qq6ntDZr/image.png`
    - **GLS**: Use `https://i.postimg.cc/NjkNfLHN/image.png`
    - **UPS**: Use `https://i.postimg.cc/ydvnhGPz/image.png`
    - **BRT**: Use `https://i.postimg.cc/fL9mygr8/image.png`
    - Ensure updates are made to both the original set and the cloned set (used for the seamless marquee loop).

### [Component] Styles (`src/style.css`)

- [MODIFY] [style.css](file:///C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/style.css)
    - Add styles for `.ps-img` to ensure images maintain aspect ratio and fit within the cards.
    - Set `height: 56px` and `object-fit: contain` for `.ps-img` to match the previous SVG dimensions.
    - Adjust `.ps-card:hover .ps-img` to include the same scale effect as the SVGs.

## Verification Plan

### Automated Tests
- None applicable for this UI change.

### Manual Verification
1. **Visual Check**: Open the website and scroll to the "I nostri corrieri partner" section.
2. **Animation Loop**: Verify that the marquee scrolls smoothly without jumps (check if the cloned images match the originals).
3. **Hover Effects**: Hover over each partner card to ensure the scale animation and shadow effects work correctly.
4. **Mobile Responsiveness**: Verify the section looks good on smaller screens using browser developer tools.
