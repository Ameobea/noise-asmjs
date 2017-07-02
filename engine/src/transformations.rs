//! Defines a trait that serves as a wrapper around noise modules and transform their inputs in some way.

use noise::{NoiseModule, Point3};

use composition_tree::CompositionTreeNode;
use util::Dim;

pub enum InputTransformation {
    /// Transforms the input coordinate by scaling the X and Y dims by `zoom` and the Z dim by `speed`.
    ZoomScale {speed: f32, zoom: f32},
    /// Replaces the `replacement_dim` of the input with the result of passing it through the provided noise function.
    HigherOrderNoiseModule {node: CompositionTreeNode, replaced_dim: Dim},
}

impl InputTransformation {
    pub fn transform(&self, coord: Point3<f32>) -> Point3<f32> {
        match self {
            &InputTransformation::ZoomScale{ speed, zoom } => {
                [coord[0] * zoom, coord[1] * zoom, coord[2] * speed]
            },
            &InputTransformation::HigherOrderNoiseModule { ref node, replaced_dim } => {
                let val = node.get(coord);

                match replaced_dim {
                    Dim::X => [val, coord[1], coord[2]],
                    Dim::Y => [coord[0], val, coord[2]],
                    Dim::Z => [coord[0], coord[1], val],
                }
            }
        }
    }
}
