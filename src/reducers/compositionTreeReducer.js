/**
 * Manages the state for the composition tree and defines methods for interacting with it.
 */

import R from 'ramda';

import initialTree from 'src/data/compositionTree/initialTree';
import { normalizeTree } from 'src/helpers/compositionTree/normalization';

// Args: {parentId: Number, childIndex: Number, nodeDef: NodeDefinition}
export const ADD_NODE = 'ADD_NODE';
// Args: {nodeId: Number}
export const DELETE_NODE = 'DELETE_NODE';
// Args: {nodeId: Number, nodeDef: NodeDefinition}
export const REPLACE_NODE = 'REPLACE_NODE';

console.log(initialTree);

export default (state=normalizeTree(initialTree), action={}) => {
  switch(action.type) {
    case ADD_NODE: {

      return state;
    }
    case DELETE_NODE: {

      return state;
    }
    default:
      return state;
  }
};
