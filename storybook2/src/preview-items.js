export function createPreviewItem(tag, values = {}, doc = document) {
  const root = doc.createElement('div');
  root.className = 'contents';
  const tags = tag === 'carousel-01' || tag === 'carousel-03' ? [tag, `${tag}-mobile`] : [tag];
  for (const variant of tags) {
    const element = doc.createElement(variant);
    for (const [key, value] of Object.entries(values)) if (value !== undefined) element[key] = value;
    root.append(element);
  }
  return root;
}
