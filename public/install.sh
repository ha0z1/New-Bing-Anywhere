#!/bin/sh
# AI Anywhere installer — gets this machine ready and installs the CLI:
#   1. tmux          (installed via the system package manager if absent)
#   2. Node.js 22.5+ (installed as the latest LTS if you already use fnm or nvm; otherwise the
#                     script stops and points at nodejs.org — it never installs Node system-wide)
#   3. @ai-anywhere/cli  (npm install -g)
#   4. ai-anywhere up    (signs in when needed, then runs in the foreground)
#
# Usage:  curl -fsSL https://tmux.online/install.sh | sh
#
# POSIX sh, no bashisms. Safe to re-run.
set -eu

# ── output ───────────────────────────────────────────────────────────
# Real escape bytes (not the literal string "\033…") so they render whether they land in a
# %b colour slot or inside a %s message.
if [ -t 1 ]; then
  C=$(printf '\033[36m')
  G=$(printf '\033[32m')
  Y=$(printf '\033[33m')
  R=$(printf '\033[31m')
  B=$(printf '\033[1m')
  Z=$(printf '\033[0m')
else
  C='' G='' Y='' R='' B='' Z=''
fi
TAG='AI-Anywhere'
say() { printf '%s[%s]%s %s\n' "$C" "$TAG" "$Z" "$*"; }
ok() { printf '%s[%s]%s %s\n' "$G" "$TAG" "$Z" "$*"; }
warn() { printf '%s[%s]%s %s\n' "$Y" "$TAG" "$Z" "$*" >&2; }
die() {
  printf '%s[%s] %s%s\n' "$R" "$TAG" "$*" "$Z" >&2
  exit 1
}
have() { command -v "$1" >/dev/null 2>&1; }

# Run a command as root: directly if we already are, via sudo otherwise.
as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif have sudo; then
    sudo "$@"
  else
    die "root access is required to install packages, but sudo is unavailable — run this installer again as root"
  fi
}

OS="$(uname -s)"

# ── 1. tmux ──────────────────────────────────────────────────────────
# 3.1 is the floor: the server relies on capture-pane -N (blank-cell preservation), which older
# tmux rejects outright.
TMUX_MIN_MAJOR=3
TMUX_MIN_MINOR=1

# 0 = this machine's tmux is new enough (or a source build we cannot parse), 1 = missing or too old.
tmux_ok() {
  have tmux || return 1
  # "tmux 3.6a" / "tmux next-3.4" / "tmux 2.9a" — a source build like "tmux master" parses to
  # nothing and passes, since it is newer than any release.
  _v="$(tmux -V 2>/dev/null | sed -n 's/^tmux \(next-\)\{0,1\}\([0-9][0-9]*\)\.\([0-9][0-9]*\).*/\2 \3/p')"
  [ -n "$_v" ] || return 0
  _tmajor="${_v%% *}"
  _tminor="${_v##* }"
  [ "$_tmajor" -gt "$TMUX_MIN_MAJOR" ] && return 0
  [ "$_tmajor" -eq "$TMUX_MIN_MAJOR" ] && [ "$_tminor" -ge "$TMUX_MIN_MINOR" ] && return 0
  return 1
}

install_tmux_linux() {
  # One of the usual package managers, whichever this distro ships.
  if have apt-get; then
    as_root apt-get update -qq
    as_root apt-get install -y tmux
  elif have dnf; then
    as_root dnf install -y tmux
  elif have yum; then
    as_root yum install -y tmux
  elif have pacman; then
    as_root pacman -Sy --noconfirm tmux
  elif have zypper; then
    as_root zypper install -y tmux
  elif have apk; then
    as_root apk add tmux
  elif have xbps-install; then
    as_root xbps-install -Sy tmux
  elif have pkg; then
    as_root pkg install -y tmux
  else
    die "could not find a package manager to install tmux — install it manually and re-run"
  fi
}

ensure_tmux() {
  if tmux_ok; then
    ok "tmux already installed ($(tmux -V))"
    return
  fi
  if have tmux; then
    say "tmux $(tmux -V | cut -d' ' -f2) is older than ${TMUX_MIN_MAJOR}.${TMUX_MIN_MINOR} — upgrading…"
  else
    say "installing tmux…"
  fi
  case "$OS" in
    Darwin)
      have brew || die "Homebrew is required to install tmux on macOS — get it at https://brew.sh, then re-run"
      brew install tmux || brew upgrade tmux
      ;;
    Linux | FreeBSD | *BSD)
      install_tmux_linux
      ;;
    *)
      die "unsupported OS for automatic tmux install: $OS — install tmux manually and re-run"
      ;;
  esac
  have tmux || die "tmux was installed, but it is still not on PATH"
  tmux_ok || die "tmux is still older than ${TMUX_MIN_MAJOR}.${TMUX_MIN_MINOR} ($(tmux -V)) — your distro's package is too old. Install a newer tmux (source build or a third-party repo) and re-run"
  ok "tmux installed ($(tmux -V))"
}

# ── 2. Node.js ───────────────────────────────────────────────────────
# 22.5 is the floor because the CLI's package.json declares engines >=22.5.0.
NODE_MIN_MAJOR=22
NODE_MIN_MINOR=5

# 0 = this machine's node is new enough, 1 = missing or too old.
node_ok() {
  have node || return 1
  # process.versions.node is always "MAJOR.MINOR.PATCH".
  _major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  _minor="$(node -p 'process.versions.node.split(".")[1]' 2>/dev/null || echo 0)"
  case "$_major$_minor" in
    '' | *[!0-9]*) return 1 ;;
  esac
  [ "$_major" -gt "$NODE_MIN_MAJOR" ] && return 0
  [ "$_major" -eq "$NODE_MIN_MAJOR" ] && [ "$_minor" -ge "$NODE_MIN_MINOR" ] && return 0
  return 1
}

# Node is deliberately NOT installed system-wide. Distro packages and NodeSource both mean touching
# apt/dnf sources as root to put a second Node on a machine that may already manage its own — too
# invasive for an installer. If the user already runs a version manager we drive it; otherwise we
# stop and let them choose. So the only automatic path is fnm or nvm, installing the latest LTS.

# nvm is a shell function sourced from nvm.sh, never a binary on PATH — `command -v nvm` cannot see
# it from a non-interactive script. Locate the script itself instead.
nvm_sh() {
  for _c in "${NVM_DIR:-}/nvm.sh" "$HOME/.nvm/nvm.sh" "$HOME/.config/nvm/nvm.sh" \
    /opt/homebrew/opt/nvm/nvm.sh /usr/local/opt/nvm/nvm.sh; do
    if [ -s "$_c" ]; then
      echo "$_c"
      return 0
    fi
  done
  return 1
}

install_node_fnm() {
  say "found fnm ($(command -v fnm)) — installing the latest LTS…"
  fnm install --lts
  # fnm only ever mutates the shell that calls it. Without importing its env here, the Node it just
  # installed is invisible to the rest of this script. `--shell bash` emits plain `export` lines,
  # which any POSIX shell can eval.
  eval "$(fnm env --shell bash)" || true
  fnm use lts-latest >/dev/null 2>&1 || true
  # Make it this user's default too, so the next shell — and the server on next login — still has it.
  fnm default lts-latest >/dev/null 2>&1 || true
}

install_node_nvm() {
  _nvm="$(nvm_sh)"
  say "found nvm ($_nvm) — installing the latest LTS…"
  # nvm.sh is not written against `set -eu`: it reads unset variables and returns non-zero in
  # ordinary paths, either of which would abort this script mid-install. Relax both while it runs;
  # node_ok below is the real gate on whether any of it worked.
  set +eu
  # shellcheck source=/dev/null
  . "$_nvm"
  nvm install --lts
  nvm use --lts
  set -eu
}

ensure_node() {
  if node_ok; then
    ok "Node.js $(node -v) ✓"
    return
  fi
  if have node; then
    say "Node.js $(node -v) is older than ${NODE_MIN_MAJOR}.${NODE_MIN_MINOR}"
  else
    say "Node.js not found"
  fi

  if have fnm; then
    install_node_fnm
  elif nvm_sh >/dev/null 2>&1; then
    install_node_nvm
  else
    die "Node.js ${NODE_MIN_MAJOR}.${NODE_MIN_MINOR}+ is required. Install it from https://nodejs.org and re-run. (If you use nvm or fnm, this script installs the latest LTS through it automatically.)"
  fi

  # A version manager can report success and still leave this shell pointing elsewhere — an older
  # node earlier in PATH, or an env import that did not take. Check rather than assume.
  have node || die "the version manager finished, but Node.js is still not on PATH — open a new shell and re-run, or install Node.js from https://nodejs.org"
  node_ok || die "the version manager installed $(node -v), which is below the required ${NODE_MIN_MAJOR}.${NODE_MIN_MINOR} — an older Node.js binary may be earlier in PATH. Install Node.js from https://nodejs.org and re-run."
  ok "Node.js $(node -v) installed"
}

# ── 3. the CLI ───────────────────────────────────────────────────────
PKG='@ai-anywhere/cli'
# The latest published version, updated on every release (scripts/publish-cli.sh in the core repo
# enforces that this matches the package.json being published). Pinning makes the script
# reproducible and lets a re-run skip npm entirely when nothing changed.
CLI_VERSION='0.0.13'
PTY_PKG='@homebridge/node-pty-prebuilt-multiarch'
CLI_BIN=''

install_cli_with_npm() {
  _npm_major="$(npm -v | cut -d. -f1)"
  case "$_npm_major" in
    '' | *[!0-9]*) _npm_major=0 ;;
  esac

  # npm 11 asks global installers to explicitly approve dependencies with lifecycle scripts.
  # npm 10 does not know this option. Error-level logging keeps failures visible while omitting
  # transitive deprecation, funding and update notices from the one-line installer.
  if [ "$_npm_major" -ge 11 ]; then
    "$@" install -g --allow-scripts="$PTY_PKG" --loglevel=error --no-fund --no-audit "$PKG@$CLI_VERSION"
  else
    "$@" install -g --loglevel=error --no-fund --no-audit "$PKG@$CLI_VERSION"
  fi
}

install_cli() {
  # Fast path: this exact version is already installed — nothing for npm to do.
  if have ai-anywhere && [ "$(ai-anywhere -v 2>/dev/null || true)" = "$CLI_VERSION" ]; then
    CLI_BIN="$(command -v ai-anywhere)"
    ok "${PKG} v${CLI_VERSION} already installed: $CLI_BIN"
    return
  fi
  have npm || die "npm is required to install ${PKG} but was not found — install it alongside Node.js and re-run"
  # Being on PATH is not enough: a distro can leave npm as a dangling alternatives symlink when the
  # npm package itself is absent (openSUSE's /usr/bin/npm-default does exactly this). Without this
  # check the script marches on and fails later inside npm with a bare "No such file or directory".
  npm -v >/dev/null 2>&1 || die "npm is on PATH at $(command -v npm), but it does not run — install your distro's npm package for Node.js ${NODE_MIN_MAJOR}, then re-run"
  say "installing ${PKG}@${CLI_VERSION}…"
  # A root-owned global prefix (system Node on Linux) needs sudo; a user-owned one (nvm, fnm,
  # Homebrew) must NOT get it — installing as root there leaves files the user can't later update.
  _prefix="$(npm prefix -g 2>/dev/null || echo '')"
  if [ -n "$_prefix" ] && [ -w "$_prefix" ]; then
    install_cli_with_npm npm
  else
    say "npm's global prefix (${_prefix:-unknown}) is not writable — installing with sudo"
    install_cli_with_npm as_root npm
  fi
  if have ai-anywhere; then
    CLI_BIN="$(command -v ai-anywhere)"
    ok "installed: $CLI_BIN"
  elif [ -n "$_prefix" ] && [ -x "$_prefix/bin/ai-anywhere" ]; then
    CLI_BIN="$_prefix/bin/ai-anywhere"
    warn "${PKG} installed, but 'ai-anywhere' is not on PATH."
    warn "Add npm's global bin to PATH:  export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
  else
    # The package landed, but npm's global bin dir isn't on PATH — a real and common state that
    # isn't a failure of the install itself, so report it as a next step rather than dying.
    warn "${PKG} installed, but 'ai-anywhere' is not on PATH."
    warn "Add npm's global bin to PATH:  export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
  fi
}

# ── run ──────────────────────────────────────────────────────────────
say "setting up AI Anywhere…"
ensure_tmux
ensure_node
install_cli

printf '\n'
if [ -n "$CLI_BIN" ]; then
  ok "${B}All set.${Z} Starting AI Anywhere…"
  # The installer owns this restart, so apply the same validated shutdown as answering "y" to
  # `up`'s occupied-port prompt. `down` refuses to signal a process it cannot identify as ours.
  "$CLI_BIN" down >/dev/null
  # `curl ... | sh` leaves stdin attached to the installer pipe. Restore the controlling terminal
  # for any exceptional prompt that still needs user input after the validated shutdown.
  if [ -t 1 ] && ( : </dev/tty ) 2>/dev/null; then
    exec "$CLI_BIN" up </dev/tty
  fi
  exec "$CLI_BIN" up
else
  ok "${B}Installed.${Z} Update PATH as shown above, then run:  ${Y}ai-anywhere up${Z}"
fi
