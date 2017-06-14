cargo rustc --target=asmjs-unknown-emscripten --release --verbose -- -Z print-link-args -C\
  link-args="-v --profiling --js-library ./src/library_minutiae.js -s TOTAL_MEMORY=67108864 -s DISABLE_EXCEPTION_CATCHING=0 -s DEMANGLE_SUPPORT=1 -s ASSERTIONS=1 -s NO_EXIT_RUNTIME=1"