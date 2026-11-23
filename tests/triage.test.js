// Red-flag tests for the triage rules in triage.js.
// Run with: node --test   (Node 18 or newer, no install needed)
//
// Each table below is meant to be readable by a clinician: a phrase or a
// checked box, and the outcome the app gives today. "Known gaps" are cases
// where today's rules likely do the wrong thing. They are marked as todo,
// so they are reported but do not fail the run, until the rules are changed.

const test = require('node:test');
const assert = require('node:assert/strict');
const {RED, TOPICS, triage, textFlags, detectTopic} = require('../triage.js');

const ER = 4;

// The same shape index.html builds from the screens.
function state(over){ return Object.assign({red:[], topic:null, text:'', qs:[], sev:0, act:0, dur:0}, over); }
// What the app does with free text: guess the group, then triage.
function fromText(text){ return triage(state({text, topic: detectTopic(text)})); }

// ---------- 1. Emergency checkboxes (the first screen) ----------

test('every 911 checkbox on its own sends to 911 and the ER level', () => {
  RED.forEach(([label, call], i) => {
    if (call !== '911') return;
    const r = triage(state({red:[i]}));
    assert.equal(r.call, '911', label);
    assert.equal(r.level, ER, label);
    assert.ok(r.reasons.includes(label), label);
  });
});

test('the self-harm checkbox on its own sends to 988 at the ER level', () => {
  const i = RED.findIndex(r => r[1] === '988');
  assert.ok(i >= 0, 'there is a 988 checkbox');
  const r = triage(state({red:[i]}));
  assert.equal(r.call, '988');
  assert.equal(r.level, ER);
});

test('911 wins over 988 when both kinds of box are checked, in either order', () => {
  const i988 = RED.findIndex(r => r[1] === '988'), i911 = RED.findIndex(r => r[1] === '911');
  assert.equal(triage(state({red:[i988, i911]})).call, '911');
  assert.equal(triage(state({red:[i911, i988]})).call, '911');
});

test('red flags override a mild answer in any symptom group', () => {
  for (const topic of Object.keys(TOPICS)){
    const r = triage(state({red:[0], topic, sev:0}));
    assert.equal(r.level, ER, topic);
    assert.equal(r.call, '911', topic);
  }
});

// ---------- 2. Words typed in "describe it in your own words" ----------

const SAYS_911 = [
  'I have chest pain',
  'Chest Pain',                       // capital letters
  'chest pressure since this morning',
  "I can't breathe",
  'I cant breathe',                   // no apostrophe
  'trouble breathing',
  'short of breath',
  'shortness of breath walking upstairs',
  'gasping for air',
  'my face is drooping',
  'slurred speech',
  'sudden weakness in my arm',
  'numbness on one side',
  "the cut won't stop bleeding",
  'bleeding a lot from my leg',
  'blood is spurting',
  'she passed out',
  'he is unconscious',
  'my friend is unresponsive',
  'I had a seizure',
  'my throat is closing',
  'lips swelling after eating peanuts',
  'anaphylaxis',
  'I took an overdose',
  'my kid swallowed pills',
  'I think I was poisoned',
];

for (const text of SAYS_911) test(`911: "${text}"`, () => {
  const r = fromText(text);
  assert.equal(r.call, '911');
  assert.equal(r.level, ER);
});

const SAYS_988 = [
  'I want to kill myself',
  'thinking about suicide',
  'I feel suicidal',
  'I want to end my life',
  'I feel like hurting myself',
  'self harm',
  'self-harm',
];

for (const text of SAYS_988) test(`988: "${text}"`, () => {
  const r = fromText(text);
  assert.equal(r.call, '988');
  assert.equal(r.level, ER);
});

test('911 wins when the same message has both a 911 and a 988 sign', () => {
  assert.equal(fromText('I want to kill myself and I have chest pain').call, '911');
});

// ---------- 3. Things that should NOT set off a red flag ----------

const NOT_RED = [
  'no chest pain, just a cough',
  'not short of breath',
  'I am not suicidal',
  'food poisoning from sushi',        // "poison" here is not an overdose
  'I have poison ivy',
  'sore throat and a runny nose',
];

for (const text of NOT_RED) test(`no 911 or 988: "${text}"`, () => {
  const r = fromText(text);
  assert.equal(r.call, null);
  assert.ok(r.level < ER, `level was ${r.level}`);
});

// ---------- 4. Mental health group (answered questions, not typed words) ----------

test('mental health: "you have a plan to hurt yourself" sends to 988', () => {
  const r = triage(state({topic:'mental', qs:[0]}));
  assert.equal(r.call, '988');
  assert.equal(r.level, ER);
});

test('mental health: "you can\'t keep yourself safe" sends to 988', () => {
  const r = triage(state({topic:'mental', qs:[1]}));
  assert.equal(r.call, '988');
  assert.equal(r.level, ER);
});

test('mental health: the 988 screen still shows for a mild answer', () => {
  // resultView shows the 988 box for any mental health result, even with no call.
  const r = triage(state({topic:'mental', sev:0}));
  assert.equal(r.topic, 'mental');
});

// ---------- 5. Red flags in text stop the questions ----------

test('a red flag in text is found before the questions are asked', () => {
  // index.html skips straight to the result when textFlags finds anything.
  assert.ok(textFlags('I have chest pain').length > 0);
  assert.equal(textFlags('my ankle hurts').length, 0);
});

// ---------- Known gaps: likely wrong today, for clinical review ----------
// These run but do not fail. Remove { todo } once the rules are fixed.

const GAPS = [
  ['I want to die', '988', 'common wording of suicidal thoughts is not matched'],
  ["I don't want to live anymore", '988', 'passive suicidal wording is not matched'],
  ['I want to hurt someone', '988', 'the checkbox covers "someone else", the text rules do not'],
  ['cut myself on purpose', '988', 'self-harm described without the words "self harm"'],
  ['bleeding wont stop', '911', 'only matches "won\'t stop bleeding", not this word order'],
  ['I think I am having a heart attack', '911', '"heart attack" is not a red-flag phrase'],
  ['I think I am having a stroke', '911', '"stroke" is not a red-flag phrase'],
  ['my chest hurts', '911', 'only "chest pain/pressure/tight" is matched'],
  ['my chest feels tight', '911', '"chest tight" must be next to each other'],
  ['he is not breathing', '911', '"not" before "breathing" reads as a denial'],
];

for (const [text, want, why] of GAPS) test(`known gap, should be ${want}: "${text}" (${why})`, {todo: true}, () => {
  assert.equal(fromText(text).call, want);
});

test(`known gap: "I don't have chest pain" still sends to 911`, {todo: 'negation does not recognize "don\'t"; this errs on the safe side'}, () => {
  assert.equal(fromText("I don't have chest pain").call, null);
});
