-- Seed Data for Quiz Application
-- 5 Lectures: 3 with 2 sections, 2 with 1 section
-- Each lecture has 10 questions with mixed types and difficulties

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM questions;
-- DELETE FROM lectures;

DO $$
DECLARE
  lec1_id UUID;
  lec2_id UUID;
  lec3_id UUID;
  lec4_id UUID;
  lec5_id UUID;
BEGIN

-- ============================================
-- LECTURES
-- ============================================

-- Lecture 1: Atomic Structure (2 sections)
INSERT INTO lectures (title, description, sections, order_index, created_at)
VALUES (
  'Atomic Structure',
  'Understanding the fundamental building blocks of matter',
  ARRAY['Subatomic Particles', 'Electron Configuration'],
  1,
  NOW()
) RETURNING id INTO lec1_id;

-- Lecture 2: Chemical Bonding (2 sections)
INSERT INTO lectures (title, description, sections, order_index, created_at)
VALUES (
  'Chemical Bonding',
  'Exploring how atoms combine to form molecules',
  ARRAY['Ionic Bonds', 'Covalent Bonds'],
  2,
  NOW()
) RETURNING id INTO lec2_id;

-- Lecture 3: Thermodynamics (2 sections)
INSERT INTO lectures (title, description, sections, order_index, created_at)
VALUES (
  'Thermodynamics',
  'Energy transformations in chemical reactions',
  ARRAY['Laws of Thermodynamics', 'Enthalpy and Entropy'],
  3,
  NOW()
) RETURNING id INTO lec3_id;

-- Lecture 4: Organic Chemistry (1 section)
INSERT INTO lectures (title, description, sections, order_index, created_at)
VALUES (
  'Organic Chemistry Basics',
  'Introduction to carbon-based compounds',
  ARRAY['Hydrocarbons'],
  4,
  NOW()
) RETURNING id INTO lec4_id;

-- Lecture 5: Acids and Bases (1 section)
INSERT INTO lectures (title, description, sections, order_index, created_at)
VALUES (
  'Acids and Bases',
  'pH, neutralization, and acid-base equilibrium',
  ARRAY['pH Scale and Indicators'],
  5,
  NOW()
) RETURNING id INTO lec5_id;

-- ============================================
-- QUESTIONS FOR LECTURE 1: Atomic Structure
-- ============================================

-- Question 1: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which subatomic particle has a positive charge?',
  'multiple-choice',
  'easy',
  ARRAY['Electron', 'Proton', 'Neutron', 'Photon'],
  1,
  'Protons are positively charged particles found in the nucleus of an atom.',
  lec1_id,
  'Subatomic Particles'
);

-- Question 2: True/False - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Electrons are found in the nucleus of an atom.',
  'true-false',
  'easy',
  ARRAY['True', 'False'],
  1,
  'Electrons orbit around the nucleus in electron shells, they are not inside the nucleus.',
  lec1_id,
  'Subatomic Particles'
);

-- Question 3: Fill in the Blank - Medium
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The atomic number of an element is determined by the number of _____ in its nucleus.',
  'blank',
  'medium',
  'protons',
  'The atomic number equals the number of protons, which defines the element.',
  lec1_id,
  'Subatomic Particles'
);

-- Question 4: Multiple Choice - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the maximum number of electrons in the second electron shell?',
  'multiple-choice',
  'medium',
  ARRAY['2', '8', '18', '32'],
  1,
  'The second shell can hold a maximum of 8 electrons (2n² where n=2).',
  lec1_id,
  'Electron Configuration'
);

-- Question 5: True/False - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'The electron configuration of Neon is 1s² 2s² 2p⁶.',
  'true-false',
  'medium',
  ARRAY['True', 'False'],
  0,
  'Neon has 10 electrons, filling the first and second shells completely.',
  lec1_id,
  'Electron Configuration'
);

-- Question 6: Fill in the Blank - Hard
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The principle that states no two electrons can have the same set of quantum numbers is called the _____ Exclusion Principle.',
  'blank',
  'hard',
  'Pauli',
  'The Pauli Exclusion Principle is fundamental to understanding electron configuration.',
  lec1_id,
  'Electron Configuration'
);

-- Question 7: Multiple Choice - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which element has the electron configuration [Ar] 3d¹⁰ 4s² 4p³?',
  'multiple-choice',
  'hard',
  ARRAY['Phosphorus', 'Arsenic', 'Antimony', 'Bismuth'],
  1,
  'Arsenic (As) has atomic number 33, with this electron configuration.',
  lec1_id,
  'Electron Configuration'
);

-- Question 8: True/False - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Isotopes of an element have different numbers of protons.',
  'true-false',
  'hard',
  ARRAY['True', 'False'],
  1,
  'Isotopes have the same number of protons but different numbers of neutrons.',
  lec1_id,
  'Subatomic Particles'
);

-- Question 9: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the charge of a neutron?',
  'multiple-choice',
  'easy',
  ARRAY['Positive', 'Negative', 'Neutral', 'Variable'],
  2,
  'Neutrons have no electrical charge, hence the name "neutral".',
  lec1_id,
  'Subatomic Particles'
);

-- Question 10: Fill in the Blank - Easy
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The mass of an atom is concentrated in its _____.',
  'blank',
  'easy',
  'nucleus',
  'The nucleus contains protons and neutrons, which account for nearly all the atomic mass.',
  lec1_id,
  'Subatomic Particles'
);

-- ============================================
-- QUESTIONS FOR LECTURE 2: Chemical Bonding
-- ============================================

-- Question 11: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What type of bond forms when electrons are transferred from one atom to another?',
  'multiple-choice',
  'easy',
  ARRAY['Covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'],
  1,
  'Ionic bonds form through the transfer of electrons, creating oppositely charged ions.',
  lec2_id,
  'Ionic Bonds'
);

-- Question 12: True/False - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Covalent bonds involve the sharing of electrons between atoms.',
  'true-false',
  'easy',
  ARRAY['True', 'False'],
  0,
  'Covalent bonds are formed when atoms share pairs of electrons.',
  lec2_id,
  'Covalent Bonds'
);

-- Question 13: Fill in the Blank - Medium
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'A bond formed between a metal and a non-metal is typically a(n) _____ bond.',
  'blank',
  'medium',
  'ionic',
  'Metals tend to lose electrons and non-metals gain them, forming ionic bonds.',
  lec2_id,
  'Ionic Bonds'
);

-- Question 14: Multiple Choice - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'How many covalent bonds does a carbon atom typically form?',
  'multiple-choice',
  'medium',
  ARRAY['2', '3', '4', '5'],
  2,
  'Carbon has 4 valence electrons and typically forms 4 covalent bonds.',
  lec2_id,
  'Covalent Bonds'
);

-- Question 15: True/False - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Ionic compounds conduct electricity when dissolved in water.',
  'true-false',
  'medium',
  ARRAY['True', 'False'],
  0,
  'When dissolved, ionic compounds dissociate into ions which can carry electric current.',
  lec2_id,
  'Ionic Bonds'
);

-- Question 16: Fill in the Blank - Hard
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The ability of an atom to attract electrons in a chemical bond is called _____.',
  'blank',
  'hard',
  'electronegativity',
  'Electronegativity determines how strongly atoms attract bonding electrons.',
  lec2_id,
  'Covalent Bonds'
);

-- Question 17: Multiple Choice - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which molecule has a polar covalent bond?',
  'multiple-choice',
  'hard',
  ARRAY['O₂', 'H₂O', 'N₂', 'Cl₂'],
  1,
  'Water has polar covalent bonds due to the difference in electronegativity between H and O.',
  lec2_id,
  'Covalent Bonds'
);

-- Question 18: True/False - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'All ionic compounds are soluble in water.',
  'true-false',
  'hard',
  ARRAY['True', 'False'],
  1,
  'Not all ionic compounds are soluble; solubility depends on lattice energy and hydration energy.',
  lec2_id,
  'Ionic Bonds'
);

-- Question 19: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the formula for sodium chloride?',
  'multiple-choice',
  'easy',
  ARRAY['NaCl₂', 'NaCl', 'Na₂Cl', 'NaCl₃'],
  1,
  'Sodium chloride is a 1:1 ionic compound with the formula NaCl.',
  lec2_id,
  'Ionic Bonds'
);

-- Question 20: Fill in the Blank - Easy
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'A double covalent bond involves the sharing of _____ pairs of electrons.',
  'blank',
  'easy',
  'two',
  'A double bond consists of two shared electron pairs between atoms.',
  lec2_id,
  'Covalent Bonds'
);

-- ============================================
-- QUESTIONS FOR LECTURE 3: Thermodynamics
-- ============================================

-- Question 21: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What does the First Law of Thermodynamics state?',
  'multiple-choice',
  'easy',
  ARRAY['Energy cannot be created or destroyed', 'Entropy always increases', 'Heat flows from hot to cold', 'Work equals force times distance'],
  0,
  'The First Law states that energy is conserved in any process.',
  lec3_id,
  'Laws of Thermodynamics'
);

-- Question 22: True/False - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'An exothermic reaction releases heat to the surroundings.',
  'true-false',
  'easy',
  ARRAY['True', 'False'],
  0,
  'Exothermic reactions release energy, usually in the form of heat.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 23: Fill in the Blank - Medium
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The measure of disorder or randomness in a system is called _____.',
  'blank',
  'medium',
  'entropy',
  'Entropy (S) quantifies the degree of disorder in a thermodynamic system.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 24: Multiple Choice - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the symbol for enthalpy change?',
  'multiple-choice',
  'medium',
  ARRAY['ΔS', 'ΔH', 'ΔG', 'ΔE'],
  1,
  'ΔH represents the change in enthalpy during a reaction.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 25: True/False - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'The Second Law of Thermodynamics states that entropy of an isolated system always increases.',
  'true-false',
  'medium',
  ARRAY['True', 'False'],
  0,
  'The Second Law indicates that natural processes increase the total entropy of the universe.',
  lec3_id,
  'Laws of Thermodynamics'
);

-- Question 26: Fill in the Blank - Hard
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The Gibbs free energy equation is ΔG = ΔH - _____.',
  'blank',
  'hard',
  'TΔS',
  'The complete equation is ΔG = ΔH - TΔS, where T is temperature in Kelvin.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 27: Multiple Choice - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'A reaction is spontaneous when ΔG is:',
  'multiple-choice',
  'hard',
  ARRAY['Positive', 'Negative', 'Zero', 'Undefined'],
  1,
  'Negative ΔG indicates a spontaneous reaction under constant temperature and pressure.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 28: True/False - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Endothermic reactions always have a positive entropy change.',
  'true-false',
  'hard',
  ARRAY['True', 'False'],
  1,
  'Entropy change depends on the disorder of products vs reactants, not just heat absorption.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 29: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which process absorbs heat from the surroundings?',
  'multiple-choice',
  'easy',
  ARRAY['Exothermic', 'Endothermic', 'Isothermal', 'Adiabatic'],
  1,
  'Endothermic processes absorb heat, causing the surroundings to cool.',
  lec3_id,
  'Enthalpy and Entropy'
);

-- Question 30: Fill in the Blank - Easy
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The Third Law of Thermodynamics states that the entropy of a perfect crystal at absolute zero is _____.',
  'blank',
  'easy',
  'zero',
  'At 0 K, a perfect crystal has minimum possible disorder, hence zero entropy.',
  lec3_id,
  'Laws of Thermodynamics'
);

-- ============================================
-- QUESTIONS FOR LECTURE 4: Organic Chemistry
-- ============================================

-- Question 31: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What element is the basis of all organic compounds?',
  'multiple-choice',
  'easy',
  ARRAY['Hydrogen', 'Oxygen', 'Carbon', 'Nitrogen'],
  2,
  'Carbon is the fundamental element in all organic chemistry.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 32: True/False - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Hydrocarbons contain only carbon and hydrogen atoms.',
  'true-false',
  'easy',
  ARRAY['True', 'False'],
  0,
  'By definition, hydrocarbons are composed exclusively of carbon and hydrogen.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 33: Fill in the Blank - Medium
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The simplest alkane is _____, with the formula CH₄.',
  'blank',
  'medium',
  'methane',
  'Methane is the first member of the alkane series.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 34: Multiple Choice - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the general formula for alkanes?',
  'multiple-choice',
  'medium',
  ARRAY['CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙHₙ'],
  1,
  'Alkanes follow the general formula CₙH₂ₙ₊₂ for saturated hydrocarbons.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 35: True/False - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Alkenes contain at least one carbon-carbon double bond.',
  'true-false',
  'medium',
  ARRAY['True', 'False'],
  0,
  'Alkenes are characterized by the presence of C=C double bonds.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 36: Fill in the Blank - Hard
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'Compounds with the same molecular formula but different structural arrangements are called _____.',
  'blank',
  'hard',
  'isomers',
  'Isomers have identical molecular formulas but different structural or spatial arrangements.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 37: Multiple Choice - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which type of hydrocarbon contains a benzene ring?',
  'multiple-choice',
  'hard',
  ARRAY['Alkane', 'Alkene', 'Alkyne', 'Aromatic'],
  3,
  'Aromatic hydrocarbons contain benzene rings with delocalized electrons.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 38: True/False - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'All hydrocarbons are polar molecules.',
  'true-false',
  'hard',
  ARRAY['True', 'False'],
  1,
  'Hydrocarbons are generally nonpolar due to similar electronegativities of C and H.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 39: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the molecular formula for ethane?',
  'multiple-choice',
  'easy',
  ARRAY['CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀'],
  1,
  'Ethane is the second alkane with 2 carbon atoms and 6 hydrogen atoms.',
  lec4_id,
  'Hydrocarbons'
);

-- Question 40: Fill in the Blank - Easy
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'Alkynes contain at least one carbon-carbon _____ bond.',
  'blank',
  'easy',
  'triple',
  'Alkynes are characterized by C≡C triple bonds.',
  lec4_id,
  'Hydrocarbons'
);

-- ============================================
-- QUESTIONS FOR LECTURE 5: Acids and Bases
-- ============================================

-- Question 41: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the pH of a neutral solution at 25°C?',
  'multiple-choice',
  'easy',
  ARRAY['0', '7', '14', '1'],
  1,
  'Pure water at 25°C has a pH of 7, which is neutral.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 42: True/False - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Acids have a pH less than 7.',
  'true-false',
  'easy',
  ARRAY['True', 'False'],
  0,
  'Acidic solutions have pH values below 7 on the pH scale.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 43: Fill in the Blank - Medium
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The pH scale ranges from 0 to _____.',
  'blank',
  'medium',
  '14',
  'The pH scale typically ranges from 0 (most acidic) to 14 (most basic).',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 44: Multiple Choice - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Which indicator turns pink in basic solutions?',
  'multiple-choice',
  'medium',
  ARRAY['Litmus', 'Phenolphthalein', 'Methyl orange', 'Bromothymol blue'],
  1,
  'Phenolphthalein is colorless in acid and turns pink/magenta in basic solutions.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 45: True/False - Medium
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'A solution with pH 3 is ten times more acidic than a solution with pH 4.',
  'true-false',
  'medium',
  ARRAY['True', 'False'],
  0,
  'The pH scale is logarithmic, so each unit represents a 10-fold difference in H⁺ concentration.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 46: Fill in the Blank - Hard
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'The negative logarithm of hydrogen ion concentration is called _____.',
  'blank',
  'hard',
  'pH',
  'pH is defined as -log[H⁺], providing a convenient scale for acidity.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 47: Multiple Choice - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What is the pH of a 0.01 M HCl solution?',
  'multiple-choice',
  'hard',
  ARRAY['1', '2', '3', '4'],
  1,
  'HCl is a strong acid that fully dissociates. pH = -log(0.01) = 2.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 48: True/False - Hard
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'Buffer solutions resist changes in pH when small amounts of acid or base are added.',
  'true-false',
  'hard',
  ARRAY['True', 'False'],
  0,
  'Buffers contain weak acid-base pairs that neutralize added acids or bases.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 49: Multiple Choice - Easy
INSERT INTO questions (text, type, difficulty, options, correct_index, explanation, lecture_id, section_id)
VALUES (
  'What color does blue litmus paper turn in an acid?',
  'multiple-choice',
  'easy',
  ARRAY['Blue', 'Red', 'Green', 'Yellow'],
  1,
  'Blue litmus paper turns red in acidic solutions.',
  lec5_id,
  'pH Scale and Indicators'
);

-- Question 50: Fill in the Blank - Easy
INSERT INTO questions (text, type, difficulty, correct_answer, explanation, lecture_id, section_id)
VALUES (
  'Solutions with pH greater than 7 are classified as _____.',
  'blank',
  'easy',
  'basic',
  'Basic (or alkaline) solutions have pH values above 7.',
  lec5_id,
  'pH Scale and Indicators'
);

END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- Total Lectures: 5
-- - Lecture 1: Atomic Structure (2 sections) - 10 questions
-- - Lecture 2: Chemical Bonding (2 sections) - 10 questions
-- - Lecture 3: Thermodynamics (2 sections) - 10 questions
-- - Lecture 4: Organic Chemistry (1 section) - 10 questions
-- - Lecture 5: Acids and Bases (1 section) - 10 questions
--
-- Total Questions: 50
-- Question Types: Multiple Choice, True/False, Fill in the Blank
-- Difficulty Levels: Easy, Medium, Hard (distributed randomly)
