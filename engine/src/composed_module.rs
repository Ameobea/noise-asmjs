//! Defines a custom composed noise module, made up of multiple inner modules and designed to be dynamically
//! buildable and configurable from the application.

use std::os::raw::c_void;
use std::ptr;
use std::slice;

use noise;
use noise::*;

use composition_meta::*;
use interop::{CompositionScheme, GenType};
use super::{error, NoiseModuleConf};

pub fn weighted_average(modules: &[RawNoiseModule], weights: &[f32], coord: Point3<f32>) -> f32 {
    println!("Modules: {}, Weights: {:?}", modules.len(), weights);
    modules.iter().enumerate().fold(0.0, |acc, (i, noise_module)| {
        let weight = weights.get(i)
            .expect(&format!("`WeightedAverageMeta` doesn't include index {} but we have {} child modules!", i, modules.len()));
        println!("Module type: {:?}", noise_module.conf.generator_type);
        acc + (noise_module.get(coord) * weight)
    })
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
                debug_assert_eq!(modules.len(), weight_meta.weights.len());
                // assume that the weights are correctly set up and that they all add up to 1.0
                weighted_average(modules, &weight_meta.weights, coord)
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

    /// Adds a child module to the end of the modules list.  The metadata will have to be adjusted manually if it needs to be changed.
    pub fn add_child(&mut self, child_module: RawNoiseModule) {
        self.modules.push(child_module)
    }

    /// Removes a child module from the selected index of the modules list.  The metadata will have to be adjusted manually if it
    /// needs to be changed.
    pub fn remove_child(&mut self, child_index: usize) {
        if self.modules.len() <= child_index {
            return error(&format!(
                "Attempted to remove child module of index {} from composed module, but it only contains {}.",
                child_index,
                self.modules.len()
            ));
        } else {
            self.modules.remove(child_index);
            self.modules.shrink_to_fit();
        }
    }

    /// Returns a JSON-encoded string describing the structure of this tree.  Each node has a module `genType` field which
    /// corresponds to `GenType`, a `conf` field which contains that modules `NoiseModuleConf`, and if it's a `ComposedNoiseModule`
    /// a `modules` field containing an array of more modules.
    ///
    /// Using this method allows for an up-to-date view of the backend to be obtained from the frontend at any time.
    pub fn get_json_tree(&self) -> String {
        #[derive(Serialize)]
        struct TreeNode {
            genType: GenType,
            conf: NoiseModuleConf,
            modules: Vec<TreeNode>,
        }

        unimplemented!(); // TODO
    }
}

#[test]
/// Makes sure that our weighted average composition scheme works and that we're properly dealing with raw pointers.
fn weighted_average_accuracy() {
    let real_modules: Vec<Box<Constant<f32>>> = vec![Box::new(Constant::new(0.1)), Box::new(Constant::new(0.9)), Box::new(Constant::new(0.3))];
    let raw_modules: Vec<RawNoiseModule> = real_modules.into_iter().map(|module| {
        RawNoiseModule {
            engine_pointer: Box::into_raw(module) as *mut c_void,
            conf: {
                let mut conf = NoiseModuleConf::default();
                conf.generator_type = GenType::Constant;
                conf
            },
        }
    }).collect();

    let meta = WeightedAverageMeta {
        weights: vec![0.2, 0.2, 0.6],
    };

    let composed_module = ComposedNoiseModule {
        composer: NoiseModuleComposer {
            scheme: CompositionScheme::WeightedAverage,
            meta: Box::into_raw(Box::new(meta)) as *mut c_void,
        },
        modules: raw_modules,
    };

    let coord = [0., 0., 0.,];
    assert_eq!(composed_module.get(coord), (0.1 * 0.2) + (0.9 * 0.2) + (0.3 * 0.6));
}
