/**
 * Defines data about all possible node types in the composition tree.  Each node must have the following attributes:
 *  - name: The name of the node as displayed to the user.  The key is sent to the backend and used for serialization.
 *  - description: An explanation of what this node does, displayed to the user.
 *  - settings: An array of names of configurations that can be set for this node.
                These are defined in `./nodeSettingDefinitions.js`.
 *  - isLeaf: Boolean or function.  If function, it should take an object of {settingName : value} and return a boolean.
 */

import React from 'react';
import R from 'ramda';

import moduleTypes from 'src/data/noiseModules';
import { getSettingByName } from 'src/selectors/compositionTree';
import compositionSchemes from 'src/data/compositionSchemes';
import { multifractalSettings } from 'src/data/moduleSettings';

const unknownNode = type => ({
  name: 'Unknown Node',
  description: `There was probably an error in the program somewhere, because no node with type ${type} exists.`,
  settings: [],
  isLeaf: true,
});

// A list of the names of all noise modules that are multifractal
const multifractalModules = moduleTypes
  .filter( R.prop('multifractal') )
  .map( R.prop('key') );

const noiseModuleSettings = settings => {
  const moduleType = getSettingByName(settings, 'moduleType');

  // TODO: Make use of the `src/data/moduleCapabilities` to generate settings for the other modules type
  if(multifractalModules.includes(moduleType)){
    return ['moduleType', ...multifractalSettings];
  } else {
    return ['moduleType'];
  }
};

export const getNodeData = nodeType => ({
  'root': {
    name: 'Root Node',
    title: 'Root Node',
    description: 'The root of the entire composition tree.  This node and all of its children are queried each tick to determine the noise values for each coordinate of the canvas.',
    settings: noiseModuleSettings,
    isLeaf: settings => !(getSettingByName(settings, 'moduleType') === 'Composed'), // Only has children if it's a composed module
  },
  'noiseModule': {
    name: 'Noise Module',
    title: settings => moduleTypes.find(R.propEq('key', getSettingByName(settings, 'moduleType'))).name,
    description: 'Noise modeules are the core components of the composition tree.  At its core, a noise module takes a 3-dimensional coordinate and returns a single floating point value.  These are then mapped onto the canvas as a 2D slice with Z as the current sequence number.',
    settings: noiseModuleSettings,
    isLeaf: settings => !(getSettingByName(settings, 'moduleType') === 'Composed'), // Only has children if it's a composed module
  },
  'compositionScheme': {
    name: 'Composition Scheme',
    title: <span style={{color: 'red'}}>Composition Scheme</span>,
    description: 'Composition schemes define methods to combine the outputs of multiple noise modules into a single value.',
    settings: settings => [
      'compositionScheme',
      ...compositionSchemes.find( ({ key }) => key === getSettingByName(settings, 'compositionScheme')).settings,
    ],
    isLeaf: true,
  }
}[nodeType] || unknownNode(nodeType));
