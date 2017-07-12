/**
 * The wrapper around the entire GUI for viewing and interacting with the composition tree.  Consists of two parts: The tree
 * viewer and the leaf editor.  The tree viewer shows a full representation of the entire composition tree and allows selection
 * of nodes to drill down on the leaf editor.  The leaf editor contains node-specific configuration settings and allows them
 * to be edited dynamically.
 */

import React from 'react';
import { Grid } from 'semantic-ui-react';

import TreeViewer from 'src/components/tree/TreeViewer';
import LeafEditor from 'src/components/tree/LeafEditor';

const { Row, Column } = Grid;

const CompositionTreeGUI = () => (
  <div style={{marginRight: 20}}>
    <Grid columns={2}>
      <Row>
        <Column>
          <TreeViewer />
        </Column>
        <Column>
          <LeafEditor />
        </Column>
      </Row>
    </Grid>
  </div>
);

export default CompositionTreeGUI;
