// Navigation toggle for mobile
// Injects responsive styles and hamburger menu
function initMobileNav() {
  const style = document.createElement('style');
  style.textContent = `
    /* Mobile menu toggle button styling */
    .menu-toggle {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      width: 30px;
      height: 21px;
      cursor: pointer;
      background: rgba(13, 13, 14, 0.6);
      backdrop-filter: blur(16px);
      padding: 12px;
      border-radius: 8px;
      gap: 3px;
      position: fixed;
      top: 40px;
      right: 40px;
      z-index: 101;
    }

    .menu-toggle span {
      display: block;
      height: 2px;
      background: #fff;
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .menu-toggle.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .menu-toggle.active span:nth-child(2) {
      opacity: 0;
    }

    .menu-toggle.active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }

    /* Mobile responsive styles */
    @media (max-width: 768px) {
      /* Adjust header for mobile */
      #header {
        padding: 16px !important;
        background: rgba(30, 30, 33, 0.95);
        backdrop-filter: blur(10px);
      }

      #header img {
        height: 32px !important;
        padding: 6px !important;
      }

      /* Show menu toggle on mobile */
      .menu-toggle {
        display: flex !important;
        top: 16px;
        right: 16px;
      }

      /* Hide nav by default on mobile */
      nav {
        display: none !important;
        position: fixed !important;
        top: 70px !important;
        left: 16px !important;
        right: 16px !important;
        width: auto !important;
        max-height: calc(100vh - 100px) !important;
        background: rgba(13, 13, 14, 0.95) !important;
        padding: 24px !important;
        flex-direction: column !important;
        overflow-y: auto !important;
        z-index: 99 !important;
      }

      /* Show nav when open */
      nav.open {
        display: flex !important;
      }

      nav ul {
        width: 100% !important;
        gap: 16px !important;
      }

      nav ul li .dropdown-menu {
        position: static !important;
        width: 100% !important;
        margin-top: 8px !important;
        margin-left: 16px !important;
      }

      nav ul li:hover .dropdown-menu,
      nav ul li.active .dropdown-menu {
        display: block !important;
      }

      nav a {
        font-size: 18px !important;
        padding: 8px 0 !important;
      }

      /* Ensure content doesn't hide under nav */
      #hero, .hero {
        margin-top: 60px !important;
        padding-top: 40px !important;
      }

      /* Fix h1 visibility */
      h1 {
        margin-top: 20px !important;
      }

      /* Fix stats positioning in about section */
      #about .horizontal {
        flex-direction: column !important;
      }

      #about .stats {
        width: 100% !important;
        max-width: none !important;
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
        margin-top: 24px !important;
      }

      #about .stats div {
        width: 100% !important;
        min-width: auto !important;
        padding: 10px 16px !important;
        box-sizing: border-box !important;
      }

      #about .stats div p {
        font-size: 0.875rem !important;
      }

      #profile_image {
        width: 100% !important;
        max-width: none !important;
      }

      /* Fix text within cards */
      .service-item, .dropped-service, .service-card, .project-card, .stat-card {
        padding: 1rem !important;
        box-sizing: border-box !important;
      }

      .service-item *, .dropped-service *, .service-card *, .project-card *, .stat-card * {
        max-width: 100% !important;
        word-wrap: break-word !important;
      }
    }

    /* Desktop stats layout fix */
    @media (min-width: 769px) {
      #about .horizontal {
        display: flex !important;
        gap: 40px !important;
        align-items: flex-start !important;
      }

      #about .horizontal > div:first-child {
        flex: 1 !important;
      }

      #about .stats {
        width: auto !important;
        max-width: 300px !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 20px !important;
        margin-top: 8px !important;
        flex-shrink: 0 !important;
      }

      #about .stats div {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        padding: 12px 20px !important;
        background: #333333 !important;
        border-radius: 8px !important;
        font-size: clamp(1.5rem, 4vw, 2rem) !important;
        white-space: nowrap !important;
        gap: 8px !important;
        flex: 1 !important;
        min-width: 120px !important;
        margin-top: 0 !important;
        box-sizing: border-box !important;
      }

      #about .stats div p {
        margin: 0 !important;
        font-size: clamp(0.875rem, 2vw, 1rem) !important;
      }

      /* Ensure h1 is not hidden */
      #hero, .hero {
        margin-top: 40px !important;
        padding-top: 80px !important;
      }
    }

    /* Ensure text stays within all cards */
    .service-card, .project-card, .stat-card, .service-item, .dropped-service {
      overflow: hidden !important;
      word-wrap: break-word !important;
      box-sizing: border-box !important;
    }

    .service-card *, .project-card *, .stat-card *, .service-item *, .dropped-service * {
      max-width: 100% !important;
      overflow-wrap: break-word !important;
    }
  `;
  document.head.appendChild(style);

  const header = document.getElementById('header');
  const nav = header ? header.querySelector('nav') : null;
  
  if (!header || !nav) return;

  // Check if menu toggle already exists
  let toggle = document.getElementById('menu-toggle');
  if (!toggle) {
    toggle = document.createElement('div');
    toggle.id = 'menu-toggle';
    toggle.className = 'menu-toggle';
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(toggle);
  }

  // Toggle menu on click
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // Close menu when clicking on a link
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && 
        !nav.contains(e.target) && 
        !toggle.contains(e.target)) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    }
  });

  // Handle dropdown menus on mobile
  if (window.innerWidth <= 768) {
    const dropdownParents = nav.querySelectorAll('li.dropdown');
    dropdownParents.forEach(parent => {
      const link = parent.querySelector('a');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          parent.classList.toggle('active');
        });
      }
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}

// Reinitialize on window resize to handle orientation changes
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const nav = document.querySelector('nav');
    const toggle = document.getElementById('menu-toggle');
    if (window.innerWidth > 768) {
      if (nav) nav.classList.remove('open');
      if (toggle) toggle.classList.remove('active');
    }
  }, 250);
});
