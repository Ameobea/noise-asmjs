//! Utilities for configuring the engine backend and dealing with configuration values from the input form

import _ from 'lodash';

import { setConfig, SETTING_TYPES, RANGE_FUNCTIONS } from 'src/interop';
import noiseModules from 'src/data/noiseModules';

// stolen from https://stackoverflow.com/a/7616484/3833068
// which stole it from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
const hashCode = input => {
  var hash = 0;
  var chr;

  if(input.length === 0){ return hash; }

  for(var i = 0; i < input.length; i++){
    chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
};

// used to map the input names to `SETTING_TYPES` used in the interop
const nameMap = {
  noiseModule: {id: SETTING_TYPES['NOISE_MODULE'], parser: id => _.findIndex(noiseModules, {key: id})},
  canvasSize: {id: SETTING_TYPES['CANVAS_SIZE'], parser: parseInt},
  zoom: {id: SETTING_TYPES['ZOOM'], parser: val => (1 / val)},
  speed: {id: SETTING_TYPES['SPEED']},
  seed: {id: SETTING_TYPES['SEED'], parser: hashCode},
  octaves: {id: SETTING_TYPES['OCTAVES'], parser: parseInt},
  frequency: {id: SETTING_TYPES['FREQUENCY']},
  lacunarity: {id: SETTING_TYPES['LACUNARITY']},
  persistence: {id: SETTING_TYPES['PERSISTENCE']},
  attenuation: {id: SETTING_TYPES['ATTENUATION']},
  rangeFunction: {id: SETTING_TYPES['RANGE_FUNCTION'], parser: val => RANGE_FUNCTIONS[val]},
  enableRange: {id: SETTING_TYPES['ENABLE_RANGE'], parser: val => +val},
  displacement: {id: SETTING_TYPES['DISPLACEMENT']},
};

export const doSetConfig = (key, values, enginePointer) => {
  if(!nameMap[key])
    return console.error(`Unhandled setting type in form: ${key}`);

  if(enginePointer === 0)
    return console.error('Attempted to set config value before engine initialized!');

  // transform the raw value from the input into the format expected by the backend
  const {id, parser} = nameMap[key];
  const val = parser ? parser(values[key]) : values[key];

  // call the interop function to set the configuration into the engine state Rust-side
  console.log('Setting config values: ', 'key: ', key, 'value: ', val);
  // canvas size is handled differently from the others; we dispatch an event to Redux where it is used to determine the true
  // canvas size and passed down to the backend elsewhere.
  if(key !== 'canvasSize') {
    setConfig(id, val, enginePointer);
  }
};
