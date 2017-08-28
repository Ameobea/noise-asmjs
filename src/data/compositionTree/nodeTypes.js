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
import { set } from 'zaphod/compat';

import moduleTypes from 'src/data/noiseModules';
import { getSettingByName, getSettingDataByName } from 'src/selectors/compositionTree';
import compositionSchemes from 'src/data/compositionSchemes';
import { multifractalSettings } from 'src/data/moduleSettings';
import moduleCapabilities from 'src/data/moduleCapabilities';
import { inputTransformationTypes } from 'src/data/inputTransformations';
import {
  createSetting,
  defaultCompositionScheme,
  defaultInputTransformation,
  defaultNoiseModule,
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

const log = (...args) => {
  console.log(...args);
  return args[args.length - 1];
};

const getNoiseModuleSettings = settings => {
  const moduleType = getSettingByName(settings, 'moduleType');
  console.log('moduleType: ', moduleType);
  return log('capabilities', moduleCapabilities[moduleType].toArray());
};

const getNoiseModuleNewChildren = (settings, children) => {
  if(getSettingByName(settings, 'moduleType') === 'Composed') {
    if(children.length <= 1) {
      return {
        newChildren: [ defaultCompositionScheme(), defaultNoiseModule() ],
        deletedChildrenTypes: [],
      };
    } else {
      return { newChildren: [], deletedChildrenTypes: [] };
    }
  } else {
    return {
      newChildren: [],
      deletedChildrenTypes: ['noiseModule', 'compositionScheme'],
    };
  }
};

const getCompositionSchemeSettings = settings => [
  'compositionScheme',
  ...compositionSchemes.find( ({ key }) => key === getSettingByName(settings, 'compositionScheme') ).settings,
];

const getCompositionSchemeChangedSettings = (settings, parentNode, allNodes, allSettings) => {
  if(getSettingByName(settings, 'compositionScheme') === 'weightedAverage') {
    if(!parentNode) {
      console.log('No parent node for node with settings ', settings);
      return [];
    }

    // weighted average's value depends on its sibling nodes.
    const requiredValues = parentNode.children.reduce((acc, id) => {
      if(allNodes[id].type === 'noiseModule') {
        return {...acc, [id]: 0};
      } else {
        return acc;
      }
    }, {});
    const value = getSettingByName(settings, 'averageWeights');

    if(R.keys(value).length !== R.keys(requiredValues).length) {
      // Remove all keys for modules that no longer exist and add new ones for new mdules.
      const newValue = R.merge(requiredValues, R.pick(R.keys(requiredValues), value || {}));
      const existingSetting = getSettingDataByName(settings, 'averageWeights');

      // create the setting if it doesn't already exist.
      const updatedSetting = existingSetting
        ? set(existingSetting, 'value',  newValue)
        : createSetting('averageWeights', newValue);
      return { [updatedSetting.id]: updatedSetting };
    }
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
      return {
        newChildren: [ defaultNoiseModule() ],
        deletedChildrenTypes: [],
      };
    } else {
      return { newChildren: [], deletedChildrenTypes: [] };
    }
  } else {
    // If changing from a HONF to any other input transformation, clear all children.
    return {
      newChildren: [],
      deletedChildrenTypes: ['noiseModule', 'compositionScheme', 'inputTransformations'],
    };
  }
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
    // If null, the values of all existing settings are kept the same.  Otherwise, it's a function that takes the node's current settings,
    // the node's parent, allNodes, and allSettings as arguments and returns an object of `{settingId: settingValue}`s containing updated settings.
    changedSettings: null,
    isLeaf: R.compose(R.not, isComposed), // Only has children if it's a composed module
    // Function that is called with the node's settings every time a setting is changed.
    // Expects function with signature `(settings, children) => {newChildren: [node], deletedChildrenTypes: ['moduleType']` or `null`.
    newChildren: getNoiseModuleNewChildren,
    // The node defined by the schema returned from this function will be added as a child when the "add child" button is pressed.
    newChildDefinition: composedNoiseModuleChildDefinition,
    canBeDeleted: false,
    dependentOnParent: false,
    // determines what number to subtract from the index when commiting to the backend
    indexOffset: settings => 2 + ((getSettingByName(settings, 'moduleType') === 'Composed') ? 1 : 0),
  },
  globalConf: {
    name: 'Global Configuration',
    title: <span style={{color: 'green'}}>Global Configuration</span>,
    description: 'Configuration options for the composition tree that affect the entire tree.',
    settings: ['zoom', 'speed'],
    changedSettings: null,
    isLeaf: true,
    newChildren: null,
    newChildDefinition: false,
    canBeDeleted: false,
    dependentOnParent: false,
    indexOffset: 0,
  },
  noiseModule: {
    name: 'Noise Module',
    title: settings => moduleTypes.find(R.propEq('key', getSettingByName(settings, 'moduleType'))).name,
    description: 'Noise modeules are the core components of the composition tree.  At its core, a noise module takes a 3-dimensional coordinate and returns a single floating point value.  These are then mapped onto the canvas as a 2D slice with Z as the current sequence number.',
    settings: getNoiseModuleSettings,
    changedSettings: null,
    isLeaf: false,
    newChildren: getNoiseModuleNewChildren,
    newChildDefinition: composedNoiseModuleChildDefinition,
    canBeDeleted: true, // TODO: Only allow them to be deleted if they're not the only child of their parent.
    dependentOnParent: false,
    indexOffset: settings => 1 + ((getSettingByName(settings, 'moduleType') === 'Composed') ? 1 : 0),
  },
  compositionScheme: {
    name: 'Composition Scheme',
    title: <span style={{color: 'red'}}>Composition Scheme</span>,
    description: 'Composition schemes define methods to combine the outputs of multiple noise modules into a single value.',
    settings: getCompositionSchemeSettings,
    changedSettings: getCompositionSchemeChangedSettings,
    isLeaf: true,
    newChildren: null,
    newChildDefinition: false,
    canBeDeleted: false,
    dependentOnParent: settings => getSettingByName(settings, 'compositionScheme') === 'weightedAverage',
    indexOffset: 0,
  },
  inputTransformations: {
    name: 'Input Transformation',
    title: <span style={{color: 'purple'}}>Input Transformations</span>,
    description: 'Input transformations are sort of noise function preprocessors.  Given the three-dimensional input coordinate, they alter its values in some way and then pass the altered coordinate on to the noise function.',
    settings: [],
    changedSettings: null,
    isLeaf: false,
    newChildren: null,
    newChildDefinition: defaultInputTransformation(),
    canBeDeleted: false,
    dependentOnParent: false,
    indexOffset: 0,
  },
  inputTransformation: {
    name: 'Input Transformation',
    title: settings => {
      const transformationType = getSettingByName(settings, 'inputTransformationType');
      return inputTransformationTypes.find( ({ key }) => key === transformationType ).name;
    },
    description: 'A transformation that is applied to the three-dimensional input coordinate of a noise function before being passed to the noise function.',
    settings: getInputTransformationSettings,
    changedSettings: null,
    isLeaf: R.compose(R.not, isHONF),
    newChildren: getInputTransformationNewChildren,
    newChildDefinition: R.compose(honf => honf ? defaultNoiseModule() : false, isHONF),
    canBeDeleted: true,
    dependentOnParent: false,
    indexOffset: 0,
  },
}[nodeType] || unknownNode(nodeType));
