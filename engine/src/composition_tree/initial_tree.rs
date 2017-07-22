//! Defines the structure of the initial composition tree that is loaded at application initialization.

use composition_tree::{CompositionTree, GlobalTreeConf, NoiseModuleType};
use super::{CompositionScheme, CompositionTreeDefinition, CompositionTreeNodeDefinition, InputTransformationDefinition, NoiseModuleConf};

fn create_initial_tree_definition() -> CompositionTreeDefinition {
    CompositionTreeDefinition {
        global_conf: GlobalTreeConf {
            speed: 1.,
            zoom: 1.,
        },
        root_node: CompositionTreeNodeDefinition::Composed {
            scheme: CompositionScheme::Average,
            children: vec![
                CompositionTreeNodeDefinition::Leaf {
                    module_type: NoiseModuleType::Fbm,
                    module_conf: vec![
                        NoiseModuleConf::Seedable {
                            seed: 1658355505 // "cXEL5v9dTsCgCnkgdd43XWZS6Q9c44AD"
                        },
                        NoiseModuleConf::MultiFractal {
                            octaves: 6,
                            frequency: 1.,
                            lacunarity: 2.,
                            persistence: 0.5,
                        },
                    ],
                    transformations: Vec::new(),
                },
                CompositionTreeNodeDefinition::Leaf {
                    module_type: NoiseModuleType::Billow,
                    module_conf: vec![
                        NoiseModuleConf::Seedable {
                            seed: 1658355505 // "cXEL5v9dTsCgCnkgdd43XWZS6Q9c44AD"
                        },
                        NoiseModuleConf::MultiFractal {
                            octaves: 6,
                            frequency: 1.,
                            lacunarity: 2.,
                            persistence: 0.5,
                        },
                    ],
                    transformations: Vec::new(),
                },
            ],
            transformations: vec![
                InputTransformationDefinition::ZoomScale {
                    speed: 1.,
                    zoom: 1.1,
                },
            ],
        },
    }
}

pub fn create_initial_tree() -> CompositionTree {
    create_initial_tree_definition().into()
}
