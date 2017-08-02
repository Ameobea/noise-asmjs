//! Defines the data types used to create noise modules.

use std::str::FromStr;

use noise::{Constant, MultiFractal, RangeFunction, Seedable, Worley};

use super::super::debug;

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

impl FromStr for InteropRangeFunction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Euclidean" => Ok(InteropRangeFunction::Euclidean),
            "EuclideanSquared" => Ok(InteropRangeFunction::EuclideanSquared),
            "Manhattan" => Ok(InteropRangeFunction::Manhattan),
            "Chebyshev" => Ok(InteropRangeFunction::Chebyshev),
            "Quadratic" => Ok(InteropRangeFunction::Quadratic),
            _ => Err(format!("Unable to convert \"{}\" into `InteropRangeFunction`!", s)),
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
        range_function: InteropRangeFunction,
        range_function_enabled: bool,
        worley_frequency: f64,
        displacement: f64,
    },
    Constant {
        constant: f64,
    },
}

/// List of all the settings for use in mapping keys to their corresponding setting types.
#[derive(PartialEq, Eq, Hash)]
pub enum SettingType {
    MultiFractal,
    Seedable,
    Worley,
    Constant,
}

/// Matches a key of a setting from the frontend to its corresponding setting type that will eventually be
/// used to make it into a `NoiseModuleConf`.
pub fn map_setting_to_type(key: &str) -> Result<SettingType, String> {
    match key {
        "octaves" | "frequency" | "lacunarity" | "persistence" => Ok(SettingType::MultiFractal),
        "seed" => Ok(SettingType::Seedable),
        "rangeFunction" | "worleyFrequency" | "displacement" => Ok(SettingType::Worley),
        "constant" => Ok(SettingType::Constant),
        _ => Err(format!("Unable to match setting with key {} to `SettingType`!", key)),
    }
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
        debug(&format!("ERROR: Attempted to configure module with multifractal settings but the settings aren't multifractal: {:?}", conf));
        module
    }
}

pub fn apply_seedable_conf<T: Seedable>(conf: &NoiseModuleConf, module: T) -> T {
    if let &NoiseModuleConf::Seedable { seed } = conf {
        module.set_seed(seed)
    } else {
        debug(&format!("ERROR: Attempted to configure module with seedable settings but the settings aren't seedable: {:?}", conf));
        module
    }
}

pub fn apply_worley_conf(conf: &NoiseModuleConf, module: Worley) -> Worley {
    if let &NoiseModuleConf::Worley { range_function, range_function_enabled, worley_frequency, displacement } = conf {
        if range_function_enabled { module.enable_range(true) } else { module.enable_range(false) }
            .set_range_function(range_function.into())
            .set_displacement(displacement)
            .set_frequency(worley_frequency)
    } else {
        debug(&format!("ERROR: Attempted to configure module with worley settings but the settings aren't worley: {:?}", conf));
        module
    }
}

pub fn apply_constant_conf(conf: &NoiseModuleConf, module: Constant) -> Constant {
    if let &NoiseModuleConf::Constant { constant } = conf {
        Constant::new(constant)
    } else {
        debug(&format!("ERROR: Attempted to configure module with constant settings but the settings aren't constant: {:?}", conf));
        module
    }
}
