//! Defines the API routes for the application

use chrono::Utc;
use diesel;
use diesel::expression::sql_literal::sql;
use diesel::prelude::*;
use diesel::types::Binary;
use rocket::State;
use rocket_contrib::Json;

use db_interface::DbPool;
use models::{QueryResult, NewSharedComposition, SharedComposition, UserSharedComposition};
use renderer::create_thumbnail;
use schema::shared_compositions::dsl as shared_compositions_dsl;
use schema::shared_compositions::table as shared_compositions_table;
use util::debug;

const ITEMS_PER_PAGE: i64 = 10;

enum SortMethod {
    Newest,
    Oldest,
    MostPopular,
}

impl<'a> From<&'a str> for SortMethod {
    fn from(s: &str) -> Self {
        match s {
            "newest" | "Newest" => SortMethod::Newest,
            "oldest" | "Oldest" => SortMethod::Oldest,
            "mostPopular" | "most_popular" => SortMethod::MostPopular,
            _ => SortMethod::MostPopular,
        }
    }
}

#[get("/list_compositions/<sort>/<start_page>/<end_page>")]
pub fn list_compositions(
    sort: String, start_page: i64, end_page: i64, conn_pool: State<DbPool>
) -> Result<Json<QueryResult<Vec<SharedComposition>>>, String> {
    if start_page > end_page || start_page < 0 || end_page < 0 {
        return Ok(Json(QueryResult::Error(String::from("Invalid page numbers provided."))));
    }

    let conn = &*conn_pool.inner().get_conn();

    let query = shared_compositions_dsl::shared_compositions;

    // annoying hack since diesel doesn't provide a way (that I know of) of doing dynamic stuff like this
    let ordering: SortMethod = sort.as_str().into();
    let order = match ordering {
        SortMethod::Oldest => sql::<Binary>("`creation_date` ASC"),
        SortMethod::Newest => sql::<Binary>("`creation_date` DESC"),
        SortMethod::MostPopular => sql::<Binary>("`votes` DESC"),
    };

    let result: Vec<SharedComposition> = query
        .order(order)
        .limit(ITEMS_PER_PAGE * ((start_page - end_page) + 1))
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

#[get("/get_shared_composition/<composition_id>")]
pub fn get_shared_composition(
    composition_id: i32, conn_pool: State<DbPool>
) -> Json<QueryResult<SharedComposition>> {
    let conn = &*conn_pool.inner().get_conn();

    let result: Result<SharedComposition, String> = shared_compositions_dsl::shared_compositions
        .find(composition_id)
        .first(conn)
        .map_err(debug);

    Json(match result {
        Ok(r) => QueryResult::Success(r),
        Err(err) => QueryResult::Error(err),
    })
}
