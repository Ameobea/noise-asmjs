/**
 * Main noise function composition view with composition tree, leaf editor, and
 * visualization canvas.
 */

import React from 'react';
import { Grid } from 'semantic-ui-react';

import Visualization from 'src/components/visualization';
import CompositionTreeGUI from 'src/components/tree';

const { Column, Row } = Grid;

export default () => (
  <Grid relaxed>
    <Row>
      <Column computer={10} mobile={16}>
        {/* MAIN VISUALIZATION CONTENT */}
        <Visualization />
      </Column>

      <Column computer={6} mobile={16}>
        {/* MAIN SETTINGS / GUI */}
        <CompositionTreeGUI />
      </Column>
    </Row>
  </Grid>
);
