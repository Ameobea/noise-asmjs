/**
 * Manages state for the `browse` page
 */

import { SORT, SET_SORT } from 'src/actions/browse';

const initialState = {
  loadedCompositions: [],
  totalCompositions: 1,
  selectedSort: SORT.MOST_POPULAR,
};

export default (state=initialState, action={}) => {
  switch(action.type) {

  case SET_SORT: {
    return {...state, selectedSort: action.sort };
  }

  default: {
    return state;
  }

  }
};
