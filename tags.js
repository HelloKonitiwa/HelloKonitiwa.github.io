let selectedTag = "all";
let currentVisibleCount = 18;
const ITEMS_PER_PAGE = 18;


async function loadData() {

  const years = getYears();
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

  window.diaryData = allDiary;

  window.diaryData.sort((a, b) => new Date(b.date) - new Date(a.date));

  renderTags();
  renderCards();
}

loadData();

function renderTags() {
  const tagList = document.getElementById("tagList");
  tagList.innerHTML = "";

  const allTags = new Set();

  window.diaryData.forEach(entry => {
    if (entry.tags) {
      entry.tags.forEach(tag => {
        tag.split("，").forEach(t => allTags.add(t.trim()));
      });
    }
  });

  const tagArray = ["all", ...Array.from(allTags)];

  tagArray.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag-filter";
    btn.textContent = tag === "all" ? "#all" : `#${tag}`;

    if (tag === selectedTag) btn.classList.add("active");

    btn.addEventListener("click", () => {
      selectedTag = tag;
      currentVisibleCount = ITEMS_PER_PAGE; // ← リセット
      renderTags();
      renderCards();
    });

    tagList.appendChild(btn);
  });
}

function renderCards() {
  const grid = document.getElementById("cardGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  grid.innerHTML = "";

  let filtered = window.diaryData;

  if (selectedTag !== "all") {
    filtered = window.diaryData.filter(entry =>
      entry.tags &&
      entry.tags.some(tag =>
        tag.includes(selectedTag)
      )
    );
  }

  const visibleItems = filtered.slice(0, currentVisibleCount);

  visibleItems.forEach(entry => {
    const card = document.createElement("div");
    card.className = "card";

    let imageUrl = "assets/noimage/noimage.jpg";

    // header優先
    if (entry.header) {
      imageUrl = entry.header;
    } else {
      //本文内の最初の画像
      const imageMatch = entry.content.match(/<img.*?src="(.*?)"/);
      if (imageMatch) {
        imageUrl = imageMatch[1];
      }
    }

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = entry.title;
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    //----------------------
    //タイトルとラベル
    //----------------------
    const title = document.createElement("h3");
    title.className = "card-title";

    // タイトル文字
    const titleText = document.createElement("span");
    titleText.className = "card-title-text";
    titleText.textContent = entry.title;

    // ラベル
    const label = document.createElement("span");
    label.className = "card-type-label";

    if (entry.type === "article") {
      label.classList.add("article-label");
      label.textContent = "ARTICLE";
    } else {
      label.classList.add("diary-label");
      label.textContent = "DIARY";
    }

    title.appendChild(titleText);
    title.appendChild(label);
    body.appendChild(title);

    const date = document.createElement("p");
    date.className = "card-date";
    date.textContent = entry.date.replaceAll("-", ".");
    body.appendChild(date);

    card.appendChild(body);

    card.addEventListener("click", () => {
      location.href = `index.html?date=${entry.date}`;
    });

    grid.appendChild(card);
  });

  // ▼ もっと見るボタン制御
  if (currentVisibleCount >= filtered.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "inline-block";
  }
}

// ▼ もっと見るボタン動作
document.getElementById("loadMoreBtn").addEventListener("click", () => {
  currentVisibleCount += ITEMS_PER_PAGE;
  renderCards();
});

loadData();