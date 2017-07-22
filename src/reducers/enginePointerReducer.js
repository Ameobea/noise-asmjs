import Simr from 'simr';

export const enginePointerReducer = new Simr.Reducer('pointers', {enginePointer: 0, treePointer: 0});
enginePointerReducer.addSetter('enginePointer');
enginePointerReducer.addSetter('treePointer');

export const setEnginePointer = pointer => Simr.actions.setOn('pointers', 'enginePointer', pointer);

export const setTreePointer = pointer => Simr.actions.setOn('pointers', 'treePointer', pointer);
