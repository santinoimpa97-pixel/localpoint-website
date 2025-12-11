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

// Smooth Scroll for anchor links (optional, as CSS scroll-behavior: smooth works too, but this is robust)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Adjust for sticky header
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  });
});

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

// Initialize language on page load
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

