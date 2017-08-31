//! Interface to my personal image uploader, AmeoTrack, which is used to host thumbnails of uploaded images.

use std::io::Read;
use std::thread;

use hyper::{Client, Url};
use hyper::client::Request;
use hyper::header::{Headers, ContentType};
use hyper::method::Method;
use hyper_native_tls::NativeTlsClient;
use hyper::net::HttpsConnector;
use multipart::client::Multipart;
use tempfile::NamedTempFile;

use schema::AMEOTRACK_UPLOAD_PASSWORD;

const AMEOTRACK_UPLOAD_URL: &'static str = "https://ameo.link/u/upload";

pub fn upload_image(file: NamedTempFile) -> Result<String, String> {
    // initialize the `hyper` client with the HTTPS connector
    // then set some headers and serialize the payload into the body
    let ssl = NativeTlsClient::new().unwrap();
    let connector = HttpsConnector::new(ssl);
    let client = Client::with_connector(connector);

    let mut headers = Headers::new();
    headers.set(ContentType::json());

    let req = Request::new(Method::Post, Url::parse(AMEOTRACK_UPLOAD_URL).unwrap()).unwrap();
    let mut res = Multipart::from_request(req)
        .unwrap()
        .write_text("source", "Noise Function Composition Backend")
        .unwrap()
        .write_text("password", AMEOTRACK_UPLOAD_PASSWORD)
        .unwrap()
        .write_text("expiry", "-1")
        .unwrap()
        .write_file("file", file.path())
        .unwrap()
        .send()
        .unwrap();
        // .map_err(|err| format!("Unable to create `Multipart` request: {:?}", err))?;

    let mut buf = String::new();
    res.read_to_string(&mut buf).unwrap();

    file.close().map_err(|err| format!("Error while deleting temporary file: {:?}", err))?;

    Ok(buf)
}
