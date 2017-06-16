import { combineReducers, createStore } from 'redux';
import { reducer as formReducer } from 'redux-form';

import { settingsReducer } from './settings';
import { maxSizeReducer } from './maxSizeReducer';
import { enginePointerReducer } from './enginePointerReducer';

const reducers = combineReducers({
  form: formReducer,
  settingsVisible: settingsReducer,
  maxStageSize: maxSizeReducer,
  enginePointer: enginePointerReducer.build(),
});

export default createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
