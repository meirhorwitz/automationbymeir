// Navigation toggle for mobile
// Injects responsive styles and hamburger menu

function initMobileNav() {
  const style = document.createElement('style');
  style.textContent = `
  nav {
    display:flex;
    flex-direction:row;
    align-items:flex-start;
    padding:24px;
    gap:40px;
    background:rgba(13,13,14,0.6);
    backdrop-filter:blur(16px);
    border-radius:8px;
    width:auto;
    min-width:min-content;
    flex-wrap:wrap;
  }
  nav ul {
    list-style:none;
    padding:0;
    margin:0;
    display:flex;
    flex-direction:column;
    gap:8px;
  }
  nav ul li { position:relative; }
  nav ul li .dropdown-menu {
    display:none;
    position:static !important;
    background:rgba(13,13,14,0.9);
    border-radius:8px;
    padding:8px 0;
    list-style:none;
    margin:0;
    min-width:220px;
  }
  nav ul li:hover .dropdown-menu { display:block; }
  nav ul li .dropdown-menu a {
    padding:8px 16px;
    display:block;
    font-size:16px;
    white-space:nowrap;
  }
  nav ul li .dropdown-menu a:hover { background:none !important; }

  a {
    color:white;
    text-decoration:none;
  }
  nav a {
    font-size:20px;
    position:relative;
    display:inline-block;
    font-weight:300;
    white-space:nowrap;
  }
  nav a:after {
    content:'';
    display:block;
    width:100%;
    height:1px;
    background:#fff;
    transform:scaleX(0);
    transition:transform 0.2s ease-in-out;
    transform-origin:100% 0;
  }
  nav a:hover:after {
    transform:scaleX(1);
    transform-origin:0 0;
  }

  .menu-toggle {
    display:none;
    flex-direction:column;
    justify-content:space-around;
    width:30px;
    height:22px;
    cursor:pointer;
  }
  .menu-toggle span {
    display:block;
    width:100%;
    height:3px;
    background:#fff;
    border-radius:3px;
    transition:all 0.3s ease;
  }
  .menu-toggle.active span:nth-child(1) {
    transform:rotate(45deg) translate(5px,5px);
  }
  .menu-toggle.active span:nth-child(2) {
    opacity:0;
  }
  .menu-toggle.active span:nth-child(3) {
    transform:rotate(-45deg) translate(5px,-5px);
  }
  #header img {
    width:196px;
    height:64px;
  }
  body {
    overflow-x:hidden;
  }
  @media (max-width:768px) {
    nav {
      display:none;
      flex-direction:column;
      position:fixed;
      top:16px;
      left:16px;
      right:16px;
      width:auto;
      height:calc(100vh - 32px);
      background:rgba(13,13,14,0.95);
      padding:24px;
      box-sizing:border-box;
      gap:16px;
      overflow-y:auto;
    }
    nav ul {
      width:100%;
      flex-grow:0;
    }
    nav ul li .dropdown-menu {
      width:100%;
      margin-top:8px;
      margin-left:16px;
    }
    nav.open {
      display:flex;
    }
    #menu-toggle {
      display:flex;
      position:fixed;
      top:20px;
      right:20px;
      z-index:101;
    }
    nav a {
      font-size:18px;
      padding:8px 0;
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
    toggle.classList.toggle('active');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', initMobileNav);
