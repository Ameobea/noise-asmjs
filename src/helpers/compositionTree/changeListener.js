/**
 * Monitors the composition tree for changes caused by setting changes or node modifications and handles
 * parent subscriptions.  Once the tree has stabilized and its structure is completely valid, the changes
 * are collected and committed onto the backend's tree.
 */

import R from 'ramda';
import diff from 'deep-diff';
import listen from 'listate';
import { getIn, set } from 'zaphod/compat';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import {
  addUncommitedChanges, clearPostCommit, commitChanges, updateNode
} from 'src/actions/compositionTree';
import { getNodeParent, getSettingParent } from 'src/selectors/compositionTree';
import { initialUncommitedChanges } from 'src/helpers/compositionTree/util';

const handleChanges = ({ current, prev, data: { store } }, recursionDepth) => {
  const { compositionTree: { postCommit } } = store.getState();
  if(postCommit) {
    // This is the first diff after a commit+garbage collect, so the tree is already reconciled with the backend
    // and this diff should be ignored.
    store.dispatch(clearPostCommit());
    return;
  }

  const calculatedDiff = diff(prev, current);

  if(!calculatedDiff) { return; }

  const newUncommitedChanges = calculatedDiff.reduce((acc, { kind, path }) => {
    switch(kind) {

    case 'N': {
      if(path[0] === 'nodes') {
        return set(acc, 'new', R.union([path[1]], acc.new));
      } else {
        // find the parent of the setting that changed and mark it as updated
        const { id: updatedNodeId } = getSettingParent(current.nodes, path[1]);
        return set(acc, 'updated', R.union([updatedNodeId], acc.updated));
      }
    }

    case 'A':
    case 'E': {
      // console.log(kind, path);
      if(path[0] === 'nodes' && R.nth(-1, path) === 'children') {
        const prevChildren = getIn(prev, path);
        const curChildren = getIn(current, path);
        const parentNode = prev.nodes[path[1]];

        const changedNodeData = R.symmetricDifference(curChildren, prevChildren);

        // TODO: handle when children are added/removed from non-noise modules
        if(curChildren.length < prevChildren.length) {
          return {...acc,
            // updated: R.union([path[1]], acc.updated),
            deleted: R.union(
              changedNodeData.map( id => ({ id, parentId: parentNode.id, index: parentNode.children.indexOf(id) }) ),
              acc.deleted
            ),
          };
        } else {
          return {...acc,
            // updated: R.union([path[1]], acc.updated),
            new: R.union(changedNodeData, acc.new),
          };
        }
      } else if(path[0] === 'settings') {
        const parentNode = getSettingParent(current.nodes, path[1]);
        return set(acc, 'updated', R.union([parentNode.id], acc.updated));
      } else {
        return acc;
      }
    }

    case 'D': {
      if(path[0] === 'nodes') {
        const parentNode = getNodeParent(prev.nodes, path[1]);

        if(parentNode) {
          return {...acc,
            // updated: R.union([parentNode.id], acc.updated),
            deleted: R.union([{
              id: path[1],
              parentId: parentNode.id,
              index: parentNode.children.indexOf(path[1])
            }], acc.deleted),
          };
        } else {
          console.error(`No parent node found for node with id ${path[1]}.`);
          return acc;
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

  store.dispatch(addUncommitedChanges(newUncommitedChanges));

  // process any pending subscriptions of the changed nodes
  newUncommitedChanges.updated.forEach(id => {
    R.values(current.nodes[id].children)
      .filter(childId => !!current.nodes[childId])
      .forEach(childId => {
        if(getNodeData(current.nodes[childId].type).dependentOnParent) {
          store.dispatch(updateNode(childId));
        }
      });
  });

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
