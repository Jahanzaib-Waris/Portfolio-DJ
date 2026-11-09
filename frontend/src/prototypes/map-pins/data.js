// Made-up pins for the map demo. Names, places and details are fictional.
export const ORIGIN = { x: 500, y: 330 }

export const CATEGORIES = ['Sport', 'Food', 'Music', 'Outdoors', 'Tech', 'Art']

export const CATEGORY_COLOURS = {
  Sport: '#4FD6A0',
  Food: '#FFC14D',
  Music: '#FF8FB8',
  Outdoors: '#3FCBC0',
  Tech: '#6FB7FF',
  Art: '#B39DFF',
}

export const pins = [
  { id: 'p1', type: 'person', name: 'Maya Chen', category: 'Outdoors', x: 560, y: 290, online: true, detail: 'Weekend climber. Looking for a belay partner.' },
  { id: 'p2', type: 'person', name: 'Jonas Weber', category: 'Food', x: 380, y: 400, online: false, detail: 'Cooks for ten, eats with three. Always room at the table.' },
  { id: 'p3', type: 'person', name: 'Priya Nair', category: 'Sport', x: 640, y: 210, online: true, detail: 'Runs at 6am. Will happily slow down for company.' },
  { id: 'p4', type: 'person', name: 'Leo Martins', category: 'Tech', x: 250, y: 250, online: true, detail: 'Indie game dev. Open to playtesting swaps.' },
  { id: 'p5', type: 'person', name: 'Sofia Rossi', category: 'Art', x: 720, y: 440, online: false, detail: 'Ceramics studio on weekends. Happy to teach beginners.' },
  { id: 'p6', type: 'person', name: 'Amir Hassan', category: 'Food', x: 830, y: 330, online: true, detail: 'Hunting for the best ramen in the city.' },
  { id: 'p7', type: 'person', name: 'Hannah Lee', category: 'Music', x: 470, y: 170, online: false, detail: 'Plays violin, wants to start a small trio.' },
  { id: 'p8', type: 'person', name: 'Tomas Novak', category: 'Outdoors', x: 150, y: 470, online: true, detail: 'Runs the community garden on Saturdays.' },
  { id: 'p9', type: 'person', name: 'Aisha Okafor', category: 'Sport', x: 590, y: 520, online: true, detail: 'Starting a Sunday five-a-side. Need two more.' },
  { id: 'j1', type: 'project', name: 'Sunday five-a-side', category: 'Sport', x: 610, y: 470, when: 'Sun 10:00', going: 8, spots: 10, detail: 'Friendly game, all levels. Bring water.' },
  { id: 'j2', type: 'project', name: 'Community garden day', category: 'Outdoors', x: 180, y: 430, when: 'Sat 09:00', going: 14, spots: 20, detail: 'Planting, composting and a shared lunch.' },
  { id: 'j3', type: 'project', name: 'Open mic night', category: 'Music', x: 430, y: 250, when: 'Fri 19:30', going: 22, spots: 40, detail: 'Five-minute slots. Sign up at the door.' },
  { id: 'j4', type: 'project', name: 'Startup coffee meetup', category: 'Tech', x: 700, y: 300, when: 'Wed 08:00', going: 11, spots: 15, detail: 'Founders and builders, no pitches allowed.' },
  { id: 'j5', type: 'project', name: 'Street food crawl', category: 'Food', x: 330, y: 330, when: 'Sat 18:00', going: 9, spots: 12, detail: 'Five stalls, one evening, split the bill.' },
  { id: 'j6', type: 'project', name: 'Life drawing session', category: 'Art', x: 800, y: 130, when: 'Thu 19:00', going: 6, spots: 12, detail: 'Materials provided. Beginners welcome.' },
  { id: 'j7', type: 'project', name: 'Sunrise trail run', category: 'Outdoors', x: 90, y: 160, when: 'Sun 06:30', going: 7, spots: 15, detail: '8 km loop, easy pace, coffee after.' },
]
