// ============================================
// HELPER FUNCTIONS
// ============================================

/** Generate a unique ID */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/** Calculate batting strike rate */
export function calcStrikeRate(runs, balls) {
  if (!balls || balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
}

/** Calculate bowling economy */
export function calcEconomy(runsGiven, overs) {
  if (!overs || overs === 0) return '0.00';
  return (runsGiven / overs).toFixed(2);
}

/** Calculate NRR */
export function calcNRR(runsScored, oversFaced, runsConceded, oversBowled) {
  if (!oversFaced || !oversBowled) return '+0.00';
  const nrr = (runsScored / oversFaced) - (runsConceded / oversBowled);
  return (nrr >= 0 ? '+' : '') + nrr.toFixed(2);
}

/** Calculate points from wins/draws */
export function calcPoints(wins, draws) {
  return (wins * 2) + (draws * 1);
}

/** Format date */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Sanitize HTML to prevent XSS */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Debounce function */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Check password strength */
export function getPasswordStrength(password) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  let label = 'Weak', level = 'weak';
  if (score >= 4) { label = 'Strong'; level = 'strong'; }
  else if (score >= 3) { label = 'Medium'; level = 'medium'; }
  return { score, checks, label, level };
}

/** Create Material Symbol icon */
export function icon(name, size = 20) {
  return `<span class="material-symbols-rounded" style="font-size:${size}px">${name}</span>`;
}

/** Show toast notification */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-root');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="material-symbols-rounded" style="font-size:20px;color:var(--accent-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'cyan'})">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/** Setup Notifications system */
export function setupNotifications(currentUser, navigate, store) {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const container = document.getElementById('notificationListContainer');
  if (!notificationBtn || !notificationDropdown || !container || !currentUser) return;

  function renderList() {
    const notifications = store.getNotifications();
    const myNotifications = notifications
      .filter(n => n.recipient === currentUser.username || n.recipient === 'all')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const unread = myNotifications.filter(n => !n.read);
    
    // Update badge in UI
    const badgeEl = notificationBtn.querySelector('.notification-badge');
    if (unread.length > 0) {
      if (badgeEl) {
        badgeEl.textContent = unread.length;
      } else {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = unread.length;
        notificationBtn.appendChild(badge);
      }
    } else {
      badgeEl?.remove();
    }

    // Render list HTML
    if (myNotifications.length === 0) {
      container.innerHTML = `
        <div style="padding:var(--sp-4); text-align:center; color:var(--text-muted); font-size:var(--fs-xs);">
          No notifications yet
        </div>
      `;
      return;
    }

    container.innerHTML = myNotifications.map(n => {
      const isUnread = !n.read;
      const dateStr = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const itemIcon = n.type === 'match_invitation' ? 'sports_cricket' : 'forum';
      const iconColor = n.type === 'match_invitation' ? 'var(--accent-green)' : 'var(--accent-purple)';
      
      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${n.id}">
          <div class="notification-item-title">
            <span class="material-symbols-rounded" style="font-size:16px; color:${iconColor}">${itemIcon}</span>
            <span>${escapeHtml(n.title)}</span>
          </div>
          <div class="notification-item-text">${escapeHtml(n.message)}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <span class="notification-item-time">${dateStr}</span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-ghost btn-xs delete-notif-btn" data-id="${n.id}" style="padding:2px; min-width:auto; height:auto; color:var(--text-muted);" title="Delete" onclick="event.stopPropagation();">
                <span class="material-symbols-rounded" style="font-size:14px;">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click triggers to notification items
    container.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const notif = myNotifications.find(n => n.id === id);
        if (notif) {
          store.markNotificationAsRead(id);
          
          // Closing dropdown
          notificationDropdown.classList.add('hidden');
          
          // Redirecting or navigating based on type
          if (notif.type === 'chat_invitation') {
            navigate('workspace', { seasonId: notif.seasonId, initialTab: 'group-meetings', meetingId: notif.targetId });
          } else if (notif.type === 'match_invitation') {
            navigate('workspace', { seasonId: notif.seasonId, initialTab: 'match-details' });
          }
        }
      });
    });

    // Attach delete triggers
    container.querySelectorAll('.delete-notif-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        store.deleteNotification(id);
        renderList();
      });
    });

    // Make mark all read btn functional or remove it if no unread
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
      if (unread.length > 0) {
        markAllBtn.style.display = 'block';
        markAllBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          store.markAllNotificationsAsRead(currentUser.username);
          renderList();
        });
      } else {
        markAllBtn.style.display = 'none';
      }
    }
  }

  // Toggle dropdown logic
  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close other dropdowns
    document.getElementById('userDropdown')?.classList.add('hidden');
    
    const isHidden = notificationDropdown.classList.toggle('hidden');
    if (!isHidden) {
      if (store.syncFromFirebase) {
        store.syncFromFirebase().then(() => {
          renderList();
        });
      } else {
        renderList();
      }
    }
  });

  // Render on initial load
  renderList();
}

/** Show a custom/iframe-safe confirmation dialog */
export function showConfirm(title, message, onConfirm) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    if (window.confirm(message)) {
      onConfirm();
    }
    return;
  }

  modalRoot.innerHTML = `
    <div class="modal-overlay" style="z-index: 9999;">
      <div class="modal-content animate-slide-up" style="max-width:380px;">
        <div class="modal-title" style="display:flex; align-items:center; gap:8px; color:var(--accent-green, #D4F754);">
          ${icon('warning', 24)}
          <span>${escapeHtml(title)}</span>
        </div>
        <div style="margin: var(--sp-3) 0 var(--sp-4); font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.5;">
          ${escapeHtml(message)}
        </div>
        <div class="modal-actions" style="margin-top: 0;">
          <button type="button" class="btn btn-outline" id="confirmCancelBtn">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmOkBtn" style="gap:var(--sp-1);">
            ${icon('delete', 16)} Delete
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });

  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    modalRoot.innerHTML = '';
    onConfirm();
  });
}

/** Utility to generate and download a CSV file */
export function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

class VideoStore {
  constructor() {
    this.dbName = 'LcaVideosDB';
    this.storeName = 'videos';
    this.db = null;
  }

  async getDB() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        reject(e.target.error);
      };
    });
  }

  async saveVideo(matchId, file) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(file, matchId);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getVideo(matchId) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(matchId);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteVideo(matchId) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(matchId);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

export const videoStore = new VideoStore();



