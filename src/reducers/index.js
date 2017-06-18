import { combineReducers, createStore } from 'redux';
import { reducer as formReducer } from 'redux-form';
import _ from 'lodash';

import { stageSizeReducer } from 'src/reducers/stageSizeReducer';
import { enginePointerReducer } from 'src/reducers/enginePointerReducer';
import { doSetConfig } from 'src/helpers/engineSettings';

const formReducerPlugin = {
  vizSettings: (state, action) => {
    // Apply all settings once the engine has been initialized
    if(action.type === 'SIMR.SET.enginePointer.pointer')
      _.each(
        _.filter(_.keys(state.values), key => key !== 'canvasSize'),
        key => doSetConfig(key, state.values, action.value)
      );

    return state;
  },
};

const reducers = combineReducers({
  form: formReducer.plugin(formReducerPlugin),
  stageSize: stageSizeReducer.build(),
  enginePointer: enginePointerReducer.build(),
});

export default createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
