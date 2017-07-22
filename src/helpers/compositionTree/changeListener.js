/**
 * Monitors the composition tree for changes caused by setting changes or node modifications and handles
 * parent subscriptions.  Once the tree has stabilized and its structure is completely valid, the changes
 * are collected and committed onto the backend's tree.
 */

import R from 'ramda';
import diff from 'deep-diff';
import listen from 'listate';
import { set } from 'zaphod/compat';

import { addUncommitedChanges, clearUncommitedChanges } from 'src/actions/compositionTree';
import { getSettingParent } from 'src/selectors/compositionTree';
import { initialUncommitedChanges } from 'src/helpers/compositionTree/util';

const handleChanges = ({current, prev, data: { store }}) => {
  const calculatedDiff = diff(prev, current);
  if(!calculatedDiff) {
    return; // Apparently an empty diff returns `undefined`...
  }

  const uncommitedChanges = calculatedDiff.reduce((acc, { kind, path }) => {
    switch(kind) {

    case 'N': {
      if(path[0] === 'nodes') {
        return {...acc, new: R.union(acc.new, [path[1]])};
      } else {
        // find the parent of the setting that changed and mark it as updated
        const { id: updatedNodeId } = getSettingParent(current.nodes, path[1]);
        return {...acc, updated: R.union(acc.updated, [updatedNodeId])};
      }
    }

    case 'A':
    case 'E': {
      if(path[0] === 'settings') {
        // mark the parent of the setting as updated
        const { id: updatedNodeId } = getSettingParent(current.nodes, path[1]);
        return {...acc, updated: R.union(acc.updated, [updatedNodeId])};
      } else {
        return acc;
      }
    }

    case 'D': {
      if(path[0] === 'nodes') {
        return {...acc, deleted: R.union(acc.deleted, [path[1]])};
      } else {
        // mark the parent of the setting as updated
        const updatedNode = getSettingParent(current.nodes, path[1]);
        if(updatedNode) {
          return {...acc, updated: R.union(acc.updated, [updatedNode.id])};
        } else {
          // parent node was deleted along with this setting
          return acc;
        }
      }
    }

    default: {
      console.error(`unhandled diff of type ${kind}; `, path);
      return acc;
    }

    }
  }, initialUncommitedChanges());

  // TODO: process any pending subscriptions of the changed nodes
  // TOOD: somewhere, commit the changes to the backend composition tree

  // remove any node ids that are in `new` from `updated`
  const dedupedUncommitedChanges = set(uncommitedChanges, 'updated', R.without(uncommitedChanges.new, uncommitedChanges.updated));
  console.log(dedupedUncommitedChanges);
  store.dispatch(addUncommitedChanges(dedupedUncommitedChanges));
};

const createListener = store => ({
  handle: handleChanges,
  filter: ({ compositionTree: { entities } }) => entities,
  data: { store },
});

export const subscribeChanges = store => listen(store, createListener(store));
