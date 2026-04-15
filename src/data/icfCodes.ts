// WHO-ICF DAT Codes - Copyright Reg. No. LD-20250171253, Date 12/08/2025
// Hemaraja Nayaka S, Dr. Vijayalakshmi Subramaniam, Dr. Jayashree Bhat

export interface ICFQualifier {
  value: number; label: string; color: string; description: string;
}

export interface ICFItem {
  code: string; name: string; description: string;
  inclusions?: string; exclusions?: string;
}

export const ICF_QUALIFIERS: ICFQualifier[] = [
  { value: 0, label: 'No Impairment', color: '#22c55e', description: 'The person has no problem' },
  { value: 1, label: 'Mild', color: '#eab308', description: 'Present <25% of time, tolerable, rarely over last 30 days' },
  { value: 2, label: 'Moderate', color: '#f97316', description: 'Present <50% of time, interfering, occasionally over last 30 days' },
  { value: 3, label: 'Severe', color: '#ef4444', description: 'Present >50% of time, partially disrupting, frequently over last 30 days' },
  { value: 4, label: 'Complete', color: '#991b1b', description: 'Present >95% of time, totally disrupting, every day over last 30 days' },
  { value: 8, label: 'Not Specified', color: '#9ca3af', description: 'Insufficient information' },
  { value: 9, label: 'Not Applicable', color: '#d1d5db', description: 'Inappropriate to apply this code' },
];

export const BODY_FUNCTIONS: ICFItem[] = [
  { code: 'b110', name: 'Consciousness functions', description: 'State of awareness and alertness', inclusions: 'Consciousness, coma, vegetative states, delirium, stupor', exclusions: 'b114, b130, b134' },
  { code: 'b114', name: 'Orientation functions', description: 'Knowing relation to self, others, time, surroundings', inclusions: 'Orientation to time, place, person', exclusions: 'b110, b140, b144' },
  { code: 'b140', name: 'Attention functions', description: 'Focusing on external stimulus or internal experience', inclusions: 'Sustaining, shifting, dividing attention; concentration', exclusions: 'b110, b130, b144' },
  { code: 'b130', name: 'Energy and drive functions', description: 'Physiological/psychological mechanisms for motivation', inclusions: 'Energy level, motivation, appetite, impulse control', exclusions: 'b110, b126, b134' },
  { code: 'b147', name: 'Psychomotor functions', description: 'Control over motor and psychological events', inclusions: 'Psychomotor control, retardation, excitement', exclusions: 'b110, b114, b117' },
  { code: 'b152', name: 'Emotional functions', description: 'Feeling and affective components', inclusions: 'Appropriateness, regulation, range of emotion', exclusions: 'b126, b130' },
  { code: 'b156', name: 'Perceptual functions', description: 'Recognizing and interpreting sensory stimuli', inclusions: 'Auditory, visual, olfactory, gustatory, tactile perception', exclusions: 'b110, b114, b140' },
  { code: 'b167', name: 'Mental functions of language', description: 'Recognizing and using language components', inclusions: 'Reception/expression of spoken, written language; aphasia', exclusions: 'b140, b144, b156' },
  { code: 'b180', name: 'Experience of self and time', description: 'Awareness of identity, body, position in reality', inclusions: 'Self, body image, time experience', exclusions: '' },
  { code: 'b210', name: 'Visual functions', description: 'Sensing light, form, size, shape, colour', inclusions: 'Visual acuity, field, quality of vision', exclusions: 'b156' },
  { code: 'b230', name: 'Hearing functions', description: 'Sensing sounds, discriminating location, pitch, loudness', inclusions: 'Hearing, auditory discrimination, sound localization', exclusions: 'b156, b167' },
  { code: 'b235', name: 'Vestibular functions', description: 'Inner ear - position, balance, movement', inclusions: 'Position sense, balance, movement functions', exclusions: 'b240' },
  { code: 'b250', name: 'Taste function', description: 'Sensing bitterness, sweetness, sourness, saltiness', inclusions: 'Gustatory functions', exclusions: 'b156' },
  { code: 'b255', name: 'Smell function', description: 'Sensing odours and smells', inclusions: 'Olfactory functions', exclusions: 'b156' },
  { code: 'b280', name: 'Sensation of pain', description: 'Unpleasant feeling indicating potential/actual damage', inclusions: 'Generalized/localized pain, orofacial pain', exclusions: '' },
  { code: 'b310', name: 'Voice functions', description: 'Production of sounds by air through larynx', inclusions: 'Phonation, pitch, loudness, voice quality', exclusions: 'b167, b320' },
  { code: 'b320', name: 'Articulation functions', description: 'Production of speech sounds', inclusions: 'Enunciation, dysarthria (spastic, ataxic, flaccid)', exclusions: 'b310, b330' },
  { code: 'b330', name: 'Fluency and rhythm of speech', description: 'Flow and tempo of speech', inclusions: 'Fluency, rhythm, speed, melody, prosody', exclusions: 'b167, b310, b320' },
  { code: 'b510', name: 'Ingestion functions', description: 'Taking in and manipulating solids/liquids through mouth', inclusions: 'Sucking, chewing, biting, manipulating food, salivation, swallowing', exclusions: 'b110, b250' },
  { code: 'b5100', name: 'Sucking', description: 'Drawing in by suction force through mouth', inclusions: '', exclusions: '' },
  { code: 'b5101', name: 'Biting', description: 'Cutting/severing food by front teeth', inclusions: '', exclusions: '' },
  { code: 'b5102', name: 'Chewing', description: 'Crushing, grinding, masticating food', inclusions: '', exclusions: '' },
  { code: 'b5103', name: 'Manipulation of food in mouth', description: 'Moving food around by tongue, teeth, palate', inclusions: '', exclusions: '' },
  { code: 'b5104', name: 'Salivation', description: 'Production of saliva', inclusions: '', exclusions: '' },
  { code: 'b5105', name: 'Swallowing', description: 'Clearing substances through oral cavity, pharynx, oesophagus', inclusions: 'Oral, pharyngeal, oesophageal dysphagia', exclusions: '' },
  { code: 'b51050', name: 'Oral swallowing', description: 'Clearing substances through oral cavity', inclusions: '', exclusions: '' },
  { code: 'b51051', name: 'Pharyngeal swallowing', description: 'Clearing substances through pharynx', inclusions: '', exclusions: '' },
  { code: 'b51052', name: 'Oesophageal swallowing', description: 'Clearing substances through oesophagus', inclusions: '', exclusions: '' },
  { code: 'b530', name: 'Weight maintenance functions', description: 'Maintaining appropriate body weight', inclusions: 'BMI, underweight, cachexia', exclusions: 'b510, b540' },
  { code: 'b535', name: 'Sensations - digestive system', description: 'Sensations from eating, drinking, digestion', inclusions: 'Nausea, bloating, heartburn (GERD)', exclusions: 'b280, b510' },
  { code: 'b340', name: 'Alternative vocalization', description: 'Other manners of vocalization', inclusions: 'Singing, chanting, babbling', exclusions: 'b310, b320' },
];

export const BODY_STRUCTURES: ICFItem[] = [
  { code: 's110', name: 'Structure of brain', description: 'Cerebral hemispheres, diencephalon, midbrain, hindbrain', inclusions: 'Cortical lobes, basal ganglia, brain stem, cerebellum' },
  { code: 's320', name: 'Structure of mouth', description: 'Teeth, gums, hard/soft palate, tongue, lips', inclusions: 'Hard palate, soft palate, tongue, lips, mandible' },
  { code: 's330', name: 'Structure of pharynx', description: 'Nasopharynx, oropharynx, laryngopharynx', inclusions: '' },
  { code: 's340', name: 'Structure of larynx', description: 'Vocal folds, epiglottis, arytenoid cartilages', inclusions: 'Vocal folds' },
  { code: 's430', name: 'Structure of respiratory system', description: 'Trachea, lungs, thoracic cage, muscles of respiration', inclusions: '' },
  { code: 's5', name: 'Structures - digestive system', description: 'Oesophagus, stomach and related', inclusions: 'Structure of oesophagus, stomach' },
];

export const ACTIVITIES_PARTICIPATION: ICFItem[] = [
  { code: 'd110', name: 'Watching', description: 'Using sense of seeing intentionally' },
  { code: 'd115', name: 'Listening', description: 'Using sense of hearing intentionally' },
  { code: 'd310', name: 'Receiving spoken messages', description: 'Comprehending literal and implied meanings in spoken language' },
  { code: 'd315', name: 'Receiving nonverbal messages', description: 'Comprehending messages conveyed by gestures, symbols' },
  { code: 'd330', name: 'Speaking', description: 'Producing words, phrases in spoken messages' },
  { code: 'd335', name: 'Producing nonverbal messages', description: 'Using gestures, symbols, drawings' },
  { code: 'd350', name: 'Conversation', description: 'Starting, sustaining, ending interchange of thoughts' },
  { code: 'd550', name: 'Eating', description: 'Carrying out tasks of eating served food' },
  { code: 'd560', name: 'Drinking', description: 'Taking hold of drink, bringing to mouth, consuming' },
  { code: 'd570', name: 'Looking after one\'s health', description: 'Ensuring physical comfort, health, wellbeing' },
  { code: 'd760', name: 'Family relationships', description: 'Creating and maintaining kinship relationships' },
  { code: 'd850', name: 'Remunerative employment', description: 'Engaging in all aspects of work for payment' },
  { code: 'd920', name: 'Recreation and leisure', description: 'Engaging in play, recreational or leisure activity' },
];

export const ENVIRONMENTAL_FACTORS: ICFItem[] = [
  { code: 'e110', name: 'Products for personal consumption', description: 'Food, medications for ingestion' },
  { code: 'e115', name: 'Products for daily living', description: 'Equipment, products for daily activities' },
  { code: 'e120', name: 'Products for mobility/transport', description: 'Equipment for indoor/outdoor mobility' },
  { code: 'e310', name: 'Immediate family', description: 'Spouses, partners, parents, siblings, children' },
  { code: 'e320', name: 'Friends', description: 'Close and ongoing participants in relationships' },
  { code: 'e340', name: 'Personal care providers', description: 'Individuals providing daily activity support' },
  { code: 'e355', name: 'Health professionals', description: 'Doctors, nurses, therapists, SLPs' },
  { code: 'e580', name: 'Health services/systems/policies', description: 'Services for health care provision' },
];
