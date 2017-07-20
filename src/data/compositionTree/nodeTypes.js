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
import { inputTransformationTypes } from 'src/data/inputTransformations';
import {
  defaultCompositionScheme,
  defaultInputTransformation,
  defaultInputTransformations,
  defaultNoiseModule
} from 'src/helpers/compositionTree/util';

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

const getNoiseModuleSettings = settings => {
  const moduleType = getSettingByName(settings, 'moduleType');

  // TODO: Make use of the `src/data/moduleCapabilities` to generate settings for the other modules type
  if(multifractalModules.includes(moduleType)){
    return ['moduleType', ...multifractalSettings];
  } else {
    return ['moduleType'];
  }
};

const getNoiseModuleNewChildren = (settings, children) => {
  if(getSettingByName(settings, 'moduleType') === 'Composed' && children.length === 0) {
    return [ defaultCompositionScheme(), defaultInputTransformations(), defaultNoiseModule() ];
  } else {
    return [];
  }
};

const getInputTransformationSettings = settings => {
  const additionalSettings = {
    zoomScale: ['speed', 'zoom'],
    honf: ['replacedDim'],
    scaleAll: ['scaleFactor'],
  }[getSettingByName(settings, 'inputTransformationType')];

  return ['inputTransformationType', ...additionalSettings];
};

const getInputTransformationNewChildren = (settings, children) => {
  if(getSettingByName(settings, 'inputTransformationType') === 'honf') {
    if(children.length === 0) {
      return [ defaultNoiseModule(), defaultNoiseModule() ];
    }
  }

  return [];
};

/**
 * Returns `true` if the node with the supplied settings is a composed noise module.
 */
const isComposed = settings => getSettingByName(settings, 'moduleType') === 'Composed';

/**
 * Returns `true` if the node with the supplied settings is a higher order noise function input transformation.
 */
const isHONF = settings => getSettingByName(settings, 'inputTransformationType') === 'honf';

/**
 * If the module type is composed, then returns a new child that is a default noise module.  If not, then
 * is unable to have children.
 */
const composedNoiseModuleChildDefinition = R.compose(
  composed => composed ? defaultNoiseModule() : false,
  isComposed
);

export const getNodeData = nodeType => ({
  root: {
    name: 'Root Node',
    title: <span style={{color: 'white'}}>Root Node</span>,
    description: 'The root of the entire composition tree.  This node and all of its children are queried each tick to determine the noise values for each coordinate of the canvas.',
    settings: getNoiseModuleSettings,
    isLeaf: R.compose(R.not, isComposed), // Only has children if it's a composed module
    newChildren: getNoiseModuleNewChildren, // Expects function with signature `(settings, children) => [node]` or `null`.
    newChildDefinition: composedNoiseModuleChildDefinition,
    canBeDeleted: false,
    subscribedToParent: false,
  },
  globalConf: {
    name: 'Global Configuration',
    title: <span style={{color: 'green'}}>Global Configuration</span>,
    description: 'Configuration options for the composition tree that affect the entire tree.',
    settings: ['zoom', 'speed'],
    isLeaf: true,
    newChildren: null,
    newChildDefinition: false,
    canBeDeleted: false,
    subscribedToParent: false,
  },
  noiseModule: {
    name: 'Noise Module',
    title: settings => moduleTypes.find(R.propEq('key', getSettingByName(settings, 'moduleType'))).name,
    description: 'Noise modeules are the core components of the composition tree.  At its core, a noise module takes a 3-dimensional coordinate and returns a single floating point value.  These are then mapped onto the canvas as a 2D slice with Z as the current sequence number.',
    settings: getNoiseModuleSettings,
    isLeaf: R.compose(R.not, isComposed), // Only has children if it's a composed module
    newChildren: getNoiseModuleNewChildren,
    newChildDefinition: composedNoiseModuleChildDefinition,
    canBeDeleted: true, // TODO: Only allow them to be deleted if they're not the only child of their parent.
    subscribedToParent: false,
  },
  compositionScheme: {
    name: 'Composition Scheme',
    title: <span style={{color: 'red'}}>Composition Scheme</span>,
    description: 'Composition schemes define methods to combine the outputs of multiple noise modules into a single value.',
    settings: settings => [
      'compositionScheme',
      ...compositionSchemes.find( ({ key }) => key === getSettingByName(settings, 'compositionScheme') ).settings,
    ],
    isLeaf: true,
    newChildren: null,
    newChildDefinition: false,
    canBeDeleted: false,
    subscribedToParent: settings => getSettingByName(settings, 'compositionScheme') === 'weightedAverage',
  },
  inputTransformations: {
    name: 'Input Transformation',
    title: <span style={{color: 'purple'}}>Input Transformations</span>,
    description: 'Input transformations are sort of noise function preprocessors.  Given the three-dimensional input coordinate, they alter its values in some way and then pass the altered coordinate on to the noise function.',
    settings: [],
    isLeaf: false,
    newChildren: null,
    newChildDefinition: defaultInputTransformation(),
    canBeDeleted: false,
    subscribedToParent: false,
  },
  inputTransformation: {
    name: 'Input Transformation',
    title: settings => {
      const transformationType = getSettingByName(settings, 'inputTransformationType');
      return inputTransformationTypes.find( ({ key }) => key === transformationType ).name;
    },
    description: 'A transformation that is applied to the three-dimensional input coordinate of a noise function before being passed to the noise function.',
    settings: getInputTransformationSettings,
    isLeaf: R.compose(R.not, isHONF),
    newChildren: getInputTransformationNewChildren,
    newChildDefinition: R.compose(honf => honf ? defaultNoiseModule() : false, isHONF),
    canBeDeleted: true,
    subscribedToParent: false,
  },
}[nodeType] || unknownNode(nodeType));
