/**
 * Manages state for the `browse` page
 */

import R from 'ramda';

import { SORT, SET_SORT, ADD_COMPOSITIONS } from 'src/actions/browse';

const initialState = {
  loadedCompositions: [],
  totalCompositions: 100,
  selectedSort: SORT.MOST_POPULAR,
};

export default (state=initialState, action={}) => {
  switch(action.type) {

  case SET_SORT: {
    return {...state, selectedSort: action.sort };
  }

  case ADD_COMPOSITIONS: {
    return {...state, loadedCompositions: R.union(state.loadedCompositions, action.compositions)}
  }

  default: {
    return state;
  }

  }
};
