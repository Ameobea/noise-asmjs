/**
 * Defines the GUI component for viewing and editing the settings for individual nodes of the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';

import { getNodeData, getLeafAttr } from 'src/data/compositionTree/nodeTypes';
import { SettingGui } from 'src/data/moduleSettings';
import { mapIdsToEntites } from 'src/helpers/compositionTree';

const LeafEditor = ({ selectedNode, allNodes, allSettings }) => {
  if(!selectedNode) {
    return <div />;
  }

  const { type, settings } = allNodes[selectedNode];
  const mappedSettings = mapIdsToEntites(allSettings, settings);

  const nodeSchema = getNodeData(type);
  if(!nodeSchema) {
    console.error(`No node schema for node of type ${type}`);
  }

  /**
   * Here, we determine if this module's settings have to be modified based on the update value of this action's setting.
   * For example, if the `moduleType` is changed from 'Fbm' to 'Constant', all of the multifactal settings have to be
   * removed.  This is accomplished by passing the current settings into the node definition's settings function (if it
   * has one) and filtering out any values that aren't present.
  */
  const realSettingNames = getLeafAttr('settings', nodeSchema, mappedSettings);
  const filteredMappedSettings = mappedSettings.filter( ({ key }) => realSettingNames.includes(key) );

  return (
    <div>
      <h1>{nodeSchema.name}</h1>
      <p>{nodeSchema.description}</p>

      <h1>Settings</h1>
      {
        filteredMappedSettings.map( ({id, key, value}) => (
          <SettingGui
            id={id}
            key={id}
            name={key}
          />
        ))
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
