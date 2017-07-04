/**
 * Functions for interacting with the Asm.JS/Emscripten backend
 */

/* global Module */

import store from 'src/reducers';
import { getEnginePointer } from 'src/selectors/enginePointer';
import { setEnginePointer } from 'src/reducers/enginePointerReducer';

export const MODULE_TYPES = {
  FBM: 0,
  WORLEY: 1,
  OPEN_SIMPLEX: 2,
  BILLOW: 3,
  HYBRID_MULTI: 4,
  SUPER_SIMPLEX: 5,
  VALUE: 6,
  RIDGED_MULTI: 7,
  BASIC_MULTI: 8,
  CONSTANT: 9,
  COMPOSED: 10,
};

export const RANGE_FUNCTIONS = {
  euclidean: 0,
  euclideanSquared: 1,
  manhattan: 2,
  chebyshev: 3,
  quadratic: 4,
};

// add a hook into the `Module` that can be called from the Rust side to register the noise engine's pointer
Module.registerEnginePointer = pointer => {
  const action = setEnginePointer(pointer);
  console.log('action', action);
  store.dispatch(action);
};

/**
 * Initializes the noise engine backend, returning a pointer to the noise engine configuration object passed along with
 * configuration
 */
export const init = canvasSize => {
  // make sure we've not already set an engine pointer
  if(getEnginePointer() !== 0) {
    return console.error('There\'s already a set engine pointer; can\'t initialize a new engine!');
  }

  // Call the internal engine code, initializing the engine and returning a pointer to its settings.
  console.log(`Calling the noise engine initialization function with canvas size of ${canvasSize}...`);
  Module.ccall('init', null, ['number'], [canvasSize]);
};
