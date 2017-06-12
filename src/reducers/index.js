import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import { settingsReducer } from './settings';
import { maxSizeReducer } from './maxSizeReducer';
import { enginePointerReducer } from './enginePointerReducer';

export default combineReducers({
  form: formReducer,
  settingsVisible: settingsReducer,
  maxStageSize: maxSizeReducer,
  enginePointer: enginePointerReducer.build(),
});
