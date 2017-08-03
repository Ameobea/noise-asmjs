//! Creates the canvas that holds the actual visualization.

/* global Module */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';

import { getTrueCanvasSize } from 'src/selectors/stageSize';
import { init, setCanvasSize, pause } from 'src/interop';

class VizCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = { trueCanvasSize: 25 };
  }

  // Add a reference to the canvas to the `Module` every time we render
  connectModule = canvas => {
    this.setState({ canvas });

    Module.canvas = (function() {
      var canvas;
      while(!canvas) { // wait until React has loaded it in
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

  componentWillReceiveProps(nextProps) {
    this.calcCanvasSize(nextProps);
  }

  calcCanvasSize = props => {
    // This is the real source of truth for the universe size that should be passed down into the backend
    // so do all kinds of anti-pattern horrors and dispatch that setting from within the render
    const trueCanvasSize = getTrueCanvasSize(props.chosenCanvasSize, props.maxStageContainerSize);

    if(trueCanvasSize !== this.state.trueCanvasSize && trueCanvasSize !== 0 && props.enginePointer) {
      console.log('setting canvas size to ', trueCanvasSize);
      setCanvasSize(props.enginePointer, trueCanvasSize);
      this.setState({ trueCanvasSize });
    }
  };

  render() {
    return (
      <center>
        <canvas
          id='mainCanvas'
          width={this.state.trueCanvasSize}
          height={this.state.trueCanvasSize}
          style={{backgroundColor: '#000'}}
          ref={this.connectModule}
        />
      </center>
    );
  }
}

const mapState = state => ({
  chosenCanvasSize: 10000, // TODO
  enginePointer: state.enginePointer.enginePointer,
  maxStageContainerSize: state.stageSize.containerSize && R.min(state.stageSize.containerSize.height, state.stageSize.containerSize.width),
});

export default connect(mapState)(VizCanvas);
