//! Interface to my personal image uploader, AmeoTrack, which is used to host thumbnails of uploaded images.

use std::io::Read;
use std::path::Path;

use reqwest::multipart::Form;
use reqwest::{Client, StatusCode};

use schema::AMEOTRACK_UPLOAD_PASSWORD;

const AMEOTRACK_UPLOAD_URL: &'static str = "https://ameo.link/u/upload";

pub fn upload_image(path: &Path) -> Result<String, String> {
    let client = Client::new();
    let form = Form::new()
        .text("source", "Noise Function Composition Backend")
        .text("password", AMEOTRACK_UPLOAD_PASSWORD)
        .text("expiry", "-1")
        .file("file", path)
        .map_err(|_| {
            format!(
                "Unable to add the file at path {:?} to the multipart request!",
                path
            )
        })?;

    let mut res = client
        .post(AMEOTRACK_UPLOAD_URL)
        .multipart(form)
        .send()
        .map_err(|err| format!("Error while sending POST request: {:?}", err))?;

    if res.status() != StatusCode::OK {
        return Err(format!(
            "Image upload request returned unexpected HTTP status code: {:?}",
            res.status()
        ));
    }

    let mut buf = String::new();
    res.read_to_string(&mut buf)
        .map_err(|_| String::from("Unable to read response into buffer!"))?;

    Ok(buf)
}
