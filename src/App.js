import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'semantic-ui-react';
import ReactResizeDetector from 'react-resize-detector';

import { setMaxStageSize } from 'src/actions/stage';
import VizHeader from 'src/components/VizHeader';
import Visualization from 'src/components/visualization';
import VizSettings from 'src/components/VizSettings';
import 'src/index.css';

const { Column, Row } = Grid;

// given a HTML element, returns its height and width.
const measureElementSizeChange = element => ({
  height: element.clientHeight,
  width: element.clientWidth,
});

// returns another function that accepts an element and calls the provided action dispatcher with its height and width
const handleSizeChange = actionDispatcher => {
  return element => {
    const {height, width} = measureElementSizeChange(element);
    actionDispatcher(height, width);
  };
};

const App = ({settingsVisible, setMaxStageSize}) => (
  <div style={{width: '100%', height: '100%'}} ref={handleSizeChange(setMaxStageSize)} >
    <ReactResizeDetector handleWidth handleHeight onResize={setMaxStageSize} />

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

export default connect(mapState, {setMaxStageSize})(App);
