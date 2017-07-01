//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime from the JS side.

use std::ffi::CStr;
use std::mem::{self, transmute};
use std::ptr;

use noise::RangeFunction;
use serde_json;

use super::*;
use composition_tree::CompositionTree;
use composition_tree::definition::CompositionTreeDefinition;

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

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() { unimplemented!(); /* TODO */ }

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() { unimplemented!(); /* TODO */ }
