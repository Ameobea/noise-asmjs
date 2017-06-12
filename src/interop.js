/**
 * Functions for interacting with the Asm.JS/Emscripten backend
 */

/* global Module */

import { dispatch } from 'redux';

import { store } from './';
import { setEnginePointer } from './reducers/enginePointerReducer';

export const SETTING_TYPES = {
  GENERATOR_TYPE: 0,
  SEED: 1,
  CANVAS_SIZE: 2,
  OCTAVES: 3,
  FREQUENCY: 4,
  LACUNARITY: 5,
  PERSISTENCE: 6,
  ZOOM: 7,
  SPEED: 8,
};

export const GENERATOR_TYPES = {
  FBM: 0,
  WORLEY: 1,
  OPEN_SIMPLEX: 2,
  BILLOW: 3,
  HYBRID_MULTI: 4,
  SUPER_SIMPLEX: 5,
  VALUE: 6,
  RIDGED_MULTI: 7,
};2

/**
 * Wrapper around the native configuration function.
 * Arg 1 is the setting type
 * Arg 2 is the setting value
 * Arg 3 is a pointer to the noise engine struct returned by the `init()` function
 */
export const setConfig = Module.cwrap('set_config', null, ['number', 'number', 'number']);

// add a hook into the `Module` that can be called from the Rust side to register the noise engine's pointer
Module = {
  ...Module,
  registerEnginePointer: pointer => {
    const action = setEnginePointer(pointer);
    console.log('action', action);
    store.dispatch(action);
  },
};

/**
 * Initializes the noise engine backend, returning a pointer to the noise engine configuration object passed along with
 * configuration
 */
export const init = () => {
  const state = store.getState();
  // make sure we've not already set an engine pointer
  if(state.enginePointer.pointer !== 0) {
    return console.error('There\'s already a set engine pointer; can\'t initialize a new engine!');
  }

  // Call the internal engine code, initializing the engine and returning a pointer to its settings.
  console.log('Calling the noise engine initialization function...');
  Module.ccall('init', null, ['number'], [state.maxStageSize]);
};
