// ============================================
// REGISTER PAGE
// ============================================
import { store } from '../store.js';
import { showToast, getPasswordStrength, icon } from '../utils/helpers.js';

export function renderRegister(app, navigate, params = {}) {
  const isTargetAdmin = params.role === 'admin';

  app.innerHTML = `
    <div class="register-page">
      <div class="register-card">
        <div class="register-header">
          <button class="btn-icon" id="backToLogin">${icon('arrow_back')}</button>
          <h1>Create Account</h1>
        </div>

        <form id="registerForm" class="register-form" autocomplete="off">
          <div class="form-group">
            <label class="form-label" for="regFullName">Full Name</label>
            <input type="text" id="regFullName" class="form-input" placeholder="Enter your full name" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="regAge">Age</label>
            <input type="number" id="regAge" class="form-input" placeholder="Enter your age" min="10" max="99" required />
          </div>

          ${isTargetAdmin ? `
            <div class="form-group animate-slide-up">
              <label class="form-label" for="regAdminCode" style="color:var(--accent-purple); font-weight:var(--fw-bold);">Admin Access Code</label>
              <input type="password" id="regAdminCode" class="form-input" placeholder="Enter admin passcode" required style="border-color:rgba(179, 136, 255, 0.4)" />
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label" for="regUsername">Username</label>
            <input type="text" id="regUsername" class="form-input" placeholder="Choose a username" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="regPassword">Password</label>
            <div class="input-password-wrap">
              <input type="password" id="regPassword" class="form-input" placeholder="Create a password" required />
              <button type="button" class="input-password-toggle" id="toggleRegPwd">
                <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
              </button>
            </div>
            <div class="strength-meter">
              <div class="strength-bar" id="str1"></div>
              <div class="strength-bar" id="str2"></div>
              <div class="strength-bar" id="str3"></div>
            </div>
            <div class="strength-label" id="strengthLabel"></div>
            <div class="password-requirements" id="pwdReqs">
              <span class="password-req" data-req="length">${icon('close', 12)} 8+ chars</span>
              <span class="password-req" data-req="upper">${icon('close', 12)} Uppercase</span>
              <span class="password-req" data-req="lower">${icon('close', 12)} Lowercase</span>
              <span class="password-req" data-req="number">${icon('close', 12)} Number</span>
              <span class="password-req" data-req="special">${icon('close', 12)} Special char</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="regConfirmPwd">Confirm Password</label>
            <div class="input-password-wrap">
              <input type="password" id="regConfirmPwd" class="form-input" placeholder="Confirm your password" required />
              <button type="button" class="input-password-toggle" id="toggleConfPwd">
                <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--sp-2)">
            ${icon('person_add', 18)} CREATE ACCOUNT
          </button>
        </form>

        <div class="login-footer" style="margin-top:var(--sp-5)">
          <span>Already have an account? </span>
          <a href="#" id="goToLogin2">Sign In</a>
        </div>
      </div>
    </div>
  `;

  // Toggle password visibility
  setupToggle('toggleRegPwd', 'regPassword');
  setupToggle('toggleConfPwd', 'regConfirmPwd');

  function setupToggle(btnId, inputId) {
    document.getElementById(btnId).addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      const isP = inp.type === 'password';
      inp.type = isP ? 'text' : 'password';
      document.getElementById(btnId).querySelector('.material-symbols-rounded').textContent = isP ? 'visibility' : 'visibility_off';
    });
  }

  // Password strength meter
  document.getElementById('regPassword').addEventListener('input', (e) => {
    const { score, checks, label, level } = getPasswordStrength(e.target.value);
    const bars = ['str1', 'str2', 'str3'];
    bars.forEach((id, i) => {
      const bar = document.getElementById(id);
      bar.className = 'strength-bar';
      if (level === 'weak' && i === 0 && score > 0) bar.classList.add('active-weak');
      else if (level === 'medium' && i <= 1) bar.classList.add('active-medium');
      else if (level === 'strong' && i <= 2) bar.classList.add('active-strong');
    });

    const lbl = document.getElementById('strengthLabel');
    if (e.target.value.length === 0) {
      lbl.textContent = '';
      lbl.className = 'strength-label';
    } else {
      lbl.textContent = label;
      lbl.className = `strength-label ${level}`;
    }

    // Update requirement checks
    document.querySelectorAll('.password-req').forEach(el => {
      const req = el.dataset.req;
      const met = checks[req];
      el.classList.toggle('met', met);
      el.querySelector('.material-symbols-rounded').textContent = met ? 'check' : 'close';
    });
  });

  // Form submit
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value.trim();
    const age = document.getElementById('regAge').value;
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPwd').value;

    if (isTargetAdmin) {
      const adminCode = document.getElementById('regAdminCode').value;
      if (adminCode !== '2011') {
        showToast('Invalid admin access code!', 'error');
        return;
      }
    }

    // Validations
    if (store.getUserByUsername(username)) {
      showToast('Username already exists!', 'error');
      return;
    }
    const { score } = getPasswordStrength(password);
    if (score < 5) {
      showToast('Password must meet all requirements!', 'error');
      return;
    }
    if (password !== confirmPwd) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    const user = store.addUser({
      fullName, age: Number(age), teamName: '', username, password, role: isTargetAdmin ? 'admin' : 'user'
    });
    store.setCurrentUser(user);
    showToast(isTargetAdmin ? 'Admin account created successfully!' : 'Account created successfully!', 'success');
    navigate('dashboard');
  });

  // Back to login
  document.getElementById('backToLogin').addEventListener('click', () => navigate('login', params));
  document.getElementById('goToLogin2').addEventListener('click', (e) => { e.preventDefault(); navigate('login', params); });
}
