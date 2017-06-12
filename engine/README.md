# Noise Engine

This module is written in Rust and actually performs the work of running the noise module, applying the settings supplied by the user, and rendering the result to the canvas.  It is compiled to both WebAssembly and Asm.JS using the [Emscripten](https://github.com/kripken/emscripten) compiler toolchain.

The [noise-rs](https://github.com/brendanzab/noise-rs) library to generate the noise itself, which contains a variety of noise module implementations that are all configurable.  The modules generate 3D noise from which 2D slices are pulled and rendered to the canvas (using the current sequence number as the third dimension).

## Implementation

Due to the asynchronous nature of JavaScript, it's necessary to configure the simulation using function calls initiated from the JS frontend.  These functions take a pointer to the engine's state and mutate it directly, allowing for runtime values to be changed on the fly.
