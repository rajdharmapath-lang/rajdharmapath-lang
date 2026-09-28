// This mirrors what the backend's GET /api/courses/batches and
// GET /api/courses/batches/:id/lessons endpoints will eventually return.
// Kept as local mock data for now so the video screens are usable stand-alone.

export const batches = [
  {
    id: 'foundation',
    name: 'Foundation Batch',
    subtitle: 'Built your basics',
    glyph: '基',
    videoCount: 10,
    colorBg: 'foundationBg',
    colorAccent: 'foundationRed',
  },
  {
    id: 'elevation',
    name: 'Elevation Batch',
    subtitle: 'Take your skills higher',
    glyph: '升',
    videoCount: 10,
    colorBg: 'elevationBg',
    colorAccent: 'elevationOrange',
  },
  {
    id: 'distinction',
    name: 'Distinction Batch',
    subtitle: 'Master like a pro',
    glyph: '优',
    videoCount: 10,
    colorBg: 'distinctionBg',
    colorAccent: 'distinctionPurple',
  },
];

export const liveClass = {
  status: 'Upcoming',
  scheduleLabel: 'Schedule Live Class Time : Date/Time',
  joinUrl: null, // set once the live-class screen/backend is wired up
};

export const lessonsByBatch = {
  foundation: [
    {
      id: 'f1',
      title: 'Welcome to Foundation',
      subtitle: 'Introduction',
      locked: false,
      videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    },
    { id: 'f2', title: 'Chinese Sounds (Pinyin)', subtitle: 'Vowels & Consonants', locked: true },
    { id: 'f3', title: 'Greeting', subtitle: 'Basic Greeting', locked: true },
    { id: 'f4', title: 'Self Introduction', subtitle: 'Introducing Yourself', locked: true },
    { id: 'f5', title: 'Numbers 1-10', subtitle: 'Basic Numbers', locked: true },
  ],
  elevation: [
    { id: 'e1', title: 'Sentence Building', subtitle: 'Structure Basics', locked: true },
    { id: 'e2', title: 'Daily Conversations', subtitle: 'Common Phrases', locked: true },
  ],
  distinction: [
    { id: 'd1', title: 'Advanced Grammar', subtitle: 'Fine Tuning', locked: true },
    { id: 'd2', title: 'Business Chinese', subtitle: 'Professional Use', locked: true },
  ],
};
