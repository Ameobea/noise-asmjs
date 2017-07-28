//! Defines an intermediate representation between the format of data returned by the frontend and the
//! composition tree definitions used by the backend.

use std::convert::{TryFrom, TryInto};

use composition_tree::definition::CompositionTreeNodeDefinition;
use transformations::InputTransformation;

#[derive(Clone, Serialize, Deserialize)]
struct IrSetting {
    key: String,
    value: String,
}

#[derive(Clone, Serialize, Deserialize)]
struct IrNode {
    #[serde(rename = "type")]
    _type: String,
    settings: Vec<IrSetting>,
    children: Vec<IrNode>,
}

/// Attempts to locate a child node among the children of a node and convert it into an internal definition.
fn build_child<T>(children: &[IrNode], child_type: &str) -> Result<T, T::Error> where T: TryFrom<IrNode>, T::Error: From<String> {
    children.iter()
        .find(|child| child._type == child_type)
        .map_or(
            Err(format!("No child of type `\"{}\" found for node !", child_type).into()),
            |child| child.clone().try_into()
        )
}

/// Attempts to convert a `Vec` of `IrNode`s to a `Vec` or something else, returning `Err` if any of the conversions failed.
fn map_ir_nodes<T>(nodes: Vec<IrNode>) -> Result<Vec<T>, T::Error> where T: TryFrom<IrNode>, T::Error: From<String>{
    nodes.into_iter().fold(Ok(Vec::new()), |acc, item| {
        match acc {
            Ok(mut acc_inner) => {
                match item.try_into() {
                    Ok(converted) => {
                        acc_inner.push(converted);
                        Ok(acc_inner)
                    }
                    Err(err) => Err(err),
                }
            },
            Err(err) => Err(err),
        }
    })
}

// TODO: Create functions for converting settings from the IR format into inner representations.

/// Attempts to return a vector of all child nodes that are of a certain type.
fn build_children<T>(children: Vec<IrNode>, child_type: &str) -> Result<Vec<T>, T::Error> where T: TryFrom<IrNode>, T::Error: From<String> {
    let matching_children = children
        .into_iter()
        .filter(|child| child._type == child_type)
        .collect();
    map_ir_nodes(matching_children)
}

impl TryFrom<IrNode> for CompositionTreeNodeDefinition {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        match node._type.as_str() {
            "noiseModule" => {
                let transformations: Vec<InputTransformation> = build_child(&node.children, "inputTransformations")?;
                let children: Vec<CompositionTreeNodeDefinition> = build_children(node.children, "noiseModule")?;

                unimplemented!(); // TODO
            },
            _ => Err(format!("Failed to convert IrNode into `Vec<InputTransformation>` because it's of type {}.", node._type)),
        }
    }
}

impl TryFrom<IrNode> for Vec<InputTransformation> {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        match node._type.as_str() {
            "inputTransformations" => map_ir_nodes(node.children),
            _ => Err(format!("Failed to convert IrNode into `Vec<InputTransformation>` because it's of type {}.", node._type)),
        }
    }
}

impl TryFrom<IrNode> for InputTransformation {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        match node._type.as_str() {
            "InputTransformation" => {
                unimplemented!(); // TODO
            },
            _ => Err(format!("Failed to convert IrNode into `InputTransformation` because it's of type {}.", node._type)),
        }
    }
}
