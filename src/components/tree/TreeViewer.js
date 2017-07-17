/**
 * Defines the tree viewer, showing a full view of the entire composition tree.
 */

import React from 'react';
import { connect } from 'react-redux';

import { BuiltTree } from 'src/helpers/compositionTree/util';

const TreeViewer = ({ nodes, settings }) => (
  <div>
    <BuiltTree allNodes={nodes} allSettings={settings} />
  </div>
);

const mapState = ({ compositionTree: { entities:  { nodes, settings } } }) => ({
  nodes, settings
});

export default connect(mapState)(TreeViewer);
