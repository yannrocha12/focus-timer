(() => {
  const CIRCUMFERENCE = 2 * Math.PI * 100; // matches r=100 in the SVG

  const timeEl = document.getElementById('time');
  const cycleLabelEl = document.getElementById('cycle-label');
  const ringProgress = document.querySelector('.ring-progress');
  const startPauseBtn = document.getElementById('startPause');
  const resetBtn = document.getElementById('reset');
  const modeButtons = [...document.querySelectorAll('.mode-btn')];
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const focusInput = document.getElementById('focusMinutes');
  const shortInput = document.getElementById('shortMinutes');
  const longInput = document.getElementById('longMinutes');

  const MODE_META = {
    focus: { input: focusInput, color: '#ff8a5b', label: (n) => `Ciclo ${n}` },
    short: { input: shortInput, color: '#5bd6ff', label: () => 'Pausa curta' },
    long: { input: longInput, color: '#9d7bff', label: () => 'Pausa longa' },
  };

  let mode = 'focus';
  let focusCycles = Number(localStorage.getItem('focusCycles') || 1);
  let totalSeconds = Number(focusInput.value) * 60;
  let remainingSeconds = totalSeconds;
  let running = false;
  let intervalId = null;

  ringProgress.style.strokeDasharray = String(CIRCUMFERENCE);

  function minutesFor(m) {
    return Math.max(1, Math.min(180, Number(MODE_META[m].input.value) || 1)) * 60;
  }

  function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function render() {
    timeEl.textContent = formatTime(remainingSeconds);
    cycleLabelEl.textContent = MODE_META[mode].label(focusCycles);
    const progressFraction = 1 - remainingSeconds / totalSeconds;
    ringProgress.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progressFraction));
    document.documentElement.style.setProperty('--accent', MODE_META[mode].color);
    startPauseBtn.textContent = running ? 'Pausar' : (remainingSeconds === totalSeconds ? 'Começar' : 'Continuar');
    document.title = running ? `${formatTime(remainingSeconds)} — Foco` : 'Foco — Timer Pomodoro';
  }

  function switchMode(newMode, { resetCycles = false } = {}) {
    mode = newMode;
    modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === newMode));
    stopTimer();
    totalSeconds = minutesFor(mode);
    remainingSeconds = totalSeconds;
    if (resetCycles) focusCycles = 1;
    render();
  }

  function tick() {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      render();
      completeSession();
      return;
    }
    render();
  }

  function startTimer() {
    if (running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
    render();
  }

  function stopTimer() {
    running = false;
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    render();
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.18 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.55);
      });
    } catch (e) {
      /* audio not available; fail silently */
    }
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function loadHistory() {
    const raw = localStorage.getItem('focusHistory');
    if (!raw) return [];
    try {
      const data = JSON.parse(raw);
      return data.date === todayKey() ? data.sessions : [];
    } catch {
      return [];
    }
  }

  function saveHistory(sessions) {
    localStorage.setItem('focusHistory', JSON.stringify({ date: todayKey(), sessions }));
  }

  function renderHistory(sessions) {
    historyList.innerHTML = '';
    if (sessions.length === 0) {
      historyList.innerHTML = '<li class="empty">Nenhuma sessão de foco concluída ainda.</li>';
      return;
    }
    sessions.forEach((s) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>Foco #${s.n}</span><span>${s.minutes} min · ${s.time}</span>`;
      historyList.appendChild(li);
    });
  }

  function completeSession() {
    stopTimer();
    playChime();

    if (mode === 'focus') {
      const sessions = loadHistory();
      sessions.push({
        n: sessions.length + 1,
        minutes: Math.round(totalSeconds / 60),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
      saveHistory(sessions);
      renderHistory(sessions);

      focusCycles += 1;
      localStorage.setItem('focusCycles', String(focusCycles));
      const nextMode = focusCycles % 4 === 1 ? 'long' : 'short';
      switchMode(nextMode);
    } else {
      switchMode('focus');
    }
  }

  startPauseBtn.addEventListener('click', () => {
    running ? stopTimer() : startTimer();
  });

  resetBtn.addEventListener('click', () => {
    stopTimer();
    totalSeconds = minutesFor(mode);
    remainingSeconds = totalSeconds;
    render();
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode, { resetCycles: btn.dataset.mode === 'focus' && mode !== 'focus' ? false : false }));
  });

  [focusInput, shortInput, longInput].forEach((input) => {
    input.addEventListener('change', () => {
      const owningMode = Object.keys(MODE_META).find((m) => MODE_META[m].input === input);
      if (owningMode === mode && !running) {
        totalSeconds = minutesFor(mode);
        remainingSeconds = totalSeconds;
        render();
      }
    });
  });

  clearHistoryBtn.addEventListener('click', () => {
    saveHistory([]);
    renderHistory([]);
  });

  renderHistory(loadHistory());
  render();
})();
