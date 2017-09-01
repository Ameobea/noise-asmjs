//! Composes the noise module definition provided by a user and generates a thumbnail image.

use std::convert::TryInto;
use std::env::temp_dir;
use std::fs::{File, remove_file};
use std::str::FromStr;

use image::{ImageBuffer, ImageRgb8, Pixel, PNG, Rgb};
use libcomposition::{CompositionTree, CompositionTreeNode, MasterConf};
use libcomposition::color_schemes::ColorFunction;
use libcomposition::definition::CompositionTreeNodeDefinition;
use libcomposition::ir::IrNode;
use libcomposition::util::find_setting_by_name;
use noise::NoiseFn;
use pcg::PcgRng;
use rand::{Rng, thread_rng};
use serde_json;
use uuid::Uuid;

use ameotrack::upload_image;

const IMAGE_SIZE: u32 = 400;

/// Composes a noise module definition, generates a thumbnail image, uploads it to AmeoTrack,
/// and returns the resulting image URL.
pub fn create_thumbnail(def: &str) -> Result<String, String> {
    // attempt to parse the provided IR definition into an `IrNode`
    let ir_root_node_def: IrNode = serde_json::from_str::<IrNode>(def)
        .map_err(|_| "Error while parsing the provided definition string!".to_string())?;

    // find the global conf node in the IR tree and build it into a `MasterConf`.
    // also pull off the color scheme string and buid it into a `ColorScheme`.
    let (global_conf, color_fn): (MasterConf, ColorFunction) = {
        let ir_global_conf = ir_root_node_def.children
            .iter()
            .find(|node| node._type.as_str() == "globalConf")
            .ok_or(String::from("Supplied definition string doesn't contain a `globalConf` node!"))?;
        let global_conf = ir_global_conf.clone()
            .try_into()
            .map_err(|err| format!("Unable to convert IR global conf into `GlobalConf`: {}", err))?;
        let color_fn_string = find_setting_by_name("colorFunction", &ir_global_conf.settings)
            .map_err(|_| String::from("No `colorFunction` setting included in provided `globalConf` node!"))?;
        let color_fn = ColorFunction::from_str(&color_fn_string)?;

        (global_conf, color_fn)
    };

    // and then convert that into a `CompositionTreeNodeDefinition`
    let root_node_def: CompositionTreeNodeDefinition = ir_root_node_def.try_into()?;

    // build the definition into a proper `CompositionTreeNode`.
    let root_node: CompositionTreeNode = root_node_def.into();

    // create a full `CompositionTree` from the root node and the global configuration
    let tree = CompositionTree { root_node, global_conf };

    // generate a random `z` value
    let mut rng = PcgRng::new_unseeded();
    rng.set_stream(thread_rng().gen());
    let z = rng.gen_range(0.0f64, 1000000f64);

    // use this tree node to populate a buffer with pixel data using the selected color function to
    // populate an image buffer with pixel data
    let img_buf = ImageBuffer::from_fn(IMAGE_SIZE, IMAGE_SIZE, |x, y| {
        let val: f64 = tree.get([x as f64, y as f64, z]);
        let color = color_fn.colorize(val);
        Rgb::from_channels(color[0], color[1], color[2], 255u8)
    });

    // create a temporary file and write the image to it
    let filename = Uuid::new_v4().to_string();
    let mut tmpfile_pathbuf = temp_dir();
    tmpfile_pathbuf.push(filename);
    tmpfile_pathbuf.set_extension("png");
    let tmpfile_path = tmpfile_pathbuf.as_path();

    let res = {
        let mut tmpfile: File = File::create(tmpfile_path)
            .map_err(|_| format!("Unable to create temporary file at path {:?}!", tmpfile_path))?;
        println!("Generated temporary file at {:?}", tmpfile_path);

        ImageRgb8(img_buf).save(&mut tmpfile, PNG)
            .map_err(|_| String::from("Unable to write image data to temp file!"))?;

        // attempt upload the image to AmeoTrack and store the result
        upload_image(&tmpfile_path)
    };

    // delete the tempfile
    remove_file(tmpfile_path).map_err(|_| format!("Unable to delete tempfile at {:?}!", tmpfile_path))?;

    res
}
