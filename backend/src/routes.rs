//! Defines the API routes for the application

use rocket_contrib::Json;

use models::SharedComposition;

#[get("/list_compositions/<start>/<end>")]
pub fn list_compositions(start: usize, end: usize) -> Json<Vec<SharedComposition>> {
    unimplemented!(); // TODO
}
