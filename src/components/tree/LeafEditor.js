/**
 * Defines the GUI component for viewing and editing the settings for individual nodes of the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { Button } from 'semantic-ui-react';

import { getNodeData } from 'src/data/compositionTree/nodeTypes';
import { SettingGui } from 'src/data/moduleSettings';
import { mapIdsToEntites } from 'src/helpers/compositionTree/util';
import { HelpPopup } from 'src/data/moduleSettings';
import { getLeafAttr } from 'src/selectors/compositionTree';
import NodeActionButtons from 'src/components/tree/NodeActionButtons';
import { pause, resume } from 'src/interop';

const LeafEditor = ({ selectedNodeId, allNodes, allSettings }) => {
  if(!selectedNodeId) {
    return <div />;
  }

  const { type, settings } = allNodes[selectedNodeId];
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
  const canBeDeleted = getLeafAttr('canBeDeleted', nodeSchema, mappedSettings);
  const newChildDefinition = getLeafAttr('newChildDefinition', nodeSchema, mappedSettings);

  return (
    <div>
      <div style={{paddingBottom: 5, borderBottom: '1px solid #aaa'}}>
        <HelpPopup helpContent={nodeSchema.description} style={{verticalAlign: 'super'}} />
        <h1 style={{display: 'inline', marginTop: 5}}>{nodeSchema.name}</h1>
      </div>

      <NodeActionButtons
        newChildDefinition={newChildDefinition}
        canBeDeleted={canBeDeleted}
        nodeId={selectedNodeId}
      />

      <h1 style={{marginTop: 5}}>Settings</h1>
      {
        filteredMappedSettings.map( ({id, key, value}) => (
          <SettingGui
            id={id}
            key={id}
            name={key}
          />
        ))
      }

      <h1>Simulation Controls</h1>
      <center>
        <Button inverted color='yellow' onClick={pause}> Pause </Button>
        <Button inverted color='pink' onClick={resume}> Resume </Button>
      </center>
    </div>
  );
};

const mapState = ({ compositionTree: { selectedNode, entities: { nodes, settings } } }) => ({
  selectedNodeId: selectedNode,
  allNodes: nodes,
  allSettings: settings,
});

export default connect(mapState)(LeafEditor);
