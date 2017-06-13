//! My goal for this is to play around with the noise-rs crate and create some noise with which to populate the universe of a
//! minutiae world.  We'll use 3D perlin noise and have the third coordinate correspond to the sequence number.

// TODO: implement middleware for closures that have the required `before_render`/`after_render` signature
// TODO: look into auto-implementing cell action/entity action for T since they don't have any requirements and possibly
//       implementing CA/EA for `()`
// TODO: Deprecate the entire cell mutator functionality in favor of entirely middleware-driven approaches

#![allow(unused_variables, dead_code)]

extern crate minutiae;
extern crate noise;
extern crate palette;

use std::ffi::CString;
use std::os::raw::{c_char, c_void};

use minutiae::prelude::*;
use minutiae::emscripten::{EmscriptenDriver, CanvasRenderer};
use noise::{
    BasicMulti, Billow, NoiseModule, OpenSimplex,Fbm, HybridMulti, MultiFractal,
    Point3, RidgedMulti, Seedable, SuperSimplex, Value, Worley
};
use palette::{FromColor, Hsv, Rgb};

extern {
    /// Given a pointer to our pixel data buffer, draws its contents to the canvas.
    pub fn canvas_render(ptr: *const u8);
    /// Given a pointer to the noise engine's state, registers it on the JS side into the Redux store
    pub fn setEnginePointer(ptr: *const c_void);
    /// Direct line to `console.log` from JS since the simulated `stdout` is dead after `main()` completes
    pub fn js_debug(msg: *const c_char);
    /// Direct line to `console.error` from JS since the simulated `stdout` is dead after `main()` completes
    pub fn js_error(msg: *const c_char);
}

/// Wrapper around the JS debug function that accepts a Rust `&str`.
pub fn debug(msg: &str) {
    let c_str = CString::new(msg).unwrap();
    unsafe { js_debug(c_str.as_ptr()) };
}

/// Wrapper around the JS error function that accepts a Rust `&str`.
pub fn error(msg: &str) {
    let c_str = CString::new(msg).unwrap();
    unsafe { js_error(c_str.as_ptr()) };
}

pub mod interop;
use interop::*;

// lazy_static!{
//     static ref NOISE_1: Mutex<Fbm<f32>> = Mutex::new(Fbm::new());
//     static ref NOISE_2: Mutex<Worley<f32>> = Mutex::new(Worley::new());
//     static ref NOISE_3: Mutex<OpenSimplex> = Mutex::new(OpenSimplex::new());
//     static ref NOISE_4: Mutex<Billow<f32>> = Mutex::new(Billow::new());
//     static ref NOISE_5: Mutex<HybridMulti<f32>> = Mutex::new(HybridMulti::new());
//     static ref NOISE_6: Mutex<SuperSimplex> = Mutex::new(SuperSimplex::new());
//     static ref NOISE_7: Mutex<Value> = Mutex::new(Value::new());
//     static ref NOISE_8: Mutex<RidgedMulti<f32>> = Mutex::new(RidgedMulti::new());
// }

struct NoiseUpdater;

// Minutiae custom type declarations.
// Since we're only using a very small subset of Minutiae's capabilities, these are mostly unused.

#[derive(Clone)]
struct CS(f32);
impl CellState for CS {}

#[derive(Clone)]
struct ES;
impl EntityState<CS> for ES {}

#[derive(Clone, Default)]
struct MES;
impl MutEntityState for MES {}

struct CA;
impl CellAction<CS> for CA {}

struct EA;
impl EntityAction<CS, ES> for EA {}

type OurUniverse = Universe<CS, ES, MES, CA, EA>;

struct OurEngine;

impl Engine<CS, ES, MES, CA, EA> for OurEngine {
    #[allow(unused_variables)]
    fn step(&mut self, universe: &mut OurUniverse) {
        // no-op; all logic is handled by the middleware
        universe.seq += 1;
    }
}

/// Holds the noise generator's state.  A pointer to this is passed along with all configuraiton functions.
pub struct NoiseEngine {
    generator_type: GenType,
    canvas_size: usize,
    seed: usize,
    octaves: usize,
    frequency: f32,
    lacunarity: f32,
    persistence: f32,
    zoom: f32,
    speed: f32,
    needs_update: bool, // flag indicating whether or not there are new stettings that need to be applied
    needs_resize: bool, // flag indicating if the universe itself needs to be resized or not
    needs_new_noise_gen: bool, // the type of noise generator itself needs to be changed
}

impl Default for NoiseEngine {
    fn default() -> Self {
        NoiseEngine {
            generator_type: GenType::Fbm,
            canvas_size: 0,
            seed: 101269420,
            octaves: 6,
            frequency: 1.0,
            lacunarity: 2.0,
            persistence: 0.5,
            speed: 0.00758,
            zoom: 0.0132312,
            needs_update: false,
            needs_resize: false,
            needs_new_noise_gen: false,
        }
    }
}

/// given a buffer containing all of the cells in the universe, calculates values for each of them using
/// perlin noise and sets their states according to the result.
fn drive_noise(cells_buf: &mut [Cell<CS>], seq: usize, noise: &NoiseModule<Point3<f32>, f32>, universe_size: usize, zoom: f32, speed: f32) {
    let fseq = seq as f32;
    for y in 0..universe_size {
        for x in 0..universe_size {
            // calculate noise value for current coordinate and sequence number
            let val = noise.get([x as f32 * zoom, y as f32 * zoom, fseq * speed]);

            // set the cell's state equal to that value
            let index = get_index(x, y, universe_size);
            cells_buf[index].state = CS(val);
        }
    }
}

/// Very custom function for changing the size of the universe by either removing elements from it or expanding
/// it with elements to match the new length.  Totally ignores all entity-related stuff for now and will almost
/// certainly break if entities are utilized in any way.
fn resize_universe(universe: &mut Universe<CS, ES, MES, CA, EA>, new_size: usize) {
    if new_size == 0 {
        return error("Requested change of universe size to 0!");
    }

    universe.cells.resize(new_size, Cell {state: CS(0.0)});
}

// trait SeedableMultifractalNoiseModule:



/// Given the ID of a noise engine, allocates an instance of it on the heap and returns a void reference to it.
/// Since `MultiFractal` can't be made into a trait object, this is the best optionsdfsfsdfsdfs
fn create_noise_engine(id: GenType) -> *mut c_void {
    match id {
        GenType::Fbm => Box::into_raw(Box::new(Fbm::new() as Fbm<f32>)) as *mut c_void,
        GenType::Worley => Box::into_raw(Box::new(Worley::new() as Worley<f32>)) as *mut c_void,
        GenType::OpenSimplex => Box::into_raw(Box::new(OpenSimplex::new())) as *mut c_void,
        GenType::Billow => Box::into_raw(Box::new(Billow::new() as Billow<f32>)) as *mut c_void,
        GenType::HybridMulti => Box::into_raw(Box::new(HybridMulti::new() as HybridMulti<f32>)) as *mut c_void,
        GenType::SuperSimplex => Box::into_raw(Box::new(SuperSimplex::new())) as *mut c_void,
        GenType::Value => Box::into_raw(Box::new(Value::new())) as *mut c_void,
        GenType::RidgedMulti => Box::into_raw(Box::new(RidgedMulti::new() as RidgedMulti<f32>)) as *mut c_void,
        GenType::BasicMulti => Box::into_raw(Box::new(BasicMulti::new() as BasicMulti<f32>)) as *mut c_void,
    }
}

/// Given a pointer to a noise engine of variable type and a settings struct, applies those settings based
/// on the capabilities of that noise modules.  For example, if the noise module doesn't implement `Seedable`,
/// the `seed` setting is ignored.
unsafe fn apply_settings(engine_conf: &NoiseEngine, engine: *mut c_void) -> *mut c_void {
    match engine_conf.generator_type {
        GenType::Fbm => {
            let gen = Box::from_raw(engine as *mut Fbm<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_octaves(engine_conf.octaves as usize);
            let gen = gen.set_frequency(engine_conf.frequency);
            let gen = gen.set_lacunarity(engine_conf.lacunarity);
            let gen = gen.set_persistence(engine_conf.persistence);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::Worley => {
            let gen = Box::from_raw(engine as *mut Worley<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_frequency(engine_conf.frequency);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::OpenSimplex => {
            let gen = Box::from_raw(engine as *mut OpenSimplex);
            let gen = gen.set_seed(engine_conf.seed as u32);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::Billow => {
            let gen = Box::from_raw(engine as *mut Billow<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_octaves(engine_conf.octaves as usize);
            let gen = gen.set_frequency(engine_conf.frequency);
            let gen = gen.set_lacunarity(engine_conf.lacunarity);
            let gen = gen.set_persistence(engine_conf.persistence);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::HybridMulti => {
            let gen = Box::from_raw(engine as *mut HybridMulti<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_octaves(engine_conf.octaves as usize);
            let gen = gen.set_frequency(engine_conf.frequency);
            let gen = gen.set_lacunarity(engine_conf.lacunarity);
            let gen = gen.set_persistence(engine_conf.persistence);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::SuperSimplex => {
            let gen = Box::from_raw(engine as *mut SuperSimplex);
            let gen = gen.set_seed(engine_conf.seed as u32);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::Value => {
            let gen = Box::from_raw(engine as *mut Value);
            let gen = gen.set_seed(engine_conf.seed as u32);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::RidgedMulti => {
            let gen = Box::from_raw(engine as *mut RidgedMulti<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_octaves(engine_conf.octaves as usize);
            let gen = gen.set_frequency(engine_conf.frequency);
            let gen = gen.set_lacunarity(engine_conf.lacunarity);
            let gen = gen.set_persistence(engine_conf.persistence);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
        GenType::BasicMulti => {
            let gen = Box::from_raw(engine as *mut BasicMulti<f32>);
            let gen = gen.set_seed(engine_conf.seed as u32);
            let gen = gen.set_octaves(engine_conf.octaves as usize);
            let gen = gen.set_frequency(engine_conf.frequency);
            let gen = gen.set_lacunarity(engine_conf.lacunarity);
            let gen = gen.set_persistence(engine_conf.persistence);
            Box::into_raw(Box::new(gen)) as *mut c_void
        },
    }
}

/// Defines a middleware that sets the cell state of
struct NoiseStepper{
    conf: Box<NoiseEngine>,
    noise_engine: *mut c_void,
}

impl Middleware<CS, ES, MES, CA, EA, OurEngine> for NoiseStepper {
    fn after_render(&mut self, universe: &mut OurUniverse) {
        // handle any new setting changes before rendering
        if self.conf.needs_update {
            if self.conf.needs_resize {
                // resize the universe if the canvas size changed, matching that size.
                resize_universe(universe, self.conf.canvas_size);
                self.conf.needs_resize = false;
            } else {
                if self.conf.needs_new_noise_gen {
                    self.noise_engine = create_noise_engine(self.conf.generator_type);
                    self.conf.needs_new_noise_gen = false;
                }

                // re-apply all settings to the noise module
                self.noise_engine = unsafe { apply_settings(&*self.conf, self.noise_engine) };
            }

            self.conf.needs_update = false;
        }

        let module = match self.conf.generator_type {
            GenType::Fbm => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut Fbm<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::Worley => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut Worley<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::OpenSimplex => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut OpenSimplex) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::Billow => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut Billow<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::HybridMulti => drive_noise(&mut universe.cells, universe.seq, &unsafe { &*(self.noise_engine as *mut HybridMulti<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::SuperSimplex => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut SuperSimplex) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::Value => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut Value) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::RidgedMulti => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut RidgedMulti<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
            GenType::BasicMulti => drive_noise(&mut universe.cells, universe.seq, unsafe { &*(self.noise_engine as *mut BasicMulti<f32>) }, self.conf.canvas_size, self.conf.zoom, self.conf.speed),
        };
    }
}

fn calc_color(cell: &Cell<CS>, _: &[usize], _: &EntityContainer<CS, ES, MES>) -> [u8; 4] {
    // normalize into range from -180 to 180
    let hue = (cell.state.0 * 360.0) + 180.0;
    let hsv_color = Hsv::new(hue.into(), 1.0, 1.0);
    let rgb_color = Rgb::from_hsv(hsv_color);
    [(rgb_color.red * 255.0) as u8, (rgb_color.green * 255.0) as u8, (rgb_color.blue * 255.0) as u8, 255]
}

struct WorldGenerator;

impl Generator<CS, ES, MES, CA, EA> for WorldGenerator {
    fn gen(&mut self, conf: &UniverseConf) -> (Vec<Cell<CS>>, Vec<Vec<Entity<CS, ES, MES>>>) {
        // initialize blank universe
        (vec![Cell{state: CS(0.0)}; conf.size * conf.size], Vec::new())
    }
}

fn main() {
    // only runs on Asm.JS/Emscripten which use 32-bit addressing
    assert_eq!(std::mem::size_of::<usize>(), 4);
    assert_eq!(std::mem::size_of::<SettingType>(), 4);
    assert_eq!(std::mem::size_of::<GenType>(), 4);

    // let noise6: Blend<Point3<f32>, f32> = Blend::new(&*NOISE_1, &*NOISE_4, &*NOISE_5);

    // Intentionally left blank; the engine itself is initialized by the JavaScript asynchronously.
}
