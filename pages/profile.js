// ============================================
// PROFILE PAGE
// ============================================
import { store } from '../store.js';
import { showToast, icon, escapeHtml, getPasswordStrength } from '../utils/helpers.js';

export function renderProfile(app, navigate) {
  const user = store.getCurrentUser();
  if (!user) { navigate('login'); return; }

  // Google sign in users don't have a password property
  const isGoogleUser = !user.password;
  const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  function render() {
    app.innerHTML = `
      <div class="profile-page animate-fade-in">
        <div class="profile-container" style="max-width: 960px; margin: 0 auto; padding: var(--sp-6) var(--sp-4);">
          <!-- Header -->
          <div style="display:flex; align-items:center; gap:var(--sp-4); margin-bottom:var(--sp-8);">
            <button class="btn-icon" id="profileBackBtn" title="Back to Dashboard">${icon('arrow_back')}</button>
            <h1 style="font-family:var(--font-heading); font-size:var(--fs-xl); font-weight:var(--fw-extrabold);">User Profile</h1>
          </div>

          <div class="profile-grid-layout">
            <!-- Avatar Card -->
            <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:var(--sp-3); text-align:center; padding:var(--sp-6);">
              <div class="profile-avatar">${initials}</div>
              <div>
                <h2 style="font-family:var(--font-heading); font-size:var(--fs-lg); font-weight:var(--fw-bold);">${escapeHtml(user.fullName)}</h2>
                <div style="color:var(--text-muted); font-size:var(--fs-sm); margin-top:2px;">@${escapeHtml(user.username)}</div>
              </div>
              <div style="display:flex; gap:var(--sp-2); margin-top:var(--sp-2);">
                <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid var(--bg-card-border)">
                  Age: ${user.age || 'N/A'}
                </span>
                <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid var(--bg-card-border)">
                  Role: User
                </span>
                ${isGoogleUser ? `
                  <span class="badge" style="background:var(--accent-cyan-dim); color:var(--accent-cyan); border:1px solid rgba(0,229,255,0.2)">
                    Google Account
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Edit Details Card -->
            <div class="card">
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-md); font-weight:var(--fw-bold); margin-bottom:var(--sp-4); border-bottom:1px solid var(--bg-card-border); padding-bottom:var(--sp-2);">
                Edit Profile Details
              </h3>
              
              <form id="profileForm" class="login-form">
                <div class="form-group">
                  <label class="form-label" for="profileName">Full Name</label>
                  <input type="text" id="profileName" class="form-input" value="${escapeHtml(user.fullName)}" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="profileAge">Age</label>
                  <input type="number" id="profileAge" class="form-input" min="10" max="99" value="${user.age || 25}" required />
                </div>

                <!-- Password Block: Hidden for Google Sign In -->
                ${!isGoogleUser ? `
                  <div style="margin-top:var(--sp-4); border-top:1px solid var(--bg-card-border); padding-top:var(--sp-4); display:flex; flex-direction:column; gap:var(--sp-4);">
                    <h4 style="font-family:var(--font-heading); font-size:var(--fs-base); font-weight:var(--fw-bold); color:var(--accent-yellow)">Change Password</h4>
                    
                    <div class="form-group">
                      <label class="form-label" for="currentPassword">Current Password</label>
                      <div class="input-password-wrap">
                        <input type="password" id="currentPassword" class="form-input" placeholder="Verify current password" autocomplete="off" />
                        <button type="button" class="input-password-toggle" id="toggleCurPwd">
                          <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                        </button>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="newPassword">New Password</label>
                      <div class="input-password-wrap">
                        <input type="password" id="newPassword" class="form-input" placeholder="Create new password" autocomplete="off" />
                        <button type="button" class="input-password-toggle" id="toggleNewPwd">
                          <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                        </button>
                      </div>
                      <div class="strength-meter">
                        <div class="strength-bar" id="pstr1"></div>
                        <div class="strength-bar" id="pstr2"></div>
                        <div class="strength-bar" id="pstr3"></div>
                      </div>
                      <div class="strength-label" id="pstrengthLabel"></div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="confirmNewPassword">Confirm New Password</label>
                      <div class="input-password-wrap">
                        <input type="password" id="confirmNewPassword" class="form-input" placeholder="Confirm new password" autocomplete="off" />
                        <button type="button" class="input-password-toggle" id="toggleConfNewPwd">
                          <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <div class="modal-actions" style="margin-top:var(--sp-6)">
                  <button type="submit" class="btn btn-primary" style="width:100%">
                    Save Settings Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Back listener
    document.getElementById('profileBackBtn').addEventListener('click', () => navigate('dashboard'));

    // Handle password visibility toggles (only if email user)
    if (!isGoogleUser) {
      setupToggle('toggleCurPwd', 'currentPassword');
      setupToggle('toggleNewPwd', 'newPassword');
      setupToggle('toggleConfNewPwd', 'confirmNewPassword');

      // Password strength listener
      document.getElementById('newPassword').addEventListener('input', (e) => {
        const { score, label, level } = getPasswordStrength(e.target.value);
        const bars = ['pstr1', 'pstr2', 'pstr3'];
        bars.forEach((id, i) => {
          const bar = document.getElementById(id);
          bar.className = 'strength-bar';
          if (level === 'weak' && i === 0 && score > 0) bar.classList.add('active-weak');
          else if (level === 'medium' && i <= 1) bar.classList.add('active-medium');
          else if (level === 'strong' && i <= 2) bar.classList.add('active-strong');
        });

        const lbl = document.getElementById('pstrengthLabel');
        if (e.target.value.length === 0) {
          lbl.textContent = '';
          lbl.className = 'strength-label';
        } else {
          lbl.textContent = label;
          lbl.className = `strength-label ${level}`;
        }
      });
    }

    // Submit handler
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('profileName').value.trim();
      const age = Number(document.getElementById('profileAge').value);
      
      const updateData = { fullName, age };

      if (!isGoogleUser) {
        const currentPwd = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confPwd = document.getElementById('confirmNewPassword').value;

        // If trying to change password
        if (currentPwd || newPwd || confPwd) {
          if (currentPwd !== user.password) {
            showToast('Current password verification failed!', 'error');
            return;
          }
          const { score } = getPasswordStrength(newPwd);
          if (score < 5) {
            showToast('New password is too weak or does not meet strength rules!', 'error');
            return;
          }
          if (newPwd !== confPwd) {
            showToast('New password confirmation does not match!', 'error');
            return;
          }
          updateData.password = newPwd;
        }
      }

      // Update user details
      const updatedUser = store.updateUser(user.id, updateData);
      if (updatedUser) {
        showToast('Profile updated successfully!', 'success');
        renderProfile(app, navigate); // Refresh page view
      } else {
        showToast('Error updating profile!', 'error');
      }
    });
  }

  function setupToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      const isP = inp.type === 'password';
      inp.type = isP ? 'text' : 'password';
      btn.querySelector('.material-symbols-rounded').textContent = isP ? 'visibility' : 'visibility_off';
    });
  }

  render();
}
