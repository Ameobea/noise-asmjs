/**
 * This file contains functions that are made available to the WebAssmbly/Asm.JS backend, allowing it to modify the DOM,
 * interact with JavaScript code, and do things like send messages over WebSockets.
 */

mergeInto(LibraryManager.library, {
  canvas_render: function(ptr) {
    // Module.canvas is defined in the HTML file and given a direct refernce to the actual canvas object
    var canvas = Module.canvas;
    var ctx = canvas.getContext('2d');

    // Constructs a new view into the engine's memory containing the pixel values
    var buf = new Uint8ClampedArray(HEAPU8.buffer, ptr, canvas.width * canvas.width * 4);
    var imageData = new ImageData(buf, canvas.width, canvas.width);
    // set the canvas's image data to the buffer
    ctx.putImageData(imageData, 0, 0);
  },

  /**
   * Registers a pointer to the noise engine's state into the global Redux store.  Calls a function that is initialized
   * at runtime from within the application itself.
   */
  setEnginePointer: function(ptr) {
    console.log('Setting engine pointer...');
    Module.registerEnginePointer(ptr);
  },

  /**
   * Wrappers around `console.log` and `console.error` that circumvents the emulated stdout so it can be used after main exits
   */
  js_debug: function(strPtr) {
    var string = Module.Pointer_stringify(strPtr);
    console.log(string);
  },
  js_error: function(strPtr) {
    var string = Module.Pointer_stringify(strPtr);
    console.error(string);
  },
});
