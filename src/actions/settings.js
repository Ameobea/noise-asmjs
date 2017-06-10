//! Actions for hiding/showing the form

import { HIDE_SETTINGS, SHOW_SETTINGS, TOGGLE_SETTINGS } from '../reducers/settings';

export const showSettings = () => ({
  type: SHOW_SETTINGS,
});

export const hideSettings = () => ({
  type: HIDE_SETTINGS,
});

export const toggleSettings = () => ({
  type: TOGGLE_SETTINGS,
});
