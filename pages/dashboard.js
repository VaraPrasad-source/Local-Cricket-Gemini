// ============================================
// DASHBOARD — Seasons Framework
// ============================================
import { store } from '../store.js';
import { showToast, icon, escapeHtml, setupNotifications, showConfirm } from '../utils/helpers.js';
import { ADMIN_PASSWORD } from '../utils/constants.js';

export function renderDashboard(app, navigate) {
  const user = store.getCurrentUser();
  const isAdmin = store.isAdmin();

  let searchQuery = '';
  let filterOption = localStorage.getItem('lca_dashboard_filter') || 'all';

  function render() {
    const seasons = store.getSeasons();
    const matches = store.getMatches();
    const players = store.getPlayers();    // Check for pending invitation banner
    const pendingInviteStr = localStorage.getItem('lca_pending_invite');
    let pendingInviteHtml = '';
    if (pendingInviteStr) {
      try {
        const pending = JSON.parse(pendingInviteStr);
        let inviteName = '';
        if (pending.type === 'match') {
          const m = store.getMatch(pending.id);
          if (m) inviteName = `${m.team1} vs ${m.team2}`;
        } else {
          const s = store.getSeason(pending.id);
          if (s) inviteName = s.name;
        }

        if (inviteName) {
          pendingInviteHtml = `
            <div id="pendingInviteBanner" class="pending-invite-banner animate-slide-up" style="background:linear-gradient(135deg, rgba(30, 201, 166, 0.15) 0%, rgba(12, 166, 120, 0.05) 100%); border:1px solid #1ec9a6; border-radius:var(--radius-lg); padding:var(--sp-4); margin-bottom:var(--sp-5); display:flex; align-items:center; justify-content:space-between; gap:var(--sp-4); flex-wrap:wrap; box-shadow:0 8px 24px rgba(30, 201, 166, 0.15);">
              <div style="display:flex; align-items:center; gap:var(--sp-3);">
                <div style="background:rgba(30, 201, 166, 0.15); width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span class="material-symbols-rounded" style="color:#1ec9a6; font-size:24px;">sports_cricket</span>
                </div>
                <div style="flex:1;">
                  <h3 style="font-size:var(--fs-md); font-weight:var(--fw-extrabold); color:var(--text-primary); margin:0;">Join Invitation Received</h3>
                  <p style="font-size:var(--fs-xs); color:var(--text-muted); margin:2px 0 0 0;">
                    You are invited to join: <strong>${escapeHtml(inviteName)}</strong>. Accept to save this match or tournament to your account!
                  </p>
                </div>
              </div>
              <div style="display:flex; gap:var(--sp-2); align-items:center;">
                <button class="btn btn-sm" id="acceptInviteBtn" style="background:#1ec9a6 !important; color:#07030e !important; font-weight:var(--fw-extrabold); display:flex; align-items:center; gap:6px;">
                  ${icon('check_circle', 14)} Accept & Join Now
                </button>
                <button class="btn btn-ghost btn-sm" id="rejectInviteBtn" style="color:var(--text-muted);">Decline</button>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error('Failed to parse pending invite', err);
      }
    }

    // Process shared deep-link filter
    const focusedMatchId = localStorage.getItem('lca_focused_match_id');
    const focusedSeasonId = localStorage.getItem('lca_focused_season_id');
    let focusedFilterHtml = '';

    if (focusedMatchId || focusedSeasonId) {
      let filteredName = '';
      if (focusedMatchId) {
        const m = store.getMatch(focusedMatchId);
        if (m) filteredName = `Match: ${m.team1} vs ${m.team2}`;
      } else {
        const s = store.getSeason(focusedSeasonId);
        if (s) filteredName = `Tournament: ${s.name}`;
      }

      if (filteredName) {
        focusedFilterHtml = `
          <div id="focusedFilterBanner" class="animate-slide-up" style="background:rgba(234, 179, 8, 0.1); border:1px dashed #eab308; border-radius:var(--radius-lg); padding:var(--sp-3) var(--sp-4); margin-bottom:var(--sp-5); display:flex; align-items:center; justify-content:space-between; gap:var(--sp-4); flex-wrap:wrap; box-shadow:0 4px 15px rgba(234, 179, 8, 0.08);">
            <div style="display:flex; align-items:center; gap:var(--sp-2);">
              <span class="material-symbols-rounded" style="color:#eab308; font-size:20px;">layers</span>
              <span style="font-size:var(--fs-sm); color:var(--text-primary);">
                Showing shared item only: <strong>${escapeHtml(filteredName)}</strong>
              </span>
            </div>
            <button class="btn btn-outline btn-sm" id="clearFocusedFilterBtn" style="border-color:#eab308; color:#eab308; padding:4px 10px; font-size:11px;">
              Show All Matches & Tournaments
            </button>
          </div>
        `;
      }
    }    app.innerHTML = `
      <div class="dashboard-page animate-fade-in">
        ${pendingInviteHtml}
        ${focusedFilterHtml}
        
        <!-- Modern Mobile-First App Header -->
        <div class="dashboard-header" style="margin-bottom: var(--sp-6); display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div>
            <h1 style="display: flex; align-items: center; gap: var(--sp-2); font-family: var(--font-heading); font-size: var(--fs-xl); font-weight: var(--fw-extrabold); margin: 0;">
              <span class="material-symbols-rounded" style="color: var(--accent-green); font-size: 28px;">sports_cricket</span>
              <span>LCA Arena</span>
            </h1>
            <p style="font-size: var(--fs-xs); color: var(--text-muted); margin: 2px 0 0 0;">Tournament Hub</p>
          </div>
          <div style="display: flex; gap: var(--sp-2); align-items: center; flex-shrink: 0;">
            <!-- Notifications Dropdown -->
            <div style="position: relative;">
              <button class="btn-icon" id="notificationBtn" title="Notifications" style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
                ${icon('notifications', 22)}
              </button>
              <div class="notification-dropdown hidden" id="notificationDropdown" style="position: absolute; right: 0; top: 44px; background: var(--bg-modal); border: 1px solid var(--bg-card-border); border-radius: var(--radius-md); padding: var(--sp-2); width: 300px; max-height: 400px; overflow-y: auto; z-index: 100; box-shadow: var(--shadow-lg);">
                <div style="padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--bg-card-border); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: var(--fw-bold); font-size: var(--fs-sm);">Notifications</span>
                  <button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size: 10px; padding: 2px 6px; display: none;">Mark all as read</button>
                </div>
                <div id="notificationListContainer" style="margin-top: var(--sp-2); display: flex; flex-direction: column; gap: 4px;">
                  <!-- items will be injected here -->
                </div>
              </div>
            </div>

            <!-- Simple Quick Logout Button -->
            <button class="btn-icon" id="quickLogoutBtn" title="Logout" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: var(--accent-red)">
              ${icon('logout', 18)}
            </button>
          </div>
        </div>

        <!-- Search and Custom Horizontal Filter Pills -->
        <div class="search-filter-row" style="display: flex; flex-direction: column; gap: var(--sp-4); margin-bottom: var(--sp-6);">
          <div style="position: relative; width: 100%;">
            <span class="material-symbols-rounded" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 22px;">search</span>
            <input type="text" id="seasonSearchInput" class="form-input" placeholder="Search tournaments, teams, matches..." style="padding-left: 48px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); height: 48px;" value="${escapeHtml(searchQuery)}" />
          </div>
          
          <!-- Tactile Horizontal Scrolling Pill Filters -->
          <div class="pill-filters-scroll" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch; width: 100%;">
            <button class="filter-pill ${filterOption === 'all' ? 'active' : ''}" data-value="all">
              ${icon('sports_cricket', 16)} All
            </button>
            <button class="filter-pill ${filterOption === 'tournment' ? 'active' : ''}" data-value="tournment">
              ${icon('table_chart', 16)} Tournaments
            </button>
            <button class="filter-pill ${filterOption === 'match' ? 'active' : ''}" data-value="match">
              ${icon('sports_score', 16)} Matches
            </button>
            <button class="filter-pill ${filterOption === 'saved' ? 'active' : ''}" data-value="saved">
              ${icon('bookmark', 16)} Saved & Joined
            </button>
          </div>
        </div>

        <div class="seasons-grid" id="seasonsGrid">
          <!-- Dynamic Seasons / Matches list will be loaded here -->
        </div>
      </div>
    `;

    // Inner render function to update the list reactively
    function updateSeasonsGrid() {
      const cleanQuery = searchQuery.toLowerCase().trim();
      const items = [];
      const currentUser = store.getCurrentUser();
      const joinedSeasons = currentUser?.joinedSeasons || [];
      const joinedMatches = currentUser?.joinedMatches || [];

      // 1. Gather Tournaments
      if (filterOption === 'all' || filterOption === 'tournment' || filterOption === 'saved') {
        seasons.forEach(s => {
          if (focusedSeasonId && s.id !== focusedSeasonId) return;
          if (focusedMatchId) return; // if focused on a match, don't show tournaments here
          if (filterOption === 'saved' && !joinedSeasons.includes(s.id)) return;
          if (!cleanQuery || s.name.toLowerCase().includes(cleanQuery)) {
            items.push({
              type: 'tournment',
              id: s.id,
              name: s.name,
              data: s
            });
          }
        });
      }

      // 2. Gather Matches
      if (filterOption === 'all' || filterOption === 'match' || filterOption === 'saved') {
        matches.forEach(m => {
          if (focusedMatchId && m.id !== focusedMatchId) return;
          if (focusedSeasonId && m.seasonId !== focusedSeasonId) return;
          if (filterOption === 'saved' && !joinedMatches.includes(m.id)) return;
          const matchTitle = `${m.team1} vs ${m.team2}`;
          const seasonName = store.getSeason(m.seasonId)?.name || '';
          const matchWinnerStr = m.matchWinner || '';
          const matchDateStr = m.date || '';

          const matchMatches = !cleanQuery || 
                                m.team1.toLowerCase().includes(cleanQuery) || 
                                m.team2.toLowerCase().includes(cleanQuery) || 
                                matchTitle.toLowerCase().includes(cleanQuery) ||
                                seasonName.toLowerCase().includes(cleanQuery) ||
                                matchWinnerStr.toLowerCase().includes(cleanQuery) ||
                                matchDateStr.toLowerCase().includes(cleanQuery);

          if (matchMatches) {
            items.push({
              type: 'match',
              id: m.id,
              name: matchTitle,
              data: m
            });
          }
        });
      }

      const grid = document.getElementById('seasonsGrid');
      if (!grid) return;

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <span class="material-symbols-rounded">search_off</span>
            <p>No tournament sequences or matches match your request.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(item => {
        const currentUserObj = store.getCurrentUser();
        if (item.type === 'tournment') {
          const s = item.data;
          const sMatches = matches.filter(m => m.seasonId === s.id).length;
          const sTeams = new Set(players.filter(p => p.seasonId === s.id).map(p => p.teamName)).size;
          const isJoinedSeason = (currentUserObj?.joinedSeasons || []).includes(s.id);

          const creatorDisplay = s.creatorName ? s.creatorName : (s.creator ? s.creator : 'Tournament Admin');

          const joinSeasonBtn = isJoinedSeason 
            ? `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#1ec9a6; font-weight:700; border:1px solid rgba(30, 201, 166, 0.25); background:rgba(30, 201, 166, 0.05); padding:6px 14px; border-radius:var(--radius-pill);">${icon('check_circle', 14)} Saved</span>`
            : `<button class="btn btn-outline btn-sm join-season-action-btn" data-id="${s.id}" style="display:inline-flex; align-items:center; gap:4px; border-color:#1ec9a6; color:#1ec9a6; background:rgba(30, 201, 166, 0.05); font-weight:600;">
                 ${icon('bookmark', 12)} Join & Save
               </button>`;

          return `
            <div class="season-card animate-slide-up" style="position:relative; display:flex; flex-direction:column; justify-content:space-between; height:100%">
              <div>
                <span class="badge" style="background:rgba(var(--accent-primary-rgb, 12, 166, 120), 0.15); color:var(--accent-primary, #0ca678); font-size:10px; padding:2px 8px; border-radius:12px; font-weight:bold; text-transform:uppercase; display:inline-block; margin-bottom:var(--sp-2)">Tournment</span>
                <div class="season-card-info">
                  <h3 style="margin-top:2px">${escapeHtml(s.name)}</h3>
                  <div class="season-card-meta" style="flex-wrap: wrap;">
                    <span class="dot"></span>
                    <span>Matches Run: ${sMatches}</span>
                    <span>| Teams Tracked: ${sTeams}</span>
                    <span>| Creator: <span style="color:#1ec9a6; font-weight:700">${escapeHtml(creatorDisplay)}</span></span>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:var(--sp-2);align-items:center;margin-top:var(--sp-4);flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm launch-btn" data-id="${s.id}">
                  Launch Workspace ${icon('chevron_right', 16)}
                </button>
                <button class="btn btn-outline btn-sm invite-friends-btn" data-type="tournment" data-id="${s.id}" data-name="${escapeHtml(s.name)}" style="display:inline-flex; align-items:center; gap:4px;">
                  ${icon('person_add', 14)} Invite Friends
                </button>
                ${joinSeasonBtn}
                ${isAdmin ? `<button class="btn btn-ghost btn-sm delete-season-btn" data-id="${s.id}" title="Delete">${icon('delete', 16)}</button>` : ''}
              </div>
            </div>
          `;
        } else {
          const m = item.data;
          const sName = store.getSeason(m.seasonId)?.name || 'Independent Tournment';
          const dateStr = m.date || '';
          const isJoinedMatch = (currentUserObj?.joinedMatches || []).includes(m.id);

          const creatorDisplay = m.creatorName ? m.creatorName : (m.creator ? m.creator : 'Tournament Admin');

          const joinMatchBtn = isJoinedMatch 
            ? `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#1ec9a6; font-weight:700; border:1px solid rgba(30, 201, 166, 0.25); background:rgba(30, 201, 166, 0.05); padding:6px 14px; border-radius:var(--radius-pill);">${icon('check_circle', 14)} Saved</span>`
            : `<button class="btn btn-outline btn-sm join-match-action-btn" data-id="${m.id}" style="display:inline-flex; align-items:center; gap:4px; border-color:#1ec9a6; color:#1ec9a6; background:rgba(30, 201, 166, 0.05); font-weight:600;">
                 ${icon('bookmark', 12)} Join & Save
               </button>`;

          return `
            <div class="season-card animate-slide-up" style="position:relative; border-left:4px solid #eab308; display:flex; flex-direction:column; justify-content:space-between; height:100%">
              <div>
                <span class="badge" style="background:rgba(234, 179, 8, 0.15); color:#eab308; font-size:10px; padding:2px 8px; border-radius:12px; font-weight:bold; text-transform:uppercase; display:inline-block; margin-bottom:var(--sp-2)">Match</span>
                <div class="season-card-info">
                  <h3 style="margin-top:2px">${escapeHtml(m.team1)} <span style="font-weight:normal; font-size:14px; opacity:0.75">vs</span> ${escapeHtml(m.team2)}</h3>
                  <div style="font-size:var(--fs-xs); color:var(--text-muted); display:flex; flex-direction:column; gap:4px; margin-top:6px;">
                    <div><strong>Tournment:</strong> ${escapeHtml(sName)}</div>
                    <div><strong>Created by:</strong> <span style="color:#1ec9a6; font-weight:700">${escapeHtml(creatorDisplay)}</span></div>
                    ${m.matchWinner ? `<div><strong>Winner:</strong> <span style="color:#22c55e; font-weight:var(--fw-bold)">${escapeHtml(m.matchWinner)}</span></div>` : '<div><span class="badge" style="background:rgba(34, 197, 94, 0.1); color:#22c55e; font-size:9px; padding:2px 6px; border-radius:4px;">Action Active</span></div>'}
                    ${dateStr ? `<div><strong>Scheduled:</strong> ${escapeHtml(dateStr)}</div>` : ''}
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:var(--sp-2);align-items:center;margin-top:var(--sp-4);flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm launch-match-btn" data-seasonid="${m.seasonId}">
                  Launch Workspace ${icon('chevron_right', 16)}
                </button>
                <button class="btn btn-outline btn-sm invite-friends-btn" data-type="match" data-id="${m.id}" data-name="${escapeHtml(m.team1)} vs ${escapeHtml(m.team2)}" style="display:inline-flex; align-items:center; gap:4px;">
                  ${icon('person_add', 14)} Invite Friends
                </button>
                ${joinMatchBtn}
                ${isAdmin ? `<button class="btn btn-ghost btn-sm delete-match-btn" data-id="${m.id}" title="Delete">${icon('delete', 16)}</button>` : ''}
              </div>
            </div>
          `;
        }
      }).join('');

      // Bind dynamically created card buttons
      grid.querySelectorAll('.launch-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate('workspace', { seasonId: btn.dataset.id }));
      });

      grid.querySelectorAll('.launch-match-btn').forEach(btn => {
        btn.addEventListener('click', () => navigate('workspace', { seasonId: btn.dataset.seasonid }));
      });

      grid.querySelectorAll('.invite-friends-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          showInviteModal(btn.dataset.type, btn.dataset.id, btn.dataset.name);
        });
      });

      // Join season click
      grid.querySelectorAll('.join-season-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const curr = store.getCurrentUser();
          if (curr) {
            const joinedSeasons = curr.joinedSeasons || [];
            if (!joinedSeasons.includes(id)) {
              joinedSeasons.push(id);
              store.updateUser(curr.id, { joinedSeasons });
            }
            showToast('Tournament joined & saved to your account!', 'success');
            render();
          }
        });
      });

      // Join match click
      grid.querySelectorAll('.join-match-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const curr = store.getCurrentUser();
          if (curr) {
            const joinedMatches = curr.joinedMatches || [];
            if (!joinedMatches.includes(id)) {
              joinedMatches.push(id);
              store.updateUser(curr.id, { joinedMatches });
            }
            showToast('Match joined & saved to your account!', 'success');
            render();
          }
        });
      });

      grid.querySelectorAll('.delete-season-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          showConfirm('Delete Tournament', 'Are you sure you want to delete this tournament sequence and all its associated data? This action cannot be undone.', () => {
            store.deleteSeason(btn.dataset.id);
            showToast('Tournament deleted', 'success');
            render(); // Outer render to re-fetch freshest collections from store
          });
        });
      });

      grid.querySelectorAll('.delete-match-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          showConfirm('Delete Match', 'Are you sure you want to delete this match and its scorecard details? This action cannot be undone.', () => {
            store.deleteMatch(btn.dataset.id);
            showToast('Match deleted', 'success');
            render(); // Outer render
          });
        });
      });
    }

    // Initial grid render
    updateSeasonsGrid();

    // Attach pending invite buttons handlers
    const acceptBtn = document.getElementById('acceptInviteBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        try {
          const pending = JSON.parse(localStorage.getItem('lca_pending_invite'));
          const curr = store.getCurrentUser();
          if (curr && pending) {
            if (pending.type === 'match') {
              const joinedMatches = curr.joinedMatches || [];
              if (!joinedMatches.includes(pending.id)) {
                joinedMatches.push(pending.id);
                store.updateUser(curr.id, { joinedMatches });
              }
              // Set focused filter!
              localStorage.setItem('lca_focused_match_id', pending.id);
              localStorage.removeItem('lca_focused_season_id');
            } else {
              const joinedSeasons = curr.joinedSeasons || [];
              if (!joinedSeasons.includes(pending.id)) {
                joinedSeasons.push(pending.id);
                store.updateUser(curr.id, { joinedSeasons });
              }
              // Set focused filter!
              localStorage.setItem('lca_focused_season_id', pending.id);
              localStorage.removeItem('lca_focused_match_id');
            }
            showToast('Joined & saved successfully to your account!', 'success');
          }
        } catch (err) {
          console.error(err);
        }
        localStorage.removeItem('lca_pending_invite');
        render();
      });
    }

    const rejectBtn = document.getElementById('rejectInviteBtn');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        localStorage.removeItem('lca_pending_invite');
        showToast('Invitation declined.', 'info');
        render();
      });
    }

    const clearFocusedFilterBtn = document.getElementById('clearFocusedFilterBtn');
    if (clearFocusedFilterBtn) {
      clearFocusedFilterBtn.addEventListener('click', () => {
        localStorage.removeItem('lca_focused_match_id');
        localStorage.removeItem('lca_focused_season_id');
        showToast('Deep-link filters cleared! Showing all recordings.', 'info');
        render();
      });
    }

    // Event Listeners for real-time reactivity
    const searchInput = document.getElementById('seasonSearchInput');

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateSeasonsGrid();
    });

    // Custom Interactive Filter Pill Event Handlers
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterOption = pill.dataset.value;
        localStorage.setItem('lca_dashboard_filter', filterOption);
        
        // Let's also update the active state of the bottom nav if it exists!
        const navExplore = document.getElementById('btnNavExplore');
        const navSaved = document.getElementById('btnNavSaved');
        if (navExplore && navSaved) {
          if (filterOption === 'saved') {
            navExplore.classList.remove('active');
            navSaved.classList.add('active');
          } else {
            navExplore.classList.add('active');
            navSaved.classList.remove('active');
          }
        }
        
        updateSeasonsGrid();
      });
    });

    document.addEventListener('click', () => {
      const nd = document.getElementById('notificationDropdown');
      if (nd) nd.classList.add('hidden');
    });

    // Setup Notifications
    setupNotifications(user, navigate, store);

    // Quick Logout trigger
    document.getElementById('quickLogoutBtn')?.addEventListener('click', () => {
      store.logout();
      showToast('Logged out successfully', 'success');
      navigate('login');
    });

    // Lazy load the Creator Modal if requested globally
    setTimeout(() => {
      if (localStorage.getItem('lca_open_create') === 'true') {
        localStorage.removeItem('lca_open_create');
        showCreateSeasonModal();
      }
    }, 100);
  }

  function showCreateSeasonModal() {
    const modalRoot = document.getElementById('modal-root');
    const seasons = store.getSeasons();
    const today = new Date().toISOString().split('T')[0];

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:480px; width:95%; max-height:90vh; overflow-y:auto;">
          <div class="modal-title">${icon('add_circle', 24)} Create Match Or Tournment</div>
          <button class="modal-close" id="closeCreateModal">${icon('close')}</button>
          
          <form id="unifiedCreateForm">
            <!-- Selector to choose Match or Tournment -->
            <div class="form-group">
              <label class="form-label">Create Type</label>
              <select id="entityType" class="form-input">
                <option value="tournment">Tournment</option>
                <option value="match">Match</option>
              </select>
            </div>

            <!-- Name Input (used for both Match or Tournment Name) -->
            <div class="form-group">
              <label class="form-label" id="nameLabel">Tournment Name</label>
              <input type="text" id="entityName" class="form-input" placeholder="e.g., Summer League 2026" required />
            </div>

            <!-- Date Input -->
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" id="entityDate" class="form-input" value="${today}" required />
            </div>

            <!-- Match-specific fields container -->
            <div id="matchFields" class="hidden" style="display:flex; flex-direction:column; gap:var(--sp-3); margin-top:var(--sp-2);">
              <div class="form-group">
                <label class="form-label">Associate with Tournment</label>
                <select id="matchSeasonSelect" class="form-input">
                  ${seasons.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
                  <option value="new_tournment">+ Create a New Tournment with this name</option>
                </select>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">
                <div class="form-group">
                  <label class="form-label">Team 1 Name</label>
                  <input type="text" id="matchTeam1" class="form-input" placeholder="e.g., Raiders" value="Team A" />
                </div>
                <div class="form-group">
                  <label class="form-label">Team 2 Name</label>
                  <input type="text" id="matchTeam2" class="form-input" placeholder="e.g., Titans" value="Team B" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Match Winner</label>
                <input type="text" id="matchWinner" class="form-input" placeholder="e.g., Raiders (optional)" />
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">
                <div class="form-group">
                  <label class="form-label">Toss Who Win</label>
                  <input type="text" id="matchToss" class="form-input" placeholder="Who won toss (optional)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Pitch Condition</label>
                  <input type="text" id="matchPitch" class="form-input" placeholder="e.g., Dry pitch (optional)" />
                </div>
              </div>
            </div>

            <div class="modal-actions" style="margin-top:var(--sp-5);">
              <button type="button" class="btn btn-outline" id="cancelCreate">Cancel</button>
              <button type="submit" class="btn btn-primary" id="submitBtn">Create Tournment</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const entityType = document.getElementById('entityType');
    const nameLabel = document.getElementById('nameLabel');
    const entityName = document.getElementById('entityName');
    const matchFields = document.getElementById('matchFields');
    const submitBtn = document.getElementById('submitBtn');

    entityName.focus();

    // Toggle fields based on selected Create Type
    entityType.addEventListener('change', () => {
      if (entityType.value === 'match') {
        matchFields.classList.remove('hidden');
        nameLabel.textContent = 'Match Name / Title';
        entityName.placeholder = 'e.g., Qualifier Match 1';
        submitBtn.textContent = 'Create Match';
      } else {
        matchFields.classList.add('hidden');
        nameLabel.textContent = 'Tournment Name';
        entityName.placeholder = 'e.g., Summer League 2026';
        submitBtn.textContent = 'Create Tournment';
      }
    });

    document.getElementById('closeCreateModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelCreate').addEventListener('click', () => modalRoot.innerHTML = '');

    document.getElementById('unifiedCreateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const type = entityType.value;
      const name = entityName.value.trim();
      const date = document.getElementById('entityDate').value;

      if (!name) return;

      const creator = user?.username || 'admin';
      const creatorName = user?.fullName || user?.username || 'Tournament Admin';

      if (type === 'tournment') {
        store.addSeason({ 
          name, 
          date,
          creator,
          creatorName
        });
        showToast('Tournament created!', 'success');
      } else {
        // Create Match logic
        const seasonSelect = document.getElementById('matchSeasonSelect');
        const team1 = document.getElementById('matchTeam1').value.trim() || 'Team A';
        const team2 = document.getElementById('matchTeam2').value.trim() || 'Team B';
        const winner = document.getElementById('matchWinner').value.trim();
        const toss = document.getElementById('matchToss').value.trim();
        const pitch = document.getElementById('matchPitch').value.trim();

        let targetSeasonId = seasonSelect ? seasonSelect.value : null;

        if (!targetSeasonId || targetSeasonId === 'new_tournment') {
          // Auto create a Tournment
          const newTourn = store.addSeason({ 
            name: name + " Tournment", 
            date,
            creator,
            creatorName
          });
          targetSeasonId = newTourn.id;
        }

        store.addMatch({
          seasonId: targetSeasonId,
          team1,
          team2,
          tossWinner: toss,
          pitchCondition: pitch,
          matchWinner: winner,
          date,
          creator,
          creatorName,
          batting: [],
          bowling: []
        });

        showToast('Match created successfully!', 'success');
      }

      modalRoot.innerHTML = '';
      render();
    });
  }

  function showInviteModal(type, id, name) {
    const modalRoot = document.getElementById('modal-root');
    const shareUrl = `${window.location.origin}/?inviteType=${encodeURIComponent(type)}&inviteId=${encodeURIComponent(id)}`;
    const shareText = `Hey! Check out this live cricket score statistics dashboard for "${name}" here: ${shareUrl}`;

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content animate-scale-up" style="max-width:440px; width:95%; text-align:center; padding:var(--sp-6); background:var(--bg-card); border:1px solid var(--bg-card-border); border-radius:var(--radius-lg); box-shadow:0 12px 40px rgba(0,0,0,0.5);">
          <div style="background:rgba(var(--accent-primary-rgb, 12, 166, 120), 0.1); width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto var(--sp-4);">
            <span class="material-symbols-rounded" style="font-size:32px; color:var(--accent-primary, #0ca678);">share</span>
          </div>
          <h2 style="font-family:var(--font-heading); font-weight:var(--fw-extrabold); font-size:var(--fs-lg); margin-bottom:var(--sp-2); color:var(--text-primary);">Invite Your Friends!</h2>
          <p style="color:var(--text-muted); font-size:var(--fs-sm); margin-bottom:var(--sp-5);">Invite colleagues, players, or fans to follow this ${type} and join the real-time scorecard updates.</p>
          
          <div style="background:var(--bg-secondary, #151f21); border:1px solid var(--bg-card-border); border-radius:var(--radius-md); padding:var(--sp-3); display:flex; gap:var(--sp-2); align-items:center; margin-bottom:var(--sp-5);">
            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--text-primary); text-align:left;">
              ${escapeHtml(shareUrl)}
            </div>
            <button class="btn btn-primary btn-sm" id="copyShareBtn" style="flex-shrink:0;">
              ${icon('content_copy', 14)} Copy
            </button>
          </div>

          <div style="display:flex; flex-direction:column; gap:var(--sp-2); margin-bottom:var(--sp-4);">
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}" target="_blank" class="btn btn-outline btn-sm" style="display:flex; align-items:center; justify-content:center; gap:var(--sp-2); border-color:#25d366; color:#25d366; background:rgba(37,211,102,0.05); text-decoration:none;">
              <span class="material-symbols-rounded" style="font-size:16px;">chat</span> Share on WhatsApp
            </a>
            <a href="mailto:?subject=${encodeURIComponent('Cricket Scorecard Invite')}&body=${encodeURIComponent(shareText)}" class="btn btn-outline btn-sm" style="display:flex; align-items:center; justify-content:center; gap:var(--sp-2); text-decoration:none; color:var(--text-primary);">
              ${icon('mail', 16)} Email Invite Link
            </a>
          </div>

          <button class="btn btn-ghost btn-sm" id="closeInviteModalBtn" style="width:100%; border-top:1px solid var(--bg-card-border); padding-top:var(--sp-3); margin-top:var(--sp-2);">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById('closeInviteModalBtn').addEventListener('click', () => { modalRoot.innerHTML = ''; });
    document.getElementById('copyShareBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Invite details copied!', 'success');
      }).catch(() => {
        showToast('Copy failed, please highlight and copy link manually.', 'warning');
      });
    });
  }

  render();
}
