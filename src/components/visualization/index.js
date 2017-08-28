//! Wrapper around the visualization's core that only loads once `redux-form` has been initialized.

import React from 'react';
import { connect } from 'react-redux';

import { setStageContainerSize } from 'src/actions/stage';
import VizCanvas from './VizCanvas';

const Vizualization = ({enginePointer, setStageContainerSize}) => (
  <div style={{marginBottom: 20, height: '100%', width: '100%'}}>
    <VizCanvas />
  </div>
);

const mapStateToProps = ({ enginePointer }) => ({ enginePointer: enginePointer.pointer });

export default connect(mapStateToProps, {setStageContainerSize})(Vizualization);
