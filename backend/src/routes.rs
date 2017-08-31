//! Defines the API routes for the application

use rocket_contrib::Json;

use models::{CompositionSubmissionResult, NewSharedComposition, SharedComposition};

#[get("/list_compositions/<start>/<end>")]
pub fn list_compositions(start: usize, end: usize) -> Json<Vec<SharedComposition>> {
    unimplemented!(); // TODO
}

#[post("/submit_composition", data="<composition>")]
pub fn submit_composition(composition: Json<NewSharedComposition>) -> Json<CompositionSubmissionResult> {
    unimplemented!(); // TODO
}
