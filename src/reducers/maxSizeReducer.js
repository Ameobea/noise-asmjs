//! Receives the current size of the display area and uses it to enforce an upper bound on the size of the rendered canvas.

export const SET_MAX_STAGE_SIZE = 'SET_STAGE_SIZE';

export const maxSizeReducer = (state=0, action) => {
  if(action.type === SET_MAX_STAGE_SIZE) {
    return action.size - 120;
  }

  return state;
};
