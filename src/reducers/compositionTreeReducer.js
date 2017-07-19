/**
 * Manages the state for the composition tree and defines methods for interacting with it.
 */

import R from 'ramda';
import { setIn } from 'zaphod/compat';

import initialTree from 'src/data/compositionTree/initialTree';
import { normalizeTree } from 'src/helpers/compositionTree/normalization';
import { NULL_UUID } from 'src/data/misc';
import {
  ADD_NODE, DELETE_NODE, REPLACE_NODE, SELECT_NODE, SET_SETTING, CREATE_SETTING
} from 'src/actions/compositionTree';
import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { createSetting, mapIdsToEntites } from 'src/helpers/compositionTree/util';
import { settingDefinitions } from 'src/data/moduleSettings';
import { getLeafAttr, getSettingByName } from 'src/selectors/compositionTree';

const initialState = R.merge(normalizeTree(initialTree), {selectedNode: NULL_UUID});

export default (state=initialState, action={}) => {
  switch(action.type) {

  case ADD_NODE: {
    // TODO
    return state;
  }

  case DELETE_NODE: {
    // TODO
    return state;
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

    const requiredSettingNames = getLeafAttr('settings', ownerNodeSchema, mappedSettings);
    // find the names of all settings that are required but not present in the current node
    const missingSettingNames = requiredSettingNames.filter( settingName => !getSettingByName(mappedSettings, settingName) );
    // create new settings for each of the missing ones
    const newSettings = missingSettingNames.map(settingName => {
      return createSetting(settingName, settingDefinitions[settingName].default || `NO DEFAULT FOR ${settingName}`);
    });

    // add the newly created settings into the state and add their ids to the owner node's settings list.
    return {...state,
      entities: {...state.entities,
        settings: {...updatedSettings,
          ...newSettings.reduce((acc, setting) => ({...acc, [setting.id]: setting}), {})
        },
        nodes: {...state.entities.nodes,
          [ownerNodeId]: {...state.entities.nodes[ownerNodeId],
            settings: [...state.entities.nodes[ownerNodeId].settings, ...R.map(R.prop('id'), newSettings)],
          },
        },
      },
    };
  }

  case CREATE_SETTING: {
    return setIn(state, ['entities', 'settings', action.id], {id: action.id, key: action.key, value: action.valuue});
  }

  default: {
    return state;
  }

  }

};
