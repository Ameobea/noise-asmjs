//! Defines which configuration settings are compabitle with which noise modules.

import { Set } from 'immutable';

// \/ I have no idea what I was saying here but I'm leaving it in anyway.
// definitions of the various parameters that modules that inherit different traits have
const MultiFractal = Set(['octaves', 'frequency', 'lacunarity', 'persistence']);
const Seedable = Set(['seed']);

// Given a list of sets, returns a set that is the union of all their elements.
const uniteSets = sets => sets.reduce((acc, value, key) => acc.union(value), Set(['moduleType']));

export default {
  Fbm: uniteSets([MultiFractal, Seedable]),
  Worley: uniteSets([Seedable, Set(['rangeFunction', 'enableRange', 'worleyFrequency', 'displacement'])]),
  OpenSimplex: Seedable,
  Billow: uniteSets([MultiFractal, Seedable]),
  HybridMulti: uniteSets([MultiFractal, Seedable]),
  SuperSimplex: Seedable,
  Value: Seedable,
  RidgedMulti: uniteSets([MultiFractal, Seedable, Set(['attenuation'])]),
  BasicMulti: uniteSets([MultiFractal, Seedable]),
  Constant: Set(['constant']),
  Composed: Set([]),
};
