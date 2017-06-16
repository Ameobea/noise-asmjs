import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import store from './reducers';
import App from './App';

injectTapEventPlugin();

const Root = () => (
  <MuiThemeProvider>
    <Provider store={store} >
      <App />
    </Provider>
  </MuiThemeProvider>
);

ReactDOM.render(<Root />, document.getElementById('root'));
