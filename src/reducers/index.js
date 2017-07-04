import { combineReducers, createStore } from 'redux';

import { stageSizeReducer } from 'src/reducers/stageSizeReducer';
import { enginePointerReducer } from 'src/reducers/enginePointerReducer';

const reducers = combineReducers({
  stageSize: stageSizeReducer.build(),
  enginePointer: enginePointerReducer.build(),
});

export default createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
