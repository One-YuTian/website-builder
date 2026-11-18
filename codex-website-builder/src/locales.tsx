export type LocalePreset = {
  id: string;
  label: string;
  short: string;
  country: string;
  language: string;
};

export const LOCALE_PRESETS: readonly LocalePreset[] = [
  { id: 'auto', label: '自动识别', short: '国家 / 语言', country: '', language: '' },
  // 北美与大洋洲
  { id: 'US-en', label: '美国 · 英语 (en-US)', short: '美国 · en-US', country: 'US', language: 'en-US' },
  { id: 'CA-en', label: '加拿大 · 英语 (en-CA)', short: '加拿大 · en-CA', country: 'CA', language: 'en-CA' },
  { id: 'CA-fr', label: '加拿大 · 法语 (fr-CA)', short: '加拿大 · fr-CA', country: 'CA', language: 'fr-CA' },
  { id: 'AU-en', label: '澳大利亚 · 英语 (en-AU)', short: '澳大利亚 · en-AU', country: 'AU', language: 'en-AU' },
  { id: 'NZ-en', label: '新西兰 · 英语 (en-NZ)', short: '新西兰 · en-NZ', country: 'NZ', language: 'en-NZ' },
  // 欧洲
  { id: 'GB-en', label: '英国 · 英语 (en-GB)', short: '英国 · en-GB', country: 'GB', language: 'en-GB' },
  { id: 'IE-en', label: '爱尔兰 · 英语 (en-IE)', short: '爱尔兰 · en-IE', country: 'IE', language: 'en-IE' },
  { id: 'DE-de', label: '德国 · 德语 (de-DE)', short: '德国 · de-DE', country: 'DE', language: 'de-DE' },
  { id: 'AT-de', label: '奥地利 · 德语 (de-AT)', short: '奥地利 · de-AT', country: 'AT', language: 'de-AT' },
  { id: 'CH-de', label: '瑞士 · 德语 (de-CH)', short: '瑞士 · de-CH', country: 'CH', language: 'de-CH' },
  { id: 'CH-fr', label: '瑞士 · 法语 (fr-CH)', short: '瑞士 · fr-CH', country: 'CH', language: 'fr-CH' },
  { id: 'FR-fr', label: '法国 · 法语 (fr-FR)', short: '法国 · fr-FR', country: 'FR', language: 'fr-FR' },
  { id: 'BE-fr', label: '比利时 · 法语 (fr-BE)', short: '比利时 · fr-BE', country: 'BE', language: 'fr-BE' },
  { id: 'BE-nl', label: '比利时 · 荷兰语 (nl-BE)', short: '比利时 · nl-BE', country: 'BE', language: 'nl-BE' },
  { id: 'NL-nl', label: '荷兰 · 荷兰语 (nl-NL)', short: '荷兰 · nl-NL', country: 'NL', language: 'nl-NL' },
  { id: 'ES-es', label: '西班牙 · 西班牙语 (es-ES)', short: '西班牙 · es-ES', country: 'ES', language: 'es-ES' },
  { id: 'PT-pt', label: '葡萄牙 · 葡萄牙语 (pt-PT)', short: '葡萄牙 · pt-PT', country: 'PT', language: 'pt-PT' },
  { id: 'IT-it', label: '意大利 · 意大利语 (it-IT)', short: '意大利 · it-IT', country: 'IT', language: 'it-IT' },
  { id: 'PL-pl', label: '波兰 · 波兰语 (pl-PL)', short: '波兰 · pl-PL', country: 'PL', language: 'pl-PL' },
  { id: 'SE-sv', label: '瑞典 · 瑞典语 (sv-SE)', short: '瑞典 · sv-SE', country: 'SE', language: 'sv-SE' },
  { id: 'NO-nb', label: '挪威 · 挪威语 (nb-NO)', short: '挪威 · nb-NO', country: 'NO', language: 'nb-NO' },
  { id: 'DK-da', label: '丹麦 · 丹麦语 (da-DK)', short: '丹麦 · da-DK', country: 'DK', language: 'da-DK' },
  { id: 'FI-fi', label: '芬兰 · 芬兰语 (fi-FI)', short: '芬兰 · fi-FI', country: 'FI', language: 'fi-FI' },
  { id: 'CZ-cs', label: '捷克 · 捷克语 (cs-CZ)', short: '捷克 · cs-CZ', country: 'CZ', language: 'cs-CZ' },
  { id: 'SK-sk', label: '斯洛伐克 · 斯洛伐克语 (sk-SK)', short: '斯洛伐克 · sk-SK', country: 'SK', language: 'sk-SK' },
  { id: 'HU-hu', label: '匈牙利 · 匈牙利语 (hu-HU)', short: '匈牙利 · hu-HU', country: 'HU', language: 'hu-HU' },
  { id: 'RO-ro', label: '罗马尼亚 · 罗马尼亚语 (ro-RO)', short: '罗马尼亚 · ro-RO', country: 'RO', language: 'ro-RO' },
  { id: 'BG-bg', label: '保加利亚 · 保加利亚语 (bg-BG)', short: '保加利亚 · bg-BG', country: 'BG', language: 'bg-BG' },
  { id: 'GR-el', label: '希腊 · 希腊语 (el-GR)', short: '希腊 · el-GR', country: 'GR', language: 'el-GR' },
  { id: 'UA-uk', label: '乌克兰 · 乌克兰语 (uk-UA)', short: '乌克兰 · uk-UA', country: 'UA', language: 'uk-UA' },
  { id: 'RU-ru', label: '俄罗斯 · 俄语 (ru-RU)', short: '俄罗斯 · ru-RU', country: 'RU', language: 'ru-RU' },
  { id: 'TR-tr', label: '土耳其 · 土耳其语 (tr-TR)', short: '土耳其 · tr-TR', country: 'TR', language: 'tr-TR' },
  // 拉丁美洲
  { id: 'BR-pt', label: '巴西 · 葡萄牙语 (pt-BR)', short: '巴西 · pt-BR', country: 'BR', language: 'pt-BR' },
  { id: 'MX-es', label: '墨西哥 · 西班牙语 (es-MX)', short: '墨西哥 · es-MX', country: 'MX', language: 'es-MX' },
  { id: 'AR-es', label: '阿根廷 · 西班牙语 (es-AR)', short: '阿根廷 · es-AR', country: 'AR', language: 'es-AR' },
  { id: 'CO-es', label: '哥伦比亚 · 西班牙语 (es-CO)', short: '哥伦比亚 · es-CO', country: 'CO', language: 'es-CO' },
  { id: 'CL-es', label: '智利 · 西班牙语 (es-CL)', short: '智利 · es-CL', country: 'CL', language: 'es-CL' },
  { id: 'PE-es', label: '秘鲁 · 西班牙语 (es-PE)', short: '秘鲁 · es-PE', country: 'PE', language: 'es-PE' },
  // 南亚与东南亚（含孟加拉、巴基斯坦等，不含中文）
  { id: 'BD-bn', label: '孟加拉国 · 孟加拉语 (bn-BD)', short: '孟加拉国 · bn-BD', country: 'BD', language: 'bn-BD' },
  { id: 'PK-ur', label: '巴基斯坦 · 乌尔都语 (ur-PK)', short: '巴基斯坦 · ur-PK', country: 'PK', language: 'ur-PK' },
  { id: 'PK-en', label: '巴基斯坦 · 英语 (en-PK)', short: '巴基斯坦 · en-PK', country: 'PK', language: 'en-PK' },
  { id: 'IN-en', label: '印度 · 英语 (en-IN)', short: '印度 · en-IN', country: 'IN', language: 'en-IN' },
  { id: 'IN-hi', label: '印度 · 印地语 (hi-IN)', short: '印度 · hi-IN', country: 'IN', language: 'hi-IN' },
  { id: 'LK-si', label: '斯里兰卡 · 僧伽罗语 (si-LK)', short: '斯里兰卡 · si-LK', country: 'LK', language: 'si-LK' },
  { id: 'NP-ne', label: '尼泊尔 · 尼泊尔语 (ne-NP)', short: '尼泊尔 · ne-NP', country: 'NP', language: 'ne-NP' },
  { id: 'SG-en', label: '新加坡 · 英语 (en-SG)', short: '新加坡 · en-SG', country: 'SG', language: 'en-SG' },
  { id: 'MY-ms', label: '马来西亚 · 马来语 (ms-MY)', short: '马来西亚 · ms-MY', country: 'MY', language: 'ms-MY' },
  { id: 'TH-th', label: '泰国 · 泰语 (th-TH)', short: '泰国 · th-TH', country: 'TH', language: 'th-TH' },
  { id: 'VN-vi', label: '越南 · 越南语 (vi-VN)', short: '越南 · vi-VN', country: 'VN', language: 'vi-VN' },
  { id: 'ID-id', label: '印度尼西亚 · 印尼语 (id-ID)', short: '印尼 · id-ID', country: 'ID', language: 'id-ID' },
  { id: 'PH-en', label: '菲律宾 · 英语 (en-PH)', short: '菲律宾 · en-PH', country: 'PH', language: 'en-PH' },
  // 东亚（不含中文）
  { id: 'JP-ja', label: '日本 · 日语 (ja-JP)', short: '日本 · ja-JP', country: 'JP', language: 'ja-JP' },
  { id: 'KR-ko', label: '韩国 · 韩语 (ko-KR)', short: '韩国 · ko-KR', country: 'KR', language: 'ko-KR' },
  // 中东与非洲
  { id: 'AE-ar', label: '阿联酋 · 阿拉伯语 (ar-AE)', short: '阿联酋 · ar-AE', country: 'AE', language: 'ar-AE' },
  { id: 'SA-ar', label: '沙特阿拉伯 · 阿拉伯语 (ar-SA)', short: '沙特 · ar-SA', country: 'SA', language: 'ar-SA' },
  { id: 'EG-ar', label: '埃及 · 阿拉伯语 (ar-EG)', short: '埃及 · ar-EG', country: 'EG', language: 'ar-EG' },
  { id: 'IL-he', label: '以色列 · 希伯来语 (he-IL)', short: '以色列 · he-IL', country: 'IL', language: 'he-IL' },
  { id: 'ZA-en', label: '南非 · 英语 (en-ZA)', short: '南非 · en-ZA', country: 'ZA', language: 'en-ZA' },
  { id: 'NG-en', label: '尼日利亚 · 英语 (en-NG)', short: '尼日利亚 · en-NG', country: 'NG', language: 'en-NG' },
  { id: 'KE-sw', label: '肯尼亚 · 斯瓦希里语 (sw-KE)', short: '肯尼亚 · sw-KE', country: 'KE', language: 'sw-KE' },
];

type FlagDef = { dir: 'h'|'v'; bands: string[]; circle?: { cx?: number; cy?: number; r: number; fill: string }; canton?: string; cross?: string; bg?: string };

const FLAGS: Record<string, FlagDef> = {
  US: { dir: 'h', bands: ['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234'], canton: '#3c3b6e' },
  CA: { dir: 'v', bands: ['#d80621', '#fff', '#d80621'], circle: { r: 2.2, fill: '#d80621' } },
  AU: { dir: 'h', bands: ['#012169'], canton: '#c8102e', circle: { cx: 13.5, cy: 7.5, r: 1.5, fill: '#fff' } },
  NZ: { dir: 'h', bands: ['#012169'], canton: '#c8102e', circle: { cx: 13.5, cy: 7.5, r: 1.4, fill: '#c8102e' } },
  GB: { dir: 'h', bands: ['#012169'], cross: '#c8102e' },
  IE: { dir: 'v', bands: ['#169b62', '#fff', '#ff883e'] },
  DE: { dir: 'h', bands: ['#111', '#dd0000', '#ffce00'] },
  AT: { dir: 'h', bands: ['#ed2939', '#fff', '#ed2939'] },
  CH: { dir: 'h', bands: ['#d52b1e'], cross: '#fff' },
  FR: { dir: 'v', bands: ['#002395', '#fff', '#ed2939'] },
  BE: { dir: 'v', bands: ['#111', '#fae042', '#ed2939'] },
  NL: { dir: 'h', bands: ['#ae1c28', '#fff', '#21468b'] },
  ES: { dir: 'h', bands: ['#aa151b', '#f1bf00', '#f1bf00', '#aa151b'] },
  PT: { dir: 'v', bands: ['#046a38', '#da291c', '#da291c'], circle: { cx: 6.2, cy: 6.5, r: 2, fill: '#ffe900' } },
  IT: { dir: 'v', bands: ['#009246', '#fff', '#ce2b37'] },
  PL: { dir: 'h', bands: ['#fff', '#dc143c'] },
  SE: { dir: 'h', bands: ['#006aa7'], cross: '#fecc02' },
  NO: { dir: 'h', bands: ['#ba0c2f'], cross: '#00205b' },
  DK: { dir: 'h', bands: ['#c8102e'], cross: '#fff' },
  FI: { dir: 'h', bands: ['#fff'], cross: '#003580' },
  CZ: { dir: 'h', bands: ['#fff', '#d7141a'], canton: '#11457e' },
  SK: { dir: 'h', bands: ['#fff', '#0b4ea2', '#ee1c25'] },
  HU: { dir: 'h', bands: ['#cd2a3e', '#fff', '#436f4d'] },
  RO: { dir: 'v', bands: ['#002b7f', '#fcd116', '#ce1126'] },
  BG: { dir: 'h', bands: ['#fff', '#00966e', '#d62612'] },
  GR: { dir: 'h', bands: ['#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf'], canton: '#0d5eaf' },
  UA: { dir: 'h', bands: ['#0057b7', '#ffd700'] },
  RU: { dir: 'h', bands: ['#fff', '#0039a6', '#d52b1e'] },
  TR: { dir: 'h', bands: ['#e30a17'], circle: { cx: 8, cy: 6.5, r: 2.3, fill: '#fff' } },
  BR: { dir: 'h', bands: ['#009c3b'], circle: { r: 2.8, fill: '#ffdf00' } },
  MX: { dir: 'v', bands: ['#006847', '#fff', '#ce1126'], circle: { r: 1.6, fill: '#8b5a2b' } },
  AR: { dir: 'h', bands: ['#74acdf', '#fff', '#74acdf'], circle: { r: 1.6, fill: '#f6b40e' } },
  CO: { dir: 'h', bands: ['#fcd116', '#fcd116', '#003893', '#ce1126'] },
  CL: { dir: 'h', bands: ['#fff', '#d52b1e'], canton: '#0039a6' },
  PE: { dir: 'v', bands: ['#d91023', '#fff', '#d91023'] },
  BD: { dir: 'h', bands: ['#006a4e'], circle: { cx: 8, cy: 6.5, r: 3.1, fill: '#f42a41' } },
  PK: { dir: 'v', bands: ['#fff', '#01411c', '#01411c', '#01411c'], circle: { cx: 11.5, cy: 6.5, r: 2.3, fill: '#fff' } },
  IN: { dir: 'h', bands: ['#ff9933', '#fff', '#138808'], circle: { r: 1.6, fill: '#000080' } },
  LK: { dir: 'v', bands: ['#00534e', '#eb7400', '#8d153a', '#8d153a'] },
  NP: { dir: 'h', bands: ['#dc143c', '#003893', '#dc143c'] },
  SG: { dir: 'h', bands: ['#ef3340', '#fff'] },
  MY: { dir: 'h', bands: ['#cc0001', '#fff', '#cc0001', '#fff', '#cc0001'], canton: '#010066' },
  TH: { dir: 'h', bands: ['#a51931', '#fff', '#2d2a4a', '#fff', '#a51931'] },
  VN: { dir: 'h', bands: ['#da251d'], circle: { r: 2.4, fill: '#ffff00' } },
  ID: { dir: 'h', bands: ['#ce1126', '#fff'] },
  PH: { dir: 'h', bands: ['#0038a8', '#ce1126'], canton: '#fcd116' },
  JP: { dir: 'h', bands: ['#fff'], circle: { r: 3.1, fill: '#bc002d' } },
  KR: { dir: 'h', bands: ['#fff'], circle: { r: 2.8, fill: '#cd2e3a' } },
  AE: { dir: 'h', bands: ['#00732f', '#fff', '#111'], canton: '#ff0000' },
  SA: { dir: 'h', bands: ['#006c35'], circle: { r: 1.6, fill: '#fff' } },
  EG: { dir: 'h', bands: ['#ce1126', '#fff', '#111'], circle: { r: 1.3, fill: '#c09300' } },
  IL: { dir: 'h', bands: ['#fff', '#0038b8', '#fff', '#0038b8', '#fff'] },
  ZA: { dir: 'h', bands: ['#e03c31', '#007749', '#001489'] },
  NG: { dir: 'v', bands: ['#008751', '#fff', '#008751'] },
  KE: { dir: 'h', bands: ['#111', '#bb0000', '#006600'] },
};

export function CountryFlag({ country }: { country: string }) {
  const def = FLAGS[country];
  if (!def) return null;
  const w = 18;
  const h = 13;
  const count = def.bands.length;
  return (
    <svg className="prompt-flag" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      {def.bands.map((fill, idx) =>
        def.dir === 'h'
          ? <rect key={idx} x={0} y={(idx * h) / count} width={w} height={h / count + 0.3} fill={fill} />
          : <rect key={idx} x={(idx * w) / count} y={0} width={w / count + 0.3} height={h} fill={fill} />,
      )}
      {def.cross && (
        <>
          <rect x={0} y={h / 2 - 1.4} width={w} height={2.8} fill={def.cross} />
          <rect x={country === 'CH' ? w / 2 - 1.4 : 4.6} y={0} width={2.8} height={h} fill={def.cross} />
        </>
      )}
      {def.canton && <rect x={0} y={0} width={w * 0.45} height={h * 0.54} fill={def.canton} />}
      {def.circle && (
        <circle cx={def.circle.cx ?? w / 2} cy={def.circle.cy ?? h / 2} r={def.circle.r} fill={def.circle.fill} />
      )}
    </svg>
  );
}
