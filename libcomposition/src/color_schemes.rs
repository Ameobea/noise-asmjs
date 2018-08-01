//! Defines the color mapper functions for each of the color schemes.

use palette::{
    encoding::Srgb,
    rgb::{LinSrgb, Rgb, RgbStandard},
    FromColor, Gradient, Hsv,
};
use std::str::FromStr;

/// Determines the function used to map the output of the noise functions to a pixel color to be displayed
/// on the canvas.
#[derive(Debug, Serialize, Deserialize)]
pub enum ColorFunction {
    TieDye,
    BlackAndWhite,
    LavaFlow,
    Sunset,
    Oceanic,
    Cosmos,
    PastelSea,
    Vaporwave,
    AlgaeFloat,
}

impl FromStr for ColorFunction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "tieDye" => Ok(ColorFunction::TieDye),
            "blackAndWhite" => Ok(ColorFunction::BlackAndWhite),
            "lavaFlow" => Ok(ColorFunction::LavaFlow),
            "sunset" => Ok(ColorFunction::Sunset),
            "oceanic" => Ok(ColorFunction::Oceanic),
            "cosmos" => Ok(ColorFunction::Cosmos),
            "pastelSea" => Ok(ColorFunction::PastelSea),
            "vaporwave" => Ok(ColorFunction::Vaporwave),
            "algaeFloat" => Ok(ColorFunction::AlgaeFloat),
            _ => Err(format!("Unable to convert \"{}\" into `ColorFunction`!", s)),
        }
    }
}

fn expand_range(byte: u8) -> f32 {
    (byte as f32 / 255.)
}

fn map_rgb_to_linsrgb<T: RgbStandard>(rgb: &Rgb<T, u8>) -> LinSrgb {
    Rgb::new(
        expand_range(rgb.red),
        expand_range(rgb.green),
        expand_range(rgb.blue),
    )
}

fn map_step<T: RgbStandard>((interval, rgb): &(f32, Rgb<T, u8>)) -> (f32, LinSrgb) {
    (*interval, map_rgb_to_linsrgb(rgb))
}

lazy_static! {
    static ref LAVA_FLOW_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(34, 26, 23)),
            (-0.6, LinSrgb::new(66, 20, 15)),
            (-0.2, LinSrgb::new(143, 18, 13)),
            (0.2, LinSrgb::new(243, 38, 28)),
            (0.6, LinSrgb::new(200, 107, 29)),
            (1.0, LinSrgb::new(246, 160, 58)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref VAPORWAVE_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(45, 25, 138)),
            (-0.5, LinSrgb::new(128, 27, 123)),
            (0.0, LinSrgb::new(181, 31, 138)),
            (0.5, LinSrgb::new(250, 53, 122)),
            (0.92, LinSrgb::new(252, 106, 244)),
            (1.0, LinSrgb::new(254, 207, 253)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref PASTEL_SEA_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(105, 141, 159)),
            (-0.92, LinSrgb::new(99, 162, 190)),
            (-0.6, LinSrgb::new(168, 169, 200)),
            (-0.2, LinSrgb::new(159, 144, 185)),
            (0.3, LinSrgb::new(246, 206, 232)),
            (0.8, LinSrgb::new(172, 188, 250)),
            (1.0, LinSrgb::new(158, 163, 211)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref SUNSET_GRADIENT: Gradient<LinSrgb> = {
        let steps = [
            (-1.0, LinSrgb::new(28, 57, 105)),
            (-0.7, LinSrgb::new(66, 58, 111)),
            (-0.37, LinSrgb::new(149, 50, 86)),
            (0.0, LinSrgb::new(222, 78, 41)),
            (0.4, LinSrgb::new(230, 125, 30)),
            (0.75342, LinSrgb::new(254, 215, 230)),
            (1.0, LinSrgb::new(223, 96, 155)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref COSMOS_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(0, 0, 4)),
            (-0.778, LinSrgb::new(1, 18, 46)),
            (-0.37, LinSrgb::new(28, 57, 105)),
            (-0.08, LinSrgb::new(31, 17, 87)),
            (0.2, LinSrgb::new(2, 22, 73)),
            (0.5, LinSrgb::new(65, 32, 129)),
            (0.8, LinSrgb::new(18, 57, 73)),
            (1.0, LinSrgb::new(33, 49, 136)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref OCEANIC_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(0, 1, 49)),
            (-0.5, LinSrgb::new(2, 32, 105)),
            (0.2, LinSrgb::new(6, 86, 155)),
            (0.7, LinSrgb::new(28, 180, 215)),
            (1.0, LinSrgb::new(140, 234, 245)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
    static ref ALGAE_FLOAT_GRADIENT: Gradient<LinSrgb> = {
        let steps: Vec<(f32, LinSrgb)> = [
            (-1.0, LinSrgb::new(10, 29, 2)),
            (-0.6869, LinSrgb::new(0, 46, 0)),
            (-0.38, LinSrgb::new(7, 54, 3)),
            (0.1, LinSrgb::new(48, 100, 6)),
            (0.5, LinSrgb::new(84, 145, 43)),
            (0.9, LinSrgb::new(172, 192, 82)),
            (1.0, LinSrgb::new(126, 97, 31)),
        ]
            .into_iter()
            .map(map_step)
            .collect();

        Gradient::with_domain(steps)
    };
}

impl ColorFunction {
    pub fn colorize(&self, val: f32) -> [u8; 4] {
        match self {
            &ColorFunction::TieDye => {
                // normalize into range from -180 to 180
                let hue = (val * 360.0) + 180.0;
                let hsv_color: Hsv<Srgb, f32> = Hsv::new(hue, 1.0, 1.0);
                let rgb_color: Rgb<Srgb, f32> = Rgb::from_hsv(hsv_color);

                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::BlackAndWhite => {
                // normalize into range from -180 to 180
                let res = ((val * 255.0) + (255.0 / 2.0)) as u8;

                [res, res, res, 255]
            }
            &ColorFunction::LavaFlow => {
                let rgb_color = LAVA_FLOW_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::Sunset => {
                let rgb_color = SUNSET_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::Cosmos => {
                let rgb_color = COSMOS_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::Oceanic => {
                let rgb_color = OCEANIC_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::PastelSea => {
                let rgb_color = PASTEL_SEA_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::Vaporwave => {
                let rgb_color = VAPORWAVE_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
            &ColorFunction::AlgaeFloat => {
                let rgb_color = ALGAE_FLOAT_GRADIENT.get(val as f32);
                [
                    (rgb_color.red * 255.) as u8,
                    (rgb_color.green * 255.) as u8,
                    (rgb_color.blue * 255.) as u8,
                    255,
                ]
            }
        }
    }
}
