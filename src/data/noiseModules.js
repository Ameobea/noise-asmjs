//! Contains a list of all supported noise generators containing their ID and name.

export default [{
  key: 'Fbm',
  name: 'Fractional Brownian Noise',
  content: 'Also known as Perlin Noise, Fractional Brownian Noise is a commonly used algorithm that has been used in a variety of notable applications including the terrain generation for MineCraft.',
}, {
  key: 'Worley',
  name: 'Worley Noise',
  content: 'Worley noise was generated to create procedural textures such as water and stone.  Random points are generated and output values are calculated by the distance to the nearest point.',
}, {
  key: 'OpenSimplex',
  name: 'OpenSimplex Noise',
  content: 'Open simplex is a noise algorithm that produces similar results to Simplex noise but is unencumbered by patent restrictions.  It can have similar results to Perlin noise but avoids the linear artifacting that can occur due to Perlin noise\'s underlying cubic lattice.',
}, {
  key: 'Billow',
  name: 'Billow Noise',
  content: 'Produces "billowy" noise suitable for clouds or rocks.  This noise module is nearly identical to fBm noise, except this noise module modifes each octave with an absolute-value function.',
}, {
  key: 'HybridMulti',
  name: 'Hybrid Multifractal Noise',
  content: 'The result of this multifractal noise is that valleys in the noise should have smooth bottoms at all altitudes.',
}, {
  key: 'SuperSimplex',
  name: 'Super Simplex Noise',
  content: '"Larger kernels of OpenSimplex, with the lattice of Simplex, but not implemented like Simplex."',
}, {
  key: 'Value',
  name: 'Value Noise',
  content: 'Created by assigning random values to a lattice of points.  Results are returned by interpolating the values of surrounding lattice points.',
}, {
  key: 'RidgedMulti',
  name: 'Ridged Multifractal Noise',
  content: 'Heavily based on Perlin noise, this module mutates the output of each octave by modifying it by an absolute-value function',
}, {
  key: 'BasicMulti',
  name: 'Basic Multifractal Noise',
  content: 'Outputs heterogenous Multifractal noise.  In areas near zero, higher frequencies will be heavily damped, resulting in the terrain remaining smooth. As the value moves further away from zero, higher frequencies will not be as damped and thus will grow more jagged as iteration progresses.',
}, {
  key: 'Constant',
  name: 'Constant Value',
  content: 'Noise module that returns a constant value for every input coordinate.  Not useful on its own, but can be helpful in composing more complicated noise modules.',
}, {
  key: 'Composed',
  name: 'Composed Noise Module',
  content: 'A noise module that combines the outputs of multiple child nodes using a composition scheme to return a single output value.',
}];
