const text = value => String(value || '').trim();

export function buildSeoOperations(snapshot = {}) {
  const source = text(snapshot.seoInventory || snapshot.recentContentNotes);
  const checks = [
    ['search-queries','YouTube Search queries','実際に流入した検索語句を出力し、タイトルの訴求と1本ずつ照合します。'],
    ['titles','Titles','テーマ、検索意図との一致、誇張表現、テンプレート重複を確認します。'],
    ['descriptions','Descriptions','冒頭2行で動画の価値を伝え、自然な文脈と必要なリンクを追加します。'],
    ['keywords','Keywords & entities','テーマの主要エンティティと視聴者の言葉を含め、類義語の詰め込みを避けます。'],
    ['hashtags','Hashtags','動画に直接関連するタグだけを残します。タグ数自体をランキング目標にしません。'],
    ['topic-cluster','Topic consistency','動画を安定したtopic clusterに分類し、急なテーマ変更によるaudience mismatchを確認します。'],
    ['thumbnail-title','Thumbnail / title match','サムネイル、タイトル、動画内容が一致しているか確認します。']
  ].map(([id, area, action]) => ({ id, area, status: source ? 'ready-for-review' : 'needs-data', action }));
  return { checks, requiredInputs: source ? [] : ['直近50本のタイトル', 'Description', '主要Keywords / Hashtags', 'YouTube Search queriesと流入数', 'サムネイルまたは動画URL'], sourceProvided: Boolean(source) };
}
