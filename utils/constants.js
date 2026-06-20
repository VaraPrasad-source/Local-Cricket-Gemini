// ============================================
// CONSTANTS
// ============================================

export const ADMIN_PASSWORD = '2011';

export const PLAYER_ROLES = ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];

export const MATCH_STATUSES = ['upcoming', 'live', 'completed'];

export const TOSS_DECISIONS = ['Bat', 'Bowl'];

export const TABS = {
  MATCH_DETAILS: 'match-details',
  STARS: 'stars',
  POINTS_TABLE: 'points-table',
  SCHEDULE: 'schedule',
  TEAM_MEMBERS: 'team-members',
  GROUP_MEETINGS: 'group-meetings'
};

export const TAB_CONFIG = [
  { id: TABS.MATCH_DETAILS, label: 'Season Match Details', icon: 'sports_cricket' },
  { id: TABS.STARS, label: 'Stars', icon: 'star' },
  { id: TABS.POINTS_TABLE, label: 'Points Table', icon: 'leaderboard' },
  { id: TABS.SCHEDULE, label: 'Schedule', icon: 'calendar_month' },
  { id: TABS.TEAM_MEMBERS, label: 'Team Members Details', icon: 'groups' },
  { id: TABS.GROUP_MEETINGS, label: 'Group Meetings', icon: 'forum' }
];

export const AWARD_TYPES = [
  { key: 'orangeCap', label: 'Orange Cap', color: 'orange' },
  { key: 'purpleCap', label: 'Purple Cap', color: 'purple' },
  { key: 'highestScore', label: 'Highest Scores', color: 'green' },
  { key: 'bestBowling', label: 'Best Bowling Figures', color: 'pink' },
  { key: 'most100s', label: 'Most 100s', color: 'green' },
  { key: 'most50s', label: 'Most 50s', color: 'purple' },
];

export const AWARD_BOTTOM = [
  { key: 'sixes', label: 'Sixes' },
  { key: 'fours', label: 'Fours' },
  { key: 'boundaries', label: 'Boundaries' },
];
