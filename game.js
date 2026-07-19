"use strict";

const MAX_HP = 100;
const Q_PER_STAGE = 10;
const SAVE_KEY = "tangoQuestSaveV1";
const APP_URL = "https://yadonn-code.github.io/tango-quest/";

const STAGES = [
  { name: "はじまりの草原", icon: "🌱", theme: "grass",  intro: "冒険のはじまり。まずは肩ならしだ。" },
  { name: "まちがいの森",   icon: "🌲", theme: "forest", intro: "道に迷いそうな深い森。Jの気配がする……" },
  { name: "忘却の洞窟",     icon: "🦇", theme: "cave",   intro: "暗くて足元が見えない。覚えた単語まで忘れそうだ。" },
  { name: "吹雪の雪山",     icon: "🏔️", theme: "snow",   intro: "極寒の山。戸塚の拳がうなりを上げている。" },
  { name: "最終決戦・魔王城", icon: "🏰", theme: "castle", intro: "ここを越えれば単語マスター。全力で駆け抜けろ！" },
];

const DIFFS = {
  easy:   { key: "easy",   name: "イージー", jDmg: 10, tDmg: 20, saves: [1, 2, 3, 4, 5] },
  normal: { key: "normal", name: "ノーマル", jDmg: 15, tDmg: 35, saves: [1, 3, 5] },
  hard:   { key: "hard",   name: "ハード",   jDmg: 30, tDmg: 60, saves: [1], timeLimit: 10 },
};

const FACE_J = `<svg viewBox="0 0 100 100" role="img" aria-label="J">
  <circle cx="50" cy="58" r="33" fill="#f2c9a0"/>
  <path d="M18 44 a32 24 0 0 1 64 0 z" fill="#2563eb"/>
  <rect x="13" y="42" width="74" height="9" rx="4.5" fill="#1e40af"/>
  <text x="50" y="38" font-size="17" fill="#fff" text-anchor="middle" font-weight="bold" font-family="sans-serif">J</text>
  <rect x="27" y="56" width="19" height="10" rx="3" fill="#111"/>
  <rect x="54" y="56" width="19" height="10" rx="3" fill="#111"/>
  <rect x="46" y="59" width="8" height="3" fill="#111"/>
  <path d="M38 78 q12 8 24 -2" stroke="#7c2d12" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;

const FACE_TOTSUKA = `<svg viewBox="0 0 100 100" role="img" aria-label="戸塚">
  <circle cx="50" cy="60" r="33" fill="#e8b48c"/>
  <path d="M17 62 q-3 -18 8 -27 l7 9 z" fill="#e5e7eb"/>
  <path d="M83 62 q3 -18 -8 -27 l-7 9 z" fill="#e5e7eb"/>
  <path d="M15 42 q35 -28 70 0 l-3 6 H18 z" fill="#f8fafc"/>
  <rect x="15" y="46" width="70" height="9" rx="4" fill="#0f172a"/>
  <text x="50" y="41" font-size="13" text-anchor="middle">⚓</text>
  <path d="M26 58 l18 7" stroke="#4b5563" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 58 l-18 7" stroke="#4b5563" stroke-width="5" stroke-linecap="round"/>
  <circle cx="37" cy="71" r="8" fill="none" stroke="#111" stroke-width="2.5"/>
  <circle cx="63" cy="71" r="8" fill="none" stroke="#111" stroke-width="2.5"/>
  <line x1="45" y1="71" x2="55" y2="71" stroke="#111" stroke-width="2.5"/>
  <circle cx="37" cy="71" r="2.5" fill="#111"/>
  <circle cx="63" cy="71" r="2.5" fill="#111"/>
  <path d="M38 85 q12 -7 24 0 q-12 10 -24 0 z" fill="#7f1d1d"/>
  <path d="M79 28 l6 -8 M86 31 l8 -6 M84 20 l4 -8" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// 自作イラストなど、権利上問題のない画像に差し替えたい場合はファイル名を指定する
// 例: const CUSTOM_FACES = { j: null, totsuka: "totsuka.png" };
const CUSTOM_FACES = { j: null, totsuka: null };

const ATTACKERS = {
  j: {
    key: "j", name: "J", face: FACE_J, role: "",
    hitLines: [
      "Jの体罰！ビンタが飛んだ！",
      "Jのジャブが刺さる！",
      "J「単語くらい覚えろよ」",
      "Jの往復ビンタ！！",
      "J「甘えるな！！」",
      "J「その程度で日本男児か！」",
      "J「校長、こいつです」",
      "J「この思想は後世に残すべき」",
      "Jのボディーブロー！内臓に響く！",
    ],
  },
  totsuka: {
    key: "totsuka", name: "戸塚", face: FACE_TOTSUKA, role: "戸塚ヨットスクール 校長",
    hitLines: [
      "戸塚の鉄拳制裁！！",
      "戸塚「体罰は教育だ！！」",
      "戸塚「理性は悪なんよ」",
      "戸塚「ヨットで性根を叩き直せ！」",
      "戸塚「体罰は善！！」",
      "戸塚「これは暴力じゃない。お前のための体罰だ」",
      "戸塚「脳幹を鍛えろ！！」",
      "戸塚「ワシは間違っとらん」",
      "戸塚「日本男児よ、こう生きろ！」",
      "戸塚「甘やかされて育ったな？」",
      "戸塚「うちで更生したヤツは大勢おるわけじゃん」",
    ],
  },
};

function faceHTML(atk) {
  const img = CUSTOM_FACES[atk.key];
  return img ? `<img class="face-img" src="${img}" alt="${atk.name}">` : atk.face;
}

const $ = (id) => document.getElementById(id);

// ---------- シェア（スマホは共有シート、PCはクリップボードコピー） ----------
async function shareOrCopy(text, btn) {
  const full = `${text}\n${APP_URL}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: full });
      return;
    } catch (e) {
      if (e.name === "AbortError") return; // ユーザーがキャンセルしただけ
    }
  }
  try {
    await navigator.clipboard.writeText(full);
    const old = btn.textContent;
    btn.textContent = "✅ コピーした！貼り付けて共有してね";
    setTimeout(() => { btn.textContent = old; }, 2000);
  } catch (e) {
    window.prompt("この内容をコピーして共有してね", full);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let state = null;

// ---------- サウンド（WebAudio） ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
}
function beep(freq, dur, type, vol, delay) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + (delay || 0);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol || 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}
const sfx = {
  correct() { beep(880, 0.1, "square", 0.07); beep(1318, 0.18, "square", 0.07, 0.09); },
  punchJ()  { beep(160, 0.18, "sawtooth", 0.2); beep(90, 0.22, "square", 0.2, 0.03); },
  punchT()  { beep(70, 0.35, "sawtooth", 0.3); beep(50, 0.4, "square", 0.3, 0.08); beep(40, 0.5, "sawtooth", 0.25, 0.16); },
  dead()    { [392, 330, 262, 196, 131].forEach((f, i) => beep(f, 0.25, "triangle", 0.15, i * 0.22)); },
  save()    { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.15, "triangle", 0.1, i * 0.1)); },
  clear()   { [523, 659, 784].forEach((f, i) => beep(f, 0.12, "square", 0.1, i * 0.1)); },
};

// ---------- 画面切り替え ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  $("hud").classList.toggle("hidden", id !== "screen-quiz");
}
function setTheme(cls) {
  document.body.className = cls;
}

// ---------- セーブデータ ----------
function readSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d && DIFFS[d.diffKey] && d.saveStage >= 1 && d.saveStage <= STAGES.length) return d;
  } catch (e) { /* 壊れたセーブは無視 */ }
  return null;
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ diffKey: state.diff.key, saveStage: state.saveStage })); } catch (e) {}
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

// ---------- タイトル ----------
function initTitle() {
  setTheme("theme-title");
  const save = readSave();
  const btn = $("btn-continue");
  if (save) {
    btn.classList.remove("hidden");
    btn.textContent = `つづきから（${DIFFS[save.diffKey].name}・ステージ${save.saveStage} 🚩）`;
  } else {
    btn.classList.add("hidden");
  }
  showScreen("screen-title");
}

// ---------- ゲーム開始 ----------
function startGame(diffKey, startStageNo) {
  state = {
    diff: DIFFS[diffKey],
    stage: startStageNo,
    saveStage: startStageNo,
    hp: MAX_HP,
    used: new Set(),
    qs: [],
    qi: 0,
    stageCorrect: 0,
    stats: { correct: 0, wrong: 0, jHits: 0, tHits: 0, deaths: 0 },
  };
  writeSave();
  $("dmg-j").textContent = `-${state.diff.jDmg}`;
  $("dmg-t").textContent = `-${state.diff.tDmg}`;
  goMap(startStageNo > 1 ? "🚩 セーブポイントから再開！" : "さあ、単語の冒険に出発だ！");
}

// ---------- マップ ----------
function goMap(msg) {
  setTheme("theme-map");
  renderMap();
  const st = STAGES[state.stage - 1];
  $("map-msg").innerHTML = (msg ? msg + "<br>" : "") + st.intro;
  $("btn-start-stage").textContent = `${st.icon} ステージ${state.stage}「${st.name}」へ`;
  showScreen("screen-map");
}
function renderMap() {
  $("map-title").textContent = `冒険マップ（${state.diff.name}）`;
  const path = $("map-path");
  path.innerHTML = "";
  STAGES.forEach((s, i) => {
    const n = i + 1;
    const node = document.createElement("div");
    node.className = "map-node" + (n < state.stage ? " cleared" : n === state.stage ? " current" : " locked");
    node.innerHTML =
      `<div class="node-icon">${s.icon}</div>` +
      `<div class="node-no">STAGE ${n}</div>` +
      `<div class="node-name">${s.name}</div>` +
      `<div class="node-mark">${state.diff.saves.includes(n) ? "🚩" : ""}${n < state.stage ? "✅" : ""}${n === state.stage ? "🚶" : ""}</div>`;
    path.appendChild(node);
    if (n < STAGES.length) {
      const arrow = document.createElement("div");
      arrow.className = "map-arrow";
      arrow.textContent = "▶";
      path.appendChild(arrow);
    }
  });
}

// ---------- ステージ・出題 ----------
function startStage() {
  const st = STAGES[state.stage - 1];
  setTheme("theme-" + st.theme);
  state.qs = makeQuestions();
  state.qi = 0;
  state.stageCorrect = 0;
  showScreen("screen-quiz");
  updateHud();
  showQuestion();
}
function makeQuestions() {
  let pool = WORDS.filter((w) => !state.used.has(w.en));
  if (pool.length < Q_PER_STAGE) {
    state.used.clear();
    pool = [...WORDS];
  }
  const picked = shuffle(pool).slice(0, Q_PER_STAGE);
  picked.forEach((w) => state.used.add(w.en));
  return picked.map((w) => {
    // 意味（ja）が同じ単語が複数あるため、選択肢の文字列が重複しないように選ぶ
    const wrongs = [];
    for (const x of shuffle(WORDS)) {
      if (x.ja !== w.ja && !wrongs.includes(x.ja)) wrongs.push(x.ja);
      if (wrongs.length === 3) break;
    }
    return { en: w.en, ja: w.ja, choices: shuffle([w.ja, ...wrongs]) };
  });
}
function updateHud() {
  const st = STAGES[state.stage - 1];
  $("hud-stage").textContent = `${st.icon} STAGE ${state.stage} ${st.name}`;
  $("hud-diff").textContent = state.diff.name;
  $("hud-q").textContent = `Q ${Math.min(state.qi + 1, Q_PER_STAGE)}/${Q_PER_STAGE}`;
  const pct = (state.hp / MAX_HP) * 100;
  const fill = $("hp-fill");
  fill.style.width = pct + "%";
  fill.className = pct > 50 ? "" : pct > 25 ? "mid" : "low";
  $("hp-text").textContent = `HP ${state.hp}/${MAX_HP}`;
}
function showQuestion() {
  const q = state.qs[state.qi];
  $("hud-q").textContent = `Q ${state.qi + 1}/${Q_PER_STAGE}`;
  $("question-word").textContent = q.en;
  $("feedback").innerHTML = "&nbsp;";
  const box = $("choices");
  box.innerHTML = "";
  q.choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = c;
    b.onclick = () => onAnswer(b, c);
    box.appendChild(b);
  });
  startTimer();
}

// ---------- 制限時間（ハードのみ） ----------
let qTimerId = null;
let qDeadline = 0;

function startTimer() {
  stopTimer();
  const limit = state.diff.timeLimit;
  const wrap = $("timer-wrap");
  if (!limit) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  qDeadline = Date.now() + limit * 1000;
  updateTimer(limit);
  qTimerId = setInterval(() => {
    const remain = (qDeadline - Date.now()) / 1000;
    if (remain <= 0) {
      stopTimer();
      updateTimer(0);
      onTimeout();
    } else {
      updateTimer(remain);
    }
  }, 100);
}
function updateTimer(remain) {
  const limit = state.diff.timeLimit;
  const fill = $("timer-fill");
  fill.style.width = Math.max(0, (remain / limit) * 100) + "%";
  fill.classList.toggle("hurry", remain <= 3);
  $("timer-text").textContent = `⏰ ${remain.toFixed(1)}`;
}
function stopTimer() {
  if (qTimerId) {
    clearInterval(qTimerId);
    qTimerId = null;
  }
}
function onTimeout() {
  const q = state.qs[state.qi];
  document.querySelectorAll(".choice").forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.ja) b.classList.add("is-correct");
  });
  state.stats.wrong++;
  $("feedback").textContent = `⏰ 時間切れ！ 正解は「${q.ja}」`;
  setTimeout(doPunch, 550);
}

function onAnswer(btn, choice) {
  ensureAudio();
  stopTimer();
  const q = state.qs[state.qi];
  document.querySelectorAll(".choice").forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.ja) b.classList.add("is-correct");
  });
  if (choice === q.ja) {
    state.stats.correct++;
    state.stageCorrect++;
    sfx.correct();
    $("feedback").textContent = "⭕ せいかい！";
    setTimeout(nextQuestion, 700);
  } else {
    state.stats.wrong++;
    btn.classList.add("is-wrong");
    $("feedback").textContent = `❌ 正解は「${q.ja}」`;
    setTimeout(doPunch, 550);
  }
}
function nextQuestion() {
  state.qi++;
  if (state.qi >= Q_PER_STAGE) stageClear();
  else showQuestion();
}

// ---------- パンチ演出 ----------
function doPunch() {
  const isJ = Math.random() < 0.65;
  const atk = isJ ? ATTACKERS.j : ATTACKERS.totsuka;
  const dmg = isJ ? state.diff.jDmg : state.diff.tDmg;
  if (isJ) state.stats.jHits++;
  else state.stats.tHits++;

  const ov = $("punch-overlay");
  $("punch-face").innerHTML = faceHTML(atk);
  $("punch-role").textContent = atk.role;
  $("punch-name").textContent = atk.hitLines[Math.floor(Math.random() * atk.hitLines.length)];
  const dmgEl = $("punch-dmg");
  dmgEl.textContent = "";
  ov.classList.toggle("totsuka", !isJ);
  ov.classList.remove("hidden");

  const fist = $("punch-fist");
  fist.classList.remove("go", "out");
  void fist.offsetWidth;
  fist.classList.add("go");
  if (isJ) sfx.punchJ();
  else sfx.punchT();

  setTimeout(() => {
    fist.classList.add("out"); // 着弾後はこぶしを消してセリフを見えるようにする
    state.hp = Math.max(0, state.hp - dmg);
    updateHud();
    dmgEl.textContent = `-${dmg}`;
    dmgEl.classList.remove("pop");
    void dmgEl.offsetWidth;
    dmgEl.classList.add("pop");
    const cls = isJ ? "shake" : "shake-hard";
    document.body.classList.remove("shake", "shake-hard");
    void document.body.offsetWidth;
    document.body.classList.add(cls);
    triggerFlash();
  }, 320);

  setTimeout(() => {
    ov.classList.add("hidden");
    document.body.classList.remove("shake", "shake-hard");
    if (state.hp <= 0) onDead(atk);
    else nextQuestion();
  }, 2000);
}
function triggerFlash() {
  const f = $("flash");
  f.classList.remove("hit");
  void f.offsetWidth;
  f.classList.add("hit");
}

// ---------- 死亡・リスポーン ----------
function onDead(atk) {
  state.stats.deaths++;
  sfx.dead();
  setTheme("theme-dead");
  $("dead-face").innerHTML = faceHTML(atk);
  $("dead-msg").innerHTML = `${atk.name}の一撃で意識が飛んだ……<br>気がつくとセーブポイントにいた。`;
  $("btn-respawn").textContent = `🚩 ステージ${state.saveStage}からやり直す`;
  showScreen("screen-dead");
}
function respawn() {
  state.hp = MAX_HP;
  state.stage = state.saveStage;
  goMap("🚩 セーブポイントに戻された……もう一度挑戦だ！");
}

// ---------- ステージクリア・エンディング ----------
function stageClear() {
  const clearedStage = state.stage;
  if (clearedStage >= STAGES.length) {
    ending();
    return;
  }
  sfx.clear();
  const next = clearedStage + 1;
  let msg;
  if (state.diff.saves.includes(next)) {
    state.saveStage = next;
    state.hp = MAX_HP;
    writeSave();
    sfx.save();
    msg = "🚩 セーブポイントに到達！ HPが全回復した！";
  } else {
    state.hp = Math.min(MAX_HP, state.hp + 20);
    msg = "HPが20回復した。次のセーブポイントはまだ先だ……";
  }
  state.stage = next;
  $("clear-title").textContent = `STAGE ${clearedStage} クリア！`;
  $("clear-detail").innerHTML = `${state.stageCorrect}/${Q_PER_STAGE} 問正解！<br>${msg}`;
  setTheme("theme-map");
  showScreen("screen-clear");
}
function ending() {
  clearSave();
  sfx.save();
  setTheme("theme-ending");
  const s = state.stats;
  const total = s.correct + s.wrong;
  const acc = total ? Math.round((s.correct / total) * 100) : 0;
  let title;
  if (s.deaths === 0 && s.wrong === 0) title = "👑 伝説の単語マスター（無傷の帰還）";
  else if (s.deaths === 0) title = "🏆 単語マスター";
  else if (s.tHits >= 5) title = "🥊 戸塚のサンドバッグ";
  else if (acc >= 80) title = "⚔️ 歴戦の冒険者";
  else title = "🩹 ボロボロの生還者";
  state.result = { title, acc };
  $("ending-title-badge").textContent = `称号：${title}`;
  $("ending-stats").innerHTML =
    `正解率：${acc}%（${s.correct}/${total}問）<br>` +
    `Jから受けた体罰：${s.jHits}回<br>` +
    `戸塚から受けた体罰：${s.tHits}回<br>` +
    `💀 死亡回数：${s.deaths}回`;
  showScreen("screen-ending");
}

// ---------- イベント登録 ----------
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-face]").forEach((el) => {
    el.innerHTML = faceHTML(ATTACKERS[el.dataset.face]);
  });
  $("btn-new").onclick = () => { ensureAudio(); showScreen("screen-diff"); };
  $("btn-continue").onclick = () => {
    ensureAudio();
    const s = readSave();
    if (s) startGame(s.diffKey, s.saveStage);
  };
  document.querySelectorAll(".diff-btn").forEach((b) => {
    b.onclick = () => { ensureAudio(); startGame(b.dataset.diff, 1); };
  });
  $("btn-start-stage").onclick = () => startStage();
  $("btn-clear-next").onclick = () => goMap("");
  $("btn-respawn").onclick = () => respawn();
  $("btn-ending-title").onclick = () => initTitle();
  $("btn-share").onclick = (e) =>
    shareOrCopy(
      "英単語RPG『Jと戸塚からの体罰を避けろ ～理性は悪なんよ～』\nまちがえるとJと戸塚の体罰が飛んでくる英単語クイズ！",
      e.currentTarget
    );
  $("btn-share-ending").onclick = (e) => {
    const s = state.stats;
    const r = state.result || { title: "", acc: 0 };
    shareOrCopy(
      `『Jと戸塚からの体罰を避けろ』全ステージ制覇！\n称号：${r.title}\n正解率${r.acc}%・体罰${s.jHits + s.tHits}回・死亡${s.deaths}回`,
      e.currentTarget
    );
  };
  initTitle();
});
