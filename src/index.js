import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import store from './reducers';
import App from './App';
import { init } from 'src/interop';
import { INITIAL_CANVAS_SIZE } from 'src/data/misc';

injectTapEventPlugin();

const Root = () => (
  <MuiThemeProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </MuiThemeProvider>
);

ReactDOM.render(<Root />, document.getElementById('root'));

// Only initialize once the wasm has been loaded and handles to its functions set into `Module`
const tryInit = () => {
  if (window.Module.asm._init) {
    init(INITIAL_CANVAS_SIZE);
  } else {
    setTimeout(tryInit, 100);
  }
};

tryInit();
