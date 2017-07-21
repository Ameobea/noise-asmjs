//! Defines the data types used to create noise modules.

use noise::{Constant, MultiFractal, RangeFunction, Seedable, Worley};

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

/// Holds all possible configuration options for a noise module.  Since each module supports one or more of
/// these enum variants, each `GenNoiseModule` will have an array of these that describe the configuration
/// of that particular `GenNoiseModule`.
#[derive(Debug, Serialize, Deserialize)]
pub enum NoiseModuleConf {
    MultiFractal {
        octaves: u32,
        frequency: f64,
        lacunarity: f64,
        persistence: f64,
    },
    Seedable {
        seed: u32,
    },
    Worley {
        range_function: Option<InteropRangeFunction>,
        frequency: f64,
        displacement: f64,
    },
    Constant {
        constant: f64,
    },
}

/// Configuration that applies to the entire composition tree.
#[derive(Serialize, Deserialize)]
pub struct GlobalTreeConf {
    pub speed: f64,
    pub zoom: f64,
}

pub fn apply_multifractal_conf<T: MultiFractal>(conf: &NoiseModuleConf, module: T) -> T {
    if let &NoiseModuleConf::MultiFractal { octaves, frequency, lacunarity, persistence } = conf {
        module.set_octaves(octaves as usize)
            .set_frequency(frequency)
            .set_lacunarity(lacunarity)
            .set_persistence(persistence)
    } else {
        println!("ERROR: Attempted to configure module with multifractal settings but the settings aren't multifractal: {:?}", conf);
        module
    }
}

pub fn apply_seedable_conf<T: Seedable>(conf: &NoiseModuleConf, module: T) -> T {
    if let &NoiseModuleConf::Seedable { seed } = conf {
        module.set_seed(seed)
    } else {
        println!("ERROR: Attempted to configure module with seedable settings but the settings aren't seedable: {:?}", conf);
        module
    }
}

pub fn apply_worley_conf(conf: &NoiseModuleConf, module: Worley) -> Worley {
    if let &NoiseModuleConf::Worley { range_function, frequency, displacement } = conf {
        match range_function {
            Some(range_fn) => module.enable_range(true).set_range_function(range_fn.into()),
            None => module.enable_range(false),
        }.set_frequency(frequency)
            .set_displacement(displacement)
    } else {
        println!("ERROR: Attempted to configure module with worley settings but the settings aren't worley: {:?}", conf);
        module
    }
}

pub fn apply_constant_conf(conf: &NoiseModuleConf, module: Constant) -> Constant {
    if let &NoiseModuleConf::Constant { constant } = conf {
        Constant::new(constant)
    } else {
        println!("ERROR: Attempted to configure module with constant settings but the settings aren't constant: {:?}", conf);
        module
    }
}
