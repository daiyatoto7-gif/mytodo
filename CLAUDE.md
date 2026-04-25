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
SUPABASE_SERVICE_ROLE_KEY=
```

## ディレクトリ構成

```
app/
  (auth)/login/        - ログインページ
  (app)/today/         - 今日のビュー
  (app)/all/           - 全タスクビュー
  (app)/calendar/      - カレンダービュー
  (app)/menu/          - メニュー（カテゴリ管理）
  (app)/task/[id]/     - タスク詳細
  actions/             - Server Actions (tasks, subtasks, categories, auth)
  api/auth/callback/   - Supabase OAuth callback
components/            - 共通コンポーネント
lib/supabase/          - Supabase client (browser/server/middleware)
types/                 - TypeScript型定義
supabase/migrations/   - DBマイグレーション
```

## Supabase セットアップ

1. Supabaseプロジェクト作成
2. `supabase/migrations/001_initial_schema.sql` を実行
3. Authentication > Providers で Google OAuth を有効化
4. `.env.local` に接続情報を設定

## 開発フェーズ

- **Phase 1** (現在): 認証・タスクCRUD・カテゴリ・PWA基本設定 ✅
- **Phase 2**: サブタスク強化・フィルタ・カレンダービュー改善
- **Phase 3**: Web Push通知 (FCM)
- **Phase 4**: Google Calendar連携
