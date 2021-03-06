//! Composes the noise module definition provided by a user and generates a thumbnail image.

use std::env::temp_dir;
use std::fs::{remove_file, File};

use image::{ImageBuffer, ImageRgb8, Pixel, Rgb, PNG};
use libcomposition::color_schemes::ColorFunction;
use libcomposition::util::build_tree_from_def;
use libcomposition::CompositionTree;
use noise::NoiseFn;
use uuid::Uuid;

use ameotrack::upload_image;

const IMAGE_SIZE: u32 = 400;

/// Composes a noise module definition, generates a thumbnail image, uploads it to AmeoTrack,
/// and returns the resulting image URL.
pub fn create_thumbnail(def: &str) -> Result<String, String> {
    // create a `CompositionTree` from the provided definition string
    let (color_fn, tree): (ColorFunction, CompositionTree) = build_tree_from_def(def)?;

    // use this tree node to populate a buffer with pixel data using the selected color function to
    // populate an image buffer with pixel data
    let img_buf = ImageBuffer::from_fn(IMAGE_SIZE, IMAGE_SIZE, |x, y| {
        let val: f64 = tree.get([x as f64, y as f64, 0.0]);
        let color = color_fn.colorize(val as f32);
        Rgb::from_channels(color[0], color[1], color[2], 255u8)
    });

    // create a temporary file and write the image to it
    let filename = Uuid::new_v4().to_string();
    let mut tmpfile_pathbuf = temp_dir();
    tmpfile_pathbuf.push(filename);
    tmpfile_pathbuf.set_extension("png");
    let tmpfile_path = tmpfile_pathbuf.as_path();

    let res = {
        let mut tmpfile: File = File::create(tmpfile_path).map_err(|_| {
            format!(
                "Unable to create temporary file at path {:?}!",
                tmpfile_path
            )
        })?;
        println!("Generated temporary file at {:?}", tmpfile_path);

        ImageRgb8(img_buf)
            .save(&mut tmpfile, PNG)
            .map_err(|_| String::from("Unable to write image data to temp file!"))?;

        // attempt upload the image to AmeoTrack and store the result
        upload_image(&tmpfile_path)
    };

    // delete the tempfile
    remove_file(tmpfile_path)
        .map_err(|_| format!("Unable to delete tempfile at {:?}!", tmpfile_path))?;

    res
}
