//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime from the JS side.

use std::convert::TryInto;
use std::ffi::CStr;
use std::mem;
use std::slice;

use serde_json;

use super::*;
use libcomposition::composition::CompositionScheme;
use libcomposition::definition::{CompositionTreeNodeDefinition, InputTransformationDefinition};
use libcomposition::initial_tree::create_initial_tree;
use libcomposition::ir::IrNode;
use libcomposition::transformations::InputTransformation;
use libcomposition::util::build_tree_from_def;
use libcomposition::{
    CompositionTree, CompositionTreeNode, CompositionTreeNodeType, ACTIVE_COLOR_FUNCTION,
};

extern "C" {
    fn emscripten_pause_main_loop();
    fn emscripten_resume_main_loop();
}

static mut ENGINE_RUNNING: bool = false;

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
    let universe = Universe::new(
        conf,
        &mut WorldGenerator,
        |_, _| None,
        |_, _, _, _, _, _, _| {},
    );

    // get the pointer of the box by taking it apart and putting it back together again
    let boxed_tree_pointer = Box::into_raw(boxed_composition_tree);
    let boxed_composition_tree = Box::from_raw(boxed_tree_pointer);

    // send a pointer to the engine state to the JS side to be used for dynamic configuration
    // debug("Calling `setTreePointer`...");
    setTreePointer(boxed_tree_pointer as *const c_void);

    // create the middleware that manages the image buffer and populates it each tick
    let noise_stepper = Box::new(NoiseStepper {
        conf: (|| {
            let mut conf = MasterConf::default();
            conf.canvas_size = canvas_size;
            conf
        })(),
        composition_tree: boxed_composition_tree,
    });
    let boxed_engine_ptr = Box::into_raw(noise_stepper);
    let boxed_noise_stepper = Box::from_raw(boxed_engine_ptr);

    // debug("Calling `setEnginePointer`...");
    setEnginePointer(boxed_engine_ptr as *const c_void);

    // Initialize the simulation, registering with the emscripten Browser event loop
    EmscriptenDriver.init(
        universe,
        OurEngine,
        &mut [
            // middleware that calculates noise values for each of the universe's cells using the current sequence number
            boxed_noise_stepper,
            // middleware that renders the current universe to the canvas each tick using the supplied color calculator function
            Box::new(CanvasRenderer::new(canvas_size, calc_color, canvas_render)),
        ],
    );
}

/// Deletes a node of the composition tree at the supplied depth and index.  Returns 0 if successful, 1 if there was an error.
#[no_mangle]
pub unsafe extern "C" fn delete_node(
    tree_pointer: *mut CompositionTree,
    depth: i32,
    coords: *const i32,
    index: i32,
) -> i32 {
    let tree = &mut *(tree_pointer);
    let coords_slice = slice::from_raw_parts(coords, depth as usize);

    match tree.delete_node(depth as usize, coords_slice, index as usize) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        }
    }
}

/// Sets a new global configuration for the composition tree given the IR format.
#[no_mangle]
pub unsafe extern "C" fn set_global_conf(
    tree_pointer: *mut CompositionTree,
    conf_str: *const c_char,
) -> i32 {
    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(conf_str).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `add_node()`");
            return 1;
        }
    };

    let conf: MasterConf = match serde_json::from_str::<IrNode>(json_str) {
        Ok(ir_node) => {
            let conf: MasterConf = match ir_node.try_into() {
                Ok(c) => c,
                Err(err_str) => {
                    error(&format!("{}", err_str));
                    return 1;
                }
            };
            conf
        }
        Err(err_str) => {
            error(&format!("{}", err_str));
            return 1;
        }
    };

    let tree: &mut CompositionTree = &mut *tree_pointer;
    tree.global_conf = conf;

    0i32
}

fn build_node(def: &str) -> Result<CompositionTreeNodeDefinition, String> {
    // Try to parse the JSON-encoded node definition into a `IrNode`
    match serde_json::from_str::<IrNode>(def) {
        Ok(node_def) => node_def.try_into(),
        Err(err) => Err(format!(
            "Error while attempting to parse node definition JSON into `IrNode`: {:?}",
            err
        )),
    }
}

/// Adds a child node to the composed module located at (depth, index) in the composition tree.  Returns 0 if successful
/// and 1 if there was an error (Parsing the supplied JSON into a module, locaing the node, the node was a leaf, etc.)
/// If the node at the supplied coordinates is a composed module, the entire subtree that it defines will be deleted.
/// If the composition scheme of the composed module that this node is a part expects a certain number of children,
/// it will have to be updated manually.
#[no_mangle]
pub unsafe extern "C" fn add_node(
    tree_pointer: *mut CompositionTree,
    depth: i32,
    coords: *const i32,
    index: i32,
    node_definition: *const c_char,
) -> i32 {
    let tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(node_definition).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `add_node()`");
            return 1;
        }
    };

    let node: CompositionTreeNode = match build_node(json_str) {
        Ok(node_def) => node_def,
        Err(err_str) => {
            error(&format!("{}", err_str));
            return 1;
        }
    }
    .into();

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
    tree_pointer: *mut CompositionTree,
    depth: i32,
    coords: *const i32,
    index: i32,
    node_definition: *const c_char,
) -> i32 {
    let tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(node_definition).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `replace_node()`");
            return 1;
        }
    };

    // first try to create the node, avoiding removing the old one in case of failure.
    let node: CompositionTreeNode = match build_node(json_str) {
        Ok(node_def) => node_def,
        Err(err_str) => {
            error(&format!("{}", err_str));
            return 1;
        }
    }
    .into();

    if let 1 = delete_node(tree_pointer, depth, coords, index) {
        return 1;
    }

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

fn get_transformation_parent<'a>(
    tree: &'a mut CompositionTree,
    coords_slice: &[i32],
    tree_depth: i32,
    node_index: i32,
) -> Result<&'a mut CompositionTreeNode, String> {
    let grandparent_node: &mut CompositionTreeNode =
        tree.root_node.traverse_mut(coords_slice).map_err(|err| {
            format!(
                "Unable to traverse the tree at the supplied coordinates: {}",
                err
            )
        })?;

    if node_index == -1 {
        return Ok(grandparent_node);
    }

    let parent_node: &mut CompositionTreeNode = match grandparent_node.function {
        CompositionTreeNodeType::Leaf(_) => {
            return Err(format!(
                "Attempted to traverse tree to child of leaf node! Supplied coords: {:?} ; Supplied index: {}",
                coords_slice,
                tree_depth
            ));
        }
        CompositionTreeNodeType::Combined(ref mut composed_module) => {
            let child_count = composed_module.children.len();

            match composed_module.children.get_mut(node_index as usize) {
                Some(child) => child,
                None => {
                    return Err(format!(
                        "Tried to get child of composed module at index {} but it only has {} children!",
                        node_index,
                        child_count
                    ));
                }
            }
        }
    };

    Ok(parent_node)
}

#[no_mangle]
pub unsafe extern "C" fn add_input_transformation(
    tree_pointer: *mut CompositionTree,
    tree_depth: i32,
    coords: *const i32,
    node_index: i32,
    transformation_definition: *const c_char,
) -> i32 {
    let tree: &mut CompositionTree = &mut *tree_pointer;
    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(transformation_definition).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `replace_node()`");
            return 1;
        }
    };

    // Try to build the `IrNode`
    let ir: IrNode = match serde_json::from_str::<IrNode>(json_str) {
        Ok(ir) => ir,
        Err(err) => {
            error(&format!(
                "Unable to convert string into `IrNode`: {:?}",
                err
            ));
            return 1;
        }
    };

    // try to convert the `IrNode` into an `InputTransformation`
    let transformation_def: InputTransformationDefinition = match ir.try_into() {
        Ok(t) => t,
        Err(err) => {
            error(&format!(
                "Unable to convert `IrNode` into `InputTransformation`: {:?}",
                err
            ));
            return 1;
        }
    };

    // convert the definition into a proper `InputTransformation`
    let transformation: InputTransformation = transformation_def.into();

    // traverse the tree to find the node that we're targeting
    let coords_slice = slice::from_raw_parts(coords, tree_depth as usize);
    let parent_node = match get_transformation_parent(tree, coords_slice, tree_depth, node_index) {
        Ok(parent_node) => parent_node,
        Err(err) => {
            error(&format!("Error while traversing composition tree: {}", err));
            return 1;
        }
    };

    // insert the created input transformation into the list of input transformations for
    // the node at the supplied coordinates
    parent_node.transformations.push(transformation);

    0
}

#[no_mangle]
pub unsafe extern "C" fn delete_input_transformation(
    tree_pointer: *mut CompositionTree,
    tree_depth: i32,
    coords: *const i32,
    node_index: i32,
    transformation_index: i32,
) -> i32 {
    let tree: &mut CompositionTree = &mut *tree_pointer;

    // traverse the tree to find the node that we're targeting
    let coords_slice = slice::from_raw_parts(coords, tree_depth as usize);
    let parent_node = match get_transformation_parent(tree, coords_slice, tree_depth, node_index) {
        Ok(parent_node) => parent_node,
        Err(err) => {
            error(&format!("Error while traversing composition tree: {}", err));
            return 1;
        }
    };

    // make sure that there are as many transformations in the list as we expect there to be
    let transformation_count = parent_node.transformations.len() as i32;
    if transformation_count <= transformation_index {
        error(&format!(
            "Attempted to remove input transformation at index {} but there are only {} transformations!",
            transformation_index,
            transformation_count
        ));
        return 1;
    }

    // actually delete the transformation from the list
    parent_node
        .transformations
        .remove(transformation_index as usize);

    0
}

#[no_mangle]
pub unsafe extern "C" fn replace_input_transformation(
    tree_pointer: *mut CompositionTree,
    tree_depth: i32,
    coords: *const i32,
    node_index: i32,
    transformation_index: i32,
    transformation_definition: *const c_char,
) -> i32 {
    let tree: &mut CompositionTree = &mut *tree_pointer;

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(transformation_definition).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `replace_node()`");
            return 1;
        }
    };

    // Try to build the `IrNode`
    let ir: IrNode = match serde_json::from_str::<IrNode>(json_str) {
        Ok(ir) => ir,
        Err(err) => {
            error(&format!(
                "Unable to convert string into `IrNode`: {:?}",
                err
            ));
            return 1;
        }
    };

    // try to convert the `IrNode` into an `InputTransformation`
    let transformation_def: InputTransformationDefinition = match ir.try_into() {
        Ok(t) => t,
        Err(err) => {
            error(&format!(
                "Unable to convert `IrNode` into `InputTransformation`: {:?}",
                err
            ));
            return 1;
        }
    };

    // convert the definition into a proper `InputTransformation`
    let transformation: InputTransformation = transformation_def.into();

    // traverse the tree to find the node that we're targeting
    let coords_slice = slice::from_raw_parts(coords, tree_depth as usize);
    let parent_node = match get_transformation_parent(tree, coords_slice, tree_depth, node_index) {
        Ok(parent_node) => parent_node,
        Err(err) => {
            error(&format!("Error while traversing composition tree: {}", err));
            return 1;
        }
    };

    // make sure that there are as many transformations in the list as we expect there to be
    let transformation_count = parent_node.transformations.len() as i32;
    if transformation_count <= transformation_index {
        error(&format!(
            "Attempted to remove input transformation at index {} but there are only {} transformations!",
            transformation_index,
            transformation_count
        ));
        return 1;
    }

    // actually replace the transformation
    parent_node.transformations[transformation_index as usize] = transformation;

    0
}

/// Replaces the `CompositionScheme` of the composed tree node at (depth, index) with the supplied one.
/// Returns 0 if it's successful and 1 if there's an error.
#[no_mangle]
pub unsafe extern "C" fn set_composition_scheme(
    tree_pointer: *mut CompositionTree,
    depth: i32,
    coords: *const i32,
    scheme_json: *const c_char,
) -> i32 {
    let tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let json_str: &str = match CStr::from_ptr(scheme_json).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `create_composer()`");
            return 1;
        }
    };

    // Attempt to parse the JSON definition into a `CompositionScheme`
    let new_scheme = match serde_json::from_str::<CompositionScheme>(json_str) {
        Ok(scheme) => scheme,
        Err(err) => {
            error(&format!(
                "Error while attempting to deserialize `CompositionScheme` definition: {:?}",
                err
            ));
            return 1;
        }
    };

    // Attempt to replace the scheme of the composition node at the supplied coordinates with the new scheme
    let coords_slice = slice::from_raw_parts(coords, depth as usize);
    match tree.set_composition_scheme(depth as usize, coords_slice, new_scheme) {
        Ok(_) => 0,
        Err(err) => {
            error(&err);
            1
        }
    }
}

/// Replaces the entire composition tree with a new one created from the provided definition.
#[no_mangle]
pub unsafe extern "C" fn initialize_from_scratch(
    tree_pointer: *mut CompositionTree,
    def: *const c_char,
) -> i32 {
    let tree = &mut *(tree_pointer);

    // Convert the c-str into a &str
    let def_str: &str = match CStr::from_ptr(def).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `create_composer()`");
            return 1;
        }
    };

    let (color_fn, new_tree) = match build_tree_from_def(def_str) {
        Ok(x) => x,
        Err(err) => {
            error(&format!(
                "Error while bulding supplied definition into `CompositionTree`: {}",
                err
            ));
            return 1;
        }
    };

    // replace the old tree with the new one.
    let _ = mem::replace(tree, new_tree);

    // set the active color function
    ACTIVE_COLOR_FUNCTION = color_fn;

    0
}

#[no_mangle]
pub unsafe extern "C" fn set_canvas_size(engine_pointer: *mut NoiseStepper, size: usize) {
    // debug(&format!("Setting canvas size to {} on the Rust side...", size));
    let engine = &mut *engine_pointer;
    engine.conf.canvas_size = size;
    engine.conf.needs_resize = true;
}

/// Deallocates the previous engine and tree pointer set up by the runtime and cancels the
/// Emscripten event loop.
#[no_mangle]
pub unsafe extern "C" fn cleanup_runtime(
    engine_pointer: *mut NoiseStepper,
    tree_pointer: *mut CompositionTree,
) {
    emscripten_cancel_main_loop();

    let tree: &mut CompositionTree = &mut *tree_pointer;
    let old_tree = mem::replace(tree, create_initial_tree());
    drop(old_tree);
}

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() {
    if !ENGINE_RUNNING {
        emscripten_pause_main_loop();
        ENGINE_RUNNING = false;
    }
}

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() {
    if ENGINE_RUNNING {
        emscripten_resume_main_loop();
        ENGINE_RUNNING = false;
    }
}

/// Renders a single frame, setting the canvas to a static image.
#[no_mangle]
pub unsafe extern "C" fn render_single_frame() {
    pause_engine();
    resume_engine();
    pause_engine();
}
