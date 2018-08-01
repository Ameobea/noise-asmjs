//! Misc. helper functions and utilities used in multiple parts of the application.

use std::collections::HashMap;
use std::convert::{TryFrom, TryInto};
use std::str::FromStr;

use itertools::Itertools;
use serde_json;

use super::{CompositionTree, CompositionTreeNode, CompositionTreeNodeDefinition, MasterConf};
use color_schemes::ColorFunction;
use conf::{map_setting_to_type, NoiseModuleConf, SettingType};
use ir::{IrNode, IrSetting};

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum Dim {
    X,
    Y,
    Z,
}

impl FromStr for Dim {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "X" | "x" => Ok(Dim::X),
            "Y" | "y" => Ok(Dim::Y),
            "Z" | "z" => Ok(Dim::Z),
            _ => Err(format!("Can't convert supplied string to `Dim`: {}", s)),
        }
    }
}

/// Attempts to locate a child node among the children of a node and convert it into an internal definition.
pub fn build_child<T>(children: &[IrNode], child_type: &str) -> Result<T, T::Error>
where
    T: TryFrom<IrNode>,
    T::Error: From<String>,
{
    children
        .iter()
        .find(|child| child._type == child_type)
        .map_or(
            Err(format!("No child of type `\"{}\" found for node !", child_type).into()),
            |child| child.clone().try_into(),
        )
}

/// Searches through a slice of `IrSetting`s provided to a node and attempts to find the setting with the supplied name.
pub fn find_setting_by_name(name: &str, settings: &[IrSetting]) -> Result<String, String> {
    Ok(settings
        .iter()
        .find(|&&IrSetting { ref key, .. }| key == name)
        .ok_or(String::from(
            "No `moduleType` setting provided to node of type `noiseModule`!",
        ))?.value
        .clone())
}

/// Attempts to find the setting with the supplied key in the settings slice and parse its value into a `T`.
pub fn convert_setting<T>(key: &str, settings: &[IrSetting]) -> Result<T, String>
where
    T: FromStr,
{
    let raw_val = find_setting_by_name(key, &settings)?;
    raw_val
        .parse()
        .map_err(|_| format!("Unable to convert value from string: {}", raw_val))
}

fn build_noise_module_conf(
    setting_type: SettingType,
    settings: &[IrSetting],
) -> Result<NoiseModuleConf, String> {
    Ok(match setting_type {
        SettingType::MultiFractal => NoiseModuleConf::MultiFractal {
            frequency: convert_setting("frequency", settings)?,
            octaves: convert_setting("octaves", settings)?,
            lacunarity: convert_setting("lacunarity", settings)?,
            persistence: convert_setting("persistence", settings)?,
        },
        SettingType::Seedable => NoiseModuleConf::Seedable {
            seed: convert_setting("seed", settings)?,
        },
        SettingType::Worley => NoiseModuleConf::Worley {
            displacement: convert_setting("displacement", settings)?,
            range_function: convert_setting("rangeFunction", settings)?,
            range_function_enabled: convert_setting("enableRange", settings)?,
            worley_frequency: convert_setting("worleyFrequency", settings)?,
        },
        SettingType::Constant => NoiseModuleConf::Constant {
            constant: convert_setting("constant", settings)?,
        },
        SettingType::RidgedMulti => NoiseModuleConf::RidgedMulti {
            attenuation: convert_setting("attenuation", settings)?,
        },
        SettingType::MasterConf => NoiseModuleConf::MasterConf {
            speed: convert_setting("speed", settings)?,
            zoom: convert_setting("zoom", settings)?,
        },
    })
}

/// Converts the array of settings provided to a noise module into an array of `NoiseModuleConf`s that can be used to
/// configure the noise module.
pub fn build_noise_module_settings(
    settings: Vec<IrSetting>,
) -> Result<Vec<NoiseModuleConf>, String> {
    // collection to hold partially matched settings as we iterate through the list.
    let mut matched_settings: HashMap<SettingType, Vec<IrSetting>> = HashMap::new();

    // loop through the settings and group together those that are of the same type
    for setting in settings {
        let setting_type: SettingType = match map_setting_to_type(&setting.key) {
            Err(Some(err)) => return Err(err),
            Err(None) => {
                continue;
            }
            Ok(setting_type) => setting_type,
        };
        // create a new entry if no entry exists or add to existing list if one does
        matched_settings
            .entry(setting_type)
            .or_insert(Vec::with_capacity(1))
            .push(setting);
    }

    // map the `HashMap`'s values into `NoiseModuleConf`s
    let setting_count = matched_settings.len();
    matched_settings
        .into_iter()
        .map(|(setting_type, settings)| build_noise_module_conf(setting_type, &settings))
        .fold_results(Vec::with_capacity(setting_count), |mut acc, item| {
            acc.push(item);
            acc
        })
}

/// Given a definition string, produces an entirely new composition tree from scratch.
pub fn build_tree_from_def(def: &str) -> Result<(ColorFunction, CompositionTree), String> {
    // attempt to parse the provided IR definition into an `IrNode`
    let ir_root_node_def: IrNode = serde_json::from_str::<IrNode>(def)
        .map_err(|_| "Error while parsing the provided definition string!".to_string())?;

    // find the global conf node in the IR tree and build it into a `MasterConf`.
    // also pull off the color scheme string and buid it into a `ColorScheme`.
    let (global_conf, color_fn): (MasterConf, ColorFunction) = {
        let ir_global_conf = ir_root_node_def
            .children
            .iter()
            .find(|node| node._type.as_str() == "globalConf")
            .ok_or(String::from(
                "Supplied definition string doesn't contain a `globalConf` node!",
            ))?;
        let global_conf = ir_global_conf.clone().try_into().map_err(|err| {
            format!(
                "Unable to convert IR global conf into `GlobalConf`: {}",
                err
            )
        })?;
        let color_fn_string = find_setting_by_name("colorFunction", &ir_global_conf.settings)
            .map_err(|_| {
                String::from("No `colorFunction` setting included in provided `globalConf` node!")
            })?;
        let color_fn = ColorFunction::from_str(&color_fn_string)?;

        (global_conf, color_fn)
    };

    // and then convert that into a `CompositionTreeNodeDefinition`
    let root_node_def: CompositionTreeNodeDefinition = ir_root_node_def.try_into()?;

    // build the definition into a proper `CompositionTreeNode`.
    let root_node: CompositionTreeNode = root_node_def.into();

    // create the full `CompositionTree` from the root node and the global configuration
    Ok((
        color_fn,
        CompositionTree {
            root_node,
            global_conf,
        },
    ))
}
