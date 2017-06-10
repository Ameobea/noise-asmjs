//! Creates the canvas that holds the actual visualization.

import React from 'react';

const VizCanvas = ({size}) => (
  <center style={{padding: 20, width: '100%'}}>
    <canvas width={size} height={size} style={{backgroundColor: '#000'}}></canvas>
  </center>
);

export default VizCanvas;
