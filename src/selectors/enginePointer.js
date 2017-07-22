import store from 'src/reducers';

export const getEnginePointer = () => store.getState().enginePointer.enginePointer;
