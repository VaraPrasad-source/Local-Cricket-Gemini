// ============================================
// ONBOARDING PAGES — Step by Step Tour
// ============================================
import { store } from '../store.js';
import { icon, escapeHtml } from '../utils/helpers.js';

export function renderOnboarding(app, navigate) {
  let currentSlide = 0;

  const slides = [
    {
      icon: 'sports_cricket',
      title: 'Cricket — Welcome To Local Cricket Tournament',
      subtitle: 'Create, manage, and experience local tournaments like a professional league.',
      description: 'Welcome to the ultimate local cricket management platform where every match, tournament, and team can be organized in one place. Create your own cricket world with custom tournaments, invite players, manage teams, track performance, and enjoy a professional tournament experience. Whether you play friendly matches or run a complete season, this app helps you manage everything smoothly and efficiently.',
      color: 'var(--accent-green, #D4F754)'
    },
    {
      icon: 'sports_score',
      title: 'Match Details — Record Every Moment',
      subtitle: 'Capture batting, bowling, toss, pitch, and video highlights with detail.',
      description: 'Capture complete match information with powerful match management tools. Create matches, enter team scores, record batting and bowling performance, upload match videos, add toss details, pitch conditions, and match results. Track who scored runs, who took wickets, and maintain detailed match history for future analysis.',
      color: 'var(--accent-cyan, #00E5FF)'
    },
    {
      icon: 'workspace_premium',
      title: 'Stars — Celebrate Top Performers',
      subtitle: 'Highlight individual achievements, cap winners, and top statistics.',
      description: 'Recognize the best players of every tournament with an advanced performance tracking system. Highlight Orange Cap holders, Purple Cap winners, highest run scorers, best bowling performances, most centuries, most half-centuries, maximum sixes, fours, and boundaries. Turn every season into a memorable competition with achievements and leaderboards.',
      color: '#FFD700'
    },
    {
      icon: 'table_chart',
      title: 'Points Table — Track Team Rankings',
      subtitle: 'Watch team standings update in real-time with automatic NRR calculations.',
      description: 'Monitor tournament standings automatically with a smart points table system. Record matches played, wins, losses, draws, points earned, and automatic NRR calculation. Teams are ranked instantly based on performance so players always know where they stand in the competition.',
      color: '#FF9100'
    },
    {
      icon: 'groups',
      title: 'Team Members Details — Build Your Dream Team',
      subtitle: 'Fully custom profile builders, role assignment, and roster management.',
      description: 'Create and manage your cricket squad with complete player profiles. Add player names, roles, age, photos, and team information. Assign admin roles, manage permissions, invite members, and organize your team structure easily while keeping everything updated in one place.',
      color: '#E040FB'
    },
    {
      icon: 'calendar_today',
      title: 'Schedule — Never Miss A Match',
      subtitle: 'Easily coordinate dates, venues, timings, and notification alerts.',
      description: 'Organize tournaments with a complete scheduling system. Create match fixtures with dates, time, venue, team details, and match status. Track upcoming matches, completed games, and tournament progress while keeping all participants informed and ready.',
      color: '#00E676'
    },
    {
      icon: 'forum',
      title: 'Group Meeting — Connect And Play Together',
      subtitle: 'Discuss league rules, share on chat, and invite other players.',
      description: 'Bring players and organizers together through tournament groups and invitations. Create groups, invite members using custom IDs, assign admin roles, discuss tournament planning, and share tournament access through WhatsApp, Telegram, and Messages. Build your cricket community and manage tournaments collaboratively from one dashboard.',
      color: 'var(--accent-purple, #D1C4E9)'
    }
  ];

  function finishOnboarding() {
    localStorage.setItem('lca_onboarded_v1', 'true');
    const user = store.getCurrentUser();
    if (user) {
      navigate('dashboard');
    } else {
      navigate('login');
    }
  }

  function render() {
    const s = slides[currentSlide];
    
    app.innerHTML = `
      <div class="onboarding-container animate-fade-in" style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 40px);
        padding: var(--sp-4);
      ">
        <div class="onboarding-card animate-scale-in" style="
          width: 100%;
          max-width: 640px;
          background: rgba(29, 13, 58, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: var(--sp-8);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        ">
          <!-- Glass Accent Circle -->
          <div style="
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: ${s.color};
            filter: blur(80px);
            opacity: 0.15;
            pointer-events: none;
          "></div>

          <!-- Top Skip button -->
          <div style="position: absolute; top: var(--sp-4); right: var(--sp-6);">
            <button class="btn btn-ghost btn-sm" id="skipOnboardingBtn" style="font-size: var(--fs-xs); color: var(--text-secondary); opacity: 0.8;">
              Skip
            </button>
          </div>

          <!-- Slide number -->
          <div style="
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--text-secondary);
            margin-bottom: var(--sp-4);
            letter-spacing: 2px;
            text-transform: uppercase;
          ">
            Step ${currentSlide + 1} of ${slides.length}
          </div>

          <!-- Glowing Icon Wrapper -->
          <div style="
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 2px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--sp-6);
            color: ${s.color};
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          " class="icon-pulse">
            ${icon(s.icon, 52)}
          </div>

          <!-- Title & Descriptions -->
          <h2 style="
            font-size: var(--fs-2xl);
            font-weight: 700;
            margin-bottom: var(--sp-2);
            font-family: var(--font-sans);
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #dcdcdc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          ">
            ${escapeHtml(s.title)}
          </h2>

          <p style="
            color: ${s.color};
            font-family: var(--font-sans);
            font-size: var(--fs-sm);
            font-weight: 500;
            margin-bottom: var(--sp-4);
            opacity: 0.9;
          ">
            ${escapeHtml(s.subtitle)}
          </p>

          <p style="
            color: var(--text-secondary);
            font-size: var(--fs-sm);
            line-height: var(--lh-relaxed);
            margin-bottom: var(--sp-8);
            max-width: 560px;
            min-height: 72px;
          ">
            ${escapeHtml(s.description)}
          </p>

          <!-- Interactive Dots indicator -->
          <div style="
            display: flex;
            align-items: center;
            gap: var(--sp-2);
            margin-bottom: var(--sp-8);
          ">
            ${slides.map((_, idx) => `
              <div class="pager-dot ${idx === currentSlide ? 'active' : ''}" data-index="${idx}" style="
                width: ${idx === currentSlide ? '24px' : '8px'};
                height: 8px;
                border-radius: 4px;
                background: ${idx === currentSlide ? s.color : 'rgba(255, 255, 255, 0.15)'};
                cursor: pointer;
                transition: all 0.3s ease;
              "></div>
            `).join('')}
          </div>

          <!-- Bottom Navigation Button Matrix -->
          <div style="
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: ${currentSlide > 0 ? 'space-between' : 'center'};
            gap: var(--sp-4);
          ">
            ${currentSlide > 0 ? `
              <button class="btn btn-outline" id="prevOnboardingBtn" style="flex: 1; justify-content: center;">
                <span class="material-symbols-rounded" style="font-size: 16px; margin-right: 4px;">arrow_back</span>
                Back
              </button>
            ` : ''}

            <button class="btn btn-primary" id="nextOnboardingBtn" style="
              flex: 1.5; 
              justify-content: center; 
              background: ${currentSlide === slides.length - 1 ? s.color : 'var(--btn-primary-bg)'};
              color: ${currentSlide === slides.length - 1 ? '#05020b' : 'var(--btn-primary-text)'};
              font-weight: 700;
              transition: all 0.3s ease;
            ">
              ${currentSlide === slides.length - 1 ? `
                Get Started
                <span class="material-symbols-rounded" style="font-size: 16px; margin-left: 4px; font-weight:700;">done_all</span>
              ` : `
                Next
                <span class="material-symbols-rounded" style="font-size: 16px; margin-left: 4px;">arrow_forward</span>
              `}
            </button>
          </div>
        </div>
      </div>
    `;

    // Dynamic style definitions within onboarding scope
    if (!document.getElementById('onboarding-styles')) {
      const style = document.createElement('style');
      style.id = 'onboarding-styles';
      style.innerHTML = `
        @keyframes customPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px transparent); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 15px rgba(212, 247, 84, 0.25)); }
        }
        .icon-pulse {
          animation: customPulse 3s infinite ease-in-out;
        }
        .pager-dot:hover {
          background: rgba(255, 255, 255, 0.35) !important;
        }
        .pager-dot.active:hover {
          background: ${s.color} !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Bind event listeners
    document.getElementById('skipOnboardingBtn').addEventListener('click', finishOnboarding);

    const prevBtn = document.getElementById('prevOnboardingBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
          currentSlide--;
          render();
        }
      });
    }

    document.getElementById('nextOnboardingBtn').addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        render();
      } else {
        finishOnboarding();
      }
    });

    // Make indicators clickable to jump slides
    document.querySelectorAll('.pager-dot').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'));
        if (!isNaN(idx) && idx !== currentSlide) {
          currentSlide = idx;
          render();
        }
      });
    });
  }

  render();
}
