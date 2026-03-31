/**
 * LocalPoint Animations
 * IntersectionObserver for reveal effects
 */

export function initAnimations() {
    const reveals = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing after reveal
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));
}

// Auto-init
document.addEventListener('DOMContentLoaded', initAnimations);
if (document.readyState !== 'loading') {
    initAnimations();
}
