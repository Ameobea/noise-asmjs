/**
 * Constructs a GUI component that renders a button that, when clicked, adds a new child to the composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { Button } from 'semantic-ui-react';

import { addNode, deleteNode } from 'src/actions/compositionTree';

const UnconnectedAddChildButton = ({ parentId, childDefinition, childIndex=0, addNode }) => (
  <Button inverted color='blue' onClick={R.partial(addNode, [parentId, childIndex, childDefinition])}>
    Add Child Node
  </Button>
);

export const AddChildButton = connect(R.identity, { addNode })(UnconnectedAddChildButton);

const UnconnectedDeleteChildButton = ({ nodeId, deleteNode }) => (
  <Button inverted color='red' onClick={R.partial(deleteNode, [nodeId])} >
    Delete This Node
  </Button>
);

export const DeleteChildButton = connect(R.identity, { deleteNode })(UnconnectedDeleteChildButton);
