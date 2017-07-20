import { combineReducers, createStore } from 'redux';
import { batchedSubscribe } from 'redux-batched-subscribe';
import { unstable_batchedUpdates } from 'react-dom';

import { stageSizeReducer } from 'src/reducers/stageSizeReducer';
import { enginePointerReducer } from 'src/reducers/enginePointerReducer';
import compositionTreeReducer from 'src/reducers/compositionTreeReducer';
import { subscribeChanges } from 'src/helpers/compositionTree/changeListener';

const reducers = combineReducers({
  stageSize: stageSizeReducer.build(),
  enginePointer: enginePointerReducer.build(),
  compositionTree: compositionTreeReducer,
});

const store = createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  batchedSubscribe(unstable_batchedUpdates)
);

// subscribe to changes, applying side effects and keeping the backend up to date
subscribeChanges(store);

export default store;
