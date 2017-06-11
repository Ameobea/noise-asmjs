//! Creates the canvas that holds the actual visualization.

import React from 'react';

const VizCanvas = ({size}) => (
  <center>
    <canvas width={size} height={size} style={{backgroundColor: '#000'}} />
  </center>
);

export default VizCanvas;
