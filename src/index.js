import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
// import './semantic/dist/semantic.min.css';

import reducers from './reducers';
import App from './App';

export const store = createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const Root = () => (
  <Provider store={store} >
    <App />
  </Provider>
);

ReactDOM.render(<Root />, document.getElementById('root'));
