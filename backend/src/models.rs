//! Defines the database objects and their representations that are used to send data between
//! the DB, this application, and the clients.

#[derive(Queryable, Serialize, Deserialize)]
pub struct SharedComposition {
    id: i32,
    username: String,
    thumbnail_url: String,
    definition_string: String,
}

#[derive(Insertable)]
#[table_name="shared_compositions"]
pub struct NewSharedComposition {
    username: String,
    thumbnail_url: String,
    definition_string: String,
}
