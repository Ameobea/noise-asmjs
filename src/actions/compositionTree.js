/**
 * Defines actions for interacting with the composition tree.
 */

// Args: {parentId: UUID, childIndex: Number, nodeDef: NodeDefinition}
export const ADD_NODE = 'ADD_NODE';
// Args: {nodeId: UUID}
export const DELETE_NODE = 'DELETE_NODE';
// Args: {nodeId: UUID, nodeDef: NodeDefinition}
export const REPLACE_NODE = 'REPLACE_NODE';
// Args: {nodeId: UUID}
export const SELECT_NODE = 'SELECT_NODE';
// Args: {nodeId: UUID, name: String, value: Any}
export const SET_SETTING = 'SET_SETTING';

export const addNode = (parentId, childIndex, nodeDef) => ({
  type: ADD_NODE,
  parentId, childIndex, nodeDef,
});

export const deleteNode = nodeId => ({
  type: DELETE_NODE,
  nodeId,
});

export const replaceNode = (nodeId, nodeDef) => ({
  type: REPLACE_NODE,
  nodeId, nodeDef,
});

export const selectNode = nodeId => ({
  type: SELECT_NODE,
  nodeId,
});

export const setSetting = (settingId, value) => ({
  type: SET_SETTING,
  settingId, value,
});
