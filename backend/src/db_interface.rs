//! Functions for interfacing with the database backend.  Contains functions for both inserting and querying data.

use diesel::mysql::MysqlConnection;
use r2d2::{Config, Pool, PooledConnection};
use r2d2_diesel::ConnectionManager;

use schema::DB_URL;

/// A wrapper struct around an inner connection pool.  Provides a helper function for pulling a connection out of the pool.
pub struct DbPool(pub Pool<ConnectionManager<MysqlConnection>>);

impl DbPool {
    pub fn get_conn(&self) -> PooledConnection<ConnectionManager<MysqlConnection>> {
        return self.0.get().unwrap();
    }
}

pub fn create_db_pool() -> Pool<ConnectionManager<MysqlConnection>> {
    let config = Config::default();
    let manager = ConnectionManager::<MysqlConnection>::new(DB_URL);
    Pool::new(config, manager).expect("Failed to create pool.")
}
