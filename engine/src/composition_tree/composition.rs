//! Defines a `NoiseModuleComposer` struct that combines the inputs of multiple noise modules into one single output.

use noise::{NoiseFn, Point3};

use super::CompositionTreeNode;
use super::super::error;

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
                let sum = children.iter()
                    .fold(0., |acc, child| { acc + child.get(coord) });
                sum / children.len() as f64
            },
            &CompositionScheme::WeightedAverage(ref weights) => {
                error("WeighedAverage called...");
                0.0
            }
        }
    }
}
