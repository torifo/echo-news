#!/usr/bin/env bash
# echo-news デモ GIF 生成スクリプト
# 実行方法: WSL2 端末で直接 bash demo/gen-gif.sh を実行すること
#           (subprocess 経由では TTY がなく vhs が失敗するため)

set -e
cd "$(dirname "$0")"

# ── vhs の確認 ────────────────────────────────
if ! command -v vhs &>/dev/null; then
  echo "[ERROR] vhs が見つかりません．以下の手順でインストールしてください:"
  echo ""
  echo "  mkdir -p ~/.local/bin"
  echo "  curl -L https://github.com/charmbracelet/vhs/releases/latest/download/vhs_Linux_x86_64.tar.gz \\"
  echo "    | tar xz -C ~/.local/bin vhs"
  echo "  echo 'export PATH=\$HOME/.local/bin:\$PATH' >> ~/.bashrc && source ~/.bashrc"
  echo ""
  echo "  依存ツール (ttyd):"
  echo "  curl -L https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \\"
  echo "    -o ~/.local/bin/ttyd && chmod +x ~/.local/bin/ttyd"
  exit 1
fi

echo "vhs: $(vhs --version 2>&1 | head -1)"
echo ""

TAPES=(windows wsl combined)
SUCCESS=0
FAIL=0

for name in "${TAPES[@]}"; do
  echo "▶ 生成中: ${name}.gif"
  if vhs "${name}.tape"; then
    SIZE=$(du -sh "${name}.gif" 2>/dev/null | cut -f1)
    echo "  ✓ ${name}.gif (${SIZE})"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ ${name}.gif 失敗"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo "────────────────────────────────────"
echo "  完了: ${SUCCESS}件成功 / ${FAIL}件失敗"
echo ""
echo "次のステップ:"
echo "  git add demo/*.gif"
echo "  git commit -m 'demo: デモGIFを追加 / add demo GIFs'"
echo "  git push"
