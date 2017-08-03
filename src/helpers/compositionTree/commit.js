/**
 * Contains functions for actually commiting changes to the backend, mutating the interior composition tree
 * and causing the changes to be reflected in the visualization.
 */

import R from 'ramda';

import { addNode, deleteNode, replaceNode } from 'src/interop';
import { denormalizeNode } from 'src/helpers/compositionTree/normalization';
import { getNodeParent } from 'src/selectors/compositionTree';
import { NULL_UUID } from 'src/data/misc';

/**
 * Given the type of a node, determines what number to subtract from the index when commiting to the backend since
 * the backend doesn't keep things like composition schemes as children.
 */
const getIndexOffset = nodeType => {
  return {
    // TODO: Convert these to a schema attribute so that we can do dynamic determinations for things like composed modules.
    'root': 3,
    'noiseModule': 2,
  }[nodeType] || 0;
};

/**
 * Finds the path to a node in the composition tree and returns it as an array of integers.
 */
const getNodeCoords = (allNodes, nodeId) => {
  let coordBuf = [];
  let curId = nodeId;

  while(true) {
    const { id, type, children } = getNodeParent(allNodes, curId);

    coordBuf = [children.indexOf(curId) - getIndexOffset(type), ...coordBuf];

    if(id === NULL_UUID) {
      break;
    } else {
      curId = id;
    }
  }

  return coordBuf;
};

export const commitChanges = (entities, { new: newNodes, updated: updatedNodes, deleted: deletedNodes }) => {
  console.log('COMMITING CHANGES: ', newNodes, updatedNodes, deletedNodes);

  // first handle all new nodes, parsing them into their denormalized form and creating them on the backend
  newNodes.forEach(nodeId => {
    const def = JSON.stringify(denormalizeNode(entities, nodeId));
    const coords = getNodeCoords(entities.nodes, nodeId);

    // Allocate memory in the Emscripten heap and call the backend function
    addNode(R.init(coords), R.last(coords), def);
  });
};
