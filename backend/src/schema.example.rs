//! Connects to the MySQL database and generates a bunch of code at compile-time to interact with it.
//! COPY THIS FILE TO `schema.rs` AFTER SETTING THE VALUES

pub const DB_URL: &'static str = "mysql://username:password@site.com/dbname";

pub const AMEOTRACK_UPLOAD_PASSWORD: &'static str = "secret";

infer_schema!("mysql://username:password@site.com/dbname");
