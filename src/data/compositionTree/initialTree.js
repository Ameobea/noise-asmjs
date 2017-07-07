export default {
  type: 'root',
  settings: {
    moduleType: 'composed',
  },
  children: [{
    type: 'noiseModule',
    settings: {
      moduleType: 'Billow',
      // TODO: MORE
    },
    children: null,
  }, {
    type: 'noiseModule',
    settings: {
      moduleType: 'Worley',
      // TODO: MORE
    },
    children: null,
  }],
};
