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
  // Get and parse inputs
  const minMM = parseInt(document.getElementById('min-mm').value) || 0;
  const minSS = parseInt(document.getElementById('min-ss').value) || 0;
  const maxMM = parseInt(document.getElementById('max-mm').value) || 0;
  const maxSS = parseInt(document.getElementById('max-ss').value) || 0;

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

// Re-request wake lock if tab becomes visible again
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
