/**
 * Contains functions for actually commiting changes to the backend, mutating the interior composition tree
 * and causing the changes to be reflected in the visualization.
 */

import { addNode, deleteNode, replaceNode } from 'src/interop';
import { denormalizeNode } from 'src/helpers/compositionTree/normalization';
import { getNodeParent } from 'src/selectors/compositionTree';
import { NULL_UUID } from 'src/data/misc';

/**
 * Finds the path to a node in the composition tree and returns it as an array of integers.
 */
const getNodeCoords = (allNodes, nodeId) => {
  let coordBuf = [];
  const curId = nodeId;

  while(true) {
    const { id, children } = getNodeParent(allNodes, nodeId);

    coordBuf = [children.indexOf(curId), ...coordBuf];

    if(id === NULL_UUID) {
      break;
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
    const index = getNodeParent(entities.nodes, nodeId).children.indexOf(nodeId);
    debugger;

    // Allocate memory in the Emscripten heap and call the backend function
    addNode(coords, index, def);
  });
};
