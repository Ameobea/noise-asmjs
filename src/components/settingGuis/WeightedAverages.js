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
    // TODO: Remove this entire side effect and move it to the new subscription system.
    const { value, parentNodeId, nodes, onChange } = props;

    // We're given `parentNodeId` which is the id of the Composition Scheme, but we need to get the id of its parent in
    // order to determine the number of child nodes that it has.
    const siblingIds = getSiblingIds(nodes, parentNodeId);
    const defaultSettings = siblingIds.reduce((acc, id) => {
      if(props.nodes[id].type === 'noiseModule') {
        return {...acc, [id]: 0};
      } else {
        return acc;
      }
    }, {});

    if(R.keys(value).length !== R.keys(defaultSettings).length) {
      // This is the first render or a new child module has been added, so we should update the state now.
      onChange({...defaultSettings, ...R.pick(R.keys(defaultSettings), value)});
    }
  }

  render() {
    const { value, onChange: handleParentChange, nodes: allNodes, settings: allSettings } = this.props;

    // Create input fields mapped to each of the children of the composed noise module
    const inputs = R.keys(value)
      // Necessary because deleted nodes aren't actually removed from `value` until next render.
      .filter(key => !!this.props.nodes[key])
      .map(key => {
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

    return <div>{inputs}</div>;
  }
}

const mapState = ({ compositionTree: { entities: { nodes, settings } } }) => ({ nodes, settings });

export default connect(mapState)(AverageWeights);
