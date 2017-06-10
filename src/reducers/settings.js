//! Toggles whether or not the settings interface is visible.

export const SHOW_SETTINGS = 'SHOW_SETTINGS';
export const HIDE_SETTINGS = 'HIDE_SETTINGS';
export const TOGGLE_SETTINGS = 'TOGGLE_SETTINGS';

export const SHOWN = 'SHOWN';
export const HIDDEN = 'HIDDEN';

// This is a state machine that provides the ability to toggle between different states of the settings panel
// based on events and the previous state.
const handleAction = (actionType, lastState) => {
  return {
    [SHOW_SETTINGS]: SHOWN,
    [HIDE_SETTINGS]: HIDDEN,
    [TOGGLE_SETTINGS]: {
      [SHOWN]: HIDDEN,
      [HIDDEN]: SHOWN,
    }[lastState],
  }[actionType];
};

export const settingsReducer = (state=HIDDEN, action) => (handleAction(action.type, state) || state);
