// ============================================
// ROLE SELECTION PAGE (LANDING)
// ============================================
import { store } from '../store.js';
import { icon } from '../utils/helpers.js';

export function renderRoleSelection(app, navigate) {
  app.innerHTML = `
    <div class="role-selection-page animate-fade-in">
      <div class="role-selection-container">
        <div class="role-selection-header">
          <div class="app-logo">
            <span class="material-symbols-rounded icon-glow">sports_cricket</span>
          </div>
          <h1>Local Cricket App</h1>
        </div>

        <div class="role-cards-grid">
          <!-- Administrator Card -->
          <div class="role-card admin-card animate-slide-up" style="animation-delay: 0.1s">
            <div class="role-card-glow"></div>
            <div class="role-card-icon-wrap">
              <span class="material-symbols-rounded">admin_panel_settings</span>
            </div>
            <h2>Tournament Hub</h2>
            <p>For league managers and organizers. Create seasons, schedule fixtures, add clubs, roster team members, and record live match scorecard stats.</p>
            <button class="btn btn-admin-select" id="selectAdminBtn">
              Access Admin Hub ${icon('arrow_forward', 16)}
            </button>
          </div>

          <!-- Viewer/Player Card -->
          <div class="role-card viewer-card animate-slide-up" style="animation-delay: 0.2s">
            <div class="role-card-glow"></div>
            <div class="role-card-icon-wrap">
              <span class="material-symbols-rounded">groups</span>
            </div>
            <h2>Player & Fan Portal</h2>
            <p>For cricket players, fans, and viewers. Explore match scorecards, track standings on the points table, review schedules, and celebrate stars.</p>
            <button class="btn btn-viewer-select" id="selectViewerBtn">
              Access Fan Portal ${icon('arrow_forward', 16)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Event Listeners
  document.getElementById('selectAdminBtn').addEventListener('click', () => {
    navigate('login', { role: 'admin' });
  });

  document.getElementById('selectViewerBtn').addEventListener('click', () => {
    // Provide frictionless access as guest fan so spectators can view tables, schedules, matches instantly
    const existing = store.getCurrentUser();
    if (!existing) {
      store.setCurrentUser({
        id: 'guest-fan',
        fullName: 'Cricket Fan (Guest)',
        username: 'fan_guest',
        role: 'user',
        age: 20,
        teamName: ''
      });
    }
    navigate('dashboard');
  });
}
