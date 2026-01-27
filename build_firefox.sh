#!/bin/bash

# 出力するファイル名（必要に応じて変更してください）
OUTPUT_FILE="youtube_timer_firefox.zip"

# 作業用の一時フォルダ名
TEMP_DIR="temp_firefox_build"

echo "📦 Creating Firefox add-on package..."

# 1. 前回のゴミがあれば削除
rm -f "$OUTPUT_FILE"
rm -rf "$TEMP_DIR"

# 2. 一時フォルダを作成
mkdir "$TEMP_DIR"

# 3. 必要なファイルをコピー
cp background.js "$TEMP_DIR/"
cp popup.html "$TEMP_DIR/"
cp popup.js "$TEMP_DIR/"

# 4. manifest_firefox.json を manifest.json という名前でコピー
if [ -f "manifest_firefox.json" ]; then
    cp manifest_firefox.json "$TEMP_DIR/manifest.json"
else
    echo "❌ Error: manifest_firefox.json not found."
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 5. 一時フォルダ内でZIP圧縮を実行
# ファイルを明示的に指定するので、隠しファイルは混入しません
cd "$TEMP_DIR"
zip "../$OUTPUT_FILE" manifest.json background.js popup.html popup.js
cd ..

# 6. 一時フォルダをお掃除
rm -rf "$TEMP_DIR"

echo "✅ Done! Created file: $OUTPUT_FILE"
