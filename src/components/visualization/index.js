//! Wrapper around the visualization's core that only loads once `redux-form` has been initialized.

import React from 'react';
import { connect } from 'react-redux';
import ReactResizeDetector from 'react-resize-detector';

import { setStageContainerSize } from 'src/actions/stage';
import VizCanvas from './VizCanvas';

// given a HTML element, returns its height and width.
const measureElementSizeChange = element => ({
  height: element.clientHeight,
  width: element.clientWidth,
});

// returns another function that accepts an element and calls the provided action dispatcher with its height and width
const handleSizeChange = actionDispatcher => {
  return element => {
    if(!element){
      return;
    }

    const {height, width} = measureElementSizeChange(element);
    actionDispatcher(height, width);
  };
};

const Vizualization = ({enginePointer, setStageContainerSize}) => (
  <div style={{marginBottom: 20, height: '100%', width: '100%'}} ref={handleSizeChange(setStageContainerSize)}>
    <ReactResizeDetector handleWidth handleHeight onResize={setStageContainerSize} />
    <VizCanvas />
  </div>
);

const mapStateToProps = state => ({
  enginePointer: state.enginePointer.pointer,
});

export default connect(mapStateToProps, {setStageContainerSize})(Vizualization);
