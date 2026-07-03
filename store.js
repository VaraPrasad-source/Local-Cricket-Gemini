// ============================================
// DATA STORE (localStorage + Firestore Cloud Sync)
// ============================================
import { generateId, calcPoints, calcNRR } from './utils/helpers.js';
import { USE_FIREBASE, getFirebaseDB } from './firebase.js';

class DataStore {
  constructor() {
    this._init();
  }

  _init() {
    const defaultAdmin = {
      id: 'admin-varaprasad',
      fullName: 'vara prasad',
      username: 'varaprasad',
      password: 'password123',
      role: 'admin',
      age: 25,
      teamName: '',
      createdAt: new Date().toISOString()
    };

    if (!localStorage.getItem('lca_initialized')) {
      localStorage.setItem('lca_seasons', JSON.stringify([]));
      localStorage.setItem('lca_matches', JSON.stringify([]));
      localStorage.setItem('lca_players', JSON.stringify([]));
      localStorage.setItem('lca_points', JSON.stringify([]));
      localStorage.setItem('lca_schedule', JSON.stringify([]));
      localStorage.setItem('lca_awards', JSON.stringify([]));
      localStorage.setItem('lca_users', JSON.stringify([defaultAdmin]));
      localStorage.setItem('lca_group_meetings', JSON.stringify([]));
      localStorage.setItem('lca_initialized', 'true');
    } else if (!localStorage.getItem('lca_group_meetings')) {
      localStorage.setItem('lca_group_meetings', JSON.stringify([]));
    }

    // Double check that the default admin is present in localStorage
    const users = this.getUsers();
    if (users.length === 0 || !users.some(u => u.username === 'varaprasad')) {
      users.push(defaultAdmin);
      this._set('lca_users', users);
      this.pushToFirebase('users', defaultAdmin.id, defaultAdmin);
    }
  }

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  // --- Firebase Syncing ---
  async syncFromFirebase() {
    if (!USE_FIREBASE) return;
    const db = getFirebaseDB();
    if (!db) return;
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const collections = ['seasons', 'matches', 'players', 'points', 'schedule', 'awards', 'users', 'group_meetings', 'notifications'];
      
      console.log('🔄 Syncing data from Firestore...');
      for (const collName of collections) {
        const querySnapshot = await getDocs(collection(db, collName));
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        
        if (collName === 'users') {
          const hasAdmin = data.some(u => u.username === 'varaprasad');
          if (!hasAdmin) {
            const defaultAdmin = {
              id: 'admin-varaprasad',
              fullName: 'vara prasad',
              username: 'varaprasad',
              password: 'password123',
              role: 'admin',
              age: 21,
              teamName: '',
              createdAt: new Date().toISOString()
            };
            data.push(defaultAdmin);
            this.pushToFirebase('users', defaultAdmin.id, defaultAdmin);
          }
        }

        this._set('lca_' + collName, data);
      }
      console.log('✅ Local storage updated from Firestore');
    } catch (error) {
      console.error('❌ Failed to sync from Firebase:', error);
    }
  }

  async pushToFirebase(collName, docId, data, isDelete = false) {
    if (!USE_FIREBASE) return;
    const db = getFirebaseDB();
    if (!db) return;
    
    try {
      const { doc, setDoc, deleteDoc } = await import('firebase/firestore');
      const docRef = doc(db, collName, docId);
      if (isDelete) {
        await deleteDoc(docRef);
        console.log(`🗑️ Deleted document ${docId} from Firestore collection "${collName}"`);
      } else {
        await setDoc(docRef, data);
        console.log(`💾 Saved/Updated document ${docId} in Firestore collection "${collName}"`);
      }
    } catch (err) {
      console.error(`❌ Error syncing to Firestore (collection: ${collName}, docId: ${docId}):`, err);
    }
  }

  // --- Auth / Users ---
  getUsers() { return this._get('lca_users'); }
  addUser(user) {
    const users = this.getUsers();
    user.id = user.id || generateId();
    user.createdAt = user.createdAt || new Date().toISOString();
    users.push(user);
    this._set('lca_users', users);
    
    this.pushToFirebase('users', user.id, user);
    return user;
  }
  getUserByUsername(username) {
    return this.getUsers().find(u => u.username === username);
  }
  updateUser(id, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      this._set('lca_users', users);
      this.pushToFirebase('users', id, users[idx]);
      
      const current = this.getCurrentUser();
      if (current && current.id === id) {
        this.setCurrentUser(users[idx]);
      }
      return users[idx];
    }
    return null;
  }
  getCurrentUser() {
    const data = localStorage.getItem('lca_current_user');
    return data ? JSON.parse(data) : null;
  }
  setCurrentUser(user) {
    localStorage.setItem('lca_current_user', JSON.stringify(user));
  }
  logout() {
    localStorage.removeItem('lca_current_user');
  }
  isAdmin() {
    return !!this.getCurrentUser();
  }
  setAdminMode(enabled) {
    const user = this.getCurrentUser();
    if (user) {
      user.role = enabled ? 'admin' : 'user';
      this.setCurrentUser(user);
      // Update in users database as well
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx].role = user.role;
        this._set('lca_users', users);
        this.pushToFirebase('users', user.id, users[idx]);
      }
    }
  }

  // --- Seasons/Tournaments ---
  getSeasons() { return this._get('lca_seasons'); }
  addSeason(season) {
    const seasons = this.getSeasons();
    season.id = generateId();
    season.createdAt = new Date().toISOString();
    seasons.push(season);
    this._set('lca_seasons', seasons);
    
    this.pushToFirebase('seasons', season.id, season);
    return season;
  }
  getSeason(id) { return this.getSeasons().find(s => s.id === id); }
  deleteSeason(id) {
    this._set('lca_seasons', (this.getSeasons() || []).filter(s => s && s.id !== id));
    this.pushToFirebase('seasons', id, null, true);

    // Also delete associated data locally and in Firebase
    const matchesToDelete = (this.getMatches() || []).filter(m => m && m.seasonId === id);
    this._set('lca_matches', (this.getMatches() || []).filter(m => !m || m.seasonId !== id));
    matchesToDelete.forEach(m => m && m.id && this.pushToFirebase('matches', m.id, null, true));

    const pointsToDelete = (this.getPoints() || []).filter(p => p && p.seasonId === id);
    this._set('lca_points', (this.getPoints() || []).filter(p => !p || p.seasonId !== id));
    pointsToDelete.forEach(p => p && p.id && this.pushToFirebase('points', p.id, null, true));

    const scheduleToDelete = (this.getSchedule() || []).filter(s => s && s.seasonId === id);
    this._set('lca_schedule', (this.getSchedule() || []).filter(s => !s || s.seasonId !== id));
    scheduleToDelete.forEach(s => s && s.id && this.pushToFirebase('schedule', s.id, null, true));

    const playersToDelete = (this.getPlayers() || []).filter(p => p && p.seasonId === id);
    this._set('lca_players', (this.getPlayers() || []).filter(p => !p || p.seasonId !== id));
    playersToDelete.forEach(p => p && p.id && this.pushToFirebase('players', p.id, null, true));

    const awardsToDelete = (this._get('lca_awards') || []).filter(a => a && a.seasonId === id);
    this._set('lca_awards', (this._get('lca_awards') || []).filter(a => !a || a.seasonId !== id));
    awardsToDelete.forEach(a => a && a.id && this.pushToFirebase('awards', a.id, null, true));
  }

  // --- Matches ---
  getMatches(seasonId) {
    const all = this._get('lca_matches');
    return seasonId ? all.filter(m => m.seasonId === seasonId) : all;
  }
  addMatch(match) {
    const matches = this._get('lca_matches');
    match.id = generateId();
    match.createdAt = new Date().toISOString();
    match.batting = match.batting || [];
    match.bowling = match.bowling || [];
    matches.push(match);
    this._set('lca_matches', matches);
    
    this.pushToFirebase('matches', match.id, match);
    return match;
  }
  updateMatch(id, data) {
    const matches = this._get('lca_matches');
    const idx = matches.findIndex(m => m.id === id);
    if (idx !== -1) {
      matches[idx] = { ...matches[idx], ...data };
      this._set('lca_matches', matches);
      this.pushToFirebase('matches', id, matches[idx]);
    }
  }
  deleteMatch(id) {
    this._set('lca_matches', this._get('lca_matches').filter(m => m.id !== id));
    this.pushToFirebase('matches', id, null, true);
  }
  getMatch(id) { return this._get('lca_matches').find(m => m.id === id); }

  // --- Players / Team Members ---
  getPlayers(seasonId) {
    const all = this._get('lca_players');
    return seasonId ? all.filter(p => p.seasonId === seasonId) : all;
  }
  addPlayer(player) {
    const players = this._get('lca_players');
    player.id = generateId();
    players.push(player);
    this._set('lca_players', players);
    
    this.pushToFirebase('players', player.id, player);
    return player;
  }
  deletePlayer(id) {
    this._set('lca_players', this._get('lca_players').filter(p => p.id !== id));
    this.pushToFirebase('players', id, null, true);
  }

  // --- Points Table ---
  getPoints(seasonId) {
    const all = this._get('lca_points');
    const pts = seasonId ? all.filter(p => p.seasonId === seasonId) : all;
    // Sort by points desc, then NRR desc
    return pts.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return parseFloat(b.nrr) - parseFloat(a.nrr);
    });
  }
  addPointsEntry(entry) {
    const points = this._get('lca_points');
    entry.id = generateId();
    entry.points = calcPoints(Number(entry.wins) || 0, Number(entry.draws) || 0);
    points.push(entry);
    this._set('lca_points', points);
    
    this.pushToFirebase('points', entry.id, entry);
    return entry;
  }
  updatePointsEntry(id, data) {
    const points = this._get('lca_points');
    const idx = points.findIndex(p => p.id === id);
    if (idx !== -1) {
      data.points = calcPoints(Number(data.wins) || 0, Number(data.draws) || 0);
      points[idx] = { ...points[idx], ...data };
      this._set('lca_points', points);
      this.pushToFirebase('points', id, points[idx]);
    }
  }
  deletePointsEntry(id) {
    this._set('lca_points', this._get('lca_points').filter(p => p.id !== id));
    this.pushToFirebase('points', id, null, true);
  }

  // --- Schedule ---
  getSchedule(seasonId) {
    const all = this._get('lca_schedule');
    return seasonId ? all.filter(s => s.seasonId === seasonId) : all;
  }
  addScheduleEntry(entry) {
    const schedule = this._get('lca_schedule');
    entry.id = generateId();
    schedule.push(entry);
    this._set('lca_schedule', schedule);
    
    this.pushToFirebase('schedule', entry.id, entry);
    return entry;
  }
  deleteScheduleEntry(id) {
    this._set('lca_schedule', this._get('lca_schedule').filter(s => s.id !== id));
    this.pushToFirebase('schedule', id, null, true);
  }

  // --- Awards/Stars ---
  getAwards(seasonId) {
    const all = this._get('lca_awards');
    if (seasonId) {
      const found = all.find(a => a.seasonId === seasonId);
      return found || { seasonId, orangeCap: '', purpleCap: '', highestScore: '', bestBowling: '', most100s: '', most50s: '', sixes: '', fours: '', boundaries: '' };
    }
    return all;
  }
  saveAwards(seasonId, awards) {
    const all = this._get('lca_awards');
    const idx = all.findIndex(a => a.seasonId === seasonId);
    awards.seasonId = seasonId;
    if (idx !== -1) {
      all[idx] = awards;
    } else {
      awards.id = generateId();
      all.push(awards);
    }
    this._set('lca_awards', all);
    
    this.pushToFirebase('awards', awards.id || seasonId, awards);
    return awards;
  }

  // --- Group Meetings & Chat ---
  getGroupMeetings(seasonId) {
    const all = this._get('lca_group_meetings');
    return seasonId ? all.filter(m => m.seasonId === seasonId) : all;
  }
  addGroupMeeting(meeting) {
    const meetings = this._get('lca_group_meetings');
    meeting.id = meeting.id || generateId();
    meeting.createdAt = meeting.createdAt || new Date().toISOString();
    meeting.messages = meeting.messages || [];
    meeting.invitedUsers = meeting.invitedUsers || [];
    meetings.push(meeting);
    this._set('lca_group_meetings', meetings);
    
    this.pushToFirebase('group_meetings', meeting.id, meeting);
    return meeting;
  }
  deleteGroupMeeting(id) {
    this._set('lca_group_meetings', this._get('lca_group_meetings').filter(m => m.id !== id));
    this.pushToFirebase('group_meetings', id, null, true);
  }
  addChatMessage(meetingId, message) {
    const meetings = this._get('lca_group_meetings');
    const idx = meetings.findIndex(m => m.id === meetingId);
    if (idx !== -1) {
      meetings[idx].messages = meetings[idx].messages || [];
      meetings[idx].messages.push(message);
      this._set('lca_group_meetings', meetings);
      this.pushToFirebase('group_meetings', meetingId, meetings[idx]);
      return meetings[idx];
    }
    return null;
  }
  inviteUserToMeeting(meetingId, username) {
    const meetings = this._get('lca_group_meetings');
    const idx = meetings.findIndex(m => m.id === meetingId);
    if (idx !== -1) {
      meetings[idx].invitedUsers = meetings[idx].invitedUsers || [];
      if (!meetings[idx].invitedUsers.includes(username)) {
        meetings[idx].invitedUsers.push(username);
        this._set('lca_group_meetings', meetings);
        this.pushToFirebase('group_meetings', meetingId, meetings[idx]);
      }
      return meetings[idx];
    }
    return null;
  }

  // --- Notifications ---
  getNotifications() {
    return this._get('lca_notifications') || [];
  }
  addNotification(notification) {
    const notifications = this.getNotifications();
    notification.id = notification.id || generateId();
    notification.createdAt = notification.createdAt || new Date().toISOString();
    notification.read = notification.read !== undefined ? notification.read : false;
    notifications.push(notification);
    this._set('lca_notifications', notifications);
    this.pushToFirebase('notifications', notification.id, notification);
    return notification;
  }
  markNotificationAsRead(id) {
    const notifications = this.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = true;
      this._set('lca_notifications', notifications);
      this.pushToFirebase('notifications', id, notifications[idx]);
    }
  }
  markAllNotificationsAsRead(recipient) {
    const notifications = this.getNotifications();
    let updated = false;
    notifications.forEach(n => {
      if ((n.recipient === recipient || n.recipient === 'all') && !n.read) {
        n.read = true;
        updated = true;
        this.pushToFirebase('notifications', n.id, n);
      }
    });
    if (updated) {
      this._set('lca_notifications', notifications);
    }
  }
  deleteNotification(id) {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    this._set('lca_notifications', notifications);
    this.pushToFirebase('notifications', id, null, true);
  }
}

export const store = new DataStore();
