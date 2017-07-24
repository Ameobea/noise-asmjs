/**
 * Creates a set of input fields for setting the weights of the individual noise modules of a composed noise module
 * making use of the weighted average composition scheme.
 */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { Input } from 'semantic-ui-react';

import { getLeafAttrById } from 'src/selectors/compositionTree';

const AverageWeights = () => {
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
};

const mapState = ({ compositionTree: { entities: { nodes, settings } } }) => ({ nodes, settings });

export default connect(mapState)(AverageWeights);
