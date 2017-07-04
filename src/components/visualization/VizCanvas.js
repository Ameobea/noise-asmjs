//! Creates the canvas that holds the actual visualization.

/* global Module */

import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { getEnginePointer } from 'src/selectors/enginePointer';
import { getTrueCanvasSize } from 'src/selectors/stageSize';

class VizCanvas extends React.Component {
  // Add a reference to the canvas to the `Module` every time we render
  connectModule = canvas => {
    this.setState({canvas});

    Module.canvas = (function() {
      var canvas;
      while(!canvas) { // wait until React has loaded in in
        canvas = document.getElementById('mainCanvas');
      }

      // fill canvas with black to start with so we don't have to copy alpha channel data every tick
      var ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.rect(0, 0, canvas.height, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fill();

      return canvas;
    })();
  };

  render() {
    const trueCanvasSize = getTrueCanvasSize(this.props.chosenCanvasSize, this.props.maxStageContainerSize);

    // This is the real source of truth for the universe size that should be passed down into the backend
    // so do all kinds of anti-pattern horrors and dispatch that setting from within the render
    const enginePointer = getEnginePointer();
    if(enginePointer !== 0) {
      // TODO
    }

    return (
      <center>
        <canvas id='mainCanvas' width={trueCanvasSize} height={trueCanvasSize} style={{backgroundColor: '#000'}} ref={this.connectModule} />
      </center>
    );
  }
}

const mapState = state => ({
  chosenCanvasSize: state.form.vizSettings && state.form.vizSettings.values.canvasSize,
  maxStageContainerSize: state.stageSize.containerSize && _.min([state.stageSize.containerSize.height, state.stageSize.containerSize.width]),
});

export default connect(mapState)(VizCanvas);
