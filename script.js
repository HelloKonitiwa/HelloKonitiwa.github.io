// -----------------------------
// Mobile redirect
// -----------------------------

const calendar = document.getElementById("calendar");

let diaryData = [];
let moodData = [];
let currentIndex = 0;

// -----------------------------
// 読み込む年を定義
// -----------------------------
const START_YEAR = 2026; // ← あなたの開始年
const CURRENT_YEAR = new Date().getFullYear();

function getYears() {
  const years = [];
  for (let y = START_YEAR; y <= CURRENT_YEAR; y++) {
    years.push(y);
  }
  return years;
}

// -----------------------------
// JSON読み込み（年別対応）
// -----------------------------
async function loadData() {

  const years = getYears();

  // ---- diary読み込み ----
  let allDiary = [];

  for (const year of years) {
    try {
      const res = await fetch(`data/diary/${year}d.json`);
      if (!res.ok) continue;
      const data = await res.json();
      allDiary = allDiary.concat(data);
    } catch (e) {
      console.log(`${year}d.json not found`);
    }
  }

  diaryData = allDiary;

  // ---- mood読み込み ----
  let allMood = [];

  for (const year of years) {
    try {
      const res = await fetch(`data/mood/${year}m.json`);
      if (!res.ok) continue;
      const data = await res.json();
      allMood = allMood.concat(data);
    } catch (e) {
      console.log(`${year}m.json not found`);
    }
  }

  moodData = allMood;

  if (diaryData.length === 0) return;

  // 日付昇順（既存仕様維持）
  diaryData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // -----------------------------
  // URLパラメータ処理
  // -----------------------------
  const params = new URLSearchParams(window.location.search);
  const targetDate = params.get("date");

  if (targetDate) {
    const index = diaryData.findIndex(entry => entry.date === targetDate);
    currentIndex = index !== -1 ? index : diaryData.length - 1;
  } else {
    currentIndex = diaryData.length - 1;
  }

  renderEntry();
  drawCalendar();
}


// -----------------------------
// カレンダー描画
// -----------------------------
function drawCalendar() {

  calendar.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const daysInYear = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  const columns = 48;
  const rows = Math.ceil(daysInYear / columns); // N

  calendar.style.gridTemplateColumns = `repeat(${columns}, 9px)`;
  calendar.style.gridTemplateRows = `repeat(${rows}, 9px)`;

  for (let dayIndex = 0; dayIndex < daysInYear; dayIndex++) {

    const dot = document.createElement("div");
    dot.classList.add("dot");

    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + dayIndex);

    // ---- 日付による色分け（そのまま維持） ----
    if (currentDate < today) {
      dot.style.background = "#888";
    } else {
      dot.style.background = "#ddd";
    }

    // ---- グリッド位置計算 ----
    const row = Math.floor(dayIndex / columns);
    const col = dayIndex % columns;

    // ---- 最終行は気分描画しない ----
    if (row < rows - 1) {

      const moodEntry = moodData.find(m =>
        m.year === year &&
        (
          (m.month - 1) * 4 + (m.week - 1)
        ) === col
      );

      if (moodEntry) {

        const value = moodEntry.value; // 1〜N

        // value と一致する行なら黒にする
        if (row === (rows - 1 - value)) {
          dot.style.background = "#222";
        }
      }
    }

    calendar.appendChild(dot);
  }
}

if (calendar) {
  loadData();
}

/*--------------------
パスワード認証
---------------------*/
async function sha256(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function renderPrivateLock(entry) {
  const contentEl = document.getElementById("content");

  contentEl.innerHTML = `
    <div class="private-lock">
      <p>この記事は限定公開です。</p>
      <input type="password" id="privatePw" placeholder="パスワードを入力">
      <button id="unlockBtn">送信</button>
      <p id="privateError" style="color:red;"></p>
    </div>
  `;

  document.getElementById("unlockBtn").addEventListener("click", async () => {
    const input = document.getElementById("privatePw").value;

    // ここにハッシュ値を入れる
    const correctHash = "f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75";

    const inputHash = await sha256(input);

    if (inputHash === correctHash) {
      contentEl.innerHTML = entry.content;
      if(window.hljs) hljs.highlightAll();
    } else {
      document.getElementById("privateError").textContent =
        "パスワードが違います。";
    }
  });
}


// -----------------------------
// 日記表示
// -----------------------------
function renderEntry() {
  if (!document.getElementById("date")) return; //tags.htmlでは実行されない

  const entry = diaryData[currentIndex];

  //日付
  document.getElementById("date").textContent =
    entry.date.replaceAll("-", ".");
  
  // ----------------------------
// ヘッダー画像
// ----------------------------
const headerContainer = document.getElementById("entry-header");
// 中身をリセット
headerContainer.innerHTML = "";

if (entry.header) {
  const img = document.createElement("img");
  img.src = entry.header;
  img.alt = entry.title || "";
  img.classList.add("entry-header-img");
  headerContainer.appendChild(img);
  headerContainer.style.display = "block";
} else {
  headerContainer.style.display = "none";
}

  //----------------------------
  // タイトルとラベル
  //----------------------------
  const titleEl = document.getElementById("title");

  // クリア
  titleEl.innerHTML = "";

  // タイトル文字
  const titleText = document.createElement("span");
  titleText.classList.add("title-text");
  titleText.textContent = entry.title || "";

  // ラベル
  const label = document.createElement("span");
  label.classList.add("type-label");

  if (entry.type === "article") {
    label.classList.add("article-label");
    label.textContent = "ARTICLE";
  } else {
    label.classList.add("diary-label");
    label.textContent = "DIARY";
  }

  // 追加（タイトル → ラベル の順）
  titleEl.appendChild(titleText);
  titleEl.appendChild(label);

  //本文 + パスワード認証
  if (entry.private === true) {
    renderPrivateLock(entry);
  } else {
    document.getElementById("content").innerHTML = entry.content;
    hljs.highlightAll();
  }

  // メタ情報（タグ・シリーズ）
  const meta = document.getElementById("meta");
  meta.innerHTML = "";

  // タグ表示
  if (entry.tags && entry.tags.length > 0) {
    const tagWrapper = document.createElement("div");
    tagWrapper.className = "tag-wrapper";

    entry.tags.forEach(tag => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = `#${tag}`;
      tagWrapper.appendChild(tagEl);
    });

    meta.appendChild(tagWrapper);
  }

  // シリーズ表示
  //if (entry.series) {
  //  const seriesEl = document.createElement("div");
  //  seriesEl.className = "series";
  //  seriesEl.textContent = `シリーズ：${entry.series}`;
  //  meta.appendChild(seriesEl);
 // }
 
  updateButtons();
}

function updateButtons() { //tags.htmlに対する安全化
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (!prevBtn || !nextBtn) return;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === diaryData.length - 1;
}

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderEntry();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentIndex < diaryData.length - 1) {
      currentIndex++;
      renderEntry();
    }
  });
}


