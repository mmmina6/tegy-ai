export const SCRIPT_TYPES = {
  advertisement: {
    id: 'advertisement', label: 'Advertisement Script', defaultDuration: 30,
    purpose: '短時間でAttention、Benefit、Proof、CTAを設計する広告脚本',
    requiredStructure: ['Hook', 'Problem / Desire', 'Benefit', 'Reason to believe', 'CTA']
  },
  youtube_shooting: {
    id: 'youtube_shooting', label: 'YouTube Shooting Script', defaultDuration: 480,
    purpose: '撮影現場で使えるA-roll、B-roll、Camera、Audioを含むYouTube台本',
    requiredStructure: ['Cold open', 'Introduction', 'Main chapters', 'Recap', 'CTA / Next video']
  }
};

export function resolveScriptType(value) {
  return SCRIPT_TYPES[value] || SCRIPT_TYPES.advertisement;
}
