# Asm.JS Noise Web Application

![](https://tokei.rs/b1/github/Ameobea/noise-asmjs)
![](https://tokei.rs/b1/github/Ameobea/noise-asmjs?category=files)

This project allows users to experiment with designing noise functions using the [`noise-rs`](https://github.com/brendanzab/noise-rs) library. You can select your own noise generation functions, configure them, and view the results in real time.  It makes use of Asm.JS or WebAssembly (depending on if WebAssembly is available in the browser) to run the noise functions internally.

Development is currently in the early stages, but a demo link will be provided once things are ready to go!

## Building and Running Yourself
Setting up your own version of this library is pretty easy, but can take a bit of time for Emscripten (the tool used to compile Rust into Asm.JS/WebAssembly) to compile.  Even if you've never worked with either of those technologies before, you should be just fine getting this to work.

If you have any issues with the build script or the installation process in general, please open an issue explaining the problem and I'll look into getting it resolved!

### Installing Dependencies + Compilers
You'll need to have npm installed as well as the Rust compiler toolchain.  To install Rust, simply install [rustup](https://rustup.rs/) by following the instructions on the site.  Once you've got that installed, you'll need to add the nightly toolchain by running `rustup install nightly` and make it the default by running `rustup default nightly`.  Next, you'll need to add both the Asm.JS or the WebAssembly toolchains by running the following commands: `rustup target add wasm32-unknown-emscripten` and `rustup target add asmjs-unknown-emscripten`.

### Installing Emscripten
This is the most time consuming part of the installation; it can take up to 2 hours on some slower laptops.  It's currently been tested on Linux and MacOS.

1. First, download the portable version of the Emscripten SDK from [here](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html#download-and-install).
2. Once that's done, run `source ./emsdk_env.sh` to set some environment variables.
3. Run `emsdk update` to update the SDK to the latest version.
4. Run `emsdk install sdk-incoming-64bit` to actually install the compiler toolchain including LLVM and Clang.  From my experience, using the system LLVM/Clang versions fails, so you'll actually need to compile their version.
5. Run `emsdk activate sdk-incoming-64bit` to select the newly installed toolchain and activate it.

At this point, you should be good to go with Emscripten!

### Compiling + Building
Install the NPM dependencies by either running `npm install` or `yarn` if you'd perfer in the project root directory.  Then, run either `./build.sh` which will take care of the process of compiling the Rust backend into both Asm.JS and WebAssembly, building the React frontend, and packaging everything up.

Once the script completes, the packaged site will be found in the `/dist` directory.  It's a static webpage, so you can just open open the `index.html` file in a web browser and be good to go!

## Implementation
The implementation is actually rather simple.  The React frontend communicates with the Asm.JS/WebAssembly backend by calling functions exported by the Rust code.  These functions alter the internal state of the noise model and, since JS is single threaded, allow values to be changed on the fly despite JavaScript's asynchronous nature.

The backend generates 3D noise and renders 2D slices of it to the canvas by mapping each returned value to a color.  The third dimension is a sequence number (multiplied by the speed setting set in the interface's configuration).

## Feedback + Contributions
This project is currently in active development and is not yet ready for production usage or deployment.  Once I've gotten the basis of it fleshed out, I'm happy to receive any and all bug reports, feature requests, and other feedback; just submit an issue/pr or reach out directly to me at my email: me@ameo.link or tweet me @ameobea10

If you'd like to contribute to the project, I'm more than happy to accept PRs as well!  If your idea is large-scale or may affect the current implementations of things, I'd appreciate you opening an issue explaining what you plan on doing first.

## License
This project is released under the MIT license.
