/**
 * Constructs a GUI component that renders a button that, when clicked, adds a new child to the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { Button } from 'semantic-ui-react';

import { addNode, deleteNode } from 'src/actions/compositionTree';

const buttonStyle = { marginTop: 10 };

const AddChildButton = ({ parentId, childDefinition, childIndex=0, addNode }) => (
  <div style={buttonStyle}>
    <Button inverted color='blue' onClick={R.partial(addNode, [parentId, childIndex, childDefinition])}>
      Add Child Node
    </Button>
  </div>
);

const DeleteChildButton = ({ nodeId, deleteNode }) => (
  <div style={buttonStyle}>
    <Button inverted color='red' onClick={R.partial(deleteNode, [nodeId])} >
      Delete This Node
    </Button>
  </div>
);

const NodeActionButtons = ({ newChildDefinition, canBeDeleted, nodeId, addNode, deleteNode }) => (
  <center style={{marginBottom: 10}}>
    { newChildDefinition && <AddChildButton parentId={nodeId} childDefinition={newChildDefinition} addNode={addNode} /> }
    { canBeDeleted && <DeleteChildButton nodeId={nodeId} deleteNode={deleteNode} /> }
  </center>
);

export default connect(R.identity, { addNode, deleteNode })(NodeActionButtons);
