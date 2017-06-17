//! Creates the canvas that holds the actual visualization.

/* global Module */

import React from 'react';

// Add a reference to the canvas to the `Module` every time we render
const connectModule = canvas => {
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

const VizCanvas = ({size}) => (
  <center>
    <canvas id='mainCanvas' width={size} height={size} style={{backgroundColor: '#000'}} ref={connectModule} />
  </center>
);

export default VizCanvas;
