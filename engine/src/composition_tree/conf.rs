//! Defines the data types used to create noise modules.

use super::composition::CompositionScheme;
use super::definition::CompositionTreeDefinitionNode;

use noise::RangeFunction;

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
#[derive(Serialize, Deserialize)]
pub enum NoiseModuleConf {
    NoiseModule {
        zoom: f32,
        speed: f32,
    },
    MultiFractal {
        octaves: u32,
        frequency: f32,
        lacunarity: f32,
        persistence: f32,
    },
    Seedable {
        seed: u32,
    },
    Worley {
        rangeFunction: Option<InteropRangeFunction>,
        frequency: f32,
        displacement: f32,
    },
    Constant {
        constant: f32,
    },
    Composed {
        scheme: CompositionScheme,
        children: Vec<CompositionTreeDefinitionNode>,
    }
}
