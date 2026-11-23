// CareAway triage rules. Rules only, no AI; emergency signs run first.
// Loaded by index.html as a plain script, and by the tests in Node.
// Levels: 0 self-care, 1 telehealth, 2 primary care, 3 urgent care, 4 emergency room.
// call: '911', '988' or null.
const RED = [
  ['Chest pain, pressure or tightness','911'],
  ['Trouble breathing, or short of breath while sitting still','911'],
  ['Fainting, or someone can\'t wake you easily','911'],
  ['Sudden weakness or numbness on one side, slurred speech, or the worst headache of your life','911'],
  ['Bleeding that won\'t stop after 10 minutes of firm pressure','911'],
  ['Swelling of the lips, tongue or throat, or a whole-body reaction after a food or sting','911'],
  ['Thoughts of hurting yourself or someone else','988']
];
const TOPICS = {
  burn:{label:'Burn, scald or sunburn', sub:'Heat, steam, sun, chemicals, electricity', re:/burn|scald/, base:[0,1,3], src:'burns.html', srcName:'Burns',
    qs:[['On the face, hands, feet, genitals, or over a joint',4],['Bigger than the palm of your hand',4],['From chemicals or electricity',4],['Skin looks white, charred or leathery',4],['It has blistered',3],['Getting more red, swollen or painful after a day or two',3]]},
  cut:{label:'Cut, scrape or wound', sub:'Including bites, punctures and nosebleeds', re:/\bcut\b|lacerat|gash|wound|stitch|bleed|scrape|punctur/, base:[0,3,3], src:'woundsandinjuries.html', srcName:'Wounds and injuries',
    qs:[['Deep or gaping, or the edges won\'t stay together',3],['From a bite, or a dirty or rusty object',3],['Something is stuck in it',3],['Numb beyond the cut, or you can\'t move that part',4],['Red streaks, pus or spreading redness',3]]},
  fever:{label:'Fever, cold, flu or sore throat', sub:'Including cough and congestion', re:/fever|chills|temperature|throat|\bcold\b|\bflu\b|congest|runny|sinus|tonsil/, base:[0,1,3], src:'fever.html', srcName:'Fever',
    qs:[['103°F (39.4°C) or higher',3],['Stiff neck, confusion, or a rash that doesn\'t fade when pressed',4],['Can\'t swallow your own saliva, or drooling',4],['Fever for more than 3 days',2],['Getting better, then suddenly worse',2]]},
  sprain:{label:'Sprain, strain or possible fracture', sub:'Twists, falls, and blows to an arm or leg', re:/sprain|strain|twist|ankle|wrist|knee|fell\b|\bfall|fractur|broke/, base:[0,3,3], src:'sprainsandstrains.html', srcName:'Sprains and strains',
    qs:[['Can\'t put weight on it or use it',3],['Looks bent or out of place',4],['Numb, cold or turning blue',4],['Heard a pop or crack when it happened',3],['Hit your head as well',4]]},
  stomach:{label:'Stomach pain, vomiting or diarrhea', sub:'Including food poisoning and constipation', re:/stomach|nausea|vomit|diarrh|throw(ing)? up|belly|abdom|constipat|food poison/, base:[0,1,3], src:'abdominalpain.html', srcName:'Abdominal pain',
    qs:[['Severe pain in one spot, or a hard, rigid belly',4],['Blood in vomit or stool',4],['Can\'t keep fluids down for 24 hours',3],['Very dizzy, or barely peeing',3],['You are or might be pregnant',3]]},
  rash:{label:'Rash or skin problem', sub:'Including hives, bug bites and infections', re:/rash|hives|itch|\bbite|sting|skin/, base:[0,1,3], src:'rashes.html', srcName:'Rashes',
    qs:[['Spreading fast, with fever',4],['Blistering, peeling, or close to your eyes',3],['Hot, swollen and getting bigger',3],['Started after a new medicine',3]]},
  mental:{label:'Mental health or a hard week', sub:'Anxiety, low mood, panic, not sleeping', re:/anxi|depress|panic|can'?t sleep|insomnia|stress|lonely|hopeless|mental/, base:[1,1,3], src:'mentalhealth.html', srcName:'Mental health',
    qs:[['You have a plan to hurt yourself',4],['You can\'t keep yourself safe right now',4],['Hearing or seeing things others don\'t, or feeling completely out of touch',4],['Withdrawal from alcohol or pills that is making you shake or confused',4]]},
  breath:{label:'Breathing, cough or heart', sub:'Cough, wheezing, palpitations, chest tightness', re:/cough|wheez|asthma|palpitat|heart|breath/, base:[0,1,3], src:'breathingproblems.html', srcName:'Breathing problems',
    qs:[['Hard to breathe or wheezing while resting',4],['Heart racing or pounding that won\'t settle',4],['Coughing up blood',4],['Cough for more than 3 weeks, or a high fever',2]]},
  other:{label:'Something else', sub:'Not listed above. Describe it in your own words', re:/$^/, base:[1,3,3], src:'emergencymedicalservices.html', srcName:'Emergency medical services',
    qs:[['Pain that is severe or getting worse fast',3],['Confusion, or trouble staying awake',4],['Fever along with it',2],['It has worried you for weeks',2]]}
};
const RED_TEXT = [
  [/chest (pain|pressure|tight)/,'You mentioned chest pain or pressure','911'],
  [/(can'?t|cannot|can not|hard to|trouble|difficulty|struggling to) breath|short(ness)? of breath|gasping/,'You mentioned trouble breathing','911'],
  [/face (is )?droop|slurr|can'?t speak|sudden(ly)? (weak|confus|numb)|numb(ness)? (on|in|down) (one|my (left|right))/,'You described possible stroke signs','911'],
  [/(won'?t|will not|can'?t|cannot|doesn'?t|does not) stop bleeding|bleeding (a lot|heavily|badly)|spurting|gushing/,'You described heavy bleeding','911'],
  [/passed out|passing out|unconscious|fainted|unresponsive|seizure|convuls/,'You mentioned fainting or a seizure','911'],
  [/(throat|tongue|lips?|face) (is |are )?(swelling|swollen|closing)|anaphyla/,'You described swelling of the face, mouth or throat','911'],
  [/overdos|poison(ed|ing)?\b(?! ivy)|swallowed (bleach|pills|a chemical|chemicals)/,'You mentioned a possible overdose or poisoning','911'],
  [/suicid|kill myself|end my life|hurt(ing)? myself|self.?harm/,'You mentioned thoughts of harming yourself','988'],
  [/(cough|vomit|throw)(ing)? (up )?blood|blood in (my )?(vomit|stool|poop)/,'You mentioned blood in vomit, cough or stool','er'],
  [/worst headache/,'You described the worst headache of your life','er'],
  [/bone (is )?(sticking|showing|poking)|deformed|out of place/,'You described a possible broken bone','er'],
  [/stiff neck/,'You mentioned a stiff neck','er'],
  [/(hit|bump|bang)(ed)? my head|head injury|concussion/,'You mentioned a head injury','er'],
  [/burn[^.]*\b(face|hands?|fingers?|feet|foot|genital|groin|eye)|\b(face|hands?|fingers?|feet|foot|genital|groin|eye)[^.]*burn/,'A burn on the face, hands, feet or genitals','er'],
  [/(chemical|electric)[^.]*burn|burn[^.]*(chemical|electric)/,'A chemical or electrical burn','er']
];
function negated(text, idx){ return /\b(no|not|without|never)\b[^.,;!?]{0,14}$/.test(text.slice(0, idx)); }
function detectTopic(text){
  const t = text.toLowerCase();
  if (/food poison/.test(t)) return 'stomach';
  for (const k in TOPICS) if (TOPICS[k].re.test(t)) return k;
  return 'other';
}
function textFlags(text){
  const t = text.toLowerCase(), out = [];
  if (/food poison/.test(t)) return out.concat(RED_TEXT.filter(r => r[2] !== '911' || !/poison/.test(r[0].source)).filter(r => { const m = r[0].exec(t); return m && !negated(t, m.index); }));
  for (const r of RED_TEXT){ const m = r[0].exec(t); if (m && !negated(t, m.index)) out.push(r); }
  return out;
}
function triage(s){
  const reasons = [], topicKey = s.topic || 'other', topic = TOPICS[topicKey], t = s.text.toLowerCase();
  let call = null, level = 0, sev = s.sev;
  const bump = k => { if (k === '911') call = '911'; else if (k === '988' && !call) call = '988'; };
  s.red.forEach(i => { reasons.push(RED[i][0]); level = 4; bump(RED[i][1]); });
  textFlags(s.text).forEach(r => { reasons.push(r[1]); level = 4; bump(r[2]); });
  if (/severe|unbearable|excruciating|worst pain|10\/10/.test(t) && sev < 2){ sev = 2; reasons.push('You described it as severe'); }
  if (level < 4){
    level = topic.base[sev];
    reasons.push(topic.label + ', ' + ['mild','moderate','severe'][sev]);
    s.qs.forEach(i => { const q = topic.qs[i]; if (q[1] > level) level = q[1]; reasons.push(q[0]); });
    if (topicKey === 'mental' && s.qs.some(i => i < 2)) call = '988';
    if (s.act === 2 && level < 3){ level = 3; reasons.push('You can\'t do your normal activities'); }
    else if (s.act === 1 && level < 1){ level = 1; reasons.push('You are doing less than usual'); }
    if (s.dur === 3 && level < 2){ level = 2; reasons.push('It has lasted more than a week'); }
    if (topicKey === 'other' && s.text.trim()) reasons.push('We couldn\'t match your description to a group, so we stepped up a level to be safe');
  }
  return {level, reasons, call, topic: topicKey};
}

if (typeof module !== 'undefined' && module.exports) module.exports = {RED, TOPICS, RED_TEXT, negated, detectTopic, textFlags, triage};
