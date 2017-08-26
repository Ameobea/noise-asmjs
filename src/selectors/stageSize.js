import R from 'ramda';

import store from 'src/reducers';

export const getStageSize = () => store.getState().stageSize;

/**
 * We have two values: The actual size of the div wrapping the canvas and the size entered by the user in the settings form.
 * If the entered value is smaller than the wrapper, we use that; if not, we use the size of the wrapper.
 */
export const getTrueCanvasSize = (chosenCanvasSize, maxStageContainerSize) => {
  // if(process.env.NODE_ENV === 'development') {
    return maxStageContainerSize === 0 ? 0 : 222;
  // } else {
    // return chosenCanvasSize > maxStageContainerSize ? maxStageContainerSize : R.max(chosenCanvasSize, 20);
  // }
};
