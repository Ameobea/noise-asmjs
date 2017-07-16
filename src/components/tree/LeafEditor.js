/**
 * Defines the GUI component for viewing and editing the settings for individual nodes of the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { SettingGui } from 'src/data/moduleSettings';

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
        settings.map(settingName => {
          const { id, key } = allSettings[settingName];

          return (
            <SettingGui
              id={id}
              key={id}
              name={key}
            />
          );
        })
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
