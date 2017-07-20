/**
 * Transforms a nested tree definition into the normalized format suitable for storage into the Redux store.
 */

import R from 'ramda';

import { normalize, schema } from 'normalizr';

const node = new schema.Entity('nodes');

const setting = new schema.Entity('settings', {
  children: [ node ],
});

node.define({
  children: [ node ],
  settings: [ setting ],
});

export const normalizeTree = R.partialRight(normalize, [node]);
