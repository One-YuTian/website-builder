import { createStories } from './component-story.js';

const stories = createStories({
  id: 'detail-01',
  title: 'Pages/Detail/Detail-01',
  tag: 'detail-01',
  kind: 'Detail',
  group: 'Pages',
  source: 'src/components/detail-01/source.json',
  overviewHtml: `
    <div class="space-y-6">
      <div id="detail-01-stage"></div>
    </div>
  `
});

export default stories.meta;
export const Overview = stories.Overview;
export const Desktop = stories.Desktop;
export const Mobile = stories.Mobile;

