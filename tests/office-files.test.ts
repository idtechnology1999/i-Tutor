import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questionsFromRows } from '../src/lib/office-files.ts';

/* Excel sheets laid out as questions import exactly (npm test). */

test('a sheet with Question / A–D / Answer / Topic columns becomes questions', () => {
  const rows = [
    ['Question', 'A', 'B', 'C', 'D', 'Answer', 'Topic'],
    ['What is the SI unit of force?', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 'Measurement'],
    ['Most abundant gas in air?', 'Oxygen', 'CO2', 'Nitrogen', 'Argon', 'c.', 'Gases'],
    ['Answer given as the option text', 'Red', 'Blue', '', '', 'Blue', ''],
    ['', '', '', '', '', '', ''],
    ['No answer here', 'Yes', 'No', '', '', '', ''],
  ];
  const qs = questionsFromRows(rows, null)!;
  assert.equal(qs.length, 4, 'blank rows are skipped');
  assert.equal(qs[0].correctAnswer, 'B');
  assert.equal(qs[0].topic, 'Measurement');
  assert.equal(qs[1].correctAnswer, 'C', 'lower case and a full stop are fine');
  assert.equal(qs[2].correctAnswer, 'B', 'the answer can be the option text');
  assert.equal(qs[2].options.length, 2, 'empty options are dropped');
  assert.equal(qs[3].correctAnswer, '');
  assert.equal(qs[3].needsReview, true, 'a missing answer is flagged for review');
});

test('a sheet without question columns is left for the AI reader', () => {
  assert.equal(questionsFromRows([['Name', 'Score'], ['Ada', '70']], null), null);
  assert.equal(questionsFromRows([], null), null);
});
