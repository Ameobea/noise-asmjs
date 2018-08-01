//! Defines the noise function composition tree which is used in both the WebAssembly version as well as the
//! headless server backend.

#![feature(const_fn, try_from)]

extern crate itertools;
#[macro_use]
extern crate lazy_static;
extern crate noise;
extern crate palette;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

use std::convert::TryFrom;
#[cfg(target_os = "emscripten")]
use std::ffi::CString;
use std::fmt::Debug;
#[cfg(target_os = "emscripten")]
use std::os::raw::c_char;
use std::str::FromStr;

use noise::*;

pub mod color_schemes;
use color_schemes::ColorFunction;
pub mod composition;
use self::composition::CompositionScheme;
pub mod conf;
use self::conf::NoiseModuleConf;
pub mod definition;
use self::definition::{
    CompositionTreeDefinition, CompositionTreeNodeDefinition, InputTransformationDefinition,
};
pub mod initial_tree;
pub mod ir;
use ir::IrNode;
pub mod transformations;
use self::transformations::{apply_transformations, InputTransformation};
pub mod util;

#[cfg(target_os = "emscripten")]
extern "C" {
    /// Direct line to `console.log` from JS since the simulated `stdout` is dead after `main()` completes
    pub fn js_debug(msg: *const c_char);
    /// Direct line to `console.error` from JS since the simulated `stdout` is dead after `main()` completes
    pub fn js_error(msg: *const c_char);
}

#[cfg(not(target_os = "emscripten"))]
pub fn error(msg: &str) {
    println!("{}", msg);
}

/// Wrapper around the JS debug function that accepts a Rust `&str`.
#[cfg(target_os = "emscripten")]
pub fn debug(msg: &str) {
    let c_str = CString::new(msg).unwrap();
    unsafe { js_debug(c_str.as_ptr()) };
}

#[cfg(not(target_os = "emscripten"))]
pub fn debug(msg: &str) {
    println!("{}", msg);
}

/// Wrapper around the JS error function that accepts a Rust `&str`.
#[cfg(target_os = "emscripten")]
pub fn error(msg: &str) {
    let c_str = CString::new(msg).unwrap();
    unsafe { js_error(c_str.as_ptr()) };
}

pub static mut ACTIVE_COLOR_FUNCTION: ColorFunction = ColorFunction::TieDye;

pub fn parse_setting<T, D: Debug>(val: &str) -> Result<T, String>
where
    T: FromStr<Err = D>,
{
    let res: Result<T, _> = val.parse();
    res.map_err(|err| format!("Unable to parse supplied value: {:?}", err))
}

/// Configuration status and state for the entire backend.
#[derive(Serialize, Deserialize)]
pub struct MasterConf {
    pub needs_resize: bool,
    pub canvas_size: usize,
    pub zoom: f64,
    pub speed: f64,
    pub x_offset: f64,
    pub y_offset: f64,
    pub z_offset: f64,
}

impl Default for MasterConf {
    fn default() -> Self {
        MasterConf {
            needs_resize: false,
            canvas_size: 0,
            speed: 0.008,
            zoom: 0.015,
            x_offset: 0.0,
            y_offset: 0.0,
            z_offset: 0.0,
        }
    }
}

impl TryFrom<IrNode> for MasterConf {
    type Error = String;

    fn try_from(node: IrNode) -> Result<Self, Self::Error> {
        let mut conf = MasterConf::default();
        // the actual settings are stored as `IrSetting`s, so iterate through those and construct a
        // new `MasterConf` struct using their values
        for setting in node.settings {
            let key = setting.key.as_str();
            match key {
                "speed" => conf.speed = parse_setting(&setting.value)?,
                "zoom" => conf.zoom = parse_setting(&setting.value)?,
                "colorFunction" => {
                    let color_function: ColorFunction =
                        match ColorFunction::from_str(setting.value.as_str()) {
                            Ok(cf) => cf,
                            Err(err) => {
                                return Err(err);
                            }
                        };

                    unsafe {
                        ACTIVE_COLOR_FUNCTION = color_function;
                    }
                }
                _ => {
                    return Err(format!(
                        "Unhandled setting provided to master conf: {}",
                        key
                    ))
                }
            }
        }

        Ok(conf)
    }
}

/// The core of the noise module composition framework.  This struct is the parent of the entire composition tree
/// And can be used to retrieve a value from the entire composition tree for a single coordinate.
pub struct CompositionTree {
    pub root_node: CompositionTreeNode,
    pub global_conf: MasterConf,
}

impl CompositionTree {
    /// Removes the child from the given coordinate of the tree, shifting all other sibling modules to the left.  If the
    /// removal of the module will cause issues with the composition scheme, that will have to be adjusted or rebuilt manually.
    pub fn delete_node(
        &mut self,
        depth: usize,
        coords: &[i32],
        index: usize,
    ) -> Result<(), String> {
        let target_parent: &mut CompositionTreeNode = self.root_node.traverse_mut(coords)?;

        match target_parent.function {
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                composed_module.remove_child(index)?
            }
            CompositionTreeNodeType::Leaf(_) => {
                return Err(format!(
                    "Attempted to remove child node from module at depth {} index {}, but it is a leaf node!",
                    depth,
                    coords.last().unwrap_or(&-1)
                ));
            }
        };

        Ok(())
    }

    pub fn add_node(
        &mut self,
        depth: usize,
        coords: &[i32],
        node: CompositionTreeNode,
        index: usize,
    ) -> Result<(), String> {
        let target_parent = self.root_node.traverse_mut(coords)?;

        match target_parent.function {
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                composed_module.add_child(index, node)
            }
            CompositionTreeNodeType::Leaf(_) => {
                return Err(format!(
                    "Attempted to add child node to module at depth {} index {}, but it is a leaf node!",
                    depth,
                    coords.last().unwrap_or(&-1)
                ));
            }
        };

        Ok(())
    }

    pub fn set_composition_scheme(
        &mut self,
        depth: usize,
        coords: &[i32],
        new_scheme: CompositionScheme,
    ) -> Result<(), String> {
        let target_node = self.root_node.traverse_mut(coords)?;

        match target_node.function {
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                composed_module.composer = new_scheme
            }
            CompositionTreeNodeType::Leaf(_) => {
                return Err(format!(
                    "Attempted to set composition scheme of node at depth {} index {} but it's a leaf node!",
                    depth,
                    coords.last().unwrap_or(&-1)
                ));
            }
        };

        Ok(())
    }
}

impl NoiseFn<Point3<f64>> for CompositionTree {
    fn get(&self, coord: Point3<f64>) -> f64 {
        self.root_node.get([
            (coord[0] * self.global_conf.zoom) + self.global_conf.x_offset,
            (coord[1] * self.global_conf.zoom) + self.global_conf.y_offset,
            (coord[2] * self.global_conf.speed) + self.global_conf.z_offset,
        ])
    }
}

pub struct CompositionTreeNode {
    pub function: CompositionTreeNodeType,
    pub transformations: Vec<InputTransformation>,
}

pub enum CompositionTreeNodeType {
    Leaf(Box<NoiseFn<Point3<f64>>>),
    Combined(ComposedNoiseModule),
}

impl CompositionTreeNode {
    /// Removes the child from the given coordinate of the tree, shifting all other sibling modules to the left.  If the
    /// removal of the module will cause issues with the composition scheme, that will have to be adjusted or rebuilt manually.
    pub fn remove_child(&mut self, index: usize) -> Result<(), String> {
        match self.function {
            CompositionTreeNodeType::Leaf(_) => {
                Err("Tried to remove child from module but it's a leaf node!".into())
            }
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                composed_module.remove_child(index)
            }
        }
    }

    pub fn add_child(&mut self, child: CompositionTreeNode, index: usize) -> Result<(), String> {
        match self.function {
            CompositionTreeNodeType::Leaf(_) => {
                Err("Tried to add child to module but it's a leaf node!".into())
            }
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                composed_module.add_child(index, child);
                Ok(())
            }
        }
    }

    /// Traverses the composition tree, returning a mutable reference to the node at the provided coordinates.
    pub fn traverse_mut(&mut self, coords: &[i32]) -> Result<&mut CompositionTreeNode, String> {
        if coords.len() == 0 {
            return Ok(self);
        }

        let index = *coords.first().unwrap() as usize;

        let child = match self.function {
            CompositionTreeNodeType::Combined(ref mut composed_module) => {
                let num_children = composed_module.children.len();
                match composed_module.children.get_mut(index) {
                    Some(child) => child,
                    None => {
                        return Err(format!(
                            "Attempted to access child of module at index {} but it only has {} children!",
                            index,
                            num_children
                        ));
                    }
                }
            }
            CompositionTreeNodeType::Leaf(_) => {
                return Err(format!(
                    "Attempted to access child of module at index {} but it is a leaf node!",
                    index
                ));
            }
        };

        if coords.len() == 1 {
            // This is the last setp of the traversal, so return the selected node
            Ok(child)
        } else {
            // We have to go deeper
            child.traverse_mut(&coords[1..])
        }
    }
}

impl NoiseFn<Point3<f64>> for CompositionTreeNode {
    fn get(&self, coord: Point3<f64>) -> f64 {
        let transformed_coord = apply_transformations(&self.transformations, coord);

        match self.function {
            CompositionTreeNodeType::Leaf(ref module) => module.get(transformed_coord),
            // TODO: apply input transformations unless I'm missing where they're actually applied.
            CompositionTreeNodeType::Combined(ref composed_module) => {
                composed_module.get(transformed_coord)
            }
        }
    }
}

/// A group of noise modules combined into a single output.  The contained `CompositionScheme` determines how the modules
/// inputs' are combined into one.  `ComposedNoiseModule`s can have other `ComposedNoiseModule`s as children through
/// `CompositionTreeNode`s, allowing for the composition tree to grow infinitely in both height and width.
pub struct ComposedNoiseModule {
    pub composer: CompositionScheme,
    pub children: Vec<CompositionTreeNode>,
}

impl ComposedNoiseModule {
    pub fn add_child(&mut self, index: usize, child: CompositionTreeNode) {
        let child_count = self.children.len();
        if child_count < index {
            return error(&format!(
                "Attempted to add noise module at index {} but our children length is {}.",
                index, child_count
            ));
        }

        self.children.insert(index, child)
    }

    pub fn remove_child(&mut self, index: usize) -> Result<(), String> {
        if self.children.len() > index {
            self.children.remove(index);
            Ok(())
        } else {
            Err(format!(
                "Attempted to remove child node from composed module at index {} but it only has {} children!",
                index,
                self.children.len()
            ))
        }
    }
}

impl NoiseFn<Point3<f64>> for ComposedNoiseModule {
    fn get(&self, coord: Point3<f64>) -> f64 {
        self.composer.compose(&self.children, coord)
    }
}
