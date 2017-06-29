//! Defines a custom composed noise module, made up of multiple inner modules and designed to be dynamically
//! buildable and configurable from the application.

use std::os::raw::c_void;
use std::ptr;
use std::slice;

use noise::*;

use composition_meta::*;
use interop::{CompositionScheme, GenType};
use super::NoiseModuleConf;

/// Represents a generic noise module, stored as a pointer and a type.
#[derive(Clone)]
pub struct RawNoiseModule {
    pub engine_pointer: *mut c_void,
    pub conf: NoiseModuleConf,
}

impl NoiseModule<Point3<f32>, f32> for RawNoiseModule {
    fn get(&self, coord: Point3<f32>) -> f32 {
        match self.conf.generator_type {
            GenType::Fbm => unsafe { &*(self.engine_pointer as *mut Fbm<f32>) }.get(coord),
            GenType::Worley => unsafe { &*(self.engine_pointer as *mut Worley<f32>) }.get(coord),
            GenType::OpenSimplex => unsafe { &*(self.engine_pointer as *mut OpenSimplex) }.get(coord),
            GenType::Billow => unsafe { &*(self.engine_pointer as *mut Billow<f32>) }.get(coord),
            GenType::HybridMulti => unsafe { &*(self.engine_pointer as *mut HybridMulti<f32>) }.get(coord),
            GenType::SuperSimplex => unsafe { &*(self.engine_pointer as *mut SuperSimplex) }.get(coord),
            GenType::Value => unsafe { &*(self.engine_pointer as *mut Value) }.get(coord),
            GenType::RidgedMulti => unsafe { &*(self.engine_pointer as *mut RidgedMulti<f32>) }.get(coord),
            GenType::BasicMulti => unsafe { &*(self.engine_pointer as *mut BasicMulti<f32>) }.get(coord),
            GenType::Composed => unsafe { &*(self.engine_pointer as *mut ComposedNoiseModule ) }.get(coord),
        }
    }
}

/// Defines a method for composing multiple noise functions.
pub struct NoiseModuleComposer {
    scheme: CompositionScheme,
    meta: *const c_void,
}

impl Default for NoiseModuleComposer {
    fn default() -> Self {
        NoiseModuleComposer {
            scheme: CompositionScheme::Average,
            meta: ptr::null(),
        }
    }
}

impl NoiseModuleComposer {
    /// The core logic of the composition scheme happens here.  Given the composition scheme itself, an array of noise functions,
    /// and a point, calculates a final output value of the composed module.
    pub fn compose(&self, modules: &[RawNoiseModule], coord: Point3<f32>) -> f32 {
        match self.scheme {
            CompositionScheme::Average => {
                modules.iter().fold(0.0, |acc, noise_module| { acc + noise_module.get(coord) }) / modules.len() as f32
            },
            CompositionScheme::WeightedAverage => {
                let weight_meta: &WeightedAverageMeta = unsafe { &*(self.meta as *const WeightedAverageMeta) };
                // assume that the weights are correctly set up and that they all add up to 1.0
                modules.iter().enumerate().fold(0.0, |acc, (i, noise_module)| {
                    let weight = weight_meta.weights.get(i)
                        .expect(&format!("`WeightedAverageMeta` doesn't include index {} but we have {} child modules!", i, modules.len()));
                    acc + (noise_module.get(coord) * weight)
                })
            }
        }
    }
}

/// An array of noise functions and a compsition scheme used to combine their outputs into a single value.  These can be infinitely
/// nested since modules of type `GenType::Composed` can be contained in the modules array.
pub struct ComposedNoiseModule {
    pub modules: Vec<RawNoiseModule>,
    pub composer: NoiseModuleComposer,
}

impl NoiseModule<Point3<f32>, f32> for ComposedNoiseModule {
    fn get(&self, coord: Point3<f32>) -> f32 {
        self.composer.compose(&self.modules, coord)
    }
}

impl ComposedNoiseModule {
    pub fn new() -> Self {
        ComposedNoiseModule {
            modules: Vec::new(),
            composer: NoiseModuleComposer::default(),
        }
    }

    /// Given a setting to apply and a coordinate within the configuration tree (represented by a depth and set of indexes on each
    /// level of the tree), applies the configuration setting to the module.  `depth` is 1-indexed and should also represent
    /// the length of the coords array.
    pub fn find_child(&mut self, depth: i32, coords: *const i32) -> Result<RawNoiseModule, String> {
        let coords_slice: &[i32] = unsafe { slice::from_raw_parts(coords, depth as usize) };

        #[inline(never)]
        fn index_err(depth: usize, coord: usize) -> String {
            format!("Attempted to index composition tree at depth {}, coord {} which doesn't exist!", depth, coord)
        }

        // traverse the tree, bailing out in the case of an error.
        let mut cur_modules = &mut self.modules;
        for (depth, coord) in coords_slice.iter().take((depth - 1) as usize).enumerate() {
            let next_modules = match cur_modules.get(depth) {
                Some(module) => {
                    match module.conf.generator_type {
                        GenType::Composed => {
                            // Convert the `RawModule` into it's inner `ComposedModule` and save a reference to its modules vector.
                            let as_composed: &mut ComposedNoiseModule = unsafe { &mut *(module.engine_pointer as *mut ComposedNoiseModule) };
                            &mut as_composed.modules
                        },
                        _ => { return Err(index_err(depth, *coord as usize)); },
                    }
                },
                None => {
                    let errmsg = format!(
                        "Attempted to index composition tree at depth {}, coord {} which doesn't exist!",
                        depth,
                        *coord as usize
                    );
                    return Err(errmsg);
                },
            };
            cur_modules = next_modules;
        }

        // Take the final index of our `cur_modules` vector and return a reference to it.
        let final_coord = *coords_slice.last().unwrap() as usize;
        match cur_modules.get(final_coord) {
            Some(raw_mod) => Ok(raw_mod.clone()),
            None => { return Err(index_err(depth as usize, final_coord)); }
        }
    }
}
