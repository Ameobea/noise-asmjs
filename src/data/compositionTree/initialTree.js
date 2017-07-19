/**
 * The default composition tree that is loaded when the application is opened for the first time.
 */

import uuidv4 from 'uuid/v4';

import { NULL_UUID } from 'src/data/misc';
import { createSetting, defaultCompositionScheme, defaultNoiseModule } from 'src/helpers/compositionTree/util';

export default {
  id: NULL_UUID,
  type: 'root',
  settings: [ createSetting('moduleType', 'Composed') ],
  children: [
    defaultCompositionScheme(), {
      id: uuidv4(),
      type: 'inputTransformations',
      settings: [],
      children: [{
        id: uuidv4(),
        type: 'inputTransformation',
        settings: [
          createSetting('inputTransformationType', 'zoomScale'),
          createSetting('speed', 1.1),
          createSetting('zoom', 1),
        ],
        children: [],
      }],
    },
    defaultNoiseModule(), {
      id: uuidv4(),
      type: 'noiseModule',
      settings: [ createSetting('moduleType', 'Worley') ],
      children: [],
    }
  ],
};
