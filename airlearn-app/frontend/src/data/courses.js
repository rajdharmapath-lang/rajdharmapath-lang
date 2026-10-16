// This mirrors what the backend's GET /api/courses/batches and
// GET /api/courses/batches/:id/lessons endpoints will eventually return.
// Kept as local mock data for now so the video screens are usable stand-alone.

export const batches = [
  {
    id: 'foundation',
    name: 'Foundation Batch',
    subtitle: 'Built your basics',
    glyph: '基',
    colorBg: 'foundationBg',
    colorAccent: 'foundationRed',
  },
  {
    id: 'elevation',
    name: 'Elevation Batch',
    subtitle: 'Take your skills higher',
    glyph: '升',
    contentComingSoon: true,
    colorBg: 'elevationBg',
    colorAccent: 'elevationOrange',
  },
  {
    id: 'distinction',
    name: 'Distinction Batch',
    subtitle: 'Master like a pro',
    glyph: '优',
    contentComingSoon: true,
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
    },
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
