/**
 * Defines the GUI component for viewing and editing the settings for individual nodes of the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { settingDefinitions } from 'src/data/moduleSettings';

const Setting = ({ settingName, value }) => (
  <div>
    <h2>{settingDefinitions[settingName].title || 'Unknown Setting'}</h2>
    TODO
  </div>
);

const LeafEditor = ({ selectedNode, allNodes, allSettings }) => {
  if(!selectedNode) {
    return <div />;
  }

  const { type, settings } = allNodes[selectedNode];
  const nodeSchema = getNodeData(type);

  return (
    <div>
      <h1>{nodeSchema.name}</h1>
      <p>{nodeSchema.description}</p>

      <h1>Settings</h1>
      {
        R.map( settingId => {
          const { key, value } = allSettings[settingId];
          return <Setting settingName={key} key={key} value={value} />;
        }, settings)
      }
    </div>
  );
};

const mapState = ({ compositionTree: { selectedNode, entities: { nodes, settings } } }) => ({
  selectedNode,
  allNodes: nodes,
  allSettings: settings,
});

export default connect(mapState)(LeafEditor);
