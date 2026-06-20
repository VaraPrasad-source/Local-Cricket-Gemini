// ============================================
// LOGIN PAGE
// ============================================
import { store } from '../store.js';
import { showToast, icon } from '../utils/helpers.js';

export function renderLogin(app, navigate, params = {}) {
  app.innerHTML = `
    <div class="login-page animate-fade-in">
      <div class="login-card">
        <div class="login-logo">
          <span class="material-symbols-rounded icon">
            sports_cricket
          </span>
          <h1>local Crickret App</h1>
          <p>Live Scores, Tournaments & Fan Engagement Portal</p>
        </div>

        <form id="loginForm" class="login-form" autocomplete="off">
          <div class="form-group">
            <label class="form-label" for="loginUsername">Username</label>
            <div style="position:relative">
              <input type="text" id="loginUsername" class="form-input" placeholder="Enter your username" required autocomplete="username" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginPassword">Password</label>
            <div class="input-password-wrap">
              <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" required autocomplete="current-password" />
              <button type="button" class="input-password-toggle" id="togglePassword">
                <span class="material-symbols-rounded" style="font-size:20px">visibility_off</span>
              </button>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-4);">
            <div class="checkbox-wrap" style="margin:0;">
              <input type="checkbox" id="rememberMe" />
              <label for="rememberMe" style="font-size:13px;">Remember Me</label>
            </div>
          </div>

          <div class="login-actions">
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%; justify-content:center; gap:var(--sp-2);">
              ${icon('login', 18)} LOGIN
            </button>

            <div class="login-divider">or</div>

            <button type="button" class="google-btn" id="googleSignIn" style="justify-content:center;">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In With Google
            </button>
          </div>
        </form>

        <div class="login-footer">
          <span>Don't have an account? </span>
          <a href="#" id="goToRegister">Create Account</a>
        </div>
      </div>
    </div>
  `;

  // Toggle password visibility
  const toggleBtn = document.getElementById('togglePassword');
  const pwdInput = document.getElementById('loginPassword');
  toggleBtn.addEventListener('click', () => {
    const isPassword = pwdInput.type === 'password';
    pwdInput.type = isPassword ? 'text' : 'password';
    toggleBtn.querySelector('.material-symbols-rounded').textContent = isPassword ? 'visibility' : 'visibility_off';
  });

  // Login form submit
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const user = store.getUserByUsername(username);
    if (!user) {
      showToast('User not found. Please create an account.', 'error');
      return;
    }
    if (user.password !== password) {
      showToast('Invalid password. Please try again.', 'error');
      return;
    }

    // Save remember me
    const rememberMe = document.getElementById('rememberMe').checked;
    if (rememberMe) {
      localStorage.setItem('lca_remember_user', username);
    } else {
      localStorage.removeItem('lca_remember_user');
    }

    store.setCurrentUser(user);
    showToast(`Welcome back, ${user.fullName}!`, 'success');
    navigate('dashboard');
  });

  // Google sign in
  document.getElementById('googleSignIn').addEventListener('click', async () => {
    const { USE_FIREBASE, getFirebaseAuth } = await import('../firebase.js');
    if (!USE_FIREBASE) {
      showToast('Connect Firebase to enable Google Sign-In', 'info');
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Map to our app user format
      let appUser = store.getUsers().find(u => u.username === firebaseUser.email);
      if (!appUser) {
        // Create new user for this Google account (default role: admin)
        appUser = {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'Google User',
          username: firebaseUser.email,
          role: 'admin',
          teamName: '',
          age: 25,
          isGoogle: true
        };
        store.addUser(appUser);
      } else {
        appUser.isGoogle = true;
        store.updateUser(appUser.id, { isGoogle: true });
      }
      
      store.setCurrentUser(appUser);
      showToast(`Welcome, ${appUser.fullName}!`, 'success');
      navigate('dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
        showToast('Google Sign-In failed: Domain not authorized in Firebase Console.', 'error');
      } else {
        showToast('Google Sign-In failed: ' + error.message, 'error');
      }
    }
  });

  // Navigate to register
  document.getElementById('goToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('register', params);
  });

  // Check remember me
  const saved = localStorage.getItem('lca_remember_user');
  if (saved) {
    document.getElementById('loginUsername').value = saved;
    document.getElementById('rememberMe').checked = true;
  }
}

