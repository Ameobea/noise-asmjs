/**
 * Manages the state for the composition tree and defines methods for interacting with it.
 */

import R from 'ramda';
import { set, setIn } from 'zaphod/compat';

import initialTree from 'src/data/compositionTree/initialTree';
import { normalizeTree } from 'src/helpers/compositionTree/normalization';
import { NULL_UUID } from 'src/data/misc';
import {
  ADD_NODE, DELETE_NODE, REPLACE_NODE, SELECT_NODE, SET_SETTING, CREATE_SETTING,
  ADD_UNCOMMITED_CHANGES, CLEAR_UNCOMMITED_CHANGES,
} from 'src/actions/compositionTree';
import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { createSetting, initialUncommitedChanges, mapIdsToEntites } from 'src/helpers/compositionTree/util';
import { settingDefinitions } from 'src/data/moduleSettings';
import { getLeafAttr, getNodeParent, getSettingByName } from 'src/selectors/compositionTree';

const initialState = R.merge(normalizeTree(initialTree), {
  selectedNode: NULL_UUID,
  uncommitedChanges: initialUncommitedChanges(),
});

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
    const { nodes: deletedNodes, settings: deletedSettings } = traverseNodes(state.entities.nodes, action.nodeId);

    return {...state,
      entities: {...state.entities,
        nodes: {...R.omit(deletedNodes, state.entities.nodes),
          [parentId]: {...state.entities.nodes[parentId],
            children: R.without([action.nodeId], parentChildren),
          },
        },
        settings: R.omit(deletedSettings, state.entities.settings),
      },
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

    // find the node that has this setting
    const ownerNodeId = R.keys(state.entities.nodes).filter(nodeId => {
      return state.entities.nodes[nodeId].settings.includes(action.settingId);
    });
    const ownerNodeSchema = getNodeData(state.entities.nodes[ownerNodeId].type);
    const mappedSettings = mapIdsToEntites(updatedSettings, state.entities.nodes[ownerNodeId].settings);
    const mappedChildren = mapIdsToEntites(state.entities.nodes, state.entities.nodes[ownerNodeId].children);

    const requiredSettingNames = getLeafAttr('settings', ownerNodeSchema, mappedSettings);
    // find the names of all settings that are required but not present in the current node
    const missingSettingNames = requiredSettingNames.filter( settingName => !getSettingByName(mappedSettings, settingName) );
    // create new settings for each of the missing ones
    const newSettings = missingSettingNames.map(settingName => {
      return createSetting(settingName, settingDefinitions[settingName].default || `NO DEFAULT FOR ${settingName}`);
    });

    // find any new nodes that have to be created as children to the parent node of the setting that just changed.
    const newChildren = ownerNodeSchema.newChildren ? ownerNodeSchema.newChildren(mappedSettings, mappedChildren) : [];
    const normalizedNewChildren = newChildren
      .map(newChild => normalizeTree(newChild))
      .reduce((acc, normalizedChild) => ({
        settings: {...acc.settings, ...normalizedChild.entities.settings},
        nodes: {...acc.nodes, ...normalizedChild.entities.nodes},
      }), { settings: {}, children: {} });

    // add the newly created settings into the state and add their ids to the owner node's settings list.
    return {...state,
      entities: {...state.entities,
        settings: {...updatedSettings,
          // add all new settings created in response to this setting being changed
          ...newSettings.reduce((acc, setting) => ({...acc, [setting.id]: setting}), {}),
          // also add all new settings created by children created in response to this setting being changed
          ...normalizedNewChildren.settings,
        },
        nodes: {...state.entities.nodes,
          [ownerNodeId]: {...state.entities.nodes[ownerNodeId],
            settings: [...state.entities.nodes[ownerNodeId].settings, ...R.map(R.prop('id'), newSettings)],
            children: [...state.entities.nodes[ownerNodeId].children, ...newChildren.map(R.prop('id'))],
          },
          ...normalizedNewChildren.nodes,
        },
      },
    };
  }

  case CREATE_SETTING: {
    return setIn(state, ['entities', 'settings', action.id], {id: action.id, key: action.key, value: action.valuue});
  }

  case ADD_UNCOMMITED_CHANGES: {
    // TODO: It may be necessary to trim children of new nodes from the `new` list and only retain the root of new subtrees
    return set(state, 'uncommitedChanges', R.mergeWith(R.union, state.uncommitedChanges, action.changes));
  }

  case CLEAR_UNCOMMITED_CHANGES: {
    return {...state, uncommitedChanges: initialUncommitedChanges()};
  }

  default: {
    return state;
  }

  }

};
