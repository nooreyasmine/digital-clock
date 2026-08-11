// =========================================================================
// 1. GLOBAL VARIABLES & DOM SELECTORS (Declared first to avoid TDZ errors)
// =========================================================================
// Native Synth Beep States (Web Audio API)
let audioCtx = null;
let alarmBeepInterval = null;

// Multi-Alarm State & Elements
let alarms = []; // Array storing alarm strings like ["14:30", "15:45"]
const alarmInput = document.getElementById('alarm-time');
const alarmListContainer = document.getElementById('alarm-list');
const alarmStopBtn = document.getElementById('alarm-stop');
const alarmSetBtn = document.getElementById('alarm-set');

// Stopwatch State & Elements
let stopwatchInterval;
let elapsedTime = 0; 
let swStartTime;
const swDisplay = document.getElementById('stopwatch-display');
const swStartBtn = document.getElementById('sw-start');
const swStopBtn = document.getElementById('sw-stop');
const swResetBtn = document.getElementById('sw-reset');

// Timer State & Elements
let timerInterval;
let timerSecondsLeft = 0;
const timerDisplay = document.getElementById('timer-display');
const tHoursInput = document.getElementById('timer-hours');
const tMinutesInput = document.getElementById('timer-minutes');
const tSecondsInput = document.getElementById('timer-seconds');
const timerStartBtn = document.getElementById('timer-start');
const timerPauseBtn = document.getElementById('timer-pause');
const timerResetBtn = document.getElementById('timer-reset');

// World Clock Elements
let customClocks = [
    { city: "New York", timezone: "America/New_York" },
    { city: "London", timezone: "Europe/London" },
    { city: "Tokyo", timezone: "Asia/Tokyo" }
];
const grid = document.getElementById('world-grid');
const addClockBtn = document.getElementById('add-world-clock');
const cityNameInput = document.getElementById('world-city-name');
const timezoneSelect = document.getElementById('world-timezone');

// Tab Buttons & Content Sections
const tabButtons = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.content-section');

// =========================================================================
// 2. Browser Audio Unlocker & Synthesizer Functions
// =========================================================================
// Explicitly unlocks Audio Context inside direct user-click callbacks
function unlockAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("Audio Context successfully unlocked.");
        });
    }
}

// ALARM SOUND: Loops a beep tone every 0.5s (requires Stop button click)
function playAlarmBeeps() {
    unlockAudioContext(); 
    stopAlarmBeeps();

    alarmBeepInterval = setInterval(() => {
        if (!audioCtx) return;
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch (A5)

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); // Fade out

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }, 500); 
}

function stopAlarmBeeps() {
    if (alarmBeepInterval) {
        clearInterval(alarmBeepInterval);
        alarmBeepInterval = null;
    }
}

// TIMER SOUND: Schedules two clean beeps directly on the sound card clock
// This bypasses the alert() thread-freezing restriction entirely.
function playTimerFinishedBeep() {
    unlockAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Beep 1 (Starts immediately)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Beep 2 (Scheduled to start 0.4 seconds later on the hardware clock)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.4);
    gain2.gain.setValueAtTime(0.3, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.4);
    osc2.stop(now + 0.7);
}

// =========================================================================
// 3. Tab Switching Logic
// =========================================================================
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTabId = button.getAttribute('data-tab');
        const targetSection = document.getElementById(targetTabId);

        if (targetSection) {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            button.classList.add('active');
            targetSection.classList.add('active');
        }
    });
});

// =========================================================================
// 4. Dynamic World Clock Logic
// =========================================================================
function populateTimezones() {
    const selector = document.getElementById('world-timezone');
    if (!selector) return;

    try {
        const timezones = Intl.supportedValuesOf('timeZone');
        selector.innerHTML = ''; 

        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz;
            selector.appendChild(option);
        });

        const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezones.includes(localTZ)) {
            selector.value = localTZ;
        }
    } catch (e) {
        console.error("Browser error loading timezones dynamically: ", e);
    }
}

function renderWorldClocks() {
    if (!grid) return;
    grid.innerHTML = ''; 

    customClocks.forEach((clock, index) => {
        const card = document.createElement('div');
        card.className = 'world-card';
        card.setAttribute('data-timezone', clock.timezone);
        card.innerHTML = `
            <h3>${clock.city}</h3>
            <div class="world-time">00:00:00</div>
            <button class="remove-clock-btn" onclick="removeWorldClock(${index})">×</button>
        `;
        grid.appendChild(card);
    });
}

window.removeWorldClock = function(index) {
    customClocks.splice(index, 1);
    renderWorldClocks();
};

if (addClockBtn && cityNameInput && timezoneSelect) {
    addClockBtn.addEventListener('click', () => {
        const timezone = timezoneSelect.value;
        if (!timezone) return;

        let city = cityNameInput.value.trim();
        if (!city) {
            const tzParts = timezone.split('/');
            city = tzParts[tzParts.length - 1].replace('_', ' ');
        }

        const duplicate = customClocks.some(c => c.timezone === timezone);
        if (duplicate) {
            alert("This timezone is already being displayed.");
            return;
        }

        customClocks.push({ city, timezone });
        cityNameInput.value = ''; 
        renderWorldClocks();
    });
}

populateTimezones();
renderWorldClocks();

// =========================================================================
// 5. Live Clock Updates Loop
// =========================================================================
function updateClocks() {
    const now = new Date();

    // Local Time
    const localTimeStr = now.toLocaleTimeString([], { hour12: false });
    const localClockEl = document.getElementById('local-clock');
    if (localClockEl) {
        localClockEl.textContent = localTimeStr;
    }

    // Local Date
    const localDateEl = document.getElementById('local-date');
    if (localDateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        localDateEl.textContent = now.toLocaleDateString(undefined, options);
    }

    // World Cards loop update
    const worldCards = document.querySelectorAll('.world-card');
    worldCards.forEach(card => {
        const timezone = card.getAttribute('data-timezone');
        const timeEl = card.querySelector('.world-time');
        if (timeEl && timezone) {
            try {
                timeEl.textContent = new Intl.DateTimeFormat('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: timezone
                }).format(now);
            } catch (e) {
                console.error("Timezone error:", e);
            }
        }
    });

    checkAlarm(localTimeStr);
}

setInterval(updateClocks, 1000);
updateClocks();

// =========================================================================
// 6. Stopwatch Logic 
// =========================================================================
function formatStopwatchTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let milliseconds = Math.floor((ms % 1000) / 10);

    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0')
    );
}

if (swStartBtn) {
    swStartBtn.addEventListener('click', () => {
        swStartTime = Date.now() - elapsedTime;
        stopwatchInterval = setInterval(() => {
            elapsedTime = Date.now() - swStartTime;
            if (swDisplay) swDisplay.textContent = formatStopwatchTime(elapsedTime);
        }, 10);
        swStartBtn.disabled = true;
        if (swStopBtn) swStopBtn.disabled = false;
    });
}

if (swStopBtn) {
    swStopBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        if (swStartBtn) swStartBtn.disabled = false;
        swStopBtn.disabled = true;
    });
}

if (swResetBtn) {
    swResetBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        elapsedTime = 0;
        if (swDisplay) swDisplay.textContent = "00:00:00.00";
        if (swStartBtn) swStartBtn.disabled = false;
        if (swStopBtn) swStopBtn.disabled = true;
    });
}

// =========================================================================
// 7. Timer Logic
// =========================================================================
function updateTimerDisplay(totalSeconds) {
    let hrs = Math.floor(totalSeconds / 3600);
    let mins = Math.floor((totalSeconds % 3600) / 60);
    let secs = totalSeconds % 60;
    if (timerDisplay) {
        timerDisplay.textContent = 
            String(hrs).padStart(2, '0') + ':' +
            String(mins).padStart(2, '0') + ':' +
            String(secs).padStart(2, '0');
    }
}

function resetTimerUI() {
    timerSecondsLeft = 0;
    if (timerDisplay) timerDisplay.textContent = "00:00:00";
    if (tHoursInput) tHoursInput.value = '';
    if (tMinutesInput) tMinutesInput.value = '';
    if (tSecondsInput) tSecondsInput.value = '';
    if (timerStartBtn) timerStartBtn.disabled = false;
    if (timerPauseBtn) timerPauseBtn.disabled = true;
}

if (timerStartBtn) {
    timerStartBtn.addEventListener('click', () => {
        unlockAudioContext(); // Pre-unlocks audio thread on interaction

        if (timerSecondsLeft === 0 && tHoursInput && tMinutesInput && tSecondsInput) {
            const hrs = parseInt(tHoursInput.value) || 0;
            const mins = parseInt(tMinutesInput.value) || 0;
            const secs = parseInt(tSecondsInput.value) || 0;
            timerSecondsLeft = (hrs * 3600) + (mins * 60) + secs;
        }

        if (timerSecondsLeft <= 0) return;

        timerStartBtn.disabled = true;
        if (timerPauseBtn) timerPauseBtn.disabled = false;

        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            updateTimerDisplay(timerSecondsLeft);

            if (timerSecondsLeft <= 0) {
                clearInterval(timerInterval);
                
                // Play double beep natively on the hardware thread
                playTimerFinishedBeep();
                
                // Show the alert box (will block the main thread, but sound is already playing!)
                alert("Timer Finished!");
                
                resetTimerUI();
            }
        }, 1000);
    });
}

if (timerPauseBtn) {
    timerPauseBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        if (timerStartBtn) timerStartBtn.disabled = false;
        timerPauseBtn.disabled = true;
    });
}

if (timerResetBtn) {
    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        resetTimerUI();
    });
}

// =========================================================================
// 8. Multi-Alarm Logic
// =========================================================================
function renderAlarms() {
    if (!alarmListContainer) return;
    alarmListContainer.innerHTML = '';
    
    if (alarms.length === 0) {
        alarmListContainer.innerHTML = '<div style="color: #666; font-size: 0.95rem;">No active alarms set</div>';
        return;
    }

    alarms.sort();

    alarms.forEach((alarm, index) => {
        const item = document.createElement('div');
        item.className = 'alarm-item';
        item.innerHTML = `
            <span>⏰ ${alarm}</span>
            <button class="remove-alarm-btn" onclick="removeAlarm(${index})">×</button>
        `;
        alarmListContainer.appendChild(item);
    });
}

window.removeAlarm = function(index) {
    alarms.splice(index, 1);
    renderAlarms();
};

if (alarmSetBtn && alarmInput) {
    alarmSetBtn.addEventListener('click', () => {
        unlockAudioContext(); 

        const selectedTime = alarmInput.value;
        if (selectedTime) {
            if (alarms.includes(selectedTime)) {
                alert("This alarm is already set.");
                return;
            }

            alarms.push(selectedTime);
            renderAlarms();
            alarmInput.value = ''; 
        }
    });
}

function checkAlarm(localTimeStr) {
    if (alarms.length === 0) return;

    const currentTimeStr = localTimeStr.substring(0, 5); 
    const alarmIndex = alarms.indexOf(currentTimeStr);

    if (alarmIndex !== -1) {
        playAlarmBeeps();
        
        if (alarmStopBtn) {
            alarmStopBtn.classList.remove('hidden');
        }
        
        alarms.splice(alarmIndex, 1);
        renderAlarms();
    }
}

if (alarmStopBtn) {
    alarmStopBtn.addEventListener('click', () => {
        stopAlarmBeeps();
        alarmStopBtn.classList.add('hidden');
    });
}

renderAlarms();
