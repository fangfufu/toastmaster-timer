let timerInterval;
let secondsElapsed = 0;
let thresholds = {
  green: 300,
  amber: 360,
  red: 420,
  bell: 450
};
let wakeLock = null;
let wakeLockActive = false;
let isCapacitor = typeof Capacitor !== 'undefined';
if ('serviceWorker' in navigator && !isCapacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  });
}


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
const deleteSlotBtn = document.getElementById('delete-slot-btn');
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
  wakeLockActive = true;
  if (isCapacitor) {
    try {
      await Capacitor.Plugins.KeepAwake.keepAwake();
      console.log('Capacitor Wake Lock active');
      return;
    } catch (err) {
      console.warn('Capacitor KeepAwake failed:', err);
    }
  }

  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Web Wake Lock active');
    }
  } catch (err) {
    console.warn(`${err.name}, ${err.message}`);
  }
}

async function releaseWakeLock() {
  wakeLockActive = false;
  if (isCapacitor) {
    try {
      await Capacitor.Plugins.KeepAwake.allowSleep();
      console.log('Capacitor Wake Lock released');
      return;
    } catch (err) {
      console.warn('Capacitor allowSleep failed:', err);
    }
  }

  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
    console.log('Web Wake Lock released');
  }
}

// Timer Logic
function startTimer() {
  const selectedRow = document.querySelector('.slot-row.selected');
  if (!selectedRow) return;

  const row = selectedRow;

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
  body.classList.add('timer-active');

  secondsElapsed = 0;
  updateDisplay();

  requestWakeLock();

  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateDisplay();
    updateBackground();
  }, 1000);
}

async function stopTimer() {
  clearInterval(timerInterval);
  await releaseWakeLock();
  body.classList.remove('state-green', 'state-amber', 'state-red', 'state-bell');

  // Show summary
  totalTimeDisplay.innerText = formatTime(secondsElapsed);

  const selectedRow = document.querySelector('.slot-row.selected');
  if (selectedRow) {
    const row = selectedRow;
    const timeUsedCol = row.querySelector('.time-used-col');
    const progressFill = row.querySelector('.progress-fill');
    const timeLabel = row.querySelector('.time-used-label');

    if (timeUsedCol && progressFill && thresholds.bell > 0) {
      let percentage = (secondsElapsed / thresholds.bell) * 100;
      if (percentage > 100) percentage = 100;

      progressFill.style.width = percentage + '%';
      if (timeLabel) timeLabel.innerText = 'Time used: ' + formatTime(secondsElapsed) + ' (' + Math.round((secondsElapsed / thresholds.bell) * 100) + '%)';
      timeUsedCol.classList.add('has-data');
      row.dataset.timeUsed = secondsElapsed;

      // Add color coding to the bar
      if (secondsElapsed >= thresholds.red) {
        progressFill.style.background = 'var(--tm-red)';
      } else if (secondsElapsed >= thresholds.amber) {
        progressFill.style.background = 'var(--tm-amber)';
      } else if (secondsElapsed >= thresholds.green) {
        progressFill.style.background = 'var(--tm-green)';
      } else {
        progressFill.style.background = 'var(--accent)';
      }
    }
  }

  timerView.classList.remove('active');
  summaryView.classList.add('active');
}

function resetToSetup() {
  body.classList.remove('timer-active', 'state-green', 'state-amber', 'state-red', 'state-bell');
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

// Capacitor Back Button Handling
if (isCapacitor) {
  Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
    if (!timerView.classList.contains('hidden') && timerView.classList.contains('active')) {
      // Timer is running, stop it
      stopTimer();
    } else if (summaryView.classList.contains('active')) {
      // Summary is showing, go back to setup
      resetToSetup();
    } else {
      // Setup view, minimize app if cannot go back
      if (!canGoBack) {
        Capacitor.Plugins.App.exitApp();
      } else {
        window.history.back();
      }
    }
  });
}

function addSlot(role = '', name = '', minM = '5', minS = '00', maxM = '7', maxS = '00', select = false, timeUsed = null) {
  const node = slotTemplate.content.cloneNode(true);
  const row = node.querySelector('.slot-row');
  const currentSelected = slotsContainer.querySelector('.slot-row.selected');

  node.querySelector('.slot-role').value = role;
  node.querySelector('.slot-name').value = name;
  node.querySelector('.min-mm').value = minM;
  node.querySelector('.min-ss').value = minS;
  node.querySelector('.max-mm').value = maxM;
  node.querySelector('.max-ss').value = maxS;

  row.addEventListener('click', (e) => {
    // Don't select if clicking the delete button
    if (e.target.closest('.delete-btn')) return;

    document.querySelectorAll('.slot-row').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    startBtn.disabled = false;
    deleteSlotBtn.disabled = false;
  });

  if (select) {
    document.querySelectorAll('.slot-row').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    startBtn.disabled = false;
    deleteSlotBtn.disabled = false;
  }

  // Restore time used if provided
  if (timeUsed !== null && timeUsed !== undefined) {
    const minSecs = (parseInt(minM) * 60) + parseInt(minS);
    const maxSecs = (parseInt(maxM) * 60) + parseInt(maxS);
    const bellTime = maxSecs + 30;

    if (bellTime > 0) {
      const timeUsedCol = node.querySelector('.time-used-col');
      const progressFill = node.querySelector('.progress-fill');
      const timeLabel = node.querySelector('.time-used-label');

      if (timeUsedCol && progressFill) {
        let percentage = (timeUsed / bellTime) * 100;
        if (percentage > 100) percentage = 100;

        progressFill.style.width = percentage + '%';
        if (timeLabel) timeLabel.innerText = 'Time used: ' + formatTime(timeUsed) + ' (' + Math.round((timeUsed / bellTime) * 100) + '%)';
        timeUsedCol.classList.add('has-data');
        row.dataset.timeUsed = timeUsed;

        const green = minSecs;
        const amber = (minSecs + maxSecs) / 2;
        const red = maxSecs;

        if (timeUsed >= red) {
          progressFill.style.background = 'var(--tm-red)';
        } else if (timeUsed >= amber) {
          progressFill.style.background = 'var(--tm-amber)';
        } else if (timeUsed >= green) {
          progressFill.style.background = 'var(--tm-green)';
        } else {
          progressFill.style.background = 'var(--accent)';
        }
      }
    }
  }

  // Insertion Logic: Insert after selected row, or append to end
  if (currentSelected) {
    currentSelected.after(row);
  } else {
    slotsContainer.appendChild(row);
  }

  // Selection Logic: Re-run selection for buttons if needed
  if (!slotsContainer.querySelector('.slot-row.selected')) {
    startBtn.disabled = true;
    deleteSlotBtn.disabled = true;
  }
  
  lucide.createIcons(); // Re-initialize icons for newly added elements
}

addSlotBtn.addEventListener('click', () => {
  const selectedRow = slotsContainer.querySelector('.slot-row.selected');
  let sourceRow = selectedRow || slotsContainer.querySelector('.slot-row:last-child');

  if (sourceRow) {
    const role = sourceRow.querySelector('.slot-role').value;
    const name = sourceRow.querySelector('.slot-name').value;
    const minM = sourceRow.querySelector('.min-mm').value;
    const minS = sourceRow.querySelector('.min-ss').value;
    const maxM = sourceRow.querySelector('.max-mm').value;
    const maxS = sourceRow.querySelector('.max-ss').value;
    addSlot(role, name, minM, minS, maxM, maxS, true);
  } else {
    addSlot();
  }
});

deleteSlotBtn.addEventListener('click', () => {
  const selectedRow = slotsContainer.querySelector('.slot-row.selected');
  if (!selectedRow) return;

  const role = selectedRow.querySelector('.slot-role').value || 'this slot';
  showConfirm('Delete Slot', `Are you sure you want to delete "${role}"?`, () => {
    selectedRow.remove();
    
    // Auto-select first available row if possible
    const firstRow = slotsContainer.querySelector('.slot-row');
    if (firstRow) {
      document.querySelectorAll('.slot-row').forEach(r => r.classList.remove('selected'));
      firstRow.classList.add('selected');
      startBtn.disabled = false;
      deleteSlotBtn.disabled = false;
    } else {
      startBtn.disabled = true;
      deleteSlotBtn.disabled = true;
    }
  });
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
const firstRow = slotsContainer.querySelector('.slot-row');
if (firstRow) {
  firstRow.classList.add('selected');
  startBtn.disabled = false;
  deleteSlotBtn.disabled = false;
}

// Re-request wake lock if tab becomes visible again
document.addEventListener('visibilitychange', async () => {
  if (wakeLockActive && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

// Session Save/Load
const saveBtn = document.getElementById('save-btn');
const loadInput = document.getElementById('load-input');

saveBtn.addEventListener('click', () => {
  const slots = [];
  document.querySelectorAll('.slot-row').forEach(row => {
    slots.push({
      role: row.querySelector('.slot-role').value,
      name: row.querySelector('.slot-name').value,
      minMin: row.querySelector('.min-mm').value,
      minSec: row.querySelector('.min-ss').value,
      maxMin: row.querySelector('.max-mm').value,
      maxSec: row.querySelector('.max-ss').value,
      timeUsed: row.dataset.timeUsed !== undefined ? parseFloat(row.dataset.timeUsed) : null
    });
  });

  const yamlStr = jsyaml.dump(slots, { flowLevel: 1 });
  const blob = new Blob([yamlStr], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'toastmasters-session.yaml';
  a.click();
  URL.revokeObjectURL(url);
});

loadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = jsyaml.load(event.target.result);
      if (Array.isArray(data)) {
        slotsContainer.innerHTML = '';
        data.forEach(slot => {
          addSlot(slot.role || '', slot.name || '', slot.minMin || '0', slot.minSec || '00', slot.maxMin || '0', slot.maxSec || '00', false, slot.timeUsed);
        });

        const firstRow = slotsContainer.querySelector('.slot-row');
        if (firstRow) {
          firstRow.classList.add('selected');
          startBtn.disabled = false;
          deleteSlotBtn.disabled = false;
        } else {
          startBtn.disabled = true;
          deleteSlotBtn.disabled = true;
        }
      } else {
        alert('Invalid session file format. Expected an array of slots.');
      }
    } catch (err) {
      alert('Error loading session file: ' + err.message);
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // reset input
});

// Toast Notification
function showToast(html, duration = 10000) {
  const container = document.getElementById('toast-container');
  container.innerHTML = '';
  container.classList.add('active');

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<button class="toast-close" title="Dismiss">&times;</button>${html}`;
  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
      if (container.innerHTML === '') {
        container.classList.remove('active');
      }
    });
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
  
  return dismiss;
}

function showConfirm(title, message, onConfirm) {
  const container = document.getElementById('toast-container');
  container.innerHTML = '';
  container.classList.add('active');

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <h3 style="margin-bottom: 0.5rem">${title}</h3>
    <p>${message}</p>
    <div class="toast-actions">
      <button class="toast-btn secondary cancel-btn">Cancel</button>
      <button class="toast-btn danger confirm-btn">Delete</button>
    </div>
  `;
  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
      container.classList.remove('active');
    });
  };

  toast.querySelector('.cancel-btn').addEventListener('click', dismiss);
  toast.querySelector('.confirm-btn').addEventListener('click', () => {
    onConfirm();
    dismiss();
  });
}

// Usage Button
const usageBtn = document.getElementById('usage-btn');
usageBtn.addEventListener('click', () => {
  showToast(`
    <h3 style="margin-bottom: 0.75rem;">How to Use</h3>
    <div style="text-align: left; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.95rem;">
      <p><strong>1.</strong> Edit the agenda — fill in speaker names and adjust min/max times.</p>
      <p><strong>2.</strong> Click on a row to select a slot, then click <strong><i data-lucide="play" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block;"></i> Start</strong>.</p>
      <p><strong>3.</strong> The timer runs full-screen with colour changes:<br>
         <strong style="color:var(--tm-green)">Green</strong> (min time), 
         <strong style="color:var(--tm-amber)">Amber</strong> (midpoint), 
         <strong style="color:var(--tm-red)">Red</strong> (max time), 
         <strong style="color:var(--tm-red)">Flashing</strong> (bell — 30 s past max).</p>
      <p><strong>4.</strong> Press <strong><i data-lucide="square" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block;"></i> Stop</strong> when the speaker finishes, then <strong><i data-lucide="arrow-left" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block;"></i> Back to Setup</strong>.</p>
      <p><strong>5.</strong> Use <strong><i data-lucide="download" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block;"></i> Save</strong> and <strong><i data-lucide="upload" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; display: inline-block;"></i> Load</strong> to persist your work between meetings.</p>
    </div>
  `, 0);
  lucide.createIcons();
});

// Theme Toggle
const themeBtn = document.getElementById('theme-btn');
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(dark) {
  if (dark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  // Update icon
  const icon = themeBtn.querySelector('i');
  if (icon) {
    icon.setAttribute('data-lucide', dark ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

function getEffectiveTheme() {
  const saved = localStorage.getItem('toastmaster-theme');
  if (saved === 'dark' || saved === 'light') return saved === 'dark';
  // No manual override — follow browser/OS preference
  return darkModeQuery.matches;
}

// Apply on load
applyTheme(getEffectiveTheme());

// Manual toggle — saves override
themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-theme');
  applyTheme(!isDark);
  localStorage.setItem('toastmaster-theme', isDark ? 'light' : 'dark');
});

// Listen for OS theme changes (only if user hasn't manually overridden)
darkModeQuery.addEventListener('change', () => {
  if (!localStorage.getItem('toastmaster-theme')) {
    applyTheme(darkModeQuery.matches);
  }
});
