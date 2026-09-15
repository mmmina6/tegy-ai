# Task UI・操作確認稿

> 状態：確認用ドラフト。現時点では本番 UI／データベースに実装しない。

## 1. Task の位置づけ

TEGY の固定構造は **Project → Work → Task → Deliverable** とする。

- Project：顧客単位の案件
- Work：Research、Script、Shadow Ban / SEO、Anime、Video、Operations などの仕事
- Task：人または AI が実行・確認する具体的な作業
- Deliverable：Research Report、Script、絵コンテ、Video、運用レポートなどの納品物

Task を Canvas 上の独立した大きなカードにはしない。Work が大量に増えても見通しを保つため、Canvas には Work と進行率だけを表示し、Task は Work 内で管理する。

## 2. 推奨する最小 UI

### Project Canvas

Work card に以下だけ表示する。

- Work 名
- 進行率
- 未完了 Task 数
- 次の Task
- Block の有無

### Work Workspace

上部または右側に小さな `Tasks` ボタンを置く。開くと一覧を表示する。

- Task 名
- 担当者
- 期限
- 優先度
- 状態
- 関連 Deliverable

Task をクリックすると小さな詳細パネルを開く。Workspace 全体を別画面へ移動させない。

### My Tasks

サイト全体の右下に、Notion の To-do に近い折りたたみ式の小窓を置く。

- 今日
- 期限間近
- 確認待ち
- Block

参加している Project の Task だけを表示する。トップ画面の構造は変えない。

## 3. AI Project Manager の役割

AI Project Manager は Research 結果や Work の状態を読み、次の Task を提案する。ただし、自動で大量の Task を確定しない。

1. AI が Task 候補、担当候補、期限候補を提示
2. 人が確認・修正
3. `Taskを追加` で確定
4. 完了時に Deliverable または次工程へ接続

## 4. 初回リリースの状態

- 未着手
- 進行中
- 確認待ち
- 完了
- Block

初回は複雑な Kanban、工数入力、細かなサブタスク階層を入れない。

## 5. 確認が必要な点

- My Tasks 小窓は右下でよいか
- AI の Task 提案は毎回人が承認する形でよいか
- Task 詳細は右側パネルか、中央の小さな Modal のどちらが使いやすいか
- 担当者は一人を基本とし、Reviewer を別に持つか
- 通知は「当日」「期限超過」「確認依頼」「Block」だけでよいか

この5点を実際の画面案で確認後、正式な Task UI とデータ保存を実装する。
