import store from 'src/reducers';

export const getEnginePointer = () => store.getState().enginePointer.enginePointer;

export const getTreePointer = () => store.getState().enginePointer.treePointer;
