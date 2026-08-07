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
            // Remove active class from all buttons and sections
            tabButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Add active class to clicked button and target section
            button.classList.add('active');
            targetSection.classList.add('active');
        }
    });
});

// ==========================================
// 2. Local Clock & World Clock Logic
// ==========================================
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

    // World Clock Times
    const worldOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const nyTimeEl = document.getElementById('ny-time');
    if (nyTimeEl) {
        nyTimeEl.textContent = new Intl.DateTimeFormat('en-US', { ...worldOptions, timeZone: 'America/New_York' }).format(now);
    }
        
    const londonTimeEl = document.getElementById('london-time');
    if (londonTimeEl) {
        londonTimeEl.textContent = new Intl.DateTimeFormat('en-US', { ...worldOptions, timeZone: 'Europe/London' }).format(now);
    }
        
    const tokyoTimeEl = document.getElementById('tokyo-time');
    if (tokyoTimeEl) {
        tokyoTimeEl.textContent = new Intl.DateTimeFormat('en-US', { ...worldOptions, timeZone: 'Asia/Tokyo' }).format(now);
    }

    // Check if the alarm should ring
    checkAlarm(localTimeStr);
}

// Start the live clock updates
setInterval(updateClocks, 1000);
updateClocks(); // Run once immediately so it doesn't wait 1 second to start

// ==========================================
// 3. Stopwatch Logic
// ==========================================
let stopwatchInterval;
let elapsedTime = 0; // Milliseconds
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
    let milliseconds = Math.floor((ms % 1000) / 10); // 2-digit milliseconds

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
        }, 10); // Smooth update every 10ms

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
// 4. Timer (Countdown) Logic
// ==========================================
let timerInterval;
let timerSecondsLeft = 0;
const alertSound = document.getElementById('alert-sound');

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
                    alertSound.play();
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
// 5. Alarm Logic
// ==========================================
let alarmTime = null;
const alarmInput = document.getElementById('alarm-time');
const alarmStatus = document.getElementById('alarm-status');
const alarmStopBtn = document.getElementById('alarm-stop');
const alarmSetBtn = document.getElementById('alarm-set');

if (alarmSetBtn && alarmInput && alarmStatus) {
    alarmSetBtn.addEventListener('click', () => {
        if (alarmInput.value) {
            alarmTime = alarmInput.value; // Expected format: "HH:MM"
            alarmStatus.textContent = `Alarm set for: ${alarmTime}`;
        }
    });
}

function checkAlarm(localTimeStr) {
    if (!alarmTime) return;

    // Grab "HH:MM" from the local time string
    const currentTimeStr = localTimeStr.substring(0, 5); 

    if (currentTimeStr === alarmTime) {
        if (alertSound) {
            alertSound.play();
        }
        if (alarmStopBtn) {
            alarmStopBtn.classList.remove('hidden');
        }
        if (alarmStatus) {
            alarmStatus.textContent = "Alarm Ringing!";
        }
        alarmTime = null; // Clear the alarm so it doesn't trigger repeatedly
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
