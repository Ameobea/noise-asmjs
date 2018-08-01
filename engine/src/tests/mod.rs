//! Tests for the backend.

use serde_json;

use composition_tree::composition::CompositionScheme;
use composition_tree::conf::{GlobalTreeConf, NoiseModuleConf};
use composition_tree::definition::{
    CompositionTreeDefinition, CompositionTreeNodeDefinition, InputTransformationDefinition,
    NoiseModuleType,
};
use composition_tree::{ComposedNoiseModule, CompositionTree};
use util::Dim;

#[test]
fn composition_tree_definition_serialization() {
    let def = CompositionTreeDefinition {
        global_conf: GlobalTreeConf {
            speed: 0.101,
            zoom: 0.1239,
        },
        root_node: CompositionTreeNodeDefinition::Composed {
            scheme: CompositionScheme::WeightedAverage(vec![0.2, 0.1, 0.7]),
            children: vec![
                CompositionTreeNodeDefinition::Leaf {
                    module_type: NoiseModuleType::Fbm,
                    transformations: vec![
                        InputTransformationDefinition::ZoomScale {
                            zoom: 1.021,
                            speed: 0.812,
                        },
                        InputTransformationDefinition::HigherOrderNoiseModule {
                            node_def: CompositionTreeNodeDefinition::Composed {
                                scheme: CompositionScheme::Average,
                                children: vec![CompositionTreeNodeDefinition::Leaf {
                                    module_type: NoiseModuleType::Billow,
                                    module_conf: vec![],
                                    transformations: vec![],
                                }],
                                transformations: Vec::new(),
                            },
                            replaced_dim: Dim::Z,
                        },
                    ],
                    module_conf: vec![NoiseModuleConf::MultiFractal {
                        frequency: 1.1,
                        lacunarity: 2.0,
                        octaves: 5,
                        persistence: 1.5,
                    }],
                },
                CompositionTreeNodeDefinition::Composed {
                    scheme: CompositionScheme::Average,
                    children: vec![CompositionTreeNodeDefinition::Leaf {
                        module_type: NoiseModuleType::RidgedMulti,
                        module_conf: vec![NoiseModuleConf::MultiFractal {
                            frequency: 1.1,
                            lacunarity: 2.0,
                            octaves: 5,
                            persistence: 1.5,
                        }],
                        transformations: vec![InputTransformationDefinition::ZoomScale {
                            zoom: 1.01,
                            speed: 0.2,
                        }],
                    }],
                    transformations: vec![InputTransformationDefinition::ScaleAll(0.97)],
                },
            ],
            transformations: vec![InputTransformationDefinition::ScaleAll(0.97)],
        },
    };

    let serialized_def = serde_json::to_string(&def).unwrap();
    println!("{}", serialized_def);
}

#[test]
fn composition_tree_definition_deserialization_and_building() {
    let serialized_def = r#"
        {"global_conf":{"speed":0.101,"zoom":0.1239},"root_node":{"Composed":{"scheme":{"WeightedAverage":
        [0.2,0.1,0.7]},"children":[{"Leaf":{"module_type":"Fbm","module_conf":[{"MultiFractal":{"octaves":
        5,"frequency":1.1,"lacunarity":2.0,"persistence":1.5}}],"transformations":[{"ZoomScale":{"speed":
        0.812,"zoom":1.021}},{"HigherOrderNoiseModule":{"node_def":{"Composed":{"scheme":"Average","children":
        [{"Leaf":{"module_type":"Billow","module_conf":[],"transformations":[]}}],"transformations":[]}},
        "replaced_dim":"Z"}}]}},{"Composed":{"scheme":"Average","children":[{"Leaf":{"module_type":
        "RidgedMulti","module_conf":[{"MultiFractal":{"octaves":5,"frequency":1.1,"lacunarity":2.0,
        "persistence":1.5}}],"transformations":[{"ZoomScale":{"speed":0.2,"zoom":1.01}}]}}],"transformations":
        [{"ScaleAll":0.97}]}}],"transformations":[{"ScaleAll":0.97}]}}}
    "#;

    let parsed_def: CompositionTreeDefinition = serde_json::from_str(serialized_def).unwrap();
    let parsed_tree: CompositionTree = parsed_def.into();
}
