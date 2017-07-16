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
import { getSetting } from 'src/helpers/compositionTree';

const unknownNode = type => ({
  name: 'Unknown Node',
  description: `There was probably an error in the program somewhere, because no node with type ${type} exists.`,
  settings: [],
  isLeaf: true,
});

/**
 * For node schema definitions, each attribute is either a value or a function that takes the node's settings as an argument and
 * returns a value.  This helper method checks whether or not it's a function and, if it is, automatically calls it with the
 * supplied settings to produce a value.
 */
export const getLeafAttr = (attr, schema, settings) => {
  return typeof schema[attr] === 'function' ? schema[attr](settings) : schema[attr];
};

// A list of the names of all noise modules that are multifractal
const multifractalModules = R.map(R.prop('key'), R.filter(R.prop('multifractal'), moduleTypes));
// A list of settings that apply to all multifractal noise modules
const multifractalSettings = ['octaves', 'frequency', 'lacunarity', 'persistence'];

const noiseModuleSettings = settings => {
  const isMultifractal = multifractalModules.includes(getSetting(settings, 'moduleType'));
  return isMultifractal ? ['moduleType', ...multifractalSettings] : ['moduleType'];
};

export const getNodeData =  nodeType => ({
  'root': {
    name: 'Root Node',
    title: 'Root Node',
    description: 'The root of the entire composition tree.  This node and all of its children are queried each tick to determine the noise values for each coordinate of the canvas.',
    settings: noiseModuleSettings,
    isLeaf: settings => !(getSetting(settings, 'moduleType') === 'composed'), // Only has children if it's a composed module
  },
  'noiseModule': {
    name: 'Noise Module',
    title: settings => R.filter(R.propEq('key', getSetting(settings, 'moduleType')), moduleTypes)[0].name,
    description: 'Noise modeules are the core components of the composition tree.  At its core, a noise module takes a 3-dimensional coordinate and returns a single floating point value.  These are then mapped onto the canvas as a 2D slice with Z as the current sequence number.',
    settings: noiseModuleSettings,
    isLeaf: settings => !(getSetting(settings, 'moduleType') === 'composed'), // Only has children if it's a composed module
  },
}[nodeType] || unknownNode(nodeType));
