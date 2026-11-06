import { Skeleton } from './components/skeleton.js';
import { Header as Header01 } from './components/header-01/index.js';
import { Header as Header02 } from './components/header-02/index.js';
import { Header as Header03 } from './components/header-03/index.js';
import { Header as Header04 } from './components/header-04/index.js';
import { Header as Header05 } from './components/header-05/index.js';
import { Header as Header06 } from './components/header-06/index.js';
import { Header as Header07 } from './components/header-07/index.js';
import { Header as Header08 } from './components/header-08/index.js';
import { Header as Header09 } from './components/header-09/index.js';
import { Header as Header10 } from './components/header-10/index.js';
import { Footer as Footer01 } from './components/footer-01/index.js';
import { Footer as Footer02 } from './components/footer-02/index.js';
import { Card as Card01 } from './components/card-01/index.js';
import { Card as Card02 } from './components/card-02/index.js';
import { Card as Card07 } from './components/card-07/index.js';
import { Card as Card11 } from './components/card-11/index.js';
import { Card as Card19 } from './components/card-19/index.js';
import { Card as Card23 } from './components/card-23/index.js';
import { FlashCard as FlashCard01 } from './components/flashcard-01/index.js';

export {
  Header01, Header02, Header03, Header04, Header05,
  Header06, Header07, Header08, Header09, Header10,
  Footer01, Footer02,
  Card01, Card02,
  Card07, Card11, Card19, Card23,
  FlashCard01
};
export { Skeleton, createSkeleton } from './components/skeleton.js';
export { initializeResources, loadJQuery } from './runtime/resources.js';
export { applyTheme } from './runtime/theme.js';
export { themeConfig, themePresets } from './config/theme.js';

export function registerComponents(registry = customElements) {
  for (const [tag, implementation] of [
    ['skeleton-placeholder', Skeleton],
    ['header-01', Header01],
    ['header-02', Header02],
    ['header-03', Header03],
    ['header-04', Header04],
    ['header-05', Header05],
    ['header-06', Header06],
    ['header-07', Header07],
    ['header-08', Header08],
    ['header-09', Header09],
    ['header-10', Header10],
    ['footer-01', Footer01],
    ['footer-02', Footer02],
    ['card-01', Card01],
    ['card-02', Card02],
    ['card-07', Card07],
    ['card-11', Card11],
    ['card-19', Card19],
    ['card-23', Card23],
    ['flashcard-01', FlashCard01]
  ]) {
    if (!registry.get(tag)) registry.define(tag, implementation);
  }
}
