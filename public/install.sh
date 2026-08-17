#!/bin/sh
# DO NOT EDIT — generated from the core repo (install.sh). Changes here are overwritten on every CLI release.
# AI Anywhere 一键安装：安装 tmux（如缺失）→ 安装 @ai-anywhere/cli → 独立后台进程 + 开机自启 → 打印授权链接
# 用法：curl -fsSL <脚本地址> | sh
# 本地和远程服务器使用同一份脚本；所有步骤都会实时打印。
set -eu

PORT="${AA_PORT:-51984}"
# npm 上 @ai-anywhere/cli 的最新版本，随每次发版更新（scripts/publish-cli.sh 会校验一致性）
CLI_VERSION="0.0.4"
say() { printf '\033[36m[AA]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[AA] %s\033[0m\n' "$*" >&2; exit 1; }

print_link() {
  TOKEN="$(cat "$HOME/.AA/token")"
  printf '\n'
  say "请在本机浏览器中打开以下链接完成授权："
  printf '\n    \033[1;32mhttp://127.0.0.1:%s/#token=%s\033[0m\n\n' "$PORT" "$TOKEN"
  say "如果这是远程服务器：请返回本地网页 → 主机面板 → 添加 SSH 目标（例如 caniforia）→ 点击“连接”。"
  say "授权后，这台机器上的所有 tmux 都会显示在侧边栏中，并归入以该机器命名的分组，与本地任务一起排列。"
}

OS="$(uname -s)"

# ── 0. 快速路径：重复执行且无事可做时，几百毫秒内退出 ────────────────
# 三个条件缺一不可：版本一致（否则要升级）、token 已生成、服务在线（否则要走启动流程）。
if command -v ai-anywhere >/dev/null 2>&1 && [ "$(ai-anywhere -v 2>/dev/null || true)" = "$CLI_VERSION" ] && [ -s "$HOME/.AA/token" ]; then
  if ai-anywhere status 2>/dev/null | grep -q 'Server is up'; then
    say "@ai-anywhere/cli v$CLI_VERSION 已是最新，服务运行中，跳过安装。"
    print_link
    exit 0
  fi
fi

# ── 1. tmux（需要 >= 3.1：capture-pane -N 等能力）────────────────────
TMUX_MIN_MAJOR=3
TMUX_MIN_MINOR=1

# "tmux 3.6a" / "tmux next-3.4" / "tmux 2.9a" → 0=达标 1=过低；无法解析（如源码 master 构建）视为达标
tmux_version_ok() {
  v="$(tmux -V 2>/dev/null | sed -n 's/^tmux \(next-\)\{0,1\}\([0-9][0-9]*\)\.\([0-9][0-9]*\).*/\2 \3/p')"
  [ -n "$v" ] || return 0
  major="${v%% *}"; minor="${v##* }"
  [ "$major" -gt "$TMUX_MIN_MAJOR" ] || { [ "$major" -eq "$TMUX_MIN_MAJOR" ] && [ "$minor" -ge "$TMUX_MIN_MINOR" ]; }
}

install_tmux() {
  case "$OS" in
    Darwin)
      command -v brew >/dev/null 2>&1 || die "缺少 Homebrew，请先安装：https://brew.sh"
      brew install tmux || brew upgrade tmux
      ;;
    Linux)
      if command -v apt-get >/dev/null 2>&1; then sudo apt-get update -qq && sudo apt-get install -y --only-upgrade tmux 2>/dev/null; sudo apt-get install -y tmux
      elif command -v dnf >/dev/null 2>&1; then sudo dnf install -y tmux
      elif command -v yum >/dev/null 2>&1; then sudo yum install -y tmux
      elif command -v pacman >/dev/null 2>&1; then sudo pacman -S --noconfirm tmux
      elif command -v apk >/dev/null 2>&1; then sudo apk add --upgrade tmux
      else die "未检测到受支持的包管理器，请手动安装 tmux >= ${TMUX_MIN_MAJOR}.${TMUX_MIN_MINOR} 后重新运行此脚本"
      fi
      ;;
    *) die "不支持的系统：$OS" ;;
  esac
}

if ! command -v tmux >/dev/null 2>&1; then
  say "未检测到 tmux，开始安装…"
  install_tmux
  say "tmux 安装完成 ($(tmux -V))"
elif ! tmux_version_ok; then
  say "tmux 版本过低 ($(tmux -V))，需要 >= ${TMUX_MIN_MAJOR}.${TMUX_MIN_MINOR}，尝试升级…"
  install_tmux
  say "tmux 升级完成 ($(tmux -V))"
else
  say "tmux 已安装 ($(tmux -V))"
fi

tmux_version_ok || die "tmux 仍低于 ${TMUX_MIN_MAJOR}.${TMUX_MIN_MINOR}（$(tmux -V)）。发行版仓库版本过旧时，请从源码或第三方仓库安装新版 tmux 后重新运行此脚本"

# ── 2. Node.js（node:sqlite 需要 22.5+）────────────────────────────
command -v node >/dev/null 2>&1 || die "缺少 Node.js（>=22.5）。macOS：brew install node；Linux 请参考 https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || die "Node.js 版本过低（$(node -v)），需要 >= 22.5"
say "Node.js $(node -v) ✓"

# ── 3. 装服务（版本一致则跳过 npm，安装即固定到脚本内置版本）────────
if command -v ai-anywhere >/dev/null 2>&1 && [ "$(ai-anywhere -v 2>/dev/null || true)" = "$CLI_VERSION" ]; then
  say "@ai-anywhere/cli v$CLI_VERSION 已安装，跳过下载"
else
  say "安装 @ai-anywhere/cli@$CLI_VERSION…"
  npm install -g "@ai-anywhere/cli@$CLI_VERSION"
fi
BIN="$(command -v ai-anywhere)" || die "安装完成，但找不到 ai-anywhere。请检查 npm 全局 bin 是否在 PATH 中"
say "已安装：$BIN"

# ── 4. 常驻 + 开机自启（macOS：launchd；Linux：systemd --user，备用方案：cron）──
NODE_BIN="$(command -v node)"
case "$OS" in
  Darwin)
    PLIST="$HOME/Library/LaunchAgents/me.haozi.ai-anywhere.plist"
    mkdir -p "$HOME/Library/LaunchAgents"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>me.haozi.ai-anywhere</string>
  <key>ProgramArguments</key><array>
    <string>$NODE_BIN</string><string>$BIN</string><string>up</string><string>--port</string><string>$PORT</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>$HOME/.AA/server.log</string>
  <key>StandardErrorPath</key><string>$HOME/.AA/server.log</string>
</dict></plist>
EOF
    mkdir -p "$HOME/.AA"
    launchctl unload "$PLIST" >/dev/null 2>&1 || true
    launchctl load "$PLIST"
    say "已配置 launchd 登录时自动启动（手动执行 down 后不会自动重启）"
    ;;
  Linux)
    if command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
      UNIT_DIR="$HOME/.config/systemd/user"
      mkdir -p "$UNIT_DIR"
      cat > "$UNIT_DIR/ai-anywhere.service" <<EOF
[Unit]
Description=AI Anywhere server

[Service]
ExecStart=$NODE_BIN $BIN up --port $PORT
Restart=no

[Install]
WantedBy=default.target
EOF
      systemctl --user daemon-reload
      systemctl --user enable --now ai-anywhere.service
      # 未启用 linger 时，退出所有 SSH 会话也会停止用户服务；启用 linger 后才能持续在后台运行
      command -v loginctl >/dev/null 2>&1 && sudo loginctl enable-linger "$USER" >/dev/null 2>&1 || true
      say "已配置 systemd 开机自动启动（手动执行 down 后不会自动重启）"
    else
      say "没有可用的 systemd --user，改用独立后台进程并通过 crontab 自动启动"
      "$BIN" up -d --port "$PORT" || true
      ( crontab -l 2>/dev/null | grep -v ai-anywhere; echo "@reboot $BIN up -d --port $PORT" ) | crontab -
    fi
    ;;
esac

# ── 5. 等待 token 写入文件并打印授权链接 ───────────────────────────
say "等待服务启动…"
i=0
while [ ! -s "$HOME/.AA/token" ] && [ $i -lt 30 ]; do sleep 1; i=$((i+1)); done
[ -s "$HOME/.AA/token" ] || die "服务未能在 30 秒内生成 token，请查看日志：~/.AA/server.log"

say "安装完成。"
print_link
