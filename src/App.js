import React from 'react';
import { connect } from 'react-redux';
import { Button, Container, Grid, Menu, Segment, Sidebar } from 'semantic-ui-react';
import ReactResizeDetector from 'react-resize-detector';

import { toggleSettings } from './actions/settings';
import { setMaxStageSize } from './actions/stage';
import { SHOWN } from './reducers/settings';

import VizHeader from './components/VizHeader';
import Visualization from './components/visualization';
import VizSettings from './components/settings/VizSettings';
import './index.css';

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
    actionDispatcher(height, width)
  };
}

const App = ({settingsVisible, toggleSettings, setMaxStageSize}) => (
  <div style={{width: '100%', height: '100%', overflow: 'hidden'}} ref={handleSizeChange(setMaxStageSize)} >
    <ReactResizeDetector handleWidth handleHeight onResize={setMaxStageSize} />

    {/* HEADER */}
    <div style={{height: '10vh'}}>
      <VizHeader />
    </div>

    <Grid>
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

export default connect(mapState, {toggleSettings, setMaxStageSize})(App);
