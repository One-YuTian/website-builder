import { registerComponents } from '../index.js';
import { createPreviewItem } from '../preview-items.js';
import { codeDocumentation, sourceCode } from './code-docs.js';

export function createComponentStory(tag, description, args = {}, argTypes = {}) {
  return {
    args, argTypes,
    render: values => {
      registerComponents();
      const component = createPreviewItem(tag, values);
      if (tag.startsWith('card-')) {
        const frame = document.createElement('div');
        frame.className = 'content-container py-6';
        component.firstElementChild.classList.add('w-full', values.viewMode === 'list' ? 'max-w-3xl' : 'max-w-sm');
        frame.append(component);
        return frame;
      }
      return component;
    },
    parameters: { docs: { description: { component: codeDocumentation(tag, description) }, story: { inline: false, height: '520px' }, source: { code: sourceCode(tag), language: 'html' } } },
  };
}
