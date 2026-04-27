# mytodo

個人タスク管理PWA。Next.js 14 (App Router) + TypeScript + Supabase + Tailwind CSS。

## 技術スタック

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **PWA**: next-pwa
- **Icons**: lucide-react
- **Date**: date-fns

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動
npm run build   # ビルド
npm run lint    # Lint
```

## 環境変数 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Supabase Dashboard → Settings → API

# Firebase (Phase 3)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=  # Firebase Console → Cloud Messaging → Web Push証明書

# Google Calendar (Phase 4)
GOOGLE_CLIENT_ID=                # Google Cloud Console → APIs & Services → Credentials
GOOGLE_CLIENT_SECRET=            # Google Cloud Console → APIs & Services → Credentials
NEXT_PUBLIC_APP_URL=http://localhost:3000   # 本番ではhttps://ドメイン
```

## Supabase Edge Function シークレット

```bash
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## ディレクトリ構成

```
app/
  (auth)/login/        - ログインページ
  (app)/today/         - 今日のビュー
  (app)/all/           - 全タスクビュー
  (app)/calendar/      - カレンダービュー（Googleカレンダーイベント表示含む）
  (app)/menu/          - メニュー（カテゴリ管理・Google Calendar連携）
  (app)/task/[id]/     - タスク詳細（リマインダー設定・カレンダー同期含む）
  actions/             - Server Actions (tasks, subtasks, categories, auth, reminders, notifications, google-calendar)
  api/auth/callback/   - Supabase OAuth callback
  api/auth/google-calendar/         - Google Calendar OAuth開始
  api/auth/google-calendar/callback/ - Google Calendar OAuthコールバック
components/            - 共通コンポーネント
hooks/                 - カスタムフック (useNotification)
lib/firebase/          - Firebase client
lib/google-calendar.ts - Google Calendar API helpers
lib/supabase/          - Supabase client (browser/server/middleware)
types/                 - TypeScript型定義
worker/                - next-pwa カスタムワーカー（push通知ハンドラ）
public/
  firebase-messaging-sw.js  - FCM フォールバックSW（開発用）
supabase/
  migrations/          - DBマイグレーション (001_initial_schema.sql, 002_google_calendar.sql)
  functions/
    send-reminders/    - Cron Edge Function（毎分実行）
```

## Supabase セットアップ

1. Supabaseプロジェクト作成
2. `supabase/migrations/001_initial_schema.sql` を実行
3. Authentication > Providers で Google OAuth を有効化
4. `.env.local` に接続情報を設定

## 開発フェーズ

- **Phase 1**: 認証・タスクCRUD・カテゴリ・PWA基本設定 ✅
- **Phase 2**: カテゴリ/優先度フィルタ・ソート・カレンダー改善 ✅
- **Phase 3**: Web Push通知 (FCM) + リマインダーUI ✅
- **Phase 4**: Google Calendar双方向連携 ✅

## Phase 3 セットアップ手順

1. Firebase Console でプロジェクト作成・ウェブアプリ登録
2. Cloud Messaging → VAPID 鍵を生成
3. サービスアカウント JSON をダウンロード
4. `.env.local` に Firebase 環境変数を設定
5. Supabase Edge Function のシークレットを設定（上記コマンド参照）
6. Edge Function をデプロイ: `supabase functions deploy send-reminders`
7. Cron ジョブを設定（Supabase Dashboard → Edge Functions → send-reminders → Schedule）
   スケジュール: `* * * * *`（毎分）
