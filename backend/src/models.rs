//! Defines the database objects and their representations that are used to send data between
//! the DB, this application, and the clients.

use diesel::prelude::*;

use schema::*;

#[derive(Queryable, Serialize, Deserialize)]
pub struct SharedComposition {
    id: i32,
    username: String,
    thumbnail_url: String,
    definition_string: String,
}

#[derive(Insertable, Deserialize)]
#[table_name="shared_compositions"]
pub struct NewSharedComposition {
    username: String,
    thumbnail_url: String,
    definition_string: String,
}

#[derive(Serialize, Deserialize)]
pub struct CompositionSubmissionResult {
    success: bool,
    message: Option<String>,
}
