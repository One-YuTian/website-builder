export type ProjectStatus = 'pending' | 'generating' | 'modifying' | 'completed' | 'failed' | 'paused';
export const statusLabels: Record<ProjectStatus, string> = {pending:'待开始',generating:'生成中',modifying:'修改中',completed:'已完成',failed:'执行失败',paused:'已暂停'};
export function projectTitle(project: {country?:string;language?:string;categories?:string[];brand?:string;name?:string}) {
  const country = project.country?.trim();
  let region = country || '', language = '';
  try {
    if (country && /^[a-z]{2}$/i.test(country)) region = new Intl.DisplayNames(['zh-CN'], {type:'region'}).of(country.toUpperCase()) || country;
    if (project.language) language = new Intl.DisplayNames(['zh-CN'], {type:'language'}).of(project.language.split('-')[0]) || project.language;
  } catch { language = project.language || language; }
  const categories = project.categories?.filter(Boolean).slice(0,2).join('与') || '';
  const identity = [region, language].filter(Boolean).join(' · ');
  const title = [identity, categories].filter(Boolean).join('｜');
  return !region && !categories ? [project.brand || project.name, language].filter(Boolean).join(' · ') : title || project.brand || project.name || '';
}
export function projectTime(value: string) {
  const date = new Date(value), pad = (n:number) => String(n).padStart(2,'0');
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}年${pad(date.getMonth()+1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
