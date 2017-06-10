//! Contains a list of all supported noise generators containing their ID and name.

export default [{
  key: 'Fbm',
  name: 'Fractional Brownian Noise',
  content: 'Also known as Perlin Noise, Fractional Brownian Noise is a commonly used algorithm that has been used in a variety of notable applications including the terrain generation for MineCraft.',
}, {
  key: 'OpenSimplex',
  name: 'OpenSimplex Noise',
  content: 'Open simplex is a noise algorithm that produces similar results to Simplex noise but is unencumbered by patent restrictions.  It can have similar results to Perlin noise but avoids the linear artifacting that can occur due to Perlin noise\'s underlying cubic lattice.',
}];
