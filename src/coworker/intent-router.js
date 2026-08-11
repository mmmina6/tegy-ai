const rules = [
  ['manager', /次に進め|次の仕事|優先順位|project\s*(?:plan|status)|プロジェクト.*(?:整理|計画)/i],
  ['animation', /anime|アニメ|漫画|マンガ|motion\s*comic/i],
  ['shadow', /shadow\s*ban|シャドウバン|seo|チャンネル分析|channel\s*(?:audit|analysis)|youtube.*(?:分析|診断)/i],
  ['research', /research|リサーチ|市場調査|競合調査|競合分析|market\s*research/i],
  ['operations', /operations?|運用|投稿予定|投稿計画|content\s*calendar|レポート/i],
  ['video', /video|動画編集|映像制作|撮影|素材.*(?:編集|整理)/i],
  ['script', /script|脚本|台本|広告.*(?:作|生成)|youtube.*(?:台本|構成)/i]
];

export function detectCoworkerIntent(message = '') {
  return rules.find(([, pattern]) => pattern.test(message))?.[0] || 'script';
}

export function workNameForIntent(intent) {
  return ({ manager:'AI Project Manager', research:'Research Agent', script:'Script Agent', shadow:'ShadowBan Agent', animation:'AI Anime Agent', video:'Video Agent', operations:'Operations Agent' })[intent] || 'Script Agent';
}

export function coworkerConfirmation(intent) {
  return ({
    manager:'Projectの状況を整理しました。次の仕事と確認事項を一緒に決めましょう。',
    animation:'Animeの内容を読み取りました。画風だけ確認してください。',
    shadow:'チャンネル診断として整理しました。対象URLとデータ範囲を確認してください。',
    research:'Research Workとして整理しました。調査範囲を確認してください。',
    operations:'Operations Workとして整理しました。対象Channelと期間を確認してください。',
    video:'Video Workとして整理しました。素材と納品形式を確認してください。'
  })[intent] || 'Script Workとして整理しました。';
}
