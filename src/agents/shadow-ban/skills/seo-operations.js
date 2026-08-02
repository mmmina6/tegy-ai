const text = value => String(value || '').trim();

export function buildSeoOperations(snapshot = {}) {
  const source = text(snapshot.seoInventory || snapshot.recentContentNotes);
  const checks = [
    ['search-queries','YouTube Search queries','导出带来流量的实际搜索词，并与标题承诺逐条对齐。'],
    ['titles','Titles','检查主题是否明确、是否符合搜索意图、是否存在夸张或重复模板。'],
    ['descriptions','Descriptions','前两行说明视频价值；补充自然语言上下文和必要链接。'],
    ['keywords','Keywords & entities','覆盖主题实体和观众用语，不堆砌同义词。'],
    ['hashtags','Hashtags','仅保留直接相关标签；数量不是排名目标。'],
    ['topic-cluster','Topic consistency','把视频归入稳定主题集群，识别突然偏题造成的受众错配。'],
    ['thumbnail-title','Thumbnail / title match','确认缩略图、标题和视频实际内容一致。']
  ].map(([id, area, action]) => ({ id, area, status: source ? 'ready-for-review' : 'needs-data', action }));
  return {
    checks,
    requiredInputs: source ? [] : ['直近 50 条视频标题', '说明栏', '主要关键词/Hashtag', 'YouTube Search queries 与流量', '缩略图或链接'],
    sourceProvided: Boolean(source)
  };
}
