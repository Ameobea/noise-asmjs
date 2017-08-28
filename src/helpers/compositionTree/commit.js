/**
 * Contains functions for actually commiting changes to the backend, mutating the interior composition tree
 * and causing the changes to be reflected in the visualization.
 */

import R from 'ramda';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import {
  addNode, deleteNode, replaceNode, setGlobalConf,
  addInputTransformation, deleteInputTransformation, replaceInputTransformation,
} from 'src/interop';
import { denormalizeNode } from 'src/helpers/compositionTree/normalization';
import { getLeafAttr, getNodeParent, getSettingByName } from 'src/selectors/compositionTree';
import { getTreePointer } from 'src/selectors/enginePointer';
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

    const parentNode = getNodeParent(entities.nodes, curId);
    if(!parentNode) {
      return false;
    }
    const { id, type, settings, children } = parentNode;

    const indexOffset = getLeafAttr('indexOffset', getNodeData(type), mapIdsToEntites(entities.settings, settings));
    coordBuf = [children.indexOf(curId) - indexOffset, ...coordBuf];

    curId = id;
  }

  return coordBuf;
};

export const commitChanges = (entities, { new: newNodes, updated: updatedNodes, deleted: deletedNodes }) => {

  // first handle all deleted nodes
  deletedNodes.forEach( ({ id, parentId, index }) => {
    const parentNodeType = entities.nodes[parentId].type;
    const coords = getNodeCoords(entities, parentId);
    if(coords === false) {
      // node's parent has been deleted already so we don't have to do anything
      return;
    }

    const { type: parentType, settings: parentSettingIds } = entities.nodes[parentId];

    // don't try to delete this if the parent node isn't composed (switching from composed node to leaf node)
    if(parentNodeType !== 'Composed' && parentType !== 'root') {
      if(parentNodeType === 'inputTransformations') {
        // TODO
      }
    }

    const parentSettings = mapIdsToEntites(entities.settings, parentSettingIds);
    const indexOffset = getLeafAttr('indexOffset', getNodeData(parentType), parentSettings);

    deleteNode(coords, index - indexOffset);
  });

  // then, replace all modified nodes with newly-built versions.
  updatedNodes.forEach(nodeId => {
    const nodeType = entities.nodes[nodeId].type;
    const def = JSON.stringify(denormalizeNode(entities, nodeId));
    const coords = getNodeCoords(entities, nodeId);

    if(nodeType === 'noiseModule') {
      replaceNode(R.init(coords), R.last(coords), def);
    } else if(nodeType === 'globalConf') {
      setGlobalConf(getTreePointer(), def);
    } else if(nodeType === 'inputTransformation') {
      console.log(def);
      // TODO
      // replaceInputTransformation(R.init(coords), R.last(coords), def);
    } else {
      console.log(`Updated node with unhandled type: ${nodeType}`);
    }
  });

  // finally, handle all new nodes, parsing them into their denormalized form and creating them on the backend
  newNodes.forEach(nodeId => {
    // only add it if it's of type `'noiseModule'`
    if(entities.nodes[nodeId].type === 'noiseModule') {
      const def = JSON.stringify(denormalizeNode(entities, nodeId));
      const coords = getNodeCoords(entities, nodeId);

      // Allocate memory in the Emscripten heap and call the backend function
      addNode(R.init(coords), R.last(coords), def);
    }
  });
};
