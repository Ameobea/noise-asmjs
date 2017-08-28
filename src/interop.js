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
  Module.ccall('init', null, ['number'], [canvasSize]);
};

/**
 * Replaces the currently active global configuration for the composition tree with the provided configuration in
 * IR format.
 */
export const setGlobalConf = (enginePointer, confString) => {
  const bufferSize = Module.lengthBytesUTF8(confString) + 1;
  // allocate space on the heap for the definition string
  const defBufPtr = Module._malloc(bufferSize);
  // copy the string into the allocated buffer
  Module.stringToUTF8(confString, defBufPtr, 100000);

  // call the backend function and replace the active master configuration
  const status = setGlobalConfInner(enginePointer, defBufPtr);

  // free the definition's buffer
  Module._free(defBufPtr);

  return status;
};

const setGlobalConfInner = Module.cwrap('set_global_conf', 'number', ['number', 'number']);

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
export const addNode = (nodeCoords, index, defString) => {
  const bufferSize = Module.lengthBytesUTF8(defString) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(nodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(defString, defBufPtr, 100000);
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

export const replaceNode = (nodeCoords, index, defString) => {
  const bufferSize = Module.lengthBytesUTF8(defString) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(nodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(defString, defBufPtr, 100000);
  // convert the coordinate array to a typed array and write it into the buffer we allocated for it
  Module.HEAP32.set(new Int32Array(nodeCoords), coordBufPtr / 4);

  // actually call the backend's node add function and record the result
  const status = replaceNodeInner(getTreePointer(), nodeCoords.length, coordBufPtr, index, defBufPtr);

  Module._free(defBufPtr);
  Module._free(coordBufPtr);

  return status;
};

// (tree_pointer, tree_depth, coords, node_index, transformation_definition)
const addInputTransformationInner = Module.cwrap('add_input_transformation', 'number', ['number', 'number', 'number', 'number']);

export const addInputTransformation = (parentNodeCoords, index, defString) => {
  const bufferSize = Module.lengthBytesUTF8(defString) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(parentNodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(defString, defBufPtr, 100000);
  // convert the coordinate array to a typed array and write it into the buffer we allocated for it
  Module.HEAP32.set(new Int32Array(parentNodeCoords), coordBufPtr / 4);

  // call the backend function and try to add the input transformation
  const status = addInputTransformationInner(getTreePointer(), parentNodeCoords.length, coordBufPtr, index, defBufPtr);

  Module._free(defBufPtr);
  Module._free(coordBufPtr);

  return status;
};

// tree_pointer, depth, coords, node_index, transformation_index
export const deleteInputTransformationInner = Module.cwrap(
  'delete_input_transformation', 'number', ['number', 'number', 'number', 'number', 'number']
);

export const deleteInputTransformation = (parentNodeCoords, treeIndex, transformationIndex) => {
  const coordBufPtr = Module._malloc(parentNodeCoords.length * 4);
  Module.HEAP32.set(new Int32Array(parentNodeCoords), coordBufPtr / 4);

  const status = deleteInputTransformationInner(
    getTreePointer(), parentNodeCoords.length, coordBufPtr, treeIndex, transformationIndex
  );

  Module._free(coordBufPtr);

  return status;
};

// (tree_pointer, tree_depth, coords, node_index, transformation_index, transformation_definition)
const replaceInputTransformationInner = Module.cwrap(
  'replace_input_transformation', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']
);

export const replaceInputTransformation = (parentNodeCoords, treeIndex, transformationIndex, defString) => {
  const bufferSize = Module.lengthBytesUTF8(defString) + 1;
  // allocate space on the heap for both the definition string as well as the coordinates array
  const defBufPtr = Module._malloc(bufferSize);
  const coordBufPtr = Module._malloc(parentNodeCoords.length * 4); // &[i32]
  Module.stringToUTF8(defString, defBufPtr, 100000);
  // convert the coordinate array to a typed array and write it into the buffer we allocated for it
  Module.HEAP32.set(new Int32Array(parentNodeCoords), coordBufPtr / 4);

  // actually call the backend's node add function and record the result
  const status = replaceInputTransformationInner(
    getTreePointer(), parentNodeCoords.length, coordBufPtr, treeIndex, transformationIndex, defBufPtr
  );

  Module._free(defBufPtr);
  Module._free(coordBufPtr);

  return status;
};

// export const render_single_frame = Module.cwrap('render_single_frame', null, []);
