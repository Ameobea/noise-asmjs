/**
 * Creates a set of input fields for setting the weights of the individual noise modules of a composed noise module
 * making use of the weighted average composition scheme.
 */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { Input } from 'semantic-ui-react';

import { getLeafAttrById, getSiblingIds } from 'src/selectors/compositionTree';

class AverageWeights extends React.Component {
  componentWillMount() {
    this.updateSettings(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.updateSettings(nextProps);
  }

  /**
   * If noise modules are added or removed from the parent composed noise module, then the values that are stored in
   * Redux need to be updated to account for that.  This function creates the new `value` object based on the current
   * state of the composed module's children and sets it into Redux.
   */
  updateSettings = props => {
    const { value, parentNodeId, nodes, onChange } = props;

    // We're given `parentNodeId` which is the id of the Composition Scheme, but we need to get the id of its parent in
    // order to determine the number of child nodes that it has.
    const siblingIds = getSiblingIds(nodes, parentNodeId);
    const defaultSettings = siblingIds.reduce( (acc, id) => ({...acc, [id]: 0}), {});

    // TODO: handle the fact that the composition scheme is being counted among the children of the composed noise module
    // TODO: remove values if noise modules are removed.

    if(R.keys(value).length !== siblingIds.length) {
      // This is the first render or a new child module has been added, so we should update the state now.
      onChange({...defaultSettings, ...value});
    }
  }

  render() {
    const { value, onChange: handleParentChange, nodes: allNodes, settings: allSettings } = this.props;

    // Create input fields mapped to each of the children of the composed noise module
    const inputs = R.keys(value).map(key => {
      const title = getLeafAttrById(allNodes, allSettings, key, 'title');

      return (
        <div key={key}>
          { title }
          <Input
            value={value[key]}
            onChange={(e, inputProps) => handleParentChange({...value, [key]: inputProps.value})}
          />
        </div>
      );
    });

    return (
      <div>
        { inputs }
      </div>
    );
  }
}

const mapState = ({ compositionTree: { entities: { nodes, settings } } }) => ({ nodes, settings });

export default connect(mapState)(AverageWeights);
