import React, { useState } from 'react';
import { ExamPicker } from './ExamPicker';
import { examsOf, hasSchoolCert, toggleExam } from '../../lib/student-exams';
import { SchoolCertPicker } from './SchoolCertPicker';
import type { UserProfile, DailyCommitment } from '../../types';
import { JAMB_SUBJECTS, NIGERIAN_INSTITUTIONS, POPULAR_COURSES } from '../../data/nigerian-curriculum';
import {
  OwlBookLogo,
  CheckIcon,
  LockIcon,
  BellIcon,
  CloudCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../Icons';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onFinish: () => void;
}

export const SetupWizardView: React.FC<Props> = ({ profile, onUpdateProfile, onFinish }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [instFilter, setInstFilter] = useState<'All' | 'Federal' | 'State' | 'Private'>('All');
  const [instSearch, setInstSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  const steps = [
    { number: 1, title: 'Exam Track', desc: 'UTME or Post-UTME' },
    { number: 2, title: 'Subjects', desc: '4 registered subjects' },
    { number: 3, title: 'Institution & Course', desc: 'Target admission quota' },
    { number: 4, title: 'Target Score', desc: 'Benchmarking & daily plan' },
    { number: 5, title: 'Study Setup', desc: 'Reminders & offline cache' },
  ];

  const handleToggleSubject = (name: string) => {
    const exists = profile.selectedSubjects.includes(name);
    if (exists) {
      onUpdateProfile({ selectedSubjects: profile.selectedSubjects.filter((s) => s !== name) });
    } else if (profile.selectedSubjects.length < 4) {
      onUpdateProfile({ selectedSubjects: [...profile.selectedSubjects, name] });
    }
  };

  const filteredInstitutions = NIGERIAN_INSTITUTIONS.filter((inst) => {
    const matchFilter = instFilter === 'All' || inst.type === instFilter;
    const matchSearch =
      inst.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      inst.shortName.toLowerCase().includes(instSearch.toLowerCase()) ||
      inst.location.toLowerCase().includes(instSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredCourses = POPULAR_COURSES.filter((c) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.faculty.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="wizard-page">
      <div className="wizard-card-wrapper">
        {/* Left Sidebar Stepper */}
        <aside className="wizard-sidebar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <OwlBookLogo size={24} showSpark={true} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#FFFFFF' }}>
                i-Tutor Setup
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#D8EEEB', lineHeight: '1.5' }}>
              Configure your Nigerian curriculum profile to unlock calibrated AI drills and verified past question mocks.
            </p>

            {/* Stepper Steps */}
            <div className="stepper-list">
              {steps.map((s) => {
                const isActive = s.number === currentStep;
                const isCompleted = s.number < currentStep;

                let circleClass = 'stepper-circle pending';
                if (isActive) circleClass = 'stepper-circle active';
                else if (isCompleted) circleClass = 'stepper-circle completed';

                return (
                  <div key={s.number} className="stepper-item">
                    <div className={circleClass}>
                      {isCompleted ? <CheckIcon size={14} color="#FFFFFF" /> : s.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: isActive ? 700 : 500, color: isActive ? '#FFFFFF' : '#A7F3D0' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            🔒 All study data is preserved locally. Works seamlessly on low-bandwidth and offline connections.
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="wizard-main">
          {/* STEP 1: Exam Track */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span className="pill-badge pill-blue" style={{ marginBottom: '8px' }}>
                  STEP 1 OF 5
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Which exams are you preparing for?
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '15px', marginTop: '4px' }}>
                  Tick all that apply — you can change this any time.
                </p>
              </div>

              <ExamPicker
                selected={examsOf(profile)}
                onToggle={(exam) => onUpdateProfile(toggleExam(examsOf(profile), exam))}
              />
              {hasSchoolCert(examsOf(profile)) && (
                <div className="setup-sc">
                  <h3>WAEC / NECO class and subjects</h3>
                  <SchoolCertPicker value={profile.schoolCert} onChange={(schoolCert) => onUpdateProfile({ schoolCert })} />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Subject Picker */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="pill-badge pill-blue" style={{ marginBottom: '8px' }}>
                    STEP 2 OF 5
                  </span>
                  <span
                    className="pill-badge"
                    style={{
                      background: profile.selectedSubjects.length === 4 ? 'var(--emerald-50)' : 'var(--amber-50)',
                      color: profile.selectedSubjects.length === 4 ? 'var(--emerald-600)' : 'var(--amber-600)',
                      border: profile.selectedSubjects.length === 4 ? '1px solid var(--emerald-100)' : '1px solid var(--amber-100)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {profile.selectedSubjects.length} of 4 Subjects Selected
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Select your 4 registered subjects
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '14px', marginTop: '4px' }}>
                  Select the combination matching your university faculty requirement brochure.
                </p>
              </div>

              {/* Compulsory English Notification */}
              <div
                style={{
                  background: 'var(--amber-50)',
                  border: '1px solid var(--amber-100)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#92400E',
                  fontWeight: 600,
                }}
              >
                <LockIcon size={16} color="#92400E" />
                <span>Use of English is compulsory for all candidates and locked by default.</span>
              </div>

              {/* 2-Column Subject Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {JAMB_SUBJECTS.map((subj) => {
                  const isSelected = profile.selectedSubjects.includes(subj.name);
                  const isLocked = subj.isCompulsory;
                  const isComingSoon = subj.isComingSoon;

                  return (
                    <div
                      key={subj.id}
                      onClick={() => {
                        if (isLocked || isComingSoon) return;
                        handleToggleSubject(subj.name);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--teal-900)' : '1px solid var(--slate-200)',
                        backgroundColor: isSelected ? 'var(--teal-50)' : isLocked ? 'var(--slate-50)' : 'var(--white)',
                        cursor: isComingSoon ? 'not-allowed' : isLocked ? 'default' : 'pointer',
                        opacity: isComingSoon ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--teal-900)' : 'var(--slate-800)' }}>
                          {subj.name}
                        </span>
                        {isComingSoon && (
                          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Coming soon</div>
                        )}
                        {isLocked && (
                          <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Compulsory</div>
                        )}
                      </div>

                      {isLocked ? (
                        <LockIcon size={16} color="var(--slate-400)" />
                      ) : isComingSoon ? null : (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: isSelected ? '2px solid var(--teal-900)' : '1.5px solid var(--slate-300)',
                            backgroundColor: isSelected ? 'var(--teal-900)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <CheckIcon size={12} color="#FFFFFF" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Target School & Course */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="pill-badge pill-blue" style={{ marginBottom: '8px' }}>
                  STEP 3 OF 5
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Target Institution & Course of Study
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '14px', marginTop: '4px' }}>
                  Used to benchmark competitive admission quota and departmental cut-off marks.
                </p>
              </div>

              {/* Institution Selection */}
              <div>
                <label className="web-label">Select University or Polytechnic</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {(['All', 'Federal', 'State', 'Private'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setInstFilter(filter)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: instFilter === filter ? '1px solid var(--teal-900)' : '1px solid var(--slate-200)',
                        background: instFilter === filter ? 'var(--teal-900)' : 'var(--white)',
                        color: instFilter === filter ? '#FFFFFF' : 'var(--slate-700)',
                        cursor: 'pointer',
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                  placeholder="Search university by name or location..."
                  className="web-input"
                  style={{ marginBottom: '8px', padding: '8px 12px', fontSize: '13px' }}
                />

                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '6px' }}>
                  {filteredInstitutions.map((inst) => {
                    const isSelected = profile.targetInstitution.includes(inst.shortName);
                    return (
                      <div
                        key={inst.id}
                        onClick={() =>
                          onUpdateProfile({
                            targetInstitution: `${inst.name} (${inst.shortName})`,
                            targetInstitutionType: inst.type,
                          })
                        }
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'var(--teal-50)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--teal-900)' : 'var(--slate-800)' }}>
                          {inst.name} ({inst.shortName}) · {inst.location}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>{inst.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <label className="web-label">Select Course of Study</label>
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course or faculty..."
                  className="web-input"
                  style={{ marginBottom: '8px', padding: '8px 12px', fontSize: '13px' }}
                />

                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '6px' }}>
                  {filteredCourses.map((c) => {
                    const isSelected = profile.targetCourse === c.name;
                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          onUpdateProfile({
                            targetCourse: c.name,
                            targetFaculty: c.faculty,
                          })
                        }
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'var(--teal-50)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--teal-900)' : 'var(--slate-800)' }}>
                          {c.name} · {c.faculty}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--amber-600)', fontWeight: 700 }}>Cut-off: {c.benchmarkScore}+</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Target Score & Daily Plan */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span className="pill-badge pill-blue" style={{ marginBottom: '8px' }}>
                  STEP 4 OF 5
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Set your target score & daily commitment
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '14px', marginTop: '4px' }}>
                  Calibrate your daily questions to hit your goal.
                </p>
              </div>

              {/* Score Slider */}
              <div style={{ background: 'var(--slate-50)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Target Score
                  </span>
                  <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--teal-900)', fontFamily: 'var(--font-display)' }}>
                    {profile.targetScore} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate-500)' }}>/ 400</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="160"
                  max="400"
                  step="5"
                  value={profile.targetScore}
                  onChange={(e) => onUpdateProfile({ targetScore: Number(e.target.value) })}
                  style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: 'var(--teal-900)' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--slate-500)', marginTop: '8px' }}>
                  <span>160 (Min)</span>
                  <span>200</span>
                  <span>250</span>
                  <span style={{ fontWeight: 700, color: 'var(--teal-900)' }}>280 (Competitive Top Federal)</span>
                  <span>400</span>
                </div>
              </div>

              {/* Daily Commitment */}
              <div>
                <label className="web-label">Daily Time Commitment</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {(['30min', '1hour', '2hours', '3hours'] as DailyCommitment[]).map((time) => {
                    const isSelected = profile.dailyCommitment === time;
                    const labels: Record<DailyCommitment, string> = {
                      '30min': '30 Minutes',
                      '1hour': '1 Hour',
                      '2hours': '2 Hours',
                      '3hours': '3+ Hours',
                    };
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => onUpdateProfile({ dailyCommitment: time })}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--teal-900)' : '1px solid var(--slate-200)',
                          background: isSelected ? 'var(--teal-50)' : 'var(--white)',
                          color: isSelected ? 'var(--teal-900)' : 'var(--slate-700)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {labels[time]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Permissions & Offline Primer */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span className="pill-badge pill-blue" style={{ marginBottom: '8px' }}>
                  STEP 5 OF 5
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Finalize your study setup
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '14px', marginTop: '4px' }}>
                  Equip your browser with offline storage and streak alerts.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--teal-900)',
                    background: 'var(--teal-50)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <BellIcon size={28} color="var(--teal-900)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Daily Study Streak Reminders
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '2px' }}>
                      Gentle browser prompts based on your daily commitment to protect your learning streak.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--emerald-600)',
                    background: 'var(--emerald-50)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <CloudCheckIcon size={28} color="var(--emerald-600)" />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Offline Question Bank Caching
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '2px' }}>
                      Stores 2,400+ questions locally so you can practice even when mobile data fluctuates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--slate-200)', marginTop: '24px' }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="btn-subtle"
              >
                <ArrowLeftIcon size={16} /> Back
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="btn-solid-teal"
              >
                Next Step <ArrowRightIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="btn-solid-teal"
                style={{ backgroundColor: 'var(--emerald-600)', borderColor: 'var(--emerald-600)', padding: '12px 24px' }}
              >
                Complete Setup & Go to Dashboard <CheckIcon size={16} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
