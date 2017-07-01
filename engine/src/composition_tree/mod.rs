//! Defines the primary structure used to nest noise modules and build up a composition tree that sets up
//! how the modules are related.

use std::os::raw::c_void;

use noise::*;

pub mod composition;
use self::composition::CompositionScheme;
pub mod conf;
use self::conf::NoiseModuleConf;
pub mod definition;
use self::definition::CompositionTreeDefinition;

/// Configuration that applies to the entire composition tree.
#[derive(Serialize, Deserialize)]
pub struct GlobalTreeConf {
    speed: f32,
    zoom: f32,
    canvas_size: u32,
}

/// The core of the noise module composition framework.  This struct is the parent of the entire composition tree
/// And can be used to retrieve a value from the entire composition tree for a single coordinate.
pub struct CompositionTree {
    root_node: CompositionTreeNode,
    global_conf: GlobalTreeConf,
}

impl CompositionTree {
    /// Removes the child from the given coordinate of the tree, shifting all other sibling modules to the left.  If the
    /// removal of the module will cause issues with the composition scheme, that will have to be adjusted or rebuilt manually.
    fn remove_child(&mut self, depth: u32, index: u32) -> Result<(), String> {
        unimplemented!();
    }
}

impl NoiseModule<Point3<f32>, f32> for CompositionTree {
    fn get(&self, coord: Point3<f32>) -> f32 {
        unimplemented!();
    }
}

pub enum CompositionTreeNode {
    Leaf(Box<NoiseModule<Point3<f32>, f32>>),
    Combined(ComposedNoiseModule),
}

impl CompositionTreeNode {
    /// Removes the child from the given coordinate of the tree, shifting all other sibling modules to the left.  If the
    /// removal of the module will cause issues with the composition scheme, that will have to be adjusted or rebuilt manually.
    fn remove_child(&mut self, depth: u32, index: u32) -> Result<(), String> {
        match self {
            &mut CompositionTreeNode::Leaf(_) => Err(
                format!("Tried to remove child from module at depth {} index {} but it's a leaf node!", depth, index)
            ),
            &mut CompositionTreeNode::Combined(ref composed_module) => {
                unimplemented!(); // TODO
            }
        }
    }
}

impl NoiseModule<Point3<f32>, f32> for CompositionTreeNode {
    fn get(&self, coord: Point3<f32>) -> f32 {
        match self {
            &CompositionTreeNode::Leaf(ref module) => module.get(coord),
            &CompositionTreeNode::Combined(ref combined_module) => combined_module.get(coord),
        }
    }
}

/// A group of noise modules combined into a single output.  The contained `CompositionScheme` determines how the modules
/// inputs' are combined into one.  `ComposedNoiseModule`s can have other `ComposedNoiseModule`s as children through
/// `CompositionTreeNode`s, allowing for the composition tree to grow infinitely in both height and width.
pub struct ComposedNoiseModule {
    composer: CompositionScheme,
    children: Vec<CompositionTreeNode>,
}

impl NoiseModule<Point3<f32>, f32> for ComposedNoiseModule {
    fn get(&self, coord: Point3<f32>) -> f32 {
        unimplemented!();
    }
}
