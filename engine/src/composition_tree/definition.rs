//! Defines a meta-format that can be used to represent composition trees in a serialize-able/dematerialize-able manner.

use noise::*;

use transformations::InputTransformation;
use util::Dim;
use super::composition::CompositionScheme;
use super::conf::NoiseModuleConf;
use super::{ComposedNoiseModule, CompositionTree, CompositionTreeNode, GlobalTreeConf};

/// Defines a meta-representation of a `CompositionTree` designed to be passed into the backend from the JS frontend.  It
/// contains all information necessary to construct a fully functional composition tree from scratch.
#[derive(Serialize, Deserialize)]
pub struct CompositionTreeDefinition {
    pub global_conf: GlobalTreeConf,
    pub root_node: CompositionTreeNodeDefinition,
}

/// Includes every possible type of noise module available through the tool.
#[derive(Serialize, Deserialize)]
pub enum NoiseModuleType {
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

pub struct TransformedNoiseModule {
    inner: Box<NoiseFn<Point3<f64>>>,
    transformations: Vec<InputTransformation>,
}

impl NoiseFn<Point3<f64>> for TransformedNoiseModule {
    fn get(&self, coord: Point3<f64>) -> f64 {
        // apply all transformations to the input in order, passing the final value to the inner noise function
        let final_coord: Point3<f64> = self.transformations
            .iter()
            .fold(coord, |acc, transformation| transformation.transform(acc));

        self.inner.get(final_coord)
    }
}

impl NoiseModuleType {
    /// Given a module type and an array of configuration, builds the noise module.
    pub fn build(
        &self, conf: &[NoiseModuleConf], transformation_definitions: Vec<InputTransformationDefinition>
    ) -> Box<NoiseFn<Point3<f64>>> {
        unimplemented!(); // TODO
        let inner = match self {
            &NoiseModuleType::Fbm => Box::new(Fbm::new()) as Box<NoiseFn<Point3<f64>>>,
            &NoiseModuleType::Worley => Box::new(Worley::new()),
            &NoiseModuleType::OpenSimplex => Box::new(OpenSimplex::new()),
            &NoiseModuleType::Billow => Box::new(Billow::new()),
            &NoiseModuleType::HybridMulti => Box::new(HybridMulti::new()),
            &NoiseModuleType::SuperSimplex => Box::new(SuperSimplex::new()),
            &NoiseModuleType::Value => Box::new(Value::new()),
            &NoiseModuleType::RidgedMulti => Box::new(RidgedMulti::new()),
            &NoiseModuleType::BasicMulti => Box::new(BasicMulti::new()),
            &NoiseModuleType::Constant => Box::new(Constant::new(0.0)),
        };

        // If we have transformations to apply, create a `TransformedNoiseModule`; otherwise just return the inner module.
        if transformation_definitions.len() != 0 {
            let built_transformations: Vec<InputTransformation> = transformation_definitions
                .into_iter()
                .map(|def| def.into())
                .collect();

            let transformed_module = TransformedNoiseModule { inner, transformations: built_transformations };
            Box::new(transformed_module)
        } else {
            inner
        }
    }
}

/// This is the primary unit of the composition tree.
#[derive(Serialize, Deserialize)]
pub enum CompositionTreeNodeDefinition {
    Leaf {
        module_type: NoiseModuleType,
        module_conf: Vec<NoiseModuleConf>,
        transformations: Vec<InputTransformationDefinition>,
    },
    Composed {
        scheme: CompositionScheme,
        children: Vec<CompositionTreeNodeDefinition>,
    }
}

impl Into<CompositionTreeNode> for CompositionTreeNodeDefinition {
    fn into(self) -> CompositionTreeNode {
        match self {
            CompositionTreeNodeDefinition::Leaf { module_type, module_conf, transformations } => {
                // Build a noise module out of the type and configurations
                let built_module = module_type.build(&module_conf, transformations);
                CompositionTreeNode::Leaf(built_module)
            },
            CompositionTreeNodeDefinition::Composed { scheme, children } => {
                // Build modules out of each of the children definitions, and combine them into a `CombinedModule`
                let built_children: Vec<CompositionTreeNode> = children
                    .into_iter()
                    .map(|child_def| { child_def.into() })
                    .collect();

                CompositionTreeNode::Combined(ComposedNoiseModule { composer: scheme, children: built_children })
            }
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

#[derive(Serialize, Deserialize)]
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
            InputTransformationDefinition::ZoomScale { speed, zoom } => InputTransformation::ZoomScale { speed, zoom },
            InputTransformationDefinition::HigherOrderNoiseModule { node_def, replaced_dim } => {
                let built_node: CompositionTreeNode = node_def.into();
                InputTransformation::HigherOrderNoiseModule {
                    node: built_node,
                    replaced_dim,
                }
            },
            InputTransformationDefinition::ScaleAll(scale) => InputTransformation::ScaleAll(scale),
        }
    }
}
