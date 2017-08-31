//! Helper functions

use std::fmt::Debug;

pub fn debug<T>(x: T) -> String where T: Debug { format!("{:?}", x) }
