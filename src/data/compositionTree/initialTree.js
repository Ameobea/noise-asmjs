/**
 * The default composition tree that is loaded when the application is opened for the first time.
 */

const uuidv4 = require('uuid/v4');

export default {node: {
  id: '00000000-0000-0000-0000-000000000000',
  type: 'root',
  settings: [{
    id: uuidv4(),
    key: 'moduleType',
    value: 'composed',
  }],
  children: [{
    id: uuidv4(),
    type: 'noiseModule',
    settings: [{
      id: uuidv4(),
      key: 'moduleType',
      value: 'Billow',
    }],
    children: [],
  }, {
    id: uuidv4(),
    type: 'noiseModule',
    settings: [{
      id: uuidv4(),
      key: 'moduleType',
      value: 'Worley',
    }],
    children: [],
  }],
}};
