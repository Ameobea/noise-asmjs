/**
 * Monitors the composition tree for changes caused by setting changes or node modifications and handles
 * parent subscriptions.  Once the tree has stabilized and its structure is completely valid, the changes
 * are collected and committed onto the backend's tree.
 */

import R from 'ramda';
import diff from 'deep-diff';
import listen from 'listate';
import { set } from 'zaphod/compat';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import {
  addUncommitedChanges, commitChanges, updateNode
} from 'src/actions/compositionTree';
import { getNodeParent, getSettingParent } from 'src/selectors/compositionTree';
import { initialUncommitedChanges } from 'src/helpers/compositionTree/util';

const handleChanges = ({ current, prev, data: { store } }, recursionDepth) => {
  const calculatedDiff = diff(prev, current);

  if(!calculatedDiff) { return; }

  const newUncommitedChanges = calculatedDiff.reduce((acc, { kind, path }) => {
    switch(kind) {

    case 'N': {
      if(path[0] === 'nodes') {
        const parentNodeId = getNodeParent(current.nodes, path[1]).id;
        return {...acc, new: R.union([path[1]], acc.new), updated: R.union([parentNodeId], acc.updated)};
      } else {
        // find the parent of the setting that changed and mark it as updated
        const { id: updatedNodeId } = getSettingParent(current.nodes, path[1]);
        return {...acc, updated: R.union([updatedNodeId], acc.updated)};
      }
    }

    case 'A':
    case 'E': {
      if(path[0] === 'nodes') {
        // mark the parent of the node as updated
        const parentNode = getNodeParent(current.nodes, path[1]);
        if(parentNode) {
          return {...acc, updated: R.union([parentNode.id], acc.updated)};
        } else {
          return acc;
        }
      } else {
        // mark the parent of the setting as updated
        const { id: updatedNodeId } = getSettingParent(current.nodes, path[1]);
        return {...acc, updated: R.union([updatedNodeId], acc.updated)};
      }
    }

    case 'D': {
      if(path[0] === 'nodes') {
        // mark the parent of the node as updated
        const parentNode = getNodeParent(prev.nodes, path[1]);
        if(parentNode) {
          return {...acc,
            updated: R.union([parentNode.id], acc.updated),
            deleted: R.union([path[1]], acc.deleted)
          };
        } else {
          return {...acc, deleted: R.union([path[1]], acc.deleted)};
        }
      } else {
        // mark the parent of the setting as updated
        const updatedNode = getSettingParent(current.nodes, path[1]);
        if(updatedNode) {
          return {...acc, updated: R.union([updatedNode.id], acc.updated)};
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

  // remove any node ids that are in `new` from `updated`
  const dedupedUncommitedChanges = set(
    newUncommitedChanges,
    'updated',
    R.without(R.union(newUncommitedChanges.new, newUncommitedChanges.deleted), newUncommitedChanges.updated)
  );
  store.dispatch(addUncommitedChanges(dedupedUncommitedChanges));

  // process any pending subscriptions of the changed nodes
  dedupedUncommitedChanges.updated.forEach(id => {
    R.values(current.nodes[id].children)
      .filter(childId => !!current.nodes[childId])
      .forEach(childId => {
        if(getNodeData(current.nodes[childId].type).dependentOnParent) {
          store.dispatch(updateNode(childId));
        }
      });
  });

  const { pendingSideEffects: upToDatePendingSideEffects } = store.getState();

  if(recursionDepth === 1) {
    store.dispatch(commitChanges());
  }
};

var recursionDepth = 0;

const changeHandlerWrapper = diff => {
  recursionDepth += 1;
  handleChanges(diff, recursionDepth);
  recursionDepth -= 1;
};

const createListener = store => ({
  handle: changeHandlerWrapper,
  filter: ({ compositionTree: { entities } }) => entities,
  data: { store },
});

export const subscribeChanges = store => listen(store, createListener(store));
