/* ===========================
   MathCraft RPG – script.js
   =========================== */

/* -------------------------
   Utility / initial state
   ------------------------- */
const $ = id => document.getElementById(id);

let timerInterval = null;
let timeLeft = 45;
let typingInterval = null;
let isPaused = false;
let currentLevel = 1;
let monstersDefeated = 0;
let totalMonstersPerLevel = 2;
let isCritActive = false;

// In-memory save data (replaces localStorage)
let savedGameData = null;

const defaultState = {
  hearts: 3,
  level: 1,
  score: 0,
  inventory: [], // Start empty - items drop from enemies
  enemy: null,
  monstersDefeated: 0
};

let state = JSON.parse(JSON.stringify(defaultState));

/* -------------------------
   Audio elements with volume control
   ------------------------- */
const bgMusic = $('bgMusic');
const sfxHit = $('sfxHit');
const sfxMiss = $('sfxMiss');
const sfxLevel = $('sfxLevel');
const sfxType = $('sfxType');
const sfxGameOver = $('sfxGameOver');

// Initialize volumes
let musicVolume = 0.5;
let sfxVolume = 0.7;

function updateVolumes() {
  bgMusic.volume = musicVolume;
  sfxHit.volume = sfxVolume;
  sfxMiss.volume = sfxVolume;
  sfxLevel.volume = sfxVolume;
  sfxType.volume = sfxVolume * 0.5;
  sfxGameOver.volume = sfxVolume;
  
  // Update display
  $('musicVolume').textContent = Math.round(musicVolume * 100) + '%';
  $('sfxVolume').textContent = Math.round(sfxVolume * 100) + '%';
}

/* -------------------------
   Enemy library for 3-level story with COLLEGE-LEVEL MATH
   ------------------------- */
const levelEnemies = {
  1: [ // Level 1 - Calculus Basics & Algebra
    { 
      name: 'Green Slime', 
      image: 'https://i.postimg.cc/BQR8K5mN/slime.gif',
      baseHp: 40,
      baseTime: 60,
      questions: [
        {
          q: "Find the derivative: d/dx(3x² + 5x - 7) = ?",
          a: "6x+5",
          working: [
            "Step 1: Apply power rule to each term",
            "Step 2: d/dx(3x²) = 3·2x = 6x",
            "Step 3: d/dx(5x) = 5",
            "Step 4: d/dx(-7) = 0",
            "Answer: 6x + 5"
          ]
        },
        {
          q: "Evaluate the limit: lim(x→2) (x² - 4)/(x - 2) = ?", 
          a: "4",
          working: [
            "Step 1: Factor numerator: (x-2)(x+2)",
            "Step 2: Cancel (x-2) terms",
            "Step 3: Simplified: lim(x→2) (x+2)",
            "Step 4: Substitute x=2: 2+2=4",
            "Answer: 4"
          ]
        },
        {
          q: "Solve for x: 2^(x+1) = 32. What is x?",
          a: "4",
          working: [
            "Step 1: Rewrite 32 as power of 2: 32 = 2^5",
            "Step 2: 2^(x+1) = 2^5",
            "Step 3: Equate exponents: x+1 = 5",
            "Step 4: Solve: x = 4",
            "Answer: 4"
          ]
        }
      ]
    },
    { 
      name: 'Blue Slime', 
      image: 'https://i.postimg.cc/BQR8K5mN/slime.gif',
      baseHp: 45,
      baseTime: 60,
      questions: [
        {
          q: "Integrate: ∫(4x³ + 6x) dx = ?",
          a: "x^4+3x^2+c",
          working: [
            "Step 1: Apply power rule to each term",
            "Step 2: ∫4x³dx = 4·(x^4/4) = x^4",
            "Step 3: ∫6x dx = 6·(x²/2) = 3x²",
            "Step 4: Add constant of integration",
            "Answer: x^4 + 3x² + C"
          ]
        },
        {
          q: "Find det([[2,3],[1,4]]) - determinant of 2x2 matrix",
          a: "5",
          working: [
            "Step 1: For matrix [[a,b],[c,d]], det = ad-bc",
            "Step 2: det = (2)(4) - (3)(1)",
            "Step 3: det = 8 - 3",
            "Answer: 5"
          ]
        }
      ]
    }
  ],
  2: [ // Level 2 - Intermediate Calculus & Linear Algebra
    { 
      name: 'Forest Goblin', 
      image: 'https://i.postimg.cc/Hn8qYfvF/goblin.gif',
      baseHp: 60,
      baseTime: 75,
      questions: [
        {
          q: "Find d/dx(e^(2x) · sin(x)) using product rule. Coefficient of e^(2x)·cos(x)?",
          a: "1",
          working: [
            "Step 1: Product rule: (uv)' = u'v + uv'",
            "Step 2: u=e^(2x), u'=2e^(2x); v=sin(x), v'=cos(x)",
            "Step 3: = 2e^(2x)·sin(x) + e^(2x)·cos(x)",
            "Step 4: Coefficient of e^(2x)·cos(x) is 1",
            "Answer: 1"
          ]
        },
        {
          q: "Evaluate: ∫₀¹ (3x² + 2x) dx = ?",
          a: "2",
          working: [
            "Step 1: Find antiderivative: x³ + x²",
            "Step 2: Evaluate at upper bound: (1)³ + (1)² = 2",
            "Step 3: Evaluate at lower bound: (0)³ + (0)² = 0",
            "Step 4: Subtract: 2 - 0 = 2",
            "Answer: 2"
          ]
        },
        {
          q: "Find eigenvalue λ where det([[3-λ, 2],[2, 6-λ]]) = 0. Smaller λ?",
          a: "2",
          working: [
            "Step 1: det = (3-λ)(6-λ) - 4",
            "Step 2: 18 - 9λ + λ² - 4 = 0",
            "Step 3: λ² - 9λ + 14 = 0",
            "Step 4: Factor: (λ-2)(λ-7) = 0",
            "Step 5: λ = 2 or λ = 7 (smaller is 2)",
            "Answer: 2"
          ]
        }
      ]
    },
    { 
      name: 'Mountain Goblin', 
      image: 'https://i.postimg.cc/Hn8qYfvF/goblin.gif',
      baseHp: 65,
      baseTime: 75,
      questions: [
        {
          q: "Second derivative of f(x) = x⁴ - 4x³ at x=2. f''(2) = ?",
          a: "0",
          working: [
            "Step 1: First derivative: f'(x) = 4x³ - 12x²",
            "Step 2: Second derivative: f''(x) = 12x² - 24x",
            "Step 3: Evaluate at x=2: f''(2) = 12(4) - 24(2)",
            "Step 4: f''(2) = 48 - 48 = 0",
            "Answer: 0"
          ]
        },
        {
          q: "Vector v = (3,4). What is ||v|| (magnitude)?",
          a: "5",
          working: [
            "Step 1: Magnitude formula: ||v|| = √(x² + y²)",
            "Step 2: ||v|| = √(3² + 4²)",
            "Step 3: ||v|| = √(9 + 16) = √25",
            "Answer: 5"
          ]
        }
      ]
    }
  ],
  3: [ // Level 3 - Advanced Calculus & Complex Problems
    { 
      name: 'Math Ogre', 
      image: 'https://i.postimg.cc/yxPT8qKC/ogre.gif',
      baseHp: 85,
      baseTime: 90,
      questions: [
        {
          q: "Integrate by parts: ∫x·e^x dx = ? (coefficient of e^x)",
          a: "1",
          working: [
            "Step 1: Use ∫u dv = uv - ∫v du",
            "Step 2: Let u=x, dv=e^x dx → du=dx, v=e^x",
            "Step 3: ∫x·e^x dx = x·e^x - ∫e^x dx",
            "Step 4: = x·e^x - e^x + C = e^x(x-1) + C",
            "Step 5: Coefficient of e^x term is 1",
            "Answer: 1"
          ]
        },
        {
          q: "Critical point of f(x) = x³ - 6x² + 9x + 1 where f'(x)=0. Smaller x?",
          a: "1",
          working: [
            "Step 1: f'(x) = 3x² - 12x + 9",
            "Step 2: Set equal to 0: 3x² - 12x + 9 = 0",
            "Step 3: Divide by 3: x² - 4x + 3 = 0",
            "Step 4: Factor: (x-1)(x-3) = 0",
            "Step 5: x = 1 or x = 3 (smaller is 1)",
            "Answer: 1"
          ]
        },
        {
          q: "Taylor series: e^x = 1 + x + x²/? + ... What's the denominator?",
          a: "2",
          working: [
            "Step 1: Taylor series: e^x = Σ(x^n/n!)",
            "Step 2: First terms: 1 + x + x²/2! + x³/3! + ...",
            "Step 3: For x² term: x²/2!",
            "Step 4: 2! = 2",
            "Answer: 2"
          ]
        }
      ]
    },
    { 
      name: 'Math Boss', 
      image: 'https://i.postimg.cc/ZYp8RwzH/boss.gif',
      baseHp: 120,
      baseTime: 100,
      questions: [
        {
          q: "Chain rule: d/dx[sin(x²)] = ? Coefficient of cos(x²)?",
          a: "2x",
          working: [
            "Step 1: Chain rule: d/dx[f(g(x))] = f'(g(x))·g'(x)",
            "Step 2: Outer function: sin(u), inner: u = x²",
            "Step 3: d/dx[sin(x²)] = cos(x²)·(2x)",
            "Step 4: = 2x·cos(x²)",
            "Answer: 2x"
          ]
        },
        {
          q: "Area under curve y=x² from x=0 to x=3. ∫₀³ x² dx = ?",
          a: "9",
          working: [
            "Step 1: Antiderivative: ∫x² dx = x³/3",
            "Step 2: Evaluate at x=3: (3)³/3 = 27/3 = 9",
            "Step 3: Evaluate at x=0: (0)³/3 = 0",
            "Step 4: Area = 9 - 0 = 9",
            "Answer: 9"
          ]
        },
        {
          q: "Inverse matrix of [[1,2],[3,4]]. Element at position (1,1)?",
          a: "-2",
          working: [
            "Step 1: For [[a,b],[c,d]], det = ad-bc = -2",
            "Step 2: Inverse = (1/det)[[d,-b],[-c,a]]",
            "Step 3: = (-1/2)[[4,-2],[-3,1]]",
            "Step 4: Position (1,1) = (-1/2)(4) = -2",
            "Answer: -2"
          ]
        }
      ]
    }
  ]
};

/* -------------------------
   Inventory items with effects
   ------------------------- */
const inventoryItems = {
  '❤️': {
    name: 'Healing Potion',
    color: '#ff6b6b',
    effect: ()=>{
      if(state.hearts < 3){
        state.hearts = Math.min(3, state.hearts + 1);
        return '❤️ Healed 1 heart!';
      }
      return 'Already at full health!';
    }
  },
  '⏱️': {
    name: 'Time Boost', 
    color: '#4ecdc4',
    effect: ()=>{
      timeLeft += 30;
      $('timer').textContent = `⏳ ${timeLeft}`;
      return '⏱️ +30 seconds added!';
    }
  },
  '💥': {
    name: 'Critical Strike',
    color: '#ff9f43', 
    effect: ()=>{
      isCritActive = true;
      return '💥 Next attack will CRIT!';
    }
  }
};

/* -------------------------
   DOM elements
   ------------------------- */
const screens = {
  menu: $('menu'),
  story: $('story'),
  game: $('game'),
  credits: $('credits')
};
const overlay = $('overlay');
const gameOverModal = $('gameOver');
const levelCompleteModal = $('levelComplete');
const gameCompleteModal = $('gameComplete');

/* -------------------------
   Helper functions
   ------------------------- */
function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

function play(audio){
  try{ 
    audio.currentTime = 0; 
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Audio play failed:", error);
      });
    }
  } catch(e){
    console.log("Audio error:", e);
  }
}

/* -------------------------
   UI helpers
   ------------------------- */
function renderHearts(){
  const heartsWrap = $('hearts');
  heartsWrap.innerHTML = '';
  for(let i=0;i<3;i++){
    const div = document.createElement('div');
    div.className = 'heart' + (i < state.hearts ? '' : ' empty');
    div.innerHTML = '❤';
    heartsWrap.appendChild(div);
  }
}

function renderHUD(){
  $('levelDisplay').textContent = `Level ${currentLevel}/3`;
  $('xpDisplay').textContent = `Monsters: ${monstersDefeated}/${totalMonstersPerLevel}`;
  $('scoreDisplay').textContent = `Score: ${state.score}`;
  
  // Update quest text based on level
  const questTexts = {
    1: "Level 1: Calculus & Algebra - Defeat the Slimes!",
    2: "Level 2: Advanced Calculus - Battle the Goblins!", 
    3: "Level 3: Master Level - Face the Ogre & Math Boss!"
  };
  $('storyline').textContent = questTexts[currentLevel] || questTexts[1];
}

/* -------------------------
   Inventory system
   ------------------------- */
function renderInventory(){
  const inventorySlots = $('inventorySlots');
  inventorySlots.innerHTML = '';
  
  if(state.inventory.length === 0){
    inventorySlots.innerHTML = '<div style="color:#666;font-size:10px;">Empty - Defeat enemies for items!</div>';
    return;
  }
  
  state.inventory.forEach((item, idx)=>{
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    slot.textContent = item;
    slot.style.backgroundColor = inventoryItems[item]?.color || '#333';
    slot.title = inventoryItems[item]?.name || 'Unknown Item';
    slot.onclick = () => useItem(idx);
    inventorySlots.appendChild(slot);
  });
}

function useItem(index){
  const item = state.inventory[index];
  if(!item || !inventoryItems[item]) return;
  
  const result = inventoryItems[item].effect();
  feedback(result, true);
  
  // Remove used item
  state.inventory.splice(index, 1);
  
  renderInventory();
  renderHearts();
  renderHUD();
}

/* -------------------------
   Enemy & problem system
   ------------------------- */
function spawnEnemy(){
  const levelData = levelEnemies[currentLevel];
  if(!levelData) return;
  
  // Get next enemy in level progression
  const enemyIndex = monstersDefeated % levelData.length;
  const enemyTemplate = levelData[enemyIndex];
  
  const hp = enemyTemplate.baseHp;
  const questionPool = enemyTemplate.questions;
  
  state.enemy = {
    name: enemyTemplate.name,
    image: enemyTemplate.image, 
    hp: hp,
    maxHp: hp,
    baseTime: enemyTemplate.baseTime,
    questions: questionPool,
    currentQuestionIndex: 0
  };
  
  updateEnemyUI();
  nextProblem();
}

function updateEnemyUI(){
  const img = $('enemyImage');
  img.src = state.enemy.image;
  img.alt = state.enemy.name;
  img.onerror = function() {
    // Fallback to colored div if image fails
    this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    this.src = '';
  };
  $('enemyName').textContent = state.enemy.name;
  $('enemyHP').textContent = `HP: ${state.enemy.hp}/${state.enemy.maxHp}`;
}

function nextProblem(){
  if(isPaused) return;
  if(!state.enemy) return;
  
  // Get next question from enemy's question pool
  const questionIndex = state.enemy.currentQuestionIndex % state.enemy.questions.length;
  const problem = state.enemy.questions[questionIndex];
  state.currentProblem = problem;
  
  $('question').textContent = problem.q;
  $('workingSteps').innerHTML = ''; // Clear previous working
  $('answerInput').value = '';
  $('answerInput').focus();
  
  startTimer(state.enemy.baseTime);
}

/* -------------------------
   Timer system
   ------------------------- */
function startTimer(baseTime){
  clearInterval(timerInterval);
  
  timeLeft = baseTime;
  $('timer').textContent = `⏳ ${timeLeft}`;
  $('timer').classList.remove('warning');
  
  timerInterval = setInterval(()=>{
    if(!isPaused) {
      timeLeft--;
      $('timer').textContent = `⏳ ${timeLeft}`;
      
      if(timeLeft <= 15) {
        $('timer').classList.add('warning');
      }
      
      if(timeLeft <= 0){ 
        clearInterval(timerInterval); 
        onTimeout(); 
      }
    }
  },1000);
}

function stopTimer(){ 
  clearInterval(timerInterval); 
  $('timer').textContent = '⏳ —';
  $('timer').classList.remove('warning');
}

function onTimeout(){
  state.hearts = Math.max(0, state.hearts - 1);
  feedback('⌛ Timeout! You lost 1 heart.', false);
  play(sfxMiss);
  
  // Show correct answer
  showWorkingSteps(state.currentProblem.working);
  
  renderHearts();
  renderHUD();
  
  if(state.hearts <= 0) {
    doGameOver();
    return;
  }
  
  // Move to next question
  state.enemy.currentQuestionIndex++;
  setTimeout(()=> nextProblem(), 2500);
}

/* -------------------------
   Combat system
   ------------------------- */
function submitAnswer(){
  if(!state.currentProblem) return;
  if(isPaused) return;
  
  const raw = $('answerInput').value.trim();
  
  if(raw === '') {
    feedback('Please enter an answer', false);
    $('answerInput').focus();
    return;
  }
  
  stopTimer();

  // Show working steps
  showWorkingSteps(state.currentProblem.working);
  
  const correct = checkAnswer(raw, state.currentProblem.a);
  if(correct){
    let damage = 20 + (currentLevel * 5);
    
    // Critical strike effect
    if(isCritActive){
      damage *= 2;
      feedback('💥 CRITICAL HIT! Double damage!', true);
      isCritActive = false;
    } else {
      feedback('✅ Correct! You hit the enemy.', true);
    }
    
    state.enemy.hp = Math.max(0, state.enemy.hp - damage);
    showDamage(damage);
    play(sfxHit);
    state.score += 15 * currentLevel;
    
    if(state.enemy.hp <= 0) {
      onEnemyDefeated();
    } else {
      updateEnemyUI();
      state.enemy.currentQuestionIndex++;
      setTimeout(()=> nextProblem(), 2500);
    }
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    feedback(`❌ Wrong! Correct answer: ${state.currentProblem.a}`, false);
    play(sfxMiss);
    
    renderHearts();
    renderHUD();
    
    if(state.hearts <= 0) {
      doGameOver();
      return;
    }
    
    state.enemy.currentQuestionIndex++;
    setTimeout(()=> nextProblem(), 2500);
  }
  
  renderHUD();
}

function showWorkingSteps(steps){
  const workingContainer = $('workingSteps');
  workingContainer.innerHTML = '';
  
  steps.forEach(step => {
    const stepElement = document.createElement('div');
    stepElement.className = 'working-step';
    stepElement.textContent = step;
    workingContainer.appendChild(stepElement);
  });
}

function checkAnswer(userAnswer, correctAnswer){
  // Normalize for comparison - remove spaces and make lowercase
  const normalize = (str) => str.replace(/\s+/g, '').toLowerCase().replace(/\*/g, '');
  return normalize(userAnswer) === normalize(correctAnswer);
}

function showDamage(n){
  const rect = $('enemyImage').getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'damage-pop';
  pop.textContent = `-${n}`;
  pop.style.color = isCritActive ? '#ff4444' : '#ffdd99';
  pop.style.fontSize = isCritActive ? '28px' : '22px';
  document.body.appendChild(pop);
  pop.style.left = `${rect.left + rect.width/2}px`;
  pop.style.top = `${rect.top + 20}px`;
  
  $('enemyImage').classList.add('enemy-hit');
  setTimeout(() => {
    $('enemyImage').classList.remove('enemy-hit');
    pop.remove();
  }, 700);
}

/* -------------------------
   Level progression
   ------------------------- */
function onEnemyDefeated(){
  play(sfxLevel);
  feedback('🏆 Enemy defeated!', true);
  
  // Give random item reward
  const items = ['❤️', '⏱️', '💥'];
  const randomItem = items[Math.floor(Math.random() * items.length)];
  state.inventory.push(randomItem);
  
  setTimeout(() => {
    feedback(`🎁 Found ${inventoryItems[randomItem].name}!`, true);
  }, 800);
  
  monstersDefeated++;
  state.score += 30 * currentLevel;
  state.enemy = null;
  
  renderInventory();
  renderHUD();
  
  if(monstersDefeated >= totalMonstersPerLevel){
    // Level complete
    setTimeout(() => completeLevel(), 2000);
  } else {
    // Next enemy in same level
    setTimeout(()=> spawnEnemy(), 2000);
  }
}

function completeLevel(){
  if(currentLevel >= 3){
    // Game complete
    $('finalScore').textContent = state.score;
    gameCompleteModal.classList.remove('hidden');
  } else {
    // Next level
    $('levelStats').textContent = `Level ${currentLevel} Complete! Score: ${state.score}`;
    levelCompleteModal.classList.remove('hidden');
  }
}

function nextLevel(){
  currentLevel++;
  monstersDefeated = 0;
  state.hearts = 3; // Restore hearts each level
  levelCompleteModal.classList.add('hidden');
  
  renderHearts();
  renderHUD();
  spawnEnemy();
}

/* -------------------------
   Game state management
   ------------------------- */
function feedback(msg, positive){
  const feedbackEl = $('feedback');
  feedbackEl.textContent = msg;
  feedbackEl.className = positive ? 'feedback positive' : 'feedback negative';
  
  setTimeout(()=>{ 
    if(feedbackEl.textContent === msg) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'feedback';
    } 
  }, 3000);
}

function openOverlay(title='Paused'){
  isPaused = true;
  overlay.classList.remove('hidden');
  $('overlayTitle').textContent = title;
}

function closeOverlay(){
  isPaused = false;
  overlay.classList.add('hidden');
  if(state.enemy && state.currentProblem) {
    // Resume timer with remaining time
    startTimer(timeLeft);
  }
}

function saveGame(){
  const saveData = {
    ...state,
    currentLevel,
    monstersDefeated,
    timeLeft
  };
  savedGameData = saveData;
  feedback('💾 Game saved.', true);
}

function loadGame(){
  if(savedGameData){
    state = {...savedGameData};
    currentLevel = savedGameData.currentLevel || 1;
    monstersDefeated = savedGameData.monstersDefeated || 0;
    timeLeft = savedGameData.timeLeft || 45;
    feedback('💾 Save loaded.', true);
    renderAll();
    showScreen('game');
    if(!state.enemy) {
      spawnEnemy();
    } else {
      updateEnemyUI();
      nextProblem();
    }
  } else {
    feedback('No save found.', false);
  }
}

function doGameOver(){
  play(sfxGameOver);
  stopTimer();
  gameOverModal.classList.remove('hidden');
  $('finalStats').textContent = `Reached Level ${currentLevel} – Score ${state.score}`;
}

function resetToNew(){
  state = JSON.parse(JSON.stringify(defaultState));
  currentLevel = 1;
  monstersDefeated = 0;
  isCritActive = false;
  timeLeft = 45;
  renderAll();
  gameOverModal.classList.add('hidden');
  levelCompleteModal.classList.add('hidden');
  gameCompleteModal.classList.add('hidden');
  showScreen('story');
}

function renderAll(){
  renderHearts();
  renderHUD();
  renderInventory();
  if(state.enemy) {
    updateEnemyUI();
  }
}

/* -------------------------
   Story typewriter
   ------------------------- */
function typeStory(text, cb){
  const container = $('storyText');
  container.innerHTML = '';
  let i=0;
  clearInterval(typingInterval);
  
  typingInterval = setInterval(()=>{
    if(i >= text.length){ 
      clearInterval(typingInterval); 
      sfxType.pause(); 
      if(cb) cb(); 
      return; 
    }
    
    const ch = text[i++];
    container.innerHTML += (ch === '\n' ? '<br/>' : ch);
    
    if(i % 3 === 0) {
      try{ sfxType.currentTime = 0; sfxType.play(); }catch(e){}
    }
  }, 28);
}

/* -------------------------
   Screen management
   ------------------------- */
function showScreen(name){
  Object.keys(screens).forEach(k => screens[k].classList.add('hidden'));
  screens[name].classList.remove('hidden');
  overlay.classList.add('hidden'); 
  gameOverModal.classList.add('hidden');
  isPaused = false;
}

function startPlay(){
  try{ 
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Autoplay prevented:", error);
      });
    }
  } catch {}
  
  renderAll();
  if(!state.enemy) spawnEnemy(); 
  feedback(`Level ${currentLevel} started! Defeat enemies for items!`, true);
}

/* -------------------------
   Event bindings
   ------------------------- */
window.addEventListener('load', ()=>{
  // Initialize volumes
  updateVolumes();
  
  // Button event listeners
  $('btn-start').onclick = ()=> showScreen('story');
  $('btn-begin').onclick = ()=> { showScreen('game'); startPlay(); };
  $('btn-load').onclick = ()=> { loadGame(); };
  $('btn-credits').onclick = ()=> showScreen('credits');
  document.querySelectorAll('.btn-back').forEach(b => b.onclick = ()=> showScreen('menu'));

  $('btn-save').onclick = ()=> saveGame();
  $('btn-mainmenu').onclick = ()=> { 
    if(confirm('Return to Main Menu? Progress will be saved.')) { 
      saveGame(); 
      showScreen('menu'); 
      stopTimer(); 
    } 
  };
  
  $('saveBtn').onclick = ()=> saveGame();
  $('resumeBtn').onclick = ()=> { closeOverlay(); };
  $('toMenuBtn').onclick = ()=> { 
    saveGame(); 
    showScreen('menu'); 
    overlay.classList.add('hidden'); 
    stopTimer();
  };
  $('restartBtn').onclick = ()=> { resetToNew(); };
  $('loadBtn').onclick = ()=> { loadGame(); gameOverModal.classList.add('hidden'); };
  $('menuBtn').onclick = ()=> { showScreen('menu'); gameOverModal.classList.add('hidden'); };

  // Level progression buttons
  $('nextLevelBtn').onclick = ()=> nextLevel();
  $('restartGameBtn').onclick = ()=> resetToNew();
  $('mainMenuCompleteBtn').onclick = ()=> { showScreen('menu'); gameCompleteModal.classList.add('hidden'); };

  $('pauseBtn').onclick = ()=> { 
    if(!isPaused) {
      openOverlay('Paused'); 
    } else {
      closeOverlay(); 
    }
  };

  $('attackBtn').onclick = ()=> submitAnswer();
  $('answerInput').addEventListener('keydown', (e)=> { 
    if(e.key === 'Enter') submitAnswer(); 
  });

  // Volume controls
  $('musicSlider').addEventListener('input', (e) => {
    musicVolume = e.target.value / 100;
    updateVolumes();
  });

  $('sfxSlider').addEventListener('input', (e) => {
    sfxVolume = e.target.value / 100;
    updateVolumes();
  });

  $('musicToggle').onclick = ()=> {
    if(bgMusic.paused){ 
      play(bgMusic); 
      $('musicToggle').textContent = '🔊 Music'; 
    } else { 
      bgMusic.pause(); 
      $('musicToggle').textContent = '🔇 Music'; 
    }
  };

  // Story text
  const storyText = `THE MATH QUEST\n\nA kingdom in peril needs a hero...\n\nLevel 1: Calculus & Algebra Basics\nMaster derivatives, limits, and exponentials!\n\nLevel 2: Intermediate Math\nConquer integrals, matrices, and eigenvalues!\n\nLevel 3: Advanced Mathematics\nFace integration by parts, Taylor series, and more!\n\nDefeat enemies to collect items:\n❤️ Healing Potion - Restore 1 heart\n⏱️ Time Boost - Add 30 seconds\n💥 Critical Strike - Double damage!\n\nGood luck, Math Hero!`;
  typeStory(storyText);

  // Initial render
  renderAll();
});