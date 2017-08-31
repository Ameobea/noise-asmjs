/**
 * Useful abstractions for dealing with the composition tree.  Mostly concern taking node/setting IDs and looking around
 * the tree to find parents, children, etc. and mapping the IDs to actual entities.
 */

import R from 'ramda';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { mapIdsToEntites } from 'src/helpers/compositionTree/util';
import { denormalizeNode } from 'src/helpers/compositionTree/normalization';
import { NULL_UUID } from 'src/data/misc';

/**
 * Given the global Redux state and the ID of a node, selects it from the store and returns it.
 */
export const getNodeById = ({ entities: { nodes } }, nodeId) => nodes[nodeId];

/**
 * Finds the node that is the parent to the setting with the given id and returns its data (`{id, settings, children}`).
 */
export const getSettingParent = (allNodes, settingId) => {
  return R.values(allNodes).find( ({ settings }) => settings.includes(settingId) );
};

/**
 * Finds the node that is the parent to the node with the supplied id and returns its data (`{id, settings, children}`).
 */
export const getNodeParent = (allNodes, nodeId) => {
  return R.values(allNodes).find( ({ children }) => children.includes(nodeId) );
};

/**
 * For node schema definitions, each attribute is either a value or a function that takes the node's settings as an argument and
 * returns a value.  This helper method checks whether or not it's a function and, if it is, automatically calls it with the
 * supplied settings to produce a value.
 */
export const getLeafAttr = (attr, schema, settings, parentNode, allNodes, allSettings) => {
  return typeof schema[attr] === 'function' ? schema[attr](settings, parentNode, allNodes, allSettings) : schema[attr];
};

/**
 * Locates node `id` in the composition tree and calculates the value of its `attr` by matching its `type` with its schema,
 * pulling down its settings, and applying them to the function defined in its schema if necessary.
 */
export const getLeafAttrById = (allNodes, allSettings, nodeId, attr) => {
  const { type, settings } = allNodes[nodeId];
  const schema = getNodeData(type);
  const mappedSettings = mapIdsToEntites(allSettings, settings);

  return getLeafAttr(attr, schema, mappedSettings);
};

/**
 * Given the id of a node, returns the ids of all of its siblings (along with its own id).  Siblinges are defined as all nodes
 * that are children of the node's parent.
 */
export const getSiblingIds = (allNodes, nodeId) => getNodeParent(allNodes, nodeId).children;

export const getSettingDataByName = (settings, settingName) => {
  const filteredSettings = settings.filter(R.propEq('key', settingName));
  if(filteredSettings.length === 0) {
    return null;
  } else if(filteredSettings.length !== 1) {
    console.error(`Multiple settings with name ${settingName} found!`);
  }

  return filteredSettings[0];
};

/**
 * Given an array of settings in `{key, value, id}` format, returns the value of the setting with the supplied `settingName`.
 */
export const getSettingByName = (settings, settingName) => {
  const setting = getSettingDataByName(settings, settingName);
  return setting && setting.value;
};

export const getSettingIdByName = (settings, settingName) => {
  const setting = getSettingDataByName(settings, settingName);
  return setting && setting.id;
};

/**
 * Returns a JSON string corresponding to the IR definition of the composition tree's root node.
 */
export const getRootNodeDefinition = entities => JSON.stringify(denormalizeNode(entities, NULL_UUID));
