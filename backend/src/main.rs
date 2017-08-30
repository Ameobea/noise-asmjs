//! Server-side backend for the noise composition application.  Serves the sharing functionality
//! and hosts the list of published functions.

#![feature(plugin)]
#![plugin(rocket_codegen)]

extern crate chrono;
#[macro_use]
extern crate diesel_codegen;
#[macro_use]
extern crate diesel;
extern crate r2d2;
extern crate r2d2_diesel;
extern crate rocket;
extern crate rocket_contrib;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

mod models;
mod routes;
mod schema;

fn main() {
    println!("Hello, world!");
}
