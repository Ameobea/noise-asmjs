//! Misc. helper functions and utilities used in multiple parts of the application.

use std::convert::{TryFrom, TryInto};

use composition_tree::conf::NoiseModuleConf;
use ir::{IrNode, IrSetting};

#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum Dim { X, Y, Z}

/// Attempts to locate a child node among the children of a node and convert it into an internal definition.
pub fn build_child<T>(children: &[IrNode], child_type: &str) -> Result<T, T::Error> where T: TryFrom<IrNode>, T::Error: From<String> {
    children.iter()
        .find(|child| child._type == child_type)
        .map_or(
            Err(format!("No child of type `\"{}\" found for node !", child_type).into()),
            |child| child.clone().try_into()
        )
}

/// Searches through a slice of `IrSetting`s provided to a node and attempts to find the setting with the supplied name.
pub fn find_setting_by_name(name: &str, settings: &[IrSetting]) -> Result<String, String> {
    Ok(
        settings.iter()
        .find(|&&IrSetting { ref key, .. }| key == name)
        .ok_or(String::from("No `moduleType` setting provided to node of type `noiseModule`!"))?
        .value
        .clone()
    )
}

/// Converts the array of settings provided to a noise module into an array of `NoiseModuleConf`s that can be used to
/// configure the noise module.
pub fn build_noise_module_settings(settings: Vec<IrSetting>) -> Result<Vec<NoiseModuleConf>, String> {
    // TODO: Set up some internal state for keeping track of which type of module we are, build up internal
    // vectors of values for each of the different setting types, and then try to put them together at the end.
    unimplemented!(); // TODO
}
