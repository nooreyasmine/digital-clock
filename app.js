// ==========================================
// 1. Tab Switching Logic
// ==========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.content-section');

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

// ==========================================
// 2. Dynamic World Clock Logic
// ==========================================
let customClocks = [
    { city: "New York", timezone: "America/New_York" },
    { city: "London", timezone: "Europe/London" },
    { city: "Tokyo", timezone: "Asia/Tokyo" }
];

const grid = document.getElementById('world-grid');
const addClockBtn = document.getElementById('add-world-clock');
const cityNameInput = document.getElementById('world-city-name');
const timezoneSelect = document.getElementById('world-timezone');

function renderWorldClocks() {
    if (!grid) return;
    grid.innerHTML = ''; // Clear out the grid to redraw

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

// Globally-accessible remove function
window.removeWorldClock = function(index) {
    customClocks.splice(index, 1);
    renderWorldClocks();
};

if (addClockBtn && cityNameInput && timezoneSelect) {
    addClockBtn.addEventListener('click', () => {
        const timezone = timezoneSelect.value;
        // Default to timezone display name if input is left blank
        const city = cityNameInput.value.trim() || timezoneSelect.options[timezoneSelect.selectedIndex].text.split(' ')[0];

        // Avoid adding exact duplicate timezones
        const duplicate = customClocks.some(c => c.timezone === timezone);
        if (duplicate) {
            alert("This timezone is already displayed.");
            return;
        }

        customClocks.push({ city, timezone });
        cityNameInput.value = ''; // Reset input
        renderWorldClocks();
    });
}

// Initial draw of starting locations
renderWorldClocks();

// ==========================================
// 3. Local Clock & Live Updates Loop
// ==========================================
const alertSound = document.getElementById('alert-sound');

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

    // World Cards DOM Update (Handles default and custom added clocks)
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

    // Continuously check for Alarm match
    checkAlarm(localTimeStr);
}

// Start continuous loop
setInterval(updateClocks, 1000);
updateClocks();

// ==========================================
// 4. Stopwatch Logic (Built Independently)
// ==========================================
let stopwatchInterval;
let elapsedTime = 0; 
let swStartTime;

const swDisplay = document.getElementById('stopwatch-display');
const swStartBtn = document.getElementById('sw-start');
const swStopBtn = document.getElementById('sw-stop');
const swResetBtn = document.getElementById('sw-reset');

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

if (swStartBtn && swStopBtn && swResetBtn && swDisplay) {
    swStartBtn.addEventListener('click', () => {
        swStartTime = Date.now() - elapsedTime;
        stopwatchInterval = setInterval(() => {
            elapsedTime = Date.now() - swStartTime;
            swDisplay.textContent = formatStopwatchTime(elapsedTime);
        }, 10);
        swStartBtn.disabled = true;
        swStopBtn.disabled = false;
    });

    swStopBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        swStartBtn.disabled = false;
        swStopBtn.disabled = true;
    });

    swResetBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        elapsedTime = 0;
        swDisplay.textContent = "00:00:00.00";
        swStartBtn.disabled = false;
        swStopBtn.disabled = true;
    });
}

// ==========================================
// 5. Timer (Countdown) Logic (Built Independently)
// ==========================================
let timerInterval;
let timerSecondsLeft = 0;

const timerDisplay = document.getElementById('timer-display');
const tHoursInput = document.getElementById('timer-hours');
const tMinutesInput = document.getElementById('timer-minutes');
const tSecondsInput = document.getElementById('timer-seconds');
const timerStartBtn = document.getElementById('timer-start');
const timerPauseBtn = document.getElementById('timer-pause');
const timerResetBtn = document.getElementById('timer-reset');

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

if (timerStartBtn && timerPauseBtn && timerResetBtn) {
    timerStartBtn.addEventListener('click', () => {
        if (timerSecondsLeft === 0 && tHoursInput && tMinutesInput && tSecondsInput) {
            const hrs = parseInt(tHoursInput.value) || 0;
            const mins = parseInt(tMinutesInput.value) || 0;
            const secs = parseInt(tSecondsInput.value) || 0;
            timerSecondsLeft = (hrs * 3600) + (mins * 60) + secs;
        }

        if (timerSecondsLeft <= 0) return;

        timerStartBtn.disabled = true;
        timerPauseBtn.disabled = false;

        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            updateTimerDisplay(timerSecondsLeft);

            if (timerSecondsLeft <= 0) {
                clearInterval(timerInterval);
                if (alertSound) {
                    alertSound.play().catch(e => console.log("Audio blocked: User interaction required first."));
                    alert("Timer Finished!");
                    alertSound.pause();
                    alertSound.currentTime = 0;
                }
                resetTimerUI();
            }
        }, 1000);
    });

    timerPauseBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerStartBtn.disabled = false;
        timerPauseBtn.disabled = true;
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        resetTimerUI();
    });
}

// ==========================================
// 6. Alarm Logic (Built Independently)
// ==========================================
let alarmTime = null;
const alarmInput = document.getElementById('alarm-time');
const alarmStatus = document.getElementById('alarm-status');
const alarmStopBtn = document.getElementById('alarm-stop');
const alarmSetBtn = document.getElementById('alarm-set');

if (alarmSetBtn && alarmInput && alarmStatus) {
    alarmSetBtn.addEventListener('click', () => {
        if (alarmInput.value) {
            alarmTime = alarmInput.value;
            alarmStatus.textContent = `Alarm set for: ${alarmTime}`;
        }
    });
}

function checkAlarm(localTimeStr) {
    if (!alarmTime) return;

    const currentTimeStr = localTimeStr.substring(0, 5); 

    if (currentTimeStr === alarmTime) {
        if (alertSound) {
            alertSound.play().catch(e => console.log("Audio blocked: User interaction required first."));
        }
        if (alarmStopBtn) {
            alarmStopBtn.classList.remove('hidden');
        }
        if (alarmStatus) {
            alarmStatus.textContent = "Alarm Ringing!";
        }
        alarmTime = null; 
    }
}

if (alarmStopBtn) {
    alarmStopBtn.addEventListener('click', () => {
        if (alertSound) {
            alertSound.pause();
            alertSound.currentTime = 0;
        }
        alarmStopBtn.classList.add('hidden');
        if (alarmStatus) alarmStatus.textContent = "No alarm set";
        if (alarmInput) alarmInput.value = '';
    });
}
