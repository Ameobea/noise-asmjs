/**
 * Functions for interacting with the Asm.JS/Emscripten backend
 */

/* global Module */

import store from 'src/reducers';
import { getEnginePointer } from 'src/selectors/enginePointer';
import { setEnginePointer, setTreePointer } from 'src/reducers/enginePointerReducer';

export const RANGE_FUNCTIONS = {
  euclidean: 0,
  euclideanSquared: 1,
  manhattan: 2,
  chebyshev: 3,
  quadratic: 4,
};

const log = (...args) => {
  console.log(...args);
  return args[args.length - 1];
};

/**
 * Adds a hook into the `Module` that can be called from the Rust side to register the noise engine's pointer
 */
Module.registerEnginePointer = pointer => store.dispatch(log(setEnginePointer(pointer)));

/**
 * Adds a hook into the `Module` that can be called from the Rust side to register a pointer to the backend's composition tree.
 */
Module.registerTreePointer = pointer => store.dispatch(log(setTreePointer(pointer)));

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

/**
 * After the canvas size changes, sends a message to the backend to resize the buffer where pixel data is written.
 */
export const setCanvasSize = Module.cwrap('set_canvas_size', null, ['number', 'number']);
