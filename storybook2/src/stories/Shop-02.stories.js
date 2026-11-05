import { createStories } from './component-story.js';

const stories = createStories({
  id: 'shop-02',
  title: 'Pages/Shop/Shop-02',
  tag: 'shop-02',
  kind: 'Shop',
  group: 'Pages',
  source: 'src/components/shop-02/source.json',
  overviewHtml: `
    <div class="space-y-6">
      <div id="shop-02-stage"></div>
    </div>
  `
});

export default stories.meta;
export const Overview = stories.Overview;
export const Desktop = stories.Desktop;
export const Mobile = stories.Mobile;

