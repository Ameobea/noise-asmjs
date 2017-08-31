//! Creates the canvas that holds the actual visualization.

/* global Module */

import React from 'react';
import { connect } from 'react-redux';
import Rnd from 'react-rnd';

import { setCanvasSize } from 'src/interop';
import { getEnginePointer } from 'src/selectors/enginePointer';
import { INITIAL_CANVAS_SIZE } from 'src/data/misc';
import { setStageContainerSize } from 'src/actions/stage';

const connectModule = canvas => {
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

const handleResize = setStageContainerSize => (e, direction, ref, delta) => {
  const size = ref.clientWidth;
  setStageContainerSize(size);
  setCanvasSize(getEnginePointer(), size);
};

const VizCanvas = ({ canvasSize, setStageContainerSize }) => (
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
      onResize={handleResize(setStageContainerSize)}
    >
      <canvas
        id='mainCanvas'
        style={{
          backgroundColor: '#000',
          height: '100%',
          width: '100%',
          margin: 0,
        }}
        ref={connectModule}
        height={canvasSize}
        width={canvasSize}
      />
    </Rnd>
  </center>
);

const mapState = state => ({
  enginePointer: state.enginePointer.enginePointer,
  canvasSize: state.stageSize.containerSize,
});

export default connect(mapState, { setStageContainerSize })(VizCanvas);
