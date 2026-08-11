export const parakoProject = { id:'parako-shadow-test', name:'私立パラの丸高校', sub:'@parako · Shadow Ban Test', mark:'パ' };

export const parakoProjectDetails = {
  owner:'Mina Rho', deadline:'Test / No deadline',
  requirement:'公開データとYouTube Studioデータを分離し、Channel Health・SEO・運用改善を監査',
  campaign:'@parako Channel Health / SEO Test', platforms:'YouTube · Shorts',
  source:'https://www.youtube.com/@parako', defaultNode:'shadow'
};

export const parakoWorks = [
  { id:'pm', name:'AI Project Manager', icon:'✦', cls:'pm', x:38, y:6, status:'In Progress', type:'progress', detail:'Studio data import待ち · Audit plan管理中', progress:72 },
  { id:'research', name:'Research Agent', icon:'◎', cls:'mint-bg', x:10, y:38, status:'Completed', type:'done', detail:'公開Channel snapshotと外部データを確認済み', progress:100 },
  { id:'shadow', name:'ShadowBan / SEO Agent', icon:'⬡', cls:'orange-bg', x:42, y:38, status:'Review', type:'progress', detail:'公開データ監査完了 · Studio検証待ち', progress:82 },
  { id:'operations', name:'Operations Agent', icon:'⌘', cls:'mint-bg', x:72, y:38, status:'Planned', type:'waiting', detail:'28 / 90日モニタリングを設定', progress:0 }
];

export const parakoShadowResult = {
  agent:'shadow', projectId:'parako-shadow-test', createdAt:'2026-08-11T12:00:00.000Z',
  publicSnapshot:[
    { metric:'Subscribers', value:'1,279,746', change:'+20K / last 28 days (+1.6%)', source:'SocialCounts', status:'healthy' },
    { metric:'Total views', value:'2,210,041,033', change:'+137M / last 28 days (+6.7%)', source:'SocialCounts', status:'healthy' },
    { metric:'Published videos', value:'1,835', change:'+88 / last 28 days (+5.0%)', source:'SocialCounts', status:'review' },
    { metric:'Weekly public views', value:'9.83M–25.2M', change:'Jan–Apr 2026 observed range', source:'SocialCounts', status:'review' },
    { metric:'Representative MV', value:'113,645 views', change:'7,995 likes · 7% engagement', source:'Yutura snapshot', status:'healthy' }
  ],
  dataCoverage:{
    publicAvailable:['Channel identity / handle','Subscribers / total views / video count','Public growth snapshots','Publishing cadence','Selected video-level views and likes'],
    studioRequired:['Impressions by content and date','Shorts feed / Browse / Suggested / Search traffic share','Impressions CTR','Average view duration / retention / Stayed to watch','Policy warnings / Copyright / Content ID','Search queries and returning viewers']
  },
  evidenceSources:[
    { title:'YouTube · @parako', url:'https://www.youtube.com/@parako', note:'Official channel URL' },
    { title:'SocialCounts public snapshot', url:'https://socialcounts.org/youtube-channel-analytics/UC438NzuH3byhVc9KSXKc8ZA', note:'Public counts and 28-day change snapshot' },
    { title:'vidIQ channel statistics', url:'https://vidiq.com/youtube-stats/channel/%40parako/', note:'Independent public snapshot; counts vary by capture date' },
    { title:'HypeAuditor public statistics', url:'https://hypeauditor.com/youtube/UC438NzuH3byhVc9KSXKc8ZA/', note:'Public view range and engagement indicators' },
    { title:'Yutura · Better Better MV', url:'https://yutura.net/channel/57738/video/WgrnWdZMSOY/', note:'Representative video snapshot' }
  ],
  diagnosis:{
    healthScore:84, riskLevel:'Low public-data risk · Studio verification required', confirmedRestriction:false,
    diagnosis:'公開データでは登録者・視聴回数とも増加しており、チャンネル全体の重大な配信抑制を示す継続的な崩れは確認できません。公開データだけでは個別動画の推薦・検索露出やPlatform restrictionを確定できないため、最終判定にはYouTube Studio exportが必要です。',
    confidence:'Medium for public reach · Limited for platform restrictions',
    disclaimer:'公開数値の変動だけでShadow Banとは断定しません。外部サイトの数値は取得日の異なるsnapshotであり、YouTube Studioを正本として照合します。',
    likelyCauses:[
      { cause:'Creative / series mixによる通常変動', likelihood:'High', evidence:'週次公開視聴は約9.83M〜25.2Mの範囲で変動する一方、28日成長はプラス。', alternativeExplanation:'Shorts feed配信の変化はStudio traffic sourceで確認が必要。' },
      { cause:'高頻度投稿によるコンテンツ間競合', likelihood:'Medium', evidence:'公開snapshotでは28日間に約88本増加。', alternativeExplanation:'高頻度自体は制限の証拠ではなく、視聴者需要に合えば成長要因にもなる。' },
      { cause:'Channel-wide platform restriction', likelihood:'Low / unconfirmed', evidence:'公開規模と直近成長は重大な全体抑制と整合しにくい。', alternativeExplanation:'一部動画・機能単位の制限はPolicy画面なしでは否定できない。' }
    ],
    actions:[
      { priority:'P0', action:'YouTube Studio 28日 / 90日 CSVを取り込む', owner:'Channel owner', reason:'公開データでは見えない露出・流入・維持率を確定する。', successMetric:'Impressions / traffic source / retentionの欠損ゼロ' },
      { priority:'P0', action:'Policy・Copyright・Content IDを確認', owner:'Channel admin', reason:'明示的制限の有無を最優先で確認する。', successMetric:'全通知をEvidence欄へ記録' },
      { priority:'P1', action:'直近50本をSeries / Character / Hook / Formatで分類', owner:'TEGY', reason:'勝ち筋と失速をShadow Banではなく企画要因まで分解する。', successMetric:'50本のinventory完成' },
      { priority:'P1', action:'Shorts feed・Browse・Suggested・Searchを分離比較', owner:'TEGY', reason:'配信面ごとの変化を全体低下と混同しない。', successMetric:'28日対90日baseline比較' },
      { priority:'P2', action:'Title / Description / keyword clusterのA/B運用', owner:'SEO / Operations', reason:'キャラクター名・シリーズ名・検索意図をmetadataに接続する。', successMetric:'Search viewsと検索語カバレッジ改善' },
      { priority:'P2', action:'投稿密度テスト', owner:'Operations', reason:'コンテンツ間競合とaudience fatigueを検証する。', successMetric:'1本あたり7日視聴とreturning viewers改善' }
    ],
    verificationSteps:['StudioからAdvanced modeの28日 / 90日データをCSV export','Content単位でShorts feed・Browse・Suggested・Searchを比較','制限・著作権・Content ID通知を原文保存','直近50本のmetadataと公開後24h / 7d performanceを結合','毎週同曜日にsnapshotを保存し季節変動を除外'],
    monitoringMetrics:['Views / 24h・7d by format','Shorts feed / Browse / Suggested / Search share','Stayed to watch / Average percentage viewed','Returning viewers / New viewers','Search queries / CTR','Policy and Copyright events']
  },
  signalAnalysis:{ signals:[
    { status:'healthy', label:'Public reach', value:'2.21B total · +137M / 28d', unit:'' }, { status:'healthy', label:'Subscriber growth', value:'+20K / 28d', unit:'' },
    { status:'review', label:'Publishing volume', value:'+88 videos / 28d', unit:'' }, { status:'review', label:'Weekly variability', value:'9.83M–25.2M', unit:' views' },
    { status:'needs-data', label:'Impressions / CTR', value:'Needs YouTube Studio', unit:'' }, { status:'needs-data', label:'Recommendation / Search', value:'Needs YouTube Studio', unit:'' },
    { status:'needs-data', label:'Retention / Stayed to watch', value:'Needs YouTube Studio', unit:'' }, { status:'needs-data', label:'Policy / Content ID', value:'Needs Channel Admin', unit:'' }
  ]},
  contentAudit:{
    technicalRisks:[
      { status:'verified', area:'Channel identity', evidence:'@parako / Channel ID UC438NzuH3byhVc9KSXKc8ZAを公開sourceで照合。', recommendation:'Studio exportでも同一Channel IDを確認。' },
      { status:'needs-data', area:'Distribution diagnostics', evidence:'Impressions・CTR・traffic sourceは公開されていない。', recommendation:'Studio Advanced mode CSVを追加。' },
      { status:'needs-data', area:'Policy / Rights', evidence:'公開ページから警告・Content ID状態は確認できない。', recommendation:'Channel adminがPolicy / Copyright画面を確認。' }
    ],
    operationalRisks:[
      { status:'review', area:'High publishing frequency', evidence:'公開snapshotでは28日で約88本増加。', recommendation:'投稿本数ではなく1本あたり24h / 7d performanceで最適化。' },
      { status:'review', area:'Format concentration', evidence:'Short anime comedyを中核とする明確なformat。', recommendation:'Character / series / hook別にcluster比較し、勝ちformatを特定。' },
      { status:'healthy', area:'Public growth', evidence:'登録者・視聴回数とも直近28日snapshotでプラス。', recommendation:'同じ基準日で週次snapshotを継続。' }
    ],
    seoGaps:['直近50本のTitle・Description・Hashtag inventoryが未接続','YouTube Search queriesとSearch viewsが未接続','Character / series名のkeyword cluster比較が未実施','Shorts feedとSearch起点の成果を分離できていない','日本語表記ゆれ・英語表記・略称の検索カバレッジ未確認']
  },
  recoveryWorkflow:{ phases:[
    { period:'Day 0–7', phase:'Evidence Lock', objective:'制限の有無とbaselineを確定', tasks:['Studio 28 / 90 day export','Policy / Copyright確認','直近50本inventory作成'], exitCriteria:['必須データ取得','明示的制限の有無を記録'] },
    { period:'Day 8–30', phase:'Content & SEO Test', objective:'企画要因と配信面要因を分離', tasks:['Series / Hook cluster分析','Metadata test','投稿密度test'], exitCriteria:['2週間以上の比較データ','勝ちclusterを特定'] },
    { period:'Day 31–90', phase:'Scale Learning', objective:'再現可能な運用ループへ移行', tasks:['勝ちformatへ配分','週次health dashboard','月次Research / Script feedback'], exitCriteria:['指標がbaseline以上','改善ルールをOperationsへ保存'] }
  ]}
};
