export const SHOW_MODAL = 'SHOW_MODAL';
export const HIDE_MODAL = 'HIDE_MODAL';
export const START_LOADING = 'START_LOADING';
export const STOP_LOADING = 'STOP_LOADING';
export const SET_SUCCESS = 'SET_SUCCESS';
export const SET_ERROR = 'SET_ERROR';

export const showModal = () => ({ type: SHOW_MODAL });
export const hideModal = () => ({ type: HIDE_MODAL });
export const startLoading = () => ({ type: START_LOADING });
export const stopLoading = () => ({ type: STOP_LOADING });
export const setSuccess = () => ({ type: SET_SUCCESS });
export const setError = message => ({ type: SET_ERROR, message });
