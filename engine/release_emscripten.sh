cargo rustc --target=asmjs-unknown-emscripten --release --verbose -- -Z print-link-args -C\
  link-args="-v -O0 --js-library ./src/library_minutiae.js -s TOTAL_MEMORY=67108864 -s NO_EXIT_RUNTIME=1 -s DISABLE_EXCEPTION_CATCHING=0 -s DEMANGLE_SUPPORT=1 -s ASSERTIONS=2"
# TODO: re-enable closure compiler
# TODO: actually enable optimizatins (--llvm-lto 3 -O3, disabled exception catching, demangle, assertions)
