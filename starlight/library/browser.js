import * as library from './index.js';

library.registerComponents();
const ready = library.initializeResources();
window.ComponentLibrary = Object.freeze({ ...library, ready });
