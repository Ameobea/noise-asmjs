/**
 * The default composition tree that is loaded when the application is opened for the first time.
 */

import uuidv4 from 'uuid/v4';

import { NULL_UUID } from 'src/data/misc';
import { createSetting } from 'src/helpers/compositionTree';

export default {
  id: NULL_UUID,
  type: 'root',
  settings: [ createSetting('moduleType', 'Composed') ],
  children: [{
    id: uuidv4(),
    type: 'compositionScheme',
    settings: [ createSetting('compositionScheme', 'average') ],
    children: [],
  }, {
    id: uuidv4(),
    type: 'noiseModule',
    settings: [ createSetting('moduleType', 'Billow') ],
    children: [],
  }, {
    id: uuidv4(),
    type: 'noiseModule',
    settings: [ createSetting('moduleType', 'Worley') ],
    children: [],
  }],
};
