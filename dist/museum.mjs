import { createWorld } from './museum-world.mjs';
import { hall, proofOrder, stations } from './gallery-layout.mjs';
import { attachPlans, placeOnPlan, showPlanTarget } from './museum-plan.mjs';
import { mountZeroAtlas } from './zero-atlas.mjs';
import { copy, getLanguage, saveLanguage } from './museum-i18n.mjs';
import { proofCopy, proofLinks } from './proof-copy.mjs';
import { resultCopy } from './proof-results.mjs';
import { mountPrimeErrorModel, workshops } from './proof-workbench.mjs';

const get = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const intro = get('intro');
const hud = get('hud');
const panel = get('panel');
const map = get('map');
const notes = get('notes');
const feedback = get('feedback');
const languageButtons = [...document.querySelectorAll('[data-language]')];
const compass = get('waypoint');
const returnTarget = {x: 0, z: -.65};
const routeButtons = [...document.querySelectorAll('[data-room]')].filter((item) => item.tagName === 'BUTTON');
const handlesLayer = get('piece-handles');
let sceneHandles = [];
const progressKey = 'riemann-exhibit-shards-v1';
const mainHash = '017645ca448f2fd1f6fd5c4c2cb2c6e96e472725be13f6e180ca6e1574360939';
const proofSize = stations.length;
const waveHeights = ['14.1347', '25.0109', '32.9351'];

const initialValues = [
  [-1.25, .90, -1.45], [1], [], [12, 0], [0], [4, .7, 2], [.47, 0, 0],
];
const completedValues = [
  [0, 0, 0], [6], [], [32, 1], [11], [4, 2, 1], [.75, 28, 1],
];
let language = getLanguage();

function localizedCopy() {
  const {rooms, ...writing} = proofCopy[language];
  const base = copy[language];
  const results = resultCopy(language);
  return {...base, ...writing, resultsLink: results.summary, endingText: results.short, rooms: [...base.rooms, ...Object.values(rooms)]};
}

let words = localizedCopy();

let world;
let started = false;
let activeRoom = null;
let nearby = -1;
let toastTimer;
let finaleTimer;
let kernelCheck = null;
let audio;
let preservedFocus;
let lastLocation = -2;
let targetRoom = 0;
let finalePlaying = false;
let visitorX = hall.x;
let visitorZ = hall.z;

function loadedProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(progressKey) || '[]');
    if (Array.isArray(stored)) return new Set(stored.filter((item) => Number.isInteger(item) && item >= 0 && item < proofSize));
  } catch {}
  return new Set();
}

let earned = loadedProgress();
let states = freshStates();

function freshStates() {
  return initialValues.map((initial, i) => ({
    values: [...(earned.has(i) ? completedValues[i] : initial)],
    count: earned.has(i) && [2, 4, 5].includes(i) ? 3 : 0,
    done: earned.has(i),
  }));
}

function persist() {
  try { localStorage.setItem(progressKey, JSON.stringify([...earned])); } catch {}
}

function announce(text) {
  const toast = get('toast');
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function updateFrame(x, z, room, yaw) {
  if (room !== lastLocation) {
    lastLocation = room;
    nearby = room;
    renderLocation(room);
  }
  if (visitorX !== x || visitorZ !== z) {
    visitorX = x;
    visitorZ = z;
    placeOnPlan(get('mini-you'), x, z);
    if (map.open) placeOnPlan(get('floor-you'), x, z);
    renderFinaleButton();
  }
  const target = targetRoom === null ? returnTarget : stations[targetRoom];
  if (target) {
    const delta = Math.atan2(-(target.x - x), -(target.z - z)) - yaw;
    compass.style.setProperty('--bearing', `${-delta}rad`);
  }
  compass.hidden = !target || !world || nearby === targetRoom || activeRoom !== null ||
    (targetRoom === null && Math.hypot(x, z + 4) < 5.8);
  if (activeRoom !== null && sceneHandles.length > 0) {
    const points = world.handlePositions(activeRoom);
    sceneHandles.forEach((handle, i) => {
      const spot = points[i];
      handle.hidden = !spot?.[2] || (activeRoom !== 0 && states[activeRoom].done);
      if (handle.hidden) return;
      handle.style.left = spot[0] + '%';
      handle.style.top = spot[1] + '%';
    });
  }
}

function renderLocation(room) {
  const exhibit = words.rooms[room];
  get('location-kicker').textContent = exhibit ? galleryLabel(room) : words.collection;
  const title = exhibit?.title ?? words.hall;
  get('location-name').textContent = title;
  get('map-location').textContent = words.mapLocation(title);
  get('location-hint').textContent = exhibit?.hint ?? (started && !world ? words.no3d :
    targetRoom === null ? words.finishHint : words.hallHint);
  get('engage').hidden = !exhibit || activeRoom !== null || !get('final-card').hidden;
  get('engage').querySelector('span').textContent = words.interact;
}

function galleryLabel(room) {
  return '0' + (proofOrder.indexOf(room) + 1) + ' / ' + words.rooms[room].category;
}

function renderLanguage() {
  document.documentElement.lang = language;
  document.title = words.title;
  document.querySelector('meta[name="description"]').content = words.meta;
  for (const node of document.querySelectorAll('[data-text]')) {
    node.textContent = words[node.dataset.text];
  }
  for (const node of document.querySelectorAll('[data-label]')) {
    node.setAttribute('aria-label', words[node.dataset.label]);
  }
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
  for (const button of routeButtons) {
    button.querySelector('.room-name').textContent = words.rooms[Number(button.dataset.room)].title;
  }
  get('sound-label').textContent = audio?.enabled ? words.soundOff : words.soundOn;
  get('toast').classList.remove('visible');
  renderLocation(nearby);
  if (activeRoom !== null) openPanel(activeRoom, false);
  updateProgress();
  renderWaypoint();
}

function syncWorld() {
  world?.setStates(states);
  world?.suspend(!started || activeRoom !== null || finalePlaying || map.open || notes.open || !get('final-card').hidden);
}

function updateProgress() {
  get('map-progress').textContent = words.shards(earned.size);
  for (const link of routeButtons) {
    const completed = earned.has(Number(link.dataset.room));
    link.querySelector('small').textContent = completed ? words.visits : '';
  }
  renderFinaleButton();
  world?.setStates(states);
}

function renderFinaleButton() {
  get('finale').hidden = earned.size !== proofSize || (!!world && Math.hypot(visitorX, visitorZ + 4) >= 5.8);
}

function renderWaypoint() {
  const target = targetRoom === null ? returnTarget : stations[targetRoom];
  const title = targetRoom === null ? words.hall : words.rooms[targetRoom]?.title;
  compass.querySelector('span').textContent = title ? words.waypoint(title) : '';
  compass.hidden = !target || !world || !started;
  world?.waypoint(target ?? null);
  showPlanTarget(target ?? null);
  for (const button of routeButtons) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.room) === targetRoom));
  }
}

function pickWaypoint(room, startWalk = true) {
  if (startWalk) start();
  closePanel(false);
  preservedFocus = null;
  map.close();
  targetRoom = room;
  renderWaypoint();
  renderLocation(nearby);
  if (!world && startWalk && room !== null) openPanel(room);
  else if (startWalk) get('minimap-button').focus({preventScroll: true});
}

function start() {
  if (started) return;
  started = true;
  intro.hidden = true;
  hud.hidden = false;
  document.body.classList.add('playing');
  world?.start();
  targetRoom = proofOrder.find((room) => !earned.has(room)) ?? null;
  renderWaypoint();
  syncWorld();
  renderLocation(nearby);
  updateProgress();
}

function closePanel(returnFocus = true) {
  if (activeRoom === null) return;
  activeRoom = null;
  handlesLayer.replaceChildren();
  sceneHandles = [];
  panel.hidden = true;
  get('inspection-controls').hidden = true;
  document.body.classList.remove('puzzle-open');
  world?.releaseFocus();
  lastLocation = -2;
  syncWorld();
  if (returnFocus) {
    get('engage').hidden = nearby < 0 || nearby === null;
    if (!get('engage').hidden) get('engage').focus({preventScroll: true});
  }
}

function setPanelCompletion(room) {
  const complete = earned.has(room);
  get('panel-complete').hidden = !complete;
  if (!complete) return;
  get('collected').textContent = words.collected(earned.size);
  get('next-room').textContent = words.next;
}

function complete(room) {
  if (earned.has(room)) return;
  states[room].done = true;
  earned.add(room);
  persist();
  updateProgress();
  if (activeRoom === room) setPanelCompletion(room);
  if (targetRoom === room) {
    targetRoom = proofOrder.find((item) => !earned.has(item)) ?? null;
    renderWaypoint();
  }
  announce(earned.size === proofSize ? words.allFragments : words.fragment);
  chime(earned.size === proofSize ? [440, 554.37, 659.25, 880] : [392, 523.25, 659.25]);
}

function addSlider(container, labelText, accessibleLabel, minimum, maximum, step, value, onChange) {
  const label = document.createElement('label');
  label.className = 'axis';
  const text = document.createElement('span');
  text.textContent = labelText;
  const input = document.createElement('input');
  Object.assign(input, {type: 'range', min: minimum, max: maximum, step, value});
  input.setAttribute('aria-label', accessibleLabel);
  const output = document.createElement('output');
  label.append(text, input, output);
  container.append(label);
  const render = () => onChange(Number(input.value), output, input);
  input.addEventListener('input', render);
  render();
  return input;
}

function criticalPuzzle(root) {
  const state = states[0];
  const showGrowth = mountPrimeErrorModel(root, words.firstRoom, 10_000);
  const realPart = (i) => .5 + state.values[i] * .16;
  let ready = false;
  showGrowth(1, realPart(1));
  waveHeights.forEach((height, i) => {
    const slider = addSlider(root, height + 'i', words.lightSlider(i + 1), -1.5, 1.5, .05, state.values[i], (value, output, input) => {
      const aligned = Math.abs(value) <= .1;
      state.values[i] = aligned ? 0 : value;
      input.classList.toggle('aligned', aligned);
      output.textContent = aligned ? words.aligned : realPart(i).toFixed(3);
      if (ready) showGrowth(i, realPart(i));
      input.setAttribute('aria-valuetext', aligned ? words.alignedReadout : words.realPart(output.textContent));
      const count = state.values.filter((position) => position === 0).length;
      feedback.textContent = words.alignment(count);
      if (count === 3) complete(0);
    });
    slider.addEventListener('focus', () => showGrowth(i, realPart(i)));
  });
  ready = true;
  const axisLabel = document.createElement('p');
  axisLabel.className = 'puzzle-caption';
  axisLabel.textContent = words.axis;
  root.append(axisLabel);
}

function reflectionPuzzle(root) {
  const state = states[1];
  const model = document.createElement('div');
  model.className = 'mirror-model';
  const candidate = document.createElement('strong');
  const axis = document.createElement('span');
  const partner = document.createElement('strong');
  candidate.textContent = 'β + it';
  axis.textContent = 'Re s = ½';
  partner.textContent = '(1 − β) + it';
  model.append(candidate, axis, partner);
  root.append(model);
  const control = addSlider(root, words.rotation, words.rotationSlider, 0, 11, 1, state.values[0], (value, output, input) => {
    state.values[0] = value;
    const aligned = value === 6;
    model.classList.toggle('paired', aligned);
    output.textContent = value * 30 + '°';
    input.classList.toggle('aligned', aligned);
    input.setAttribute('aria-valuetext', words.degrees(value * 30));
    feedback.textContent = aligned ? words.orbitAligned : words.orbitHint;
    if (aligned && !state.done) {
      complete(1);
      input.disabled = true;
    }
  });
  control.disabled = state.done;
}

function kernelPuzzle(root) {
  const state = states[2];
  const grid = document.createElement('div');
  grid.className = 'relay';
  const labels = words.relayLabels;
  const results = words.relayResults;
  const buttons = [];
  for (const stage of [2, 0, 1]) {
    const button = document.createElement('button');
    button.type = 'button';
    const tag = document.createElement('b');
    button.append(document.createTextNode(labels[stage]), tag);
    button.addEventListener('click', async () => {
      if (kernelCheck || stage < state.count) return;
      if (stage !== state.count) {
        feedback.textContent = words.connect(labels[state.count]);
        chime([220]);
        return;
      }
      if (stage === 0) {
        feedback.textContent = words.hashing;
        const check = verifyEntryFile();
        kernelCheck = check;
        try {
          await check;
        } catch (error) {
          if (activeRoom === 2) feedback.textContent = words[error.message] ?? words.sourceUnavailable;
          return;
        } finally {
          kernelCheck = null;
        }
        if (states[2] !== state) return;
      }
      state.count++;
      chime([329.63 + stage * 68]);
      if (state.count === 3) complete(2);
      if (activeRoom === 2) openPanel(2, false);
    });
    grid.append(button);
    buttons.push({button, tag, stage});
  }
  function renderStep() {
    for (const {button, tag, stage} of buttons) {
      const completed = stage < state.count;
      button.classList.toggle('done', completed);
      button.disabled = completed;
      tag.textContent = completed ? results[stage] : '';
    }
    feedback.textContent = state.done ? words.relayComplete : words.nextRecord(labels[state.count]);
  }
  root.append(grid);
  renderStep();
}

async function verifyEntryFile() {
  if (!globalThis.crypto?.subtle) throw new Error('needSecure');
  const response = await fetch('./data/main.txt');
  if (!response.ok) throw new Error('sourceUnavailable');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()));
  const hex = Array.from(hash, (value) => value.toString(16).padStart(2, '0')).join('');
  if (hex !== mainHash) throw new Error('hashMismatch');
}

const puzzleScenes = [criticalPuzzle, reflectionPuzzle, kernelPuzzle];

function addHandles(room, root) {
  handlesLayer.replaceChildren();
  sceneHandles = [];
  if (!world || room > 1 || (room !== 0 && states[room].done)) return;
  const controls = [...root.querySelectorAll('input[type="range"]')];
  controls.forEach((control, i) => {
    const handle = document.createElement('div');
    handle.className = 'piece-handle';
    handle.style.setProperty('--handle-color', stationColor(room));
    let held = false;
    handle.addEventListener('pointerdown', (event) => {
      held = true;
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener('pointermove', (event) => {
      if (!held || control.disabled) return;
      const value = world.dragValue(room, event.clientX, event.clientY);
      if (value === null) return;
      control.value = value;
      control.dispatchEvent(new Event('input', {bubbles: true}));
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      handle.addEventListener(type, () => { held = false; });
    }
    sceneHandles[i] = handle;
    handlesLayer.append(handle);
  });
}

const stationColor = (room) => '#' + stations[room].color.toString(16).padStart(6, '0');

function openPanel(room, focus = true) {
  if (activeRoom === null) world?.focus(room);
  const contextWasOpen = activeRoom === room && get('context').open;
  const exhibit = words.rooms[room];
  activeRoom = room;
  panel.dataset.room = room;
  panel.style.setProperty('--exhibit', stationColor(room));
  panel.hidden = false;
  get('inspection-controls').hidden = !world;
  if (focus) panel.scrollTop = 0;
  document.body.classList.add('puzzle-open');
  get('engage').hidden = true;
  get('panel-kicker').textContent = galleryLabel(room);
  get('panel-title').textContent = exhibit.task;
  get('instruction').textContent = words.tasks[room];
  get('context').open = contextWasOpen;
  get('context-body').textContent = exhibit.context;
  const [url, declaration] = proofLinks[room];
  const source = get('context-link');
  source.href = url;
  source.textContent = declaration + ' · Lean';
  get('room-ledger').href = './proof.html#step-' + (proofOrder.indexOf(room) + 1);
  feedback.textContent = '';
  const root = get('puzzle');
  root.replaceChildren();
  if (workshops[room]) {
    workshops[room](root, {
      state: states[room], words, complete: () => complete(room),
      say: (text) => { if (feedback.textContent !== text) feedback.textContent = text; },
      slider: (label, min, max, step, value, change) => addSlider(root, label, label, min, max, step, value, change),
    });
  } else puzzleScenes[room](root);
  addHandles(room, root);
  setPanelCompletion(room);
  syncWorld();
  if (focus) get('close-panel').focus({preventScroll: true});
}

function showDialog(dialog, trigger) {
  if (dialog.open) return;
  preservedFocus = trigger;
  dialog.showModal();
  if (dialog === map) placeOnPlan(get('floor-you'), visitorX, visitorZ);
  syncWorld();
}

for (const dialog of [map, notes]) {
  dialog.addEventListener('close', () => {
    syncWorld();
    if (preservedFocus?.isConnected) preservedFocus.focus({preventScroll: true});
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function showFinale() {
  if (get('finale').hidden || finalePlaying || !get('final-card').hidden) return;
  finalePlaying = true;
  world?.focus(null);
  syncWorld();
  clearTimeout(finaleTimer);
  finaleTimer = setTimeout(() => {
    world?.finale(true);
    chime([261.63, 392, 523.25, 659.25, 783.99], .25);
    finaleTimer = setTimeout(() => {
      finalePlaying = false;
      get('final-card').hidden = false;
      get('close-final').focus({preventScroll: true});
      syncWorld();
    }, reducedMotion || !world ? 0 : 3650);
  }, reducedMotion ? 40 : 560);
}

get('enter').addEventListener('click', () => {
  start();
  chime([220, 329.63]);
  if (!world) showDialog(map, get('open-map'));
  else get('minimap-button').focus({preventScroll: true});
});
get('open-map').addEventListener('click', (event) => showDialog(map, event.currentTarget));
get('minimap-button').addEventListener('click', (event) => showDialog(map, event.currentTarget));
get('open-notes').addEventListener('click', (event) => { event.preventDefault(); showDialog(notes, event.currentTarget); });
get('map-notes').addEventListener('click', () => { map.close(); showDialog(notes, get('open-map')); });
get('return-hall').addEventListener('click', () => pickWaypoint(null));
get('engage').addEventListener('click', () => { if (nearby >= 0) openPanel(nearby); });
get('close-panel').addEventListener('click', () => closePanel());
get('finale').addEventListener('click', showFinale);
get('close-final').addEventListener('click', () => {
  get('final-card').hidden = true;
  world?.releaseFocus();
  world?.finale(false);
  get('finale').focus({preventScroll: true});
  syncWorld();
});
get('next-room').addEventListener('click', () => closePanel());
get('reset-game').addEventListener('click', () => {
  earned.clear();
  states = freshStates();
  persist();
  closePanel(false);
  get('final-card').hidden = true;
  clearTimeout(finaleTimer);
  finalePlaying = false;
  world?.finale(false);
  world?.releaseFocus();
  updateProgress();
  pickWaypoint(0, false);
  notes.close();
  announce(words.resetDone);
});
for (const button of routeButtons) button.addEventListener('click', () => pickWaypoint(Number(button.dataset.room)));

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
window.addEventListener('keydown', (event) => {
  if (!started || map.open || notes.open || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.code === 'Escape' && activeRoom !== null) {
    event.preventDefault();
    closePanel();
    return;
  }
  if (activeRoom !== null || finalePlaying || !get('final-card').hidden) return;
  if (event.code === 'Space' && event.target.closest?.('button') &&
      !['minimap-button', 'engage'].includes(event.target.id)) return;
  if (event.code === 'Space' || event.code === 'KeyF') {
    event.preventDefault();
    if (!event.repeat) performAction(event.code === 'Space' ? 'jump' : 'punch');
    return;
  }
  if (event.code === 'KeyE' && nearby >= 0 && !event.repeat) {
    openPanel(nearby);
    return;
  }
  if (movementKeys.has(event.code)) {
    event.preventDefault();
    world?.keys.add(event.code);
  }
});
window.addEventListener('keyup', (event) => world?.keys.delete(event.code));
window.addEventListener('blur', () => world?.keys.clear());
for (const button of document.querySelectorAll('[data-move]')) {
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    world?.keys.add(button.dataset.move);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, () => world?.keys.delete(button.dataset.move));
  }
}

function performAction(action) {
  if (!started || !world || activeRoom !== null || map.open || notes.open || !get('final-card').hidden) return;
  if (action === 'jump') {
    if (world.jump()) chime([147], .04);
    return;
  }
  world.punch();
}

for (const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('click', () => performAction(button.dataset.action));
}
get('orbit-left').addEventListener('click', () => world?.rotateExhibit(-.19));
get('orbit-right').addEventListener('click', () => world?.rotateExhibit(.19));
get('orbit-reset').addEventListener('click', () => world?.frontView());

function soundSetup() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  const ctx = new Context();
  const volume = ctx.createGain();
  volume.gain.value = 0;
  volume.connect(ctx.destination);
  for (const [pitch, gain] of [[55, .16], [82.5, .055], [110.2, .036]]) {
    const tone = ctx.createOscillator();
    const balance = ctx.createGain();
    tone.type = 'sine';
    tone.frequency.value = pitch;
    balance.gain.value = gain;
    tone.connect(balance).connect(volume);
    tone.start();
  }
  return {ctx, volume, enabled: false};
}

function chime(notes, spacing = .12) {
  if (!audio?.enabled) return;
  const {ctx, volume} = audio;
  const t = ctx.currentTime;
  for (const [i, note] of notes.entries()) {
    const begin = t + i * spacing;
    const tone = ctx.createOscillator();
    const fade = ctx.createGain();
    tone.type = 'sine';
    tone.frequency.value = note;
    fade.gain.setValueAtTime(.0001, begin);
    fade.gain.exponentialRampToValueAtTime(.32, begin + .035);
    fade.gain.exponentialRampToValueAtTime(.0001, begin + 1.35);
    tone.connect(fade).connect(volume);
    tone.start(begin);
    tone.stop(begin + 1.4);
  }
}
get('sound').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  try {
    audio ||= soundSetup();
    if (!audio) throw new Error('Sound unavailable');
    await audio.ctx.resume();
    audio.enabled = !audio.enabled;
    audio.volume.gain.setTargetAtTime(audio.enabled ? .26 : 0, audio.ctx.currentTime, .14);
    button.setAttribute('aria-pressed', String(audio.enabled));
    get('sound-label').textContent = audio.enabled ? words.soundOff : words.soundOn;
    chime([261.63, 392]);
  } catch {
    announce(words.soundUnavailable);
  }
});

try {
  world = createWorld(get('world'), get('player-hands'), updateFrame, (room) => {
    if (room === nearby) openPanel(room);
  }, () => chime([352, 528, 711], .045), reducedMotion);
  world.setStates(states);
} catch (error) {
  document.body.classList.add('fallback');
  console.info('3D renderer unavailable', error.message);
}
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    if (button.dataset.language === language) return;
    language = button.dataset.language;
    words = localizedCopy();
    saveLanguage(language);
    renderLanguage();
  });
}
mountZeroAtlas(get('zero-atlas'), reducedMotion);
attachPlans();
placeOnPlan(get('mini-you'), visitorX, visitorZ);
renderLanguage();
