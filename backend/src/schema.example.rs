//! Connects to the MySQL database and generates a bunch of code at compile-time to interact with it.
//! COPY THIS FILE TO `schema.rs` AFTER SETTING THE VALUES

infer_schema!("mysql://username:password@site.com/dbname");
