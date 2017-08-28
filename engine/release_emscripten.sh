cargo rustc --target=asmjs-unknown-emscripten --release --verbose -- -Z print-link-args -C\
  link-args="-v -O3 --js-library ./src/library_minutiae.js -s TOTAL_MEMORY=67108864 -s NO_EXIT_RUNTIME=1 -s ASSERTIONS=0 --llvm-lto 3"
