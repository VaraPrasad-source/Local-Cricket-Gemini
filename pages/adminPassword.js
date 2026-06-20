// ============================================
// CUSTOM ADMIN PASSWORD PAGE (FOR GOOGLE AUTHORS)
// ============================================
import { store } from '../store.js';
import { showToast, icon } from '../utils/helpers.js';

export function renderAdminPasswordSetup(app, navigate) {
  const user = store.getCurrentUser();
  if (!user) {
    navigate('select-role');
    return;
  }

  // Check if user already has a custom password set
  const hasPasswordSet = user.password && user.password.trim().length > 0;

  app.innerHTML = `
    <div class="login-page animate-fade-in">
      <div class="login-card" style="max-width: 440px;">
        <div class="login-logo">
          <span class="material-symbols-rounded icon" style="color:var(--accent-purple); text-shadow:0 0 15px var(--accent-purple-dim)">
            lock_person
          </span>
          <h1>Admin Lock</h1>
          <p>Tournament Manager Security Level</p>
          <div style="margin-top:10px">
            <span class="badge" style="background:var(--accent-purple); color:var(--bg-primary);">Google Admin Verification</span>
          </div>
        </div>

        <div style="margin-bottom: var(--sp-5); text-align: center; font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.5;">
          ${hasPasswordSet 
            ? `Welcome <strong>${user.fullName}</strong>. Please verify your custom administrator password to unlock the Tournament Hub console.` 
            : `Welcome <strong>${user.fullName}</strong>. This is your first Google Sign-In as a Tournament Administrator. Please establish a custom administrator password to secure this portal.`
          }
        </div>

        <form id="adminPwdForm" class="login-form" autocomplete="off">
          ${!hasPasswordSet ? `
            <div class="form-group">
              <label class="form-label" for="newAdminPwd">Create Admin Password</label>
              <div class="input-password-wrap">
                <input type="password" id="newAdminPwd" class="form-input" placeholder="Create new admin password" required minlength="4" />
                <button type="button" class="input-password-toggle" id="toggleNewPwd">
                  <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmAdminPwd">Confirm Admin Password</label>
              <div class="input-password-wrap">
                <input type="password" id="confirmAdminPwd" class="form-input" placeholder="Confirm your password" required minlength="4" />
                <button type="button" class="input-password-toggle" id="toggleConfirmPwd">
                  <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="form-group">
              <label class="form-label" for="verifyAdminPwd">Enter Admin Password</label>
              <div class="input-password-wrap">
                <input type="password" id="verifyAdminPwd" class="form-input" placeholder="Enter custom admin password" required />
                <button type="button" class="input-password-toggle" id="toggleVerifyPwd">
                  <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                </button>
              </div>
            </div>
          `}

          <div class="login-actions" style="margin-top: var(--sp-4);">
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%; justify-content:center; gap:var(--sp-2); background: var(--accent-purple); border-color: var(--accent-purple);">
              ${icon(hasPasswordSet ? 'lock_open' : 'how_to_reg', 18)} ${hasPasswordSet ? 'UNLOCK DASHBOARD' : 'REGISTER & UNLOCK'}
            </button>
          </div>
        </form>

        <div class="login-footer" style="margin-top: var(--sp-4);">
          <button class="btn btn-ghost btn-sm" id="cancelVerifyBtn" style="color: var(--text-muted); gap: 6px;">
            ${icon('logout', 16)} Logout & Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  // Password visibility event handlers
  if (!hasPasswordSet) {
    setupToggle('toggleNewPwd', 'newAdminPwd');
    setupToggle('toggleConfirmPwd', 'confirmAdminPwd');
  } else {
    setupToggle('toggleVerifyPwd', 'verifyAdminPwd');
  }

  function setupToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    if (btn && inp) {
      btn.addEventListener('click', () => {
        const isPassword = inp.type === 'password';
        inp.type = isPassword ? 'text' : 'password';
        btn.querySelector('.material-symbols-rounded').textContent = isPassword ? 'visibility' : 'visibility_off';
      });
    }
  }

  // Handle Cancel
  document.getElementById('cancelVerifyBtn').addEventListener('click', () => {
    store.logout();
    sessionStorage.removeItem('lca_google_authenticated');
    sessionStorage.removeItem('lca_admin_verified');
    showToast('Admin verification canceled. Logged out.', 'info');
    navigate('select-role');
  });

  // Submit password form
  document.getElementById('adminPwdForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!hasPasswordSet) {
      const newPwd = document.getElementById('newAdminPwd').value;
      const confirmPwd = document.getElementById('confirmAdminPwd').value;

      if (newPwd.length < 4) {
        showToast('Password must be at least 4 characters long.', 'error');
        return;
      }
      if (newPwd !== confirmPwd) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      // Update password in local storage & firebase
      store.updateUser(user.id, { password: newPwd });
      store.setAdminMode(true);
      sessionStorage.setItem('lca_admin_verified', 'true');
      showToast('Custom admin password established successfully!', 'success');
      navigate('dashboard');
    } else {
      const verifyPwd = document.getElementById('verifyAdminPwd').value;
      
      if (verifyPwd === user.password) {
        store.setAdminMode(true);
        sessionStorage.setItem('lca_admin_verified', 'true');
        showToast('Admin portal unlocked successfully!', 'success');
        navigate('dashboard');
      } else {
        showToast('Incorrect custom admin password.', 'error');
      }
    }
  });
}
