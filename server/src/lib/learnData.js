// CBSE-aligned learning content for the Students experience:
//   • syllabus       — NCERT/CBSE chapters per grade + subject (with topics)
//   • study_materials — notes, videos, worksheets and NCERT references
//   • quizzes         — interactive tests (metadata)
//   • quiz_questions  — MCQs with the correct answer + explanation
//   • quiz_attempts   — student attempt history (starts empty; filled at runtime)
//
// Chapter names follow the current NCERT textbooks so the content reads as a
// real CBSE syllabus. Kept in one module so both DEMO mode (mockData) and the
// Postgres seed can share the exact same data shape.
import config from '../config.js';

const SCHOOL = config.defaultSchoolId;

// ---- Syllabus (grade → subject → chapters) --------------------------------
// Each row is one chapter. `topics` are the sub-topics a student should master.
const SYLLABUS = [
  // ---- Grade 5 · Mathematics (Math-Magic) ----
  ['5', 'Mathematics', 1, 'The Fish Tale', ['Large numbers', 'Multiplication in daily life', 'Estimation']],
  ['5', 'Mathematics', 2, 'Shapes and Angles', ['Types of angles', 'Comparing angles', 'Angles in shapes']],
  ['5', 'Mathematics', 3, 'How Many Squares?', ['Area by counting squares', 'Perimeter', 'Comparing areas']],
  ['5', 'Mathematics', 4, 'Parts and Wholes', ['Fractions of a whole', 'Equivalent fractions', 'Fractions in daily life']],
  ['5', 'Mathematics', 5, 'Does it Look the Same?', ['Symmetry', 'Rotations', 'Patterns']],
  ['5', 'Mathematics', 6, "Be My Multiple, I'll be Your Factor", ['Factors', 'Multiples', 'Common factors & multiples']],
  ['5', 'Mathematics', 10, 'Tenths and Hundredths', ['Decimals', 'Place value', 'Money & measurement']],

  // ---- Grade 5 · EVS (Looking Around) ----
  ['5', 'EVS', 1, 'Super Senses', ['Animal senses', 'Observation', 'Adaptation']],
  ['5', 'EVS', 6, 'Every Drop Counts', ['Sources of water', 'Water scarcity', 'Rainwater harvesting']],
  ['5', 'EVS', 11, 'Sunita in Space', ['Gravity', 'Earth from space', 'Astronauts']],

  // ---- Grade 6 · Mathematics ----
  ['6', 'Mathematics', 1, 'Knowing Our Numbers', ['Comparing numbers', 'Large numbers', 'Estimation', 'Roman numerals']],
  ['6', 'Mathematics', 2, 'Whole Numbers', ['Number line', 'Properties', 'Patterns']],
  ['6', 'Mathematics', 3, 'Playing with Numbers', ['Factors & multiples', 'Prime & composite', 'Divisibility', 'HCF & LCM']],
  ['6', 'Mathematics', 6, 'Integers', ['Positive & negative', 'Number line', 'Addition & subtraction']],
  ['6', 'Mathematics', 7, 'Fractions', ['Types of fractions', 'Equivalent fractions', 'Operations']],
  ['6', 'Mathematics', 8, 'Decimals', ['Place value', 'Comparing decimals', 'Addition & subtraction']],
  ['6', 'Mathematics', 11, 'Algebra', ['Variables', 'Expressions', 'Simple equations']],
  ['6', 'Mathematics', 12, 'Ratio and Proportion', ['Ratio', 'Proportion', 'Unitary method']],

  // ---- Grade 6 · Science ----
  ['6', 'Science', 1, 'Food: Where Does It Come From?', ['Food sources', 'Plant & animal products', 'Ingredients']],
  ['6', 'Science', 2, 'Components of Food', ['Nutrients', 'Balanced diet', 'Deficiency diseases']],
  ['6', 'Science', 3, 'Fibre to Fabric', ['Natural fibres', 'Cotton & jute', 'Spinning & weaving']],
  ['6', 'Science', 4, 'Sorting Materials into Groups', ['Properties of materials', 'Solubility', 'Transparency']],
  ['6', 'Science', 10, 'Motion and Measurement of Distances', ['Standard units', 'Types of motion', 'Measurement']],
  ['6', 'Science', 11, 'Light, Shadows and Reflections', ['Luminous objects', 'Shadows', 'Pinhole camera', 'Mirrors']],
  ['6', 'Science', 12, 'Electricity and Circuits', ['Electric cell', 'Circuits', 'Conductors & insulators']],
  ['6', 'Science', 13, 'Fun with Magnets', ['Magnetic materials', 'Poles', 'Compass']],

  // ---- Grade 6 · Social Science ----
  ['6', 'Social Science', 1, 'What, Where, How and When? (History)', ['Sources of history', 'Manuscripts', 'Archaeology']],
  ['6', 'Social Science', 2, 'The Earth in the Solar System (Geography)', ['Planets', 'Stars', 'The Moon']],
  ['6', 'Social Science', 3, 'Globe: Latitudes and Longitudes (Geography)', ['Latitudes', 'Longitudes', 'Time zones']],
  ['6', 'Social Science', 4, 'Understanding Diversity (Civics)', ['Diversity in India', 'Unity in diversity', 'Prejudice']],

  // ---- Grade 6 · English (Honeysuckle) ----
  ['6', 'English', 1, 'Who Did Patrick’s Homework?', ['Reading comprehension', 'New words', 'Grammar: nouns']],
  ['6', 'English', 2, 'How the Dog Found Himself a New Master!', ['Comprehension', 'Adjectives', 'Story values']],

  // ---- Grade 7 · Science ----
  ['7', 'Science', 1, 'Nutrition in Plants', ['Photosynthesis', 'Autotrophs & heterotrophs', 'Parasites']],
  ['7', 'Science', 2, 'Nutrition in Animals', ['Digestive system', 'Nutrition in humans', 'Ruminants']],
  ['7', 'Science', 4, 'Heat', ['Temperature', 'Thermometers', 'Conduction & convection']],
  ['7', 'Science', 5, 'Acids, Bases and Salts', ['Indicators', 'Neutralisation', 'Everyday examples']],

  // ---- Grade 7 · Mathematics ----
  ['7', 'Mathematics', 1, 'Integers', ['Properties', 'Multiplication & division', 'Number line']],
  ['7', 'Mathematics', 2, 'Fractions and Decimals', ['Operations', 'Word problems', 'Conversions']],
  ['7', 'Mathematics', 6, 'The Triangle and its Properties', ['Medians & altitudes', 'Angle sum', 'Pythagoras']],

  // ---- Grade 8 · Science ----
  ['8', 'Science', 1, 'Crop Production and Management', ['Agricultural practices', 'Irrigation', 'Crop protection']],
  ['8', 'Science', 3, 'Coal and Petroleum', ['Natural resources', 'Fossil fuels', 'Conservation']],
  ['8', 'Science', 11, 'Force and Pressure', ['Types of forces', 'Pressure', 'Atmospheric pressure']],

  // ---- Grade 8 · Mathematics ----
  ['8', 'Mathematics', 1, 'Rational Numbers', ['Properties', 'Representation', 'Operations']],
  ['8', 'Mathematics', 2, 'Linear Equations in One Variable', ['Solving equations', 'Word problems', 'Applications']],
  ['8', 'Mathematics', 6, 'Squares and Square Roots', ['Perfect squares', 'Finding square roots', 'Estimation']],
];

// ---- Study materials -------------------------------------------------------
// [grade, subject, title, type, description, url, minutes]
const NCERT = 'https://ncert.nic.in/textbook.php';
const MATERIALS = [
  ['6', 'Science', 'Components of Food — Revision Notes', 'notes', 'Nutrients, balanced diet, and deficiency diseases summarised for quick revision.', NCERT, 12],
  ['6', 'Science', 'Balanced Diet — Concept Video', 'video', 'Animated explainer on carbohydrates, proteins, fats, vitamins and minerals.', 'https://www.youtube.com/results?search_query=components+of+food+class+6', 8],
  ['6', 'Science', 'Light & Shadows — Worksheet', 'worksheet', '15 practice questions on luminous objects, shadows and reflection.', NCERT, 20],
  ['6', 'Mathematics', 'Integers — Revision Notes', 'notes', 'Number line, addition and subtraction of integers with worked examples.', NCERT, 10],
  ['6', 'Mathematics', 'Fractions — Practice Sheet', 'worksheet', 'Mixed practice: equivalent fractions, comparison and operations.', NCERT, 25],
  ['6', 'Social Science', 'Latitudes & Longitudes — Notes', 'notes', 'Understand the globe, important lines and how time zones work.', NCERT, 10],
  ['5', 'Mathematics', 'Shapes and Angles — Notes', 'notes', 'Identify and compare acute, right and obtuse angles.', NCERT, 8],
  ['5', 'EVS', 'Every Drop Counts — Notes', 'notes', 'Sources of water, scarcity and rainwater harvesting.', NCERT, 9],
  ['7', 'Science', 'Nutrition in Plants — Notes', 'notes', 'Photosynthesis, autotrophs, heterotrophs and parasitic plants.', NCERT, 11],
  ['7', 'Mathematics', 'Integers — Notes', 'notes', 'Properties of integers, multiplication and division rules.', NCERT, 10],
  ['8', 'Science', 'Force and Pressure — Notes', 'notes', 'Contact and non-contact forces, pressure and atmospheric pressure.', NCERT, 12],
  ['8', 'Mathematics', 'Rational Numbers — Notes', 'notes', 'Closure, commutativity, and representation on the number line.', NCERT, 10],
];

// ---- Quizzes + questions ---------------------------------------------------
// A quiz groups MCQs. correct_index is 0-based; never sent to the client until
// after submission. difficulty drives the badge/points.
const QUIZ_DEFS = [
  {
    id: 'quiz-sci6-food', grade: '6', subject: 'Science', title: 'Components of Food',
    description: 'Nutrients, balanced diet and deficiency diseases.', difficulty: 'easy', duration_sec: 300,
    questions: [
      ['Which nutrient is the main source of energy for our body?', ['Proteins', 'Carbohydrates', 'Vitamins', 'Water'], 1, 'Carbohydrates are the body’s primary energy source.'],
      ['Scurvy is caused by the deficiency of which vitamin?', ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K'], 1, 'Vitamin C deficiency causes scurvy (bleeding gums).'],
      ['Which of these is a body-building food (rich in protein)?', ['Rice', 'Butter', 'Pulses', 'Sugar'], 2, 'Pulses (dals), eggs and milk are rich in proteins.'],
      ['The roughage in our food is provided mainly by:', ['Fats', 'Minerals', 'Dietary fibre', 'Proteins'], 2, 'Roughage/dietary fibre helps the body get rid of undigested food.'],
      ['A diet that has all nutrients in the right amount is called a:', ['Junk diet', 'Balanced diet', 'Liquid diet', 'Protein diet'], 1, 'A balanced diet contains all nutrients in adequate quantity.'],
    ],
  },
  {
    id: 'quiz-math6-int', grade: '6', subject: 'Mathematics', title: 'Integers',
    description: 'Positive & negative numbers on the number line.', difficulty: 'easy', duration_sec: 300,
    questions: [
      ['The additive inverse of −7 is:', ['7', '−7', '0', '1/7'], 0, 'The additive inverse of −7 is +7 because −7 + 7 = 0.'],
      ['(−3) + (+5) = ?', ['−8', '8', '2', '−2'], 2, 'Moving 5 steps right from −3 lands on +2.'],
      ['Which integer is greater: −10 or −3?', ['−10', '−3', 'Both equal', 'Cannot say'], 1, 'On the number line −3 is to the right of −10, so −3 is greater.'],
      ['The sum of an integer and its additive inverse is always:', ['1', '0', 'The integer itself', 'Negative'], 1, 'e.g. 9 + (−9) = 0.'],
      ['(−6) − (−4) = ?', ['−10', '−2', '2', '10'], 1, 'Subtracting −4 is adding +4: −6 + 4 = −2.'],
    ],
  },
  {
    id: 'quiz-sci6-light', grade: '6', subject: 'Science', title: 'Light, Shadows & Reflections',
    description: 'Luminous objects, shadows and mirrors.', difficulty: 'medium', duration_sec: 300,
    questions: [
      ['An object that gives out its own light is called:', ['Opaque', 'Luminous', 'Transparent', 'Translucent'], 1, 'The Sun and a bulb are luminous; they emit their own light.'],
      ['A shadow is always formed on the side:', ['Facing the light', 'Opposite to the light', 'Above the object', 'Around the object'], 1, 'Light travels in straight lines, so the shadow falls opposite the source.'],
      ['Which material is transparent?', ['Wood', 'Clear glass', 'Cardboard', 'A metal sheet'], 1, 'Light passes fully through transparent materials like clear glass.'],
      ['A pinhole camera forms an image that is:', ['Upright', 'Inverted', 'Coloured only', 'Invisible'], 1, 'Because light rays cross at the pinhole, the image is inverted.'],
      ['The image formed by a plane mirror is:', ['Real', 'Virtual and erect', 'Inverted', 'Bigger'], 1, 'A plane mirror forms a virtual, erect image of the same size.'],
    ],
  },
  {
    id: 'quiz-math5-angles', grade: '5', subject: 'Mathematics', title: 'Shapes and Angles',
    description: 'Identify and compare angles.', difficulty: 'easy', duration_sec: 240,
    questions: [
      ['An angle less than 90° is called:', ['Right angle', 'Acute angle', 'Obtuse angle', 'Straight angle'], 1, 'Acute angles are smaller than a right angle (90°).'],
      ['A right angle measures exactly:', ['45°', '90°', '180°', '360°'], 1, 'A right angle is 90°.'],
      ['A straight angle measures:', ['90°', '180°', '270°', '360°'], 1, 'A straight line makes an angle of 180°.'],
      ['An angle greater than 90° but less than 180° is:', ['Acute', 'Obtuse', 'Right', 'Reflex'], 1, 'Obtuse angles are between 90° and 180°.'],
      ['How many right angles are there in one full turn?', ['2', '3', '4', '6'], 2, 'A full turn is 360° = four right angles.'],
    ],
  },
  {
    id: 'quiz-sci7-nutrition', grade: '7', subject: 'Science', title: 'Nutrition in Plants',
    description: 'Photosynthesis and modes of nutrition.', difficulty: 'medium', duration_sec: 300,
    questions: [
      ['The process by which green plants make their own food is called:', ['Respiration', 'Photosynthesis', 'Digestion', 'Transpiration'], 1, 'Photosynthesis uses sunlight, water and CO₂ to make food.'],
      ['The green pigment that traps sunlight is:', ['Haemoglobin', 'Chlorophyll', 'Melanin', 'Carotene'], 1, 'Chlorophyll in leaves captures light energy.'],
      ['Plants that trap and eat insects (like the pitcher plant) are:', ['Parasites', 'Saprotrophs', 'Insectivorous', 'Autotrophs'], 2, 'Insectivorous plants get nitrogen by trapping insects.'],
      ['Which gas is taken in by plants during photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 2, 'Plants absorb CO₂ and release O₂ during photosynthesis.'],
      ['Cuscuta (amarbel) is an example of a:', ['Autotroph', 'Parasite', 'Insectivore', 'Saprotroph'], 1, 'Cuscuta is a parasitic plant that takes food from its host.'],
    ],
  },
];

export function buildLearnData() {
  const syllabus = SYLLABUS.map(([grade, subject, chapter_no, title, topics], i) => ({
    id: `syl-${grade}-${subject.replace(/\W+/g, '').toLowerCase()}-${chapter_no}`,
    school_id: SCHOOL, grade, subject, chapter_no, title, topics,
    term: chapter_no <= 7 ? 'Term 1' : 'Term 2', board: 'CBSE',
  }));

  const study_materials = MATERIALS.map(([grade, subject, title, type, description, url, minutes], i) => ({
    id: `mat-${i + 1}`, school_id: SCHOOL, grade, subject, title, type, description, url, minutes,
  }));

  const quizzes = [];
  const quiz_questions = [];
  for (const q of QUIZ_DEFS) {
    quizzes.push({
      id: q.id, school_id: SCHOOL, grade: q.grade, subject: q.subject, title: q.title,
      description: q.description, difficulty: q.difficulty, duration_sec: q.duration_sec,
      question_count: q.questions.length, total_marks: q.questions.length,
    });
    q.questions.forEach(([prompt, options, correct_index, explanation], idx) => {
      quiz_questions.push({
        id: `${q.id}-q${idx + 1}`, quiz_id: q.id, seq: idx + 1,
        prompt, options, correct_index, explanation, marks: 1,
      });
    });
  }

  return { syllabus, study_materials, quizzes, quiz_questions, quiz_attempts: [] };
}

export default buildLearnData;
