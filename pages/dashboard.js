// ============================================
// DASHBOARD — Seasons Framework
// ============================================
import { store } from '../store.js';
import { showToast, icon, escapeHtml } from '../utils/helpers.js';
import { ADMIN_PASSWORD } from '../utils/constants.js';

export function renderDashboard(app, navigate) {
  const user = store.getCurrentUser();
  const isAdmin = store.isAdmin();

  function render() {
    const seasons = store.getSeasons();
    const matches = store.getMatches();
    const players = store.getPlayers();

    app.innerHTML = `
      <div class="dashboard-page animate-fade-in">
        <div class="dashboard-header">
          <div>
            <h1>Seasons Framework</h1>
            <p>Select an existing tournament sequence timeline configuration pool to view sub-modules.</p>
          </div>
          <div style="display:flex;gap:var(--sp-2);align-items:center;flex-shrink:0">
            <button class="btn btn-primary" id="createSeasonBtn">
              ${icon('add_circle', 18)} Create New Match or Season
            </button>
            <div style="position:relative">
              <button class="btn-icon" id="userMenuBtn" title="Profile">${icon('account_circle', 24)}</button>
              <div class="user-dropdown hidden" id="userDropdown" style="position:absolute;right:0;top:44px;background:var(--bg-modal);border:1px solid var(--bg-card-border);border-radius:var(--radius-md);padding:var(--sp-2);min-width:180px;z-index:100;box-shadow:var(--shadow-lg)">
                <div style="padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--bg-card-border);margin-bottom:var(--sp-2)">
                  <div style="font-weight:var(--fw-bold);font-size:var(--fs-sm)">${escapeHtml(user?.fullName || 'User')}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted)">@${escapeHtml(user?.username || '')}</div>
                </div>
                <button class="btn btn-ghost btn-sm" id="profileBtn" style="width:100%;justify-content:flex-start;gap:8px">${icon('person', 16)} Profile</button>
                <button class="btn btn-ghost btn-sm" id="logoutBtn" style="width:100%;justify-content:flex-start;gap:8px;color:var(--accent-red)">${icon('logout', 16)} Logout</button>
              </div>
            </div>
          </div>
        </div>

        <div class="seasons-grid" id="seasonsGrid">
          ${seasons.length === 0
            ? `<div class="empty-state" style="grid-column:1/-1">
                <span class="material-symbols-rounded">sports_cricket</span>
                <p>No tournaments yet. ${isAdmin ? 'Create your first season!' : 'Ask an admin to create a season.'}</p>
              </div>`
            : seasons.map(s => {
              const sMatches = matches.filter(m => m.seasonId === s.id).length;
              const sTeams = new Set(players.filter(p => p.seasonId === s.id).map(p => p.teamName)).size;
              return `
                <div class="season-card animate-slide-up">
                  <div class="season-card-info">
                    <h3>${escapeHtml(s.name)}</h3>
                    <div class="season-card-meta">
                      <span class="dot"></span>
                      <span>Matches Run: ${sMatches}</span>
                      <span>| Teams Tracked: ${sTeams}</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:var(--sp-2);align-items:center">
                    <button class="btn btn-primary btn-sm launch-btn" data-id="${s.id}">
                      Launch Workspace ${icon('chevron_right', 16)}
                    </button>
                    ${isAdmin ? `<button class="btn btn-ghost btn-sm delete-season-btn" data-id="${s.id}" title="Delete">${icon('delete', 16)}</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;

    // Event Listeners
    // User dropdown
    document.getElementById('userMenuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      const dd = document.getElementById('userDropdown');
      if (dd) dd.classList.add('hidden');
    });

    // Profile
    document.getElementById('profileBtn')?.addEventListener('click', () => {
      navigate('profile');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      store.logout();
      showToast('Logged out successfully', 'success');
      navigate('login');
    });

    // Create season
    document.getElementById('createSeasonBtn')?.addEventListener('click', () => {
      showCreateSeasonModal();
    });

    // Launch workspace
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate('workspace', { seasonId: btn.dataset.id }));
    });

    // Delete season
    document.querySelectorAll('.delete-season-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this tournament and all its data?')) {
          store.deleteSeason(btn.dataset.id);
          showToast('Tournament deleted', 'success');
          render();
        }
      });
    });
  }

  function showCreateSeasonModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:420px">
          <div class="modal-title">${icon('add_circle', 24)} Create New Tournament</div>
          <button class="modal-close" id="closeCreateModal">${icon('close')}</button>
          <form id="createSeasonForm">
            <div class="form-group">
              <label class="form-label">Tournament / Season Name</label>
              <input type="text" id="seasonName" class="form-input" placeholder="e.g., Tournament Match Pool Season 1" required />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelCreate">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Season</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.getElementById('seasonName').focus();
    document.getElementById('closeCreateModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelCreate').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('createSeasonForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('seasonName').value.trim();
      if (!name) return;
      store.addSeason({ name });
      modalRoot.innerHTML = '';
      showToast('Tournament created!', 'success');
      render();
    });
  }

  render();
}
