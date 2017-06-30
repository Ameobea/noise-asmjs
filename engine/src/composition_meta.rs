//! Defines the structs used to store the metadata held internally by noise function composers to tune their behavior.

#[derive(Deserialize)]
pub struct WeightedAverageMeta {
    pub weights: Vec<f32>,
}
