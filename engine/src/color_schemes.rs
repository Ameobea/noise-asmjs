//! Defines the color mapper functions for each of the color schemes.

use palette::{Gradient, FromColor, Hsv, Rgb};
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

lazy_static!{
    static ref LAVA_FLOW_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(34, 26, 23)),
            (-0.6, Rgb::new_u8(66, 20, 15)),
            (-0.2, Rgb::new_u8(143, 18, 13)),
            (0.2, Rgb::new_u8(243, 38, 28)),
            (0.6, Rgb::new_u8(200, 107, 29)),
            (1.0, Rgb::new_u8(246, 160, 58)),
        ];

        Gradient::with_domain(steps)
    };

    static ref VAPORWAVE_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(45, 25, 138)),
            (-0.5, Rgb::new_u8(128, 27, 123)),
            (0.0, Rgb::new_u8(181, 31, 138)),
            (0.5, Rgb::new_u8(250, 53, 122)),
            (0.92, Rgb::new_u8(252, 106, 244)),
            (1.0, Rgb::new_u8(254, 207, 253)),
        ];

        Gradient::with_domain(steps)
    };

    static ref PASTEL_SEA_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(105, 141, 159)),
            (-0.92, Rgb::new_u8(99, 162, 190)),
            (-0.6, Rgb::new_u8(168, 169, 200)),
            (-0.2, Rgb::new_u8(159, 144, 185)),
            (0.3, Rgb::new_u8(246, 206, 232)),
            (0.8, Rgb::new_u8(172, 188, 250)),
            (1.0, Rgb::new_u8(158, 163, 211)),
        ];

        Gradient::with_domain(steps)
    };

    static ref SUNSET_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(28, 57, 105)),
            (-0.7, Rgb::new_u8(66, 58, 111)),
            (-0.37, Rgb::new_u8(149, 50, 86)),
            (0.0, Rgb::new_u8(222, 78, 41)),
            (0.4, Rgb::new_u8(230, 125, 30)),
            (0.75342, Rgb::new_u8(254, 215, 230)),
            (1.0, Rgb::new_u8(223, 96, 155)),
        ];

        Gradient::with_domain(steps)
    };

    static ref COSMOS_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(0, 0, 4)),
            (-0.778, Rgb::new_u8(1, 18, 46)),
            (-0.37, Rgb::new_u8(28, 57, 105)),
            (-0.08, Rgb::new_u8(31, 17, 87)),
            (0.2, Rgb::new_u8(2, 22, 73)),
            (0.5, Rgb::new_u8(65, 32, 129)),
            (0.8, Rgb::new_u8(18, 57, 73)),
            (1.0, Rgb::new_u8(33, 49, 136)),
        ];

        Gradient::with_domain(steps)
    };

    static ref OCEANIC_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(0, 1, 49)),
            (-0.5, Rgb::new_u8(2, 32, 105)),
            (0.2, Rgb::new_u8(6, 86, 155)),
            (0.7, Rgb::new_u8(28, 180, 215)),
            (1.0, Rgb::new_u8(140, 234, 245)),
        ];

        Gradient::with_domain(steps)
    };

    static ref ALGAE_FLOAT_GRADIENT: Gradient<Rgb> = {
        let steps = vec![
            (-1.0, Rgb::new_u8(10, 29, 2)),
            (-0.6869, Rgb::new_u8(0, 46, 0)),
            (-0.38, Rgb::new_u8(7, 54, 3)),
            (0.1, Rgb::new_u8(48, 100, 6)),
            (0.5, Rgb::new_u8(84, 145, 43)),
            (0.9, Rgb::new_u8(172, 192, 82)),
            (1.0, Rgb::new_u8(126, 97, 31)),
        ];

        Gradient::with_domain(steps)
    };
}

impl ColorFunction {
    pub fn colorize(&self, val: f64) -> [u8; 4] {
        match self {
            &ColorFunction::TieDye => {
                // normalize into range from -180 to 180
                let hue = (val * 360.0) + 180.0;
                let hsv_color = Hsv::new(hue.into(), 1.0, 1.0);
                let rgb_color = Rgb::from_hsv(hsv_color);

                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::BlackAndWhite => {
                // normalize into range from -180 to 180
                let res = ((val * 255.0) + (255.0 / 2.0)) as u8;

                [res, res, res, 255]
            },
            &ColorFunction::LavaFlow => {
                let rgb_color = LAVA_FLOW_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::Sunset => {
                let rgb_color = SUNSET_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::Cosmos => {
                let rgb_color = COSMOS_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::Oceanic => {
                let rgb_color = OCEANIC_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::PastelSea => {
                let rgb_color = PASTEL_SEA_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::Vaporwave => {
                let rgb_color = VAPORWAVE_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
            &ColorFunction::AlgaeFloat => {
                let rgb_color = ALGAE_FLOAT_GRADIENT.get(val as f32);
                [(rgb_color.red * 255.) as u8, (rgb_color.green * 255.) as u8, (rgb_color.blue * 255.) as u8, 255]
            },
        }
    }
}
