/**
 * Manages state for the `browse` page
 */

import R from 'ramda';

import { SORT, SET_SORT, ADD_COMPOSITIONS } from 'src/actions/browse';

const initialState = {
  loadedCompositions: [],
  totalCompositions: 100,
  selectedSort: 'NEWEST',
};

export default (state=initialState, action={}) => {
  switch(action.type) {

  case SET_SORT: {
    if(action.sort !== state.selectedSort) {
      return {...state,
        loadedCompositions: [],
        selectedSort: action.sort,
      };
    } else {
      return state;
    }
  }

  case ADD_COMPOSITIONS: {
    return {...state, loadedCompositions: R.union(state.loadedCompositions, action.compositions)}
  }

  default: {
    return state;
  }

  }
};
