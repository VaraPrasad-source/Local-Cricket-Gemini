// ============================================
// PROFILE PAGE
// ============================================
import { store } from '../store.js';
import { showToast, icon, escapeHtml, getPasswordStrength } from '../utils/helpers.js';

// Premium high-fidelity SVG presets for the Avatar picker
const BALL_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="url(#ball-grad)"/><path d="M 20 40 Q 50 60 80 40" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="2,3" stroke-linecap="round"/><path d="M 20 37 Q 50 57 80 37" fill="none" stroke="#fff" stroke-width="1.5" stroke-opacity="0.6"/><path d="M 20 43 Q 50 63 80 43" fill="none" stroke="#fff" stroke-width="1.5" stroke-opacity="0.6"/><circle cx="44" cy="38" r="15" fill="#fff" opacity="0.1" filter="blur(3px)"/><defs><radialGradient id="ball-grad" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="65%" stop-color="#cc0000"/><stop offset="100%" stop-color="#550000"/></radialGradient></defs></svg>`;

const TROPHY_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="50" fill="url(#trophy-bg)"/><path d="M 33 28 L 67 28 L 65 52 Q 65 67 50 67 Q 35 67 35 52 Z M 50 67 L 50 80 M 35 80 L 65 80" fill="none" stroke="#ffd700" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 33 37 Q 20 37 20 47 Q 20 52 34 49 M 67 37 Q 80 37 80 47 Q 80 52 66 49" fill="none" stroke="#ffd700" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="45" r="5" fill="#fff" opacity="0.4" filter="blur(1px)"/><defs><linearGradient id="trophy-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1f103d"/><stop offset="100%" stop-color="#080311"/></linearGradient></defs></svg>`;

const BATSMAN_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="50" fill="url(#cyber-bg)"/><circle cx="50" cy="32" r="9" fill="#d4f754"/><path d="M 36 78 L 44 52 L 50 42 L 60 54 L 66 78 M 50 42 L 50 56 L 75 78" fill="none" stroke="#d4f754" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="75" cy="78" r="4" fill="#ff4444"/><defs><linearGradient id="cyber-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#12240b"/><stop offset="100%" stop-color="#040902"/></linearGradient></defs></svg>`;

const CAPTAIN_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="50" fill="url(#cap-bg)"/><path d="M 50 22 L 78 37 Q 78 68 50 83 Q 22 68 22 37 Z" fill="none" stroke="#b388ff" stroke-width="4.5" stroke-linejoin="round"/><text x="50" y="61" font-family="'Outfit', sans-serif" font-weight="bold" font-size="30" fill="#b388ff" text-anchor="middle">C</text><defs><linearGradient id="cap-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1d0d36"/><stop offset="100%" stop-color="#07020e"/></linearGradient></defs></svg>`;

const SHIELD_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="50" fill="url(#shield-bg)"/><path d="M 50 20 L 76 33 Q 76 65 50 83 Q 24 65 24 33 Z" fill="url(#shield-grad)" stroke="#ff9f43" stroke-width="4" stroke-linejoin="round"/><path d="M 40 45 L 48 53 L 64 37" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="shield-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e1003"/><stop offset="100%" stop-color="#0a0500"/></linearGradient><linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff9f43"/><stop offset="100%" stop-color="#ff7b00"/></linearGradient></defs></svg>`;

const SPIN_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="50" fill="url(#spin-bg)"/><path d="M 48 20 A 30 30 0 0 1 80 50 L 68 50 A 18 18 0 0 0 48 32 Z M 52 80 A 30 30 0 0 1 20 50 L 32 50 A 18 18 0 0 0 52 68 Z" fill="url(#spin-grad)"/><circle cx="50" cy="50" r="8" fill="#00f0ff"/><defs><linearGradient id="spin-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00181e"/><stop offset="100%" stop-color="#000608"/></linearGradient><linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00f0ff"/><stop offset="100%" stop-color="#3897ff"/></linearGradient></defs></svg>`;

const PRESET_AVATARS = [
  { id: 'crimson_ball', name: 'Leather Ball', svg: BALL_SVG },
  { id: 'gold_trophy', name: 'Gold Trophy', svg: TROPHY_SVG },
  { id: 'batsman_strike', name: 'Batsman Strike', svg: BATSMAN_SVG },
  { id: 'purple_captain', name: 'Team Captain', svg: CAPTAIN_SVG },
  { id: 'shield_guard', name: 'Safe Guard', svg: SHIELD_SVG },
  { id: 'turbo_spin', name: 'Turbo Spin', svg: SPIN_SVG },
];

export function renderProfile(app, navigate) {
  const user = store.getCurrentUser();
  if (!user) { navigate('login'); return; }

  // Google sign in users don't have a password property
  const isGoogleUser = !user.password;
  const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  // Check if custom profile picture exists
  const hasProfilePic = !!user.profilePic;
  const avatarContent = hasProfilePic 
    ? `<img src="${user.profilePic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="User Avatar" />`
    : initials;

  function render() {
    app.innerHTML = `
      <div class="profile-page animate-fade-in">
        <div class="profile-container" style="max-width: 100%; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="display:flex; align-items:center; gap:var(--sp-4); margin-bottom:var(--sp-8);">
            <button class="btn-icon" id="profileBackBtn" title="Back to Dashboard">${icon('arrow_back')}</button>
            <h1 style="font-family:var(--font-heading); font-size:var(--fs-xl); font-weight:var(--fw-extrabold);">User Profile</h1>
          </div>

          <div class="profile-grid-layout">
            <!-- Avatar Card -->
            <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:var(--sp-3); text-align:center; padding:var(--sp-6);">
              <div class="profile-avatar" id="avatarContainer" style="position:relative; overflow:hidden; cursor:pointer;" title="Change profile picture">
                ${avatarContent}
                <div class="avatar-hover-overlay" style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity var(--transition-base); pointer-events:none;">
                  <span class="material-symbols-rounded" style="color:#ffffff; font-size:24px;">photo_camera</span>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" id="btnChangeAvatar" style="gap:6px; padding:6px 14px;">
                <span class="material-symbols-rounded" style="font-size:16px;">edit</span> Edit Picture
              </button>
              
              <div style="margin-top: var(--sp-2);">
                <h2 style="font-family:var(--font-heading); font-size:var(--fs-lg); font-weight:var(--fw-bold);">${escapeHtml(user.fullName)}</h2>
                <div style="color:var(--text-muted); font-size:var(--fs-sm); margin-top:2px;">@${escapeHtml(user.username)}</div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:var(--sp-2); justify-content:center;">
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

    // CSS inject for overlay hover on avatar
    const styleId = 'profile-avatar-hover-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        #avatarContainer:hover .avatar-hover-overlay {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Attach profile back action
    document.getElementById('profileBackBtn').addEventListener('click', () => navigate('dashboard'));

    // Attach avatar selector triggers
    document.getElementById('avatarContainer').addEventListener('click', showAvatarPickerModal);
    document.getElementById('btnChangeAvatar').addEventListener('click', showAvatarPickerModal);

    // Handle password visibility toggles (only if email user)
    if (!isGoogleUser) {
      setupToggle('toggleCurPwd', 'currentPassword');
      setupToggle('toggleNewPwd', 'newPassword');
      setupToggle('setupToggle', 'confirmNewPassword'); // safety handler fallback
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

  // --- Show Avatar Selection Modal ---
  function showAvatarPickerModal() {
    const modalRoot = document.getElementById('modal-root');
    let selectedAvatarData = user.profilePic || '';

    // Render presets grid and drag & drop setup inside the modal content
    modalRoot.innerHTML = `
      <div class="modal-overlay" style="z-index: 1000;">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-title">${icon('photo_camera', 24)} Change Profile Picture</div>
          <button class="modal-close" id="closeAvatarModal">${icon('close')}</button>
          
          <!-- Selected Preview Header -->
          <div style="display:flex; justify-content:center; align-items:center; flex-direction:column; gap:10px; margin-bottom:var(--sp-6); background:rgba(255,255,255,0.02); padding:var(--sp-4); border-radius:var(--radius-lg); border:1px solid var(--bg-card-border);">
            <div id="modalAvatarPreview" class="profile-avatar" style="margin: 0;">
              ${selectedAvatarData ? `<img src="${selectedAvatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />` : initials}
            </div>
            <span style="font-size:var(--fs-xs); color:var(--text-muted); font-weight:var(--fw-semibold); text-transform:uppercase; letter-spacing:0.05em;">Live Preview</span>
          </div>

          <!-- Presets Grid -->
          <div style="margin-bottom: var(--sp-5);">
            <label class="form-label" style="display:block; margin-bottom:10px;">Select Cricket / Sports Preset</label>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;" id="presetsGrid">
              ${PRESET_AVATARS.map(preset => {
                const presetDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(preset.svg);
                const isSelected = selectedAvatarData === presetDataUrl;
                return `
                  <div class="preset-avatar-card" data-preset-src="${presetDataUrl}" style="border: 2px solid ${isSelected ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)'}; background:${isSelected ? 'rgba(212,247,84,0.05)' : 'rgba(255,255,255,0.01)'}; border-radius:var(--radius-md); padding:10px; text-align:center; cursor:pointer; transition:all var(--transition-base);">
                    <div style="max-width:56px; width:100%; aspect-ratio:1; margin:0 auto 6px; overflow:hidden; border-radius:50%;">
                      ${preset.svg}
                    </div>
                    <div style="font-size:10px; color:var(--text-secondary); font-weight:var(--fw-medium); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${preset.name}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Drag & Drop Uploader -->
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:var(--sp-6);">
            <label class="form-label">Or Upload Custom Image</label>
            <input type="file" id="avatarFileInput" accept="image/png, image/jpeg" style="display:none;" />
            
            <div id="avatarDropZone" style="border:2px dashed rgba(255,255,255,0.12); border-radius:var(--radius-md); padding:var(--sp-4); text-align:center; cursor:pointer; transition:all var(--transition-base); background:rgba(255,255,255,0.01);">
              <span class="material-symbols-rounded" style="font-size:32px; color:var(--accent-green); margin-bottom:6px;">cloud_upload</span>
              <p style="font-size:var(--fs-xs); color:var(--text-secondary); font-weight:var(--fw-semibold);">Drag & drop your file or <span style="color:var(--accent-green);">browse</span></p>
              <p style="font-size:10px; color:var(--text-muted); margin-top:4px;">Supports PNG/JPG. Automatic size optimization applied.</p>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-actions" style="margin-top:var(--sp-6);">
            <button type="button" class="btn btn-outline" id="cancelAvatarBtn">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveAvatarBtn">Confirm & Save</button>
          </div>
        </div>
      </div>
    `;

    // Setup interactive handlers inside the modal
    const closeBtn = document.getElementById('closeAvatarModal');
    const cancelBtn = document.getElementById('cancelAvatarBtn');
    const saveBtn = document.getElementById('saveAvatarBtn');
    const dropZone = document.getElementById('avatarDropZone');
    const fileInput = document.getElementById('avatarFileInput');
    const previewContainer = document.getElementById('modalAvatarPreview');
    const presetCards = document.querySelectorAll('.preset-avatar-card');

    function closeModal() {
      modalRoot.innerHTML = '';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Preset Selection List
    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove selection highlights
        presetCards.forEach(c => {
          c.style.borderColor = 'rgba(255,255,255,0.08)';
          c.style.background = 'rgba(255,255,255,0.01)';
        });
        // Select this card
        card.style.borderColor = 'var(--accent-green)';
        card.style.background = 'rgba(212,247,84,0.05)';

        selectedAvatarData = card.getAttribute('data-preset-src');
        previewContainer.innerHTML = `<img src="${selectedAvatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      });
    });

    // File Selector Browser trigger
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and Drop Listeners
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent-green)';
      dropZone.style.background = 'rgba(212,247,84,0.03)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(255,255,255,0.12)';
      dropZone.style.background = 'rgba(255,255,255,0.01)';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'rgba(255,255,255,0.12)';
      dropZone.style.background = 'rgba(255,255,255,0.01)';
      
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    });

    // Handle normal file input selection
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleImageFile(file);
    });

    // Compress & Resize Client File to preserve space & local limit
    function handleImageFile(file) {
      if (!file.type.match('image.*')) {
        showToast('Please select a valid PNG or JPEG image file', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 180;
          const MAX_HEIGHT = 180;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compresses to optimal lightweight quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          
          // Update active values
          selectedAvatarData = compressedBase64;
          previewContainer.innerHTML = `<img src="${selectedAvatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
          
          // Reset highlights on preset buttons
          presetCards.forEach(c => {
            c.style.borderColor = 'rgba(255,255,255,0.08)';
            c.style.background = 'rgba(255,255,255,0.01)';
          });
          
          showToast('Image uploaded & optimized successfully!', 'success');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Save Selected Avatar
    saveBtn.addEventListener('click', () => {
      const updatedUser = store.updateUser(user.id, { profilePic: selectedAvatarData });
      if (updatedUser) {
        showToast('Profile picture saved successfully!', 'success');
        closeModal();
        renderProfile(app, navigate); // Refresh page view
      } else {
        showToast('Failed to save profile picture', 'error');
      }
    });
  }

  render();
}
