//! Receives the current size of the display area and uses it to enforce an upper bound on the size of the rendered canvas.

import Simr from 'simr';

export const stageSizeReducer = new Simr.Reducer('stageSize', {containerSize: false});
stageSizeReducer.addSetter('containerSize');
