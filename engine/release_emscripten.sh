cargo rustc --target=asmjs-unknown-emscripten --release --verbose -- -Z print-link-args -C \
	link-args="-v -O3 \
    --js-library ./src/library_minutiae.js \
    --llvm-lto 3 \
    -s TOTAL_MEMORY=67108864 \
    -s NO_EXIT_RUNTIME=1 \
    -s ASSERTIONS=0 \
    -s EXPORTED_FUNCTIONS=[\"_init\",\"_set_global_conf\",\"_set_canvas_size\",\"_pause_engine\",\"_resume_engine\",\"_add_node\",\"_delete_node\",\"_replace_node\",\"_add_input_transformation\",\"_delete_input_transformation\",\"_replace_input_transformation\",\"_initialize_from_scratch\",\"_cleanup_runtime\"] \
    -s EXTRA_EXPORTED_RUNTIME_METHODS=[\"ccall\",\"cwrap\"]"
