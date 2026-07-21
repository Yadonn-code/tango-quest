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
  { name: "最終決戦・魔王城", icon: "🏰", theme: "castle", intro: "中ボスJと魔王・戸塚が待ち構える最終決戦。正解が武器だ。単語で殴り返せ！" },
];

const DIFFS = {
  easy:   { key: "easy",   name: "イージー",     jDmg: 10, tDmg: 20, saves: [1, 2, 3, 4, 5] },
  normal: { key: "normal", name: "ノーマル",     jDmg: 15, tDmg: 35, saves: [1, 3, 5] },
  // ハードは敵の攻撃力が高いだけでなく、主人公の攻撃力も抑えめにして「打たれ弱いのに火力も出ない」難易度にする
  hard:   { key: "hard",   name: "ハード",       jDmg: 30, tDmg: 60, saves: [1], timeLimit: 10, hardWordsRatio: 0.6, playerDmgMult: 0.65 },
  // ハードクリアで解放される最高難易度。セーブポイントなし・時間制限も短縮・激ムズ単語がほぼ全問・裏ボス「覚醒J」「菩薩戸塚」が控える
  expert: { key: "expert", name: "エキスパート", jDmg: 40, tDmg: 80, saves: [], timeLimit: 6, hardWordsRatio: 0.9, playerDmgMult: 0.5, bossOrder: ["j", "totsuka", "jAwaken", "totsukaBosatsu"] },
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

// エキスパート限定の裏ボス（覚醒J・菩薩戸塚）の顔。既存デザインをベースに、覚醒のオーラ／菩薩の後光を追加
const FACE_J_AWAKEN = `<svg viewBox="0 0 100 100" role="img" aria-label="覚醒J">
  <circle cx="50" cy="52" r="46" fill="none" stroke="#fbbf24" stroke-width="3" opacity="0.85"/>
  <circle cx="50" cy="52" r="40" fill="none" stroke="#f97316" stroke-width="2" opacity="0.6"/>
  <path d="M10 20 l6 10 M90 20 l-6 10 M50 2 l0 12" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  <circle cx="50" cy="58" r="33" fill="#f2c9a0"/>
  <path d="M18 44 a32 24 0 0 1 64 0 z" fill="#1d4ed8"/>
  <rect x="13" y="42" width="74" height="9" rx="4.5" fill="#facc15"/>
  <text x="50" y="38" font-size="17" fill="#111" text-anchor="middle" font-weight="bold" font-family="sans-serif">J</text>
  <rect x="27" y="56" width="19" height="10" rx="3" fill="#fde047"/>
  <rect x="54" y="56" width="19" height="10" rx="3" fill="#fde047"/>
  <rect x="46" y="59" width="8" height="3" fill="#111"/>
  <path d="M38 74 q12 12 24 -2" stroke="#7c2d12" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`;

const FACE_TOTSUKA_BOSATSU = `<svg viewBox="0 0 100 100" role="img" aria-label="菩薩戸塚">
  <circle cx="50" cy="30" r="30" fill="none" stroke="#fde68a" stroke-width="4" opacity="0.9"/>
  <circle cx="50" cy="60" r="33" fill="#f6d2ae"/>
  <path d="M17 62 q-3 -18 8 -27 l7 9 z" fill="#fff7ed"/>
  <path d="M83 62 q3 -18 -8 -27 l-7 9 z" fill="#fff7ed"/>
  <path d="M15 42 q35 -28 70 0 l-3 6 H18 z" fill="#fef3c7"/>
  <rect x="15" y="46" width="70" height="9" rx="4" fill="#a16207"/>
  <text x="50" y="41" font-size="13" text-anchor="middle">☸️</text>
  <path d="M26 58 l18 7" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 58 l-18 7" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <circle cx="37" cy="71" r="8" fill="none" stroke="#78350f" stroke-width="2.5"/>
  <circle cx="63" cy="71" r="8" fill="none" stroke="#78350f" stroke-width="2.5"/>
  <line x1="45" y1="71" x2="55" y2="71" stroke="#78350f" stroke-width="2.5"/>
  <circle cx="37" cy="71" r="2.5" fill="#78350f"/>
  <circle cx="63" cy="71" r="2.5" fill="#78350f"/>
  <path d="M38 83 q12 6 24 0 q-12 8 -24 0 z" fill="#fde68a"/>
</svg>`;

// 自作イラストなど、権利上問題のない画像に差し替えたい場合はファイル名を指定する
// 例: const CUSTOM_FACES = { j: null, totsuka: "totsuka.png" };
const CUSTOM_FACES = { j: null, totsuka: null, jAwaken: null, totsukaBosatsu: null };

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
      "J「シス単、何周した？」",
      "J「それ中学で習ったろ」",
      "Jのローキックが炸裂！",
      "J「戸塚校長を呼ぶぞ」",
      "J「お前の脳幹に直接教えてやる」",
      "J「泣いてもいいが、手は止めんぞ」",
      "Jのチョップ！背筋が伸びる！",
      "J「俺は悲しいよ……（パンチ）」",
      "J「合宿、1週間追加な」",
    ],
    // HPが残りわずかのときの追い打ちセリフ
    lowLines: [
      "J「おいおい、もうフラフラか？」",
      "J「ここでやめたら合宿行きだぞ」",
      "J「立て。単語はまだ残っとるぞ」",
      "J「限界？　それは脳幹に聞け」",
    ],
    // 時間切れ（ハード）専用セリフ
    timeoutLines: [
      "J「考えとる時間が長いんよ！」",
      "J「10秒あったろ！！」",
      "J「迷った時点で不正解なんだわ」",
    ],
    // 正解したときに悔しがるセリフ（たまに出る）
    tauntLines: [
      "J「ちっ、覚えとったか」",
      "J「……悪くない」",
      "J「その調子だ。だが次は殴る」",
      "J「まぐれで喜ぶな」",
    ],
    // 死亡画面のセリフ
    deadLines: [
      "J「……寝たか。まあ、よう頑張ったわ」",
      "J「セーブポイントで反省しとけ」",
      "J「目が覚めたら単語帳の続きからな」",
    ],
    // ボス戦（中ボス）
    bossTitle: "中ボス",
    bossHp: 50,
    bossIntro: "J「ここから先は魔王・戸塚の間。まず俺を倒してから行け」",
    bossHalf: "J「へえ……ちょっとは鍛えたな？」",
    bossHitLines: ["J「ぐっ……！」", "J「そのくらい効かん！」", "J「いい一撃だ……！」"],
    bossDefeat: "J「くっ……単語力で負けるとは……あとは任せた、校長ォ！！」",
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
      "戸塚「褒める教育が人間をダメにするんよ」",
      "戸塚「お前の脳幹、完全に寝とるわ」",
      "戸塚「恐怖は進歩の原動力なんよ」",
      "戸塚「ワシは50年間、正しいことしかしとらん」",
      "戸塚「その根性、ヨットで直るわ」",
      "戸塚「合宿の準備をしとけ」",
      "戸塚「親御さんには連絡済みだわ」",
      "戸塚「単語も覚えられんのは脳幹が弱いからよ」",
      "戸塚「ええ体罰と悪い体罰があってな、これはええ体罰」",
      "戸塚「口で言うてわかるなら、とっくにわかっとるわな」",
      "戸塚のアンカー投げ！⚓",
      "戸塚「泳げ。話はそれからだわ」",
    ],
    lowLines: [
      "戸塚「フラフラになってからが教育よ」",
      "戸塚「limit？　そんな単語は教えとらん」",
      "戸塚「気絶は甘え」",
      "戸塚「ここで折れるようなら海に出すわ」",
    ],
    timeoutLines: [
      "戸塚「迷っとる暇があったら答えんかい！」",
      "戸塚「即断即決！それが脳幹よ！」",
      "戸塚「海の上では10秒が命取りなんよ」",
    ],
    tauntLines: [
      "戸塚「ふん、まぐれだわ」",
      "戸塚「脳幹が目覚めてきたか？」",
      "戸塚「正解ごときで喜ぶな」",
      "戸塚「……ええ答えだわ」",
    ],
    deadLines: [
      "戸塚「気絶も教育の一部なんよ」",
      "戸塚「目が覚めたらまた鍛えたるわ」",
      "戸塚「ワシは謝罪せんぞ。教育だからな」",
    ],
    // ボス戦（ラスボス）
    bossTitle: "魔王",
    bossHp: 100,
    bossIntro: "魔王・戸塚「ようここまで来たわ。じゃがのう、わしの脳幹は日本一よ」",
    bossHalf: "戸塚「……ほう。その脳幹、鍛わっとるわ」",
    bossHitLines: ["戸塚「ぬうっ！？」", "戸塚「効いとらん！効いとらんわ！」", "戸塚「小癪な単語力よ……！」"],
    bossDefeat: "戸塚「わしの負けだわ……お前の脳幹、日本一よ」",
  },
  // エキスパート限定の裏ボス①：魔王・戸塚が敗れた激情で覚醒したJ
  jAwaken: {
    key: "jAwaken", name: "覚醒J", face: FACE_J_AWAKEN, role: "戸塚ヨットスクール 覚醒教官",
    hitLines: [
      "覚醒J「校長の分まで、シバいたる……！」",
      "覚醒J「これが本気の往復ビンタじゃあ！！」",
      "覚醒J「脳幹、まだ寝とるんか!!」",
      "覚醒J「もう加減はせん……！」",
      "覚醒J「校長の教えは俺が継ぐ……！」",
      "覚醒Jの覚醒ボディーブロー！！",
      "覚醒J「これが……覚醒の力じゃあ!!」",
      "覚醒J「泣いても手加減はないぞ!!」",
    ],
    lowLines: [
      "覚醒J「まだ立てるやろ、なぁ!?」",
      "覚醒J「校長が見とるぞ、根性見せんかい!!」",
    ],
    timeoutLines: [
      "覚醒J「迷っとる暇なんぞ、あると思うなよ!!」",
      "覚醒J「10秒すら惜しいんじゃ!!」",
    ],
    tauntLines: [
      "覚醒J「……ちっ、やるやんけ」",
      "覚醒J「悪ないな……だが、まだじゃ!!」",
    ],
    deadLines: [
      "覚醒J「ここまでか……だが、菩薩様はまだ先じゃ」",
      "覚醒J「セーブポイントで頭冷やしとけ」",
    ],
    bossTitle: "真の中ボス",
    bossHp: 70,
    bossIntro: "覚醒J「校長がやられて黙っとられるか……！　オレの中の獣、解放するぞォォ！！」",
    bossHalf: "覚醒J「くっ……この俺に、ここまでとは……！」",
    bossHitLines: ["覚醒J「ぐあっ……！」", "覚醒J「まだまだぁ!!」", "覚醒J「効いとらんぞ……！」"],
    bossDefeat: "覚醒J「がはっ……さすが……だが、その先に菩薩様が待っとるぞ……」",
  },
  // エキスパート限定の裏ボス②：真の最終ボス。悟りを開いた戸塚
  totsukaBosatsu: {
    key: "totsukaBosatsu", name: "菩薩戸塚", face: FACE_TOTSUKA_BOSATSU, role: "戸塚ヨットスクール 菩薩",
    hitLines: [
      "菩薩戸塚「怒りすら、教育に変えるんよ……」",
      "菩薩戸塚「悟った今のワシに、痛みなど概念でしかないわ」",
      "菩薩戸塚「これが慈悲の鉄拳よ……」",
      "菩薩戸塚「脳幹どころか、魂から鍛え直したるわ」",
      "菩薩戸塚「体罰を超えた……これは救済じゃ」",
      "菩薩戸塚のありがたき往復ビンタ！！",
      "菩薩戸塚「怒らぬ。ただ、殴るのみ」",
      "菩薩戸塚「涅槃の境地から言うが、まだ甘いわ」",
    ],
    lowLines: [
      "菩薩戸塚「そのフラフラも、悟りへの一歩よ」",
      "菩薩戸塚「限界の先にこそ、脳幹の真理があるわ」",
    ],
    timeoutLines: [
      "菩薩戸塚「迷いは煩悩、即答こそ悟りよ」",
      "菩薩戸塚「10秒すら惜しい、それが修行なんよ」",
    ],
    tauntLines: [
      "菩薩戸塚「ほう……悟りに近づいたか」",
      "菩薩戸塚「その正解、功徳として認めたる」",
    ],
    deadLines: [
      "菩薩戸塚「気絶もまた、悟りへの通過点なんよ」",
      "菩薩戸塚「目覚めたら、また一から鍛え直したる」",
    ],
    bossTitle: "真の裏ボス",
    bossHp: 130,
    bossIntro: "菩薩戸塚「ようここまで来たわ……じゃがワシは、もう魔王ではない。悟りを開いた菩薩戸塚じゃ」",
    bossHalf: "菩薩戸塚「ほう……その脳幹、悟りに片足突っ込んどるな」",
    bossHitLines: ["菩薩戸塚「ぬぐっ……！」", "菩薩戸塚「まだ悟りには早いようじゃな……！」", "菩薩戸塚「小癪な……功徳よ……！」"],
    bossDefeat: "菩薩戸塚「わしの負けだわ……お前の脳幹、もはや解脱しとるわ……」",
  },
};

// ボス戦の出現順（通常は中ボスJ → 魔王・戸塚。エキスパートは DIFFS.expert.bossOrder で上書きされる）
const BOSS_ORDER = ["j", "totsuka"];
// プレイヤーの攻撃名（正解時にランダムで表示）
const PLAYER_ATTACKS = ["📖 単語の一撃！", "📖 ボキャブラリーアタック！", "✏️ シス単スラッシュ！"];
const CRIT_ATTACK = "💥 会心の一撃！！";

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
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let state = null;

// ---------- サウンド（WebAudio） ----------
let audioCtx = null;
// iPhoneはマナーモード中WebAudioが消音されるため、無音の<audio>をループ再生して
// 「メディア再生」扱いに切り替える（マナーモードでもBGM・効果音が鳴るようになる）
let silentAudio = null;
function unlockMobileAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  if (silentAudio) return;
  try {
    const a = new Audio("data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA==");
    a.loop = true;
    const p = a.play();
    if (p && p.then) p.then(() => { silentAudio = a; }).catch(() => {});
    else silentAudio = a;
  } catch (e) { /* 未対応環境では何もしない */ }
}
function ensureAudio() {
  unlockMobileAudio();
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
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
  heal()    { [659, 880, 1047].forEach((f, i) => beep(f, 0.12, "triangle", 0.1, i * 0.08)); },
  attack()  { beep(220, 0.12, "sawtooth", 0.18); beep(330, 0.15, "square", 0.15, 0.06); },
  crit()    { beep(220, 0.1, "sawtooth", 0.22); beep(440, 0.12, "square", 0.2, 0.06); beep(880, 0.25, "square", 0.18, 0.13); },
  bossDown() { [784, 659, 523, 392].forEach((f, i) => beep(f, 0.18, "triangle", 0.15, i * 0.15)); [523, 659, 784, 1047, 1318].forEach((f, i) => beep(f, 0.14, "square", 0.12, 0.7 + i * 0.1)); },
};

// ---------- BGM（WebAudioで生成するチップチューン。音声ファイル不要） ----------
const BGM_MUTE_KEY = "tangoQuestBgmOff";
const midiHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
// 8分音符×32ステップ（4小節）のループ。0は休符、数字はMIDIノート番号
const BGM_TRACKS = {
  // フィールド曲（C調・明るい冒険風）
  field: {
    tempo: 118,
    bass: [
      48, 0, 55, 0, 48, 0, 55, 0,   45, 0, 52, 0, 45, 0, 52, 0,
      41, 0, 48, 0, 41, 0, 48, 0,   43, 0, 50, 0, 43, 0, 50, 0,
    ],
    mel: [
      64, 67, 72, 67, 64, 67, 74, 72,   72, 76, 69, 76, 72, 69, 71, 72,
      69, 72, 65, 72, 69, 65, 67, 69,   67, 71, 74, 71, 67, 74, 71, 67,
    ],
  },
  // ボス戦曲（A短調・速くて不穏）
  boss: {
    tempo: 150,
    bass: [
      45, 45, 45, 44, 45, 45, 48, 47,   45, 45, 45, 44, 45, 45, 48, 50,
      41, 41, 41, 40, 41, 41, 44, 43,   40, 40, 40, 40, 43, 43, 44, 44,
    ],
    mel: [
      0, 0, 69, 0, 0, 68, 69, 0,   0, 0, 72, 0, 0, 71, 72, 0,
      0, 0, 77, 0, 0, 76, 77, 0,   76, 0, 75, 0, 76, 0, 79, 0,
    ],
  },
  // エンディング曲（C調・ファンファーレ風）
  ending: {
    tempo: 128,
    bass: [
      48, 0, 55, 0, 48, 0, 55, 0,   48, 0, 55, 0, 48, 0, 55, 0,
      41, 0, 48, 0, 41, 0, 48, 0,   43, 0, 50, 0, 43, 0, 50, 0,
    ],
    mel: [
      72, 0, 72, 0, 72, 0, 76, 0,   79, 0, 76, 0, 79, 0, 84, 0,
      81, 79, 77, 79, 81, 0, 79, 0,   76, 74, 72, 74, 76, 0, 79, 0,
    ],
  },
};
const bgm = {
  name: null, timer: null, gain: null, step: 0, nextT: 0,
  get muted() {
    try { return localStorage.getItem(BGM_MUTE_KEY) === "1"; } catch (e) { return false; }
  },
  set muted(v) {
    try { v ? localStorage.setItem(BGM_MUTE_KEY, "1") : localStorage.removeItem(BGM_MUTE_KEY); } catch (e) {}
  },
  play(name) {
    if (this.name === name && this.timer) return; // 同じ曲は流しっぱなし
    this.stopSound();
    this.name = name; // ミュート中も曲名は覚えておき、解除時に再開できるようにする
    if (this.muted) return;
    ensureAudio();
    if (!audioCtx) return;
    this.gain = audioCtx.createGain();
    this.gain.gain.value = 1;
    this.gain.connect(audioCtx.destination);
    this.step = 0;
    this.nextT = audioCtx.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 90);
  },
  tick() {
    const tr = BGM_TRACKS[this.name];
    if (!tr || !this.gain) return;
    const stepDur = 60 / tr.tempo / 2;
    while (this.nextT < audioCtx.currentTime + 0.3) {
      const i = this.step % tr.bass.length;
      if (tr.bass[i]) this.note(midiHz(tr.bass[i]), this.nextT, stepDur * 0.95, "triangle", 0.055);
      if (tr.mel[i]) this.note(midiHz(tr.mel[i]), this.nextT, stepDur * 0.9, "square", 0.03);
      this.step++;
      this.nextT += stepDur;
    }
  },
  note(freq, t, dur, type, vol) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.gain);
    o.start(t);
    o.stop(t + dur);
  },
  stopSound() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.gain) { this.gain.disconnect(); this.gain = null; }
  },
  stop() { this.stopSound(); this.name = null; },
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSound();
    else if (this.name) { const n = this.name; this.name = null; this.play(n); }
    syncBgmButtons();
  },
};
function syncBgmButtons() {
  $("btn-bgm").textContent = bgm.muted ? "🔇 BGM：OFF" : "🔊 BGM：ON";
  $("hud-bgm").textContent = bgm.muted ? "🔇" : "🔊";
}

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

// ---------- エキスパート解放（ハードクリアで解放） ----------
const HARD_CLEAR_KEY = "tangoQuestHardClearedV1";
function isExpertUnlocked() {
  try { return localStorage.getItem(HARD_CLEAR_KEY) === "1"; } catch (e) { return false; }
}
function unlockExpertIfEarned() {
  if (state.diff.key === "hard" || state.diff.key === "expert") {
    try { localStorage.setItem(HARD_CLEAR_KEY, "1"); } catch (e) {}
  }
}
function renderDiffScreen() {
  const btn = document.querySelector('.diff-btn[data-diff="expert"]');
  if (!btn) return;
  const unlocked = isExpertUnlocked();
  btn.disabled = !unlocked;
  btn.classList.toggle("locked", !unlocked);
  const hint = btn.querySelector(".lock-hint");
  if (hint) hint.classList.toggle("hidden", unlocked);
}

// ---------- タイトル ----------
function initTitle() {
  setTheme("theme-title");
  bgm.stop();
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
  const diff = DIFFS[diffKey];
  state = {
    diff,
    bossOrder: diff.bossOrder || BOSS_ORDER,
    stage: startStageNo,
    saveStage: startStageNo,
    hp: MAX_HP,
    used: new Set(),
    usedHard: new Set(),
    qs: [],
    qi: 0,
    stageCorrect: 0,
    combo: 0,
    items: 1,
    boss: null,
    stats: { correct: 0, wrong: 0, jHits: 0, tHits: 0, deaths: 0, maxCombo: 0 },
  };
  writeSave();
  $("dmg-j").textContent = `-${state.diff.jDmg}`;
  $("dmg-t").textContent = `-${state.diff.tDmg}`;
  goMap(startStageNo > 1 ? "🚩 セーブポイントから再開！" : "さあ、単語の冒険に出発だ！");
}

// ---------- マップ ----------
function goMap(msg) {
  setTheme("theme-map");
  bgm.play("field");
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
  bgm.play(state.stage === STAGES.length ? "boss" : "field");
  state.qs = makeQuestions();
  state.qi = 0;
  state.stageCorrect = 0;
  state.boss = null;
  showScreen("screen-quiz");
  if (state.stage === STAGES.length) {
    startBossBattle(0);
    return;
  }
  $("boss-wrap").classList.add("hidden");
  $("enemies").classList.remove("hidden");
  updateHud();
  showQuestion();
}

// ---------- ボス戦（最終ステージ） ----------
function startBossBattle(idx, msg) {
  const atk = ATTACKERS[state.bossOrder[idx]];
  state.boss = { idx, atk, hp: atk.bossHp, max: atk.bossHp, halfShown: false };
  $("enemies").classList.add("hidden");
  $("boss-wrap").classList.remove("hidden");
  updateBossUI();
  updateHud();
  showCutscene(atk, atk.bossIntro, 2400, () => {
    showQuestion();
    if (msg) $("feedback").innerHTML = msg;
  });
}
function updateBossUI() {
  const b = state.boss;
  $("boss-face").innerHTML = faceHTML(b.atk);
  $("boss-name").textContent = `${b.atk.bossTitle}・${b.atk.name}`;
  $("boss-fill").style.width = (b.hp / b.max) * 100 + "%";
  $("boss-hp-text").textContent = `${b.hp}/${b.max}`;
}
// 演出オーバーレイ上部の「だれの行動か」バナー
function setAttackerBanner(cls, text) {
  const el = $("punch-attacker");
  el.className = cls;
  el.textContent = text;
}
// パンチ演出のオーバーレイを流用したカットシーン（こぶしなし・セリフのみ）
function showCutscene(atk, line, ms, cb) {
  const ov = $("punch-overlay");
  setAttackerBanner(atk.key === "totsuka" ? "atk-t" : "atk-j", `⚔️ ${atk.bossTitle}・${atk.name} 出現！！`);
  $("punch-face").innerHTML = faceHTML(atk);
  $("punch-role").textContent = atk.role;
  $("punch-name").textContent = line;
  $("punch-dmg").textContent = "";
  $("punch-fist").classList.remove("go", "out");
  ov.classList.toggle("totsuka", atk.key === "totsuka");
  ov.classList.remove("player");
  ov.classList.remove("hidden");
  setTimeout(() => {
    ov.classList.add("hidden");
    if (cb) cb();
  }, ms);
}
// 指定プールから使用済みを避けて n 個選ぶ。プールを使い切ったらそのプールだけ使用済みをリセット
function pickFromPool(list, usedSet, n) {
  let avail = list.filter((w) => !usedSet.has(w.en));
  if (avail.length < n) {
    usedSet.clear();
    avail = [...list];
  }
  const picked = shuffle(avail).slice(0, n);
  picked.forEach((w) => usedSet.add(w.en));
  return picked;
}
function makeQuestions() {
  const ratio = state.diff.hardWordsRatio || 0;
  let picked;
  if (ratio > 0) {
    // ハード／エキスパートは HARD_WORDS（激ムズ語彙）を難易度に応じた比率で混ぜる
    const hardCount = Math.min(HARD_WORDS.length, Math.round(Q_PER_STAGE * ratio));
    const normalCount = Q_PER_STAGE - hardCount;
    picked = shuffle([
      ...pickFromPool(HARD_WORDS, state.usedHard, hardCount),
      ...pickFromPool(WORDS, state.used, normalCount),
    ]);
  } else {
    picked = pickFromPool(WORDS, state.used, Q_PER_STAGE);
  }
  const wrongPool = ratio > 0 ? WORDS.concat(HARD_WORDS) : WORDS;
  return picked.map((w) => {
    // 意味（ja）が同じ単語が複数あるため、選択肢の文字列が重複しないように選ぶ
    const wrongs = [];
    for (const x of shuffle(wrongPool)) {
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
  $("hud-q").textContent = state.boss ? "⚔️ BOSS戦" : `Q ${Math.min(state.qi + 1, Q_PER_STAGE)}/${Q_PER_STAGE}`;
  const pct = (state.hp / MAX_HP) * 100;
  const fill = $("hp-fill");
  fill.style.width = pct + "%";
  fill.className = pct > 50 ? "" : pct > 25 ? "mid" : "low";
  $("hp-text").textContent = `HP ${state.hp}/${MAX_HP}`;
  const cb = $("hud-combo");
  if (state.combo >= 2) {
    cb.classList.remove("hidden");
    cb.textContent = `🔥${state.combo}コンボ`;
    cb.classList.remove("pop");
    void cb.offsetWidth;
    cb.classList.add("pop");
  } else {
    cb.classList.add("hidden");
  }
  const ib = $("btn-item");
  ib.textContent = `🍙×${state.items}`;
  ib.disabled = state.items <= 0 || state.hp >= MAX_HP;
}
function showQuestion() {
  const q = state.qs[state.qi];
  $("hud-q").textContent = state.boss ? "⚔️ BOSS戦" : `Q ${state.qi + 1}/${Q_PER_STAGE}`;
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
  const hadCombo = state.combo >= 3;
  state.combo = 0;
  updateHud();
  $("feedback").innerHTML = `⏰ 時間切れ！ 正解は「${q.ja}」` + (hadCombo ? "<br>（コンボが途切れた！）" : "");
  setTimeout(() => doPunch("timeout"), 550);
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
    state.combo++;
    state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
    sfx.correct();
    let fb = state.combo >= 2 ? `⭕ せいかい！ 🔥${state.combo}コンボ！` : "⭕ せいかい！";
    if (state.combo % 5 === 0 && state.hp < MAX_HP) {
      // 5コンボごとに気合いで少し回復
      state.hp = Math.min(MAX_HP, state.hp + 10);
      sfx.heal();
      fb += `<br><span class="fb-heal">🔥 気合いでHPが10回復！</span>`;
    } else if (!state.boss && Math.random() < 0.25) {
      // たまに敵が悔しがる
      const atk = Math.random() < 0.5 ? ATTACKERS.j : ATTACKERS.totsuka;
      fb += `<br><span class="fb-taunt">${pick(atk.tauntLines)}</span>`;
    }
    $("feedback").innerHTML = fb;
    updateHud();
    if (state.boss) setTimeout(playerAttack, 600);
    else setTimeout(nextQuestion, 900);
  } else {
    state.stats.wrong++;
    const hadCombo = state.combo >= 3;
    state.combo = 0;
    updateHud();
    btn.classList.add("is-wrong");
    $("feedback").innerHTML = `❌ 正解は「${q.ja}」` + (hadCombo ? "<br>（コンボが途切れた！）" : "");
    setTimeout(() => doPunch(), 550);
  }
}
function nextQuestion() {
  state.qi++;
  if (state.boss) {
    // ボス戦は敵を倒すまでエンドレス出題
    if (state.qi >= state.qs.length) {
      state.qs = makeQuestions();
      state.qi = 0;
    }
    showQuestion();
    return;
  }
  if (state.qi >= Q_PER_STAGE) stageClear();
  else showQuestion();
}

// ---------- プレイヤーの攻撃（ボス戦・正解時） ----------
function playerAttack() {
  const b = state.boss;
  const atk = b.atk;
  let dmg = 10 + 2 * Math.min(state.combo, 5);
  const crit = state.combo >= 5;
  if (crit) dmg = Math.round(dmg * 1.5);
  // ハード／エキスパートは主人公の攻撃力も抑えめにして、被弾しやすいだけでなく削り切りにくい難易度にする
  dmg = Math.max(1, Math.round(dmg * (state.diff.playerDmgMult || 1)));
  b.hp = Math.max(0, b.hp - dmg);

  const ov = $("punch-overlay");
  setAttackerBanner("atk-you", "🗡️ あなたのこうげき！");
  $("punch-face").innerHTML = faceHTML(atk);
  $("punch-role").textContent = `${atk.bossTitle}・${atk.name}`;
  $("punch-name").textContent = crit ? CRIT_ATTACK : pick(PLAYER_ATTACKS);
  const dmgEl = $("punch-dmg");
  dmgEl.textContent = "";
  ov.classList.remove("totsuka");
  ov.classList.add("player");
  ov.classList.remove("hidden");

  const fist = $("punch-fist");
  fist.textContent = "📖";
  fist.classList.remove("go", "out");
  void fist.offsetWidth;
  fist.classList.add("go");
  if (crit) sfx.crit();
  else sfx.attack();

  setTimeout(() => {
    fist.classList.add("out");
    updateBossUI();
    dmgEl.textContent = `-${dmg}`;
    dmgEl.classList.remove("pop");
    void dmgEl.offsetWidth;
    dmgEl.classList.add("pop");
    let line;
    if (b.hp <= 0) line = atk.bossDefeat;
    else if (!b.halfShown && b.hp <= b.max / 2) {
      b.halfShown = true;
      line = atk.bossHalf;
    } else {
      line = pick(atk.bossHitLines);
    }
    $("punch-name").textContent = line;
  }, 320);

  setTimeout(() => {
    ov.classList.add("hidden");
    ov.classList.remove("player");
    fist.textContent = "👊";
    if (b.hp <= 0) bossDefeated();
    else nextQuestion();
  }, 2000);
}
function bossDefeated() {
  sfx.bossDown();
  const beaten = state.boss.atk;
  const nextIdx = state.boss.idx + 1;
  if (nextIdx < state.bossOrder.length) {
    state.hp = Math.min(MAX_HP, state.hp + 30);
    startBossBattle(nextIdx, `⚔️ ${beaten.name}を倒した！気合いでHPが30回復！`);
  } else {
    state.boss = null;
    stageClear();
  }
}

// ---------- パンチ演出 ----------
function doPunch(reason) {
  // ボス戦中は今戦っているボス（覚醒J・菩薩戸塚も含む）が殴ってくる。通常はランダム
  const atk = state.boss ? state.boss.atk : (Math.random() < 0.65 ? ATTACKERS.j : ATTACKERS.totsuka);
  const isJ = atk.key === "j" || atk.key === "jAwaken";
  const dmg = isJ ? state.diff.jDmg : state.diff.tDmg;
  if (isJ) state.stats.jHits++;
  else state.stats.tHits++;

  // 状況に合わせてセリフを出し分ける
  const hpAfter = Math.max(0, state.hp - dmg);
  let line;
  if (reason === "timeout") line = pick(atk.timeoutLines);
  else if (hpAfter > 0 && hpAfter <= 30 && Math.random() < 0.5) line = pick(atk.lowLines);
  else line = pick(atk.hitLines);

  const ov = $("punch-overlay");
  setAttackerBanner(isJ ? "atk-j" : "atk-t", `${isJ ? "😎" : "👹"} ${atk.name}のこうげき！`);
  $("punch-face").innerHTML = faceHTML(atk);
  $("punch-role").textContent = state.boss ? `${atk.bossTitle}・${atk.name}` : atk.role;
  $("punch-name").textContent = line;
  const dmgEl = $("punch-dmg");
  dmgEl.textContent = "";
  ov.classList.toggle("totsuka", !isJ);
  ov.classList.remove("player");
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
  bgm.stop();
  sfx.dead();
  setTheme("theme-dead");
  $("dead-face").innerHTML = faceHTML(atk);
  $("dead-msg").innerHTML =
    `${atk.name}の一撃で意識が飛んだ……<br>` +
    `<span class="dead-line">${pick(atk.deadLines)}</span><br>` +
    `気がつくとセーブポイントにいた。`;
  $("btn-respawn").textContent = `🚩 ステージ${state.saveStage}からやり直す`;
  showScreen("screen-dead");
}
function respawn() {
  state.hp = MAX_HP;
  state.combo = 0;
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
  if (state.items < 3) {
    state.items++;
    msg += "<br>🍙 おにぎりを拾った！（クイズ中に使うとHP+30）";
  }
  state.stage = next;
  $("clear-title").textContent = `STAGE ${clearedStage} クリア！`;
  $("clear-detail").innerHTML = `${state.stageCorrect}/${Q_PER_STAGE} 問正解！<br>${msg}`;
  setTheme("theme-map");
  showScreen("screen-clear");
}
function ending() {
  clearSave();
  unlockExpertIfEarned();
  bgm.play("ending");
  sfx.save();
  setTheme("theme-ending");
  const s = state.stats;
  const total = s.correct + s.wrong;
  const acc = total ? Math.round((s.correct / total) * 100) : 0;
  let title;
  if (state.diff.key === "expert") title = "🌌 真の単語神（覚醒J・菩薩戸塚を撃破）";
  else if (s.deaths === 0 && s.wrong === 0) title = "👑 伝説の単語マスター（無傷の帰還）";
  else if (s.deaths === 0) title = "🏆 単語マスター";
  else if (s.tHits >= 5) title = "🥊 戸塚のサンドバッグ";
  else if (s.maxCombo >= 12) title = "🔥 コンボの鬼";
  else if (acc >= 80) title = "⚔️ 歴戦の冒険者";
  else title = "🩹 ボロボロの生還者";
  state.result = { title, acc };
  $("ending-title-badge").textContent = `称号：${title}`;
  $("ending-stats").innerHTML =
    `正解率：${acc}%（${s.correct}/${total}問）<br>` +
    `🔥 最大コンボ：${s.maxCombo}<br>` +
    `Jから受けた体罰：${s.jHits}回<br>` +
    `戸塚から受けた体罰：${s.tHits}回<br>` +
    `💀 死亡回数：${s.deaths}回`;
  showScreen("screen-ending");
}

// ---------- イベント登録 ----------
window.addEventListener("DOMContentLoaded", () => {
  // 最初のタップ/クリックで音声を有効化（スマホの自動再生制限対策）
  window.addEventListener("pointerdown", ensureAudio, { once: true });
  document.querySelectorAll("[data-face]").forEach((el) => {
    el.innerHTML = faceHTML(ATTACKERS[el.dataset.face]);
  });
  $("btn-new").onclick = () => { ensureAudio(); renderDiffScreen(); showScreen("screen-diff"); };
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
  $("btn-item").onclick = () => {
    if (!state || state.items <= 0 || state.hp >= MAX_HP) return;
    state.items--;
    state.hp = Math.min(MAX_HP, state.hp + 30);
    sfx.heal();
    updateHud();
    const pop = $("heal-pop");
    pop.textContent = "🍙 +30";
    pop.classList.remove("go");
    void pop.offsetWidth;
    pop.classList.add("go");
  };
  $("btn-ending-title").onclick = () => initTitle();
  $("btn-bgm").onclick = () => { ensureAudio(); bgm.toggleMute(); };
  $("hud-bgm").onclick = () => { ensureAudio(); bgm.toggleMute(); };
  syncBgmButtons();
  renderDiffScreen();
  $("btn-share").onclick = (e) =>
    shareOrCopy(
      "英単語RPG『Jと戸塚からの体罰を避けろ ～理性は悪なんよ～』\nまちがえるとJと戸塚の体罰が飛んでくる英単語クイズ！",
      e.currentTarget
    );
  $("btn-share-ending").onclick = (e) => {
    const s = state.stats;
    const r = state.result || { title: "", acc: 0 };
    shareOrCopy(
      `『Jと戸塚からの体罰を避けろ』魔王・戸塚を討伐！\n称号：${r.title}\n正解率${r.acc}%・最大${s.maxCombo}コンボ・体罰${s.jHits + s.tHits}回・死亡${s.deaths}回`,
      e.currentTarget
    );
  };
  initTitle();
});
