//! Receives the current size of the display area and uses it to enforce an upper bound on the size of the rendered canvas.

import Simr from 'simr';

import { INITIAL_CANVAS_SIZE } from 'src/data/misc';

export const stageSizeReducer = new Simr.Reducer('stageSize', {containerSize: INITIAL_CANVAS_SIZE});
stageSizeReducer.addSetter('containerSize');
