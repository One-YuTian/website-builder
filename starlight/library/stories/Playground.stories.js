export default { title: 'Guide/Playground', parameters: { layout: 'fullscreen', controls: { disable: true } } };
export const Canvas = {
  name: '演练场',
  render: () => {
    const root = document.createElement('div');
    const link = document.createElement('a'); link.href = '/playground/index.html'; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = '在独立窗口打开 Playground'; link.className = 'block p-4 text-sm text-primary underline';
    const frame = document.createElement('iframe'); frame.src = '/playground/index.html'; frame.title = 'Playground 演练场'; frame.className = 'block h-[1000px] w-full border-0';
    root.append(link, frame); return root;
  },
};
