import type { Lang } from './index'

/**
 * Release notes for @ai-anywhere/cli, newest first.
 *
 * English is the baseline; other languages translate per release. A missing translation falls
 * back to English rather than hiding the release — shipping the fact beats waiting for the prose.
 * Lives in i18n because it is copy (and because the ASCII gate exempts only this directory).
 *
 * Data, not prose in a component, so adding a release touches exactly one file. Dates are the
 * dates the version's tag was cut in the core repo.
 */

export interface Release {
  version: string
  /** ISO date (YYYY-MM-DD), the day the release tag was cut. */
  date: string
  /** One user-facing line per change; no trailing periods, matching the site's copy style. */
  changes: { en: string[] } & Partial<Record<Lang, string[]>>
}

/** The list a given page renders, and whether it is a fallback (so the markup can say lang="en"). */
export const changesFor = (release: Release, lang: Lang): { items: string[]; translated: boolean } => {
  const items = release.changes[lang]
  return items ? { items, translated: true } : { items: release.changes.en, translated: lang === 'en' }
}

export const releases: Release[] = [
  {
    version: '0.0.18',
    date: '2026-08-21',
    changes: {
      en: [
        'Task folders now have a clearer hierarchy with folder and machine icons, indented children, and a separate ungrouped section',
        'Folder and machine totals now count tabs, including live merged tabs, instead of counting only task rows',
      ],
      ja: [
        'タスクフォルダーの階層を明確化。フォルダーとマシンのアイコン、子タスクのインデント、独立した未分類セクションを追加',
        'フォルダーとマシンの件数はタスク行ではなくタブ数を表示し、ライブで結合されたタブも集計',
      ],
      ko: [
        '작업 폴더 계층이 더 명확해졌습니다. 폴더와 컴퓨터 아이콘, 하위 작업 들여쓰기, 별도의 미분류 섹션을 추가했습니다',
        '폴더와 컴퓨터 합계가 작업 행 수 대신 탭 수를 표시하며, 실시간으로 병합된 탭도 포함합니다',
      ],
      'zh-Hant': [
        '任務文件夾層級更清楚：加入文件夾與機器圖示、子任務縮排，以及獨立的未分組區段',
        '文件夾與機器總數現在計算分頁，包含即時合併進來的分頁，不再只計算任務列',
      ],
    },
  },
  {
    version: '0.0.17',
    date: '2026-08-20',
    changes: {
      en: [
        'A host that cannot be reached now shows that it is still being retried, with a button to try again straight away instead of waiting for the next poll',
      ],
      ja: ['到達できないホストは、再試行が続いていることを表示するようになりました。次のポーリングを待たずにすぐ再試行できるボタン付き'],
      ko: ['연결할 수 없는 호스트가 계속 재시도 중임을 표시합니다. 다음 폴링을 기다리지 않고 바로 다시 시도하는 버튼도 함께'],
      'zh-Hant': ['無法連線的主機現在會顯示仍在重試，並附上立即重試的按鈕，不必等下一次輪詢'],
    },
  },
  {
    version: '0.0.16',
    date: '2026-08-20',
    changes: {
      en: [
        'Auto retry: when a CLI reports its turn ended in error and its own retries have given up, the server types a retry command into the pane for you - with an attempt budget and growing backoff, and a notice on the pane so you can tell "it retried" from "it hung". Runs on the server, so it works with every browser closed. Toggle, retry text and attempt cap live in Settings',
        'Pi sessions now report failed runs, so auto retry covers them too',
        'An approved phone is now a full client: every window, every capability, same as the desktop. Approving new devices stays on the desktop',
        'Web settings hide the dropped-file path section on browsers that cannot grant a folder',
      ],
      ja: [
        '自動リトライ: CLI がターンのエラー終了を報告し、内蔵リトライも諦めたあと、サーバーが代わりにリトライ指示をペインに入力します。試行回数の上限と漸増バックオフ付きで、ペインに通知が残るため「リトライした」と「固まった」を見分けられます。サーバー側で動くので、ブラウザを全部閉じていても有効。オン/オフ・リトライ文言・上限は設定から',
        'pi セッションが失敗した実行を報告するようになり、自動リトライの対象になりました',
        '承認済みのスマホは完全なクライアントに: すべてのウィンドウ、すべての機能をデスクトップと同等に。新しいデバイスの承認はデスクトップのみのまま',
        'フォルダーを許可できないブラウザーでは、Web 設定のドロップファイルのパス項目を非表示に',
      ],
      ko: [
        '자동 재시도: CLI가 턴이 오류로 끝났다고 보고하고 자체 재시도도 포기하면, 서버가 대신 재시도 명령을 패인에 입력합니다. 시도 횟수 예산과 점증 백오프가 있고, 패인에 알림이 남아 "재시도했다"와 "멈췄다"를 구분할 수 있습니다. 서버에서 실행되므로 브라우저를 모두 닫아도 동작합니다. 켜기/끄기, 재시도 문구, 횟수 한도는 설정에서',
        'pi 세션이 실패한 실행을 보고하게 되어 자동 재시도가 적용됩니다',
        '승인된 휴대폰은 이제 완전한 클라이언트: 모든 창, 모든 기능을 데스크톱과 동일하게 사용합니다. 새 기기 승인은 데스크톱에서만',
        '폴더를 허용할 수 없는 브라우저에서는 웹 설정의 드롭 파일 경로 섹션을 숨깁니다',
      ],
      'zh-Hant': [
        '自動重試：當 CLI 回報該輪以錯誤結束、且其內建重試已放棄時，服務端會代你把重試指令輸入到終端——附帶次數預算與遞增退避，並在窗格留下通知，讓你分得清「重試過了」和「掛住了」。在服務端執行，關閉所有瀏覽器也有效。開關、重試指令與次數上限都在設定中',
        'pi 會話現在會回報失敗的執行，自動重試也涵蓋它',
        '獲批准的手機現在是完整客戶端：每個視窗、每項能力，與桌面相同。批准新裝置仍只在桌面進行',
        '瀏覽器無法授權資料夾時，Web 設定會隱藏拖放檔案路徑區塊',
      ],
    },
  },
  {
    version: '0.0.15',
    date: '2026-08-19',
    changes: {
      en: [
        'Bracketed paste is restored on attach for every AI CLI, so a multi-line paste stays one message instead of one submit per line',
        'The CLI offers to install an upgrade instead of describing it, and asks at most once a day',
      ],
      ja: [
        'すべての AI CLI で再アタッチ時にブラケットペーストを復元。複数行の貼り付けが 1 行ごとの送信にならず、1 つのメッセージのままに',
        'CLI はアップグレードを説明するだけでなくインストールを提案し、確認は 1 日 1 回まで',
      ],
      ko: [
        '모든 AI CLI에서 재연결 시 괄호 붙여넣기 모드를 복원하여, 여러 줄 붙여넣기가 줄마다 전송되지 않고 하나의 메시지로 유지됩니다',
        'CLI가 업그레이드를 설명하는 대신 설치를 제안하며, 하루 한 번만 묻습니다',
      ],
      'zh-Hant': [
        '每個 AI CLI 重新連上時都會恢復括號貼上模式，多行貼上仍是一則訊息，不會逐行送出',
        'CLI 會直接提出安裝升級，而不只是描述它，且一天最多詢問一次',
      ],
    },
  },
  {
    version: '0.0.14',
    date: '2026-08-19',
    changes: {
      en: [
        'Phones grew up: their own entry point, a task drawer, screenshot paste into the message box, and a readable text view of any pane instead of an 80-column picture',
        'A paired device collects windows; the desktop shows which phones are connected and can cut any of them off',
        'Pick which address the QR code points at',
        'Failed turns land on the dashboard\'s "Needs me" list, and a failed turn can stop being true once you deal with it',
        "Smoother scrolling under a finger, tappable controls, and a phone can no longer re-grid the desktop's window",
      ],
      ja: [
        'スマホが一人前に: 専用の入口、タスクドロワー、メッセージ欄へのスクリーンショット貼り付け、そして 80 桁の画像ではなく読めるテキストでのペイン表示',
        'ペアリング済みデバイスは複数のウィンドウを持てます。デスクトップには接続中のスマホが表示され、いつでも切断できます',
        'QR コードが指すアドレスを選択可能に',
        '失敗したターンはダッシュボードの「要対応」リストに載り、対処すれば消えます',
        '指でのスクロールが滑らかに、コントロールはタップ可能に。スマホがデスクトップのウィンドウの格子を変えることもなくなりました',
      ],
      ko: [
        '휴대폰이 한층 성숙해졌습니다: 전용 입구, 작업 서랍, 메시지 입력창에 스크린샷 붙여넣기, 그리고 80칸 그림 대신 읽을 수 있는 텍스트로 보는 패인 보기',
        '페어링된 기기는 여러 창을 모을 수 있고, 데스크톱에서 연결된 휴대폰을 확인하고 언제든 끊을 수 있습니다',
        'QR 코드가 가리킬 주소를 선택할 수 있습니다',
        '실패한 턴은 대시보드의 "내 확인 필요" 목록에 표시되고, 처리하면 사라집니다',
        '손가락 스크롤이 부드러워지고 컨트롤을 탭할 수 있으며, 휴대폰이 데스크톱 창의 격자를 바꾸는 일이 없어졌습니다',
      ],
      'zh-Hant': [
        '手機長大了：自己的入口、任務抽屜、把截圖貼進訊息框，以及任何窗格的可讀文字檢視，而不是一張 80 欄的圖片',
        '配對的裝置可收集多個視窗；桌面會顯示哪些手機已連線，並可隨時切斷任何一台',
        '可選擇 QR code 指向哪個位址',
        '失敗的輪次會出現在儀表板的「需要我」清單，處理後標記也會消失',
        '手指滑動更順、控制項可點按，且手機不會再改變桌面視窗的格線',
      ],
    },
  },
  {
    version: '0.0.13',
    date: '2026-08-18',
    changes: {
      en: ['Dashboard task chips cluster by group, and toasts carry the CLI mark on the title'],
      ja: ['ダッシュボードのタスクチップをグループごとにまとめ、トーストのタイトルに CLI マークを表示'],
      ko: ['대시보드 작업 칩이 그룹별로 묶이고, 토스트 제목에 CLI 마크가 표시됩니다'],
      'zh-Hant': ['儀表板任務籤依群組聚合，toast 標題帶上 CLI 標記'],
    },
  },
  {
    version: '0.0.12',
    date: '2026-08-18',
    changes: {
      en: ['The upgrade prompt fires whenever the published version differs, not only when it is newer'],
      ja: ['公開バージョンが異なれば常にアップグレードを促すように——新しい場合だけではなく'],
      ko: ['게시된 버전이 다르기만 하면 업그레이드를 안내합니다 - 더 새로울 때만이 아니라'],
      'zh-Hant': ['只要發布版本與本機不同就會提示升級，而不只在較新時'],
    },
  },
  {
    version: '0.0.11',
    date: '2026-08-18',
    changes: {
      en: [
        'First published release of the AI Anywhere bridge: chat with the AI CLIs on your machine (claude, codex, gemini, ...) from a browser side panel or the web dashboard',
        'Hand one tmux window to a phone by QR code, behind --share',
        'Remote hosts over ssh, per-account scratch dirs, and connected hosts marked with the app-wide green check',
        'Published to npm via Trusted Publishing (OIDC), no long-lived token',
      ],
      ja: [
        'AI Anywhere ブリッジの最初の公開リリース: ブラウザのサイドパネルや Web ダッシュボードから、手元のマシンの AI CLI(claude、codex、gemini など)と対話できます',
        'QR コードで tmux ウィンドウを 1 つスマホに渡せます(--share が必要)',
        'ssh 経由のリモートホスト、アカウントごとのスクラッチディレクトリ、接続済みホストには全体共通の緑チェックを表示',
        'npm の Trusted Publishing(OIDC)で公開。長期トークンなし',
      ],
      ko: [
        'AI Anywhere 브리지의 첫 공개 릴리스: 브라우저 사이드 패널이나 웹 대시보드에서 내 컴퓨터의 AI CLI(claude, codex, gemini 등)와 대화할 수 있습니다',
        'QR 코드로 tmux 창 하나를 휴대폰에 넘길 수 있습니다(--share 필요)',
        'ssh 원격 호스트, 계정별 스크래치 디렉터리 지원, 연결된 호스트에는 공통 초록 체크 표시',
        'npm Trusted Publishing(OIDC)으로 게시, 장기 토큰 없음',
      ],
      'zh-Hant': [
        'AI Anywhere 橋接的首個公開版本：從瀏覽器側邊欄或 Web 儀表板，與你機器上的 AI CLI（claude、codex、gemini⋯）對話',
        '透過 QR code 把單個 tmux 視窗交給手機（需 --share）',
        '支援 ssh 遠端主機、每帳號獨立暫存目錄，已連線主機以全站綠色勾號標示',
        '透過 npm Trusted Publishing（OIDC）發布，無長期 token',
      ],
    },
  },
]
