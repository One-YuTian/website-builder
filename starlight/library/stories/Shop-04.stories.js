import { createStories } from './component-story.js';

const stories = createStories({
  id: 'shop-04',
  title: 'Pages/Shop/Shop-04',
  tag: 'shop-04',
  kind: 'Shop',
  group: 'Pages',
  source: 'src/components/shop-04/source.json',
  overviewHtml: `
    <div class="space-y-6">
      <div id="shop-04-stage"></div>
    </div>
  `
});

export default stories.meta;
export const Overview = stories.Overview;
export const Desktop = stories.Desktop;
export const Mobile = stories.Mobile;

