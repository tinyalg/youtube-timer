"""
Script Name: generate_description.py
Description:
    GitHubの README.md (Markdown) を、ChromeウェブストアやFirefox Add-onsの
    「概要（Description）」欄に貼り付け可能なプレーンテキスト形式に変換するスクリプトです。

    主な処理内容:
    1. ストアに不要な要素の削除
       - インストールボタン、バッジ、画像、言語切り替えリンク、フッターなど
    2. マークダウン記号の整形
       - 見出し (###) を [見出し] の形式に変換
       - 太字 (**) やリンク記法を削除し、プレーンテキスト化
       - リスト記号 (*) をストアで見やすい (•) に変換
    3. テキストの清書
       - 余分な改行や空白の除去

Usage:
    README.md と同じディレクトリで実行してください。
    $ python generate_description.py

    出力ファイル:
    - store_description_en.txt (英語版)
    - store_description_ja.txt (日本語版)
"""

import re
import os

def markdown_to_store_text(content):
    # 1. 不要なセクションの削除
    # 言語切り替えリンクの削除
    content = re.sub(r'^\[.*?\]\(.*?\)\s*\n', '', content)
    
    # "Install Now" セクション全体を削除 (ヘッダーから次のヘッダーの手前まで)
    content = re.sub(r'##\s+📥\s*Install Now.*?(?=##\s)', '', content, flags=re.DOTALL)
    
    # 画像埋め込みの削除 (![alt](url))
    content = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    
    # バッジ/Shields.ioの削除 ([![...](...)])
    content = re.sub(r'\[!\[.*?\]\(.*?\)\]\[.*?\]', '', content)
    
    # 参照リンク定義の削除 ([id]: url)
    content = re.sub(r'^\[.*?\]:\s*http.*$', '', content, flags=re.MULTILINE)
    
    # フッター (© Tinyalg Systems) 以降の削除
    content = re.sub(r'---\s*\n©.*', '', content, flags=re.DOTALL)

    # HTMLエンティティの削除 (&nbsp;)
    content = re.sub(r'&nbsp;', '', content)

    # 2. マークダウン記法の変換
    # メインタイトル (# Title) -> 削除（ストアにはアプリ名枠があるため）または空行へ
    content = re.sub(r'^#\s+.*$', '', content, flags=re.MULTILINE)
    
    # ★変更点: H3見出し (###) -> [Title] 形式へ
    content = re.sub(r'^###+\s*(.*)$', r'[\1]', content, flags=re.MULTILINE)

    # H2見出し (##) -> 末尾にコロンをつけて区分け（Descriptionなど）
    content = re.sub(r'^##\s+(.*)$', r'\n\1:', content, flags=re.MULTILINE)
    
    # 太字 (**text**) -> テキストのみ (text)
    content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)
    
    # リンク ([text](url)) -> テキストのみ (text)
    content = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', content)
    
    # リストマーカーの変換
    # 第1階層 (* ) -> • 
    content = re.sub(r'^\*\s', '• ', content, flags=re.MULTILINE)
    # 第2階層 (  * または   -) ->   - 
    content = re.sub(r'^\s+(\*|-)\s', '  - ', content, flags=re.MULTILINE)

    # 3. 整形
    # 3つ以上の連続する改行を2つにまとめる
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # 文頭・文末の空白削除
    return content.strip()

def process_file(input_filename, output_filename):
    if not os.path.exists(input_filename):
        print(f"Skipping {input_filename} (File not found)")
        return

    with open(input_filename, 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    store_text = markdown_to_store_text(markdown_text)

    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write(store_text)
    
    print(f"✅ Generated: {output_filename}")

if __name__ == "__main__":
    # 英語版の変換
    process_file("README.md", "store_description_en.txt")
    
    # 日本語版の変換
    process_file("README.ja.md", "store_description_ja.txt")
