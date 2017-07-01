use super::conf::NoiseModuleConf;
use super::{CompositionScheme, CompositionTree, NoiseModuleType};

/// Defines a meta-representation of a `CompositionTree` designed to be passed into the backend from the JS frontend.  It
/// contains all information necessary to construct a fully functional composition tree from scratch.
#[derive(Serialize, Deserialize)]
pub struct CompositionTreeDefinition {
    global_conf: CompositionTreeConf,
    root_node: CompositionTreeDefinitionNode,
}

#[derive(Serialize, Deserialize)]
pub struct CompositionTreeConf {
    speed: f32,
    zoom: f32,
}

#[derive(Serialize, Deserialize)]
pub enum CompositionTreeDefinitionNode {
    Leaf {
        module_type: NoiseModuleType,
        module_conf: NoiseModuleConf,
    },
    Composed {
        composition_scheme: CompositionScheme,
        children: Vec<CompositionTreeDefinitionNode>,
    }
}

impl CompositionTreeDefinition {
    /// Transforms the tree definition into a actual composition tree capable of producing values.
    pub fn build(self) -> CompositionTree {
        unimplemented!();
    }
}
