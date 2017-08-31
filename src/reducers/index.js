import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';

import { stageSizeReducer } from 'src/reducers/stageSizeReducer';
import { enginePointerReducer } from 'src/reducers/enginePointerReducer';
import compositionTreeReducer from 'src/reducers/compositionTreeReducer';
import { subscribeChanges } from 'src/helpers/compositionTree/changeListener';

const createHistory = require('history').createBrowserHistory;

export const history = createHistory();
const middleware = routerMiddleware(history);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const reducers = combineReducers({
  stageSize: stageSizeReducer.build(),
  enginePointer: enginePointerReducer.build(),
  compositionTree: compositionTreeReducer,
  router: routerReducer,
});

const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(middleware))
);

// subscribe to changes, applying side effects and keeping the backend up to date
subscribeChanges(store);

export default store;
