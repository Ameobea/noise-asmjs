import React from 'react';
import { connect } from 'react-redux';

import VizHeader from 'src/components/VizHeader';
import CoreRouter from 'src/Router';
import 'src/index.css';

const App = ({ settingsVisible }) => (
  <div style={{width: '100%', height: '100%'}}>
    {/* HEADER */}
    <div style={{height: '10vh'}}>
      <VizHeader />
    </div>

    <CoreRouter />
  </div>
);

const mapState = ({ settingsVisible }) => ({ settingsVisible });

export default connect(mapState)(App);
