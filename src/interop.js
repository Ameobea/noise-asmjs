/**
 * Functions for interacting with the Asm.JS/Emscripten backend
 */

/* global Module */

import store from 'src/reducers';
import { getEnginePointer, getTreePointer } from 'src/selectors/enginePointer';
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

export const pause = Module.cwrap('pause_engine', null, []);
export const resume = Module.cwrap('resume_engine', null, []);

// tree_pointer, depth, coords, index, node_definition
const addNodeInner = Module.cwrap('add_node', 'number', ['number', 'number', 'number', 'number', 'number']);

/**
 * Adds a node to the composition tree at the specified coordinates and index.  Allocates space for the definition string,
 * writes it into Emscripten memory, and `free()`s it after the node is built.
 */
export const addNode = (nodeCoords, index, def_string) => {
  const bufferSize = Module.lengthBytesUTF8(def_string) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(nodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(def_string, defBufPtr, 100000);
  // convert the coordinate array to a typed array and write it into the buffer we allocated for it
  Module.HEAP32.set(new Int32Array(nodeCoords), coordBufPtr / 4);

  // actually call the backend's node add function and record the result
  const status = addNodeInner(getTreePointer(), nodeCoords.length, coordBufPtr, index, defBufPtr);

  Module._free(defBufPtr);
  Module._free(coordBufPtr);

  return status;
};

// tree_pointer, depth, coords, index
const deleteNodeInner = Module.cwrap('delete_node', 'number', ['number', 'number', 'number', 'number']);

export const deleteNode = (nodeCoords, index) => {
  const coordBufPtr = Module._malloc(nodeCoords.length * 4);
  Module.HEAP32.set(new Int32Array(nodeCoords), coordBufPtr / 4);

  const status = deleteNodeInner(getTreePointer(), nodeCoords.length, coordBufPtr, index);

  Module._free(coordBufPtr);

  return status;
};

const replaceNodeInner = Module.cwrap('replace_node', 'number', ['number', 'number', 'number', 'number', 'number']);

export const replaceNode = (nodeCoords, index, def_string) => {
  const bufferSize = Module.lengthBytesUTF8(def_string) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(nodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(def_string, defBufPtr, 100000);
  // convert the coordinate array to a typed array and write it into the buffer we allocated for it
  Module.HEAP32.set(new Int32Array(nodeCoords), coordBufPtr / 4);

  // actually call the backend's node add function and record the result
  const status = replaceNodeInner(getTreePointer(), nodeCoords.length, coordBufPtr, index, defBufPtr);

  Module._free(defBufPtr);
  Module._free(coordBufPtr);

  return status;
};

// export const render_single_frame = Module.cwrap('render_single_frame', null, []);
