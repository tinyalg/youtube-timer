// popup.js

// 画面が開かれたら実行

// バックグラウンドに接続して「開いてるよ」と伝える
chrome.runtime.connect({ name: "popup" });
document.addEventListener('DOMContentLoaded', async () => {
  localize(); // 言語セット

  const table = document.getElementById('historyTable');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // ストレージから全データを取得し、履歴データだけを抽出する
  const allData = await chrome.storage.local.get(null);
  const history = {};
  
  for (const key in allData) {
    // "history_" で始まるキーだけを拾う
    if (key.startsWith("history_")) {
      const dateStr = key.replace("history_", ""); // "2026-02-22" に戻す
      history[dateStr] = allData[key];
    }
  }

  // ★変更：日付文字列の降順でソート（処理が速くシンプルになります）
  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  // テーブルに追加していく
  dates.forEach(dateKey => {
    const seconds = history[dateKey];
    const timeStr = formatTime(seconds);
    
    let displayDate = dateKey;

    // キー(YYYY-MM-DD)の場合のみ分解して整形する
    // (古いデータ形式や予期せぬ形式の場合はそのまま表示してエラーを防ぐ)
    if (dateKey.includes('-')) {
        const parts = dateKey.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
    const localDate = new Date(y, m - 1, d);
            displayDate = localDate.toLocaleDateString();
        }
    }

    const row = document.createElement('tr');
    
    // 今日の判定
    if (dateKey === getTodayKey()) {
      row.classList.add('today');
    }

    // innerHTMLを使わず、安全な方法でセルを追加する
    // (Firefoxの審査警告 "Unsafe assignment to innerHTML" 対策)
    const dateCell = document.createElement('td');
    dateCell.textContent = displayDate; 
    
    const timeCell = document.createElement('td');
    timeCell.textContent = timeStr;
    
    row.appendChild(dateCell);
    row.appendChild(timeCell);
    table.appendChild(row);
  });

  // CSVダウンロード処理
  downloadBtn.addEventListener('click', () => {
    // ここでは画面表示と同じフォーマットにします。
    let csvContent = "Date,Seconds,Formatted\n";
    dates.forEach(dateKey => {
      let displayDate = dateKey;
      // CSVでも画面と同じ日付形式にする
      if (dateKey.includes('-')) {
          const parts = dateKey.split('-');
          if (parts.length === 3) {
              const [y, m, d] = parts;
      const localDate = new Date(y, m - 1, d);
              displayDate = localDate.toLocaleDateString();
          }
      }
      
      csvContent += `${displayDate},${history[dateKey]},${formatTime(history[dateKey])}\n`;
    });

    // 2. ファイルとしてダウンロードさせる（BOM付きで文字化け防止）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); 
    const blob = new Blob([bom, csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube_history.csv"; // ファイル名
    a.click();
    
    URL.revokeObjectURL(url);
  });
});

function localize() {
  document.getElementById('historyTitle').textContent = chrome.i18n.getMessage("historyTitle");
  document.getElementById('downloadBtn').textContent = chrome.i18n.getMessage("downloadCsv");
  
  // リンクのテキストとURLの両方をセットする
  const aboutLink = document.getElementById('aboutApp');
  aboutLink.textContent = chrome.i18n.getMessage("aboutApp");
  aboutLink.href = chrome.i18n.getMessage("appUrl");
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// background.jsと同じ日付キー生成関数
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
