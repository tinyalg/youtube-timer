// popup.js

// 画面が開かれたら実行

// バックグラウンドに接続して「開いてるよ」と伝える
chrome.runtime.connect({ name: "popup" });
document.addEventListener('DOMContentLoaded', async () => {
  const table = document.getElementById('historyTable');
  const downloadBtn = document.getElementById('downloadBtn');
  
  // ストレージから履歴を取得
  const data = await chrome.storage.local.get("history");
  const history = data.history || {};

  // 日付のリストを取得して、新しい順に並べ替え
  const dates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));

  // テーブルに追加していく
  dates.forEach(date => {
    const seconds = history[date];
    const timeStr = formatTime(seconds);

    const row = document.createElement('tr');
    
    // 今日の日付なら色を変えるクラスをつける
    if (date === new Date().toLocaleDateString()) {
      row.classList.add('today');
    }

    // ★変更: innerHTMLを使わず、安全な方法でセルを追加する
    // (Firefoxの審査警告 "Unsafe assignment to innerHTML" 対策)
    const dateCell = document.createElement('td');
    dateCell.textContent = date;
    
    const timeCell = document.createElement('td');
    timeCell.textContent = timeStr;
    
    row.appendChild(dateCell);
    row.appendChild(timeCell);
    table.appendChild(row);
  });

  // CSVダウンロード処理
  downloadBtn.addEventListener('click', () => {
    // 1. CSVの中身を作る
    let csvContent = "日付,秒数,時間表示\n"; // 1行目は見出し
    
    dates.forEach(date => {
      const seconds = history[date];
      const timeStr = formatTime(seconds);
      // Excelで文字化けしないように少し工夫が必要ですが、まずはシンプルに
      csvContent += `${date},${seconds},${timeStr}\n`;
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

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}