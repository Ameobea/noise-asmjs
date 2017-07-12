/**
 * Manages the state for the composition tree and defines methods for interacting with it.
 */

import R from 'ramda';

import initialTree from 'src/data/compositionTree/initialTree';
import { normalizeTree } from 'src/helpers/compositionTree/normalization';
import { NULL_UUID } from 'src/data/misc';
import { ADD_NODE, DELETE_NODE, REPLACE_NODE, SELECT_NODE } from 'src/actions/compositionTree';

const initialState = R.merge(normalizeTree(initialTree), {selectedNode: NULL_UUID});

export default (state=initialState, action={}) => {
  switch(action.type) {

  case ADD_NODE: {
    // TODO
    return state;
  }

  case DELETE_NODE: {
    // TODO
    return state;
  }

  case REPLACE_NODE: {
    // TODO
    return state;
  }

  case SELECT_NODE: {
    return {...state, selectedNode: action.nodeId};
  }

  default: {
    return state;
  }}

};
