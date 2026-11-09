// Survey options and made-up profiles for the matching demo. All names are fictional.

export const INTERESTS = ['Music', 'Fitness', 'Gaming', 'Cooking', 'Travel', 'Tech', 'Art', 'Outdoors']

export const CONNECT_OPTIONS = [
  { id: 'chat', label: 'Text chat' },
  { id: 'voice', label: 'Voice calls' },
  { id: 'meetups', label: 'In-person meetups' },
  { id: 'groups', label: 'Group activities' },
]

export const GOAL_OPTIONS = [
  { id: 'friends', label: 'Make friends' },
  { id: 'collaborators', label: 'Find collaborators' },
  { id: 'learn', label: 'Learn something new' },
  { id: 'browse', label: 'Just exploring' },
]

export const SOCIAL_LABELS = ['Very quiet', 'Quiet', 'Balanced', 'Social', 'Very social']
export const TIME_LABELS = ['An hour or less', 'A few hours', 'Several hours', 'Most evenings', 'Almost always on']
export const NEARBY_LABELS = ["Doesn't matter", 'Nice to have', 'Important', 'Must be close']

export const profiles = [
  { id: 1, name: 'Maya Chen', kind: 'person', blurb: 'Climber and board-game host.', interests: ['Outdoors', 'Gaming', 'Fitness'], social: 4, connect: ['meetups', 'groups'], goals: ['friends'], time: 3, distanceKm: 2 },
  { id: 2, name: 'Jonas Weber', kind: 'person', blurb: 'Cooks for the whole street.', interests: ['Cooking', 'Music', 'Travel'], social: 5, connect: ['meetups', 'groups'], goals: ['friends', 'learn'], time: 2, distanceKm: 5 },
  { id: 3, name: 'Priya Nair', kind: 'person', blurb: 'Early runs, late-night code.', interests: ['Fitness', 'Tech', 'Outdoors'], social: 3, connect: ['chat', 'voice'], goals: ['collaborators', 'friends'], time: 3, distanceKm: 1 },
  { id: 4, name: 'Leo Martins', kind: 'person', blurb: 'Indie game developer.', interests: ['Gaming', 'Tech', 'Art'], social: 2, connect: ['chat', 'voice'], goals: ['collaborators'], time: 5, distanceKm: 8 },
  { id: 5, name: 'Sofia Rossi', kind: 'person', blurb: 'Ceramics and weekend markets.', interests: ['Art', 'Cooking', 'Travel'], social: 3, connect: ['meetups'], goals: ['learn', 'friends'], time: 2, distanceKm: 3 },
  { id: 6, name: 'Hannah Lee', kind: 'person', blurb: 'Violinist starting a trio.', interests: ['Music', 'Art'], social: 3, connect: ['voice', 'meetups'], goals: ['collaborators'], time: 2, distanceKm: 4 },
  { id: 7, name: 'Tomas Novak', kind: 'person', blurb: 'Community garden organiser.', interests: ['Outdoors', 'Cooking'], social: 4, connect: ['groups', 'meetups'], goals: ['friends', 'learn'], time: 2, distanceKm: 9 },
  { id: 8, name: 'Kenji Mori', kind: 'person', blurb: 'Film cameras and night walks.', interests: ['Art', 'Travel', 'Outdoors'], social: 2, connect: ['chat', 'meetups'], goals: ['browse', 'friends'], time: 3, distanceKm: 5 },
  { id: 9, name: 'Weekend Hikers', kind: 'group', blurb: 'Easy trails every Sunday.', interests: ['Outdoors', 'Fitness', 'Travel'], social: 4, connect: ['groups', 'meetups'], goals: ['friends', 'browse'], time: 2, distanceKm: 6 },
  { id: 10, name: 'Indie Dev Circle', kind: 'group', blurb: 'Share builds, get feedback.', interests: ['Tech', 'Gaming', 'Art'], social: 3, connect: ['chat', 'voice'], goals: ['collaborators', 'learn'], time: 4, distanceKm: 12 },
  { id: 11, name: 'Supper Club', kind: 'group', blurb: 'Rotating dinners, new people.', interests: ['Cooking', 'Travel', 'Music'], social: 5, connect: ['meetups', 'groups'], goals: ['friends'], time: 2, distanceKm: 3 },
  { id: 12, name: 'Language Swap Hub', kind: 'group', blurb: 'Practice with native speakers.', interests: ['Travel', 'Tech'], social: 3, connect: ['voice', 'chat'], goals: ['learn', 'friends'], time: 3, distanceKm: 20 },
  { id: 13, name: 'Open Mic Collective', kind: 'group', blurb: 'Songs, poems and stand-up.', interests: ['Music', 'Art'], social: 5, connect: ['meetups', 'groups'], goals: ['collaborators', 'browse'], time: 3, distanceKm: 4 },
  { id: 14, name: 'Run Club 6am', kind: 'group', blurb: 'Three paces, one coffee after.', interests: ['Fitness', 'Outdoors'], social: 4, connect: ['groups', 'meetups'], goals: ['friends', 'browse'], time: 2, distanceKm: 2 },
]
