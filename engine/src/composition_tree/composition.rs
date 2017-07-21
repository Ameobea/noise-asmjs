//! Defines a `NoiseModuleComposer` struct that combines the inputs of multiple noise modules into one single output.

use noise::{NoiseFn, Point3};

use super::CompositionTreeNode;

/// Defines a way to combine the outputs of multiple noise modules into one.
#[derive(Serialize, Deserialize)]
pub enum CompositionScheme {
    Average,
    WeightedAverage(Vec<f64>),
}

impl CompositionScheme {
    /// Given a set of children noise generators and a coordinate, combines the outputs of each of the child modules and
    /// returns a single output.
    pub fn compose(&self, children: &[CompositionTreeNode], coord: Point3<f64>) -> f64 {
        match self {
            &CompositionScheme::Average => {
                unimplemented!(); // TODO
            },
            &CompositionScheme::WeightedAverage(ref weights) => {
                unimplemented!(); // TODO
            }
        }
    }
}
