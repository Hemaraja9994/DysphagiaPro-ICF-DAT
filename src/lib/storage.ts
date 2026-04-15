const STORAGE_KEY = 'dysphagia_pro_assessments';

export interface AssessmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const generateId = (): string =>
  'DAT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);

export const saveAssessment = (data: AssessmentData): boolean => {
  try {
    const existing = getAllAssessments();
    const idx = existing.findIndex(a => a.id === data.id);
    const updated = { ...data, updatedAt: new Date().toISOString() };
    if (idx >= 0) existing[idx] = updated;
    else existing.push({ ...updated, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch { return false; }
};

export const getAllAssessments = (): AssessmentData[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

export const getAssessment = (id: string): AssessmentData | undefined =>
  getAllAssessments().find(a => a.id === id);

export const deleteAssessment = (id: string): void => {
  const filtered = getAllAssessments().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
