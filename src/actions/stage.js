import Simr from 'simr';

export const setStageContainerSize = size => Simr.actions.setOn('stageSize', 'containerSize', size);
