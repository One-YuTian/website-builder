export interface TemplateBinding { file: string; region: string; id: string; baseline?: 'html' | 'render' }

export function regionMarkers(binding: TemplateBinding) {
  return { start: `<!-- Source Template: ${binding.id} | Region: ${binding.region} -->`, end: `<!-- /Source Template: ${binding.region} -->` };
}
