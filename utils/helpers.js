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
