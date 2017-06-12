//! Actions for dealing with the stage area surrounding the main visualization canvas

import _ from 'lodash';

import { SET_MAX_STAGE_SIZE } from '../reducers/maxSizeReducer';

export const setMaxStageSize = (height, width) => ({
  type: SET_MAX_STAGE_SIZE,
  size: _.min([height, width]),
});
