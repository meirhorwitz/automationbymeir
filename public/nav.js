// Navigation toggle for mobile
// Injects responsive styles and hamburger menu

function initMobileNav() {
  const style = document.createElement('style');
  style.textContent = `
  .menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 21px;
    cursor: pointer;
  }
  .menu-toggle span {
    display: block;
    height: 3px;
    background: #fff;
    border-radius: 2px;
  }
  @media (max-width: 768px) {
    nav {
      display: none;
      flex-direction: column;
      position: fixed;
      top: 0;
      right: 0;
      width: 70%;
      height: 100vh;
      background: rgba(13,13,14,0.95);
      padding: 24px;
      box-sizing: border-box;
      gap: 16px;
    }
    nav.open {
      display: flex;
    }
    #menu-toggle {
      display: flex;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 101;
    }
  }
  `;
  document.head.appendChild(style);

  const header = document.getElementById('header');
  const nav = header ? header.querySelector('nav') : null;
  if (!header || !nav) return;

  const toggle = document.createElement('div');
  toggle.id = 'menu-toggle';
  toggle.className = 'menu-toggle';
  toggle.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(toggle);

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

document.addEventListener('DOMContentLoaded', initMobileNav);
