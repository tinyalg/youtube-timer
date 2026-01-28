const defaultUrls = [
  "youtube.com",
  "netflix.com/watch",
  "netflix.com/browse",
  "amazon.co.jp/gp/video",
  "primevideo.com"
];

document.addEventListener('DOMContentLoaded', () => {
  localize(); // ★言語に合わせて文字をセット
  loadUrls();
});

document.getElementById('addBtn').addEventListener('click', addUrl);

document.getElementById('resetBtn').addEventListener('click', () => {
  // 辞書から確認メッセージを取得
  const msg = chrome.i18n.getMessage("resetConfirm");
  if (confirm(msg)) {
    saveUrls(defaultUrls);
  }
});

// ★国際化対応: 辞書ファイルから文字を読み込んで画面にセットする関数
function localize() {
  document.getElementById('settingsTitle').textContent = chrome.i18n.getMessage("settingsTitle");
  document.getElementById('addBtn').textContent = chrome.i18n.getMessage("addBtn");
  document.getElementById('resetBtn').textContent = chrome.i18n.getMessage("resetBtn");
  document.getElementById('noteAutoSave').textContent = chrome.i18n.getMessage("noteAutoSave");
  document.getElementById('newUrl').placeholder = chrome.i18n.getMessage("placeholderUrl");
}

async function loadUrls() {
  const data = await chrome.storage.local.get("targetUrls");
  const urls = data.targetUrls || defaultUrls;
  renderList(urls);
}

function renderList(urls) {
  const list = document.getElementById('urlList');
  list.innerHTML = "";

  urls.forEach((url, index) => {
    const li = document.createElement('li');
    
    const text = document.createElement('span');
    text.textContent = url;
    
    const btn = document.createElement('button');
    btn.textContent = chrome.i18n.getMessage("deleteBtn"); // ★ここも辞書から
    btn.className = "delete-btn";
    btn.onclick = () => removeUrl(index);

    li.appendChild(text);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

async function addUrl() {
  const input = document.getElementById('newUrl');
  const url = input.value.trim();
  
  if (!url) return;

  const data = await chrome.storage.local.get("targetUrls");
  const urls = data.targetUrls || defaultUrls;
  
  if (!urls.includes(url)) {
    urls.push(url);
    await saveUrls(urls);
    input.value = "";
  } else {
    alert(chrome.i18n.getMessage("errorDuplicate")); // ★アラートも辞書から
  }
}

async function removeUrl(index) {
  const data = await chrome.storage.local.get("targetUrls");
  const urls = data.targetUrls || defaultUrls;
  urls.splice(index, 1);
  await saveUrls(urls);
}

async function saveUrls(urls) {
  await chrome.storage.local.set({ targetUrls: urls });
  renderList(urls);
}
