//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime from the JS side.

use std::ffi::CStr;

use serde_json;

use super::*;
use composition_tree::{CompositionTree, CompositionTreeNode};
use composition_tree::composition::CompositionScheme;
use composition_tree::definition::{CompositionTreeDefinition, CompositionTreeNodeDefinition};

/// Initializes the minutiae engine and the internal noise generator engine.  Takes a JSON-encoded string that is able to be
/// `deserialize()`d into a `CompositionTreeDefinition` with which to build a `CompositionTree`
#[no_mangle]
pub unsafe extern "C" fn init(canvas_size: usize, tree_def: *const c_char) {
    let json_str: &str = match CStr::from_ptr(tree_def).to_str() {
        Ok(s) => s,
        Err(_) => { return error("Invalid UTF8 string provided to `create_composer()`"); },
    };
    // Attempt to deserialize the provided definition string into a `CompositionTreeDefinition`
    let tree_def = match serde_json::from_str::<CompositionTreeDefinition>(json_str) {
        Ok(def) => def,
        Err(err) => { return error(
            &format!("Error while trying to deserialize provided JSON definition string into `CompositionTreeDefinition`: {:?}", err)
        ) },
    };
    // Now, build that tree definition into an actual `CompositionTree`
    let master_tree: CompositionTree = tree_def.into();
    // Put the composition tree into a box so I feel more confident that it never moves
    let boxed_noise_engine = Box::new(master_tree);

    // initialize emscripten universe and start the minutiae simulation
    let mut conf = UniverseConf::default();
    conf.size = canvas_size;
    let universe = Universe::new(conf, &mut WorldGenerator, |_, _| { None }, |_, _, _, _, _, _, _| {});

    // get the pointer of the box by taking it apart and putting it back together again
    let boxed_noise_engine_ptr = Box::into_raw(boxed_noise_engine);
    let boxed_noise_engine = Box::from_raw(boxed_noise_engine_ptr);

    // send a pointer to the engine state to the JS side to be used for dynamic configuration
    debug("Calling `setEnginePointer`...");
    setEnginePointer(boxed_noise_engine_ptr as *const c_void);

    // Initialize the simulation, registering with the emscripten Browser event loop
    EmscriptenDriver.init(universe, OurEngine, &mut [
        // middleware that calculates noise values for each of the universe's cells using the current sequence number
        Box::new(NoiseStepper {
            conf: MasterConf::default(),
            composition_tree: boxed_noise_engine,
        }),
        // middleware that renders the current universe to the canvas each tick using the supplied color calculator function
        Box::new(CanvasRenderer::new(canvas_size, calc_color, canvas_render))
    ]);
}

/// Deletes a node of the composition tree at the supplied depth and index.  Returns 0 if successful, 1 if there was an error.
#[no_mangle]
pub unsafe extern "C" fn delete_node(tree_pointer: *mut CompositionTree, depth: i32, index: i32) -> i32 {
    let mut tree = &mut *(tree_pointer);

    match tree.delete_node(depth as u32, index as u32) {
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
    tree_pointer: *mut CompositionTree, depth: i32, index: i32, node_definition: *const c_char
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
    match tree.add_node(depth as u32, index as u32, node) {
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
    tree_pointer: *mut CompositionTree, depth: i32, index: i32, node_definition: *const c_char
) -> i32 {
    if let 1 = delete_node(tree_pointer, depth, index) {
        return 1;
    }
    add_node(tree_pointer, depth, index, node_definition)
}

/// Replaces the `CompositionScheme` of the composed tree node at (depth, index) with the supplied one.
/// Returns 0 if it's successful and 1 if there's an error.
#[no_mangle]
pub unsafe extern "C" fn set_composition_scheme(
    tree_pointer: *mut CompositionTree, depth: i32, index: i32, scheme_json: *const c_char
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
    match tree.set_composition_scheme(depth as u32, index as u32, new_scheme) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        },
    }
}

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() { unimplemented!(); /* TODO */ }

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() { unimplemented!(); /* TODO */ }
