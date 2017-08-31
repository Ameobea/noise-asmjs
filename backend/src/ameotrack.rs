//! Interface to my personal image uploader, AmeoTrack, which is used to host thumbnails of uploaded images.

use std::fs::File;
use std::io::Read;
use std::str::FromStr;

use hyper::Client;
use hyper::header::{Headers, ContentType};
use hyper_native_tls::NativeTlsClient;
use hyper::net::HttpsConnector;
use mime::Mime;
use multipart::client::lazy::Multipart;
use tokio_core::reactor::Core;

use schema::AMEOTRACK_UPLOAD_PASSWORD;

const AMEOTRACK_UPLOAD_URL: &'static str = "https://ameo.link/u/upload";

pub fn upload_image(file: &File) -> Result<String, String> {
    // initialize Tokio because that's required for some reason
    let mut core = Core::new().unwrap();
    let handle = core.handle();

    // initialize the `hyper` client with the HTTPS connector
    // then set some headers and serialize the payload into the body
    let ssl = NativeTlsClient::new().unwrap();
    let connector = HttpsConnector::new(ssl);
    let client = Client::with_connector(connector);

    let mut headers = Headers::new();
    headers.set(ContentType::json());

    let mut res = Multipart::new()
        .add_text("source", "Noise Function Composition Backend")
        .add_text("password", AMEOTRACK_UPLOAD_PASSWORD)
        .add_text("expiry", "-1")
        .add_stream::<&'static str, _, &'static str>("file", file, None, Some(Mime::from_str("image/png").unwrap()))
        .client_request_mut(&client, AMEOTRACK_UPLOAD_URL, |req_builder| {
            req_builder.headers(headers)
        })
        .map_err(|_| String::from("Unable to create `Multipart` request!"))?;

    let mut buf = String::new();
    res.read_to_string(&mut buf).unwrap();

    Ok(buf)
}
