import { createStories } from './component-story.js';

const stories = createStories({
  id: 'shop-12',
  title: 'Pages/Shop/Shop-12',
  tag: 'shop-12',
  kind: 'Shop',
  group: 'Pages',
  source: 'src/components/shop-12/source.json',
  overviewHtml: `
    <div class="space-y-6">
      <div id="shop-12-stage"></div>
    </div>
  `
});

export default stories.meta;
export const Overview = stories.Overview;
export const Desktop = stories.Desktop;
export const Mobile = stories.Mobile;

