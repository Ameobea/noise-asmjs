/**
 * Defines data about all possible node types in the composition tree.  Each node must have the following attributes:
 *  - name: The name of the node as displayed to the user.  The key is sent to the backend and used for serialization.
 *  - description: An explanation of what this node does, displayed to the user.
 *  - settings: An array of names of configurations that can be set for this node.
                These are defined in `./nodeSettingDefinitions.js`.
 * - isLeaf: Boolean or function.  If function, it should take an object of {settingName : value} and return a boolean.
 */

export default {
  'root': {
    name: 'Root Node',
    description: 'The root of the entire composition tree.  This node and all of its children are queried each tick to determine the noise values for each coordinate of the canvas.',
    settings: ['moduleType'],
    isLeaf: settings => !(settings.moduleType === 'composed'), // Only has children if it's a composed module
  }
};
