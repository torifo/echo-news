#!/usr/bin/env bash
# vhs + ttyd インストールスクリプト（WSL2用）
# 実行: bash demo/install-vhs.sh

set -e

BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# PATH に追加（未設定の場合）
if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.bashrc"
  export PATH="$BIN_DIR:$PATH"
  echo "[info] ~/.bashrc に PATH を追加しました"
fi

# ── vhs ──────────────────────────────────────
VHS_VERSION="0.10.0"
VHS_URL="https://github.com/charmbracelet/vhs/releases/download/v${VHS_VERSION}/vhs_${VHS_VERSION}_Linux_x86_64.tar.gz"

echo "▶ vhs v${VHS_VERSION} をインストール中..."
curl -fL "$VHS_URL" | tar xz -C "$BIN_DIR" vhs
chmod +x "$BIN_DIR/vhs"
echo "  ✓ vhs: $(vhs --version 2>&1 | head -1)"

# ── ttyd ─────────────────────────────────────
TTYD_VERSION="1.7.7"
TTYD_URL="https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64"

echo "▶ ttyd v${TTYD_VERSION} をインストール中..."
curl -fL "$TTYD_URL" -o "$BIN_DIR/ttyd"
chmod +x "$BIN_DIR/ttyd"
echo "  ✓ ttyd: $(ttyd --version 2>&1 | head -1)"

echo ""
echo "インストール完了．新しいターミナルを開くか以下を実行:"
echo "  source ~/.bashrc"
echo ""
echo "GIF生成:"
echo "  cd ~/devops/CLI/echo-news && bash demo/gen-gif.sh"
