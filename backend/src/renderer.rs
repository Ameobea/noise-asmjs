//! Composes the noise module definition provided by a user and generates a thumbnail image.

use std::convert::TryInto;
use std::fs::File;

use image::{ImageBuffer, ImageRgb8, Pixel, PNG, Rgb};
use libcomposition::{CompositionTree, CompositionTreeNode, MasterConf};
use libcomposition::color_schemes::ColorFunction;
use libcomposition::definition::CompositionTreeNodeDefinition;
use libcomposition::ir::IrNode;
use noise::NoiseFn;
use serde_json;
use tempfile::NamedTempFile;

use ameotrack::upload_image;

const IMAGE_SIZE: u32 = 400;
const Z: f64 = 225893.326;

/// Composes a noise module definition, generates a thumbnail image, uploads it to AmeoTrack,
/// and returns the resulting image URL.
pub fn create_thumbnail(def: &str) -> Result<String, String> {
    // attempt to parse the provided IR definition into an `IrNode`
    let root_node_def: CompositionTreeNodeDefinition = serde_json::from_str::<IrNode>(def)
        .map_err(|_| "Error while parsing the provided definition string!".to_string())?
        // and then convert that into a `CompositionTreeNodeDefinition`
        .try_into()?;

    // build the definition into a proper `CompositionTreeNode`.
    let root_node: CompositionTreeNode = root_node_def.into();

    // create a full `CompositionTree` from the root node and the global configuration
    let tree = CompositionTree {
        root_node,
        global_conf: MasterConf {
            canvas_size: IMAGE_SIZE as usize,
            needs_resize: false,
            speed: 1.,
            zoom: 1.,
            x_offset: 0.,
            y_offset: 0.,
            z_offset: 0.,
        },
    };

    // TODO: Figure out a way to get the actual coloration function
    let color_fn = ColorFunction::Oceanic;

    // use this tree node to populate a buffer with pixel data using the selected color function to
    // populate an image buffer with pixel data
    let img_buf = ImageBuffer::from_fn(IMAGE_SIZE, IMAGE_SIZE, |x, y| {
        let val: f64 = tree.get([x as f64, y as f64, Z]);
        let color = color_fn.colorize(val);
        Rgb::from_channels(color[0], color[1], color[2], 255u8)
    });

    // create a temporary file and write the image to it
    let mut tmpfile = NamedTempFile::new()
        .map_err(|_| "Unable to create temporary file!".to_string())?;

    ImageRgb8(img_buf).save(&mut tmpfile, PNG)
        .map_err(|_| String::from("Unable to write image data to temp file!"))?;

    // attempt upload the image to AmeoTrack and store the result
    upload_image(tmpfile)
}
