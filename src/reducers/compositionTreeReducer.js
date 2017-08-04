/**
 * Manages the state for the composition tree and defines methods for interacting with it.
 */

import R from 'ramda';
import { set, setIn } from 'zaphod/compat';

import initialTree from 'src/data/compositionTree/initialTree';
import { normalizeTree } from 'src/helpers/compositionTree/normalization';
import { commitChanges } from 'src/helpers/compositionTree/commit';
import { NULL_UUID } from 'src/data/misc';
import {
  ADD_NODE, DELETE_NODE, REPLACE_NODE, SELECT_NODE, SET_SETTING, CREATE_SETTING,
  ADD_UNCOMMITED_CHANGES, COMMIT_CHANGES, UPDATE_NODE, CLEAR_POST_COMMIT,
} from 'src/actions/compositionTree';
import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { createSetting, initialUncommitedChanges, mapIdsToEntites } from 'src/helpers/compositionTree/util';
import { settingDefinitions } from 'src/data/moduleSettings';
import { getLeafAttr, getNodeParent, getSettingByName } from 'src/selectors/compositionTree';

const initialState = R.merge(normalizeTree(initialTree), {
  selectedNode: NULL_UUID,
  uncommitedChanges: initialUncommitedChanges(),
  pendingSideEffects: 0,
  postCommit: false,
});

const calcChildrenModifications = (schema, mappedSettings, mappedChildren) => {
  const { newChildren, deletedChildrenTypes } = schema.newChildren
    ? schema.newChildren(mappedSettings, mappedChildren)
    : { newChildren: [], deletedChildrenTypes: [] };

  const normalizedNewChildren = newChildren
    .map(newChild => normalizeTree(newChild))
    .reduce((acc, normalizedChild) => ({
      settings: R.merge(acc.settings, normalizedChild.entities.settings),
      nodes: R.merge(acc.nodes, normalizedChild.entities.nodes),
    }), { settings: {}, children: {} });

  return { newChildren, deletedChildrenTypes, normalizedNewChildren };
};

const getMissingSettingNames = (schema, mappedSettings) => {
  const requiredSettingNames = getLeafAttr('settings', schema, mappedSettings);
  // find the names of all settings that are required but not present in the current node
  return requiredSettingNames.filter( settingName => !getSettingByName(mappedSettings, settingName) );
};

const getDeletedEntities = (deletedChildrenTypes, allNodes, mappedChildren) => {
  // determine if any child nodes need to be deleted
  const deletedSubtreeIds = deletedChildrenTypes
    .reduce((acc, deletedType) => {
      const matchedChild = mappedChildren.find( ({ type }) => type === deletedType);
      if(matchedChild) {
        return [...acc, matchedChild.id];
      } else {
        return acc;
      }
    }, []);

  // traverse the subtrees of all nodes that need to be deleted and collect their node and setting ids
  return deletedSubtreeIds.reduce((acc, subtreeNodeId) => {
    const { nodes: deletedNodeIds, settings: deletedSettingIds } = traverseNodes(allNodes, subtreeNodeId);
    return {
      deletedNodeIds: R.concat(acc.deletedNodeIds, deletedNodeIds),
      deletedSettingIds: R.concat(acc.deletedSettingIds, deletedSettingIds),
    };
  }, { deletedNodeIds: [], deletedSettingIds: [] });
};

const getNewSettings = (schema, mappedSettings) => {
  const missingSettingNames = getMissingSettingNames(schema, mappedSettings);
  // create new settings for each of the missing ones
  return missingSettingNames.map(settingName => {
    return createSetting(settingName, settingDefinitions[settingName].default || `NO DEFAULT FOR ${settingName}`);
  });
};

const updateTree = (state, updatedSettings, ownerNodeId) => {
  const ownerNodeSchema = getNodeData(state.entities.nodes[ownerNodeId].type);
  const mappedSettings = mapIdsToEntites(updatedSettings, state.entities.nodes[ownerNodeId].settings);
  const mappedChildren = mapIdsToEntites(state.entities.nodes, state.entities.nodes[ownerNodeId].children);

  const newSettings = getNewSettings(ownerNodeSchema, mappedSettings);
  const parentNode = getNodeParent(state.entities.nodes, ownerNodeId);
  const changedSettings = getLeafAttr(
    'changedSettings', ownerNodeSchema, R.concat(mappedSettings, newSettings), parentNode, state.entities.nodes, state.entities.settings
  ) || {};

  // find any new nodes that have to be created as children to the parent node of the setting that just changed.
  const {
    newChildren, deletedChildrenTypes, normalizedNewChildren
  } = calcChildrenModifications(ownerNodeSchema, mappedSettings, mappedChildren);

  // traverse the subtrees of all nodes that need to be deleted and collect their node and setting ids
  const { deletedNodeIds, deletedSettingIds } = getDeletedEntities(deletedChildrenTypes, state.entities.nodes, mappedChildren);

  // add the newly created settings into the state and add their ids to the owner node's settings list.
  return {...state,
    entities: {...state.entities,
      // Remove settings from the deleted subtree to avoid "memory leak"
      settings: R.merge({...R.omit(deletedSettingIds, updatedSettings),
        ...newSettings.reduce((acc, setting) => ({...acc, [setting.id]: setting}), {}),
        ...normalizedNewChildren.settings,
      }, changedSettings),
      // Deleted nodes are not actually removed from the store, but their ids are removed from the children list of their parent.
      // Nodes are actually deleted from the store to avoid "memory leak" after being commited to the backend.
      nodes: {...state.entities.nodes,
        [ownerNodeId]: {...state.entities.nodes[ownerNodeId],
          settings: R.union([
            ...R.without(deletedSettingIds, state.entities.nodes[ownerNodeId].settings),
            ...newSettings.map(R.prop('id')),
          ], R.keys(changedSettings)),
          children: [
            ...R.without(deletedNodeIds, state.entities.nodes[ownerNodeId].children),
            ...newChildren.map(R.prop('id'))
          ],
        },
        ...normalizedNewChildren.nodes,
      },
    },
  };
};

/**
 * Recursively collects an array of all children and settings of the node with the provided ID.
 */
const traverseNodes = (allNodes, nodeId) => {
  return allNodes[nodeId].children.reduce((acc, childId) => {
    // collect the children and settings of the entire subtree defined by this current child.
    const { nodes: subtreeNodes, settings: subtreeSettings } = traverseNodes(allNodes, childId);

    return {
      nodes: [...acc.nodes, childId, ...subtreeNodes],
      settings: [...acc.settings, ...allNodes[childId].settings, ...subtreeSettings],
    };
  }, { nodes: [nodeId], settings: allNodes[nodeId].settings });
};

export default (state=initialState, action={}) => {
  switch(action.type) {

  case ADD_NODE: {
    const { entities: { nodes, settings } } = normalizeTree(action.nodeDef);

    return {...state,
      entities: {...state.entities,
        nodes: {...state.entities.nodes,
          ...nodes,
          [action.parentId]: {...state.entities.nodes[action.parentId],
            children: [...state.entities.nodes[action.parentId].children, action.nodeDef.id],
          },
        },
        settings: R.merge(state.entities.settings, settings),
      },
    };
  }

  /**
   * The node is removed from the children of its parent.  Its settings and children (and their settings and children etc.)
   * are recursively deleted as well.
   */
  case DELETE_NODE: {
    const { id: parentId, children: parentChildren } = getNodeParent(state.entities.nodes, action.nodeId);

    return {
      ...setIn(state, ['entities', 'nodes', parentId, 'children'], R.without([action.nodeId], parentChildren)),
      selectedNode: parentId,
    };
  }

  case REPLACE_NODE: {
    // TODO
    return state;
  }

  case SELECT_NODE: {
    return {...state,
      selectedNode: action.nodeId
    };
  }

  case SET_SETTING: {
    const updatedSettings = setIn(state.entities.settings, [action.settingId, 'value'], action.value);

    /**
     * Check to see if this setting change has made it necessary for new settings to be created.  This is accomplished by
     * running the new settings through the module's definition's setting generator function (if it has one) and finding
     * all setting names that aren't currently included.  For each of those setting names, a new setting is created and
     * added to the node.
     */

    const ownerNodeId = R.keys(state.entities.nodes).find(nodeId => {
      return state.entities.nodes[nodeId].settings.includes(action.settingId);
    });

    return updateTree(state, updatedSettings, ownerNodeId);
  }

  case CREATE_SETTING: {
    return setIn(state, ['entities', 'settings', action.id], {id: action.id, key: action.key, value: action.valuue});
  }

  case ADD_UNCOMMITED_CHANGES: {
    const mergedChanges = R.mergeWith(R.union, state.uncommitedChanges, action.changes);

    const dedupedChanges = {
      new: (function() {
        const mappedCreatedNodes = mapIdsToEntites(state.entities.nodes, action.changes.new);
        return action.changes.new.filter(id => {
          // if any other created node has this node as a child, it's not the root of its created sutree.
          return !mappedCreatedNodes.find( ({ children }) => children.includes(id) );
        });
      })(),
      // remove any node ids that are in `new` from `updated`
      updated: R.without(R.union(mergedChanges.new, mergedChanges.deleted), mergedChanges.updated),
      // remove any node IDs from the list that have parents that are also in the list of deleted nodes, retaining
      // only those that are at the root of their respective deleted subtree.
      deleted: (function() {
        const mappedDeletedNodes = mapIdsToEntites(state.entities.nodes, mergedChanges.deleted.map(R.prop('id')));

        return mergedChanges.deleted.filter( ({ id }) => {
          // if any other deleted node has this node as a child, it's not the root of its deleted sutree.
          return !mappedDeletedNodes.find( ({ children }) => children.includes(id) );
        } );
      })(),
    };

    return set(state, 'uncommitedChanges', dedupedChanges);
  }

  case COMMIT_CHANGES: {
    // Commit these changes to the backend, mutating the interior composition tree
    commitChanges(state.entities, state.uncommitedChanges);

    return {...state,
      // Now that we've commited the changes, we can "garbage collect" the deleted nodes (and all their children/settings).
      entities: (function() {
        const { nodes: deletedNodesData, settings: deletedSettingIds } = state.uncommitedChanges.deleted
          .reduce( (acc, { id: deletedSubtreeRootNodeId }) => {
            return R.mergeWith(R.union, acc, traverseNodes(state.entities.nodes, deletedSubtreeRootNodeId));
          }, { nodes: [], settings: [] });

        return {...state.entities,
          nodes: R.omit(deletedNodesData.map(R.prop('id')), state.entities.nodes),
          settings: R.omit(deletedSettingIds, state.entities.settings),
        };
      })(),
      uncommitedChanges: initialUncommitedChanges(),
      // let the diff listener know that we've just commited+garbage collected and to ignore the next diff
      postCommit: true,
    };
  }

  case CLEAR_POST_COMMIT: {
    return set(state, 'postCommit', false);
  }

  /**
   * Recalculate the node's settings and children using its schema and update the store with the calculated values.
   */
  case UPDATE_NODE: {
    return updateTree(state, state.entities.settings, action.id);
  }

  default: {
    return state;
  }

  }

};
