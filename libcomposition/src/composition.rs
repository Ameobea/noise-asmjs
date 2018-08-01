//! Defines a `NoiseModuleComposer` struct that combines the inputs of multiple noise modules into one single output.

use std::convert::TryFrom;

use noise::{NoiseFn, Point3};
use serde_json;

use super::CompositionTreeNode;
use ir::IrNode;
use util::find_setting_by_name;

/// Defines a way to combine the outputs of multiple noise modules into one.
#[derive(Debug, Serialize, Deserialize)]
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
                let sum = children
                    .iter()
                    .fold(0., |acc, child| acc + child.get(coord));
                sum / children.len() as f64
            }
            &CompositionScheme::WeightedAverage(ref weights) => {
                unimplemented!(); // TODO
            }
        }
    }
}

impl TryFrom<IrNode> for CompositionScheme {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        let composition_scheme = find_setting_by_name("compositionScheme", &node.settings)?;

        match composition_scheme.as_str() {
            "average" => Ok(CompositionScheme::Average),
            "weightedAverage" => Ok(CompositionScheme::WeightedAverage({
                let raw_val = find_setting_by_name("weights", &node.settings)?;
                serde_json::from_str(&raw_val).map_err(|_| {
                    format!("Unable to parse `weights` vector from string: {}", raw_val)
                })?
            })),
            _ => Err(format!(
                "Unknown composition scheme \"{}\" provided!",
                composition_scheme
            )),
        }
    }
}
