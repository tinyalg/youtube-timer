#!/bin/bash

# 出力するファイル名
OUTPUT_FILE="packages/youtube_timer_firefox.zip"

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
cp options.html "$TEMP_DIR/"
cp options.js "$TEMP_DIR/"
cp icon-firefox.png "$TEMP_DIR/icon.png"
# 多言語フォルダ (_locales) を丸ごとコピー
# (-r オプションを使用。存在チェックを追加)
if [ -d "_locales" ]; then
    cp -r _locales "$TEMP_DIR/"
else
    echo "⚠️ Warning: _locales folder not found. i18n will not work."
fi

# 4. manifest_firefox.json を manifest.json という名前でコピー
if [ -f "manifest_firefox.json" ]; then
    cp manifest_firefox.json "$TEMP_DIR/manifest.json"
else
    echo "❌ Error: manifest_firefox.json not found."
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 5. 一時フォルダ内でZIP圧縮を実行
# "." で全ファイルを対象にしつつ、Macの隠しファイル(.DS_Store, __MACOSX) を確実に除外します
cd "$TEMP_DIR"
zip -r "../$OUTPUT_FILE" . -x "*.DS_Store" -x "__MACOSX*"
cd ..

# 5. 一時フォルダをお掃除
rm -rf "$TEMP_DIR"

echo "✅ Done! Created file: $OUTPUT_FILE"
