//! Defines which configuration settings are compabitle with which noise modules.

import { Set } from 'immutable';

// definitions of the various parameters that modules that inherit different triats have
const NoiseModule = Set(['zoom', 'speed']);
const MultiFractal = Set(['octaves', 'frequency', 'lacunarity', 'persistence']);
const Seedable = Set(['seed']);

export default {
  Fbm: Set.union([NoiseModule, MultiFractal, Seedable]),
  Worley: Set.union([NoiseModule, Seedable, Set(['rangeFunction', 'enableRange', 'frequency', 'displacement'])]),
  OpenSimplex: Set.union([NoiseModule, Seedable]),
  Billow: Set.union([NoiseModule, MultiFractal, Seedable]),
  HybridMulti: Set.union([NoiseModule, MultiFractal, Seedable]),
  SuperSimplex: Set.union([NoiseModule, Seedable]),
  Value: Set.union([NoiseModule, Seedable]),
  RidgedMulti: Set.union([NoiseModule, MultiFractal, Seedable, Set(['attenuation'])]),
  BasicMulti: Set.union([NoiseModule, MultiFractal, Seedable]),
};
