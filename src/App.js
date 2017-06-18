import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'semantic-ui-react';

import VizHeader from 'src/components/VizHeader';
import Visualization from 'src/components/visualization';
import VizSettings from 'src/components/VizSettings';
import 'src/index.css';

const { Column, Row } = Grid;

const App = ({settingsVisible}) => (
  <div style={{width: '100%', height: '100%'}}>
    {/* HEADER */}
    <div style={{height: '10vh'}}>
      <VizHeader />
    </div>

    <Grid relaxed>
      <Row>
        <Column computer={10} mobile={16}>
          {/* MAIN VISUALIZATION CONTENT */}
          <Visualization />
        </Column>

        <Column computer={6} mobile={16}>
          {/* VISUALIZATION SETTINGS */}
          <VizSettings />
        </Column>
      </Row>
    </Grid>
  </div>
);

const mapState = state => ({
  settingsVisible: state.settingsVisible,
});

export default connect(mapState)(App);
