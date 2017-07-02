//! Tests for the backend.

use serde_json;

use composition_tree::{CompositionTree, ComposedNoiseModule};
use composition_tree::composition::CompositionScheme;
use composition_tree::conf::{GlobalTreeConf, NoiseModuleConf};
use composition_tree::definition::{CompositionTreeDefinition, CompositionTreeNodeDefinition, NoiseModuleType};

#[test]
fn composition_tree_definition_serialization() {
    let def = CompositionTreeDefinition {
        global_conf: GlobalTreeConf {
            canvas_size: 800,
            speed: 0.101,
            zoom: 0.1239,
        },
        root_node: CompositionTreeNodeDefinition::Composed {
            scheme: CompositionScheme::WeightedAverage(vec![0.2, 0.1, 0.7]),
            children: vec![
                CompositionTreeNodeDefinition::Leaf {
                    module_type: NoiseModuleType::Fbm,
                    module_conf: vec![
                        NoiseModuleConf::NoiseModule {speed: 0.101, zoom: 0.1239},
                        NoiseModuleConf::MultiFractal {
                            frequency: 1.1,
                            lacunarity: 2.0,
                            octaves: 5,
                            persistence: 1.5,
                        },
                    ],
                },
                CompositionTreeNodeDefinition::Composed {
                    scheme: CompositionScheme::Average,
                    children: vec![
                        CompositionTreeNodeDefinition::Leaf {
                            module_type: NoiseModuleType::RidgedMulti,
                            module_conf: vec![
                                NoiseModuleConf::NoiseModule {speed: 0.101, zoom: 0.1239},
                                NoiseModuleConf::MultiFractal {
                                    frequency: 1.1,
                                    lacunarity: 2.0,
                                    octaves: 5,
                                    persistence: 1.5,
                                },
                            ],
                        }
                    ],
                },
            ],
        }
    };

    let serialized_def = serde_json::to_string(&def).unwrap();
    println!("{}", serialized_def);
}

#[test]
fn composition_tree_definition_deserialization_and_building() {
    let serialized_def = r#"
        {"global_conf":{"speed":0.101,"zoom":0.123899996,"canvas_size":800},"root_node":{"Composed":{"scheme":
        {"WeightedAverage":[0.2,0.1,0.7]},"children":[{"Leaf":{"module_type":"Fbm","module_conf":[{"NoiseModule":
        {"zoom":0.123899996,"speed":0.101}},{"MultiFractal":{"octaves":5,"frequency":1.1,"lacunarity":2.0,
        "persistence":1.5}}]}},{"Composed":{"scheme":"Average","children":[{"Leaf":{"module_type":"RidgedMulti",
        "module_conf":[{"NoiseModule":{"zoom":0.123899996,"speed":0.101}},{"MultiFractal":{"octaves":5,
        "frequency":1.1,"lacunarity":2.0,"persistence":1.5}}]}}]}}]}}}
    "#;

    let parsed_def: CompositionTreeDefinition = serde_json::from_str(serialized_def).unwrap();
    let parsed_tree: CompositionTree = parsed_def.into();
}
