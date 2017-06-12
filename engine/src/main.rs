//! My goal for this is to play around with the noise-rs crate and create some noise with which to populate the universe of a
//! minutiae world.  We'll use 3D perlin noise and have the third coordinate correspond to the sequence number.

// TODO: implement middleware for closures that have the required `before_render`/`after_render` signature
// TODO: look into auto-implementing cell action/entity action for T since they don't have any requirements and possibly
//       implementing CA/EA for `()`
// TODO: Deprecate the entire cell mutator functionality in favor of entirely middleware-driven approaches

#![allow(unused_variables, dead_code)]

#![feature(alloc)]

extern crate alloc;
#[macro_use]
extern crate lazy_static;
extern crate minutiae;
extern crate noise;
extern crate palette;

use std::ffi::CString;
use std::os::raw::{c_char, c_void};

use minutiae::prelude::*;
use minutiae::emscripten::{EmscriptenDriver, CanvasRenderer};
use noise::{Billow, NoiseModule, OpenSimplex,Fbm, HybridMulti, Point3, RidgedMulti, SuperSimplex, Value, Worley};
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

const UNIVERSE_SIZE: usize = 575;
const ZOOM: f32 = 0.0132312;
const TIME_SCALE: f32 = 0.00758;

lazy_static!{
    static ref NOISE_1: Fbm<f32> = Fbm::new();
    static ref NOISE_2: Worley<f32> = Worley::new();
    static ref NOISE_3: OpenSimplex = OpenSimplex::new();
    static ref NOISE_4: Billow<f32> = Billow::new();
    static ref NOISE_5: HybridMulti<f32> = HybridMulti::new();
    static ref NOISE_6: SuperSimplex = SuperSimplex::new();
    static ref NOISE_7: Value = Value::new();
    static ref NOISE_8: RidgedMulti<f32> = RidgedMulti::new();
}

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
    needs_update: bool, // flag indicating whether or not there are new stettings that need to be applied
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
            needs_update: false,
        }
    }
}

/// given a buffer containing all of the cells in the universe, calculates values for each of them using
/// perlin noise and sets their states according to the result.
fn drive_noise(cells_buf: &mut [Cell<CS>], seq: usize, noise: &NoiseModule<Point3<f32>, f32>) {
    let fseq = seq as f32;
    for y in 0..UNIVERSE_SIZE {
        for x in 0..UNIVERSE_SIZE {
            // calculate noise value for current coordinate and sequence number
            let val = noise.get([x as f32 * ZOOM, y as f32 * ZOOM, fseq * TIME_SCALE]);

            // set the cell's state equal to that value
            let index = get_index(x, y, UNIVERSE_SIZE);
            cells_buf[index].state = CS(val);
        }
    }
}

/// Defines a middleware that sets the cell state of
struct NoiseStepper(Box<NoiseEngine>);

impl Middleware<CS, ES, MES, CA, EA, OurEngine> for NoiseStepper {
    fn after_render(&mut self, universe: &mut OurUniverse) {
        let module = match self.0.generator_type {
            GenType::Fbm => drive_noise(&mut universe.cells, universe.seq, &*NOISE_1),
            GenType::Worley => drive_noise(&mut universe.cells, universe.seq, &*NOISE_2),
            GenType::OpenSimplex => drive_noise(&mut universe.cells, universe.seq, &*NOISE_3),
            GenType::Billow => drive_noise(&mut universe.cells, universe.seq, &*NOISE_4),
            GenType::HybridMulti => drive_noise(&mut universe.cells, universe.seq, &*NOISE_5),
            GenType::SuperSimplex => drive_noise(&mut universe.cells, universe.seq, &*NOISE_6),
            GenType::Value => drive_noise(&mut universe.cells, universe.seq, &*NOISE_7),
            GenType::RidgedMulti => drive_noise(&mut universe.cells, universe.seq, &*NOISE_8),
        };

        if self.0.needs_update {
            unimplemented!(); // TODO
        }
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
        (vec![Cell{state: CS(0.0)}; UNIVERSE_SIZE * UNIVERSE_SIZE], Vec::new())
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
