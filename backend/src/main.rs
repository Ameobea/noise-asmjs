//! Server-side backend for the noise composition application.  Serves the sharing functionality
//! and hosts the list of published functions.

#![feature(plugin)]
#![plugin(rocket_codegen)]
#![recursion_limit = "128"]

extern crate chrono;
#[macro_use]
extern crate diesel_codegen;
#[macro_use]
extern crate diesel;
extern crate htmlescape;
extern crate image;
extern crate libcomposition;
extern crate noise;
extern crate r2d2;
extern crate r2d2_diesel;
extern crate rand;
extern crate reqwest;
extern crate rocket;
extern crate rocket_contrib;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate uuid;

use rocket::request::Request;
use rocket_contrib::Json;

mod ameotrack;
mod db_interface;
use self::db_interface::{create_db_pool, DbPool};
mod models;
use self::models::ErrorMessage;
mod renderer;
mod routes;
use self::routes::*;
mod schema;
mod util;

/// This function matches all routes that aren't defined, returning a 404 error.
#[error(404)]
fn not_found(_: &Request) -> Json<ErrorMessage> {
    Json(ErrorMessage {
        status: 404,
        message: "The requested resource could not be found.".into(),
    })
}

/// This function is called every time there's an internal error while attempting to handle a request.
#[error(500)]
fn internal_error(_: &Request) -> Json<ErrorMessage> {
    Json(ErrorMessage {
        status: 500,
        message: "An internal server error occurred and we were unable to process your request."
            .into(),
    })
}

fn main() {
    rocket::ignite()
        .mount(
            "/",
            routes![
                list_compositions,
                submit_composition,
                get_shared_composition
            ],
        ).catch(errors![not_found, internal_error])
        .manage(DbPool(create_db_pool()))
        .launch();
}
