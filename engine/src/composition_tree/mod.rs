//! Defines the primary structure used to nest noise modules and build up a composition tree that sets up
//! how the modules are related.

use std::os::raw::c_void;

use noise::*;

pub mod definition;
use self::definition::CompositionTreeDefinition;
pub mod conf;
use self::conf::NoiseModuleConf;

/// Defines a way to combine the outputs of multiple noise modules into one.
#[derive(Serialize, Deserialize)]
pub enum CompositionScheme {
    Average,
    WeightedAverage(Vec<f32>),
}

#[derive(Serialize, Deserialize)]
pub enum NoiseModuleType {
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
}

impl NoiseModuleType {
    /// Given a module type and an array of configuration, builds the noise module and returns it as a
    /// `NoiseModule` trait object.
    pub fn build_module(&self, conf: Vec<NoiseModuleConf>) -> impl NoiseModule<Point3<f32>, f32> {
        unimplemented!(); // TODO
        Fbm::new()
    }
}

/// A wrapper around a noise module with managed configuration and the inner module itself.
pub struct ManagedNoiseModule {
    pub conf: Vec<NoiseModuleConf>,
    pub module_type: NoiseModuleType,
}

impl NoiseModule<Point3<f32>, f32> for ManagedNoiseModule {
    fn get(&self,coord: Point3<f32>) -> f32 {
        unimplemented!();
    }
}

/// The core of the noise module composition framework.  This struct contains
pub struct CompositionTree {

}

impl NoiseModule<Point3<f32>, f32> for CompositionTree {
    fn get(&self, coord: Point3<f32>) -> f32 {
        unimplemented!();
    }
}
