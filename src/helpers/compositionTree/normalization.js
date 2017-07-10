/**
 * Transforms a nested tree definition into the normalized format suitable for storage into the Redux store.
 */

import R from 'ramda';

import { denormalize, normalize, schema } from 'normalizr';

const node = new schema.Entity('nodes', {
  settings: [ setting ],
});
const children = new schema.Array(node);

const setting = new schema.Entity('settings', {
  children: [ node ],
});
const settings = new schema.Array(setting);
node.define({ children, settings });

export const normalizeTree = R.partial(normalize, [{node}]);

// TODO
// export const denormalizeTree = R.partialRight(denormalize, [])
