import { createStories } from './component-story.js';

const stories = createStories({
  id: 'detail-04',
  title: 'Pages/Detail/Detail-04',
  tag: 'detail-04',
  kind: 'Detail',
  group: 'Pages',
  source: 'src/components/detail-04/source.json',
  overviewHtml: `
    <div class="space-y-6">
      <div id="detail-04-stage"></div>
    </div>
  `
});

export default stories.meta;
export const Overview = stories.Overview;
export const Desktop = stories.Desktop;
export const Mobile = stories.Mobile;

