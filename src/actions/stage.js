import Simr from 'simr';

export const setStageContainerSize = (width, height) => Simr.actions.setOn('stageSize', 'containerSize', {height, width});
