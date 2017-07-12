/**
 * The default composition tree that is loaded when the application is opened for the first time.
 */

import uuidv4 from 'uuid/v4';

import { NULL_UUID } from 'src/data/misc';

export default {
  id: NULL_UUID,
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
};
