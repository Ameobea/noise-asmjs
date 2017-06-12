import Simr from 'simr';

export const enginePointerReducer = new Simr.Reducer('enginePointer', {pointer: 0});
enginePointerReducer.addSetter('pointer');

export const setEnginePointer = pointer => Simr.actions.setOn('enginePointer', 'pointer', pointer);
