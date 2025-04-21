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

document.addEventListener('keydown', (e) => {
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (e.code === 'ShiftRight') key = 'ShiftRight';
    if (e.code === 'ControlRight') key = 'ControlRight';
    if (e.code === 'AltRight') key = 'AltRight';
    if (e.code === 'ShiftLeft') key = 'ShiftLeft';
    if (e.code === 'ControlLeft') key = 'ControlLeft';
    if (e.code === 'AltLeft') key = 'AltLeft';
    if (key.length === 1) key = key.toLowerCase();
    const keyDiv = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyDiv) {
        keyDiv.classList.add('pressed');
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
    if (key.length === 1) key = key.toLowerCase();
    const keyDiv = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyDiv) {
        keyDiv.classList.remove('pressed');
    }
});