import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import store from './reducers';
import App from './App';
import { init, pause } from 'src/interop';
import { INITIAL_CANVAS_SIZE } from 'src/data/misc';

injectTapEventPlugin();

const Root = () => (
  <MuiThemeProvider>
    <Provider store={store} >
      <App />
    </Provider>
  </MuiThemeProvider>
);

ReactDOM.render(<Root />, document.getElementById('root'));

// Initialize the Emscripten backend
var canvas;
while(!canvas) { // wait until React has loaded it in
  canvas = document.getElementById('mainCanvas');
}

setTimeout(() => {
  console.log('pausing...');
  pause();
}, 2000);

init(INITIAL_CANVAS_SIZE);
