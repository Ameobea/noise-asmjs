//! Defines functions that are exported to the JavaScript frontend, allowing access to the engine during runtime.

use std::mem::transmute;

use noise::RangeFunction as NativeRangeFunction;

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
}

#[repr(u32)]
#[derive(Clone, Copy, Debug)]
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
}

#[repr(u32)]
#[derive(Clone, Copy, Debug)]
pub enum RangeFunction {
    Euclidean,
    EuclideanSquared,
    Manhattan,
    Chebyshev,
    Quadratic,
}

impl Into<NativeRangeFunction> for RangeFunction {
    fn into(self) -> NativeRangeFunction {
        match self {
            RangeFunction::Euclidean => NativeRangeFunction::Euclidean,
            RangeFunction::EuclideanSquared => NativeRangeFunction::EuclideanSquared,
            RangeFunction::Manhattan => NativeRangeFunction::Manhattan,
            RangeFunction::Chebyshev => NativeRangeFunction::Chebyshev,
            RangeFunction::Quadratic => NativeRangeFunction::Quadratic,
        }
    }
}

/// Initializes the minutiae engine and the internal noise generator engine, returning a pointer to the noise generator engine that
/// can be used along with the `set_config` function to dynamically change the noise module's settings on the fly.
#[no_mangle]
pub unsafe extern "C" fn init(canvas_size: usize) {
    // initialize the noise engine and put it in a box so I feel more confident that it never moves
    let mut noise_engine = NoiseEngine::default();
    noise_engine.canvas_size = canvas_size;
    let boxed_noise_engine = Box::new(noise_engine);

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
        Box::new(NoiseStepper{
            conf: boxed_noise_engine,
            noise_engine: Box::into_raw(Box::new(Fbm::new() as Fbm<f32>)) as *mut c_void}
        ),
        // middleware that renders the current universe to the canvas each tick using the supplied color calculator function
        Box::new(CanvasRenderer::new(canvas_size, calc_color, canvas_render))
    ]);
}

/// This function receives a configuraiton type as well as a value from the JavaScript side and mutates the noise engine's state
/// to apply it.  The actual type of the value passed to this function varies, but it is always guarenteed to be 32 bits in size.
#[no_mangle]
pub unsafe extern "C" fn set_config(setting_type: SettingType, val: u32, engine_ptr: *mut NoiseEngine) {
    debug(&format!("Setting config values: setting_type: {:?}, value: {}, engine_pointer: {:?}", setting_type, val, engine_ptr));
    let engine = &mut *engine_ptr;
    engine.needs_update = true;

    match setting_type {
        SettingType::GeneratorType => {
            engine.generator_type = transmute(val);
            engine.needs_new_noise_gen = true;
        },
        SettingType::Seed => engine.seed = val as usize,
        SettingType::CanvasSize => {
            engine.canvas_size = val as usize;
            engine.needs_resize = true;
        },
        SettingType::Octaves => engine.octaves = val as usize,
        SettingType::Frequency => engine.frequency = val as f32 * 10e-8,
        SettingType::Lacunarity => engine.lacunarity = val as f32 * 10e-8,
        SettingType::Persistence => engine.persistence = val as f32 * 10e-8,
        SettingType::Zoom => {
            engine.zoom = val as f32 * 10e-8;
            engine.needs_update = false;
        },
        SettingType::Speed => {
            engine.speed = val as f32 * 10e-8;
            engine.needs_update = false;
        },
        SettingType::Attenuation => engine.attenuation = val as f32 * 10e-8,
        SettingType::RangeFunction => engine.range_function = transmute(val),
        SettingType::EnableRange => engine.enable_range = val,
        SettingType::Displacement => engine.displacement = val as f32 * 10e-8,
    };
}

/// Pauses the simulation by halting the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn pause_engine() { unimplemented!(); /* TODO */ }

/// Resumes the simulation by initializing the Emscripten browser event loop.
#[no_mangle]
pub unsafe extern "C" fn resume_engine() { unimplemented!(); /* TODO */ }
