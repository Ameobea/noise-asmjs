/**
 * Contains functions for actually commiting changes to the backend, mutating the interior composition tree
 * and causing the changes to be reflected in the visualization.
 */

import R from 'ramda';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { addNode, deleteNode, replaceNode } from 'src/interop';
import { denormalizeNode } from 'src/helpers/compositionTree/normalization';
import { getLeafAttr, getNodeParent } from 'src/selectors/compositionTree';
import { NULL_UUID } from 'src/data/misc';
import { mapIdsToEntites } from 'src/helpers/compositionTree/util';

/**
 * Finds the path to a node in the composition tree and returns it as an array of integers.
 */
const getNodeCoords = (entities, nodeId) => {
  let coordBuf = [];
  let curId = nodeId;

  while(true) {
    if(curId === NULL_UUID) {
      break;
    }

    const { id, type, settings, children } = getNodeParent(entities.nodes, curId);

    const indexOffset = getLeafAttr('indexOffset', getNodeData(type), mapIdsToEntites(entities.settings, settings));
    coordBuf = [children.indexOf(curId) - indexOffset, ...coordBuf];

    curId = id;
  }

  return coordBuf;
};

export const commitChanges = (entities, { new: newNodes, updated: updatedNodes, deleted: deletedNodes }) => {
  console.log('COMMITING CHANGES: ', newNodes, updatedNodes, deletedNodes);

  // first handle all deleted nodes
  deletedNodes.forEach( ({ id, parentId, index }) => {
    const coords = getNodeCoords(entities, parentId);
    const { type: parentType, settings: parentSettingIds } = entities.nodes[parentId];
    const parentSettings = mapIdsToEntites(entities.settings, parentSettingIds);
    const indexOffset = getLeafAttr('indexOffset', getNodeData(parentType), parentSettings);

    deleteNode(coords, index - indexOffset);
  });

  // then handle all new nodes, parsing them into their denormalized form and creating them on the backend
  newNodes.forEach(nodeId => {
    const def = JSON.stringify(denormalizeNode(entities, nodeId));
    const coords = getNodeCoords(entities, nodeId);

    // Allocate memory in the Emscripten heap and call the backend function
    addNode(R.init(coords), R.last(coords), def);
  });

  // finally, replace all modified nodes with newly-built versions.
  updatedNodes.forEach(nodeId => {
    const def = JSON.stringify(denormalizeNode(entities, nodeId));
    const coords = getNodeCoords(entities, nodeId);

    replaceNode(R.init(coords), R.last(coords), def);
  });
};
