// Static platform data — schools, courses, lessons, professors, events, replays, pathways

export const media = {
  hero: 'https://images.unsplash.com/photo-1629161156834-67f7a989ca67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxwZWFjZWZ1bCUyMG5hdHVyZSUyMGxhbmRzY2FwZSUyMG1vcm5pbmclMjBzdW5yaXNlfGVufDB8fHx8MTc4MDYyNDUwMHww&ixlib=rb-4.1.0&q=85',
  wellness: 'https://images.pexels.com/photos/30539356/pexels-photo-30539356.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  life: 'https://images.pexels.com/photos/16157307/pexels-photo-16157307.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  campus: 'https://images.unsplash.com/photo-1621192754911-ffe0d95929dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBzdW5ueXxlbnwwfHx8fDE3ODA2MjQ1MDB8MA&ixlib=rb-4.1.0&q=85',
  texture: 'https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  nature: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
};

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
];

export const phasePreview = [
  { phase: 'Phase 2', title: 'Community & expanded learning', items: ['Support groups', 'Posts and comments', 'Audio/video lessons', 'Family plan', 'Additional schools'] },
  { phase: 'Phase 3', title: 'Advanced platform & scale', items: ['Live AI classes', 'Voice AI professors', 'Enterprise dashboards', 'Audit logging', 'Advanced reporting'] },
];

export const SCHOOLS = [
  {
    id: 'early-recovery',
    name: 'School of Early Recovery',
    description: 'Build day-by-day recovery foundations, relapse prevention skills, and supportive routines.',
    professor: 'Professor Hope',
    image: 'https://images.pexels.com/photos/1051075/pexels-photo-1051075.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'recovery-themed',
  },
  {
    id: 'mental-wellness',
    name: 'School of Mental Wellness',
    description: 'Mood tracking, emotional regulation, anxiety management, and mindfulness-based recovery.',
    professor: 'Professor Insight',
    image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'wellness-themed',
  },
  {
    id: 'family-recovery',
    name: 'School of Family Recovery',
    description: 'Support families with repair, education, boundaries, and compassionate communication.',
    professor: 'Professor Bridge',
    image: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'family-themed',
  },
  {
    id: 'active-addiction',
    name: 'School of Active Addiction Support',
    description: 'Harm reduction, stabilization strategies, and preparing for the first steps toward recovery.',
    professor: 'Professor Hope',
    image: 'https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'support-themed',
  },
  {
    id: 'faith-based',
    name: 'School of Faith-Based Recovery',
    description: 'Spiritual growth, purpose-driven recovery, and faith-informed healing practices.',
    professor: 'Professor Grace',
    image: 'https://images.pexels.com/photos/208052/pexels-photo-208052.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'faith-themed',
  },
  {
    id: 'parenting',
    name: 'School of Parenting in Recovery',
    description: 'Consistent parenting, repair scripts, child safety, and emotional attunement.',
    professor: 'Professor Nurture',
    image: 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'parenting-themed',
  },
  {
    id: 'financial-freedom',
    name: 'School of Financial Freedom',
    description: 'Rebuilding finances, debt navigation, budgeting, and economic empowerment.',
    professor: 'Professor Prosper',
    image: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'financial-themed',
  },
  {
    id: 'career-development',
    name: 'School of Career Development',
    description: 'Resume building, interview preparation, workplace reintegration, and career planning.',
    professor: 'Professor Horizon',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'career-themed',
  },
  {
    id: 'physical-wellness',
    name: 'School of Physical Wellness',
    description: 'Body care, sleep hygiene, movement, nutrition basics, and nervous-system regulation.',
    professor: 'Professor Strength',
    image: 'https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'wellness-themed',
  },
  {
    id: 'relapse-prevention',
    name: 'School of Relapse Prevention',
    description: 'Long-term prevention plans, trigger maps, support systems, and recovery identity.',
    professor: 'Professor Freedom',
    image: 'https://images.pexels.com/photos/1906439/pexels-photo-1906439.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    style: 'prevention-themed',
  },
];

export const COURSES = [
  {
    id: 'recovery-foundations',
    school_id: 'early-recovery',
    title: 'Recovery Foundations',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Hope',
    summary: 'A grounded starting path for cravings, routines, support systems, and identity rebuilding.',
    premium: false,
  },
  {
    id: 'emotional-awareness',
    school_id: 'mental-wellness',
    title: 'Emotional Awareness & Regulation',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Insight',
    summary: 'Understand your emotional landscape and develop daily practices for regulation.',
    premium: false,
  },
  {
    id: 'family-communication',
    school_id: 'family-recovery',
    title: 'Family Communication & Repair',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Bridge',
    summary: 'Create safer conversations, supportive boundaries, and repair agreements.',
    premium: false,
  },
  {
    id: 'stabilization-today',
    school_id: 'active-addiction',
    title: 'Stabilization Today',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Hope',
    summary: 'A safety-first pathway for cravings, risk moments, and readiness for support.',
    premium: false,
  },
  {
    id: 'parenting-repair',
    school_id: 'parenting',
    title: 'Parenting Repair & Consistency',
    difficulty: 'Intermediate',
    instructor_ai: 'Professor Nurture',
    summary: 'Supportive scripts, repair routines, consistency, and child-centered emotional safety.',
    premium: true,
  },
  {
    id: 'long-term-freedom',
    school_id: 'relapse-prevention',
    title: 'Long-Term Freedom Plan',
    difficulty: 'Advanced',
    instructor_ai: 'Professor Freedom',
    summary: 'Trigger mapping, recovery identity, relapse prevention, and sustainable support systems.',
    premium: true,
  },
  {
    id: 'financial-restart',
    school_id: 'financial-freedom',
    title: 'Financial Restart',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Prosper',
    summary: 'Rebuilding credit, budgeting basics, and economic confidence after addiction.',
    premium: true,
  },
  {
    id: 'family-support-foundations',
    school_id: 'family-recovery',
    title: 'Family Support Foundations',
    difficulty: 'Beginner',
    instructor_ai: 'Professor Bridge',
    summary: 'Family-specific education, boundaries, communication, safety planning, and support without rescuing.',
    premium: true,
  },
];

export const LESSONS = {
  'recovery-foundations': [
    {
      id: 'rf-lesson-1',
      title: 'Your Recovery Orientation',
      content: 'Recovery begins with honest orientation. Notice what strengthens you, what drains you, and who belongs on your support map. Today, write one safe person, one high-risk moment, and one action you can take before pressure builds.',
      reflection_prompt: 'What is one small thing you can do today that moves you toward recovery, even slightly?',
      quiz: [
        { question: 'What is the first step in building a support system?', options: ['Identifying safe people', 'Completing a program', 'Avoiding all social contact', 'Waiting until ready'], answer: 0 },
        { question: 'Recovery is most effective when:', options: ['Done alone', 'Personalized to your situation', 'Following only one method', 'Based on willpower'], answer: 1 },
      ],
    },
    {
      id: 'rf-lesson-2',
      title: 'Understanding Cravings',
      content: 'Cravings are temporary waves, not permanent states. The HALT method helps identify whether you are Hungry, Angry, Lonely, or Tired — common craving triggers. Learning to name what you feel reduces its power over your actions.',
      reflection_prompt: 'Describe a recent craving. Which HALT factor was present? What helped or could have helped?',
      quiz: [
        { question: 'What does HALT stand for?', options: ['Hungry, Angry, Lonely, Tired', 'Happy, Aware, Light, Thankful', 'Heal, Adapt, Learn, Trust', 'Help, Action, Listen, Think'], answer: 0 },
        { question: 'Cravings typically:', options: ['Last forever', 'Are permanent', 'Pass like waves', 'Always lead to relapse'], answer: 2 },
      ],
    },
    {
      id: 'rf-lesson-3',
      title: 'Building Daily Structure',
      content: 'Structure is recovery infrastructure. A consistent wake time, meals, movement, and wind-down routine reduces decision fatigue and creates predictability that supports sobriety. Start with three anchors: morning, midday, evening.',
      reflection_prompt: 'What three daily anchors could you realistically commit to this week?',
      quiz: [
        { question: 'Why does daily structure support recovery?', options: ['It fills time', 'It reduces decision fatigue', 'It prevents all cravings', 'It replaces therapy'], answer: 1 },
        { question: 'A good starting structure includes:', options: ['Only work hours', 'Morning, midday, and evening anchors', 'Only bedtime routines', 'Rigid hourly schedules'], answer: 1 },
      ],
    },
  ],
  'emotional-awareness': [
    {
      id: 'ea-lesson-1',
      title: 'The Emotion Wheel',
      content: 'Expanding your emotional vocabulary helps you communicate needs more precisely. Rather than "bad," you might feel "disappointed," "anxious," or "ashamed" — and each of these requires a different response. Naming reduces intensity.',
      reflection_prompt: 'Pick an emotion you felt today. What more specific word describes it? What did your body feel?',
      quiz: [
        { question: 'Why is emotional vocabulary important?', options: ['It helps you argue better', 'It allows more precise communication of needs', 'It makes you appear smarter', 'It replaces medication'], answer: 1 },
      ],
    },
    {
      id: 'ea-lesson-2',
      title: 'Grounding Techniques',
      content: 'The 5-4-3-2-1 technique anchors you to the present: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. This interrupts emotional escalation by engaging your senses and calming the nervous system.',
      reflection_prompt: 'Practice 5-4-3-2-1 right now. What did you notice?',
      quiz: [
        { question: 'Grounding techniques work by:', options: ['Suppressing emotions', 'Engaging senses to anchor you to the present', 'Distracting from problems', 'Encouraging positive thinking'], answer: 1 },
      ],
    },
  ],
  'family-communication': [
    {
      id: 'fc-lesson-1',
      title: 'Opening Safer Conversations',
      content: 'Safer conversations start with curiosity rather than accusation. Replace "You always" with "I notice" and "I feel" to shift from blame to understanding. This reduces defensiveness and opens space for genuine dialogue.',
      reflection_prompt: 'Write a sentence that starts with "You always..." then rewrite it starting with "I feel..." How does the tone change?',
      quiz: [
        { question: 'Safer conversations begin with:', options: ['Accusations', 'Curiosity and "I" statements', 'Demands', 'Silence'], answer: 1 },
      ],
    },
  ],
  'stabilization-today': [
    {
      id: 'st-lesson-1',
      title: 'Harm Reduction Basics',
      content: 'Harm reduction meets you where you are. It does not require complete abstinence to begin reducing risk. Small changes — using clean equipment, not using alone, having a safe person — meaningfully reduce harm and open doors.',
      reflection_prompt: 'What is one small harm-reduction step you could take today, regardless of where you are in recovery?',
      quiz: [
        { question: 'Harm reduction is based on:', options: ['Requiring immediate abstinence', 'Meeting people where they are', 'Punishment for use', 'Only inpatient treatment'], answer: 1 },
      ],
    },
  ],
};

export const PROFESSORS = [
  { id: 'hope', name: 'Professor Hope', avatar: '🌱', focus: 'Recovery planning', school: 'School of Early Recovery', personality: 'Warm encourager', voice: 'Gentle and steady', teaching_style: 'Evidence-based recovery with daily action steps' },
  { id: 'insight', name: 'Professor Insight', avatar: '🧠', focus: 'Mood and reflection', school: 'School of Mental Wellness', personality: 'Clear-eyed guide', voice: 'Calm and observant', teaching_style: 'Mindfulness-based emotional awareness' },
  { id: 'grace', name: 'Professor Grace', avatar: '✨', focus: 'Faith and spiritual growth', school: 'School of Faith-Based Recovery', personality: 'Peaceful guide', voice: 'Warm and faithful', teaching_style: 'Spiritually-integrated recovery paths' },
  { id: 'compass', name: 'Professor Compass', avatar: '🧭', focus: 'Life skills', school: 'School of Career Development', personality: 'Practical director', voice: 'Clear and focused', teaching_style: 'Step-by-step skill building' },
  { id: 'bridge', name: 'Professor Bridge', avatar: '🤝', focus: 'Family support', school: 'School of Family Recovery', personality: 'Repair-focused', voice: 'Steady and compassionate', teaching_style: 'Communication scripts and boundary work' },
  { id: 'nurture', name: 'Professor Nurture', avatar: '💙', focus: 'Parenting', school: 'School of Parenting in Recovery', personality: 'Patient parent coach', voice: 'Soft and encouraging', teaching_style: 'Child-centered attachment repair' },
  { id: 'prosper', name: 'Professor Prosper', avatar: '💰', focus: 'Financial freedom', school: 'School of Financial Freedom', personality: 'Shame-free mentor', voice: 'Grounded and practical', teaching_style: 'Step-by-step financial rebuilding' },
  { id: 'horizon', name: 'Professor Horizon', avatar: '🎯', focus: 'Career development', school: 'School of Career Development', personality: 'Future-focused coach', voice: 'Energized and clear', teaching_style: 'Goal-based career planning' },
  { id: 'strength', name: 'Professor Strength', avatar: '💪', focus: 'Physical wellness', school: 'School of Physical Wellness', personality: 'Grounded motivator', voice: 'Direct and encouraging', teaching_style: 'Movement and body-based recovery' },
  { id: 'freedom', name: 'Professor Freedom', avatar: '🦋', focus: 'Long-term recovery', school: 'School of Relapse Prevention', personality: 'Wise recovery mentor', voice: 'Calm and assured', teaching_style: 'Long-term identity and maintenance planning' },
  { id: 'voice', name: 'Professor Voice', avatar: '🗣️', focus: 'Communication', school: 'School of Family Recovery', personality: 'Clear conflict coach', voice: 'Direct and warm', teaching_style: 'Assertive communication and conflict resolution' },
  { id: 'legacy', name: 'Professor Legacy', avatar: '🌟', focus: 'Purpose and leadership', school: 'School of Career Development', personality: 'Visionary mentor', voice: 'Inspiring and grounded', teaching_style: 'Purpose discovery and leadership development' },
];

export const PATHWAYS = [
  { id: 'active-addiction', title: 'Active Addiction Support', description: 'Stabilization, harm reduction, and first steps toward change without requiring readiness for abstinence.', level: 'All levels' },
  { id: 'early-recovery', title: 'Early Recovery', description: 'Foundation building, craving management, daily structure, and initial support system development.', level: 'Beginner' },
  { id: 'family-member', title: 'Family Member Support', description: 'Education, communication tools, boundaries, and self-care for those supporting a loved one in recovery.', level: 'All levels' },
  { id: 'faith-based', title: 'Faith-Based Recovery', description: 'Spiritually integrated recovery combining evidence-based practices with personal faith traditions.', level: 'All levels' },
  { id: 'mental-wellness', title: 'Mental Wellness Focus', description: 'Emotional regulation, anxiety management, depression support, and daily mental health practices.', level: 'Beginner' },
  { id: 'parenting', title: 'Parenting in Recovery', description: 'Building parenting consistency, repair practices, and child-centered communication during recovery.', level: 'Intermediate' },
  { id: 'relationships', title: 'Relationships & Communication', description: 'Rebuilding trust, assertive communication, boundaries, and healthy relationship patterns.', level: 'Intermediate' },
  { id: 'financial-freedom', title: 'Financial Freedom Path', description: 'Rebuilding finances, budgeting, debt navigation, and economic confidence after addiction.', level: 'Intermediate' },
  { id: 'career-development', title: 'Career Development', description: 'Resume building, workplace reintegration, interview skills, and professional identity rebuilding.', level: 'Advanced' },
  { id: 'life-skills', title: 'Essential Life Skills', description: 'Cooking, time management, legal literacy, and daily living skills for independent recovery.', level: 'Beginner' },
];

export const PROGRAMS = [
  {
    id: 'early-recovery',
    school_name: 'School of Early Recovery',
    description: 'A complete first-year recovery curriculum covering foundations, cravings, structure, support, and relapse prevention.',
    professor: 'Professor Hope',
    graduation_pathway: ['Recovery Foundations', 'Craving Management', 'Daily Structure', 'Support Network', 'Long-Term Planning'],
    tracks: [
      {
        id: 'track-foundation',
        name: 'Foundation',
        graduation_requirement: 'Complete all 3 foundation modules',
        modules: [
          { id: 'mod-orientation', title: 'Recovery Orientation', lessons: [{ content: LESSONS['recovery-foundations']?.[0]?.content || '', quiz: LESSONS['recovery-foundations']?.[0]?.quiz || [] }], assignments: [{ id: 'asgn-1', title: 'My Recovery Map', prompt: 'Draw or describe your personal recovery map: supports, risks, goals, and next steps.' }] },
          { id: 'mod-cravings', title: 'Understanding Cravings', lessons: [{ content: LESSONS['recovery-foundations']?.[1]?.content || '', quiz: LESSONS['recovery-foundations']?.[1]?.quiz || [] }], assignments: [{ id: 'asgn-2', title: 'Craving Journal Week', prompt: 'Track cravings for one week. Note triggers, HALT factors, and what helped.' }] },
        ],
      },
    ],
  },
  {
    id: 'family-recovery',
    school_name: 'School of Family Recovery',
    description: 'A complete curriculum for family members and loved ones supporting someone in recovery.',
    professor: 'Professor Bridge',
    graduation_pathway: ['Family Foundations', 'Communication Skills', 'Boundaries', 'Self-Care', 'Long-Term Support'],
    tracks: [
      {
        id: 'track-family-foundation',
        name: 'Family Foundation',
        graduation_requirement: 'Complete all foundation modules',
        modules: [
          { id: 'mod-family-comm', title: 'Safer Communication', lessons: [{ content: LESSONS['family-communication']?.[0]?.content || '', quiz: LESSONS['family-communication']?.[0]?.quiz || [] }], assignments: [{ id: 'asgn-fam-1', title: 'Conversation Practice', prompt: 'Practice one "I feel" conversation this week and describe how it went.' }] },
        ],
      },
    ],
  },
];

export const EVENTS = [
  { id: 'evt-weekly-checkin', title: 'Weekly Recovery Check-In', type: 'office_hours', description: 'Open office hours with Professor Hope. Bring questions about your roadmap, cravings, routines, or any challenge you are facing.', professor: { name: 'Professor Hope', avatar: '🌱' }, replay_available: true, recurring: 'Weekly — Mondays 6pm ET' },
  { id: 'evt-family-workshop', title: 'Family Support Workshop', type: 'workshop', description: 'Professor Bridge leads a structured workshop for family members on communication, boundaries, and self-care without rescuing.', professor: { name: 'Professor Bridge', avatar: '🤝' }, replay_available: true, recurring: 'Bi-weekly — Wednesdays 7pm ET' },
  { id: 'evt-mindfulness', title: 'Mindfulness in Recovery', type: 'community_event', description: 'A guided mindfulness and grounding session for all recovery stages. No prior experience needed.', professor: { name: 'Professor Insight', avatar: '🧠' }, replay_available: false, recurring: 'Weekly — Fridays 12pm ET' },
  { id: 'evt-financial-qa', title: 'Financial Recovery Q&A', type: 'office_hours', description: 'Professor Prosper answers questions about budgeting, debt, rebuilding credit, and economic confidence in recovery.', professor: { name: 'Professor Prosper', avatar: '💰' }, replay_available: true, recurring: 'Monthly — First Saturday 2pm ET' },
];

export const LIVE_CLASSES = [
  { id: 'class-foundations-live', title: 'Recovery Foundations Live', type: 'live_text', description: 'A structured live session covering the core foundations of recovery with real-time AI guidance.', professor: { id: 'hope', name: 'Professor Hope', avatar: '🌱', teaching_style: 'Evidence-based with daily action steps' }, text_lesson: 'Recovery begins with one honest moment. Identify your three most important protective factors — people, practices, and places that reduce your risk and strengthen your resolve.', transcript: 'Today we explore the building blocks of early recovery: identifying supports, recognizing risk patterns, and creating a personal safety plan. Each of these has been shown to significantly improve outcomes.', recurring: 'Weekly', level: 'Beginner' },
  { id: 'class-emotional-live', title: 'Emotional Regulation Masterclass', type: 'live_video', description: 'Professor Insight guides students through evidence-based emotional regulation techniques.', professor: { id: 'insight', name: 'Professor Insight', avatar: '🧠', teaching_style: 'Mindfulness-based emotional awareness' }, text_lesson: 'Emotions are information, not commands. When you feel a difficult emotion, pause: name it, locate it in your body, breathe into it, then choose your response rather than react.', transcript: 'In this session we practice the STOP technique: Stop, Take a breath, Observe, Proceed. This mindfulness-based skill interrupts automatic emotional reactions and builds response flexibility.', recurring: 'Bi-weekly', level: 'Intermediate' },
  { id: 'class-family-live', title: 'Family Communication Workshop', type: 'live_text', description: 'An interactive session for families learning safer communication and supportive boundaries.', professor: { id: 'bridge', name: 'Professor Bridge', avatar: '🤝', teaching_style: 'Communication scripts and boundary work' }, text_lesson: 'Families heal through consistent, safe communication. This session introduces the DEAR MAN framework: Describe, Express, Assert, Reinforce, Mindfully, Appear confident, Negotiate.', transcript: 'Family communication in recovery requires patience and skill. We practice active listening, "I" statements, and the art of setting limits without ultimatums.', recurring: 'Monthly', level: 'Beginner' },
];

export const REPLAYS = [
  { id: 'replay-1', type: 'class', title: 'Recovery Foundations — Week 1', transcript: 'We covered the three pillars of early recovery: structure, support, and self-awareness. Students mapped their first 30 days and identified high-risk scenarios with corresponding safety strategies.', languages: ['English', 'Spanish', 'French', 'Portuguese'] },
  { id: 'replay-2', type: 'workshop', title: 'Family Communication — Boundaries Session', transcript: 'Professor Bridge walked families through the difference between boundaries and ultimatums, and practiced setting limits with compassion. Role-play exercises helped participants find their authentic voice.', languages: ['English', 'Spanish'] },
  { id: 'replay-3', type: 'class', title: 'Emotional Regulation — The STOP Technique', transcript: 'Professor Insight guided the group through mindfulness-based emotional regulation, focusing on the space between stimulus and response. Participants reported feeling more in control of their emotional reactions.', languages: ['English', 'French', 'Portuguese'] },
  { id: 'replay-4', type: 'office_hours', title: 'Financial Recovery Q&A — March Session', transcript: 'Professor Prosper answered questions about credit rebuilding, negotiating with creditors, and creating a bare-minimum budget. Key insight: track every dollar for 30 days before making major financial decisions.', languages: ['English', 'Spanish'] },
];

export const SUCCESS_STORIES = [
  { name: 'Marcus', story: 'After 8 years of alcohol use, I finally found a program that met me where I was. The daily structure lessons changed my mornings entirely — I wake up with purpose now instead of dread.' },
  { name: 'Rosa', story: 'I enrolled for my son, not myself. But the family communication course helped me stop rescuing and start truly supporting. Our relationship is rebuilding slowly and steadily.' },
  { name: 'James', story: 'The financial recovery module was the piece I was missing. I had sobriety but I was still drowning in shame about money. Professor Prosper helped me see a path forward.' },
];

export const SAMPLE_LESSONS = [
  { id: 'sample-1', course_id: 'Recovery Foundations', title: 'Your Recovery Orientation', sample_content: 'Recovery begins with honest orientation. Notice what strengthens you, what drains you, and who belongs on your support map.' },
  { id: 'sample-2', course_id: 'Emotional Awareness', title: 'The Emotion Wheel', sample_content: 'Expanding your emotional vocabulary helps you communicate needs more precisely and reduces emotional intensity.' },
  { id: 'sample-3', course_id: 'Family Communication', title: 'Opening Safer Conversations', sample_content: 'Safer conversations start with curiosity rather than accusation. Replace "You always" with "I notice" and "I feel."' },
  { id: 'sample-4', course_id: 'Stabilization Today', title: 'Harm Reduction Basics', sample_content: 'Harm reduction meets you where you are. Small changes meaningfully reduce risk and open doors to recovery.' },
  { id: 'sample-5', course_id: 'Long-Term Freedom', title: 'Building Your Prevention Plan', sample_content: 'A relapse prevention plan is not about fear — it is about confidence. Know your triggers, your supports, and your response plan.' },
  { id: 'sample-6', course_id: 'Parenting Repair', title: 'Repair Without Shame', sample_content: 'Every parent makes mistakes. Repair is the act of returning — with honesty, accountability, and a new attempt.' },
];

export const SUPPORT_INFO = {
  contact: 'support@clearpath.university',
  phone: '1-800-CLEAR-PATH',
  hours: 'Monday–Friday, 9am–6pm ET',
  crisis_note: 'If you or someone you know is in crisis, call or text 988 (Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line).',
  topics: ['Account access', 'Course progress', 'AI professor guidance', 'Subscription and billing', 'Certificate issues', 'Family support resources', 'Technical troubleshooting', 'Data export requests'],
  faqs: [
    'How do I reset my password?',
    'Can I change my subscription plan?',
    'How do AI professors remember my progress?',
    'Can I download my certificates?',
    'Is my journal private?',
    'How do I export my data?',
  ],
};

export const PLANS = [
  {
    id: 'free',
    name: 'Free Access',
    amount: 0,
    features: ['4 beginner courses', 'AI professor conversations', 'Daily check-ins and journal', 'Progress tracking', 'Basic certificates', 'Community events access'],
  },
  {
    id: 'premium',
    name: 'Premium Monthly',
    amount: 29,
    features: ['All 13 schools and 8+ courses', 'Unlimited AI professor sessions', 'Voice Studio access', 'Live classes and replays', 'Downloadable certificates', 'Priority support tickets', 'Multi-language content', 'Advanced analytics'],
  },
  {
    id: 'premium_annual',
    name: 'Premium Annual',
    amount: 199,
    features: ['Everything in Premium Monthly', 'Save $149 vs monthly', 'Exclusive annual cohort access', 'Annual progress report', 'Early access to new schools'],
  },
];
