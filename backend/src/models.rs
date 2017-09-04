//! Defines the database objects and their representations that are used to send data between
//! the DB, this application, and the clients.

use chrono::NaiveDateTime;
use htmlescape::encode_minimal;
use serde::Serialize;

use schema::*;

#[derive(Queryable, Serialize, Deserialize)]
pub struct SharedComposition {
    pub id: i32,
    pub username: String,
    pub creation_date: NaiveDateTime,
    pub title: String,
    pub thumbnail_url: String,
    pub description: String,
    pub definition_string: String,
    pub votes: i32,
}

impl SharedComposition {
    /// HTML escapes all fields of the composition
    pub fn escape(self) -> Self {
        SharedComposition {
            id: self.id,
            username: encode_minimal(&self.username),
            creation_date: self.creation_date,
            title: encode_minimal(&self.title),
            thumbnail_url: encode_minimal(&self.thumbnail_url),
            description: encode_minimal(&self.description),
            definition_string: self.definition_string,
            votes: self.votes,
        }
    }
}

#[derive(Insertable, Serialize, Deserialize)]
#[table_name="shared_compositions"]
pub struct NewSharedComposition {
    pub username: String,
    pub creation_date: NaiveDateTime,
    pub title: String,
    pub thumbnail_url: String,
    pub description: String,
    pub definition_string: String,
}

/// Data supplied by the user to upload a composition scheme
#[derive(Deserialize)]
pub struct UserSharedComposition {
    pub username: String,
    pub title: String,
    pub description: String,
    pub definition_string: String,
}

#[derive(Serialize)]
pub enum QueryResult<T: Serialize> {
    Success(T),
    Error(String),
}

#[derive(Serialize, Deserialize)]
pub struct ErrorMessage {
    pub status: u16,
    pub message: String,
}
