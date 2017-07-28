//! My goal for this is to play around with the noise-rs crate and create some noise with which to populate the universe of a
//! minutiae world.  We'll use 3D perlin noise and have the third coordinate correspond to the sequence number.

// TODO: implement middleware for closures that have the required `before_render`/`after_render` signature
// TODO: look into auto-implementing cell action/entity action for T since they don't have any requirements and possibly
//       implementing CA/EA for `()`
// TODO: Deprecate the entire cell mutator functionality in favor of entirely middleware-driven approaches

// #![allow(unused_variables, dead_code)]
#![feature(conservative_impl_trait, try_from)]

extern crate minutiae;
extern crate noise;
extern crate palette;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

use std::ffi::CString;
use std::os::raw::{c_char, c_void};

use minutiae::prelude::*;
use minutiae::emscripten::{EmscriptenDriver, CanvasRenderer};
use noise::*;
use palette::{FromColor, Hsv, Rgb};

extern {
    /// Given a pointer to our pixel data buffer, draws its contents to the canvas.
    pub fn canvas_render(ptr: *const u8);
    /// Given a pointer to the noise engine's state, registers it on the JS side into the Redux store
    pub fn setEnginePointer(ptr: *const c_void);
    /// Given a pointer to the composition tree, registers it on the JS side in the Redux store.
    pub fn setTreePointer(ptr: *const c_void);
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

pub mod composition_tree;
use self::composition_tree::CompositionTree;
pub mod interop;
use interop::*;
pub mod ir;
pub mod transformations;
pub mod util;

#[cfg(test)]
pub mod tests;

// Minutiae custom type declarations.
// Since we're only using a very small subset of Minutiae's capabilities, these are mostly unused.

#[derive(Clone)]
struct CS(f64);
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
    fn step(&mut self, universe: &mut OurUniverse) {
        // no-op; all logic is handled by the middleware
        universe.seq += 1;
    }
}

/// given a buffer containing all of the cells in the universe, calculates values for each of them using
/// perlin noise and sets their states according to the result.
fn drive_noise(cells_buf: &mut [Cell<CS>], seq: usize, noise: &NoiseFn<Point3<f64>>, universe_size: usize, zoom: f64, speed: f64) {
    let fseq = seq as f64;
    for y in 0..universe_size {
        for x in 0..universe_size {
            // calculate noise value for current coordinate and sequence number
            let val = noise.get([x as f64 * zoom, y as f64 * zoom, fseq * speed]);

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

    universe.cells.resize(new_size * new_size, Cell {state: CS(0.0)});
    universe.conf.size = new_size;
}

/// Configuration status and state for the entire backend.
pub struct MasterConf {
    needs_resize: bool,
    canvas_size: usize,
    zoom: f64,
    speed: f64,
}

impl Default for MasterConf {
    fn default() -> Self {
            MasterConf {
            needs_resize: false,
            canvas_size: 0,
            speed: 0.00758,
            zoom: 0.0132312,
        }
    }
}

/// Defines a middleware that sets the cell state of
pub struct NoiseStepper {
    composition_tree: Box<CompositionTree>, // The root node of the module composition tree
    conf: MasterConf,
}

impl Middleware<CS, ES, MES, CA, EA, OurEngine> for NoiseStepper {
    fn after_render(&mut self, universe: &mut OurUniverse) {
        // handle any new setting changes before rendering

       if self.conf.needs_resize {
            // resize the universe if the canvas size changed, matching that size.
            resize_universe(universe, self.conf.canvas_size);
            self.conf.needs_resize = false;
        }

        drive_noise(&mut universe.cells, universe.seq, &*self.composition_tree, self.conf.canvas_size, self.conf.zoom, self.conf.speed);
    }
}

// TODO: Migrate to external color function
fn calc_color(cell: &Cell<CS>, _: &[usize], _: &EntityContainer<CS, ES, MES>) -> [u8; 4] {
    // normalize into range from -180 to 180
    let hue = (cell.state.0 * 360.0) + 180.0;
    let hsv_color = Hsv::new(hue.into(), 1.0, 1.0);
    let rgb_color = Rgb::from_hsv(hsv_color);
    [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
    // [(cell.state.0 * 255.0) as u8, (cell.state.0 * 255.0) as u8, (cell.state.0 * 255.0) as u8, 255]
}

struct WorldGenerator;

impl Generator<CS, ES, MES, CA, EA> for WorldGenerator {
    fn gen(&mut self, conf: &UniverseConf) -> (Vec<Cell<CS>>, Vec<Vec<Entity<CS, ES, MES>>>) {
        // initialize blank universe
        (vec![Cell{state: CS(0.0)}; conf.size * conf.size], Vec::new())
    }
}

fn main() {
    // Intentionally left blank; the engine itself is initialized by the JavaScript asynchronously.
}
