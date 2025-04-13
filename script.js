const keyboardLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Del'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', 'Enter'],
    ['ShiftLeft', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'ShiftRight'],
    ['ControlLeft', 'Meta', 'AltLeft', 'Space', 'AltRight', 'ControlRight']
];

const keyMap = {
    ' ': 'Space',
    'Shift': 'ShiftLeft',
    'Control': 'ControlLeft',
    'Alt': 'AltLeft',
    'Meta': 'Meta',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ShiftRight': 'ShiftRight',
    'ControlRight': 'ControlRight',
    'AltRight': 'AltRight'
};

const keyboard = document.getElementById('keyboard');
const textDisplay = document.getElementById('text-display');
const caret = document.getElementById('caret');
const wpmDisplay = document.getElementById('wpm');
const rawWpmDisplay = document.getElementById('raw-wpm');
const accuracyDisplay = document.getElementById('accuracy');
const consistencyDisplay = document.getElementById('consistency');
const errorsDisplay = document.getElementById('errors');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettings = document.getElementById('close-settings');
const punctuationToggle = document.getElementById('punctuation');
const numbersToggle = document.getElementById('numbers');
const caseSensitiveToggle = document.getElementById('case-sensitive');
const optionsSelector = document.getElementById('options-selector');
const historyContainer = document.getElementById('history');
const historyList = document.getElementById('history-list');

let state = {
    mode: 'time',
    option: '30',
    difficulty: 'normal',
    theme: 'vscode-dark',
    currentText: '',
    currentIndex: 0,
    errors: 0,
    startTime: null,
    isTyping: false,
    timer: 0,
    timerInterval: null,
    settings: {
        punctuation: false,
        numbers: false,
        caseSensitive: false
    },
    history: JSON.parse(localStorage.getItem('typingHistory')) || [],
    wordTimings: [],
    totalCharsTyped: 0
};

// Build keyboard
keyboardLayout.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    row.forEach(key => {
        const keyDiv = document.createElement('div');
        keyDiv.classList.add('key');
        if (['Backspace', 'CapsLock', 'Enter', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'AltLeft', 'AltRight'].includes(key)) {
            keyDiv.classList.add('wide');
        }
        if (['ControlRight'].includes(key)) {
            keyDiv.classList.add('control-right');
        }
        if (['Tab'].includes(key)) {
            keyDiv.classList.add('wide');
        }
        if (['Space'].includes(key)) {
            keyDiv.classList.add('space');
        }
        keyDiv.textContent = keyMap[key] || key;
        keyDiv.setAttribute('data-key', key.toLowerCase());
        rowDiv.appendChild(keyDiv);
    });
    keyboard.appendChild(rowDiv);
});

// Fetch text from Flask
async function fetchText() {
    try {
        const lengthMap = {
            time: { '15': 'short', '30': 'medium', '60': 'long', '120': 'long' },
            words: { '10': 'short', '25': 'medium', '50': 'long', '100': 'long' },
            quote: { 'short': 'short', 'medium': 'medium', 'long': 'long' }
        };
        const response = await fetch('http://localhost:5000/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: state.mode === 'quote' ? 'quote' : 'sentence',
                punctuation: state.settings.punctuation,
                numbers: state.settings.numbers,
                length: lengthMap[state.mode][state.option] || 'medium'
            })
        });
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Fetch failed:', error);
        return 'The quick brown fox jumps over the lazy dog 123.';
    }
}

// Update text display
function updateTextDisplay() {
    const chars = state.currentText.split('');
    let html = '';
    let caretPos = { left: 0, top: 0 };
    let foundCurrent = false;

    chars.forEach((char, i) => {
        let className = '';
        if (i < state.currentIndex) {
            className = 'typed';
        } else if (i === state.currentIndex) {
            className = 'current';
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            textDisplay.appendChild(span);
            const rect = span.getBoundingClientRect();
            caretPos = {
                left: rect.left - textDisplay.getBoundingClientRect().left,
                top: rect.top - textDisplay.getBoundingClientRect().top
            };
            textDisplay.removeChild(span);
            foundCurrent = true;
        } else {
            className = 'untyped';
        }
        html += `<span class="${className}">${char === ' ' ? '\u00A0' : char}</span>`;
    });

    if (!foundCurrent && state.currentIndex >= chars.length) {
        const lastSpan = textDisplay.querySelector('span:last-child');
        if (lastSpan) {
            const rect = lastSpan.getBoundingClientRect();
            caretPos = {
                left: rect.right - textDisplay.getBoundingClientRect().left,
                top: rect.top - textDisplay.getBoundingClientRect().top
            };
        }
    }

    textDisplay.innerHTML = html;
    caret.style.left = `${caretPos.left}px`;
    caret.style.top = `${caretPos.top}px`;
    caret.style.display = state.isTyping ? 'block' : 'none';
}

// Calculate stats
function calculateStats() {
    const elapsedTime = state.startTime ? (Date.now() - state.startTime) / 1000 / 60 : 0;
    const wordsTyped = state.currentText.slice(0, state.currentIndex).split(/\s+/).filter(w => w).length;
    const allWords = state.currentText.split(/\s+/).filter(w => w).length;
    const wpm = elapsedTime > 0 ? Math.round(wordsTyped / elapsedTime) : 0;
    const rawWpm = elapsedTime > 0 ? Math.round(state.totalCharsTyped / 5 / elapsedTime) : 0;
    const accuracy = state.currentIndex > 0 ? Math.round(((state.currentIndex - state.errors) / state.currentIndex) * 100) : 0;

    // Calculate consistency
    const mean = state.wordTimings.length > 0 ? state.wordTimings.reduce((a, b) => a + b, 0) / state.wordTimings.length : 0;
    const variance = state.wordTimings.length > 1 ? state.wordTimings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (state.wordTimings.length - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const consistency = mean > 0 ? Math.round((1 - stdDev / mean) * 100) : 0;

    wpmDisplay.textContent = wpm;
    rawWpmDisplay.textContent = rawWpm;
    accuracyDisplay.textContent = `${accuracy}%`;
    consistencyDisplay.textContent = `${consistency}%`;
    errorsDisplay.textContent = state.errors;

    return { wpm, rawWpm, accuracy, consistency, errors: state.errors, chars: state.currentIndex };
}

// Save result
function saveResult(stats) {
    const result = {
        mode: state.mode,
        option: state.option,
        difficulty: state.difficulty,
        ...stats,
        date: new Date().toLocaleString()
    };
    state.history.unshift(result);
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('typingHistory', JSON.stringify(state.history));
    updateHistory();
}

// Update history
function updateHistory() {
    historyList.innerHTML = state.history.map(h => `
        <div class="history-item">
            ${h.date} | ${h.mode} (${h.option}) | WPM: ${h.wpm} | Raw: ${h.rawWpm} | Acc: ${h.accuracy}% | Cons: ${h.consistency}% | Err: ${h.errors}
        </div>
    `).join('');
    historyContainer.style.display = state.history.length > 0 ? 'block' : 'none';
}

// Reset game
async function resetGame() {
    state.currentText = await fetchText();
    state.currentIndex = 0;
    state.errors = 0;
    state.startTime = null;
    state.isTyping = false;
    state.wordTimings = [];
    state.totalCharsTyped = 0;
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    if (state.mode === 'time') {
        state.timer = parseInt(state.option);
    } else {
        state.timer = 0;
    }
    wpmDisplay.textContent = '0';
    rawWpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '0%';
    consistencyDisplay.textContent = '0%';
    errorsDisplay.textContent = '0';
    updateTextDisplay();
}

// Start timer
function startTimer() {
    if (!state.timerInterval && state.timer > 0) {
        state.startTime = Date.now();
        state.timerInterval = setInterval(() => {
            state.timer--;
            if (state.timer <= 0) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                state.isTyping = false;
                const stats = calculateStats();
                saveResult(stats);
                textDisplay.innerHTML = `<span class="typed">${state.currentText}</span>`;
                caret.style.display = 'none';
            }
        }, 1000);
    }
}

// Update options selector
function updateOptionsSelector() {
    const options = {
        time: ['15', '30', '60', '120'],
        words: ['10', '25', '50', '100'],
        quote: ['short', 'medium', 'long']
    };
    optionsSelector.innerHTML = `
        <span>Option:</span>
        ${options[state.mode].map(opt => `
            <button class="option-btn ${opt === state.option ? 'active' : ''}" data-option="${opt}">${opt}</button>
        `).join('')}
    `;
}

// Handle key presses
document.addEventListener('keydown', (e) => {
    if (settingsPanel.style.display === 'block') return;

    let key = e.key;
    let expectedChar = state.currentText[state.currentIndex] || '';

    if (key === ' ') key = 'Space';
    if (e.code === 'ShiftRight') key = 'ShiftRight';
    if (e.code === 'ControlRight') key = 'ControlRight';
    if (e.code === 'AltRight') key = 'AltRight';
    if (e.code === 'ShiftLeft') key = 'ShiftLeft';
    if (e.code === 'ControlLeft') key = 'ControlLeft';
    if (e.code === 'AltLeft') key = 'AltLeft';
    if (key.length === 1 && !state.settings.caseSensitive) {
        key = key.toLowerCase();
        expectedChar = expectedChar.toLowerCase();
    }

    const keyDiv = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyDiv) {
        keyDiv.classList.add('pressed');
    }

    if (!state.isTyping && state.mode === 'time') {
        state.isTyping = true;
        startTimer();
    }

    if (state.isTyping && (state.mode !== 'time' || state.timer > 0)) {
        if (key.length === 1 || key === 'Backspace') {
            let fail = false;
            if (key === 'Backspace' && state.currentIndex > 0) {
                state.currentIndex--;
                state.totalCharsTyped++;
            } else if (key.length === 1) {
                state.totalCharsTyped++;
                if (key === expectedChar) {
                    state.currentIndex++;
                } else {
                    state.errors++;
                    if (state.difficulty === 'expert' && state.currentText.slice(0, state.currentIndex + 1).split(/\s+/).pop() !== key) {
                        fail = true;
                    } else if (state.difficulty === 'master') {
                        fail = true;
                    }
                }
            }

            if (fail) {
                state.isTyping = false;
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                textDisplay.innerHTML = `<span class="error">Failed! Press Esc to restart.</span>`;
                caret.style.display = 'none';
                return;
            }

            // Track word timing
            if (state.currentText[state.currentIndex] === ' ' || state.currentIndex >= state.currentText.length) {
                const wordTime = (Date.now() - (state.wordTimings[state.wordTimings.length - 1]?.time || state.startTime)) / 1000;
                state.wordTimings.push({ time: Date.now(), duration: wordTime });
            }

            updateTextDisplay();
            calculateStats();

            // Check completion
            if (state.currentIndex >= state.currentText.length || 
                (state.mode === 'words' && state.currentText.split(/\s+/).filter(w => w).length >= parseInt(state.option)) ||
                (state.mode === 'quote' && state.currentIndex >= state.currentText.length)) {
                state.isTyping = false;
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                const stats = calculateStats();
                saveResult(stats);
                caret.style.display = 'none';
            }
        }
    }

    if (e.key === 'Escape') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (e.code === 'ShiftRight') key = 'ShiftRight';
    if (e.code === 'ControlRight') key = 'ControlRight';
    if (e.code === 'AltRight') key = 'AltRight';
    if (e.code === 'ShiftLeft') key = 'ShiftLeft';
    if (e.code === 'ControlLeft') key = 'ControlLeft';
    if (e.code === 'AltLeft') key = 'AltLeft';
    if (key.length === 1 && !state.settings.caseSensitive) {
        key = key.toLowerCase();
    }
    const keyDiv = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyDiv) {
        keyDiv.classList.remove('pressed');
    }
});

// Mode selection
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;
        state.option = state.mode === 'time' ? '30' : state.mode === 'words' ? '25' : 'medium';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateOptionsSelector();
        resetGame();
    });
});

// Option selection
optionsSelector.addEventListener('click', (e) => {
    if (e.target.classList.contains('option-btn')) {
        state.option = e.target.dataset.option;
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        resetGame();
    }
});

// Difficulty selection
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.difficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resetGame();
    });
});

// Theme selection
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        document.body.className = `theme-${state.theme}`;
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Settings panel
settingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'block';
});

closeSettings.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    state.settings.punctuation = punctuationToggle.checked;
    state.settings.numbers = numbersToggle.checked;
    state.settings.caseSensitive = caseSensitiveToggle.checked;
    resetGame();
});

// Initialize
document.body.className = `theme-${state.theme}`;
document.querySelector('.mode-btn[data-mode="time"]').classList.add('active');
document.querySelector('.diff-btn[data-diff="normal"]').classList.add('active');
document.querySelector('.theme-btn[data-theme="vscode-dark"]').classList.add('active');
updateOptionsSelector();
updateHistory();
resetGame();