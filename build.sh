#!/bin/sh

# Compiles the Asm.JS engine backend and symlinks it into the static code directory
cd engine && ./release_emscripten.sh
cd ..
echo "Symlinking \`./engine/target/asmjs-unknown-emscripten/release/noise-backend.js\` to \`./public/compiled.js\`"
ln -sf $(pwd)/engine/target/asmjs-unknown-emscripten/release/noise-backend.js $(pwd)/public/compiled.js

# Builds the frontend, including the compiled code
yarn run build
