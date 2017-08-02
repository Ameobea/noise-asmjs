//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime from the JS side.

use std::ffi::CStr;
use std::slice;

use serde_json;

use super::*;
use composition_tree::{CompositionTree, CompositionTreeNode};
use composition_tree::composition::CompositionScheme;
use composition_tree::definition::CompositionTreeNodeDefinition;
use composition_tree::initial_tree::create_initial_tree;

/// Initializes the minutiae engine and the internal noise generator engine with the default initial composition tree.
#[no_mangle]
pub unsafe extern "C" fn init(canvas_size: usize) {
    // Create the initial composition tree
    let master_tree: CompositionTree = create_initial_tree();
    // Put the composition tree into a box so I feel more confident that it never moves
    let boxed_composition_tree = Box::new(master_tree);

    // initialize emscripten universe and start the minutiae simulation
    let mut conf = UniverseConf::default();
    conf.size = canvas_size;
    let universe = Universe::new(conf, &mut WorldGenerator, |_, _| { None }, |_, _, _, _, _, _, _| {});

    // get the pointer of the box by taking it apart and putting it back together again
    let boxed_tree_pointer = Box::into_raw(boxed_composition_tree);
    let boxed_composition_tree = Box::from_raw(boxed_tree_pointer);

    // send a pointer to the engine state to the JS side to be used for dynamic configuration
    // debug("Calling `setTreePointer`...");
    setTreePointer(boxed_tree_pointer as *const c_void);

    // create the middleware that manages the image buffer and populates it each tick
    let noise_stepper = Box::new(NoiseStepper {
        conf: MasterConf::default(),
        composition_tree: boxed_composition_tree,
    });
    let boxed_engine_ptr = Box::into_raw(noise_stepper);
    let boxed_noise_stepper = Box::from_raw(boxed_engine_ptr);

    // debug("Calling `setEnginePointer`...");
    setEnginePointer(boxed_engine_ptr as *const c_void);

    // Initialize the simulation, registering with the emscripten Browser event loop
    EmscriptenDriver.init(universe, OurEngine, &mut [
        // middleware that calculates noise values for each of the universe's cells using the current sequence number
        boxed_noise_stepper,
        // middleware that renders the current universe to the canvas each tick using the supplied color calculator function
        Box::new(CanvasRenderer::new(canvas_size, calc_color, canvas_render))
    ]);
}

/// Deletes a node of the composition tree at the supplied depth and index.  Returns 0 if successful, 1 if there was an error.
#[no_mangle]
pub unsafe extern "C" fn delete_node(tree_pointer: *mut CompositionTree, depth: i32, coords: *const i32, index: i32) -> i32 {
    let mut tree = &mut *(tree_pointer);
    let coords_slice = slice::from_raw_parts(coords, depth as usize);

    match tree.delete_node(depth as usize, coords_slice, index as usize) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        },
    }
}

/// Adds a child node to the composed module located at (depth, index) in the composition tree.  Returns 0 if successful
/// and 1 if there was an error (Parsing the supplied JSON into a module, locaing the node, the node was a leaf, etc.)
/// If the node at the supplied coordinates is a composed module, the entire subtree that it defines will be deleted.
/// If the composition scheme of the composed module that this node is a part expects a certain number of children,
/// it will have to be updated manually.
#[no_mangle]
pub unsafe extern "C" fn add_node(
    tree_pointer: *mut CompositionTree, depth: i32, coords: *const i32, index: i32, node_definition: *const c_char
) -> i32 {
    let mut tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(node_definition).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `create_composer()`");
            return 1;
        },
    };

    // Try to parse the JSON-encoded node definition into a `CompositionTreeNodeDefinition`
    let node_def = match serde_json::from_str::<CompositionTreeNodeDefinition>(json_str) {
        Ok(node_def) => node_def,
        Err(err) => {
            error(&format!("Error while attempting to parse node definition JSON into `CompositionTreeNodeDefinition`: {:?}", err));
            return 1;
        }
    };

    // Convert the node definition into an actual `CompositionTreeNode`
    let node: CompositionTreeNode = node_def.into();

    // attempt to add the created node as a child of the node at the supplied coordinates in the tree
    let coords_slice = slice::from_raw_parts(coords, depth as usize);
    match tree.add_node(depth as usize, coords_slice, node, index as usize) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        }
    }
}

/// Convenience function.  Same as `delete_node()` and `add_node()` combined.  Helper function that replaces the node
/// at the given coordinates with a new node.  If the target is a `ComposedNode`, the entire subtree that it defines
/// will be destroyed and re-built.  Returns early if the removal fails.
#[no_mangle]
pub unsafe extern "C" fn replace_node(
    tree_pointer: *mut CompositionTree, depth: i32, coords: *const i32, index: i32, node_definition: *const c_char
) -> i32 {
    if let 1 = delete_node(tree_pointer, depth, coords, index) {
        return 1;
    }
    add_node(tree_pointer, depth, coords, index, node_definition)
}

/// Replaces the `CompositionScheme` of the composed tree node at (depth, index) with the supplied one.
/// Returns 0 if it's successful and 1 if there's an error.
#[no_mangle]
pub unsafe extern "C" fn set_composition_scheme(
    tree_pointer: *mut CompositionTree, depth: i32, coords: *const i32, scheme_json: *const c_char
) -> i32 {
    let mut tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(scheme_json).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `create_composer()`");
            return 1;
        },
    };

    // Attempt to parse the JSON definition into a `CompositionScheme`
    let new_scheme = match serde_json::from_str::<CompositionScheme>(json_str) {
        Ok(scheme) => scheme,
        Err(err) => {
            error(&format!("Error while attempting to deserialize `CompositionScheme` definition: {:?}", err));
            return 1;
        },
    };

    // Attempt to replace the scheme of the composition node at the supplied coordinates with the new scheme
    let coords_slice = slice::from_raw_parts(coords, depth as usize);
    match tree.set_composition_scheme(depth as usize, coords_slice, new_scheme) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        },
    }
}

#[no_mangle]
pub unsafe extern "C" fn set_canvas_size(engine_pointer: *mut NoiseStepper, size: usize) {
    // debug(&format!("Setting canvas size to {} on the Rust side...", size));
    let engine = &mut *engine_pointer;
    engine.conf.canvas_size = size;
    engine.conf.needs_resize = true;
}

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() { unimplemented!(); /* TODO */ }

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() { unimplemented!(); /* TODO */ }
