cargo rustc --target=wasm32-unknown-emscripten --release --verbose -- -Z print-link-args -C\
  link-args="-v -g -O3 --js-library ./src/library_minutiae.js --closure 1 --llvm-lto 3 -s TOTAL_MEMORY=67108864"

WASM=`find target/wasm32-unknown-emscripten/release/deps | grep noise-.*\.wasm`
# If binaryen is available locally, use it to further optimize the .wast file emitted from emscripten
if hash wasm-opt 2>/dev/null; then
	WAST=`find target/wasm32-unknown-emscripten/release/deps | grep noise-.*\.wast`
	wasm-opt $WAST -O3 --print > opt.wast
	wasm-as opt.wast > $WASM
	rm opt.wast
fi

cp $WASM .
