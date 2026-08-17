import type { Lang } from './index'

export const GUIDE_PATHS = {
  tmuxWebUi: '/tmux-web-ui',
  claudeCodeBrowser: '/claude-code-browser',
  codexBrowser: '/codex-browser',
  security: '/docs/security',
  remoteHosts: '/docs/remote-hosts',
  install: '/docs/install',
} as const

export type GuideId = keyof typeof GUIDE_PATHS
export const guideEntries = Object.entries(GUIDE_PATHS) as [GuideId, string][]

interface GuideSection {
  title: string
  body: string[]
  bullets?: string[]
  command?: string
}

interface GuidePage {
  title: string
  description: string
  eyebrow: string
  summary: string
  sections: GuideSection[]
}

interface GuideCollection {
  navTitle: string
  home: string
  pages: Record<GuideId, GuidePage>
}

const en: GuideCollection = {
  navTitle: 'Guides',
  home: 'Home',
  pages: {
    tmuxWebUi: {
      eyebrow: 'tmux web UI',
      title: 'A browser interface for the tmux sessions already running',
      description:
        'Open existing tmux sessions in a browser, move between panes and manage local or SSH hosts without relocating terminal data',
      summary:
        'AI Anywhere adds a browser interface to tmux without replacing it. Your shells and agents continue to run in tmux on the machine where you started them',
      sections: [
        {
          title: 'tmux stays in charge',
          body: [
            'The local server reads the sessions, windows and panes that tmux already owns. Opening the web UI does not restart, copy or migrate a session',
            'Close the browser or lose the network connection and the process keeps running in tmux. Reopen the page to return to the same pane',
          ],
        },
        {
          title: 'One view for machines and tasks',
          body: ['Local sessions and hosts reached through your SSH configuration are grouped in one sidebar'],
          bullets: [
            'Move between tmux windows and panes from the browser',
            'See which AI coding task is working or waiting for input',
            'Open the same workspace from a phone when the machine is reachable',
          ],
        },
        {
          title: 'What remains local',
          body: [
            'The web app is served by the local AI Anywhere process on 127.0.0.1. Terminal output, keystrokes, files and credentials are not relayed through tmux.online',
          ],
        },
      ],
    },
    claudeCodeBrowser: {
      eyebrow: 'Claude Code',
      title: 'Use Claude Code from a browser without moving the terminal',
      description: 'Keep Claude Code running inside tmux, follow its status in a browser and answer prompts from a desktop or phone',
      summary:
        'Start Claude Code in tmux as usual. AI Anywhere makes that same terminal available in the browser and highlights the moments when Claude needs a response',
      sections: [
        {
          title: 'Keep the session running',
          body: [
            'Claude Code continues inside tmux when the browser closes or an SSH connection drops. The browser is another view of the session, not a second Claude process',
          ],
        },
        {
          title: 'Return when input is needed',
          body: [
            'Tasks are grouped by machine and show when they are working or waiting. Open the waiting task, review the terminal context and reply in the same pane',
          ],
          bullets: [
            'Follow separate subagents as individual tasks',
            'Switch between repositories without watching every terminal',
            'Respond from a phone when you are away from the desk',
          ],
        },
        {
          title: 'Claude credentials stay where they are',
          body: [
            'AI Anywhere does not ask for or upload your Anthropic credentials. Claude Code remains installed and authenticated on your own machine',
          ],
        },
      ],
    },
    codexBrowser: {
      eyebrow: 'Codex CLI',
      title: 'Control Codex CLI tasks from any browser',
      description: 'Run Codex CLI in tmux, monitor parallel coding tasks and step in from a browser only when a task needs input',
      summary:
        'Use Codex CLI in the terminal workflow you already have. AI Anywhere exposes the tmux session locally, so long-running tasks remain available across tabs, devices and dropped connections',
      sections: [
        {
          title: 'Keep each task visible',
          body: [
            'A Codex task maps to the tmux window where it runs. Parallel agents and worktrees can stay separated while their current states remain visible in one sidebar',
          ],
        },
        {
          title: 'Intervene from another screen',
          body: ['When Codex pauses for a decision, open that task from a desktop browser or phone and continue in the original terminal'],
          bullets: [
            'No second shell to synchronise',
            'No terminal transcript uploaded to the account service',
            'No need to leave a laptop screen open',
          ],
        },
        {
          title: 'Your Codex setup is unchanged',
          body: [
            'Codex CLI, its configuration and its credentials stay on the machine. AI Anywhere provides the browser interface and task view around the existing tmux session',
          ],
        },
      ],
    },
    security: {
      eyebrow: 'Security',
      title: 'The terminal stays on your machine',
      description:
        'Understand the local server, connection token, Origin checks, SSH path and account-service boundary used by AI Anywhere',
      summary:
        'AI Anywhere is a local bridge, not a hosted terminal. The browser talks to the process running beside tmux, while tmux.online handles the public site and account authorisation',
      sections: [
        {
          title: 'Local by default',
          body: [
            'The server listens on 127.0.0.1 by default. A process bound to that address is reachable from the same machine, not directly from the public internet',
          ],
        },
        {
          title: 'Connections are checked',
          body: [
            'The local URL contains a connection token, and the server validates the request Origin. A random web page cannot silently connect to an open local terminal',
          ],
          bullets: [
            'Terminal output and keystrokes are not sent to the account service',
            'Files and CLI credentials remain on the machine',
            'Remote connections use your own SSH configuration without a terminal relay',
          ],
        },
        {
          title: 'What the account service does',
          body: [
            'The account service authorises devices and manages membership and API keys. It does not carry terminal streams. Revoking a device removes its account authorisation without stopping the tmux tasks already running on that machine',
          ],
        },
      ],
    },
    remoteHosts: {
      eyebrow: 'Remote hosts',
      title: 'Use your existing SSH hosts in the same workspace',
      description:
        'See tmux tasks on remote servers through your existing SSH configuration without a hosted relay or a second terminal account',
      summary:
        'Install tmux on the remote server. AI Anywhere uses your existing SSH configuration and groups that host beside the local machine',
      sections: [
        {
          title: 'What the remote server needs',
          body: [
            'Only tmux is required on the remote host. Keep using the SSH keys, aliases, jump hosts and host verification already configured on your machine',
          ],
          command: 'tmux new -s main',
        },
        {
          title: 'Sessions remain remote',
          body: [
            'Commands and agent processes run on the remote server inside tmux. AI Anywhere does not copy the session into tmux.online or route the terminal through an external relay',
          ],
        },
        {
          title: 'Reconnect without losing work',
          body: [
            'A dropped browser or SSH connection does not stop tmux. Once the host is reachable again, open the same task and continue where it was left',
          ],
        },
      ],
    },
    install: {
      eyebrow: 'Installation',
      title: 'Install AI Anywhere on macOS or Linux',
      description: 'Install the AI Anywhere CLI, start its local tmux web interface and authorise the machine from your browser',
      summary:
        'The installer checks tmux and Node.js, installs @ai-anywhere/cli from npm and configures the local service to return after a reboot',
      sections: [
        {
          title: 'Run the installer',
          body: [
            'Use curl, or inspect the script at tmux.online/install.sh before running it. Node.js 22.5 or newer and tmux are required',
          ],
          command: 'curl -fsSL https://tmux.online/install.sh | sh',
        },
        {
          title: 'Authorise this machine',
          body: [
            'The installer starts AI Anywhere and opens or prints a local URL. If the machine is not authorised, sign in and complete the device flow',
          ],
          command: 'ai-anywhere login',
        },
        {
          title: 'Start it again later',
          body: [
            'The service is configured for launchd on macOS or a systemd user unit on Linux. You can also start it directly; the local web UI uses 127.0.0.1:51984 by default',
          ],
          command: 'ai-anywhere up',
        },
      ],
    },
  },
}

const ja: GuideCollection = {
  navTitle: 'ガイド',
  home: 'ホーム',
  pages: {
    tmuxWebUi: {
      eyebrow: 'tmux Web UI',
      title: '実行中の tmux セッションをブラウザから操作',
      description: '既存の tmux セッションをブラウザで開き、ターミナルのデータを移動せずに pane やローカル・SSH ホストを操作できます',
      summary:
        'AI Anywhere は tmux を置き換えるのではなく、ブラウザから操作できる画面を追加します。シェルや Agent は、起動したマシンの tmux 上でそのまま動き続けます',
      sections: [
        {
          title: 'セッションを管理するのは tmux のまま',
          body: [
            'ローカルサーバーは、tmux が管理している既存のセッション、window、pane を読み取ります。Web UI を開いても、セッションが再起動・複製・移動されることはありません',
            'ブラウザを閉じたり接続が切れたりしても、処理は tmux の中で継続します。ページを開き直せば同じ pane に戻れます',
          ],
        },
        {
          title: 'マシンとタスクをひとつの画面で確認',
          body: ['ローカルセッションと、自分の SSH 設定で接続するホストが同じサイドバーにまとまります'],
          bullets: [
            'ブラウザから tmux の window と pane を切り替える',
            'AI コーディングタスクが実行中か入力待ちかを確認する',
            'マシンに接続できる環境なら、スマートフォンから同じワークスペースを開く',
          ],
        },
        {
          title: 'データはローカルに保持',
          body: [
            'Web アプリは 127.0.0.1 で動く AI Anywhere のローカルプロセスから配信されます。ターミナルの出力、キー入力、ファイル、認証情報が tmux.online を経由することはありません',
          ],
        },
      ],
    },
    claudeCodeBrowser: {
      eyebrow: 'Claude Code',
      title: 'ターミナルを移さず Claude Code をブラウザから操作',
      description: 'Claude Code を tmux で動かしたまま、ブラウザで状態を確認し、パソコンやスマートフォンからプロンプトに回答できます',
      summary:
        '普段どおり tmux で Claude Code を起動してください。AI Anywhere は同じターミナルをブラウザに表示し、Claude が応答を待っているタイミングを分かりやすく示します',
      sections: [
        {
          title: 'セッションは止まらない',
          body: [
            'ブラウザを閉じても、SSH 接続が切れても、Claude Code は tmux の中で動き続けます。ブラウザは同じセッションを見るための画面であり、別の Claude プロセスを起動するものではありません',
          ],
        },
        {
          title: '入力が必要なときだけ戻る',
          body: [
            'タスクはマシンごとにまとまり、実行中か入力待ちかを確認できます。待機中のタスクを開き、ターミナルの流れを確認して同じ pane から回答します',
          ],
          bullets: [
            'サブエージェントを個別のタスクとして追跡',
            '複数のリポジトリを切り替えながら状況を確認',
            '席を離れていてもスマートフォンから応答',
          ],
        },
        {
          title: 'Claude の認証情報はそのまま',
          body: [
            'AI Anywhere が Anthropic の認証情報を要求したりアップロードしたりすることはありません。Claude Code は自分のマシンにインストールし、そこで認証した状態のまま使います',
          ],
        },
      ],
    },
    codexBrowser: {
      eyebrow: 'Codex CLI',
      title: 'Codex CLI のタスクをどのブラウザからでも操作',
      description: 'Codex CLI を tmux で動かし、並行するコーディングタスクを確認して、入力が必要なときだけブラウザから対応できます',
      summary:
        'いつものターミナル環境で Codex CLI を使い続けられます。AI Anywhere は tmux セッションをローカルで表示するため、長時間のタスクもタブや端末、接続状況に左右されません',
      sections: [
        {
          title: 'タスクごとの状態をひと目で確認',
          body: [
            'Codex のタスクは、実行している tmux window に対応します。並行する Agent や worktree を分けたまま、それぞれの状態をひとつのサイドバーで確認できます',
          ],
        },
        {
          title: '別の画面から対応',
          body: [
            'Codex が判断を待っているときは、パソコンのブラウザやスマートフォンからそのタスクを開き、元のターミナルで作業を続けられます',
          ],
          bullets: [
            '別のシェルとの同期は不要',
            'ターミナルの履歴をアカウントサービスへ送信しない',
            'ノートパソコンの画面を開いたままにする必要がない',
          ],
        },
        {
          title: 'Codex の設定は変更不要',
          body: [
            'Codex CLI の設定と認証情報はマシンに残ります。AI Anywhere は、既存の tmux セッションにブラウザ画面とタスク一覧を追加します',
          ],
        },
      ],
    },
    security: {
      eyebrow: 'セキュリティ',
      title: 'ターミナルのデータはマシンの外に出ません',
      description: 'AI Anywhere のローカルサーバー、接続トークン、Origin 検証、SSH 経路、アカウントサービスの役割を説明します',
      summary:
        'AI Anywhere はホスト型ターミナルではなく、ローカルで動くブリッジです。ブラウザは tmux と同じマシンのプロセスに接続し、tmux.online は公開サイトとアカウント認証を担当します',
      sections: [
        {
          title: 'デフォルトはローカル限定',
          body: [
            'サーバーはデフォルトで 127.0.0.1 のみを監視します。このアドレスにバインドしたプロセスへ、公開インターネットから直接接続することはできません',
          ],
        },
        {
          title: '接続ごとに検証',
          body: [
            'ローカル URL には接続トークンが含まれ、サーバーはリクエストの Origin も検証します。無関係な Web ページが、開いているローカルターミナルへ勝手に接続することはできません',
          ],
          bullets: [
            'ターミナルの出力やキー入力をアカウントサービスへ送信しない',
            'ファイルと CLI の認証情報はマシンに保持',
            'リモート接続には自分の SSH 設定を使い、外部のターミナル中継を利用しない',
          ],
        },
        {
          title: 'アカウントサービスの役割',
          body: [
            'アカウントサービスは端末の認証、会員情報、API キーを管理します。ターミナルの通信は扱いません。端末の認証を取り消しても、そのマシンの tmux タスク自体は停止しません',
          ],
        },
      ],
    },
    remoteHosts: {
      eyebrow: 'リモートホスト',
      title: '既存の SSH ホストを同じワークスペースで操作',
      description: 'ホスト型の中継や別のターミナルアカウントを使わず、既存の SSH 設定を通じてリモートサーバーの tmux タスクを確認できます',
      summary:
        'リモートサーバーには tmux をインストールするだけです。AI Anywhere は既存の SSH 設定を使い、ローカルマシンと並べてホストを表示します',
      sections: [
        {
          title: 'リモートサーバーに必要なもの',
          body: [
            'リモートホストに必要なのは tmux だけです。SSH キー、エイリアス、踏み台ホスト、ホスト鍵の検証は、マシンに設定済みのものをそのまま使います',
          ],
          command: 'tmux new -s main',
        },
        {
          title: 'セッションはリモートに保持',
          body: [
            'コマンドと Agent のプロセスは、リモートサーバーの tmux 内で実行されます。セッションを tmux.online にコピーしたり、外部の中継を通したりすることはありません',
          ],
        },
        {
          title: '接続が切れても作業は継続',
          body: [
            'ブラウザや SSH の接続が切れても tmux は停止しません。ホストへ再接続できるようになれば、同じタスクを開いて続きから作業できます',
          ],
        },
      ],
    },
    install: {
      eyebrow: 'インストール',
      title: 'macOS または Linux に AI Anywhere をインストール',
      description: 'AI Anywhere CLI をインストールしてローカルの tmux Web UI を起動し、ブラウザからマシンを認証します',
      summary:
        'インストーラーは tmux と Node.js を確認し、npm から @ai-anywhere/cli をインストールして、再起動後もローカルサービスが立ち上がるように設定します',
      sections: [
        {
          title: 'インストーラーを実行',
          body: ['curl を使うか、実行前に tmux.online/install.sh の内容を確認してください。tmux と Node.js 22.5 以降が必要です'],
          command: 'curl -fsSL https://tmux.online/install.sh | sh',
        },
        {
          title: 'このマシンを認証',
          body: [
            'インストーラーが AI Anywhere を起動し、ローカル URL を開くか表示します。マシンが未認証の場合は、ログインして端末の認証を完了してください',
          ],
          command: 'ai-anywhere login',
        },
        {
          title: 'あとから起動する',
          body: [
            'macOS では launchd、Linux では systemd のユーザーユニットとして設定されます。直接起動することもでき、Web UI はデフォルトで 127.0.0.1:51984 を使います',
          ],
          command: 'ai-anywhere up',
        },
      ],
    },
  },
}

const ko: GuideCollection = {
  navTitle: '가이드',
  home: '홈',
  pages: {
    tmuxWebUi: {
      eyebrow: 'tmux 웹 UI',
      title: '실행 중인 tmux 세션을 브라우저에서 제어',
      description: '기존 tmux 세션을 브라우저에서 열고 터미널 데이터를 옮기지 않은 채 pane과 로컬 및 SSH 호스트를 관리하세요',
      summary:
        'AI Anywhere는 tmux를 대체하지 않고 브라우저 인터페이스를 더합니다. 셸과 Agent는 시작한 기기의 tmux에서 그대로 계속 실행됩니다',
      sections: [
        {
          title: '세션 관리는 계속 tmux가 담당',
          body: [
            '로컬 서버는 tmux가 관리하는 기존 세션, window, pane을 읽습니다. 웹 UI를 열어도 세션을 다시 시작하거나 복사하거나 옮기지 않습니다',
            '브라우저를 닫거나 연결이 끊겨도 프로세스는 tmux에서 계속 실행됩니다. 페이지를 다시 열면 같은 pane으로 돌아갈 수 있습니다',
          ],
        },
        {
          title: '기기와 작업을 한 화면에서 확인',
          body: ['로컬 세션과 기존 SSH 설정으로 연결하는 호스트가 같은 사이드바에 표시됩니다'],
          bullets: [
            '브라우저에서 tmux window와 pane 전환',
            'AI 코딩 작업이 실행 중인지 입력 대기 중인지 확인',
            '기기에 연결할 수 있다면 스마트폰에서 같은 워크스페이스 열기',
          ],
        },
        {
          title: '데이터는 로컬에 유지',
          body: [
            '웹 앱은 127.0.0.1에서 실행되는 AI Anywhere 로컬 프로세스가 제공합니다. 터미널 출력, 키 입력, 파일 및 인증 정보는 tmux.online을 거치지 않습니다',
          ],
        },
      ],
    },
    claudeCodeBrowser: {
      eyebrow: 'Claude Code',
      title: '터미널을 옮기지 않고 브라우저에서 Claude Code 제어',
      description: 'Claude Code를 tmux에서 계속 실행하면서 브라우저로 상태를 확인하고 데스크톱이나 스마트폰에서 프롬프트에 답하세요',
      summary:
        '평소처럼 tmux에서 Claude Code를 시작하세요. AI Anywhere는 같은 터미널을 브라우저에 표시하고 Claude가 응답을 기다리는 순간을 알려 줍니다',
      sections: [
        {
          title: '세션은 계속 실행',
          body: [
            '브라우저를 닫거나 SSH 연결이 끊겨도 Claude Code는 tmux 안에서 계속 실행됩니다. 브라우저는 같은 세션을 보는 화면이며 별도의 Claude 프로세스를 만들지 않습니다',
          ],
        },
        {
          title: '입력이 필요할 때만 돌아오기',
          body: [
            '작업은 기기별로 묶이며 실행 중인지 입력 대기 중인지 표시됩니다. 대기 중인 작업을 열고 터미널 흐름을 확인한 뒤 같은 pane에서 답할 수 있습니다',
          ],
          bullets: ['서브에이전트를 개별 작업으로 추적', '여러 저장소의 상태를 오가며 확인', '자리를 비운 동안 스마트폰으로 응답'],
        },
        {
          title: 'Claude 인증 정보는 그대로 유지',
          body: [
            'AI Anywhere는 Anthropic 인증 정보를 요청하거나 업로드하지 않습니다. Claude Code는 내 기기에 설치되고 인증된 상태로 남습니다',
          ],
        },
      ],
    },
    codexBrowser: {
      eyebrow: 'Codex CLI',
      title: '어느 브라우저에서나 Codex CLI 작업 제어',
      description: 'Codex CLI를 tmux에서 실행하고 병렬 코딩 작업을 확인하며 입력이 필요한 순간에만 브라우저에서 개입하세요',
      summary:
        '기존 터미널 환경에서 Codex CLI를 그대로 사용하세요. AI Anywhere가 tmux 세션을 로컬에서 보여 주므로 장시간 작업도 탭, 기기 또는 연결 상태에 영향받지 않습니다',
      sections: [
        {
          title: '각 작업의 상태를 한눈에 확인',
          body: [
            'Codex 작업은 실행 중인 tmux window에 대응합니다. 병렬 Agent와 worktree를 분리한 채 각 상태를 하나의 사이드바에서 확인할 수 있습니다',
          ],
        },
        {
          title: '다른 화면에서 개입',
          body: ['Codex가 결정을 기다리면 데스크톱 브라우저나 스마트폰에서 해당 작업을 열고 원래 터미널에서 계속 진행할 수 있습니다'],
          bullets: ['별도 셸과 동기화할 필요 없음', '터미널 기록을 계정 서비스에 업로드하지 않음', '노트북 화면을 계속 켜 둘 필요 없음'],
        },
        {
          title: 'Codex 설정은 변경하지 않아도 됨',
          body: [
            'Codex CLI 설정과 인증 정보는 기기에 그대로 남습니다. AI Anywhere는 기존 tmux 세션에 브라우저 화면과 작업 목록을 더합니다',
          ],
        },
      ],
    },
    security: {
      eyebrow: '보안',
      title: '터미널 데이터는 내 기기에만 남습니다',
      description: 'AI Anywhere의 로컬 서버, 연결 토큰, Origin 검증, SSH 경로 및 계정 서비스의 역할을 알아보세요',
      summary:
        'AI Anywhere는 호스팅 터미널이 아니라 로컬 브리지입니다. 브라우저는 tmux와 같은 기기에서 실행되는 프로세스에 연결하고 tmux.online은 공개 사이트와 계정 인증을 담당합니다',
      sections: [
        {
          title: '기본값은 로컬 전용',
          body: ['서버는 기본적으로 127.0.0.1에서만 수신합니다. 이 주소에 바인딩된 프로세스에는 공개 인터넷에서 직접 접근할 수 없습니다'],
        },
        {
          title: '연결마다 검증',
          body: [
            '로컬 URL에는 연결 토큰이 포함되고 서버는 요청의 Origin도 확인합니다. 무관한 웹 페이지가 열린 로컬 터미널에 몰래 연결할 수 없습니다',
          ],
          bullets: [
            '터미널 출력과 키 입력을 계정 서비스에 보내지 않음',
            '파일과 CLI 인증 정보는 기기에 유지',
            '원격 연결은 기존 SSH 설정을 사용하며 외부 터미널 중계를 거치지 않음',
          ],
        },
        {
          title: '계정 서비스가 하는 일',
          body: [
            '계정 서비스는 기기 인증, 멤버십 및 API 키를 관리합니다. 터미널 스트림은 처리하지 않습니다. 기기 인증을 해제해도 해당 기기에서 실행 중인 tmux 작업은 중지되지 않습니다',
          ],
        },
      ],
    },
    remoteHosts: {
      eyebrow: '원격 호스트',
      title: '기존 SSH 호스트를 같은 워크스페이스에서 사용',
      description: '호스팅 중계나 별도 터미널 계정 없이 기존 SSH 설정으로 원격 서버의 tmux 작업을 확인하세요',
      summary: '원격 서버에는 tmux만 설치하면 됩니다. AI Anywhere는 기존 SSH 설정을 사용해 해당 호스트를 로컬 기기와 나란히 표시합니다',
      sections: [
        {
          title: '원격 서버에 필요한 것',
          body: [
            '원격 호스트에는 tmux만 있으면 됩니다. SSH 키, 별칭, 점프 호스트, 호스트 키 검증은 내 기기에 이미 설정된 내용을 그대로 사용합니다',
          ],
          command: 'tmux new -s main',
        },
        {
          title: '세션은 원격 서버에 유지',
          body: [
            '명령과 Agent 프로세스는 원격 서버의 tmux 안에서 실행됩니다. 세션을 tmux.online으로 복사하거나 외부 중계를 통해 전달하지 않습니다',
          ],
        },
        {
          title: '연결이 끊겨도 작업은 계속',
          body: [
            '브라우저나 SSH 연결이 끊겨도 tmux는 멈추지 않습니다. 호스트에 다시 연결할 수 있게 되면 같은 작업을 열어 이어서 진행하세요',
          ],
        },
      ],
    },
    install: {
      eyebrow: '설치',
      title: 'macOS 또는 Linux에 AI Anywhere 설치',
      description: 'AI Anywhere CLI를 설치하고 로컬 tmux 웹 UI를 시작한 뒤 브라우저에서 기기를 인증하세요',
      summary:
        '설치 프로그램이 tmux와 Node.js를 확인하고 npm에서 @ai-anywhere/cli를 설치한 뒤 재부팅 후에도 로컬 서비스가 다시 시작되도록 설정합니다',
      sections: [
        {
          title: '설치 프로그램 실행',
          body: ['curl을 사용하거나 실행 전에 tmux.online/install.sh 내용을 확인하세요. tmux와 Node.js 22.5 이상이 필요합니다'],
          command: 'curl -fsSL https://tmux.online/install.sh | sh',
        },
        {
          title: '이 기기 인증',
          body: [
            '설치 프로그램이 AI Anywhere를 시작하고 로컬 URL을 열거나 출력합니다. 기기가 아직 인증되지 않았다면 로그인한 뒤 기기 인증을 완료하세요',
          ],
          command: 'ai-anywhere login',
        },
        {
          title: '나중에 다시 시작',
          body: [
            'macOS에서는 launchd, Linux에서는 systemd 사용자 유닛으로 설정됩니다. 직접 시작할 수도 있으며 웹 UI는 기본적으로 127.0.0.1:51984를 사용합니다',
          ],
          command: 'ai-anywhere up',
        },
      ],
    },
  },
}

const zhHant: GuideCollection = {
  navTitle: '使用指南',
  home: '首頁',
  pages: {
    tmuxWebUi: {
      eyebrow: 'tmux 網頁介面',
      title: '直接在瀏覽器操作正在執行的 tmux 工作階段',
      description: '在瀏覽器開啟現有的 tmux 工作階段，不必搬移終端機資料，就能切換 pane 並管理本機與 SSH 主機',
      summary: 'AI Anywhere 不會取代 tmux，而是在它之上加上瀏覽器介面。Shell 與 Agents 仍在原本啟動它們的機器上，由 tmux 持續執行',
      sections: [
        {
          title: '工作階段仍由 tmux 管理',
          body: [
            '本機伺服器會讀取 tmux 現有的工作階段、window 與 pane。開啟網頁介面不會重新啟動、複製或搬移任何工作階段',
            '關閉瀏覽器或網路斷線後，程序仍會在 tmux 中執行。重新打開頁面，就能回到同一個 pane',
          ],
        },
        {
          title: '在同一個畫面查看機器與任務',
          body: ['本機工作階段與透過既有 SSH 設定連線的主機，都會整理在同一個側邊欄'],
          bullets: [
            '從瀏覽器切換 tmux window 與 pane',
            '查看 AI 程式開發任務正在執行或等待輸入',
            '只要能連到那台機器，就能用手機開啟同一個工作區',
          ],
        },
        {
          title: '資料留在本機',
          body: ['網頁應用程式由 127.0.0.1 上的 AI Anywhere 本機程序提供。終端機輸出、按鍵輸入、檔案與憑證都不會經過 tmux.online'],
        },
      ],
    },
    claudeCodeBrowser: {
      eyebrow: 'Claude Code',
      title: '不搬移終端機，也能從瀏覽器操作 Claude Code',
      description: '讓 Claude Code 繼續在 tmux 中執行，透過瀏覽器查看狀態，並從電腦或手機回覆提示',
      summary: '照平常的方式在 tmux 中啟動 Claude Code。AI Anywhere 會在瀏覽器顯示同一個終端機，並標示 Claude 正在等待你回應的時刻',
      sections: [
        {
          title: '工作階段持續執行',
          body: [
            '關閉瀏覽器或 SSH 連線中斷後，Claude Code 仍會在 tmux 中執行。瀏覽器只是同一個工作階段的另一個畫面，不會啟動第二個 Claude 程序',
          ],
        },
        {
          title: '需要輸入時再回來',
          body: ['任務依機器分組，並顯示正在執行或等待輸入。打開等待中的任務，確認終端機脈絡後，直接在同一個 pane 回覆'],
          bullets: ['將每個子代理分開追蹤', '在多個程式碼庫之間切換，不必一直盯著終端機', '離開座位時也能用手機回應'],
        },
        {
          title: 'Claude 憑證保持原樣',
          body: ['AI Anywhere 不會要求或上傳 Anthropic 憑證。Claude Code 仍安裝在你的機器上，也只在那裡完成驗證'],
        },
      ],
    },
    codexBrowser: {
      eyebrow: 'Codex CLI',
      title: '從任何瀏覽器操作 Codex CLI 任務',
      description: '在 tmux 中執行 Codex CLI，集中查看平行的程式開發任務，只有任務需要輸入時才從瀏覽器介入',
      summary: '繼續使用你熟悉的終端機流程執行 Codex CLI。AI Anywhere 在本機顯示 tmux 工作階段，讓長時間任務不受分頁、裝置或斷線影響',
      sections: [
        {
          title: '每項任務的狀態一目了然',
          body: ['Codex 任務會對應到執行它的 tmux window。平行 Agents 與 worktrees 可以彼此分開，同時在同一個側邊欄查看各自的狀態'],
        },
        {
          title: '從另一個畫面介入',
          body: ['Codex 停下來等待決定時，可以用電腦瀏覽器或手機打開該任務，並在原本的終端機繼續處理'],
          bullets: ['不用同步第二個 Shell', '不會把終端機紀錄上傳至帳號服務', '不用讓筆電螢幕一直開著'],
        },
        {
          title: 'Codex 設定不必改動',
          body: ['Codex CLI、設定與憑證都留在原本的機器上。AI Anywhere 只替現有 tmux 工作階段加上瀏覽器介面與任務列表'],
        },
      ],
    },
    security: {
      eyebrow: '安全性',
      title: '終端機資料只留在你的機器上',
      description: '了解 AI Anywhere 的本機伺服器、連線 token、Origin 檢查、SSH 路徑，以及帳號服務的權限邊界',
      summary: 'AI Anywhere 是本機橋接程式，不是代管終端機。瀏覽器會連到與 tmux 位於同一台機器的程序，tmux.online 則負責公開網站與帳號授權',
      sections: [
        {
          title: '預設只限本機',
          body: ['伺服器預設只監聽 127.0.0.1。綁定這個位址的程序只能從同一台機器連線，無法直接從公開網際網路存取'],
        },
        {
          title: '每次連線都會查驗',
          body: ['本機網址包含連線 token，伺服器也會檢查請求的 Origin。任意網頁無法在背景偷偷連上已開啟的本機終端機'],
          bullets: [
            '終端機輸出與按鍵輸入不會送到帳號服務',
            '檔案與 CLI 憑證留在機器上',
            '遠端連線使用你自己的 SSH 設定，不經過外部終端機中繼',
          ],
        },
        {
          title: '帳號服務負責什麼',
          body: ['帳號服務負責授權裝置、管理會員資格與 API 金鑰，不會傳送終端機資料流。移除裝置授權也不會停止該機器上正在執行的 tmux 任務'],
        },
      ],
    },
    remoteHosts: {
      eyebrow: '遠端主機',
      title: '在同一個工作區使用既有的 SSH 主機',
      description: '沿用既有 SSH 設定查看遠端伺服器上的 tmux 任務，不需要代管中繼，也不用建立另一組終端機帳號',
      summary: '在遠端伺服器安裝 tmux 即可。AI Anywhere 會沿用你的 SSH 設定，並把該主機與本機並列顯示',
      sections: [
        {
          title: '遠端伺服器需要什麼',
          body: ['遠端主機只需要安裝 tmux。SSH 金鑰、別名、跳板主機與主機驗證，都沿用你機器上原有的設定'],
          command: 'tmux new -s main',
        },
        {
          title: '工作階段留在遠端',
          body: ['指令與 Agent 程序都在遠端伺服器的 tmux 中執行。AI Anywhere 不會將工作階段複製到 tmux.online，也不會經過外部終端機中繼'],
        },
        {
          title: '斷線不會中斷工作',
          body: ['瀏覽器或 SSH 連線中斷後，tmux 仍會繼續執行。主機重新連得上時，打開同一項任務便能接著處理'],
        },
      ],
    },
    install: {
      eyebrow: '安裝',
      title: '在 macOS 或 Linux 安裝 AI Anywhere',
      description: '安裝 AI Anywhere CLI、啟動本機 tmux 網頁介面，並從瀏覽器完成裝置授權',
      summary: '安裝程式會檢查 tmux 與 Node.js、從 npm 安裝 @ai-anywhere/cli，並設定本機服務在重新開機後自動恢復',
      sections: [
        {
          title: '執行安裝程式',
          body: ['使用 curl，或先開啟 tmux.online/install.sh 檢查腳本內容。需要 tmux 與 Node.js 22.5 以上版本'],
          command: 'curl -fsSL https://tmux.online/install.sh | sh',
        },
        {
          title: '授權這台裝置',
          body: ['安裝程式會啟動 AI Anywhere，並開啟或印出本機網址。若裝置尚未授權，請登入並完成裝置授權流程'],
          command: 'ai-anywhere login',
        },
        {
          title: '之後再次啟動',
          body: ['macOS 會使用 launchd，Linux 則使用 systemd 使用者單元。你也可以直接啟動；網頁介面預設位於 127.0.0.1:51984'],
          command: 'ai-anywhere up',
        },
      ],
    },
  },
}

const collections: Record<Lang, GuideCollection> = { en, ja, ko, 'zh-Hant': zhHant }

export function useGuides(lang: Lang): GuideCollection {
  return collections[lang] ?? en
}
