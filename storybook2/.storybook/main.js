export default {
  stories: ['../src/stories/**/*.stories.js', '../src/stories/**/*.mdx'],
  addons: ['@storybook/addon-essentials'],
  staticDirs: ['../public'],
  framework: { name: '@storybook/web-components-vite', options: {} },
  docs: { defaultName: 'Doc' },
  core: { disableTelemetry: true },
};
