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
      title: 'Lesson 1',
      subtitle: 'Chinese Numbers',
      description: 'In this video, we will learn how to count numbers in Chinese Mandarin! Learn Chinese numbers with their Mandarin pronunciation and English meanings in a simple and easy way. This video is perfect for beginners who want to start learning Mandarin Chinese from the basics. Practice along with us and improve your Chinese speaking skills step by step.',
      locked: false,
    },
    {
      id: 'f2',
      title: 'Lesson 2',
      subtitle: 'Introductions and Family',
      description: 'In this video, learn how to introduce yourself in Chinese Mandarin, talk about your nationality, and describe your family members! Learn useful Mandarin words, simple sentences, pronunciation, and their English meanings to help you communicate confidently in everyday conversations. Whether you are a beginner or starting your Chinese learning journey, this lesson will help you build your Mandarin vocabulary step by step.',
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
