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
import { renderOnboarding } from './pages/onboarding.js';

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
  const onboarded = localStorage.getItem('lca_onboarded_v1') === 'true';
  const defaultPage = onboarded ? 'login' : 'onboarding';
  const hash = window.location.hash.slice(1) || defaultPage;
  let user = store.getCurrentUser();

  // Onboarding guard: If they have not completed onboarding, force them to onboarding first!
  if (!onboarded && hash !== 'onboarding') {
    navigate('onboarding');
    return;
  }

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
  if (!user && hash !== 'login' && hash !== 'register' && hash !== 'onboarding') {
    navigate(onboarded ? 'login' : 'onboarding');
    return;
  }

  // Double check onboarding if user is logged in
  if (user && !onboarded && hash !== 'onboarding') {
    navigate('onboarding');
    return;
  }

  switch (hash) {
    case 'onboarding':
      renderOnboarding(app, navigate);
      break;
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

  // Render Bottom Tab Bar for logged-in views
  if (user && hash !== 'onboarding' && hash !== 'login' && hash !== 'register') {
    renderGlobalBottomNav(hash);
  } else {
    removeGlobalBottomNav();
  }
}

// Global Bottom Nav Renderer
function renderGlobalBottomNav(hash) {
  let existingNav = document.getElementById('global-app-nav');
  if (!existingNav) {
    existingNav = document.createElement('div');
    existingNav.id = 'global-app-nav';
    existingNav.className = 'global-bottom-nav';
    document.body.appendChild(existingNav);
  }

  const currentFilter = localStorage.getItem('lca_dashboard_filter') || 'all';

  existingNav.innerHTML = `
    <button class="bottom-nav-item ${hash === 'dashboard' && currentFilter !== 'saved' ? 'active' : ''}" id="btnNavExplore">
      <span class="material-symbols-rounded">explore</span>
      <span>Explore</span>
    </button>
    <button class="bottom-nav-item ${hash === 'dashboard' && currentFilter === 'saved' ? 'active' : ''}" id="btnNavSaved">
      <span class="material-symbols-rounded">bookmarks</span>
      <span>My Joined</span>
    </button>
    <button class="bottom-nav-item-fab" id="btnNavCreate" title="Create New">
      <div class="fab-circle">
        <span class="material-symbols-rounded">add</span>
      </div>
    </button>
    <button class="bottom-nav-item ${hash === 'profile' ? 'active' : ''}" id="btnNavProfile">
      <span class="material-symbols-rounded">person</span>
      <span>Profile</span>
    </button>
  `;

  // Attach event listeners to nav buttons
  document.getElementById('btnNavExplore').addEventListener('click', () => {
    localStorage.setItem('lca_dashboard_filter', 'all');
    navigate('dashboard');
  });

  document.getElementById('btnNavSaved').addEventListener('click', () => {
    localStorage.setItem('lca_dashboard_filter', 'saved');
    navigate('dashboard');
  });

  document.getElementById('btnNavCreate').addEventListener('click', () => {
    localStorage.setItem('lca_open_create', 'true');
    navigate('dashboard');
  });

  document.getElementById('btnNavProfile').addEventListener('click', () => {
    navigate('profile');
  });
}

function removeGlobalBottomNav() {
  const existingNav = document.getElementById('global-app-nav');
  if (existingNav) {
    existingNav.remove();
  }
}

// Listen for hash changes
window.addEventListener('hashchange', route);

// Init
async function init() {
  // Capture invitation parameter details if present
  const urlParams = new URLSearchParams(window.location.search);
  const inviteType = urlParams.get('inviteType');
  const inviteId = urlParams.get('inviteId');
  if (inviteType && inviteId) {
    localStorage.setItem('lca_pending_invite', JSON.stringify({ type: inviteType, id: inviteId }));
    if (inviteType === 'match') {
      localStorage.setItem('lca_focused_match_id', inviteId);
      localStorage.removeItem('lca_focused_season_id');
    } else if (inviteType === 'tournment') {
      localStorage.setItem('lca_focused_season_id', inviteId);
      localStorage.removeItem('lca_focused_match_id');
    }
    // Clear the query parameters from URL to keep it pretty
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  await initFirebase();
  
  // Background non-blocking sync from Firebase to ensure fast load times
  store.syncFromFirebase().then(() => {
    route();
  }).catch((error) => {
    console.error('Background sync failed:', error);
  });
  
  const user = store.getCurrentUser();
  const onboarded = localStorage.getItem('lca_onboarded_v1') === 'true';
  const defaultPage = onboarded ? 'login' : 'onboarding';
  const hash = window.location.hash.slice(1) || defaultPage;
  
  if (!onboarded) {
    navigate('onboarding');
    return;
  }

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
