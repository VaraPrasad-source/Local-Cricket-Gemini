// ============================================
// WORKSPACE — Tournament Hub (All 5 Tabs)
// ============================================
import { store } from '../store.js';
import { showToast, icon, escapeHtml, calcStrikeRate, calcEconomy, calcPoints, setupNotifications, showConfirm, videoStore } from '../utils/helpers.js';
import { TAB_CONFIG, TABS, PLAYER_ROLES, AWARD_TYPES, AWARD_BOTTOM, ADMIN_PASSWORD } from '../utils/constants.js';
import { uploadVideoToFirebase } from '../firebase.js';

export function renderWorkspace(app, navigate, params = {}) {
  const seasonId = params.seasonId;
  const season = store.getSeason(seasonId);
  if (!season) { navigate('dashboard'); return; }

  let user = store.getCurrentUser();
  let isAdmin = store.isAdmin();
  let activeTab = params.initialTab || TABS.MATCH_DETAILS;
  let activeMeetingId = params.meetingId || null;
  let chatInterval = null;
  let matchStageFilter = 'all';

  function render() {
    user = store.getCurrentUser();
    isAdmin = store.isAdmin();

    app.innerHTML = `
      <div class="workspace-page animate-fade-in">
        <!-- Header -->
        <div class="workspace-header">
          <!-- Top Row (Title, Back, Profile) -->
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:var(--sp-3)">
            <div class="workspace-header-left" style="margin-bottom:0">
              <button class="btn-icon" id="backBtn">${icon('arrow_back')}</button>
              <div class="workspace-title-block">
                <h1>${escapeHtml(season.name)}</h1>
              </div>
            </div>
            <!-- Profile dropdown on the right side of the top bar -->
            <div style="display:flex;gap:var(--sp-2);align-items:center;flex-shrink:0;">
              
              <!-- Notifications Dropdown -->
              <div style="position:relative">
                <button class="btn-icon" id="notificationBtn" title="Notifications" style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
                  ${icon('notifications', 22)}
                </button>
                <div class="notification-dropdown hidden" id="notificationDropdown" style="position:absolute; right:0; top:44px; background:var(--bg-modal); border:1px solid var(--bg-card-border); border-radius:var(--radius-md); padding:var(--sp-2); width:320px; max-height:400px; overflow-y:auto; z-index:100; box-shadow:var(--shadow-lg);">
                  <div style="padding:var(--sp-2) var(--sp-3); border-bottom:1px solid var(--bg-card-border); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:var(--fw-bold); font-size:var(--fs-sm);">Notifications</span>
                    <button class="btn btn-ghost btn-sm" id="markAllReadBtn" style="font-size:10px; padding:2px 6px; display:none;">Mark all as read</button>
                  </div>
                  <div id="notificationListContainer" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:4px;">
                    <!-- items will be injected here -->
                  </div>
                </div>
              </div>

              <div style="position:relative">
                <button class="btn-icon" id="userMenuBtn" title="Profile" style="width:38px; height:38px; display:flex; align-items:center; justify-content:center;">${icon('account_circle', 24)}</button>
                <div class="user-dropdown hidden" id="userDropdown" style="position:absolute;right:0;top:44px;background:var(--bg-modal);border:1px solid var(--bg-card-border);border-radius:var(--radius-md);padding:var(--sp-2);min-width:180px;z-index:100;box-shadow:var(--shadow-lg)">
                  <div style="padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--bg-card-border);margin-bottom:var(--sp-2)">
                    <div style="font-weight:var(--fw-bold);font-size:var(--fs-sm);color:var(--text-primary);text-align:left;">${escapeHtml(user?.fullName || 'User')}</div>
                    <div style="font-size:var(--fs-xs);color:var(--text-muted);text-align:left;">@${escapeHtml(user?.username || '')}</div>
                  </div>
                  <button class="btn btn-ghost btn-sm" id="profileBtn" style="width:100%;justify-content:flex-start;gap:8px;color:var(--text-primary);">${icon('person', 16)} Profile Selection</button>
                  <button class="btn btn-ghost btn-sm" id="logoutBtn" style="width:100%;justify-content:flex-start;gap:8px;color:var(--accent-red)">${icon('logout', 16)} Logout</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Bottom Row (Tab list) -->
          <div class="nav-tabs" id="navTabs" style="width:100%; overflow-x:auto;">
            ${TAB_CONFIG.map(t => `
              <button class="nav-tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
                ${icon(t.icon, 16)} ${t.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        <div class="workspace-content" id="tabContent"></div>
      </div>
    `;

    document.getElementById('backBtn').addEventListener('click', () => {
      if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
      }
      navigate('dashboard');
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (chatInterval) {
          clearInterval(chatInterval);
          chatInterval = null;
        }
        activeMeetingId = null;
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // Profile Dropdown listeners
    document.getElementById('userMenuBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      const dd = document.getElementById('userDropdown');
      if (dd) dd.classList.add('hidden');
      const nd = document.getElementById('notificationDropdown');
      if (nd) nd.classList.add('hidden');
    });

    // Setup Notifications
    setupNotifications(user, navigate, store);

    document.getElementById('profileBtn')?.addEventListener('click', () => {
      if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
      }
      navigate('profile');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
      }
      store.logout();
      showToast('Logged out successfully', 'success');
      navigate('login');
    });

    renderTabContent();
  }

  function renderTabContent() {
    const content = document.getElementById('tabContent');
    switch (activeTab) {
      case TABS.MATCH_DETAILS: renderMatchDetails(content); break;
      case TABS.STARS: renderStars(content); break;
      case TABS.POINTS_TABLE: renderPointsTable(content); break;
      case TABS.SCHEDULE: renderSchedule(content); break;
      case TABS.TEAM_MEMBERS: renderTeamMembers(content); break;
      case TABS.GROUP_MEETINGS: renderGroupMeetings(content); break;
    }
  }

  // ═══════════════════════════════════════════
  // TAB 1: MATCH DETAILS
  // ═══════════════════════════════════════════
  function renderMatchDetails(container) {
    const matches = store.getMatches(seasonId);
    let newestMatchId = null;
    if (matches.length > 0) {
      const matchesWithTime = matches.filter(m => m.createdAt);
      if (matchesWithTime.length > 0) {
        // Find newest by createdAt date descending
        const sorted = [...matchesWithTime].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        newestMatchId = sorted[0].id;
      } else {
        // Fallback to the last match in the list
        newestMatchId = matches[matches.length - 1].id;
      }
    }

    const filteredMatches = matches.filter(m => {
      if (matchStageFilter === 'all') return true;
      if (matchStageFilter === 'regular') return !m.stage || m.stage === 'regular';
      return m.stage === matchStageFilter;
    });

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title section-title-green">Season Match Details Ledger</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="createMatchBtn">${icon('add', 16)} Create Match Record</button>` : ''}
      </div>
      
      <!-- Match Stage / Round Filter bar -->
      <div class="stage-filter-bar">
        <span class="stage-filter-label" style="font-size:var(--fs-xs); color:var(--text-muted); font-weight:var(--fw-bold); margin-left:var(--sp-2); margin-right:var(--sp-2);">Stage Filter:</span>
        <button class="btn ${matchStageFilter === 'all' ? 'btn-primary' : 'btn-ghost'} btn-sm" id="btnFilterAll" style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px;">
          ${icon('sports_cricket', 14)} All Matches
        </button>
        <button class="btn ${matchStageFilter === 'regular' ? 'btn-primary' : 'btn-ghost'} btn-sm" id="btnFilterRegular" style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px;">
          ${icon('table_rows', 14)} League Stage
        </button>
        <button class="btn ${matchStageFilter === 'semifinal' ? 'btn-primary' : 'btn-ghost'} btn-sm" id="btnFilterSemi" style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px; ${matchStageFilter !== 'semifinal' ? 'color:#a855f7;' : ''}">
          ${icon('shield', 14)} Semi-Finals
        </button>
        <button class="btn ${matchStageFilter === 'final' ? 'btn-primary' : 'btn-ghost'} btn-sm" id="btnFilterFinal" style="display:flex; align-items:center; gap:6px; font-weight:600; font-size:12px; ${matchStageFilter !== 'final' ? 'color:#eab308;' : ''}">
          ${icon('emoji_events', 14)} Final
        </button>
      </div>

      <div id="matchesList">
        ${filteredMatches.length === 0
          ? '<div class="empty-state"><span class="material-symbols-rounded">sports_cricket</span><p>No matches recorded for this tournament stage.</p></div>'
          : filteredMatches.map(m => renderMatchBlock(m, m.id === newestMatchId)).join('')
        }
      </div>
    `;

    document.getElementById('createMatchBtn')?.addEventListener('click', () => showMatchModal());

    document.getElementById('btnFilterAll')?.addEventListener('click', () => {
      matchStageFilter = 'all';
      renderMatchDetails(container);
    });
    document.getElementById('btnFilterRegular')?.addEventListener('click', () => {
      matchStageFilter = 'regular';
      renderMatchDetails(container);
    });
    document.getElementById('btnFilterSemi')?.addEventListener('click', () => {
      matchStageFilter = 'semifinal';
      renderMatchDetails(container);
    });
    document.getElementById('btnFilterFinal')?.addEventListener('click', () => {
      matchStageFilter = 'final';
      renderMatchDetails(container);
    });


    // Delete match buttons
    document.querySelectorAll('.delete-match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Delete Match Record', 'Are you sure you want to delete this match record? All scorecards and records will be permanent loss.', () => {
          store.deleteMatch(btn.dataset.id);
          showToast('Match deleted', 'success');
          renderMatchDetails(container);
        });
      });
    });

    // Edit match buttons
    document.querySelectorAll('.edit-match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const match = store.getMatch(btn.dataset.id);
        if (match) showMatchModal(match);
      });
    });

    // Invite match players buttons
    document.querySelectorAll('.invite-match-players-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showMatchInviteModal(btn.dataset.id);
      });
    });


    // Play video click listener
    document.querySelectorAll('[data-play-video-id]').forEach(card => {
      card.addEventListener('click', async () => {
        const matchId = card.getAttribute('data-play-video-id');
        const match = store.getMatch(matchId);
        if (!match) return;

        try {
          if (match.videoUrl) {
            // Live URL streaming or YouTube embed
            showVideoPlayerModal(match, match.videoUrl, false);
          } else {
            // Local offline Blob
            const videoFile = await videoStore.getVideo(matchId);
            if (videoFile) {
              const videoUrl = URL.createObjectURL(videoFile);
              showVideoPlayerModal(match, videoUrl, true);
            } else {
              showToast('Video data not found. Please edit this match and upload the video file or add a streaming web URL.', 'warning');
            }
          }
        } catch (err) {
          console.error('Error fetching video from IndexedDB:', err);
          showToast('Could not load original video file from local store.', 'error');
        }
      });
    });
  }

  function renderMatchBlock(m, isNewest = false) {
    const play1stBatting = (m.batting || []).filter(b => b.innings !== '2');
    const play2ndBatting = (m.batting || []).filter(b => b.innings === '2');

    const play1stBowling = (m.bowling || []).filter(b => b.innings !== '2');
    const play2ndBowling = (m.bowling || []).filter(b => b.innings === '2');

    const renderBattingTableHTML = (rows, title) => {
      if (!rows || rows.length === 0) return '';
      const battingCards = rows.map(b => {
        const srValue = Number(calcStrikeRate(b.runs, b.balls));
        let srBadge = '';
        if (srValue >= 200) {
          srBadge = `<span style="background:rgba(239, 68, 68, 0.15); color:#ef4444; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; border:1px solid rgba(239, 68, 68, 0.25)">⚡ Rapid 200+</span>`;
        } else if (srValue >= 150) {
          srBadge = `<span style="background:rgba(249, 115, 22, 0.15); color:#f97316; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; border:1px solid rgba(249, 115, 22, 0.25)">⚡ Fast</span>`;
        }

        let runsBadge = '';
        if (Number(b.runs) >= 100) {
          runsBadge = `<span style="background:rgba(224, 166, 12, 0.15); color:#eab308; border:1px solid rgba(224, 166, 12, 0.3); font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">👑 Century 100+</span>`;
        } else if (Number(b.runs) >= 50) {
          runsBadge = `<span style="background:rgba(12, 166, 120, 0.15); color:#10b981; border:1px solid rgba(12, 166, 120, 0.3); font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">⭐ 50+</span>`;
        }

        const isSuperStar = Number(b.runs) >= 50 || srValue >= 180;
        const cardStyle = isSuperStar 
          ? 'background: linear-gradient(135deg, rgba(30, 201, 166, 0.12) 0%, rgba(30, 201, 166, 0.03) 100%); border: 1px solid rgba(30, 201, 166, 0.3);' 
          : 'background: var(--bg-card, #111a1c); border: 1px solid var(--bg-card-border, rgba(255,255,255,0.08));';

        return `
          <div class="scorecard-vertical-box animate-slide-up" style="${cardStyle} border-radius: var(--radius-lg); padding: var(--sp-3) var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <!-- Batter Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: var(--sp-2);">
              <span style="font-weight: 700; font-size: var(--fs-md); color: var(--text-primary);">${escapeHtml(b.name)}</span>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${runsBadge}
              </div>
            </div>
            
            <!-- Quick Stats Row -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: var(--fs-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Runs</span>
                <span style="font-size: 18px; color: #eab308; font-weight: var(--fw-black);">${b.runs} <span style="font-size: 11px; font-weight: normal; color: var(--text-muted); font-family: var(--font-mono);">(${b.balls}b)</span></span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: var(--fs-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Strike Rate</span>
                <span class="col-green" style="font-family: var(--font-mono); font-size: var(--fs-md); font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">
                  ${srValue} ${srBadge}
                </span>
              </div>
            </div>

            <!-- Fours & Sixes -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-2); background: rgba(0,0,0,0.15); border-radius: var(--radius-md); padding: var(--sp-2); text-align: center;">
              <div>
                <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">4s</span>
                <span style="font-weight: var(--fw-bold); color: var(--text-primary); font-size: var(--fs-sm);">${b.fours || 0}</span>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">6s</span>
                <span style="font-weight: var(--fw-bold); color: var(--text-primary); font-size: var(--fs-sm);">${b.sixes || 0}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="scorecard-section" style="margin-top:var(--sp-4);">
          <div style="background:linear-gradient(90deg, rgba(var(--accent-primary-rgb, 12, 166, 120), 0.15) 0%, transparent 100%); padding:var(--sp-2) var(--sp-4); border-left:3px solid var(--accent-primary, #0ca678); border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom:var(--sp-3); display:flex; align-items:center; gap:var(--sp-2);">
            <span class="material-symbols-rounded" style="color:var(--accent-primary, #0ca678); font-size:18px;">sports_cricket</span>
            <div style="font-family:var(--font-heading); font-size:0.85rem; font-weight:var(--fw-extrabold); text-transform:uppercase; letter-spacing:0.05em; color:var(--text-primary);">${escapeHtml(title)}</div>
          </div>
          <div class="scorecard-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--sp-3); margin-bottom: var(--sp-4);">
            ${battingCards}
          </div>
        </div>
      `;
    };

    const renderBowlingTableHTML = (rows, title) => {
      if (!rows || rows.length === 0) return '';
      const bowlingCards = rows.map(b => {
        const economyVal = Number(calcEconomy(b.runsGiven, b.overs));
        let economyBadge = '';
        if (economyVal > 0 && economyVal < 6.0) {
          economyBadge = `<span style="background:rgba(34, 197, 94, 0.15); color:#22c55e; border:1px solid rgba(34, 197, 94, 0.25); font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">🛡️ Tight</span>`;
        } else if (economyVal > 0 && economyVal < 8.0) {
          economyBadge = `<span style="background:rgba(59, 130, 246, 0.15); color:#3b82f6; border:1px solid rgba(59, 130, 246, 0.25); font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">⭐ Good</span>`;
        }

        const isSuperStar = Number(b.maidens) > 0 || (economyVal > 0 && economyVal < 6.0);
        const cardStyle = isSuperStar 
          ? 'background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.03) 100%); border: 1px solid rgba(34, 197, 94, 0.3);' 
          : 'background: var(--bg-card, #111a1c); border: 1px solid var(--bg-card-border, rgba(255,255,255,0.08));';

        return `
          <div class="scorecard-vertical-box animate-slide-up" style="${cardStyle} border-radius: var(--radius-lg); padding: var(--sp-3) var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <!-- Bowler Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: var(--sp-2);">
              <span style="font-weight: 700; font-size: var(--fs-md); color: var(--text-primary);">${escapeHtml(b.name)}</span>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${Number(b.maidens) > 0 ? `<span style="background:rgba(16, 185, 129, 0.15); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3); font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">⚡ ${b.maidens} Mdn</span>` : ''}
              </div>
            </div>

            <!-- Quick Stats Row -->
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: var(--fs-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Overs</span>
                <span style="font-size: 18px; color: var(--text-primary); font-weight: var(--fw-extrabold);">${b.overs} <span style="font-size:11px; font-weight:normal; color:var(--text-muted); font-family:var(--font-mono);">ov</span></span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: var(--fs-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Economy</span>
                <span class="col-green" style="font-family: var(--font-mono); font-size: var(--fs-md); font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">
                  ${economyVal} ${economyBadge}
                </span>
              </div>
            </div>

            <!-- Maidens & Runs Given -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-2); background: rgba(0,0,0,0.15); border-radius: var(--radius-md); padding: var(--sp-2); text-align: center;">
              <div>
                <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Maidens</span>
                <span style="font-weight: var(--fw-bold); color: ${Number(b.maidens) > 0 ? '#10b981' : 'var(--text-primary)'}; font-size: var(--fs-sm);">${b.maidens || 0}</span>
              </div>
              <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Runs Given</span>
                <span style="font-weight: var(--fw-bold); color: #ef4444; font-size: var(--fs-sm);">${b.runsGiven}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="scorecard-section" style="margin-top:var(--sp-4);">
          <div style="background:linear-gradient(90deg, rgba(34, 197, 94, 0.15) 0%, transparent 100%); padding:var(--sp-2) var(--sp-4); border-left:3px solid #22c55e; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom:var(--sp-3); display:flex; align-items:center; gap:var(--sp-2);">
            <span class="material-symbols-rounded" style="color:#22c55e; font-size:18px;">sports_cricket</span>
            <div style="font-family:var(--font-heading); font-size:0.85rem; font-weight:var(--fw-extrabold); text-transform:uppercase; letter-spacing:0.05em; color:var(--text-primary);">${escapeHtml(title)}</div>
          </div>
          <div class="scorecard-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--sp-3); margin-bottom: var(--sp-4);">
            ${bowlingCards}
          </div>
        </div>
      `;
    };

    let battingHtml = '';
    if (play1stBatting.length > 0) {
      battingHtml += renderBattingTableHTML(play1stBatting, (m.batting || []).some(x => x.innings === '2') ? 'Scorecard Batting Stats (1st Innings)' : 'Scorecard Batting Stats');
    }
    if (play2ndBatting.length > 0) {
      battingHtml += renderBattingTableHTML(play2ndBatting, 'Scorecard Batting Stats (2nd Innings)');
    }

    let bowlingHtml = '';
    if (play1stBowling.length > 0) {
      bowlingHtml += renderBowlingTableHTML(play1stBowling, (m.bowling || []).some(x => x.innings === '2') ? 'Scorecard Bowling Stats (1st Innings)' : 'Scorecard Bowling Stats');
    }
    if (play2ndBowling.length > 0) {
      bowlingHtml += renderBowlingTableHTML(play2ndBowling, 'Scorecard Bowling Stats (2nd Innings)');
    }

    let stageBadge = '';
    if (m.stage === 'semifinal') {
      stageBadge = `<span style="background:rgba(168, 85, 247, 0.15); color:#c084fc; border:1px solid rgba(168, 85, 247, 0.3); font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; max-height:22px;">${icon('shield', 12)} Semi-Final</span>`;
    } else if (m.stage === 'final') {
      stageBadge = `<span style="background:rgba(234, 179, 8, 0.15); color:#facc15; border:1px solid rgba(234, 179, 8, 0.3); font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; max-height:22px;">${icon('emoji_events', 12)} Final Match</span>`;
    } else {
      stageBadge = `<span style="background:rgba(255, 255, 255, 0.08); color:var(--text-muted); border:1px solid rgba(255, 255, 255, 0.15); font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px; max-height:22px;">${icon('table_rows', 12)} League Match</span>`;
    }

    return `
      <div class="match-block ${isNewest ? 'match-block-newest' : ''}">
        <div class="match-block-header" style="flex-wrap: wrap; gap: var(--sp-2);">
          <div style="display:flex; flex-direction:column; gap:var(--sp-1);">
            <div style="display:flex; align-items:center; gap:var(--sp-2); flex-wrap:wrap;">
              ${stageBadge}
              <span class="match-block-title">${escapeHtml(m.team1)} vs ${escapeHtml(m.team2)}</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:4px; margin-left:var(--sp-1);">
              ${icon('account_circle', 12)} <span style="font-weight:600">Created by:</span> <span style="color:#1ec9a6; font-weight:700">${escapeHtml(m.creatorName || m.creator || 'Tournament Admin')}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <span class="match-block-status text-green">${m.matchWinner ? 'Match result state finalized' : 'Pending'}</span>
            <button class="btn btn-outline btn-sm invite-match-players-btn" data-id="${m.id}" title="Invite Players" style="display:flex; align-items:center; gap:4px; padding:var(--sp-1) var(--sp-2); font-size:var(--fs-xs);">
              ${icon('person_add', 14)} Invite
            </button>
            ${isAdmin ? `
              <button class="btn btn-ghost btn-sm edit-match-btn" data-id="${m.id}" title="Edit">${icon('edit', 16)}</button>
              <button class="btn btn-ghost btn-sm delete-match-btn" data-id="${m.id}" title="Delete">${icon('delete', 16)}</button>
            ` : ''}
          </div>
        </div>

        <!-- Match Info -->
        <div class="match-info-card" style="gap:var(--sp-4); background:rgba(30, 41, 59, 0.45); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-lg); padding:var(--sp-4); box-shadow:0 8px 30px rgba(0,0,0,0.3); backdrop-filter:blur(6px); margin-bottom:var(--sp-4);">
          <div class="match-info-item" style="border-left:3px solid #6366f1; background:rgba(99, 102, 241, 0.05); padding:var(--sp-3) var(--sp-4); border-radius:0 var(--radius-md) var(--radius-md) 0; display:flex; align-items:center; gap:var(--sp-3)">
            <div style="background:rgba(99, 102, 241, 0.15); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#818cf8; flex-shrink:0">
              ${icon('swap_horizontal_circle', 20)}
            </div>
            <div>
              <div class="match-info-item-label" style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:var(--fw-bold); margin-bottom:2px">Toss Won By</div>
              <div class="match-info-item-value" style="font-size:var(--fs-md); color:var(--text-primary); font-weight:var(--fw-extrabold)">${escapeHtml(m.tossWinner || '-')}</div>
            </div>
          </div>
          <div class="match-info-item" style="border-left:3px solid #06b6d4; background:rgba(6, 182, 212, 0.05); padding:var(--sp-3) var(--sp-4); border-radius:0 var(--radius-md) var(--radius-md) 0; display:flex; align-items:center; gap:var(--sp-3)">
            <div style="background:rgba(6, 182, 212, 0.15); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#22d3ee; flex-shrink:0">
              ${icon('grass', 20)}
            </div>
            <div>
              <div class="match-info-item-label" style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:var(--fw-bold); margin-bottom:2px">Pitch Condition</div>
              <div class="match-info-item-value" style="font-size:var(--fs-md); color:var(--text-primary); font-weight:var(--fw-extrabold)">${escapeHtml(m.pitchCondition || '-')}</div>
            </div>
          </div>
          <div class="match-info-item" style="border-left:3px solid #eab308; background:rgba(234, 179, 8, 0.08); border:1px solid rgba(234, 179, 8, 0.2); padding:var(--sp-3) var(--sp-4); border-radius:0 var(--radius-md) var(--radius-md) 0; display:flex; align-items:center; gap:var(--sp-3); position:relative; overflow:hidden">
            <div style="background:rgba(234, 179, 8, 0.22); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fde047; flex-shrink:0">
              ${icon('emoji_events', 20)}
            </div>
            <div style="z-index:2">
              <div class="match-info-item-label" style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; color:#fde047; font-weight:var(--fw-extrabold); margin-bottom:2px">Match Winner</div>
              <div class="match-info-item-value" style="font-size:var(--fs-md); color:#4ade80; font-weight:var(--fw-black); text-shadow:0 0 10px rgba(74,222,128,0.4)">${escapeHtml(m.matchWinner || '-')}</div>
            </div>
            <div style="position:absolute; right:-10px; bottom:-10px; opacity:0.35; transform:rotate(-15deg); color:#eab308">
              ${icon('military_tech', 64)}
            </div>
          </div>
        </div>

        ${(m.videoName || m.videoUrl) ? `
          <div class="match-video-actions-wrapper">
            <div class="video-card animate-pulse-subtle" style="flex:1; margin:0; cursor:pointer; display:flex; align-items:center; gap:var(--sp-3); border:1px solid rgba(0, 229, 255, 0.3); background:rgba(0, 229, 255, 0.06); padding:var(--sp-3); border-radius:var(--radius-md);" data-play-video-id="${m.id}" title="Click to review video inside this dashboard">
              <span style="color:var(--accent-cyan, #00E5FF); display:inline-flex;">${icon('play_circle', 26)}</span>
              <div style="text-align:left;">
                <span style="font-weight:700; color:var(--accent-cyan, #00E5FF); display:block; font-size:var(--fs-sm); margin-bottom:2px;">Play In-App Player</span>
                <span style="color:var(--text-muted); font-size:11px; display:block; opacity:0.85;">
                  ${m.videoName ? `File: ${escapeHtml(m.videoName)}` : 'Highlights stream link'}
                </span>
              </div>
            </div>
            ${m.videoUrl ? `
              <a href="${m.videoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(0, 229, 255, 0.1); border-color:rgba(0, 229, 255, 0.35); color:var(--accent-cyan); font-weight:700; font-size:12px; padding:0 var(--sp-4); text-decoration:none; border-radius:var(--radius-md);" title="Open in external players / regular browser tab">
                ${icon('open_in_new', 18)} Browser / Apps
              </a>
            ` : ''}
          </div>
        ` : ''}

        ${battingHtml}

        ${bowlingHtml}
      </div>
    `;
  }

  function showMatchModal(existing = null) {
    const isEdit = !!existing;
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:600px">
          <div class="modal-title">${icon('sports_cricket', 24)} ${isEdit ? 'Edit' : 'Record Season'} Match Entry</div>
          <button class="modal-close" id="closeMatchModal">${icon('close')}</button>
          <form id="matchForm">
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Team 1 Name</label>
                <input type="text" class="form-input" id="mTeam1" value="${escapeHtml(existing?.team1 || '')}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Team 2 Name</label>
                <input type="text" class="form-input" id="mTeam2" value="${escapeHtml(existing?.team2 || '')}" required />
              </div>
            </div>

            <div class="form-row form-row-3" style="margin-top:var(--sp-3)">
              <div class="form-group">
                <label class="form-label form-label-colored">Toss Who Win</label>
                <input type="text" class="form-input" id="mToss" value="${escapeHtml(existing?.tossWinner || '')}" />
              </div>
              <div class="form-group">
                <label class="form-label form-label-green">Pitch Condition</label>
                <input type="text" class="form-input" id="mPitch" value="${escapeHtml(existing?.pitchCondition || '')}" />
              </div>
              <div class="form-group">
                <label class="form-label form-label-purple">Match Who Win</label>
                <input type="text" class="form-input" id="mWinner" value="${escapeHtml(existing?.matchWinner || '')}" />
              </div>
            </div>

            <div class="form-row" style="margin-top:var(--sp-3)">
              <div class="form-group">
                <label class="form-label" style="color:var(--accent-cyan); font-weight:bold;">Match Stage / Format Round</label>
                <select class="form-input" id="mStage" style="width:100%; background:var(--bg-card); color:var(--text-primary); border:1px solid var(--bg-card-border); border-radius:var(--radius-md); padding:0 var(--sp-2);">
                  <option value="regular" ${(!existing?.stage || existing?.stage === 'regular') ? 'selected' : ''}>League Stage / Regular match</option>
                  <option value="semifinal" ${existing?.stage === 'semifinal' ? 'selected' : ''}>Semi Final / Playoff</option>
                  <option value="final" ${existing?.stage === 'final' ? 'selected' : ''}>Tournament Final Match</option>
                </select>
              </div>
            </div>

            <div class="form-row form-row-2" style="margin-top:var(--sp-3)">
              <div class="form-group">
                <label class="form-label">Upload Local Video Highlights</label>
                <div class="file-input-wrap">
                  <label class="file-input-btn" for="mVideo">Choose File</label>
                  <input type="file" id="mVideo" accept="video/mp4,video/quicktime" style="display:none" />
                  <span class="file-input-name" id="mVideoName">${existing?.videoName || 'No file chosen'}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label form-label-colored">Or Match Video Stream / YouTube URL</label>
                <input type="url" class="form-input" id="mVideoUrl" placeholder="https://youtube.com/... or mp4 link" value="${escapeHtml(existing?.videoUrl || '')}" style="width:100%" />
              </div>
            </div>

            <!-- Batting -->
            <div style="margin-top:var(--sp-5)">
              <div class="scorecard-label text-orange" style="margin-bottom:var(--sp-3)">Scorecard Batting Performance Data Row</div>
              <div id="battingRows">
                ${(existing?.batting || [{}]).map((b, i) => battingRowHTML(b, i)).join('')}
              </div>
              <button type="button" class="btn btn-ghost btn-sm" id="addBattingRow" style="margin-top:var(--sp-2)">${icon('add', 14)} Add Batting Row</button>
            </div>

            <!-- Bowling -->
            <div style="margin-top:var(--sp-5)">
              <div class="scorecard-label text-orange" style="margin-bottom:var(--sp-3)">Scorecard Bowling Performance Data Row</div>
              <div id="bowlingRows">
                ${(existing?.bowling || [{}]).map((b, i) => bowlingRowHTML(b, i)).join('')}
              </div>
              <button type="button" class="btn btn-ghost btn-sm" id="addBowlingRow" style="margin-top:var(--sp-2)">${icon('add', 14)} Add Bowling Row</button>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelMatch">Close</button>
              <button type="submit" class="btn btn-primary">Save Match Configuration</button>
            </div>
          </form>
        </div>
      </div>
    `;

    let battingIdx = (existing?.batting || [{}]).length;
    let bowlingIdx = (existing?.bowling || [{}]).length;
    let selectedVideoFile = null;

    document.getElementById('mVideo').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedVideoFile = file;
        document.getElementById('mVideoName').textContent = file.name;
      } else {
        selectedVideoFile = null;
        document.getElementById('mVideoName').textContent = 'No file chosen';
      }
    });

    document.getElementById('addBattingRow').addEventListener('click', () => {
      const div = document.createElement('div');
      div.innerHTML = battingRowHTML({}, battingIdx++);
      document.getElementById('battingRows').appendChild(div.firstElementChild);
      setupSRCalc();
    });
    document.getElementById('addBowlingRow').addEventListener('click', () => {
      const div = document.createElement('div');
      div.innerHTML = bowlingRowHTML({}, bowlingIdx++);
      document.getElementById('bowlingRows').appendChild(div.firstElementChild);
      setupEcoCalc();
    });

    document.getElementById('closeMatchModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelMatch').addEventListener('click', () => modalRoot.innerHTML = '');

    document.getElementById('matchForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const videoName = document.getElementById('mVideoName').textContent !== 'No file chosen' ? document.getElementById('mVideoName').textContent : '';
      const videoUrl = document.getElementById('mVideoUrl').value.trim();
      const currentUser = store.getCurrentUser();
      const matchData = {
        seasonId,
        team1: document.getElementById('mTeam1').value.trim(),
        team2: document.getElementById('mTeam2').value.trim(),
        tossWinner: document.getElementById('mToss').value.trim(),
        pitchCondition: document.getElementById('mPitch').value.trim(),
        matchWinner: document.getElementById('mWinner').value.trim(),
        stage: document.getElementById('mStage').value,
        videoName,
        videoUrl,
        creator: existing?.creator || currentUser?.username || 'admin',
        creatorName: existing?.creatorName || currentUser?.fullName || currentUser?.name || currentUser?.username || 'Tournament Admin',
        batting: collectBattingRows(),
        bowling: collectBowlingRows(),
      };

      let savedMatchId;
      if (isEdit) {
        store.updateMatch(existing.id, matchData);
        savedMatchId = existing.id;
        showToast('Match updated!', 'success');
      } else {
        const newMatch = store.addMatch(matchData);
        savedMatchId = newMatch.id;
        showToast('Match created!', 'success');
      }

      if (selectedVideoFile && savedMatchId) {
        showToast('Saving video locally...', 'info');
        // Run video storage and cloud syncing asynchronously in the background so the UI doesn't hang
        (async () => {
          try {
            // Convert File to plain structured Blob for guaranteed cloning
            const plainBlob = new Blob([selectedVideoFile], { type: selectedVideoFile.type });
            await videoStore.saveVideo(savedMatchId, plainBlob);
            showToast('Video saved locally!', 'success');

            // Upload to cloud in the background
            const downloadUrl = await uploadVideoToFirebase(savedMatchId, selectedVideoFile);
            if (downloadUrl) {
              store.updateMatch(savedMatchId, { videoUrl: downloadUrl });
              showToast('Video synced up to server! Ready for all phones.', 'success');
              // Refresh match list dynamically if user is still on the matches tab
              const activeContainer = document.getElementById('tabContent');
              if (activeContainer && activeTab === TABS.MATCH_DETAILS) {
                renderMatchDetails(activeContainer);
              }
            }
          } catch (err) {
            console.error('Failed to store video:', err);
            showToast('Video saved locally only. Cloud sync skipped/failed.', 'warning');
          }
        })();
      }

      modalRoot.innerHTML = '';
      renderMatchDetails(document.getElementById('tabContent'));
    });

    setupSRCalc();
    setupEcoCalc();
  }

  function battingRowHTML(b = {}, idx = 0) {
    return `
      <div class="form-row form-row-7" style="margin-bottom:var(--sp-2)" data-batting-row>
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input form-input-sm bat-name" value="${escapeHtml(b.name || '')}" /></div>
        <div class="form-group">
          <label class="form-label">Innings</label>
          <select class="form-input form-input-sm bat-innings">
            <option value="1" ${b.innings === '2' ? '' : 'selected'}>1st Innings</option>
            <option value="2" ${b.innings === '2' ? 'selected' : ''}>2nd Innings</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Runs</label><input type="number" class="form-input form-input-sm bat-runs" value="${b.runs || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label">Balls</label><input type="number" class="form-input form-input-sm bat-balls" value="${b.balls || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label">4s</label><input type="number" class="form-input form-input-sm bat-fours" value="${b.fours || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label">6s</label><input type="number" class="form-input form-input-sm bat-sixes" value="${b.sixes || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label form-label-red">Strike Rate (SR)</label><input type="text" class="form-input form-input-sm bat-sr" readonly value="${b.runs && b.balls ? calcStrikeRate(b.runs, b.balls) : ''}" style="color:var(--accent-green)" /></div>
      </div>
    `;
  }

  function bowlingRowHTML(b = {}, idx = 0) {
    return `
      <div class="form-row form-row-6" style="margin-bottom:var(--sp-2)" data-bowling-row>
        <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input form-input-sm bowl-name" value="${escapeHtml(b.name || '')}" /></div>
        <div class="form-group">
          <label class="form-label">Innings</label>
          <select class="form-input form-input-sm bowl-innings">
            <option value="1" ${b.innings === '2' ? '' : 'selected'}>1st Innings</option>
            <option value="2" ${b.innings === '2' ? 'selected' : ''}>2nd Innings</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Overs</label><input type="number" class="form-input form-input-sm bowl-overs" value="${b.overs || 0}" min="0" step="0.1" /></div>
        <div class="form-group"><label class="form-label">Maidens</label><input type="number" class="form-input form-input-sm bowl-maidens" value="${b.maidens || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label">Runs</label><input type="number" class="form-input form-input-sm bowl-runs" value="${b.runsGiven || 0}" min="0" /></div>
        <div class="form-group"><label class="form-label form-label-green">Economy</label><input type="text" class="form-input form-input-sm bowl-eco" readonly value="${b.overs && b.runsGiven ? calcEconomy(b.runsGiven, b.overs) : ''}" style="color:var(--accent-green)" /></div>
      </div>
    `;
  }

  function setupSRCalc() {
    document.querySelectorAll('[data-batting-row]').forEach(row => {
      const runs = row.querySelector('.bat-runs');
      const balls = row.querySelector('.bat-balls');
      const sr = row.querySelector('.bat-sr');
      if (!runs || !balls || !sr) return;
      const calc = () => { sr.value = calcStrikeRate(Number(runs.value), Number(balls.value)); };
      runs.addEventListener('input', calc);
      balls.addEventListener('input', calc);
    });
  }

  function setupEcoCalc() {
    document.querySelectorAll('[data-bowling-row]').forEach(row => {
      const overs = row.querySelector('.bowl-overs');
      const runsG = row.querySelector('.bowl-runs');
      const eco = row.querySelector('.bowl-eco');
      if (!overs || !runsG || !eco) return;
      const calc = () => { eco.value = calcEconomy(Number(runsG.value), Number(overs.value)); };
      overs.addEventListener('input', calc);
      runsG.addEventListener('input', calc);
    });
  }

  function collectBattingRows() {
    const rows = [];
    document.querySelectorAll('[data-batting-row]').forEach(row => {
      const name = row.querySelector('.bat-name')?.value?.trim();
      if (!name) return;
      rows.push({
        name,
        innings: row.querySelector('.bat-innings')?.value || '1',
        runs: Number(row.querySelector('.bat-runs')?.value) || 0,
        balls: Number(row.querySelector('.bat-balls')?.value) || 0,
        fours: Number(row.querySelector('.bat-fours')?.value) || 0,
        sixes: Number(row.querySelector('.bat-sixes')?.value) || 0,
      });
    });
    return rows;
  }

  function collectBowlingRows() {
    const rows = [];
    document.querySelectorAll('[data-bowling-row]').forEach(row => {
      const name = row.querySelector('.bowl-name')?.value?.trim();
      if (!name) return;
      rows.push({
        name,
        innings: row.querySelector('.bowl-innings')?.value || '1',
        overs: Number(row.querySelector('.bowl-overs')?.value) || 0,
        maidens: Number(row.querySelector('.bowl-maidens')?.value) || 0,
        runsGiven: Number(row.querySelector('.bowl-runs')?.value) || 0,
      });
    });
    return rows;
  }

  // ═══════════════════════════════════════════
  // TAB 2: STARS / AWARDS
  // ═══════════════════════════════════════════
  function renderStars(container) {
    const awards = store.getAwards(seasonId);
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title section-title-green">Season Cap & Achievement Honors</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="modifyStarsBtn">${icon('edit', 16)} Modify Star Metrics</button>` : ''}
      </div>

      <div class="awards-grid">
        ${AWARD_TYPES.map(a => {
          const name = awards[a.key + '_name'] || awards[a.key] || '-';
          const val = awards[a.key + '_value'] || '';
          return `
            <div class="card-award card-award-${a.color}">
              <div class="award-card-title text-${a.color}">${a.label}</div>
              <div class="award-card-player" style="font-family: var(--font-heading); font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); margin-top: 4px;">
                ${escapeHtml(name)}
              </div>
              ${val ? `
                <div class="award-card-metric" style="font-size: var(--fs-xs); font-weight: var(--fw-bold); color: var(--accent-yellow); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${escapeHtml(val)}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <div class="awards-bottom-row">
        ${AWARD_BOTTOM.map(a => {
          const name = awards[a.key + '_name'] || awards[a.key] || '-';
          const val = awards[a.key + '_value'] || '';
          return `
            <div class="award-bottom-card">
              <div class="award-bottom-label">${a.label}</div>
              <div class="award-bottom-player" style="font-family: var(--font-heading); font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); margin-top: 4px;">
                ${escapeHtml(name)}
              </div>
              ${val ? `
                <div class="award-bottom-metric" style="font-size: var(--fs-xs); font-weight: var(--fw-bold); color: var(--accent-green); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${escapeHtml(val)}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('modifyStarsBtn')?.addEventListener('click', () => showStarsModal(awards));
  }

  function showStarsModal(awards) {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:650px; background:var(--bg-modal); border:1px solid rgba(255, 255, 255, 0.15)">
          <div class="modal-title">${icon('star', 24)} Modify Season Award Leaders (Stars Screen)</div>
          <button class="modal-close" id="closeStarsModal">${icon('close')}</button>
          <form id="starsForm">
            
            <div style="display:flex; flex-direction:column; gap:var(--sp-4);">
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-md); color:var(--accent-yellow); border-bottom:1px solid var(--bg-card-border); padding-bottom:6px;">Main Honors & Caps</h3>
              <div class="grid-2" style="gap:var(--sp-4);">
                ${AWARD_TYPES.map(a => `
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    <div class="form-label text-${a.color}" style="font-weight:var(--fw-bold); text-transform:uppercase;">${a.label}</div>
                    <div class="form-row form-row-2">
                      <input type="text" class="form-input form-input-sm" id="award_${a.key}_name" placeholder="Winner Name" value="${escapeHtml(awards[a.key + '_name'] || awards[a.key] || '')}" />
                      <input type="text" class="form-input form-input-sm" id="award_${a.key}_value" placeholder="Value (e.g. 500 runs)" value="${escapeHtml(awards[a.key + '_value'] || '')}" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="margin-top:var(--sp-6); display:flex; flex-direction:column; gap:var(--sp-4);">
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-md); color:var(--accent-green); border-bottom:1px solid var(--bg-card-border); padding-bottom:6px;">Other Achievers</h3>
              <div class="grid-2" style="gap:var(--sp-4);">
                ${AWARD_BOTTOM.map(a => `
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    <div class="form-label" style="font-weight:var(--fw-bold); text-transform:uppercase; color:var(--text-secondary);">${a.label}</div>
                    <div class="form-row form-row-2">
                       <input type="text" class="form-input form-input-sm" id="award_${a.key}_name" placeholder="Player Name" value="${escapeHtml(awards[a.key + '_name'] || awards[a.key] || '')}" />
                       <input type="text" class="form-input form-input-sm" id="award_${a.key}_value" placeholder="Count (e.g. 15 sixes)" value="${escapeHtml(awards[a.key + '_value'] || '')}" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelStars">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Honors</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.getElementById('closeStarsModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelStars').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('starsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {};
      [...AWARD_TYPES, ...AWARD_BOTTOM].forEach(a => {
        const name = document.getElementById(`award_${a.key}_name`).value.trim();
        const val = document.getElementById(`award_${a.key}_value`).value.trim();
        data[a.key + '_name'] = name;
        data[a.key + '_value'] = val;
        // Keep the old key for backward compatibility
        data[a.key] = name;
      });
      store.saveAwards(seasonId, data);
      modalRoot.innerHTML = '';
      showToast('Awards updated!', 'success');
      renderStars(document.getElementById('tabContent'));
    });
  }

  // ═══════════════════════════════════════════
  // TAB 3: POINTS TABLE
  // ═══════════════════════════════════════════
  function renderPointsTable(container) {
    const points = store.getPoints(seasonId);
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Points Table</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="addPointsBtn">${icon('add', 16)} Add Row Entry</button>` : ''}
      </div>

      <div class="points-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Matches Played</th>
              <th>Win</th>
              <th>Lose</th>
              <th>Draw</th>
              <th style="color:var(--accent-green)">NRR</th>
              <th style="color:var(--accent-yellow)">Points</th>
              ${isAdmin ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${points.length === 0
              ? `<tr><td colspan="${isAdmin ? 8 : 7}" style="text-align:center;color:var(--text-muted);padding:var(--sp-8)">No entries yet</td></tr>`
              : points.map(p => `
                <tr>
                  <td class="text-bold">${escapeHtml(p.teamName)}</td>
                  <td>${p.matchesPlayed}</td>
                  <td class="col-green">${p.wins}</td>
                  <td class="col-red">${p.losses}</td>
                  <td>${p.draws}</td>
                  <td class="${parseFloat(p.nrr) >= 0 ? 'col-green' : 'col-red'}">${p.nrr}</td>
                  <td class="col-yellow">${p.points}</td>
                  ${isAdmin ? `<td><button class="btn btn-ghost btn-sm delete-pts-btn" data-id="${p.id}">${icon('delete', 14)}</button></td>` : ''}
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    `;


    document.getElementById('addPointsBtn')?.addEventListener('click', () => showPointsModal());
    document.querySelectorAll('.delete-pts-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Delete Entry', 'Are you sure you want to delete this points entry row?', () => {
          store.deletePointsEntry(btn.dataset.id);
          showToast('Entry deleted', 'success');
          renderPointsTable(container);
        });
      });
    });
  }

  function showPointsModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:500px">
          <div class="modal-title">Append Team Points Row Configuration</div>
          <button class="modal-close" id="closePointsModal">${icon('close')}</button>
          <form id="pointsForm">
            <div class="form-group">
              <label class="form-label">team name</label>
              <input type="text" class="form-input" id="ptTeam" required />
            </div>
            <div class="form-row form-row-4" style="margin-top:var(--sp-3)">
              <div class="form-group"><label class="form-label">matches played</label><input type="number" class="form-input" id="ptMatches" value="0" min="0" /></div>
              <div class="form-group"><label class="form-label">win</label><input type="number" class="form-input" id="ptWins" value="0" min="0" /></div>
              <div class="form-group"><label class="form-label">lose</label><input type="number" class="form-input" id="ptLosses" value="0" min="0" /></div>
              <div class="form-group"><label class="form-label">draw</label><input type="number" class="form-input" id="ptDraws" value="0" min="0" /></div>
            </div>
            <div class="form-row form-row-2" style="margin-top:var(--sp-3)">
              <div class="form-group"><label class="form-label">NRR</label><input type="text" class="form-input" id="ptNRR" value="+0.00" /></div>
              <div class="form-group"><label class="form-label">points</label><input type="number" class="form-input" id="ptPoints" value="0" readonly /></div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelPoints">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Entry</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Auto-calculate points
    const winsInput = document.getElementById('ptWins');
    const drawsInput = document.getElementById('ptDraws');
    const pointsInput = document.getElementById('ptPoints');
    const autoCalc = () => {
      pointsInput.value = calcPoints(Number(winsInput.value) || 0, Number(drawsInput.value) || 0);
    };
    winsInput.addEventListener('input', autoCalc);
    drawsInput.addEventListener('input', autoCalc);

    document.getElementById('closePointsModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelPoints').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('pointsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      store.addPointsEntry({
        seasonId,
        teamName: document.getElementById('ptTeam').value.trim(),
        matchesPlayed: Number(document.getElementById('ptMatches').value) || 0,
        wins: Number(document.getElementById('ptWins').value) || 0,
        losses: Number(document.getElementById('ptLosses').value) || 0,
        draws: Number(document.getElementById('ptDraws').value) || 0,
        nrr: document.getElementById('ptNRR').value.trim(),
      });
      modalRoot.innerHTML = '';
      showToast('Points entry added!', 'success');
      renderPointsTable(document.getElementById('tabContent'));
    });
  }

  // ═══════════════════════════════════════════
  // TAB 4: SCHEDULE
  // ═══════════════════════════════════════════
  function renderSchedule(container) {
    const schedule = store.getSchedule(seasonId);
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Schedule Timeline</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="addScheduleBtn">${icon('add', 16)} Add Schedule Item</button>` : ''}
      </div>

      <div class="schedule-grid">
        ${schedule.length === 0
          ? '<div class="empty-state" style="grid-column:1/-1"><span class="material-symbols-rounded">calendar_month</span><p>No schedule entries yet.</p></div>'
          : schedule.map(s => `
            <div class="fixture-card">
              <div>
                <div class="fixture-label">Match Fixture</div>
                <div class="fixture-teams">${escapeHtml(s.teams)}</div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <span class="badge badge-venue">📍 Venue: ${escapeHtml(s.venue)}</span>
                ${isAdmin ? `<button class="btn btn-ghost btn-sm delete-sched-btn" data-id="${s.id}">${icon('delete', 14)}</button>` : ''}
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    document.getElementById('addScheduleBtn')?.addEventListener('click', () => showScheduleModal());
    document.querySelectorAll('.delete-sched-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Delete Schedule Entry', 'Are you sure you want to delete this schedule entry?', () => {
          store.deleteScheduleEntry(btn.dataset.id);
          showToast('Schedule entry deleted', 'success');
          renderSchedule(container);
        });
      });
    });
  }

  function showScheduleModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:480px">
          <div class="modal-title">Create Season Match Schedule Entry</div>
          <button class="modal-close" id="closeSchedModal">${icon('close')}</button>
          <form id="schedForm">
            <div class="form-group">
              <label class="form-label">team name vs another team name</label>
              <input type="text" class="form-input" id="schedTeams" placeholder="e.g., Warriors vs Titans" required />
            </div>
            <div class="form-group" style="margin-top:var(--sp-3)">
              <label class="form-label">venue</label>
              <input type="text" class="form-input" id="schedVenue" placeholder="e.g., Eden Gardens Stadium" required />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelSched">Cancel</button>
              <button type="submit" class="btn btn-primary">Add to List</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.getElementById('closeSchedModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelSched').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('schedForm').addEventListener('submit', (e) => {
      e.preventDefault();
      store.addScheduleEntry({
        seasonId,
        teams: document.getElementById('schedTeams').value.trim(),
        venue: document.getElementById('schedVenue').value.trim(),
      });
      modalRoot.innerHTML = '';
      showToast('Schedule entry added!', 'success');
      renderSchedule(document.getElementById('tabContent'));
    });
  }

  // ═══════════════════════════════════════════
  // TAB 5: TEAM MEMBERS
  // ═══════════════════════════════════════════
  function renderTeamMembers(container) {
    const players = store.getPlayers(seasonId);
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Team Members Details Roster</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="addMemberBtn">${icon('person_add', 16)} Add Member Row</button>` : ''}
      </div>

      <div class="grid-2">
        ${players.length === 0
          ? '<div class="empty-state" style="grid-column:1/-1"><span class="material-symbols-rounded">groups</span><p>No team members added yet.</p></div>'
          : players.map(p => `
            <div class="member-card">
              <div>
                <div class="member-name">${escapeHtml(p.name)}</div>
                <div class="member-team">Club Affiliation: <span>${escapeHtml(p.teamName)}</span></div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--sp-2)">
                <span class="badge badge-age">Age: ${p.age}</span>
                ${isAdmin ? `<button class="btn btn-ghost btn-sm delete-player-btn" data-id="${p.id}">${icon('delete', 14)}</button>` : ''}
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    document.getElementById('addMemberBtn')?.addEventListener('click', () => showMemberModal());
    document.querySelectorAll('.delete-player-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Remove Team Member', 'Are you sure you want to remove this team member?', () => {
          store.deletePlayer(btn.dataset.id);
          showToast('Member removed', 'success');
          renderTeamMembers(container);
        });
      });
    });
  }

  function showMemberModal() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:420px">
          <div class="modal-title">${icon('person_add', 24)} Add Team Member</div>
          <button class="modal-close" id="closeMemberModal">${icon('close')}</button>
          <form id="memberForm">
            <div class="form-group">
              <label class="form-label">Player Name</label>
              <input type="text" class="form-input" id="memName" required />
            </div>
            <div class="form-group" style="margin-top:var(--sp-3)">
              <label class="form-label">Team / Club Affiliation</label>
              <input type="text" class="form-input" id="memTeam" required />
            </div>
            <div class="form-row form-row-2" style="margin-top:var(--sp-3)">
              <div class="form-group">
                <label class="form-label">Age</label>
                <input type="number" class="form-input" id="memAge" min="10" max="60" required />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-input" id="memRole">
                  ${PLAYER_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelMember">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Member</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.getElementById('closeMemberModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelMember').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('memberForm').addEventListener('submit', (e) => {
      e.preventDefault();
      store.addPlayer({
        seasonId,
        name: document.getElementById('memName').value.trim(),
        teamName: document.getElementById('memTeam').value.trim(),
        age: Number(document.getElementById('memAge').value),
        role: document.getElementById('memRole').value,
      });
      modalRoot.innerHTML = '';
      showToast('Team member added!', 'success');
      renderTeamMembers(document.getElementById('tabContent'));
    });
  }

  // ═══════════════════════════════════════════
  // TAB 6: GROUP MEETINGS
  // ═══════════════════════════════════════════
  function renderGroupMeetings(container) {
    if (activeMeetingId) {
      renderChatRoom(container);
    } else {
      renderMeetingList(container);
    }
  }

  function renderMeetingList(container) {
    const meetings = store.getGroupMeetings(seasonId);
    const currentUser = store.getCurrentUser();

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Group Meetings & Discussions</span>
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="createMeetingBtn">${icon('add_circle', 16)} Schedule Meeting</button>` : ''}
      </div>

      <div class="meetings-grid grid-2" style="gap:var(--sp-4);">
        ${meetings.length === 0
          ? '<div class="empty-state" style="grid-column:1/-1"><span class="material-symbols-rounded">forum</span><p>No meetings scheduled yet. Only administrators can add meeting options.</p></div>'
          : meetings.map(m => {
              const isInvited = m.invitedUsers.includes(currentUser.username) || m.creator === currentUser.username;
              const dateStr = new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
              return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; gap:var(--sp-3); border:1px solid ${isInvited ? 'rgba(0, 230, 118, 0.25)' : 'var(--bg-card-border)'};">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:var(--sp-2);">
                      <h4 style="font-family:var(--font-heading); font-size:var(--fs-md); font-weight:var(--fw-bold);">${escapeHtml(m.title)}</h4>
                      <span class="badge" style="background:${isInvited ? 'var(--accent-green-dim)' : 'rgba(255,255,255,0.05)'}; color:${isInvited ? 'var(--accent-green)' : 'var(--text-muted)'}; font-size:9px;">
                        ${isInvited ? 'Invited' : 'Public'}
                      </span>
                    </div>
                    <div style="font-size:var(--fs-xs); color:var(--accent-yellow); margin-top:2px;">🕒 ${dateStr}</div>
                    <p style="font-size:var(--fs-sm); color:var(--text-secondary); margin-top:var(--sp-2); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                      ${escapeHtml(m.description || 'No description provided.')}
                    </p>
                    <div style="font-size:10px; color:var(--text-muted); margin-top:var(--sp-2);">
                      ${icon('group', 12)} ${m.invitedUsers.length} members invited
                    </div>
                  </div>

                  <div style="display:flex; gap:var(--sp-2); margin-top:var(--sp-2);">
                    <button class="btn btn-primary btn-sm join-room-btn" data-id="${m.id}" style="flex:1;">
                      ${icon('chat', 14)} Join Chat Room
                    </button>
                    <button class="btn btn-outline btn-sm invite-friends-btn" data-id="${m.id}" title="Invite Friends">
                      ${icon('person_add', 14)}
                    </button>
                    ${isAdmin ? `
                      <button class="btn btn-ghost btn-sm delete-meeting-btn" data-id="${m.id}" title="Delete Meeting" style="color:var(--accent-red)">
                        ${icon('delete', 14)}
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>
    `;

    document.getElementById('createMeetingBtn')?.addEventListener('click', () => showMeetingModal(container));

    document.querySelectorAll('.join-room-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        joinChatRoom(btn.dataset.id, container);
      });
    });

    document.querySelectorAll('.invite-friends-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showInviteModal(btn.dataset.id);
      });
    });

    document.querySelectorAll('.delete-meeting-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirm('Delete Meeting Room', 'Are you sure you want to delete this meeting room and all its chat history?', () => {
          store.deleteGroupMeeting(btn.dataset.id);
          showToast('Meeting deleted', 'success');
          renderMeetingList(container);
        });
      });
    });
  }

  function showMeetingModal(container) {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width:460px">
          <div class="modal-title">${icon('forum', 24)} Schedule Group Meeting</div>
          <button class="modal-close" id="closeMeetModal">${icon('close')}</button>
          <form id="meetForm">
            <div class="form-group">
              <label class="form-label">Meeting Title / Topic</label>
              <input type="text" class="form-input" id="meetTitle" placeholder="e.g. Pre-Match Strategy Discuss" required />
            </div>
            <div class="form-group" style="margin-top:var(--sp-3)">
              <label class="form-label">Meeting Date & Time</label>
              <input type="datetime-local" class="form-input" id="meetDate" required />
            </div>
            <div class="form-group" style="margin-top:var(--sp-3)">
              <label class="form-label">Description</label>
              <textarea class="form-input" id="meetDesc" placeholder="Describe the focus of this group session..." required></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="cancelMeet">Cancel</button>
              <button type="submit" class="btn btn-primary">Schedule Room</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.getElementById('meetDate').value = now.toISOString().slice(0, 16);

    document.getElementById('closeMeetModal').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('cancelMeet').addEventListener('click', () => modalRoot.innerHTML = '');
    document.getElementById('meetForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = store.getCurrentUser();
      store.addGroupMeeting({
        seasonId,
        title: document.getElementById('meetTitle').value.trim(),
        date: document.getElementById('meetDate').value,
        description: document.getElementById('meetDesc').value.trim(),
        creator: currentUser.username,
        invitedUsers: [currentUser.username]
      });
      modalRoot.innerHTML = '';
      showToast('Meeting scheduled!', 'success');
      renderMeetingList(container);
    });
  }

  function showMatchInviteModal(matchId) {
    const modalRoot = document.getElementById('modal-root');
    const matches = store.getMatches(seasonId);
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const allUsers = store.getUsers();
    const currentUser = store.getCurrentUser();
    const inviteableUsers = allUsers.filter(u => u.username !== currentUser.username);

    const shareUrl = `${window.location.origin}/?inviteType=match&inviteId=${encodeURIComponent(matchId)}`;
    const shareText = `Hey! Join/follow this cricket match: "${match.team1} vs ${match.team2}" on our seasons framework. Check it out here: ${shareUrl}`;

    function renderModalContent() {
      const currentMatch = store.getMatches(seasonId).find(m => m.id === matchId);
      const invitedSet = new Set(currentMatch?.invitedUsers || []);

      modalRoot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width:440px; max-height:85vh; overflow-y:auto; padding:var(--sp-5);">
            <div class="modal-title" style="margin-bottom:var(--sp-2);">${icon('sports_cricket', 24)} Invite Players to Match</div>
            <button class="modal-close" id="closeMatchInviteModal">${icon('close')}</button>
            
            <p style="color:var(--text-muted); font-size:var(--fs-sm); margin-bottom:var(--sp-4);">
              Invite other players to the match: <strong>${escapeHtml(match.team1)} vs ${escapeHtml(match.team2)}</strong>.
            </p>

            <h4 style="font-family:var(--font-heading); font-weight:var(--fw-bold); font-size:var(--fs-sm); margin-bottom:var(--sp-2); color:var(--text-primary);">Invite App Users</h4>
            <div style="border-top:1px solid var(--bg-card-border); padding-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2); max-height:220px; overflow-y:auto; padding-right:4px; margin-bottom:var(--sp-4);">
              ${inviteableUsers.length === 0
                ? '<div style="color:var(--text-muted); text-align:center; font-size:var(--fs-sm); padding:var(--sp-4)">No other players found.</div>'
                : inviteableUsers.map(u => {
                    const isAlreadyInvited = invitedSet.has(u.username);
                    return `
                      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid var(--bg-card-border); padding:var(--sp-2) var(--sp-3); border-radius:var(--radius-md);">
                        <div>
                          <div style="font-weight:var(--fw-bold); font-size:var(--fs-sm);">${escapeHtml(u.fullName)}</div>
                          <div style="font-size:10px; color:var(--text-muted);">@${escapeHtml(u.username)}</div>
                        </div>
                        <button class="btn btn-sm ${isAlreadyInvited ? 'btn-outline' : 'btn-success'} invite-match-user-action-btn" data-username="${u.username}" ${isAlreadyInvited ? 'disabled' : ''}>
                          ${isAlreadyInvited ? 'Invited' : 'Invite'}
                        </button>
                      </div>
                    `;
                  }).join('')
              }
            </div>

            <!-- Share outer options requested by user -->
            <div style="border-top:1px solid var(--bg-card-border); padding-top:var(--sp-4);">
              <h4 style="font-family:var(--font-heading); font-weight:var(--fw-bold); font-size:var(--fs-sm); margin-bottom:var(--sp-2); color:var(--text-primary);">Share with Friends Outside App</h4>
              
              <div style="background:var(--bg-secondary, #151f21); border:1px solid var(--bg-card-border); border-radius:var(--radius-md); padding:var(--sp-2) var(--sp-3); display:flex; gap:var(--sp-2); align-items:center; margin-bottom:var(--sp-3);">
                <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-mono); font-size:var(--fs-xs); color:var(--text-primary); text-align:left;">
                  ${escapeHtml(shareUrl)}
                </div>
                <button class="btn btn-primary btn-sm" id="copyMatchShareBtn" style="flex-shrink:0;">
                  ${icon('content_copy', 12)} Copy
                </button>
              </div>

              <div style="display:flex; flex-direction:column; gap:var(--sp-2);">
                <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}" target="_blank" class="btn btn-outline btn-sm animate-button" style="display:flex; align-items:center; justify-content:center; gap:var(--sp-2); border-color:#25d366; color:#25d366; background:rgba(37,211,102,0.05); text-decoration:none;">
                  <span class="material-symbols-rounded" style="font-size:16px;">chat</span> Share on WhatsApp
                </a>
                <a href="mailto:?subject=${encodeURIComponent('Cricket Match Invitation Code')}&body=${encodeURIComponent(shareText)}" class="btn btn-outline btn-sm" style="display:flex; align-items:center; justify-content:center; gap:var(--sp-2); text-decoration:none; color:var(--text-primary);">
                  ${icon('mail', 16)} Email Invite Link
                </a>
              </div>
            </div>

          </div>
        </div>
      `;

      document.getElementById('closeMatchInviteModal').addEventListener('click', () => modalRoot.innerHTML = '');

      const copyBtn = document.getElementById('copyMatchShareBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(shareText).then(() => {
            showToast('Invite details copied!', 'success');
          }).catch(() => {
            showToast('Failed to copy. Please copy link manually.', 'warning');
          });
        });
      }

      document.querySelectorAll('.invite-match-user-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const username = btn.dataset.username;
          
          // Update match invited users list
          const matches = store.getMatches(seasonId);
          const idx = matches.findIndex(m => m.id === matchId);
          if (idx !== -1) {
            matches[idx].invitedUsers = matches[idx].invitedUsers || [];
            if (!matches[idx].invitedUsers.includes(username)) {
              matches[idx].invitedUsers.push(username);
              store._set('lca_matches', matches);
              store.pushToFirebase('matches', matchId, matches[idx]);
            }
          }

          // Create notification
          store.addNotification({
            type: 'match_invitation',
            title: 'Match Invitation',
            message: `@${currentUser.username} invited you to check out or participate in the match: ${match.team1} vs ${match.team2}`,
            recipient: username,
            createdBy: currentUser.username,
            targetId: matchId,
            seasonId: seasonId
          });

          showToast(`Invited @${username}`, 'success');
          renderModalContent();
        });
      });
    }

    renderModalContent();
  }

  function showInviteModal(meetingId) {
    const modalRoot = document.getElementById('modal-root');
    const meetings = store.getGroupMeetings(seasonId);
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const allUsers = store.getUsers();
    const currentUser = store.getCurrentUser();
    const inviteableUsers = allUsers.filter(u => u.username !== currentUser.username);

    function renderModalContent() {
      const currentMeeting = store.getGroupMeetings(seasonId).find(m => m.id === meetingId);
      const invitedSet = new Set(currentMeeting.invitedUsers);

      modalRoot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width:440px; max-height:80vh;">
            <div class="modal-title">${icon('person_add', 24)} Invite Friends / Players</div>
            <button class="modal-close" id="closeInviteModal">${icon('close')}</button>
            
            <p style="color:var(--text-muted); font-size:var(--fs-sm); margin-bottom:var(--sp-4);">
              Invite other players to the <strong>${escapeHtml(meeting.title)}</strong> discussion room.
            </p>

            <div style="margin-bottom:var(--sp-4);">
              <button class="btn btn-outline btn-sm" id="copyShareLinkBtn" style="width:100%; gap:6px;">
                ${icon('content_copy', 14)} Copy Invite Link to Clipboard
              </button>
            </div>

            <div style="border-top:1px solid var(--bg-card-border); padding-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2); max-height:300px; overflow-y:auto; padding-right:4px;">
              ${inviteableUsers.length === 0
                ? '<div style="color:var(--text-muted); text-align:center; font-size:var(--fs-sm); padding:var(--sp-4)">No other players found.</div>'
                : inviteableUsers.map(u => {
                    const isAlreadyInvited = invitedSet.has(u.username);
                    return `
                      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid var(--bg-card-border); padding:var(--sp-2) var(--sp-3); border-radius:var(--radius-md);">
                        <div>
                          <div style="font-weight:var(--fw-bold); font-size:var(--fs-sm);">${escapeHtml(u.fullName)}</div>
                          <div style="font-size:10px; color:var(--text-muted);">@${escapeHtml(u.username)}</div>
                        </div>
                        <button class="btn btn-sm ${isAlreadyInvited ? 'btn-outline' : 'btn-success'} invite-user-action-btn" data-username="${u.username}" ${isAlreadyInvited ? 'disabled' : ''}>
                          ${isAlreadyInvited ? 'Invited' : 'Invite'}
                        </button>
                      </div>
                    `;
                  }).join('')
              }
            </div>
          </div>
        </div>
      `;

      document.getElementById('closeInviteModal').addEventListener('click', () => modalRoot.innerHTML = '');

      document.getElementById('copyShareLinkBtn').addEventListener('click', () => {
        const inviteUrl = `${window.location.origin}${window.location.pathname}#workspace?seasonId=${seasonId}`;
        navigator.clipboard.writeText(inviteUrl).then(() => {
          showToast('Join URL copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy link.', 'error');
        });
      });

      document.querySelectorAll('.invite-user-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const username = btn.dataset.username;
          store.inviteUserToMeeting(meetingId, username);

          // Create notification
          store.addNotification({
            type: 'chat_invitation',
            title: 'Chat Room Invitation',
            message: `@${currentUser.username} invited you to join the group chat: ${meeting.title}`,
            recipient: username,
            createdBy: currentUser.username,
            targetId: meetingId,
            seasonId: seasonId
          });

          showToast(`Invited @${username}`, 'success');
          renderModalContent();
        });
      });
    }

    renderModalContent();
  }

  function joinChatRoom(meetingId, container) {
    activeMeetingId = meetingId;
    renderChatRoom(container);

    chatInterval = setInterval(() => {
      if (store.syncFromFirebase && typeof store.syncFromFirebase === 'function') {
        store.syncFromFirebase().then(() => {
          updateChatMessages();
        });
      } else {
        updateChatMessages();
      }
    }, 2500);
  }

  function leaveChatRoom(container) {
    if (chatInterval) {
      clearInterval(chatInterval);
      chatInterval = null;
    }
    activeMeetingId = null;
    renderMeetingList(container);
  }

  function renderChatRoom(container) {
    const meetings = store.getGroupMeetings(seasonId);
    const meeting = meetings.find(m => m.id === activeMeetingId);
    if (!meeting) {
      leaveChatRoom(container);
      return;
    }

    container.innerHTML = `
      <div class="chat-lobby-container animate-fade-in" style="display:flex; flex-direction:column; height:calc(100vh - 200px); background:var(--bg-card); border:1px solid var(--bg-card-border); border-radius:var(--radius-lg); overflow:hidden;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--sp-4); border-bottom:1px solid var(--bg-card-border); background:rgba(255,255,255,0.02)">
          <div style="display:flex; align-items:center; gap:var(--sp-3)">
            <button class="btn-icon btn-sm" id="chatBackBtn" title="Back to Lobby">${icon('arrow_back', 16)}</button>
            <div>
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-base); font-weight:var(--fw-bold);">${escapeHtml(meeting.title)}</h3>
              <p style="font-size:10px; color:var(--text-muted);">${escapeHtml(meeting.description)}</p>
            </div>
          </div>
          <div style="display:flex; gap:var(--sp-2);">
            <button class="btn btn-outline btn-sm" id="chatInviteBtn">
              ${icon('person_add', 14)} Invite Players
            </button>
          </div>
        </div>

        <!-- Messages Box -->
        <div class="chat-messages-box" id="chatMessages" style="flex:1; padding:var(--sp-4); overflow-y:auto; display:flex; flex-direction:column; gap:var(--sp-3);">
          <!-- Messages will be rendered here -->
        </div>

        <!-- Input Area -->
        <form id="chatForm" style="display:flex; gap:var(--sp-2); padding:var(--sp-3); border-top:1px solid var(--bg-card-border); background:rgba(0,0,0,0.15)">
          <input type="text" id="chatInput" class="form-input form-input-sm" placeholder="Type a message here..." autocomplete="off" required style="flex:1;" />
          <button type="submit" class="btn btn-primary btn-sm" style="padding:0 var(--sp-4); display:flex; align-items:center; gap:6px;">
            ${icon('send', 14)} Send
          </button>
        </form>
      </div>
    `;

    document.getElementById('chatBackBtn').addEventListener('click', () => leaveChatRoom(container));
    document.getElementById('chatInviteBtn').addEventListener('click', () => showInviteModal(activeMeetingId));

    document.getElementById('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      const currentUser = store.getCurrentUser();
      const message = {
        sender: currentUser.fullName,
        username: currentUser.username,
        text,
        timestamp: new Date().toISOString()
      };

      store.addChatMessage(activeMeetingId, message);
      input.value = '';
      updateChatMessages(true);
    });

    updateChatMessages(true);
  }

  function updateChatMessages(shouldScroll = false) {
    const box = document.getElementById('chatMessages');
    if (!box) return;

    const meetings = store.getGroupMeetings(seasonId);
    const meeting = meetings.find(m => m.id === activeMeetingId);
    if (!meeting) return;

    const currentUser = store.getCurrentUser();
    const isAtBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 50;

    const messagesHTML = (meeting.messages || []).map(m => {
      const isMe = m.username === currentUser.username;
      const sentTime = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; width:100%;">
          <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px; margin-left:${isMe ? '0' : '4px'}; margin-right:${isMe ? '4px' : '0'};">
            ${escapeHtml(m.sender)} <span style="font-size:8px; opacity:0.7; margin-left:4px;">${sentTime}</span>
          </div>
          <div style="
            max-width: 75%;
            padding: var(--sp-2) var(--sp-3);
            border-radius: var(--radius-md);
            font-size: var(--fs-sm);
            line-height: 1.4;
            background: ${isMe ? 'var(--accent-green-dim)' : 'var(--bg-tertiary)'};
            color: ${isMe ? 'var(--accent-green)' : 'var(--text-primary)'};
            border: 1px solid ${isMe ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.03)'};
            border-top-right-radius: ${isMe ? '2px' : 'var(--radius-md)'};
            border-top-left-radius: ${isMe ? 'var(--radius-md)' : '2px'};
          ">
            ${escapeHtml(m.text)}
          </div>
        </div>
      `;
    }).join('');

    box.innerHTML = messagesHTML || `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; color:var(--text-muted); text-align:center;">
        <span class="material-symbols-rounded" style="font-size:36px; color:var(--text-disabled)">forum</span>
        <p style="font-size:var(--fs-sm); margin-top:var(--sp-2)">Discussion lobby started. Type a message to begin chatting!</p>
      </div>
    `;

    if (shouldScroll || isAtBottom) {
      box.scrollTop = box.scrollHeight;
    }
  }
  render();
}

function getEmbedUrl(url) {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtube.com/watch')) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } catch (e) {}
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    return url;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('vimeo.com/')) {
    const parts = url.split('vimeo.com/');
    const id = parts[parts.length - 1]?.split('?')[0];
    if (id && !isNaN(parseInt(id, 10))) {
      return `https://player.vimeo.com/video/${id}`;
    }
  }
  return '';
}

function showVideoPlayerModal(match, videoUrl, isBlob = false) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const embedUrl = getEmbedUrl(videoUrl);
  let playerHtml = '';
  if (embedUrl) {
    playerHtml = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
  } else {
    playerHtml = `<video id="playerElement" src="${videoUrl}" controls autoplay style="width:100%; height:100%; object-fit:contain; background:#000;"></video>`;
  }

  modalRoot.innerHTML = `
    <div class="modal-overlay" style="z-index: 9999;">
      <div class="modal-content animate-slide-up" style="max-width:760px; padding:var(--sp-5); border: 1px solid rgba(0, 229, 255, 0.2); background: #120726;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-4)">
          <h3 class="modal-title" style="color:var(--text-primary); font-size:var(--fs-lg); display:flex; align-items:center; gap:var(--sp-2)">
            <span class="material-symbols-rounded" style="color:var(--accent-cyan); font-size: 28px;">smart_display</span>
            <span>Video Review: ${escapeHtml(match.team1)} vs ${escapeHtml(match.team2)}</span>
          </h3>
          <button class="modal-close" id="closeVideoBtn" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center;">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <div style="background:#020105; border-radius:var(--radius-md); border:1px solid rgba(255,255,255,0.05); overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow: 0 10px 40px rgba(0,0,0,0.8); position:relative; aspect-ratio: 16/9;">
          ${playerHtml}
        </div>

        <p style="margin-top:var(--sp-3); font-size:var(--fs-xs); color:var(--text-muted); display:flex; align-items:center; gap:6px;">
          <span class="material-symbols-rounded" style="font-size:16px; color:var(--accent-cyan)">info</span> 
          <span>${isBlob ? 'High-definition playback loaded from sandbox offline repository cache.' : 'Streaming direct video resource link.'} External players may fail to load in restricted browsers; if so, please use the actions below.</span>
        </p>

        <div class="modal-actions" style="margin-top:var(--sp-4); display:flex; gap:var(--sp-2); flex-wrap:wrap;">
          <button type="button" class="btn btn-outline" id="closeVideoBottomBtn">Close Review</button>
          ${isBlob ? `
            <a href="${videoUrl}" download="${(match.videoName || 'match_video.mp4')}" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
              ${icon('download', 16)} Download Clip File
            </a>
          ` : `
            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
              ${icon('open_in_new', 16)} Open Stream Link in New Tab
            </a>
          `}
        </div>
      </div>
    </div>
  `;

  const closeFn = () => {
    const player = document.getElementById('playerElement');
    if (player) {
       player.pause();
       player.src = "";
    }
    if (isBlob) {
      URL.revokeObjectURL(videoUrl);
    }
    modalRoot.innerHTML = '';
  };

  document.getElementById('closeVideoBtn').addEventListener('click', closeFn);
  document.getElementById('closeVideoBottomBtn').addEventListener('click', closeFn);
}

