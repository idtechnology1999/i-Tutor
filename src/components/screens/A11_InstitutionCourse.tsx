import React, { useState } from 'react';
import { ArrowLeftIcon, SearchIcon, XIcon, CheckIcon, ArrowRightIcon } from '../Icons';
import { NIGERIAN_INSTITUTIONS, POPULAR_COURSES } from '../../data/nigerian-curriculum';
import type { Institution, Course } from '../../types';

interface Props {
  selectedInstitution: string;
  selectedCourse: string;
  onSelectInstitution: (inst: Institution) => void;
  onSelectCourse: (course: Course) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const A11_InstitutionCourse: React.FC<Props> = ({
  selectedInstitution,
  selectedCourse,
  onSelectInstitution,
  onSelectCourse,
  onContinue,
  onBack,
}) => {
  const [activeSheet, setActiveSheet] = useState<'institution' | 'course' | null>(null);
  const [instSearch, setInstSearch] = useState('');
  const [instFilter, setInstFilter] = useState<'All' | 'Federal' | 'State' | 'Private'>('All');
  const [courseSearch, setCourseSearch] = useState('');

  // Filtered institutions
  const filteredInstitutions = NIGERIAN_INSTITUTIONS.filter((inst) => {
    const matchesFilter = instFilter === 'All' || inst.type === instFilter;
    const matchesQuery =
      inst.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      inst.shortName.toLowerCase().includes(instSearch.toLowerCase()) ||
      inst.location.toLowerCase().includes(instSearch.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  // Filtered courses
  const filteredCourses = POPULAR_COURSES.filter((c) => {
    return (
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.faculty.toLowerCase().includes(courseSearch.toLowerCase())
    );
  });

  const canContinue = Boolean(selectedInstitution && selectedCourse);

  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Top Header & 60% Progress Bar */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-icon-touch"
            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
            aria-label="Back"
          >
            <ArrowLeftIcon size={20} color="var(--neutral-900)" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-700)' }}>
            Step 3 of 5
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* 60% Teal Progress Bar */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'var(--neutral-200)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '60%',
              background: 'var(--teal-900)',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '20px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '8px' }}>
            What is your target course & school?
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Your school sets your Post-UTME, so we’ll prepare you with its past questions — and use its cut-off
            marks for your goal.
          </p>
        </div>

        {/* Institution Input Field (Tap opens Bottom Sheet) */}
        <div className="form-input-group">
          <label className="form-label">Target University or Polytechnic</label>
          <div
            onClick={() => setActiveSheet('institution')}
            className="form-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: selectedInstitution ? 'var(--teal-50)' : 'var(--white)',
              borderColor: selectedInstitution ? 'var(--teal-900)' : 'var(--neutral-200)',
            }}
          >
            <span style={{ color: selectedInstitution ? 'var(--teal-900)' : 'var(--neutral-400)', fontWeight: selectedInstitution ? 600 : 400 }}>
              {selectedInstitution || 'Select institution (e.g. UNILAG, UI, OAU)'}
            </span>
            <SearchIcon size={18} color="var(--neutral-600)" />
          </div>
        </div>

        {/* Course Input Field (Tap opens Bottom Sheet) */}
        <div className="form-input-group">
          <label className="form-label">Target Course of Study</label>
          <div
            onClick={() => setActiveSheet('course')}
            className="form-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: selectedCourse ? 'var(--teal-50)' : 'var(--white)',
              borderColor: selectedCourse ? 'var(--teal-900)' : 'var(--neutral-200)',
            }}
          >
            <span style={{ color: selectedCourse ? 'var(--teal-900)' : 'var(--neutral-400)', fontWeight: selectedCourse ? 600 : 400 }}>
              {selectedCourse || 'Select course (e.g. Medicine, Computer Science)'}
            </span>
            <SearchIcon size={18} color="var(--neutral-600)" />
          </div>
        </div>

        {/* Escape Option: "I'm not sure yet — help me explore options later" */}
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              onSelectInstitution(NIGERIAN_INSTITUTIONS[0]);
              onSelectCourse(POPULAR_COURSES[0]);
              onContinue();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--teal-700)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '8px',
            }}
          >
            I'm not sure yet — help me explore options later
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Sticky CTA */}
        <div style={{ paddingTop: '16px' }}>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            Continue to Study Goal
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* INSTITUTION SEARCHABLE BOTTOM SHEET */}
      {activeSheet === 'institution' && (
        <div className="bottom-sheet-backdrop" onClick={() => setActiveSheet(null)}>
          <div className="bottom-sheet-surface" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 className="text-heading-2" style={{ color: 'var(--neutral-900)' }}>
                Select Institution
              </h2>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <XIcon size={20} color="var(--neutral-600)" />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                value={instSearch}
                onChange={(e) => setInstSearch(e.target.value)}
                placeholder="Search by name, acronym, or location..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px', minHeight: '44px' }}
                autoFocus
              />
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon size={18} color="var(--neutral-400)" />
              </div>
            </div>

            {/* Quick-Filter Pills: Federal, State, Private */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(['All', 'Federal', 'State', 'Private'] as const).map((filter) => {
                const isActive = instFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setInstFilter(filter)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: isActive ? '1.5px solid var(--teal-900)' : '1px solid var(--neutral-300)',
                      background: isActive ? 'var(--teal-900)' : 'var(--white)',
                      color: isActive ? '#FFFFFF' : 'var(--neutral-700)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredInstitutions.map((inst) => {
                const isSelected = selectedInstitution === inst.name;
                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      onSelectInstitution(inst);
                      setActiveSheet(null);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid var(--teal-900)' : '1px solid var(--neutral-200)',
                      backgroundColor: isSelected ? 'var(--teal-50)' : 'var(--white)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--neutral-900)' }}>
                        {inst.name} ({inst.shortName})
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                        {inst.location} • <span style={{ color: 'var(--teal-700)', fontWeight: 500 }}>{inst.type}</span>
                      </div>
                    </div>
                    {isSelected && <CheckIcon size={18} color="var(--teal-900)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* COURSE SEARCHABLE BOTTOM SHEET */}
      {activeSheet === 'course' && (
        <div className="bottom-sheet-backdrop" onClick={() => setActiveSheet(null)}>
          <div className="bottom-sheet-surface" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 className="text-heading-2" style={{ color: 'var(--neutral-900)' }}>
                Select Target Course
              </h2>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <XIcon size={20} color="var(--neutral-600)" />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search course or faculty..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px', minHeight: '44px' }}
                autoFocus
              />
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon size={18} color="var(--neutral-400)" />
              </div>
            </div>

            {/* List with Faculties */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCourses.map((c) => {
                const isSelected = selectedCourse === c.name;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCourse(c);
                      setActiveSheet(null);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid var(--teal-900)' : '1px solid var(--neutral-200)',
                      backgroundColor: isSelected ? 'var(--teal-50)' : 'var(--white)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--neutral-900)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                        {c.faculty} • <span style={{ color: 'var(--amber-600)', fontWeight: 600 }}>Cut-off: {c.benchmarkScore}+</span>
                      </div>
                    </div>
                    {isSelected && <CheckIcon size={18} color="var(--teal-900)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
