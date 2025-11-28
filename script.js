/* Guess The Number — Glassmorphism Edition
   Features:
   - 10 attempts per round
   - Success / fail tracking
   - Username welcome & display
   - LocalStorage leaderboard (round results)
   - Dark/Light toggle
   - Smooth animations & confetti
   - WebAudio feedback (no external files)
*/

(() => {
  // Elements
  const usernameInput = document.getElementById('username-input');
  const startBtn = document.getElementById('start-btn');
  const welcomeCard = document.getElementById('welcome-card');
  const gameCard = document.getElementById('game-card');
  const playerNameEl = document.getElementById('player-name');
  const playerTitle = document.getElementById('player-title');

  const guessInput = document.getElementById('guess-input');
  const guessBtn = document.getElementById('guess-btn');
  const resultEl = document.getElementById('result');
  const previousEl = document.getElementById('previous-guesses');
  const attemptsEl = document.getElementById('attempts');
  const successEl = document.getElementById('success-count');
  const failEl = document.getElementById('fail-count');

  const newRoundBtn = document.getElementById('new-round');
  const resetStatsBtn = document.getElementById('reset-stats');

  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  const leaderboardOpen = document.getElementById('leaderboard-open');
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const leaderboardContent = document.getElementById('leaderboard-content');
  const closeLeaderboard = document.getElementById('close-leaderboard');
  const clearLeaderboard = document.getElementById('clear-leaderboard');

  const confettiCanvas = document.getElementById('confetti-canvas');

  // Game variables
  let randomNumber = rand1to100();
  let attemptsLeft = 10;
  let successCount = 0;
  let failCount = 0;
  let username = '';
  const LEADER_KEY = 'gtn_leaderboard_v1';

  // ----- Helper functions -----
  function rand1to100(){ return Math.floor(Math.random()*100)+1; }

  function playTone(freq=440, duration=120, type='sine'){
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = 0;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration/1000);
      o.stop(ctx.currentTime + duration/1000 + 0.02);
    } catch(e){ /* ignore audio errors on some devices */ }
  }

  function showResult(html, cls){
    resultEl.innerHTML = `<div class="${cls}">${html}</div>`;
  }

  function updateUI(){
    attemptsEl.textContent = attemptsLeft;
    successEl.textContent = successCount;
    failEl.textContent = failCount;
  }

  function saveRoundToLeaderboard(user, won){
    const data = JSON.parse(localStorage.getItem(LEADER_KEY) || '[]');
    data.unshift({
      name: user,
      result: won ? 'Success' : 'Fail',
      success: won ? 1 : 0,
      fail: won ? 0 : 1,
      ts: Date.now()
    });
    // keep last 50
    localStorage.setItem(LEADER_KEY, JSON.stringify(data.slice(0,50)));
  }

  function renderLeaderboard(){
    const data = JSON.parse(localStorage.getItem(LEADER_KEY) || '[]');
    if(!data.length){
      leaderboardContent.innerHTML = `<p style="color:var(--muted);">No rounds yet. Play a round to add to leaderboard.</p>`;
      return;
    }
    // build table
    let html = `<table class="table"><thead><tr><th>#</th><th>Player</th><th>Result</th><th>When</th></tr></thead><tbody>`;
    data.forEach((r,i)=>{
      const d = new Date(r.ts);
      html += `<tr>
        <td>${i+1}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.result === 'Success' ? `<strong style="color:var(--success)">Success</strong>` : `<strong style="color:var(--danger)">Fail</strong>`}</td>
        <td>${d.toLocaleString()}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    leaderboardContent.innerHTML = html;
  }

  function escapeHtml(s){
    return (s+'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ----- Confetti (small) -----
  const confetti = {
    ctx: confettiCanvas.getContext && confettiCanvas.getContext('2d'),
    particles: [],
    resize(){
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    },
    burst(x, y, count=24){
      if(!confetti.ctx) return;
      for(let i=0;i<count;i++){
        confetti.particles.push({
          x: x || window.innerWidth/2,
          y: y || 200,
          vx: (Math.random()-0.5)*6,
          vy: (Math.random()-0.8)*6,
          life: 60 + Math.random()*40,
          size: 6 + Math.random()*6,
          color: `hsl(${Math.floor(Math.random()*360)},80%,60%)`
        });
      }
    },
    step(){
      if(!confetti.ctx) return;
      confetti.ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
      for(let i=confetti.particles.length-1;i>=0;i--){
        const p = confetti.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life--;
        confetti.ctx.globalAlpha = Math.max(0, p.life/100);
        confetti.ctx.fillStyle = p.color;
        confetti.ctx.fillRect(p.x, p.y, p.size, p.size);
        if(p.life<=0 || p.y > confettiCanvas.height) confetti.particles.splice(i,1);
      }
      requestAnimationFrame(confetti.step);
    },
    init(){
      if(!confetti.ctx) return;
      confetti.resize();
      window.addEventListener('resize', confetti.resize);
      confetti.step();
    }
  };
  confetti.init();

  // ----- Game logic -----
  function startGameFor(name){
    username = name.trim() || 'Player';
    playerNameEl.textContent = username;
    playerTitle.textContent = `Player: ${username}`;

    // show game UI
    welcomeCard.classList.add('hidden');
    gameCard.classList.remove('hidden');
    gameCard.removeAttribute('aria-hidden');

    // focus
    setTimeout(()=> guessInput.focus(), 200);

    // reset round values
    attemptsLeft = 10;
    randomNumber = rand1to100();
    previousEl.innerHTML = '';
    resultEl.innerHTML = `<em style="color:var(--muted)">Good luck, ${escapeHtml(username)} — make your first guess!</em>`;
    updateUI();
  }

  function endRound(won){
    // record
    saveRoundToLeaderboard(username, won);
    renderLeaderboard();
    updateUI();

    if(won){
      playTone(880,140,'sawtooth');
      confetti.burst(window.innerWidth/2, window.innerHeight/3, 60);
      showResult(`${escapeHtml(username)}, you guessed it right! ✔️ — The number was ${randomNumber}`, 'success');
    } else {
      playTone(180,220,'sine');
      showResult(`${escapeHtml(username)}, out of attempts — round failed ❌ — The number was ${randomNumber}`, 'fail');
    }

    // auto restart after a short delay (2s)
    setTimeout(()=>{
      randomNumber = rand1to100();
      attemptsLeft = 10;
      previousEl.innerHTML = '';
      resultEl.innerHTML = `<em style="color:var(--muted)">New round — good luck, ${escapeHtml(username)}!</em>`;
      updateUI();
      guessInput.value = '';
      guessInput.focus();
    }, 1800);
  }

  function handleGuess(){
    const raw = guessInput.value;
    if(!raw){ alert('Please enter a number between 1 and 100.'); return; }

    const g = Number(raw);
    if(Number.isNaN(g) || g < 1 || g > 100){ alert('Enter a valid number between 1 and 100.'); return; }

    attemptsLeft--;
    let icon = '';
    if(g === randomNumber){
      // success
      successCount++;
      updateUI();
      previousEl.innerHTML += `<p style="background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#fff">${g} ✔️</p>`;
      endRound(true);
      return;
    }

    // incorrect
    const higher = g < randomNumber;
    icon = higher ? '⬇️' : '⬆️'; // user's guess is low -> arrow down meaning secret is higher? keep wording clear
    previousEl.innerHTML += `<p>${g} ${icon}</p>`;

    if(higher){
      showResult(`${escapeHtml(username)}, your guess of ${g} is too low ${icon}`, 'arrow-down');
      playTone(240,90,'triangle');
    } else {
      showResult(`${escapeHtml(username)}, your guess of ${g} is too high ${icon}`, 'arrow-up');
      playTone(560,100,'triangle');
    }

    updateUI();

    if(attemptsLeft <= 0){
      failCount++;
      updateUI();
      endRound(false);
    } else {
      guessInput.value = '';
      guessInput.focus();
    }
  }

  // ----- Events -----
  startBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if(!name){ alert('Please enter your name to start.'); usernameInput.focus(); return; }
    startGameFor(name);
  });

  usernameInput.addEventListener('keypress', e => {
    if(e.key === 'Enter') startBtn.click();
  });

  guessBtn.addEventListener('click', handleGuess);
  guessInput.addEventListener('keypress', e => {
    if(e.key === 'Enter') handleGuess();
  });

  newRoundBtn.addEventListener('click', () => {
    randomNumber = rand1to100();
    attemptsLeft = 10;
    previousEl.innerHTML = '';
    resultEl.innerHTML = `<em style="color:var(--muted)">New round started — good luck, ${escapeHtml(username)}!</em>`;
    guessInput.value = '';
    guessInput.focus();
    updateUI();
  });

  resetStatsBtn.addEventListener('click', () => {
    if(confirm('This will clear the local leaderboard. Continue?')){
      localStorage.removeItem(LEADER_KEY);
      renderLeaderboard();
      alert('Leaderboard cleared.');
    }
  });

  // Leaderboard modal controls
  leaderboardOpen.addEventListener('click', () => {
    renderLeaderboard();
    leaderboardModal.classList.remove('hidden');
    leaderboardModal.removeAttribute('aria-hidden');
  });
  closeLeaderboard.addEventListener('click', () => {
    leaderboardModal.classList.add('hidden');
    leaderboardModal.setAttribute('aria-hidden', 'true');
  });
  clearLeaderboard.addEventListener('click', () => {
    if(confirm('Clear all saved rounds?')){
      localStorage.removeItem(LEADER_KEY);
      renderLeaderboard();
    }
  });

  // Theme toggle (persisted)
  const savedTheme = localStorage.getItem('gtn_theme');
  if(savedTheme === 'light') {
    root.setAttribute('data-theme','light');
    themeToggle.checked = true;
    document.querySelector('.theme-switch .label').textContent = 'Light';
  } else {
    root.removeAttribute('data-theme');
    themeToggle.checked = false;
    document.querySelector('.theme-switch .label').textContent = 'Dark';
  }

  themeToggle.addEventListener('change', () => {
    if(themeToggle.checked){
      root.setAttribute('data-theme','light');
      localStorage.setItem('gtn_theme','light');
      document.querySelector('.theme-switch .label').textContent = 'Light';
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('gtn_theme','dark');
      document.querySelector('.theme-switch .label').textContent = 'Dark';
    }
  });

  // initialize displayed counts and leaderboard
  function init(){
    attemptsLeft = 10;
    successCount = 0;
    failCount = 0;
    updateUI();
    renderLeaderboard();
  }
  init();

  // small safety: focus username on load
  setTimeout(()=> usernameInput.focus(), 400);

})();
