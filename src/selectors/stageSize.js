import _ from 'lodash';

import store from 'src/reducers';

export const getStageSize = () => store.getState().stageSize;

/**
 * We have two values: The actual size of the div wrapping the canvas and the size entered by the user in the settings form.
 * If the entered value is smaller than the wrapper, we use that; if not, we use the size of the wrapper.
 */
export const getTrueCanvasSize = (chosenCanvasSize, maxStageContainerSize) => {
  return chosenCanvasSize > maxStageContainerSize ? maxStageContainerSize : _.max([chosenCanvasSize, 20]);
};
