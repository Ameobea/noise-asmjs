//! Defines a meta-format that can be used to represent composition trees in a serialize-able/dematerialize-able manner.

use noise::*;

use super::composition::CompositionScheme;
use super::conf::NoiseModuleConf;
use super::{ComposedNoiseModule, CompositionTree, CompositionTreeNode, GlobalTreeConf};

/// Defines a meta-representation of a `CompositionTree` designed to be passed into the backend from the JS frontend.  It
/// contains all information necessary to construct a fully functional composition tree from scratch.
#[derive(Serialize, Deserialize)]
pub struct CompositionTreeDefinition {
    global_conf: GlobalTreeConf,
    root_node: CompositionTreeDefinitionNode,
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

impl NoiseModuleType {
    /// Given a module type and an array of configuration, builds the noise module.
    pub fn build(&self, conf: &[NoiseModuleConf]) -> Box<NoiseModule<Point3<f32>, f32>> {
        unimplemented!(); // TODO
        match self {
            &NoiseModuleType::Fbm => Box::new(Fbm::new()),
            &NoiseModuleType::Worley => Box::new(Worley::new()),
            &NoiseModuleType::OpenSimplex => Box::new(OpenSimplex::new()),
            &NoiseModuleType::Billow => Box::new(Billow::new()),
            &NoiseModuleType::HybridMulti => Box::new(HybridMulti::new()),
            &NoiseModuleType::SuperSimplex => Box::new(SuperSimplex::new()),
            &NoiseModuleType::Value => Box::new(Value::new()),
            &NoiseModuleType::RidgedMulti => Box::new(RidgedMulti::new()),
            &NoiseModuleType::BasicMulti => Box::new(BasicMulti::new()),
            &NoiseModuleType::Constant => Box::new(Constant::new(0.0)),
        }
    }
}

/// This is the primary unit of the composition tree.
#[derive(Serialize, Deserialize)]
pub enum CompositionTreeDefinitionNode {
    Leaf {
        module_type: NoiseModuleType,
        module_conf: Vec<NoiseModuleConf>,
    },
    Composed {
        scheme: CompositionScheme,
        children: Vec<CompositionTreeDefinitionNode>,
    }
}

impl Into<CompositionTreeNode> for CompositionTreeDefinitionNode {
    fn into(self) -> CompositionTreeNode {
        match self {
            CompositionTreeDefinitionNode::Leaf { module_type, module_conf } => {
                // Build a noise module out of the type and configurations
                let built_module = module_type.build(&module_conf);
                CompositionTreeNode::Leaf(built_module)
            },
            CompositionTreeDefinitionNode::Composed { scheme, children } => {
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
