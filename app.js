let timerInterval;
let secondsElapsed = 0;
let thresholds = {
  green: 300,
  amber: 360,
  red: 420,
  bell: 450
};
let wakeLock = null;

const body = document.getElementById('body');
const setupView = document.getElementById('setup-view');
const timerView = document.getElementById('timer-view');
const summaryView = document.getElementById('summary-view');
const timerDisplay = document.getElementById('timer-display');
const totalTimeDisplay = document.getElementById('total-time-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-btn');
const slotsContainer = document.getElementById('slots-container');
const addSlotBtn = document.getElementById('add-slot-btn');
const slotTemplate = document.getElementById('slot-template');

// Input conversion helper
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length === 1) return parseInt(parts[0]) || 0;
  const mins = parseInt(parts[0]) || 0;
  const secs = parseInt(parts[1]) || 0;
  return (mins * 60) + secs;
}

// Formatting helper
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Wake Lock implementation
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock active');
    }
  } catch (err) {
    console.warn(`${err.name}, ${err.message}`);
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
    console.log('Wake Lock released');
  }
}

// Timer Logic
function startTimer() {
  const selectedRadio = document.querySelector('.slot-radio:checked');
  if (!selectedRadio) return; // Should be handled by disabled state, but just in case

  const row = selectedRadio.closest('.slot-row');

  // Get and parse inputs
  const minMM = parseInt(row.querySelector('.min-mm').value) || 0;
  const minSS = parseInt(row.querySelector('.min-ss').value) || 0;
  const maxMM = parseInt(row.querySelector('.max-mm').value) || 0;
  const maxSS = parseInt(row.querySelector('.max-ss').value) || 0;

  const minSeconds = (minMM * 60) + minSS;
  const maxSeconds = (maxMM * 60) + maxSS;

  thresholds.green = minSeconds;
  thresholds.amber = (minSeconds + maxSeconds) / 2;
  thresholds.red = maxSeconds;
  thresholds.bell = maxSeconds + 30;

  // Switch views
  setupView.classList.add('hidden');
  timerView.classList.add('active');

  secondsElapsed = 0;
  updateDisplay();

  requestWakeLock();

  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateDisplay();
    updateBackground();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  releaseWakeLock();

  // Show summary
  totalTimeDisplay.innerText = formatTime(secondsElapsed);

  timerView.classList.remove('active');
  summaryView.classList.add('active');
}

function resetToSetup() {
  body.classList.remove('state-green', 'state-amber', 'state-red', 'state-bell');
  summaryView.classList.remove('active');
  setupView.classList.remove('hidden');
  secondsElapsed = 0;
  timerDisplay.innerText = "0:00";
}

function updateDisplay() {
  timerDisplay.innerText = formatTime(secondsElapsed);
}

function updateBackground() {
  if (secondsElapsed >= thresholds.bell) {
    body.classList.add('state-bell');
    body.classList.remove('state-green', 'state-amber', 'state-red');
  } else if (secondsElapsed >= thresholds.red) {
    body.classList.add('state-red');
    body.classList.remove('state-green', 'state-amber', 'state-bell');
  } else if (secondsElapsed >= thresholds.amber) {
    body.classList.add('state-amber');
    body.classList.remove('state-green', 'state-red', 'state-bell');
  } else if (secondsElapsed >= thresholds.green) {
    body.classList.add('state-green');
    body.classList.remove('state-amber', 'state-red', 'state-bell');
  } else {
    body.classList.remove('state-green', 'state-amber', 'state-red', 'state-bell');
  }
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', stopTimer);
backBtn.addEventListener('click', resetToSetup);

function addSlot(role = '', name = '', minM = '5', minS = '00', maxM = '7', maxS = '00', select = false) {
  const node = slotTemplate.content.cloneNode(true);
  const row = node.querySelector('.slot-row');

  node.querySelector('.slot-role').value = role;
  node.querySelector('.slot-name').value = name;
  node.querySelector('.min-mm').value = minM;
  node.querySelector('.min-ss').value = minS;
  node.querySelector('.max-mm').value = maxM;
  node.querySelector('.max-ss').value = maxS;

  const radio = node.querySelector('.slot-radio');
  radio.addEventListener('change', () => {
    startBtn.disabled = false;
  });

  if (select) {
    radio.checked = true;
    startBtn.disabled = false;
  }

  node.querySelector('.delete-btn').addEventListener('click', () => {
    const wasChecked = radio.checked;
    row.remove();
    if (wasChecked) {
      startBtn.disabled = true;
      // Auto-select first available radio if possible
      const firstRadio = slotsContainer.querySelector('.slot-radio');
      if (firstRadio) {
        firstRadio.checked = true;
        startBtn.disabled = false;
      }
    }
  });

  // Insertion Logic: Insert after selected row, or append to end
  const selectedRadio = slotsContainer.querySelector('.slot-radio:checked');
  if (selectedRadio) {
    const selectedRow = selectedRadio.closest('.slot-row');
    selectedRow.after(row);
  } else {
    slotsContainer.appendChild(row);
  }

  lucide.createIcons(); // Re-initialize icons for newly added elements
}

addSlotBtn.addEventListener('click', () => {
  addSlot();
});

// Initialize first slots
addSlot('Introduction by Toastmaster of the day', '', '2', '00', '3', '00', false);
addSlot('Introduction by Timekeeper', '', '0', '30', '1', '00', false);
addSlot('Introduction by Grammarian', '', '0', '30', '1', '00', false);
addSlot('Speaker #1', '', '5', '00', '7', '00', false);
addSlot('Speaker #2', '', '5', '00', '7', '00', false);
addSlot('Introduction by Table Topics Master', '', '1', '00', '2', '00', false);
addSlot('Table Topics #1', '', '1', '00', '2', '00', false);
addSlot('Table Topics #2', '', '1', '00', '2', '00', false);
addSlot('Table Topics #3', '', '1', '00', '2', '00', false);
addSlot('Table Topics #4', '', '1', '00', '2', '00', false);
addSlot('Announcements by the President', '', '1', '00', '2', '00', false);
addSlot('Speech Evaluation #1', '', '2', '00', '3', '00', false);
addSlot('Speech Evaluation #2', '', '2', '00', '3', '00', false);
addSlot('Table Topics Evaluator', '', '2', '00', '4', '00', false);
addSlot('Grammarian Report', '', '1', '00', '2', '00', false);
addSlot('Ah-Counter Report', '', '1', '00', '2', '00', false);
addSlot('Timekeeper Report', '', '1', '00', '2', '00', false);
addSlot('General Evaluator', '', '3', '00', '5', '00', false);
addSlot('Call for volunteers', '', '1', '00', '3', '00', false);
// Select first slot by default
const firstRadio = slotsContainer.querySelector('.slot-radio');
if (firstRadio) {
  firstRadio.checked = true;
  startBtn.disabled = false;
}

// Re-request wake lock if tab becomes visible again
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
