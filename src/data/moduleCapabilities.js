//! Defines which configuration settings are compabitle with which noise modules.

import { Set } from 'immutable';
import _ from 'lodash';

// \/ I have no idea what I was saying here but I'm leaving it in anyway.
// definitions of the various parameters that modules that inherit different traits have
const NoiseModule = Set(['zoom', 'speed']);
const MultiFractal = Set(['octaves', 'frequency', 'lacunarity', 'persistence']);
const Seedable = Set(['seed']);

// Given a list of sets, returns a set that is the union of all their elements.
const uniteSets = sets => _.reduce(sets, (result, value, key) => result.union(value), Set([]));

export default {
  Fbm: uniteSets([NoiseModule, MultiFractal, Seedable]),
  Worley: uniteSets([NoiseModule, Seedable, Set(['rangeFunction', 'enableRange', 'frequency', 'displacement'])]),
  OpenSimplex: uniteSets([NoiseModule, Seedable]),
  Billow: uniteSets([NoiseModule, MultiFractal, Seedable]),
  HybridMulti: uniteSets([NoiseModule, MultiFractal, Seedable]),
  SuperSimplex: uniteSets([NoiseModule, Seedable]),
  Value: uniteSets([NoiseModule, Seedable]),
  RidgedMulti: uniteSets([NoiseModule, MultiFractal, Seedable, Set(['attenuation'])]),
  BasicMulti: uniteSets([NoiseModule, MultiFractal, Seedable]),
  Constant: Set(['constant']),
};
