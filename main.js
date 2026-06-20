// ============================================
// MAIN APP ENTRY
// ============================================
import { store } from './store.js';
import { initFirebase } from './firebase.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderWorkspace } from './pages/workspace.js';
import { renderProfile } from './pages/profile.js';

const app = document.getElementById('app');

// Simple SPA router
let currentParams = {};

function navigate(page, params = {}) {
  currentParams = params;
  const cleanHash = window.location.hash.startsWith('#') 
    ? window.location.hash.slice(1) 
    : window.location.hash;
  if (cleanHash === page) {
    route();
  } else {
    window.location.hash = page;
  }
}

function route() {
  const hash = window.location.hash.slice(1) || 'login';
  let user = store.getCurrentUser();

  // Clean guest session or reset old state when transitioning roles or going to log in
  const isTransitioningAway = hash === 'login' || hash === 'register';
  if (user && (
    ((user.id === 'guest-fan' || user.username === 'fan_guest') && isTransitioningAway) || 
    hash === 'login'
  )) {
    store.logout();
    user = null;
  }

  // Clear modal on navigation
  document.getElementById('modal-root').innerHTML = '';

  // Auth guard
  if (!user && hash !== 'login' && hash !== 'register') {
    navigate('login');
    return;
  }

  switch (hash) {
    case 'login':
      if (user) { navigate('dashboard'); return; }
      renderLogin(app, navigate, currentParams);
      break;
    case 'register':
      renderRegister(app, navigate, currentParams);
      break;
    case 'dashboard':
      renderDashboard(app, navigate);
      break;
    case 'profile':
      renderProfile(app, navigate);
      break;
    case 'workspace':
      renderWorkspace(app, navigate, currentParams);
      break;
    default:
      navigate('login');
  }
}

// Listen for hash changes
window.addEventListener('hashchange', route);

// Init
async function init() {
  await initFirebase();
  
  // Background non-blocking sync from Firebase to ensure fast load times
  store.syncFromFirebase().then(() => {
    route();
  }).catch((error) => {
    console.error('Background sync failed:', error);
  });
  
  const user = store.getCurrentUser();
  const hash = window.location.hash.slice(1) || 'login';
  
  if (user) {
    if (hash === 'login' || hash === 'register') {
      navigate('dashboard');
    } else {
      route();
    }
  } else {
    if (hash === 'login' || hash === 'register') {
      route();
    } else {
      navigate('login');
    }
  }
}

init();
