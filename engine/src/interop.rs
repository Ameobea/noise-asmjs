//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime from the JS side.

use std::ffi::CStr;
use std::mem::{self, transmute};
use std::ptr;

use noise::RangeFunction;
use serde_json;

use super::*;

#[repr(u32)]
#[derive(Clone, Copy, Debug)]
pub enum SettingType {
    GeneratorType,
    Seed,
    CanvasSize,
    Octaves,
    Frequency,
    Lacunarity,
    Persistence,
    Zoom,
    Speed,
    Attenuation,
    RangeFunction,
    EnableRange,
    Displacement,
    /// Sets the value returned by a `Constant` noise module
    Constant,
    /// Sets the actual pointer for the module contained in the inner `RawModule` directly, bypassing the settings.
    ModulePointer,
}

#[repr(u32)]
#[derive(Clone, Copy, Debug, Serialize)]
pub enum GenType {
    Fbm,
    Worley,
    OpenSimplex,
    Billow,
    HybridMulti,
    SuperSimplex,
    Value,
    RidgedMulti,
    BasicMulti,
    Constant,
    Composed, // Custom noise module representing a `ComposedNoiseModule`.
}

#[repr(u32)]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum InteropRangeFunction {
    Euclidean,
    EuclideanSquared,
    Manhattan,
    Chebyshev,
    Quadratic,
}

impl Into<RangeFunction> for InteropRangeFunction {
    fn into(self) -> RangeFunction {
        match self {
            InteropRangeFunction::Euclidean => RangeFunction::Euclidean,
            InteropRangeFunction::EuclideanSquared => RangeFunction::EuclideanSquared,
            InteropRangeFunction::Manhattan => RangeFunction::Manhattan,
            InteropRangeFunction::Chebyshev => RangeFunction::Chebyshev,
            InteropRangeFunction::Quadratic => RangeFunction::Quadratic,
        }
    }
}

/// Initializes the minutiae engine and the internal noise generator engine, returning a pointer to the noise generator engine that
/// can be used along with the `set_config` function to dynamically change the noise module's settings on the fly.
#[no_mangle]
pub unsafe extern "C" fn init(canvas_size: usize) {
    // initialize the noise engine and put it in a box so I feel more confident that it never moves
    let boxed_noise_engine = Box::new(ComposedNoiseModule::new());

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
            root_module: boxed_noise_engine,
        }),
        // middleware that renders the current universe to the canvas each tick using the supplied color calculator function
        Box::new(CanvasRenderer::new(canvas_size, calc_color, canvas_render))
    ]);
}

/// This function receives a configuraiton type as well as a value from the JavaScript side and mutates the noise engine's state
/// to apply it.  The actual type of the value passed to this function varies, but it is always guarenteed to be 64 bits in size.
///
/// Settings are applied to the noise module referred to by the `conf_depth` and `conf_coords`.  These values are used to index
/// the module composition tree and access the appropriate inner module.  A `conf_depth` of -1 means that the supplied setting
/// refers to the `MasterConf` of the root module.
#[no_mangle]
pub unsafe extern "C" fn set_config(
    setting_type: SettingType, val: f64, engine_ptr: *mut NoiseStepper, conf_depth: i32, conf_coords: *const i32
) {
    debug(&format!("Setting config values: setting_type: {:?}, value: {}, engine_pointer: {:?}", setting_type, val, engine_ptr));
    let stepper = &mut *engine_ptr;

    // a conf_depth of -1 refers to the master configuration
    if (conf_depth as i32) < 0 {
        match setting_type {
            SettingType::Zoom => stepper.conf.zoom = val as f32,
            SettingType::Speed => stepper.conf.speed = val as f32,
            SettingType::CanvasSize => {
                stepper.conf.canvas_size = val as usize;
                stepper.conf.needs_resize = true;
            },
            _ => { return error(&format!("Attempted to set config of type {:?} on root module!", setting_type)); },
        };
    }

    let mut target_module: RawNoiseModule = match stepper.root_module.find_child(conf_depth as i32, conf_coords) {
        Ok(raw_mod) => raw_mod,
        Err(err) => { return error(&err); },
    };
    let mut conf = &mut target_module.conf;
    conf.needs_update = true;

    match setting_type {
        SettingType::GeneratorType => {
            conf.generator_type = transmute(val as u32);
            conf.needs_new_noise_gen = true;
        },
        SettingType::Seed => conf.seed = val as usize,
        SettingType::Octaves => conf.octaves = val as usize,
        SettingType::Frequency => conf.frequency = val as f32,
        SettingType::Lacunarity => conf.lacunarity = val as f32,
        SettingType::Persistence => conf.persistence = val as f32,
        SettingType::Zoom => conf.zoom = val as f32,
        SettingType::Speed => conf.speed = val as f32,
        SettingType::Attenuation => conf.attenuation = val as f32,
        SettingType::RangeFunction => conf.range_function = transmute(val as u32),
        SettingType::EnableRange => conf.enable_range = val as u32,
        SettingType::Displacement => conf.displacement = val as f32,
        SettingType::Constant => conf.constant = val as f32,
        // this one's quite beautiful in its implementation.  We're passed a f32 representing the value of the pointer,
        // we cast that to a usize, and then cast *that* to a void pointer.  This doesn't change the generator type.
        SettingType::ModulePointer => target_module.engine_pointer = val as usize as *mut c_void,
        SettingType::CanvasSize => { return error("Attempted to set canvas size on non-master module config!"); },
    };

    // create new noise engine of a different type if that needs to happen
    let noise_engine = if conf.needs_new_noise_gen {
        create_noise_engine(conf.generator_type)
    } else {
        target_module.engine_pointer
    };

    // apply all settings, returning a new noise module pointer.  Internally, the module is mutated so no memory is leaked.
    let new_noise_engine_pointer = apply_settings(conf, noise_engine);
    // Convert the old module pointer back into a box so it can be dropped
    let old_module_pointer = mem::replace(&mut target_module.engine_pointer, new_noise_engine_pointer);
    let _ = Box::from_raw(old_module_pointer);
}

/// Creates a raw void pointer to a `ComposedNoiseModule` given a composition scheme JSON-encoded string containing
/// its metadata.  `meta_json` should be a UTF8-encoded string.  This function returns a null pointer in the case of
/// an error, so that must be checked for.
#[no_mangle]
pub unsafe extern "C" fn create_composed_module(raw_scheme: u32, meta_json_ptr: *const c_char) -> *const c_void {
    let json_str: &str = match CStr::from_ptr(meta_json_ptr).to_str() {
        Ok(s) => s,
        Err(_) => {
            error("Invalid UTF8 string provided to `create_composer()`");
            return ptr::null();
        }
    };

    // Create a meta struct from the provided JSON string depending on the supplied composition scheme and hide it behind
    // a raw void pointer so that it can be stored generically in the composer
    let scheme: CompositionScheme = transmute(raw_scheme);
    let meta_ptr: *const c_void = match scheme {
        CompositionScheme::Average => ptr::null(),
        CompositionScheme::WeightedAverage => {
            let parsed_meta: WeightedAverageMeta = match serde_json::from_str::<WeightedAverageMeta>(json_str) {
                Ok(meta) => meta,
                Err(err) => {
                    error(&format!("Error parsing JSON into `WeightedAverageMeta`: {:?}", err));
                    return ptr::null();
                },
            };
            Box::into_raw(Box::new(parsed_meta)) as *const c_void
        }
    };

    // Create the composer given the constructed meta struct pointer and the scheme
    let composer = NoiseModuleComposer {
        meta: meta_ptr,
        scheme,
    };

    // finally, create the composed noise module with an empty set of child modules
    let composed_module = ComposedNoiseModule {
        composer,
        modules: Vec::new(),
    };
    Box::into_raw(Box::new(composed_module)) as *const c_void
}

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() { unimplemented!(); /* TODO */ }

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() { unimplemented!(); /* TODO */ }
