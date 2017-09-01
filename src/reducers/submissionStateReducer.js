/**
 * Keeps track of state for the composition submission process
 */

import { SHOW_MODAL, HIDE_MODAL, START_LOADING, STOP_LOADING, SET_SUCCESS, SET_ERROR } from 'src/actions/submission';

const initialState = {
  modalOpen: false,
  loading: false,
  success: false,
  error: false,
};

export default (state=initialState, action={}) => {
  switch(action.type) {
    case SHOW_MODAL: {
      return {...state, modalOpen: true };
    }

    case HIDE_MODAL: {
      return {...state, modalOpen: false };
    }

    case START_LOADING: {
      return {...state, loading: true };
    }

    case STOP_LOADING: {
      return {...state, loading: false };
    }

    case SET_SUCCESS: {
      return {...state, success: true };
    }

    case SET_ERROR: {
      return {...state, error: action.message };
    }

    default: {
      return state;
    }
  }
};
