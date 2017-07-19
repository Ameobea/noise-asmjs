export const inputTransformationTypes = [{
  key: 'zoomScale',
  name: 'Zoom/Scale',
  content: 'Transforms the input coordinate by scaling the X and Y dims by `zoom` and the Z dim by `speed`.',
}, {
  key: 'honf',
  name: 'Higher Order Noise Function',
  content: 'Replaces the `replacement_dim` of the input with the result of passing it through the provided noise function.',
}, {
  key: 'scaleAll',
  name: 'Scale All',
  content: 'Multiplies all of the input values by this value',
}];
