//! Defines the API routes for the application

use chrono::Utc;
use diesel;
use diesel::prelude::*;
use rocket::State;
use rocket_contrib::Json;

use db_interface::DbPool;
use models::{QueryResult, NewSharedComposition, SharedComposition, UserSharedComposition};
use renderer::create_thumbnail;
use schema::shared_compositions::dsl as shared_compositions_dsl;
use schema::shared_compositions::table as shared_compositions_table;
use util::debug;

const ITEMS_PER_PAGE: i64 = 10;

#[get("/list_compositions/<start_page>/<end_page>")]
pub fn list_compositions(
    start_page: i64, end_page: i64, conn_pool: State<DbPool>
) -> Result<Json<QueryResult<Vec<SharedComposition>>>, String> {
    if start_page > end_page || start_page < 0 || end_page < 0 {
        return Ok(Json(QueryResult::Error(String::from("Invalid page numbers provided."))));
    }

    let conn = &*conn_pool.inner().get_conn();

    let result: Vec<SharedComposition> = shared_compositions_dsl::shared_compositions
        .limit(ITEMS_PER_PAGE * (start_page - end_page))
        .offset(ITEMS_PER_PAGE * start_page)
        .load(conn)
        .map_err(debug)?;

    Ok(Json(QueryResult::Success(result)))
}

#[post("/submit_composition", data="<user_composition>")]
pub fn submit_composition(
    user_composition: Json<UserSharedComposition>, conn_pool: State<DbPool>
) -> Json<QueryResult<NewSharedComposition>> {
    let conn = &*conn_pool.inner().get_conn();

    // build the noise function, create a tumbnail image, upload that to AmeoTrack,
    // and retrieve the URL.
    let thumb_res: String = match create_thumbnail(&user_composition.definition_string) {
        Ok(url) => url,
        Err(err) => { return Json(QueryResult::Error(err)) },
    };

    // create the model used for insertion into the database
    let new_compo = NewSharedComposition {
        creation_date: Utc::now().naive_utc(),
        username: user_composition.username.clone(),
        title: user_composition.title.clone(),
        description: user_composition.description.clone(),
        thumbnail_url: thumb_res,
        definition_string: user_composition.definition_string.clone(),
    };

    let _ = diesel::insert(&new_compo)
        .into(shared_compositions_table)
        .execute(conn)
        .map_err(debug);

    Json(QueryResult::Success(new_compo))
}
