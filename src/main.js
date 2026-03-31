import './style.css'
import { translations, languages, t, getCurrentLanguage, setLanguage } from './translations.js'

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const nav = document.getElementById('nav');

mobileMenuBtn.addEventListener('click', () => {
  nav.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('active');
  });
});

// Smooth Scroll logic
function scrollToTarget(targetId, behavior = "smooth") {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    const headerOffset = 100; // Updated to match real header height
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: behavior
    });
  }
}

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    scrollToTarget(targetId);
  });
});

// Handle Hash on Load (Fix for external links like /#contact)
function handleHashOnLoad() {
  if (window.location.hash) {
    // Small delay to ensure dynamic content (i18n, images) is settled
    setTimeout(() => {
      scrollToTarget(window.location.hash, "auto");
    }, 100);
  }
}

// Language Selector
const langSelector = document.getElementById('language-selector');
const langToggle = document.getElementById('lang-toggle');
const langDropdown = document.getElementById('lang-dropdown');
const langOptions = document.querySelectorAll('.lang-option');

// Toggle dropdown
langToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  langSelector.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!langSelector.contains(e.target)) {
    langSelector.classList.remove('active');
  }
});

// Handle language selection
langOptions.forEach(option => {
  option.addEventListener('click', () => {
    const lang = option.getAttribute('data-lang');
    setLanguage(lang);
    langSelector.classList.remove('active');

    // Update active state
    langOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = getCurrentLanguage();
  setLanguage(currentLang);

  // Set active class on current language option
  langOptions.forEach(opt => {
    if (opt.getAttribute('data-lang') === currentLang) {
      opt.classList.add('active');
    }
  });
});

// Final check for hash on full load
window.addEventListener('load', handleHashOnLoad);

