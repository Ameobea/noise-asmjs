//! Defines an intermediate representation between the format of data returned by the frontend and the
//! composition tree definitions used by the backend.

use std::convert::{TryFrom, TryInto};

use itertools::Itertools;

use composition_tree::composition::CompositionScheme;
use composition_tree::definition::{CompositionTreeNodeDefinition, InputTransformationDefinition, NoiseModuleType};
use util::{build_child, build_noise_module_settings, find_setting_by_name};

#[derive(Clone, Serialize, Deserialize)]
pub struct IrSetting {
    pub key: String,
    pub value: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct IrNode {
    #[serde(rename = "type")]
    pub _type: String,
    pub settings: Vec<IrSetting>,
    pub children: Vec<IrNode>,
}

/// Attempts to convert a `Vec` of `IrNode`s to a `Vec` or something else, returning `Err` if any of the conversions failed.
pub fn map_ir_nodes<T>(nodes: Vec<IrNode>) -> Result<Vec<T>, T::Error> where T: TryFrom<IrNode>, T::Error: From<String> {
    let node_count = nodes.len();
    nodes.into_iter()
        .map(|item| item.try_into())
        .fold_results(Vec::with_capacity(node_count), |mut acc, item| {
            acc.push(item);
            acc
        })
}

// TODO: Create functions for converting settings from the IR format into inner representations.

/// Attempts to return a vector of all child nodes that are of a certain type.
pub fn build_children<T>(children: Vec<IrNode>, child_type: &str) -> Result<Vec<T>, T::Error> where T: TryFrom<IrNode>, T::Error: From<String> {
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
                let transformations: Vec<InputTransformationDefinition> = build_child(&node.children, "inputTransformations")?;
                let module_type: NoiseModuleType = find_setting_by_name("moduleType", &node.settings)?
                    .try_into()?;

                let built_def = if module_type != NoiseModuleType::Composed {
                    CompositionTreeNodeDefinition::Leaf {
                        module_conf: build_noise_module_settings(node.settings)?,
                        module_type,
                        transformations,
                    }
                } else {
                    let scheme: CompositionScheme = build_child(&node.children, "compositionScheme")?;
                    let children: Vec<CompositionTreeNodeDefinition> = build_children(node.children, "noiseModule")?;
                    // debug(&format!("Built composed node children: {:?}", children));

                    CompositionTreeNodeDefinition::Composed {
                        children,
                        scheme,
                        transformations,
                    }
                };

                Ok(built_def)
            },
            _ => Err(format!("Failed to convert IrNode into `CompositionTreeNodeDefinition` because it's of type {}.", node._type)),
        }
    }
}

impl TryFrom<IrNode> for Vec<InputTransformationDefinition> {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        match node._type.as_str() {
            "inputTransformations" => map_ir_nodes(node.children),
            _ => Err(format!("Failed to convert IrNode into `Vec<InputTransformation>` because it's of type {}.", node._type)),
        }
    }
}

impl TryFrom<IrNode> for InputTransformationDefinition {
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
