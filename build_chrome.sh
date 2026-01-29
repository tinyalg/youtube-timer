#!/bin/bash

# 出力するファイル名（必要に応じて変更してください）
OUTPUT_FILE="youtube_timer_chrome.zip"

# 作業用の一時フォルダ名
TEMP_DIR="temp_chrome_build"

echo "📦 Creating Chrome add-on package..."

# 1. 前回のゴミがあれば削除
rm -f "$OUTPUT_FILE"
rm -rf "$TEMP_DIR"

# 2. 一時フォルダを作成
mkdir "$TEMP_DIR"

# 3. 必要なファイルをコピー
cp background.js "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"
cp options.html "$TEMP_DIR/"
cp options.js "$TEMP_DIR/"
cp manifest.json "$TEMP_DIR/"
cp icon-chrome.png "$TEMP_DIR/icon.png"
# 多言語フォルダ (_locales) を丸ごとコピー
# (-r オプションを使用)
if [ -d "_locales" ]; then
    cp -r _locales "$TEMP_DIR/"
else
    echo "⚠️ Warning: _locales folder not found. i18n will not work."
fi

# 4. ZIP圧縮 (ここが重要！)
# "." でフォルダ内の全ファイルを対象にしつつ、
# -x オプションで Macの隠しファイル(.DS_Store, __MACOSX) を確実に除外します
cd "$TEMP_DIR"
zip -r "../$OUTPUT_FILE" . -x "*.DS_Store" -x "__MACOSX*"
cd ..

# 5. 一時フォルダをお掃除
rm -rf "$TEMP_DIR"

echo "✅ Done! Created file: $OUTPUT_FILE"
