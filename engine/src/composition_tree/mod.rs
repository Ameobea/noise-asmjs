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
    pub fn delete_node(&mut self, depth: usize, coords: &[i32], index: usize) -> Result<(), String> {
        let target_parent = self.root_node.traverse_mut(coords)?;

        match target_parent {
            &mut CompositionTreeNode::Combined(ref mut composed_module) => composed_module.remove_child(index)?,
            &mut CompositionTreeNode::Leaf(_) => {
                return Err(format!(
                    "Attempted to remove child node from module at depth {} index {}, but it is a leaf node!",
                    depth,
                    coords.last().unwrap()
                ));
            },
        };

        Ok(())
    }

    pub fn add_node(&mut self, depth: usize, coords: &[i32], node: CompositionTreeNode, index: usize) -> Result<(), String> {
        let target_parent = self.root_node.traverse_mut(coords)?;

        match target_parent {
            &mut CompositionTreeNode::Combined(ref mut composed_module) => composed_module.add_child(index, node),
            &mut CompositionTreeNode::Leaf(_) => {
                return Err(format!(
                    "Attempted to add child node to module at depth {} index {}, but it is a leaf node!",
                    depth,
                    coords.last().unwrap()
                ));
            },
        };

        Ok(())
    }

    pub fn set_composition_scheme(&mut self, depth: usize, coords: &[i32], new_scheme: CompositionScheme) -> Result<(), String> {
        let target_node = self.root_node.traverse_mut(coords)?;

        match target_node {
            &mut CompositionTreeNode::Combined(ref mut composed_module) => composed_module.composer = new_scheme,
            &mut CompositionTreeNode::Leaf(_) => {
                return Err(format!(
                    "Attempted to set composition scheme of node at depth {} index {} but it's a leaf node!",
                    depth,
                    coords.last().unwrap()
                ));

            },
        };

        Ok(())
    }
}

impl NoiseModule<Point3<f32>, f32> for CompositionTree {
    fn get(&self, coord: Point3<f32>) -> f32 { self.root_node.get(coord) }
}

pub enum CompositionTreeNode {
    Leaf(Box<NoiseModule<Point3<f32>, f32>>),
    Combined(ComposedNoiseModule),
}

impl CompositionTreeNode {
    /// Removes the child from the given coordinate of the tree, shifting all other sibling modules to the left.  If the
    /// removal of the module will cause issues with the composition scheme, that will have to be adjusted or rebuilt manually.
    pub fn remove_child(&mut self, index: usize) -> Result<(), String> {
        match self {
            &mut CompositionTreeNode::Leaf(_) => Err("Tried to remove child from module but it's a leaf node!".into()),
            &mut CompositionTreeNode::Combined(ref mut composed_module) => composed_module.remove_child(index),
        }
    }

    pub fn add_child(&mut self, child: CompositionTreeNode, index: usize) -> Result<(), String> {
        match self {
            &mut CompositionTreeNode::Leaf(_) => Err("Tried to add child to module but it's a leaf node!".into()),
            &mut CompositionTreeNode::Combined(ref mut composed_module) => {
                composed_module.add_child(index, child);
                Ok(())
            }
        }
    }

    /// Traverses the composition tree, returning a mutable reference to the node at the provided coordinates.
    pub fn traverse_mut(&mut self, coords: &[i32]) -> Result<&mut CompositionTreeNode, String> {
        let index = *coords.first().unwrap() as usize;

        let child = match self {
            &mut CompositionTreeNode::Combined(ref mut composed_module) => {
                let num_children = composed_module.children.len();
                match composed_module.children.get_mut(index) {
                    Some(child) => child,
                    None => {
                        return Err(format!(
                            "Attempted to access child of module at index {} but it only has {} children!",
                            index,
                            num_children
                        ));
                    },
                }
            },
            &mut CompositionTreeNode::Leaf(_) => {
                return Err(format!("Attempted to access child of module at index {} but it is a leaf node!", index));
            },
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

impl ComposedNoiseModule {
    pub fn add_child(&mut self, index: usize, child: CompositionTreeNode) {
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

impl NoiseModule<Point3<f32>, f32> for ComposedNoiseModule {
    fn get(&self, coord: Point3<f32>) -> f32 { self.composer.compose(&self.children, coord) }
}
