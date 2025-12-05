/**
 * Device Detection Script
 * Automatically redirects mobile and tablet users to the mobile-optimized version
 */

(function () {
  // Check if user explicitly wants desktop version
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('desktop') === 'true') {
    return; // Don't redirect if desktop override is set
  }

  // Check if we're already on a mobile page
  if (window.location.pathname.includes('-mobile.html')) {
    return; // Already on mobile version
  }

  // Detect mobile/tablet devices
  function isMobileOrTablet() {
    // Check user agent
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;

    // Check screen size (tablets and phones)
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    const isMobileScreen = screenWidth <= 1024;

    // Check touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return mobileRegex.test(userAgent) || (isMobileScreen && isTouchDevice);
  }

  // Redirect to mobile version if on mobile/tablet
  if (isMobileOrTablet()) {
    const currentPath = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;

    let newPath = '';

    // Handle root path
    if (currentPath === '/' || currentPath === '/index.html') {
      newPath = '/index-mobile.html';
    } else if (currentPath.endsWith('.html')) {
      // Generic mapping: page.html -> page-mobile.html
      newPath = currentPath.replace('.html', '-mobile.html');
    }

    if (newPath) {
      // Verify if the mobile page exists (optional, but good for safety if we can't verify existence client-side easily without a request)
      // For now, we assume the mobile page exists if we are redirecting.
      window.location.href = newPath + search + hash;
    }
  }
})();
