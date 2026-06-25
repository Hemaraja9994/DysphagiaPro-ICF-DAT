import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, User, FileText, Activity, Utensils, TestTube, Stethoscope,
  Globe, BarChart3, Download, Save, PlusCircle, Trash2, ChevronRight,
  ChevronLeft, Menu, X, AlertTriangle, CheckCircle2, Info, Heart
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import {
  ICF_QUALIFIERS, BODY_FUNCTIONS, BODY_STRUCTURES,
  ACTIVITIES_PARTICIPATION, ENVIRONMENTAL_FACTORS, type ICFItem
} from './data/icfCodes';
import {
  generateId, saveAssessment, getAllAssessments, deleteAssessment,
  type AssessmentData
} from './lib/storage';

// ─── TYPES ───
type TabId = 'demographics' | 'caseHistory' | 'oroMotor' | 'behavioral' | 'safe' | 'screening' | 'instrumental' | 'icfDat' | 'summary';

interface Tab { id: TabId; label: string; shortLabel: string; icon: React.ReactNode; color: string; }

const TABS: Tab[] = [
  { id: 'demographics', label: 'Demographics', shortLabel: 'Demo', icon: <User size={18}/>, color: '#3b82f6' },
  { id: 'caseHistory', label: 'Case History', shortLabel: 'History', icon: <FileText size={18}/>, color: '#8b5cf6' },
  { id: 'oroMotor', label: 'Oro-Motor Exam', shortLabel: 'Oro-Motor', icon: <Activity size={18}/>, color: '#f59e0b' },
  { id: 'behavioral', label: 'Behavioral Swallow', shortLabel: 'Behavioral', icon: <Utensils size={18}/>, color: '#10b981' },
  { id: 'safe', label: 'Modified SAFE', shortLabel: 'SAFE', icon: <ClipboardList size={18}/>, color: '#06b6d4' },
  { id: 'screening', label: 'Screening Tools', shortLabel: 'Screen', icon: <TestTube size={18}/>, color: '#a855f7' },
  { id: 'instrumental', label: 'Instrumental', shortLabel: 'Instru.', icon: <Stethoscope size={18}/>, color: '#6366f1' },
  { id: 'icfDat', label: 'WHO-ICF DAT', shortLabel: 'ICF-DAT', icon: <Globe size={18}/>, color: '#0ea5e9' },
  { id: 'summary', label: 'Summary & Report', shortLabel: 'Report', icon: <BarChart3 size={18}/>, color: '#059669' },
];

// ─── REUSABLE COMPONENTS ───
function FormField({ label, type = 'text', value, onChange, options, placeholder, required, className, rows }: {
  label: string; type?: string; value?: any; onChange: (v: any) => void;
  options?: (string | { value: string; label: string })[];
  placeholder?: string; required?: boolean; className?: string; rows?: number;
}) {
  const labelEl = (lbl: string, req?: boolean) => (
    <label className="block text-xs font-semibold mb-1" style={{color:'var(--dp-muted)',letterSpacing:'0.02em'}}>
      {lbl}{req && <span className="ml-0.5" style={{color:'var(--dp-orange)'}}>*</span>}
    </label>
  );
  const inputStyle: React.CSSProperties = {
    width:'100%', fontFamily:'var(--dp-font-ui)', fontSize:'13.5px', fontWeight:500,
    color:'var(--dp-ink)', background:'var(--dp-surface-2)',
    border:'1px solid var(--dp-line)', borderRadius:'var(--dp-r-sm)', padding:'9px 12px',
    outline:'none', transition:'border-color .15s, box-shadow .15s',
  };
  const focusHandlers = {
    onFocus:(e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
      e.target.style.borderColor='var(--dp-blue)';
      e.target.style.boxShadow='0 0 0 3px rgba(0,95,222,.12)';
    },
    onBlur:(e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
      e.target.style.borderColor='var(--dp-line)';
      e.target.style.boxShadow='none';
    },
  };

  if (type === 'select') return (
    <div className={cn("mb-3", className)}>
      {labelEl(label, required)}
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={inputStyle} {...focusHandlers}>
        <option value="">-- Select --</option>
        {options?.map(o => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label;
          return <option key={v} value={v}>{l}</option>; })}
      </select>
    </div>
  );
  if (type === 'textarea') return (
    <div className={cn("mb-3", className)}>
      {labelEl(label)}
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3}
        style={{...inputStyle, resize:'vertical'}} {...focusHandlers} />
    </div>
  );
  if (type === 'radio') return (
    <div className={cn("mb-3", className)}>
      {labelEl(label)}
      <div className="flex flex-wrap gap-1.5">
        {options?.map(o => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label;
          return (
            <label key={v} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all"
              style={value === v
                ? {background:'var(--dp-blue)',borderColor:'var(--dp-blue)',color:'#fff',fontWeight:600}
                : {background:'var(--dp-surface-2)',borderColor:'var(--dp-line)',color:'var(--dp-slate)'}}>
              <input type="radio" name={label} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
              {l}
            </label>
          );
        })}
      </div>
    </div>
  );
  if (type === 'checkbox-group') return (
    <div className={cn("mb-3", className)}>
      {labelEl(label)}
      <div className="flex flex-wrap gap-1.5">
        {options?.map(o => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label;
          const arr = Array.isArray(value) ? value : [];
          const checked = arr.includes(v);
          return (
            <label key={v} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all"
              style={checked
                ? {background:'var(--dp-blue-50)',borderColor:'var(--dp-blue)',color:'var(--dp-blue)',fontWeight:600}
                : {background:'var(--dp-surface-2)',borderColor:'var(--dp-line)',color:'var(--dp-slate)'}}>
              <input type="checkbox" checked={checked} onChange={() => onChange(checked ? arr.filter((x: string) => x !== v) : [...arr, v])} className="w-3.5 h-3.5 rounded" />
              {l}
            </label>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className={cn("mb-3", className)}>
      {labelEl(label, required)}
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle} {...focusHandlers} />
    </div>
  );
}

function Card({ title, children, color, className }: { title?: string; children: React.ReactNode; color?: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-5 mb-4", className)}
      style={{background:'var(--dp-surface)',border:'1px solid var(--dp-line)',boxShadow:'var(--dp-shadow-card)'}}>
      {title && (
        <h3 className="text-base font-bold mb-4 pb-2 flex items-center gap-2"
          style={{fontFamily:'var(--dp-font-display)',color: color || 'var(--dp-ink)',borderBottom:'1px solid var(--dp-line)'}}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function ScoreButton({ score, selected, onClick, color }: { score: number | string; selected: boolean; onClick: () => void; color?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all"
      style={selected
        ? {backgroundColor: color || 'var(--dp-blue)', borderColor: color || 'var(--dp-blue)', color:'#fff', boxShadow:'0 2px 6px rgba(0,95,222,.25)'}
        : {background:'var(--dp-surface-2)', borderColor:'var(--dp-line)', color:'var(--dp-slate)'}}>
      {score}
    </button>
  );
}

function RatingRow({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; color: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 last:border-0" style={{borderBottom:'1px solid var(--dp-line-soft)'}}>
      <span className="text-sm flex-1" style={{color:'var(--dp-slate)'}}>{label}</span>
      <div className="flex gap-1 flex-shrink-0">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className="px-2 py-1 text-xs rounded-md border font-semibold transition-all"
            style={value === o.value
              ? { backgroundColor: o.color, borderColor: o.color, color:'#fff' }
              : { background:'var(--dp-surface-2)', borderColor:'var(--dp-line)', color:'var(--dp-muted)'}}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SEVERITY_OPTIONS = [
  { value: 'WNL', label: 'WNL', color: '#22c55e' },
  { value: 'Mild', label: 'Mild', color: '#eab308' },
  { value: 'Mod', label: 'Mod', color: '#f97316' },
  { value: 'Sev', label: 'Sev', color: '#ef4444' },
  { value: 'NA', label: 'N/A', color: '#9ca3af' },
];

const SCORE_04 = [
  { value: '0', label: '0', color: '#22c55e' },
  { value: '1', label: '1', color: '#eab308' },
  { value: '2', label: '2', color: '#f97316' },
  { value: '3', label: '3', color: '#ef4444' },
];

// ─── MODULE 1: DEMOGRAPHICS ───
function Demographics({ data, set }: { data: any; set: (d: any) => void }) {
  const d = data.demographics || {};
  const u = (f: string, v: any) => set({ ...data, demographics: { ...d, [f]: v } });
  return (<>
    <Card title="Patient Identifying Information" color="#3b82f6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        <FormField label="Patient Name" value={d.name} onChange={v => u('name', v)} required placeholder="Full name" />
        <FormField label="Age" type="number" value={d.age} onChange={v => u('age', v)} required />
        <FormField label="Gender" type="select" value={d.gender} onChange={v => u('gender', v)} required options={['Male', 'Female', 'Other']} />
        <FormField label="Hospital Number" value={d.hospitalNumber} onChange={v => u('hospitalNumber', v)} />
        <FormField label="Ward / Bed No." value={d.wardBed} onChange={v => u('wardBed', v)} />
        <FormField label="Language" value={d.language} onChange={v => u('language', v)} placeholder="Kannada, Telugu, Hindi, English" />
        <FormField label="Education" value={d.education} onChange={v => u('education', v)} />
        <FormField label="Occupation" value={d.occupation} onChange={v => u('occupation', v)} />
        <FormField label="Contact Details" value={d.contact} onChange={v => u('contact', v)} />
        <FormField label="Referred From" value={d.referral} onChange={v => u('referral', v)} placeholder="e.g., Neurology, ENT" />
        <FormField label="Address" value={d.address} onChange={v => u('address', v)} />
      </div>
    </Card>
    <Card title="Clinical Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        <FormField label="Date of Evaluation" type="date" value={d.evalDate} onChange={v => u('evalDate', v)} />
        <FormField label="Examiner" value={d.examiner} onChange={v => u('examiner', v)} />
        <FormField label="Physician" value={d.physician} onChange={v => u('physician', v)} />
        <FormField label="Date of Onset" type="date" value={d.onsetDate} onChange={v => u('onsetDate', v)} />
        <FormField label="Diagnosis" value={d.diagnosis} onChange={v => u('diagnosis', v)} className="lg:col-span-2" />
      </div>
      <FormField label="Neurological Diagnosis" type="radio" value={d.neuroDiag} onChange={v => u('neuroDiag', v)}
        options={['Stroke', 'TBI', 'Spinal Cord Injury', "Parkinson's Disease", 'MND/ALS', 'Brain Tumor', 'Others']} />
      {d.neuroDiag === 'Stroke' && <FormField label="Type of Stroke" type="radio" value={d.strokeType} onChange={v => u('strokeType', v)} options={['Ischemic', 'Hemorrhagic', 'TIA']} />}
    </Card>
    <Card title="Current Medical Status & Vitals">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField label="Cardiac" type="select" value={d.cardiac} onChange={v => u('cardiac', v)} options={['Normal', 'Abnormal - Managed', 'Abnormal - Unmanaged']} />
        <FormField label="Respiratory" type="select" value={d.respiratory} onChange={v => u('respiratory', v)} options={['Normal', 'Compromised', 'On Ventilator']} />
        <FormField label="Tracheostomy" type="radio" value={d.tracheostomy} onChange={v => u('tracheostomy', v)} options={['Yes', 'No']} />
        <FormField label="Endocrine/Renal/Digestive" value={d.endocrine} onChange={v => u('endocrine', v)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        <FormField label="BP (mmHg)" value={d.bp} onChange={v => u('bp', v)} />
        <FormField label="SpO2 (%)" value={d.spo2} onChange={v => u('spo2', v)} />
        <FormField label="Pulse Rate" value={d.pr} onChange={v => u('pr', v)} />
        <FormField label="Resp. Rate" value={d.rr} onChange={v => u('rr', v)} />
      </div>
    </Card>
  </>);
}

// ─── MODULE 2: CASE HISTORY ───
function CaseHistory({ data, set }: { data: any; set: (d: any) => void }) {
  const ch = data.caseHistory || {};
  const u = (f: string, v: any) => set({ ...data, caseHistory: { ...ch, [f]: v } });
  const yn = ['Yes', 'No', 'Not Sure'];
  return (<>
    <Card title="Chief Complaint & History" color="#8b5cf6">
      <FormField label="Chief Complaint" type="textarea" value={ch.chiefComplaint} onChange={v => u('chiefComplaint', v)} placeholder="Primary complaint" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField label="Medical History" type="textarea" value={ch.medicalHistory} onChange={v => u('medicalHistory', v)} />
        <FormField label="Surgical Details" type="textarea" value={ch.surgicalDetails} onChange={v => u('surgicalDetails', v)} />
      </div>
    </Card>
    <Card title="Swallowing Problem Description">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        <FormField label="Onset" value={ch.onset} onChange={v => u('onset', v)} placeholder="Sudden / Gradual" />
        <FormField label="Duration" value={ch.duration} onChange={v => u('duration', v)} placeholder="e.g., 2 weeks" />
        <FormField label="Frequency" type="select" value={ch.frequency} onChange={v => u('frequency', v)} options={['Every meal', 'Most meals', 'Occasionally', 'Rarely']} />
        <FormField label="Pattern" type="radio" value={ch.pattern} onChange={v => u('pattern', v)} options={['Intermittent', 'Constant']} />
      </div>
    </Card>
    <Card title="Associated Symptoms">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {[['Sensation of Obstruction','obstruction'],['Mouth/Throat Pain','mouthPain'],['Nasal Regurgitation','nasalRegurg'],
          ['Mouth Odor','mouthOdor'],['Aspiration while Swallowing','aspiration'],['History of Pneumonia','pneumonia'],
          ['Heartburn (GERD)','heartburn'],['Weight Loss','weightLoss'],['Breathlessness','breathlessness'],
          ['Appetite Changes','appetiteChange'],['Taste Changes','tasteChange'],['Dry Mouth/Lack of Saliva','dryMouth'],
          ['Speech/Voice Changes','speechChange'],['Sleep Disturbance','sleepDisturbance']
        ].map(([label, key]) => (
          <FormField key={key} label={label} type="radio" value={ch[key]} onChange={v => u(key, v)} options={yn} />
        ))}
      </div>
    </Card>
    <Card title="Feeding History">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField label="Type of Food Intake" type="checkbox-group" value={ch.foodType} onChange={v => u('foodType', v)}
          options={['Solid', 'Soft Solid', 'Puree', 'Thickened Liquid', 'Thin Liquid']} />
        <FormField label="Temperature" type="checkbox-group" value={ch.temp} onChange={v => u('temp', v)} options={['Hot', 'Cold', 'Room Temp']} />
        <FormField label="Oral / Non-oral" type="radio" value={ch.oralNonoral} onChange={v => u('oralNonoral', v)} options={['Oral', 'Non-oral', 'Combined']} />
        {(ch.oralNonoral === 'Non-oral' || ch.oralNonoral === 'Combined') &&
          <FormField label="Non-oral Type" type="select" value={ch.nonOralType} onChange={v => u('nonOralType', v)}
            options={["Ryle's Tube / NGT", "Feeding Jejunostomy", "PEG", "IV Fluids"]} />}
        <FormField label="Compensatory Strategies" type="textarea" value={ch.compensatory} onChange={v => u('compensatory', v)} placeholder="Any strategies used" />
      </div>
    </Card>
    <Card title="Mental Status">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField label="Alertness" type="radio" value={ch.alert} onChange={v => u('alert', v)} options={['Alert', 'Drowsy', 'Stuporous', 'Comatose']} />
        <FormField label="Orientation" type="checkbox-group" value={ch.orientation} onChange={v => u('orientation', v)} options={['Time', 'Place', 'Person', 'Disoriented']} />
        <FormField label="Memory" type="select" value={ch.memory} onChange={v => u('memory', v)} options={['None', 'Short-term', 'Long-term', 'Both']} />
        <FormField label="Visual Perceptual Motor" type="select" value={ch.visualPerceptual} onChange={v => u('visualPerceptual', v)} options={['Intact', 'Impaired', 'Not Assessed']} />
      </div>
    </Card>
  </>);
}

// ─── MODULE 3: ORO-MOTOR EXAM ───
function OroMotorExam({ data, set }: { data: any; set: (d: any) => void }) {
  const om = data.oroMotor || {};
  const u = (f: string, v: any) => set({ ...data, oroMotor: { ...om, [f]: v } });

  const structures: Record<string, { label: string; structural: string[]; functional: string[] }> = {
    jaw: { label: 'Jaw (CN V - Trigeminal)', structural: ['Symmetry','Size','Scarring','Tethering'], functional: ['Open/Close','Lateral Movements','Rotation','Ease of Movement','Trismus','Biting','Chewing'] },
    lips: { label: 'Lips (CN VII - Facial)', structural: ['Symmetry','Size','Scarring','Cleft'], functional: ['Facial Symmetry','Seal at Rest','Seal during Movement','Protrude','Retract','Alternate Movements'] },
    tongue: { label: 'Tongue (CN XII - Hypoglossal)', structural: ['Shape','Size','Atrophy','Fasciculation','Deviation'], functional: ['Protrude','Retract','Lateral (Rt)','Lateral (Lt)','Elevate','Sweep','Against Resistance'] },
    velum: { label: 'Velum (CN IX/X)', structural: ['Shape','Size','Cleft'], functional: ['Symmetry for /a/','Resonance','Voice Quality','Gag Reflex'] },
    palate: { label: 'Palate', structural: ['Hard Palate','Soft Palate Symmetry','Arch Height'], functional: ['VP Closure','Nasal Emission'] },
    cheeks: { label: 'Cheeks', structural: ['Symmetry','Tone'], functional: ['Puffing','Sucking','Resistance'] },
    teeth: { label: 'Teeth/Dentition', structural: ['Dentition','Dentures','Oral Hygiene'], functional: ['Occlusion','Biting Force'] },
    larynx: { label: 'Larynx', structural: ['Position'], functional: ['Laryngeal Elevation','Cough Reflex','Voluntary Cough'] },
  };

  return (<>
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl mb-4">
      <h3 className="font-bold text-lg">Oro-Peripheral Mechanism Examination</h3>
      <p className="text-amber-100 text-sm">Structural and Functional assessment of oral mechanism with cranial nerve involvement</p>
    </div>
    {Object.entries(structures).map(([key, s]) => (
      <Card key={key} title={s.label} color="#f59e0b">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-bold text-orange-700 bg-orange-50 p-2 rounded mb-2">STRUCTURE</div>
            {s.structural.map(item => (
              <RatingRow key={item} label={item} value={om[`${key}_s_${item}`] || ''} onChange={v => u(`${key}_s_${item}`, v)} options={SEVERITY_OPTIONS} />
            ))}
          </div>
          <div>
            <div className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded mb-2">FUNCTION</div>
            {s.functional.map(item => (
              <RatingRow key={item} label={item} value={om[`${key}_f_${item}`] || ''} onChange={v => u(`${key}_f_${item}`, v)} options={SEVERITY_OPTIONS} />
            ))}
          </div>
        </div>
      </Card>
    ))}
    <Card title="Oro-Sensory Examination" color="#a855f7">
      {['Light Touch - Lips','Light Touch - Tongue Anterior','Light Touch - Tongue Lateral','Light Touch - Hard Palate',
        'Light Touch - Soft Palate','Taste - Sweet','Taste - Sour','Taste - Salt','Taste - Bitter',
        'Temperature - Hot','Temperature - Cold','Two-point Discrimination'].map(item => (
        <RatingRow key={item} label={item} value={om[`sens_${item}`] || ''} onChange={v => u(`sens_${item}`, v)}
          options={[{value:'Normal',label:'Normal',color:'#22c55e'},{value:'Reduced',label:'Reduced',color:'#eab308'},{value:'Absent',label:'Absent',color:'#ef4444'},{value:'NA',label:'N/A',color:'#9ca3af'}]} />
      ))}
    </Card>
    <Card title="Respiratory & Voice Status">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        <FormField label="Tracheotomy" type="radio" value={om.tracheotomy} onChange={v => u('tracheotomy', v)} options={['Yes', 'No']} />
        <FormField label="Adequacy of Cough" type="radio" value={om.coughAdequacy} onChange={v => u('coughAdequacy', v)} options={['Weak', 'Strong']} />
        <FormField label="AMR" value={om.amr} onChange={v => u('amr', v)} placeholder="pa-pa-pa, ta-ta-ta, ka-ka-ka" />
        <FormField label="SMR" value={om.smr} onChange={v => u('smr', v)} placeholder="pa-ta-ka" />
        <FormField label="MPD (seconds)" type="number" value={om.mpd} onChange={v => u('mpd', v)} />
        <FormField label="Voice Quality" type="select" value={om.voiceQuality} onChange={v => u('voiceQuality', v)}
          options={['Normal','Breathy','Hoarse','Harsh','Strained-Strangled','Wet/Gurgly','Aphonic']} />
        <FormField label="Volitional Cough" type="radio" value={om.volCough} onChange={v => u('volCough', v)} options={['Strong', 'Weak', 'Absent']} />
      </div>
    </Card>
    <Card title="Speech Motor Control (5=Normal, 1=Severe)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="bg-muted">
          <th className="p-2 text-left">Item</th>{[5,4,3,2,1].map(n => <th key={n} className="p-2 w-12 text-center">{n}</th>)}<th className="p-2">Remarks</th>
        </tr></thead><tbody>
          {['Oro-motor Control','Praxis','AMR','SMR','Articulation','Speech Intelligibility','Phonation','Resonance','Prosody','Speech Breathing'].map(item => (
            <tr key={item} className="border-b"><td className="p-2 font-medium">{item}</td>
              {[5,4,3,2,1].map(n => <td key={n} className="p-1 text-center">
                <input type="radio" name={`smc_${item}`} checked={om[`smc_${item}`] === String(n)} onChange={() => u(`smc_${item}`, String(n))} className="w-4 h-4 accent-primary" />
              </td>)}
              <td className="p-1"><input type="text" value={om[`smc_${item}_r`] || ''} onChange={e => u(`smc_${item}_r`, e.target.value)} className="w-full text-xs border rounded px-1 py-0.5" /></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </Card>
  </>);
}

// ─── MODULE 4: BEHAVIORAL SWALLOWING ───
function BehavioralSwallowing({ data, set }: { data: any; set: (d: any) => void }) {
  const bh = data.behavioral || {};
  const u = (f: string, v: any) => set({ ...data, behavioral: { ...bh, [f]: v } });

  const consistencies = ['Saliva','Thin Liquid','Thick Liquid','Puree','Soft Solid','Regular Solid'];
  const aspects = ['Lip Closure','Bolus Control','Oral Residue','Swallow Init','Laryngeal Elev','Coughing','Voice Change'];

  return (<>
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-xl mb-4">
      <h3 className="font-bold text-lg">Behavioral Assessment of Swallowing</h3>
      <p className="text-emerald-100 text-sm">Clinical bedside evaluation across consistencies and swallowing phases</p>
    </div>
    <Card title="Swallowing Trials by Consistency" color="#10b981">
      <div className="overflow-x-auto"><table className="w-full text-xs border-collapse">
        <thead><tr className="bg-emerald-50">
          <th className="border p-2 text-left">Consistency</th>
          {aspects.map(a => <th key={a} className="border p-1.5 text-center">{a}</th>)}
        </tr></thead>
        <tbody>{consistencies.map(c => (
          <tr key={c} className="hover:bg-muted/30"><td className="border p-2 font-medium bg-muted/20">{c}</td>
            {aspects.map(a => <td key={a} className="border p-0.5"><select value={bh[`t_${c}_${a}`] || ''} onChange={e => u(`t_${c}_${a}`, e.target.value)}
              className="w-full text-xs p-0.5 border-0 bg-transparent" style={{backgroundColor: bh[`t_${c}_${a}`]==='Severe' ? '#fee2e2' : bh[`t_${c}_${a}`]==='Moderate' ? '#ffedd5' : ''}}>
              <option value="">--</option><option value="Normal">WNL</option><option value="Mild">Mild</option><option value="Moderate">Mod</option><option value="Severe">Sev</option><option value="NA">N/A</option>
            </select></td>)}
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
    <Card title="Phase Observations">
      {[{ name: 'Pre-Oral Phase', items: ['Awareness of food','Hand-to-mouth coordination','Anticipatory mouth opening','Lip closure on spoon/cup','Drooling'] },
        { name: 'Oral Preparatory Phase', items: ['Lip closure during chewing','Lateral tongue movement','Bolus formation','Rotary jaw movement','Food residue in oral cavity'] },
        { name: 'Oral Transit Phase', items: ['Tongue-palate contact','Bolus propulsion','Oral transit time','Premature spillage to pharynx'] },
        { name: 'Pharyngeal Phase', items: ['Timely swallow trigger','Laryngeal elevation','No. swallows per bolus','Wet voice post-swallow','Coughing before swallow','Coughing during swallow','Coughing after swallow','Nasal regurgitation'] },
      ].map(cat => (
        <div key={cat.name} className="mb-4">
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded mb-2">{cat.name}</div>
          {cat.items.map(item => <RatingRow key={item} label={item} value={bh[`obs_${item}`] || ''} onChange={v => u(`obs_${item}`, v)} options={SEVERITY_OPTIONS} />)}
        </div>
      ))}
    </Card>
    <Card title="Aspiration Risk">
      <FormField label="Signs Observed" type="checkbox-group" value={bh.aspirationSigns} onChange={v => u('aspirationSigns', v)}
        options={['Coughing during/after swallow','Wet/gurgly voice','Throat clearing','Watery eyes','Respiratory distress','SpO2 drop','Silent aspiration suspected','None']} />
      <FormField label="Risk Level" type="radio" value={bh.riskLevel} onChange={v => u('riskLevel', v)} options={['No Risk','Low','Moderate','High']} />
      <FormField label="Notes" type="textarea" value={bh.notes} onChange={v => u('notes', v)} />
    </Card>
  </>);
}

// ─── MODULE 5: MODIFIED SAFE TEST ───
function SAFETest({ data, set }: { data: any; set: (d: any) => void }) {
  const sf = data.safe || {};
  const u = (f: string, v: any) => set({ ...data, safe: { ...sf, [f]: v } });

  const peStructs = ['Lips','Tongue','Palate','Cheeks','Teeth','Jaw','Larynx','Oral Reflexes'];
  const peFuncs = ['Elevation','Depression','Retraction','Protrusion','Approximation','Rounding','Lateralization','ROM','Coordination','Rate','Tension','Strength'];
  const oralItems = ['Lip closure','Lip seal','Pocketing','Bolus transport','Swallows per bolus','Mastication strength','Nasal regurgitation'];
  const pharItems = ['Pharyngeal delay','Laryngeal elevation','Cough before swallow','Cough during swallow','Cough after swallow','Repeated swallows','Food stuck complaint','Hoarse/wet voice','Regurgitation'];

  const peScore = useMemo(() => peStructs.reduce((s, st) => s + peFuncs.reduce((s2, fn) => s2 + (Number(sf[`pe_${st}_${fn}`]) || 0), 0), 0), [sf]);
  const opScore = useMemo(() => oralItems.reduce((s, i) => s + (Number(sf[`op_${i}`]) || 0), 0), [sf]);
  const ppScore = useMemo(() => pharItems.reduce((s, i) => s + (Number(sf[`pp_${i}`]) || 0), 0), [sf]);

  return (<>
    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 rounded-xl mb-4">
      <h3 className="font-bold text-lg">Modified SAFE - Swallowing Ability & Functional Evaluation</h3>
      <p className="text-cyan-100 text-sm">Three-stage comprehensive evaluation based on SAFE (PRO-ED, 2003)</p>
    </div>
    {/* Score Dashboard */}
    <div className="grid grid-cols-4 gap-3 mb-4">
      {[{l:'PE Score',v:peScore,c:'#3b82f6'},{l:'Oral Phase',v:opScore,c:'#f97316'},{l:'Pharyngeal',v:ppScore,c:'#ef4444'},{l:'Total',v:peScore+opScore+ppScore,c:'#7c3aed'}].map(s => (
        <div key={s.l} className="bg-card rounded-xl border p-3 text-center">
          <div className="text-2xl font-bold" style={{color: s.c}}>{s.v}</div>
          <div className="text-xs text-muted-foreground">{s.l}</div>
        </div>
      ))}
    </div>
    {/* Stage 1: Physical Exam */}
    <Card title="STAGE 1: Physical Examination (3=WFL, 2=Mild, 1=Moderate, 0=Severe)" color="#06b6d4">
      <div className="overflow-x-auto"><table className="w-full text-xs border-collapse">
        <thead><tr className="bg-cyan-50">
          <th className="border p-1 text-left sticky left-0 bg-cyan-50 z-10">Structure</th>
          {peFuncs.map(f => <th key={f} className="border p-0.5 text-center" style={{writingMode:'vertical-lr',height:'70px',fontSize:'10px'}}>{f}</th>)}
          <th className="border p-1 font-bold">Total</th>
        </tr></thead>
        <tbody>{peStructs.map(st => {
          const rowTotal = peFuncs.reduce((s, fn) => s + (Number(sf[`pe_${st}_${fn}`]) || 0), 0);
          return <tr key={st}><td className="border p-1 font-medium sticky left-0 bg-background">{st}</td>
            {peFuncs.map(fn => <td key={fn} className="border p-0"><select value={sf[`pe_${st}_${fn}`] || ''} onChange={e => u(`pe_${st}_${fn}`, e.target.value)}
              className="w-full text-xs p-0 text-center border-0 bg-transparent" style={{backgroundColor: sf[`pe_${st}_${fn}`]==='0'?'#fee2e2':sf[`pe_${st}_${fn}`]==='1'?'#ffedd5':sf[`pe_${st}_${fn}`]==='2'?'#fef9c3':sf[`pe_${st}_${fn}`]==='3'?'#dcfce7':''}}>
              <option value="">-</option><option value="3">3</option><option value="2">2</option><option value="1">1</option><option value="0">0</option>
            </select></td>)}
            <td className="border p-1 text-center font-bold bg-muted/30">{rowTotal}</td>
          </tr>;
        })}</tbody>
      </table></div>
    </Card>
    {/* Stage 2: Oral Phase */}
    <Card title="STAGE 2: Oral Phase (0=Normal, 1=Mild, 2=Moderate, 3=Severe)">
      {oralItems.map(item => (
        <div key={item} className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0">
          <span className="text-sm font-medium">{item}</span>
          <div className="flex gap-1.5">{SCORE_04.map(s => <ScoreButton key={s.value} score={s.value} selected={String(sf[`op_${item}`]) === s.value} onClick={() => u(`op_${item}`, s.value)} color={s.color} />)}</div>
        </div>
      ))}
      <div className="mt-2 text-right font-bold" style={{color:'#f97316'}}>Oral Phase Total: {opScore}</div>
    </Card>
    {/* Stage 2: Pharyngeal Phase */}
    <Card title="Pharyngeal Phase Evaluation">
      {pharItems.map(item => (
        <div key={item} className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0">
          <span className="text-sm font-medium">{item}</span>
          <div className="flex gap-1.5">{SCORE_04.map(s => <ScoreButton key={s.value} score={s.value} selected={String(sf[`pp_${item}`]) === s.value} onClick={() => u(`pp_${item}`, s.value)} color={s.color} />)}</div>
        </div>
      ))}
      <div className="mt-2 text-right font-bold" style={{color:'#ef4444'}}>Pharyngeal Phase Total: {ppScore}</div>
    </Card>
    {/* Consistency Tolerance */}
    <Card title="Consistency Tolerance">
      <div className="overflow-x-auto"><table className="w-full text-sm border-collapse"><thead><tr className="bg-muted">
        <th className="border p-2 text-left">Consistency</th><th className="border p-2">Oral Tolerates</th><th className="border p-2">Pharyngeal Tolerates</th><th className="border p-2">Notes</th>
      </tr></thead><tbody>
        {['Thin Liquid','Thick Liquid','Puree','Soft','Ground','Regular','Dry/Crumbly'].map(c => (
          <tr key={c}><td className="border p-2 font-medium">{c}</td>
            <td className="border p-1"><select value={sf[`op_tol_${c}`]||''} onChange={e => u(`op_tol_${c}`,e.target.value)} className="w-full text-xs"><option value="">--</option><option>Yes</option><option>No</option><option>Modified</option><option>NT</option></select></td>
            <td className="border p-1"><select value={sf[`pp_tol_${c}`]||''} onChange={e => u(`pp_tol_${c}`,e.target.value)} className="w-full text-xs"><option value="">--</option><option>Yes</option><option>No</option><option>Modified</option><option>NT</option></select></td>
            <td className="border p-1"><input type="text" value={sf[`tol_note_${c}`]||''} onChange={e => u(`tol_note_${c}`,e.target.value)} className="w-full text-xs border-0" /></td>
          </tr>
        ))}
      </tbody></table></div>
    </Card>
    <Card title="STAGE 3: Behavior & Auscultation">
      {['Cooperativeness','Follow instructions','Awareness of deficits','Rate of intake','Endurance'].map(item => (
        <RatingRow key={item} label={item} value={sf[`beh_${item}`] || ''} onChange={v => u(`beh_${item}`, v)}
          options={[{value:'WFL',label:'WFL',color:'#22c55e'},{value:'Impaired',label:'Impaired',color:'#ef4444'}]} />
      ))}
      <FormField label="Auscultation / Notes" type="textarea" value={sf.auscNotes} onChange={v => u('auscNotes', v)} />
    </Card>
  </>);
}

// ─── MODULE 6: SCREENING TOOLS ───
function ScreeningTools({ data, set }: { data: any; set: (d: any) => void }) {
  const sc = data.screening || {};
  const u = (f: string, v: any) => set({ ...data, screening: { ...sc, [f]: v } });

  const eat10Items = ['Swallowing problem caused weight loss','Interferes with going out for meals','Swallowing liquids takes extra effort',
    'Swallowing solids takes extra effort','Swallowing pills takes extra effort','Swallowing is painful',
    'Pleasure of eating is affected','Food sticks in throat','I cough when I eat','Swallowing is stressful'];
  const eat10Total = eat10Items.reduce((s, _, i) => s + (Number(sc[`eat10_${i}`]) || 0), 0);

  return (<>
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl mb-4">
      <h3 className="font-bold text-lg">Swallowing Screening Tools</h3>
      <p className="text-purple-100 text-sm">Integrated internationally-recognized free screening instruments</p>
    </div>
    {/* EAT-10 */}
    <Card title="EAT-10 (Eating Assessment Tool - Belafsky et al., 2008)" color="#a855f7">
      <p className="text-sm text-muted-foreground mb-3">Rate 0 (No problem) to 4 (Severe problem). Score ≥3 is abnormal.</p>
      {eat10Items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
          <span className="text-sm"><span className="font-bold text-primary mr-1">{i+1}.</span>{item}</span>
          <div className="flex gap-1 flex-shrink-0">{[0,1,2,3,4].map(n => <ScoreButton key={n} score={n} selected={String(sc[`eat10_${i}`]) === String(n)} onClick={() => u(`eat10_${i}`, n)} color="#7c3aed" />)}</div>
        </div>
      ))}
      <div className={cn("mt-4 p-3 rounded-lg text-center font-bold text-lg", eat10Total >= 3 ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700")}>
        EAT-10 Total: {eat10Total}/40 {eat10Total >= 3 ? ' — ABNORMAL (≥3)' : ' — Normal'}
      </div>
    </Card>
    {/* Water Swallow Test */}
    <Card title="Water Swallow Test (Progressive Volume)" color="#06b6d4">
      <div className="overflow-x-auto"><table className="w-full text-sm border-collapse"><thead><tr className="bg-cyan-50">
        <th className="border p-2 text-left">Volume</th><th className="border p-2">Completed</th><th className="border p-2">Coughing</th><th className="border p-2">Voice Change</th><th className="border p-2">Wet Voice</th><th className="border p-2">Result</th>
      </tr></thead><tbody>
        {['1ml','3ml','5ml','10ml','20ml','50ml','Cup sip'].map(v => (
          <tr key={v}><td className="border p-2 font-medium">{v}</td>
            {['done','cough','voice','wet'].map(a => <td key={a} className="border p-1"><select value={sc[`wst_${v}_${a}`]||''} onChange={e => u(`wst_${v}_${a}`,e.target.value)} className="w-full text-xs"><option value="">--</option><option>Yes</option><option>No</option></select></td>)}
            <td className="border p-1"><select value={sc[`wst_${v}_res`]||''} onChange={e => u(`wst_${v}_res`,e.target.value)} className="text-xs"
              style={{backgroundColor:sc[`wst_${v}_res`]==='Fail'?'#fee2e2':sc[`wst_${v}_res`]==='Pass'?'#dcfce7':''}}>
              <option value="">--</option><option value="Pass">Pass</option><option value="Fail">Fail</option><option value="NT">NT</option></select></td>
          </tr>
        ))}
      </tbody></table></div>
    </Card>
    {/* GUSS */}
    <Card title="GUSS (Gugging Swallowing Screen - Trapl et al., 2007)" color="#6366f1">
      <p className="text-xs text-muted-foreground mb-2">Preliminary must score 5/5 to proceed. Total: 20=No dysphagia, 15-19=Mild, 10-14=Moderate, 0-9=Severe</p>
      {['Vigilance (alert ≥15 min)','Voluntary cough','Saliva swallow successful','No drooling','No voice change'].map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b">
          <span className="text-sm">{item}</span>
          <div className="flex gap-2">{['1','0'].map(v => <button key={v} type="button" onClick={() => u(`guss_p_${i}`,v)}
            className={cn("px-4 py-1 text-xs rounded-lg border font-bold", sc[`guss_p_${i}`]===v ? (v==='1'?'bg-emerald-600 text-white':'bg-destructive text-white') : 'bg-background')}>
            {v==='1'?'Yes (1)':'No (0)'}</button>)}</div>
        </div>
      ))}
      <FormField label="GUSS Total (max 20)" type="number" value={sc.gussTotal} onChange={v => u('gussTotal', v)} />
    </Card>
    <Card title="Overall Screening Result">
      <FormField label="Dysphagia Severity" type="radio" value={sc.severity} onChange={v => u('severity', v)}
        options={['0 - None','1 - Minimal','2 - Mild','3 - Mild-Moderate','4 - Moderate','5 - Moderate-Severe','6 - Severe','7 - Profound/NPO']} />
      <FormField label="Screening Notes" type="textarea" value={sc.notes} onChange={v => u('notes', v)} />
    </Card>
  </>);
}

// ─── MODULE 7: INSTRUMENTAL ───
function Instrumental({ data, set }: { data: any; set: (d: any) => void }) {
  const ins = data.instrumental || {};
  const u = (f: string, v: any) => set({ ...data, instrumental: { ...ins, [f]: v } });

  const pasScale = [
    '1 - Material does not enter airway',
    '2 - Enters airway, above VF, ejected', '3 - Enters airway, above VF, NOT ejected',
    '4 - Contacts VF, ejected', '5 - Contacts VF, NOT ejected',
    '6 - Passes below VF, ejected', '7 - Passes below VF, NOT ejected despite effort',
    '8 - Passes below VF, NO effort (Silent Aspiration)',
  ];
  const consistencies = ['Thin Liquid','Nectar Thick','Honey Thick','Puree','Soft Solid','Regular Solid'];
  const volumes = ['1ml','3ml','5ml','10ml','20ml','Cup sip'];

  return (<>
    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-4 rounded-xl mb-4">
      <h3 className="font-bold text-lg">Instrumental Assessment</h3>
      <p className="text-indigo-100 text-sm">VFSS / Modified Barium Swallow & FEES Documentation</p>
    </div>
    <Card title="VFSS / Modified Barium Swallow" color="#6366f1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FormField label="Performed" type="radio" value={ins.vfssPerformed} onChange={v => u('vfssPerformed', v)} options={['Yes','No','N/A']} />
        <FormField label="Date" type="date" value={ins.vfssDate} onChange={v => u('vfssDate', v)} />
        <FormField label="By" value={ins.vfssBy} onChange={v => u('vfssBy', v)} />
      </div>
      {ins.vfssPerformed === 'Yes' && <>
        <h4 className="text-sm font-bold mb-2">Consistency × Volume Matrix</h4>
        <div className="overflow-x-auto mb-4"><table className="w-full text-xs border-collapse"><thead><tr className="bg-indigo-50">
          <th className="border p-1 text-left">Consistency</th>{volumes.map(v => <th key={v} className="border p-1 text-center">{v}</th>)}
        </tr></thead><tbody>{consistencies.map(c => (
          <tr key={c}><td className="border p-1 font-medium bg-muted/20">{c}</td>
            {volumes.map(v => <td key={v} className="border p-0.5"><select value={ins[`vfss_${c}_${v}`]||''} onChange={e => u(`vfss_${c}_${v}`,e.target.value)}
              className="w-full text-xs p-0.5" style={{backgroundColor:ins[`vfss_${c}_${v}`]==='Aspiration'?'#fee2e2':ins[`vfss_${c}_${v}`]==='Penetration'?'#ffedd5':''}}>
              <option value="">--</option><option value="Safe">Safe</option><option value="Penetration">Pen</option><option value="Aspiration">Asp</option><option value="NT">NT</option>
            </select></td>)}
          </tr>
        ))}</tbody></table></div>
        {['Oral Phase','Pharyngeal Phase'].map(phase => (
          <div key={phase} className="mb-4">
            <div className="text-xs font-bold text-indigo-700 bg-indigo-50 p-2 rounded mb-2">{phase} Findings</div>
            {(phase === 'Oral Phase' ?
              ['Bolus formation','Tongue movement','Bolus hold','Premature spillage','Oral transit time','Oral residue','Lip closure'] :
              ['Swallow trigger','VP closure','Laryngeal elevation','Hyoid movement','Epiglottic inversion','Pharyngeal contraction','Vallecular residue','Pyriform residue','Penetration','Aspiration','UES opening']
            ).map(item => <RatingRow key={item} label={item} value={ins[`vfss_${phase}_${item}`]||''} onChange={v => u(`vfss_${phase}_${item}`,v)} options={SEVERITY_OPTIONS} />)}
          </div>
        ))}
        <h4 className="text-sm font-bold mb-2">Penetration-Aspiration Scale (Rosenbek et al., 1996)</h4>
        <div className="space-y-1 mb-4">{pasScale.map((p, i) => (
          <label key={i} className={cn("flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all", ins.pasScore===String(i+1)?'bg-primary/5 border-primary':'hover:bg-muted/50')}>
            <input type="radio" name="pas" value={i+1} checked={ins.pasScore===String(i+1)} onChange={() => u('pasScore',String(i+1))} className="mt-0.5 accent-primary" />
            <span className="text-sm">{p}</span>
          </label>
        ))}</div>
        <FormField label="Compensatory Strategies Tested" type="checkbox-group" value={ins.compensatory} onChange={v => u('compensatory',v)}
          options={['Chin Tuck','Head Turn L','Head Turn R','Supraglottic Swallow','Effortful Swallow','Mendelsohn','Multiple Swallows','Bolus Modification']} />
        <FormField label="VFSS Summary" type="textarea" value={ins.vfssSummary} onChange={v => u('vfssSummary',v)} />
      </>}
    </Card>
    <Card title="FEES" color="#8b5cf6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FormField label="Performed" type="radio" value={ins.feesPerformed} onChange={v => u('feesPerformed',v)} options={['Yes','No','N/A']} />
        <FormField label="Date" type="date" value={ins.feesDate} onChange={v => u('feesDate',v)} />
        <FormField label="By" value={ins.feesBy} onChange={v => u('feesBy',v)} />
      </div>
      {ins.feesPerformed === 'Yes' && <>
        <FormField label="Structural Findings" type="textarea" value={ins.feesStructural} onChange={v => u('feesStructural',v)} />
        <FormField label="Functional Findings" type="textarea" value={ins.feesFunctional} onChange={v => u('feesFunctional',v)} />
        <FormField label="FEES Summary" type="textarea" value={ins.feesSummary} onChange={v => u('feesSummary',v)} />
      </>}
    </Card>
    <Card title="Diet & Rehabilitation Recommendations">
      <FormField label="Diet" type="checkbox-group" value={ins.diet} onChange={v => u('diet',v)}
        options={['NPO','NPO pending evaluation','Continue current','Diet Modification','Thicken liquids','No thin liquids','Reduced bolus','Supervised feeding']} />
      <FormField label="Further Evaluation" type="checkbox-group" value={ins.furtherEval} onChange={v => u('furtherEval',v)}
        options={['Modified Barium Swallow','FEES','Other Diagnostic Studies']} />
      <FormField label="Additional Recommendations" type="textarea" value={ins.addRec} onChange={v => u('addRec',v)} />
    </Card>
  </>);
}

// ─── MODULE 8: WHO-ICF DAT ───
function ICFDATModule({ data, set }: { data: any; set: (d: any) => void }) {
  const icf = data.icfDat || {};
  const [section, setSection] = useState<'bf' | 'bs' | 'ap' | 'ef'>('bf');
  const updateICF = (sec: string, code: string, val: any) => {
    const s = icf[sec] || {};
    set({ ...data, icfDat: { ...icf, [sec]: { ...s, [code]: val } } });
  };

  const countRated = (sec: string, items: ICFItem[]) => items.filter(i => icf[sec]?.[i.code] !== undefined).length;
  const stats = { bf: countRated('bodyFunctions', BODY_FUNCTIONS), bs: countRated('bodyStructures', BODY_STRUCTURES),
    ap: ACTIVITIES_PARTICIPATION.filter(i => icf.activitiesParticipation?.[i.code+'_p'] || icf.activitiesParticipation?.[i.code+'_c']).length,
    ef: ENVIRONMENTAL_FACTORS.filter(i => icf.environmentalFactors?.[i.code+'_b'] || icf.environmentalFactors?.[i.code+'_f']).length };
  const total = BODY_FUNCTIONS.length + BODY_STRUCTURES.length + ACTIVITIES_PARTICIPATION.length + ENVIRONMENTAL_FACTORS.length;
  const rated = stats.bf + stats.bs + stats.ap + stats.ef;

  const ICFRow = ({ item, sec }: { item: ICFItem; sec: string }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="mb-2 overflow-hidden rounded-xl" style={{border:'1px solid var(--dp-line)'}}>
        <div className="flex items-center gap-2 p-3" style={{background:'var(--dp-surface-2)'}}>
          <span className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
            style={{fontFamily:'var(--dp-font-mono)',background:'var(--dp-blue-50)',color:'var(--dp-blue)'}}>{item.code}</span>
          <span className="flex-1 text-sm font-medium cursor-pointer" style={{color:'var(--dp-ink)'}}
            onClick={() => setOpen(!open)}>{item.name} <span style={{color:'var(--dp-faint)',fontSize:'11px'}}>{open ? '▲' : '▼'}</span></span>
          <div className="flex gap-1 flex-shrink-0">
            {ICF_QUALIFIERS.map(q => <ScoreButton key={q.value} score={q.value} selected={String(icf[sec]?.[item.code]) === String(q.value)}
              onClick={() => updateICF(sec, item.code, q.value)} color={q.color} />)}
          </div>
        </div>
        {open && <div className="p-3 border-t text-xs" style={{background:'var(--dp-surface)',borderColor:'var(--dp-line)',color:'var(--dp-slate)'}}>
          <p><strong>Description:</strong> {item.description}</p>
          {item.inclusions && <p className="mt-1"><strong>Inclusions:</strong> {item.inclusions}</p>}
          {item.exclusions && <p className="mt-1"><strong>Exclusions:</strong> {item.exclusions}</p>}
          <input type="text" placeholder="Description of the problem..." value={icf.notes?.[item.code] || ''}
            className="w-full mt-2 text-xs rounded px-2 py-1"
            style={{border:'1px solid var(--dp-line)',borderRadius:'var(--dp-r-sm)',background:'var(--dp-surface-2)',color:'var(--dp-ink)'}}
            onChange={e => set({ ...data, icfDat: { ...icf, notes: { ...(icf.notes || {}), [item.code]: e.target.value } } })} />
        </div>}
      </div>
    );
  };

  const sections = [
    { id: 'bf' as const, label: 'Body Functions', count: `${stats.bf}/${BODY_FUNCTIONS.length}`, color: '#3b82f6' },
    { id: 'bs' as const, label: 'Body Structures', count: `${stats.bs}/${BODY_STRUCTURES.length}`, color: '#0891b2' },
    { id: 'ap' as const, label: 'Activities & Participation', count: `${stats.ap}/${ACTIVITIES_PARTICIPATION.length}`, color: '#16a34a' },
    { id: 'ef' as const, label: 'Environmental Factors', count: `${stats.ef}/${ENVIRONMENTAL_FACTORS.length}`, color: '#9333ea' },
  ];

  return (<>
    {/* ICF hero banner */}
    <div className="relative overflow-hidden text-white p-5 rounded-2xl mb-4"
      style={{background:'linear-gradient(115deg,var(--dp-navy-900) 0%,#003a9e 55%,var(--dp-blue) 100%)',boxShadow:'var(--dp-shadow-pop)'}}>
      <div className="absolute inset-0 right-0 w-56 opacity-30" style={{background:'linear-gradient(135deg,#0a4fc0,#0a2f86)',clipPath:'polygon(38% 0,100% 0,100% 100%,0 100%)'}} />
      <div className="relative">
        <h3 className="text-xl font-bold" style={{fontFamily:'var(--dp-font-display)'}}>WHO-ICF Based Dysphagia Assessment Tool</h3>
        <p className="text-sm mt-1" style={{color:'var(--dp-blue-200)'}}>Copyright Reg. No. LD-20250171253 | Hemaraja Nayaka S, Dr. Vijayalakshmi S, Dr. Jayashree Bhat</p>
        <div className="mt-3 rounded-xl p-3" style={{background:'rgba(255,255,255,0.10)'}}>
          <div className="flex justify-between text-sm mb-1 text-white/80">
            <span>ICF Coding Progress</span>
            <span className="font-bold" style={{fontFamily:'var(--dp-font-mono)'}}>{rated}/{total} items</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.20)'}}>
            <div className="h-full rounded-full transition-all" style={{width:`${(rated/total)*100}%`,background:'var(--dp-blue-200)'}} />
          </div>
        </div>
      </div>
    </div>
    <Card title="Source of Information">
      <FormField label="Obtained from" type="checkbox-group" value={icf.sources || []}
        onChange={(v: any) => set({ ...data, icfDat: { ...icf, sources: v } })}
        options={['Case History','Patient Reported Questionnaire','Clinical Examination','Caregiver Report','Medical Records']} />
    </Card>
    {/* Qualifier Legend */}
    <div className="rounded-2xl p-3 mb-4 flex flex-wrap gap-3" style={{background:'var(--dp-surface)',border:'1px solid var(--dp-line)',boxShadow:'var(--dp-shadow-card)'}}>
      {ICF_QUALIFIERS.map(q => (
        <div key={q.value} className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md text-white text-xs font-bold flex items-center justify-center" style={{backgroundColor:q.color,fontFamily:'var(--dp-font-mono)'}}>{q.value}</div>
          <span className="text-xs" style={{color:'var(--dp-muted)'}}>{q.label}</span>
        </div>
      ))}
    </div>
    {/* Section Nav */}
    <div className="flex flex-wrap gap-2 mb-4">
      {sections.map(s => (
        <button key={s.id} type="button" onClick={() => setSection(s.id)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={section===s.id
            ? {backgroundColor:s.color,color:'#fff',boxShadow:'0 4px 12px rgba(0,95,222,.25)'}
            : {background:'var(--dp-surface)',border:'1px solid var(--dp-line)',color:'var(--dp-slate)'}}>
          {s.label} <span className="ml-1 text-xs opacity-70" style={{fontFamily:'var(--dp-font-mono)'}}>({s.count})</span>
        </button>
      ))}
    </div>
    {/* Content */}
    {section === 'bf' && <Card title="Section I: Body Functions">{BODY_FUNCTIONS.map(i => <ICFRow key={i.code} item={i} sec="bodyFunctions" />)}</Card>}
    {section === 'bs' && <Card title="Section II: Body Structures">{BODY_STRUCTURES.map(i => <ICFRow key={i.code} item={i} sec="bodyStructures" />)}</Card>}
    {section === 'ap' && <Card title="Section III: Activities & Participation">
      <p className="text-sm mb-3" style={{color:'var(--dp-muted)'}}><strong>Performance:</strong> actual in current environment | <strong>Capacity:</strong> ability without assistance</p>
      {ACTIVITIES_PARTICIPATION.map(item => (
        <div key={item.code} className="mb-2 p-3 rounded-xl" style={{border:'1px solid var(--dp-line)',background:'var(--dp-surface-2)'}}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{fontFamily:'var(--dp-font-mono)',background:'#d1fae5',color:'#065f46'}}>{item.code}</span>
            <span className="text-sm font-medium" style={{color:'var(--dp-ink)'}}>{item.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div><span className="text-xs font-bold mr-2" style={{color:'var(--dp-blue)'}}>Performance:</span>
              <span className="inline-flex gap-1">{ICF_QUALIFIERS.slice(0,5).map(q => <ScoreButton key={q.value} score={q.value} selected={String(icf.activitiesParticipation?.[item.code+'_p'])===String(q.value)} onClick={() => updateICF('activitiesParticipation',item.code+'_p',q.value)} color={q.color} />)}</span>
            </div>
            <div><span className="text-xs font-bold mr-2" style={{color:'#9333ea'}}>Capacity:</span>
              <span className="inline-flex gap-1">{ICF_QUALIFIERS.slice(0,5).map(q => <ScoreButton key={q.value} score={q.value} selected={String(icf.activitiesParticipation?.[item.code+'_c'])===String(q.value)} onClick={() => updateICF('activitiesParticipation',item.code+'_c',q.value)} color={q.color} />)}</span>
            </div>
          </div>
        </div>
      ))}
    </Card>}
    {section === 'ef' && <Card title="Section IV: Environmental Factors">
      <p className="text-sm mb-3" style={{color:'var(--dp-muted)'}}>Rate as <strong style={{color:'#dc2626'}}>Barriers (0-4)</strong> and <strong style={{color:'#16a34a'}}>Facilitators (+1 to +4)</strong></p>
      {ENVIRONMENTAL_FACTORS.map(item => (
        <div key={item.code} className="mb-2 p-3 rounded-xl" style={{border:'1px solid var(--dp-line)',background:'var(--dp-surface-2)'}}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{fontFamily:'var(--dp-font-mono)',background:'#f3e8ff',color:'#7e22ce'}}>{item.code}</span>
            <span className="text-sm font-medium" style={{color:'var(--dp-ink)'}}>{item.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div><span className="text-xs font-bold mr-2" style={{color:'#dc2626'}}>Barrier:</span>
              <span className="inline-flex gap-1">{[0,1,2,3,4].map(n => <ScoreButton key={n} score={n} selected={String(icf.environmentalFactors?.[item.code+'_b'])===String(n)} onClick={() => updateICF('environmentalFactors',item.code+'_b',n)} color={['#22c55e','#eab308','#f97316','#ef4444','#991b1b'][n]} />)}</span>
            </div>
            <div><span className="text-xs font-bold mr-2" style={{color:'#16a34a'}}>Facilitator:</span>
              <span className="inline-flex gap-1">{[0,1,2,3,4].map(n => <ScoreButton key={n} score={`+${n}`} selected={String(icf.environmentalFactors?.[item.code+'_f'])===String(n)} onClick={() => updateICF('environmentalFactors',item.code+'_f',n)} color={['#d1d5db','#86efac','#4ade80','#22c55e','#15803d'][n]} />)}</span>
            </div>
          </div>
        </div>
      ))}
    </Card>}
  </>);
}

// ─── MODULE 9: SUMMARY & REPORT ───
function Summary({ data, set }: { data: any; set: (d: any) => void }) {
  const sm = data.summary || {};
  const u = (f: string, v: any) => set({ ...data, summary: { ...sm, [f]: v } });

  // Build chart data from ICF ratings
  const icf = data.icfDat || {};
  const avgScore = (sec: string, items: ICFItem[]) => {
    const vals = items.map(i => icf[sec]?.[i.code]).filter((v: any) => v !== undefined && v < 5);
    return vals.length ? (vals.reduce((s: number, v: any) => s + Number(v), 0) / vals.length).toFixed(1) : 0;
  };

  const radarData = [
    { subject: 'Body Functions', score: Number(avgScore('bodyFunctions', BODY_FUNCTIONS)), fullMark: 4 },
    { subject: 'Body Structures', score: Number(avgScore('bodyStructures', BODY_STRUCTURES)), fullMark: 4 },
    { subject: 'Activities', score: Number(avgScore('activitiesParticipation', ACTIVITIES_PARTICIPATION)), fullMark: 4 },
    { subject: 'Environment', score: Number(avgScore('environmentalFactors', ENVIRONMENTAL_FACTORS)), fullMark: 4 },
  ];

  const barData = BODY_FUNCTIONS.filter(bf => icf.bodyFunctions?.[bf.code] !== undefined && icf.bodyFunctions?.[bf.code] < 5).map(bf => ({
    name: bf.code, fullName: bf.name, score: Number(icf.bodyFunctions[bf.code]),
  }));

  const COLORS = ['#22c55e','#eab308','#f97316','#ef4444','#991b1b'];

  const handleExportPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    let y = 15;
    const addH = (t: string) => { if(y>260){doc.addPage();y=15;} doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(0,51,102);doc.text(t,14,y);y+=2;doc.setDrawColor(0,102,204);doc.setLineWidth(0.5);doc.line(14,y,w-14,y);y+=7; };
    const addF = (l: string, v: string) => { if(y>275){doc.addPage();y=15;} doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(80,80,80);doc.text(l+':',14,y);doc.setFont('helvetica','normal');doc.setTextColor(0,0,0);doc.text(String(v||'N/A'),60,y);y+=5; };

    // Title
    doc.setFontSize(9);doc.setTextColor(100);doc.text('Yenepoya Medical College Hospital, Mangaluru',w/2,10,{align:'center'});
    doc.text('Department of Audiology & Speech-Language Pathology',w/2,15,{align:'center'});
    doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(0,51,102);doc.text('Comprehensive Dysphagia Assessment Report',w/2,30,{align:'center'});
    doc.setFontSize(9);doc.setTextColor(100);doc.text('WHO-ICF Based (ICF-DAT) | Copyright Reg. No. LD-20250171253',w/2,37,{align:'center'});
    y=50;

    // Demographics
    addH('1. Patient Information');
    const d = data.demographics || {};
    addF('Name',d.name);addF('Age/Gender',`${d.age||''} / ${d.gender||''}`);addF('Hospital No.',d.hospitalNumber);addF('Language',d.language);
    addF('Evaluation Date',d.evalDate);addF('Examiner',d.examiner);addF('Diagnosis',d.diagnosis);

    // Case History
    addH('2. Case History');
    const ch = data.caseHistory || {};
    addF('Chief Complaint',ch.chiefComplaint);addF('Onset',ch.onset);addF('Duration',ch.duration);addF('Pattern',ch.pattern);

    // Summary
    addH('Summary & Recommendations');
    addF('Diagnosis',sm.diagnosis);addF('Severity',sm.severity);addF('Recommendations',sm.recommendations);addF('Follow-up',sm.followUp);

    // Footer
    const pages = doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(7);doc.setTextColor(150);
      doc.text(`ICF-DAT Report | ${d.name||'Patient'} | Page ${i}/${pages}`,w/2,290,{align:'center'});
      doc.text('Hemaraja Nayaka S, Dr. Vijayalakshmi S, Dr. Jayashree Bhat',w/2,294,{align:'center'});}

    doc.save(`ICF-DAT_${(d.name||'Patient').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (<>
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-xl mb-4 shadow-lg">
      <h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={24} /> Summary Dashboard & Report</h3>
      <p className="text-emerald-100 text-sm mt-1">Overview of all assessments with ICF profile visualization</p>
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <Card title="ICF Domain Profile (Radar)">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{fontSize:11}} />
            <Radar name="Impairment" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center">Higher values = greater impairment (0-4 scale)</p>
      </Card>
      <Card title="Body Functions Impairment Profile">
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0,4]} />
              <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={50} />
              <Tooltip formatter={(v: any, _: any, p: any) => [v, p.payload.fullName]} />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {barData.map((d, i) => <Cell key={i} fill={COLORS[Math.min(d.score, 4)]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-muted-foreground text-sm py-10 text-center">Complete ICF-DAT ratings to see the profile</p>}
      </Card>
    </div>
    {/* Clinical Summary */}
    <Card title="Clinical Summary & Impressions" color="#059669">
      <FormField label="Diagnosis" type="textarea" value={sm.diagnosis} onChange={v => u('diagnosis',v)} placeholder="Clinical diagnosis and impressions..." />
      <FormField label="Dysphagia Severity" type="radio" value={sm.severity} onChange={v => u('severity',v)}
        options={['No Dysphagia','Mild','Mild-Moderate','Moderate','Moderate-Severe','Severe','Profound']} />
      <FormField label="Recommendations" type="textarea" value={sm.recommendations} onChange={v => u('recommendations',v)} placeholder="Treatment plan, diet modifications, exercises..." />
      <FormField label="Counselling" type="textarea" value={sm.counselling} onChange={v => u('counselling',v)} placeholder="Patient/family counselling notes..." />
      <FormField label="Follow-up Plan" type="textarea" value={sm.followUp} onChange={v => u('followUp',v)} placeholder="Follow-up schedule, re-evaluation plan..." />
    </Card>
    {/* Export */}
    <div className="flex gap-3 justify-center">
      <button onClick={handleExportPDF} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-lg hover:opacity-90 transition-all">
        <Download size={18} /> Export PDF Report
      </button>
    </div>
  </>);
}

// ─── MAIN APP ───
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('demographics');
  const [data, setData] = useState<any>(() => {
    const saved = getAllAssessments();
    return saved.length > 0 ? saved[saved.length - 1] : { id: generateId(), demographics: { evalDate: new Date().toISOString().split('T')[0] } };
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [assessments, setAssessments] = useState<AssessmentData[]>(getAllAssessments);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => { if (data.id) saveAssessment(data); }, 2000);
    return () => clearTimeout(timer);
  }, [data]);

  const handleSave = () => { saveAssessment(data); setSaved(true); setAssessments(getAllAssessments()); setTimeout(() => setSaved(false), 2000); };
  const handleNew = () => { const n = { id: generateId(), demographics: { evalDate: new Date().toISOString().split('T')[0] } }; setData(n); setActiveTab('demographics'); };
  const handleLoad = (a: AssessmentData) => { setData(a); setSidebarOpen(false); setActiveTab('demographics'); };
  const handleDelete = (id: string) => { deleteAssessment(id); setAssessments(getAllAssessments()); if (data.id === id) handleNew(); };

  const tabIdx = TABS.findIndex(t => t.id === activeTab);
  const goNext = () => { if (tabIdx < TABS.length - 1) setActiveTab(TABS[tabIdx + 1].id); };
  const goPrev = () => { if (tabIdx > 0) setActiveTab(TABS[tabIdx - 1].id); };

  const progress = useMemo(() => {
    let filled = 0, total = 9;
    if (data.demographics?.name) filled++;
    if (data.caseHistory?.chiefComplaint) filled++;
    if (data.oroMotor && Object.keys(data.oroMotor).length > 2) filled++;
    if (data.behavioral && Object.keys(data.behavioral).length > 2) filled++;
    if (data.safe && Object.keys(data.safe).length > 2) filled++;
    if (data.screening && Object.keys(data.screening).length > 2) filled++;
    if (data.instrumental && Object.keys(data.instrumental).length > 1) filled++;
    if (data.icfDat?.bodyFunctions && Object.keys(data.icfDat.bodyFunctions).length > 0) filled++;
    if (data.summary?.diagnosis) filled++;
    return Math.round((filled / total) * 100);
  }, [data]);

  const renderModule = () => {
    switch (activeTab) {
      case 'demographics': return <Demographics data={data} set={setData} />;
      case 'caseHistory': return <CaseHistory data={data} set={setData} />;
      case 'oroMotor': return <OroMotorExam data={data} set={setData} />;
      case 'behavioral': return <BehavioralSwallowing data={data} set={setData} />;
      case 'safe': return <SAFETest data={data} set={setData} />;
      case 'screening': return <ScreeningTools data={data} set={setData} />;
      case 'instrumental': return <Instrumental data={data} set={setData} />;
      case 'icfDat': return <ICFDATModule data={data} set={setData} />;
      case 'summary': return <Summary data={data} set={setData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen" style={{background:'var(--dp-bg)', fontFamily:'var(--dp-font-ui)'}}>
      {/* Header */}
      <header className="sticky top-0 z-50 no-print" style={{background:'linear-gradient(115deg,var(--dp-navy-900) 0%,#003a9e 55%,var(--dp-blue) 100%)',boxShadow:'0 2px 16px rgba(0,32,108,.25)'}}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 text-white/80 hover:text-white"><Menu size={22} /></button>
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="DysphagiaPro logo" className="h-10 w-10 rounded-xl" style={{filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.25))'}} />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white" style={{fontFamily:'var(--dp-font-display)',letterSpacing:'-0.5px'}}>DysphagiaPro</h1>
                <p className="text-xs" style={{color:'var(--dp-blue-200)'}}>WHO-ICF Assessment Tool</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5" style={{background:'rgba(255,255,255,0.10)'}}>
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.20)'}}>
                <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:'var(--dp-blue-200)'}} />
              </div>
              <span className="text-xs text-white/80" style={{fontFamily:'var(--dp-font-mono)'}}>{progress}%</span>
            </div>
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white"
              style={saved ? {background:'#16a34a'} : {background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.18)'}}>
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />} {saved ? 'Saved!' : 'Save'}
            </button>
            <button onClick={handleNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{background:'var(--dp-orange)',boxShadow:'var(--dp-shadow-cta)'}}>
              <PlusCircle size={16} /> New
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || typeof window !== 'undefined') && (
            <aside className={cn("fixed lg:sticky top-[60px] left-0 h-[calc(100vh-60px)] w-64 z-40 overflow-y-auto no-print transition-transform lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}
              style={{background:'linear-gradient(180deg,var(--dp-navy-900) 0%,var(--dp-navy-950) 100%)'}}>
              <div className="p-3">
                <div className="flex items-center justify-between mb-3 lg:hidden">
                  <span className="font-bold text-sm text-white">Navigation</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
                </div>
                {/* Patient Quick Info */}
                {data.demographics?.name && (
                  <div className="rounded-xl p-3 mb-3" style={{background:'rgba(79,154,255,0.15)',border:'1px solid rgba(79,154,255,0.30)'}}>
                    <div className="text-sm font-bold" style={{color:'var(--dp-blue-400)',fontFamily:'var(--dp-font-display)'}}>{data.demographics.name}</div>
                    <div className="text-xs mt-0.5" style={{color:'var(--dp-blue-200)',opacity:0.8}}>{data.demographics.age && `${data.demographics.age}y`} {data.demographics.gender} {data.demographics.hospitalNumber && `| ${data.demographics.hospitalNumber}`}</div>
                  </div>
                )}
                {/* Tab Navigation */}
                <nav className="space-y-0.5">
                  {TABS.map((tab, i) => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                      style={activeTab === tab.id
                        ? {background:'linear-gradient(100deg,var(--dp-blue),var(--dp-blue-deep))',color:'#fff',fontWeight:600,boxShadow:'var(--dp-shadow-pop)'}
                        : {color:'#aebfdd'}}>
                      <span className="flex-shrink-0">{tab.icon}</span>
                      <span className="flex-1">{tab.label}</span>
                      <span className="text-xs" style={{color:'rgba(174,191,221,0.5)',fontFamily:'var(--dp-font-mono)'}}>{i + 1}</span>
                    </button>
                  ))}
                </nav>
                {/* Saved Assessments */}
                {assessments.length > 0 && (
                  <div className="mt-6 pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                    <h4 className="text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'rgba(174,191,221,0.6)'}}>Saved Assessments</h4>
                    {assessments.slice(-5).reverse().map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-lg text-xs mb-1 cursor-pointer transition-all"
                        style={a.id === data.id ? {background:'rgba(79,154,255,0.15)'} : {}}
                        onMouseEnter={e => { if (a.id !== data.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (a.id !== data.id) (e.currentTarget as HTMLDivElement).style.background = ''; }}
                        onClick={() => handleLoad(a)}>
                        <div>
                          <div className="font-medium text-white/90">{a.demographics?.name || 'Unnamed'}</div>
                          <div style={{color:'rgba(174,191,221,0.6)'}}>{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : ''}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleDelete(a.id); }} style={{color:'rgba(174,191,221,0.4)'}}
                          className="hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </AnimatePresence>
        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-60px)]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-sm no-print" style={{color:'var(--dp-muted)'}}>
            <span>Assessment</span>
            <ChevronRight size={14} />
            <span className="font-semibold" style={{color:'var(--dp-ink)'}}>{TABS[tabIdx]?.label}</span>
            <span className="ml-auto text-xs" style={{fontFamily:'var(--dp-font-mono)',color:'var(--dp-faint)'}}>Step {tabIdx + 1} of {TABS.length}</span>
          </div>

          {/* Module Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}}>
              {renderModule()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 no-print">
            <button onClick={goPrev} disabled={tabIdx === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
              style={tabIdx === 0
                ? {background:'var(--dp-line-soft)',color:'var(--dp-faint)',cursor:'not-allowed'}
                : {background:'var(--dp-surface)',border:'1px solid var(--dp-line)',color:'var(--dp-slate)',boxShadow:'var(--dp-shadow-card)'}}>
              <ChevronLeft size={18} /> Previous
            </button>
            <button onClick={goNext} disabled={tabIdx === TABS.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-white"
              style={tabIdx === TABS.length - 1
                ? {background:'var(--dp-line-soft)',color:'var(--dp-faint)',cursor:'not-allowed'}
                : {background:'var(--dp-blue)',boxShadow:'var(--dp-shadow-pop)'}}>
              Next <ChevronRight size={18} />
            </button>
          </div>

          {/* Footer */}
          <footer className="mt-8 py-4 text-center text-xs no-print" style={{borderTop:'1px solid var(--dp-line)',color:'var(--dp-muted)'}}>
            <p className="font-semibold" style={{color:'var(--dp-slate)'}}>DysphagiaPro — WHO-ICF Based Dysphagia Assessment Tool (ICF-DAT)</p>
            <p className="mt-0.5">Copyright © 2025 Hemaraja Nayaka S, Dr. Vijayalakshmi Subramaniam, Dr. Jayashree Bhat</p>
            <p>Reg. No. LD-20250171253 | Yenepoya Medical College Hospital, Mangaluru</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
