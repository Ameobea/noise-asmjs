/**
 * Defines user-configuratble settings which can define attributes of a node.  Each configuration definition contains
 * everything necessary to store the configured value, construct a GUI for the user to change it, and serialize the
 * selected value into the format expected by the backend.
 *
 * Each definition must contain the following fields:
 *  - name: The name of the setting, as displayed to the user.
 *  - description: An explanation of what the setting changes and what effect different values will have on the node.
 *  - default: The initial value which will be set for the setting
 *  - component: A React component that is used to create the GUI for changing the setting.  Accepts the following props:
 *    - value: The currently selected value for this setting
 *    - onChange: A function that should be called with the new value every time the user selects a new value.
 *  - serializer: Converts `value` into the format expected by the backend.  If falsey, `R.identity` is used.
 */

export default {

};
