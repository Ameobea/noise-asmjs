/**
 * Defines data about all possible node types in the composition tree.  Each node must have the following attributes:
 *  - name: The name of the node as displayed to the user.  The key is sent to the backend and used for serialization.
 *  - description: An explanation of what this node does, displayed to the user.
 *  - settings: An array of names of configurations that can be set for this node.
                These are defined in `./nodeSettingDefinitions.js`.
 *  - isLeaf: Boolean or function.  If function, it should take an object of {settingName : value} and return a boolean.
 */

import R from 'ramda';

import moduleTypes from 'src/data/noiseModules';

const unknownNode = type => ({
  name: 'Unknown Node',
  description: `There was probably an error in the program somewhere, because no node with type ${type} exists.`,
  settings: [],
  isLeaf: true,
});

export const getLeafStatus = (schema, settings) => typeof schema.isLeaf === 'function' ? schema.isLeaf(settings) : schema.isLeaf;

export const getLeafTitle = (schema, settings) => typeof schema.title === 'function' ? schema.title(settings) : schema.title;

const getSetting = (settings, settingName) => {
  const filteredSettings = R.filter(R.propEq('key', settingName), settings);
  if(filteredSettings.length[0] === 0) {
    return console.error(`No settings with name ${settingName} found!`);
  } else if(settings.length !== 1) {
    console.error(`Multiple settings with name ${settingName} found!`);
  }

  return filteredSettings[0].value;
};

export const getNodeData =  nodeType => ({
  'root': {
    name: 'Root Node',
    title: 'Root Node',
    description: 'The root of the entire composition tree.  This node and all of its children are queried each tick to determine the noise values for each coordinate of the canvas.',
    settings: ['moduleType'],
    isLeaf: settings => !(getSetting(settings, 'moduleType') === 'composed'), // Only has children if it's a composed module
  },
  'noiseModule': {
    name: 'Noise Module',
    title: settings => R.filter(R.propEq('key', getSetting(settings, 'moduleType')), moduleTypes)[0].name,
    description: 'TODO',
    settings: ['moduleType'],
    isLeaf: settings => !(getSetting(settings, 'moduleType') === 'composed'), // Only has children if it's a composed module
  },
}[nodeType] || unknownNode(nodeType));
