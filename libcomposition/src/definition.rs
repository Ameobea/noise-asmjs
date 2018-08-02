//! Defines a meta-format that can be used to represent composition trees in a serialize-able/dematerialize-able manner.

use std::convert::TryFrom;

use noise::*;
use serde_json;

use super::composition::CompositionScheme;
use super::conf::{
    apply_constant_conf, apply_multifractal_conf, apply_seedable_conf, apply_worley_conf,
    NoiseModuleConf,
};
use super::{
    ComposedNoiseModule, CompositionTree, CompositionTreeNode, CompositionTreeNodeType, MasterConf,
};
use ir::IrNode;
use transformations::InputTransformation;
use util::{convert_setting, find_setting_by_name, Dim};

/// Defines a meta-representation of a `CompositionTree` designed to be passed into the backend from the JS frontend.  It
/// contains all information necessary to construct a fully functional composition tree from scratch.
#[derive(Serialize, Deserialize)]
pub struct CompositionTreeDefinition {
    pub global_conf: MasterConf,
    pub root_node: CompositionTreeNodeDefinition,
}

/// Includes every possible type of noise module available through the tool.
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub enum NoiseModuleType {
    Composed,
    Fbm,
    Worley,
    OpenSimplex,
    Billow,
    HybridMulti,
    SuperSimplex,
    Value,
    RidgedMulti,
    BasicMulti,
    Constant,
}

// wanted to do this with macros, but deriving `Serialize` and `Deserialize` seems to break that.
impl TryFrom<String> for NoiseModuleType {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        match s.as_str() {
            "Composed" => Ok(NoiseModuleType::Composed),
            "Fbm" => Ok(NoiseModuleType::Fbm),
            "Worley" => Ok(NoiseModuleType::Worley),
            "OpenSimplex" => Ok(NoiseModuleType::OpenSimplex),
            "Billow" => Ok(NoiseModuleType::Billow),
            "HybridMulti" => Ok(NoiseModuleType::HybridMulti),
            "SuperSimplex" => Ok(NoiseModuleType::SuperSimplex),
            "Value" => Ok(NoiseModuleType::Value),
            "RidgedMulti" => Ok(NoiseModuleType::RidgedMulti),
            "BasicMulti" => Ok(NoiseModuleType::BasicMulti),
            "Constant" => Ok(NoiseModuleType::Constant),
            _ => Err(format!(
                "Unable to convert `moduleType` setting attribute into `NoiseModuleType`: {}",
                s
            )),
        }
    }
}

fn build_transformations(
    transformation_definitions: Vec<InputTransformationDefinition>,
) -> Vec<InputTransformation> {
    transformation_definitions
        .into_iter()
        .map(|def| def.into())
        .collect()
}

impl NoiseModuleType {
    pub fn construct_noise_fn(&self, confs: &[NoiseModuleConf]) -> Box<NoiseFn<Point2<f64>>> {
        match self {
            &NoiseModuleType::Fbm => {
                let configured_module = confs.iter().fold(Fbm::new(), |acc, conf| match conf {
                    &NoiseModuleConf::MultiFractal { .. } => apply_multifractal_conf(conf, acc),
                    &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                    _ => {
                        println!("Invalid configuration provided to Fbm module: {:?}", conf);
                        acc
                    }
                });
                Box::new(configured_module) as Box<NoiseFn<Point2<f64>>>
            }
            &NoiseModuleType::Worley => {
                let configured_module = confs.iter().fold(Worley::new(), |acc, conf| match conf {
                    &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                    &NoiseModuleConf::Worley { .. } => apply_worley_conf(conf, acc),
                    _ => {
                        println!(
                            "Invalid configuration provided to Worley module: {:?}",
                            conf
                        );
                        acc
                    }
                });
                Box::new(configured_module)
            }
            &NoiseModuleType::OpenSimplex => {
                let configured_module =
                    confs
                        .iter()
                        .fold(OpenSimplex::new(), |acc, conf| match conf {
                            &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to OpenSimplex module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::Billow => {
                let configured_module = confs.iter().fold(Billow::new(), |acc, conf| match conf {
                    &NoiseModuleConf::MultiFractal { .. } => apply_multifractal_conf(conf, acc),
                    &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                    _ => {
                        println!(
                            "Invalid configuration provided to Billow module: {:?}",
                            conf
                        );
                        acc
                    }
                });
                Box::new(configured_module)
            }
            &NoiseModuleType::HybridMulti => {
                let configured_module =
                    confs
                        .iter()
                        .fold(HybridMulti::new(), |acc, conf| match conf {
                            &NoiseModuleConf::MultiFractal { .. } => {
                                apply_multifractal_conf(conf, acc)
                            }
                            &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to HybridMulti module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::SuperSimplex => {
                let configured_module =
                    confs
                        .iter()
                        .fold(SuperSimplex::new(), |acc, conf| match conf {
                            &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to SuperSimplex module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::Value => {
                let configured_module = confs.iter().fold(Value::new(), |acc, conf| match conf {
                    &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                    _ => {
                        println!("Invalid configuration provided to Value module: {:?}", conf);
                        acc
                    }
                });
                Box::new(configured_module)
            }
            &NoiseModuleType::RidgedMulti => {
                let configured_module =
                    confs
                        .iter()
                        .fold(RidgedMulti::new(), |acc, conf| match conf {
                            &NoiseModuleConf::MultiFractal { .. } => {
                                apply_multifractal_conf(conf, acc)
                            }
                            &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to RidgedMulti module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::BasicMulti => {
                let configured_module =
                    confs
                        .iter()
                        .fold(BasicMulti::new(), |acc, conf| match conf {
                            &NoiseModuleConf::MultiFractal { .. } => {
                                apply_multifractal_conf(conf, acc)
                            }
                            &NoiseModuleConf::Seedable { .. } => apply_seedable_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to BasicMulti module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::Constant => {
                let configured_module =
                    confs
                        .iter()
                        .fold(Constant::new(0.), |acc, conf| match conf {
                            &NoiseModuleConf::Constant { .. } => apply_constant_conf(conf, acc),
                            _ => {
                                println!(
                                    "Invalid configuration provided to Constant module: {:?}",
                                    conf
                                );
                                acc
                            }
                        });
                Box::new(configured_module)
            }
            &NoiseModuleType::Composed => panic!(
                "Attempted to build leaf module with type Composed!  That's only a placeholder."
            ),
        }
    }
}

/// This is the primary unit of the composition tree.
#[derive(Debug, Serialize, Deserialize)]
pub enum CompositionTreeNodeDefinition {
    Leaf {
        module_type: NoiseModuleType,
        module_conf: Vec<NoiseModuleConf>,
        transformations: Vec<InputTransformationDefinition>,
    },
    Composed {
        scheme: CompositionScheme,
        children: Vec<CompositionTreeNodeDefinition>,
        transformations: Vec<InputTransformationDefinition>,
    },
}

impl Into<CompositionTreeNode> for CompositionTreeNodeDefinition {
    fn into(self) -> CompositionTreeNode {
        let (transformations, function) = match self {
            CompositionTreeNodeDefinition::Leaf {
                module_type,
                module_conf,
                transformations,
            } => {
                // Build a noise module out of the type and configurations
                let built_module = module_type.construct_noise_fn(&module_conf);
                let built_transformations = build_transformations(transformations);

                (
                    built_transformations,
                    CompositionTreeNodeType::Leaf(built_module),
                )
            }
            CompositionTreeNodeDefinition::Composed {
                scheme,
                children,
                transformations,
            } => {
                // Build modules out of each of the children definitions, and combine them into a `CombinedModule`
                let built_children: Vec<CompositionTreeNode> = children
                    .into_iter()
                    .map(|child_def| child_def.into())
                    .collect();

                let built_transformations = build_transformations(transformations);
                let composed_module = ComposedNoiseModule {
                    composer: scheme,
                    children: built_children,
                };

                (
                    built_transformations,
                    CompositionTreeNodeType::Combined(composed_module),
                )
            }
        };

        CompositionTreeNode {
            function,
            transformations,
        }
    }
}

impl Into<CompositionTree> for CompositionTreeDefinition {
    /// Transforms the tree definition into a actual composition tree capable of producing values.
    fn into(self) -> CompositionTree {
        CompositionTree {
            global_conf: self.global_conf,
            root_node: self.root_node.into(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum InputTransformationDefinition {
    ZoomScale {
        speed: f64,
        zoom: f64,
    },
    HigherOrderNoiseModule {
        node_def: CompositionTreeNodeDefinition,
        replaced_dim: Dim,
    },
    ScaleAll(f64),
}

impl Into<InputTransformation> for InputTransformationDefinition {
    fn into(self) -> InputTransformation {
        match self {
            InputTransformationDefinition::ZoomScale { speed, zoom } => {
                InputTransformation::ZoomScale { speed, zoom }
            }
            InputTransformationDefinition::HigherOrderNoiseModule {
                node_def,
                replaced_dim,
            } => {
                let built_node: CompositionTreeNode = node_def.into();
                InputTransformation::HigherOrderNoiseModule {
                    node: built_node,
                    replaced_dim,
                }
            }
            InputTransformationDefinition::ScaleAll(scale) => InputTransformation::ScaleAll(scale),
        }
    }
}

impl TryFrom<IrNode> for InputTransformationDefinition {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        let transformation_type = find_setting_by_name("inputTransformationType", &node.settings)?;

        let def: InputTransformationDefinition = match transformation_type.as_str() {
            "zoomScale" => InputTransformationDefinition::ZoomScale {
                speed: convert_setting("speed", &node.settings)?,
                zoom: convert_setting("zoom", &node.settings)?,
            },
            "honf" => {
                let def_string = find_setting_by_name("inputTransformationType", &node.settings)?;
                let node_def: CompositionTreeNodeDefinition = match serde_json::from_str(
                    &def_string,
                ) {
                    Ok(d) => d,
                    Err(err) => {
                        return Err(format!("Unable to build `CompositionTreeNodeDefinition` from supplied string: {:?}", err));
                    }
                };

                InputTransformationDefinition::HigherOrderNoiseModule {
                    node_def,
                    replaced_dim: convert_setting("replacedDim", &node.settings)?,
                }
            }
            "scaleAll" => InputTransformationDefinition::ScaleAll(convert_setting(
                "scaleFactor",
                &node.settings,
            )?),
            _ => {
                return Err(format!(
                    "Invalid input transformation type provided: {}",
                    transformation_type
                ));
            }
        };

        Ok(def)
    }
}
