//! Defines a trait that serves as a wrapper around noise modules and transform their inputs in some way.

use noise::{NoiseFn, Point2};

use util::Dim;
use CompositionTreeNode;

pub enum InputTransformation {
    /// Transforms the input coordinate by scaling the X and Y dims by `zoom` and the Z dim by `speed`.
    ZoomScale { speed: f64, zoom: f64 },
    /// Replaces the `replacement_dim` of the input with the result of passing it through the provided noise function.
    HigherOrderNoiseModule {
        node: CompositionTreeNode,
        replaced_dim: Dim,
    },
    /// Multiplies all of the input values by this value
    ScaleAll(f64),
}

impl InputTransformation {
    pub fn transform(&self, coord: Point2<f64>) -> Point2<f64> {
        match self {
            &InputTransformation::ZoomScale { speed: _, zoom } => {
                [coord[0] * zoom, coord[1] * zoom]
            }
            &InputTransformation::HigherOrderNoiseModule {
                ref node,
                replaced_dim,
            } => {
                let val = node.get(coord);

                match replaced_dim {
                    Dim::X => [val, coord[1]],
                    Dim::Y => [coord[0], val],
                    Dim::Z => coord,
                }
            }
            &InputTransformation::ScaleAll(scale) => [coord[0] * scale, coord[1] * scale],
        }
    }
}

/// Applies a list of transformations to the given input coordinate, returning the transformed result.
pub fn apply_transformations(
    transformations: &[InputTransformation],
    coord: Point2<f64>,
) -> Point2<f64> {
    transformations
        .iter()
        .fold(coord, |acc, transformation| transformation.transform(acc))
}
