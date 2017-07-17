/**
 * Composition schemes define methods to combine the outputs of multiple noise modules into a single value.
 */

export default [{
  key: 'average',
  name: 'Average',
  content: 'The outputs of all noise modules are averaged together and the result is returned.',
  settings: [],
}, {
  key: 'weightedAverage',
  name: 'Weighted Average',
  content: 'The outputs are averaged based on the provided weights.',
  settings: ['averageWeights'],
}];
