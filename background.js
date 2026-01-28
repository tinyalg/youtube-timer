// background.js

// ▼▼▼ ここに監視したいURLの一部をリスト化します ▼▼▼
const DEFAULT_URLS = [
  "youtube.com",            // YouTube (全般)
  "netflix.com/watch",      // Netflix (再生画面)
  "netflix.com/browse",     // Netflix (動画一覧)
  "amazon.co.jp/gp/video",  // Amazon Prime Video (日本)
  "primevideo.com"          // Prime Video (専用サイト)
];
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// 現在の監視対象リスト（メモリ上で保持）
let targetUrls = [];

// 起動時にロード
loadSettings();

// 設定が変更されたら即座に反映（再起動不要）
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.targetUrls) {
    targetUrls = changes.targetUrls.newValue;
    // console.log("Target URLs updated:", targetUrls);
  }
});

async function loadSettings() {
  const data = await chrome.storage.local.get("targetUrls");
  // 保存データがなければデフォルトを使う
  if (data.targetUrls) {
    targetUrls = data.targetUrls;
  } else {
    targetUrls = DEFAULT_URLS;
    // 初回なので保存しておく
    await chrome.storage.local.set({ targetUrls: DEFAULT_URLS });
  }
}

// ---------------------------------------------------------
// 計測ロジック
// ---------------------------------------------------------

let isPopupOpen = false;        // ポップアップが開いているかを管理する変数
let lastCheckTime = Date.now(); // 前回のチェック時刻を記録しておく変数
let accumulatedMs = 0;          // 端数のミリ秒を貯めておく「貯金箱」

// ポップアップからの接続を監視
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    isPopupOpen = true; // 接続されたら「開いている」
    port.onDisconnect.addListener(() => {
      isPopupOpen = false; // 切断されたら「閉じた」
    });
  }
});

setInterval(async () => {
  const now = Date.now();
  const diffMs = now - lastCheckTime; 
  const diffSec = Math.round(diffMs / 1000); 
  
  lastCheckTime = now;

  // ★デバッグ用: 実際に何ミリ秒かかったかをログに出す
  // (拡張機能の管理画面 -> ビューを検証: background page の Consoleで見れます)
  if (diffMs > 1100 || diffMs < 900) {
    console.log(`Time drift detected: ${diffMs}ms (${diffSec}s)`);
  }

  // 1. スリープ対策: いきなり「60秒」以上経過していたら、それは計測ラグではなく「スリープ」とみなす
  // その場合は、強制的に1秒(1000ms)扱いにして、寝ていた時間をチャラにする
  const validDiffMs = (diffMs > 0 && diffMs < 60000) ? diffMs : 1000;

  // 2. 経過時間を「貯金箱」に入れる
  accumulatedMs += validDiffMs;

  // 3. 貯金箱に「1000ms（1秒）」以上たまっているか？
  if (accumulatedMs < 1000) {
    // まだ1秒に満たないので、何もしない（次のループで合算する）
    return;
  }

  // 4. たまっている分を「秒」に換算して取り出す
  const secondsToAdd = Math.floor(accumulatedMs / 1000);
  
  // 5. 使った分を貯金箱から引く（端数は残る！）
  accumulatedMs -= (secondsToAdd * 1000);

  try {
    const lastFocusedWindow = await chrome.windows.getLastFocused().catch(() => null);
    const isWindowFocused = lastFocusedWindow && lastFocusedWindow.focused;
    const focusedWindowId = lastFocusedWindow ? lastFocusedWindow.id : null;

    // 2. 開いている「全てのタブ」を取得してチェックする
    const tabs = await chrome.tabs.query({});
    let isWatching = false;

    for (const tab of tabs) {
      // 読み込んだ targetUrls を使う
      if (!tab.url || !targetUrls.some(url => tab.url.includes(url))) {
        continue;
      }

      // 条件A: 音が出ている (audibleがtrue)
      // → 裏で再生していてもここで「視聴中」と判定される
      if (tab.audible) {
        isWatching = true;
        break; // 1つでも見つかればOK
      }

      // 条件B: アクティブなタブで、かつウィンドウを見ている (フォーカスあり)
      // → 音が出ていなくても（字幕で見ていても）見ている状態
      if (tab.active && isWindowFocused && tab.windowId === focusedWindowId) {
        isWatching = true;
        break;
      }

      // 条件C: ポップアップを開いて履歴を見ている
      if (isPopupOpen && tab.active && tab.windowId === focusedWindowId) {
        isWatching = true;
        break;
      }
    }

    if (isWatching) {
        const todayStr = new Date().toLocaleDateString();
        
        // ストレージから履歴全体を取得
        const data = await chrome.storage.local.get("history");
        const history = data.history || {}; // なければ空のオブジェクト
        
        // 今日の分をカウントアップ (なければ0からスタート)
        const currentSeconds = (history[todayStr] || 0) + secondsToAdd;

      // 4. ストレージに保存（これが大事！）
        history[todayStr] = currentSeconds;
        await chrome.storage.local.set({ history: history });

      // 5. バッジ（アイコン上の数字）を更新
      updateBadge(currentSeconds);
    } else {
      // 見ていない時は、貯金箱を空にしてリセット
      accumulatedMs = 0; 
      
      // 非アクティブ時は薄いグレーにして目立たなくする
      chrome.action.setBadgeBackgroundColor({ color: "#CCCCCC" });
    }

  } catch (error) {
    // エラーが出ても止まらないように無視（あるいはコンソール出力）
    console.log(error);
  }
}, 1000);

function updateBadge(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remSeconds = seconds % 60;

  // 1. ツールチップ（マウスホバー時）
  // ★変更: 辞書ファイルからメッセージを取得してフォーマットする
  // (辞書に "tooltipText" がない場合は英語でフォールバック)
  let tooltipText = `Today: ${hours}h ${minutes}m ${remSeconds}s`;
  try {
    const msg = chrome.i18n.getMessage("tooltipText", [String(hours), String(minutes), String(remSeconds)]);
    if (msg) tooltipText = msg;
  } catch(e) {
    // 辞書読み込みエラー時は無視
  }
  
  chrome.action.setTitle({ title: tooltipText });

  // 2. バッジ表示
  let text = "";

  if (seconds < 60) {
    // 60秒未満: "45s"
    text = seconds + "s";
  } 
  else if (seconds < 3600) {
    // 1時間未満: "30m"
    text = minutes + "m";
  } 
  else {
    // 1時間以上: 30分刻みで表示 (1.0h, 1.5h, 2.0h...)
    
    const hoursFloat = seconds / 3600;
    // 0.5単位で切り捨て (例: 1時間29分->1.0h, 1時間30分->1.5h)
    const roundedHours = Math.floor(hoursFloat * 2) / 2;

    if (roundedHours < 10) {
      // 10時間未満: "1.0h", "1.5h" (4文字)
      text = roundedHours.toFixed(1) + "h";
    } else {
      // 10時間以上: "10h", "11h" (整数表示)
      // "10.5h" は5文字になり表示しきれないため、整数部だけ表示
      text = Math.floor(roundedHours) + "h";
    }
  }

  chrome.action.setBadgeText({ text: text });

    // カラー設定（YouTubeレッド背景 × 黄色文字）
  chrome.action.setBadgeBackgroundColor({ color: "#CC0000" });
  
  if (chrome.action.setBadgeTextColor) {
    chrome.action.setBadgeTextColor({ color: "#FFFF00" });
  }
}