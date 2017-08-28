//! Creates the canvas that holds the actual visualization.

/* global Module */

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import Rnd from 'react-rnd';

import { setCanvasSize } from 'src/interop';
import { getEnginePointer } from 'src/selectors/enginePointer';
import { INITIAL_CANVAS_SIZE } from 'src/data/misc';

class VizCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = { trueCanvasSize: INITIAL_CANVAS_SIZE };
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

  handleResize = (e, direction, ref, delta) => {
    const size = ref.clientWidth;
    setCanvasSize(getEnginePointer(), size);
    this.setState({ trueCanvasSize: size });
  };

  render() {
    return (
      <center>
        <Rnd
          disableDragging={false}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          lockAspectRatio
          default={{
            x: 0,
            y: 0,
            width: INITIAL_CANVAS_SIZE,
            height: INITIAL_CANVAS_SIZE,
          }}
          onResize={this.handleResize}
        >
          <canvas
            id='mainCanvas'
            style={{
              backgroundColor: '#000',
              height: '100%',
              width: '100%',
              margin: 0,
            }}
            ref={this.connectModule}
            height={this.state.trueCanvasSize}
            width={this.state.trueCanvasSize}
          />
        </Rnd>
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
