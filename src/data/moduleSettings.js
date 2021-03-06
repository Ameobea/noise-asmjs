//! Defines the parameters of all of the possible module setting fields.

import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import { Checkbox, Dropdown, Header, Icon, Input, Popup } from 'semantic-ui-react';
// import { Slider } from 'material-ui/Slider';

import noiseModules from 'src/data/noiseModules';
import { setSetting } from 'src/actions/compositionTree';
import compositionSchemes from 'src/data/compositionSchemes';
import { inputTransformationTypes } from 'src/data/inputTransformations';

import WeightedAverages from 'src/components/settingGuis/WeightedAverages';

// stolen from https://stackoverflow.com/a/7616484/3833068
// which stole it from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
const hashString = input => {
  var hash = 0, i, chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// A list of settings that apply to all multifractal noise modules
export const multifractalSettings = ['octaves', 'frequency', 'lacunarity', 'persistence'];

/**
 * Defines the schema and content of all setting types for noise modules.  Using these definitions, an input field that
 * processes the entered input and relays it to the backend can be automatically constructed.
 */
export const settingDefinitions = {
  octaves: {
    title: 'Octaves',
    default: '6',
    min: 0.0,
    trueMin: 0.0,
    max: 80.0, // the limit that the user is capped at for sliders
    trueMax: 350.0, // the limit that the user is capped at when the slider is unlocked
    hint: (
      <span>
        {'Total number of frequency octaves to generate the noise with.  '}
        <br /><br />
        {'The number of octaves control the '}
        <i>amount of detail</i>
        {' in the noise function. Adding more octaves increases the detail, with the drawback of increasing the calculation time.'}
      </span>
    ),
  },
  frequency: {
    title: 'Frequency',
    default: '1.0',
    min: 0.0,
    trueMin: 0.0,
    max: 20.0,
    trueMax: 500.0,
    hint: 'The number of cycles per unit length that the noise function outputs.',
  },
  lacunarity: {
    title: 'Lacunarity',
    default: '2.0',
    min: 1.0,
    trueMin: 0.0,
    max: 4.0,
    trueMax: 50.0,
    hint: (
      <span>
        {'A multiplier that determines how quickly the frequency increases for each successive octave in the noise function.'}
        <br /><br />
        {'The frequency of each successive octave is equal to the product of the previous octave\'s frequency and the lacunarity value.'}
        <br /><br />
        {'A lacunarity of 2.0 results in the frequency doubling every octave. For almost all cases, 2.0 is a good value to use.'}
      </span>
    ),
  },
  persistence: {
    title: 'Persistence',
    default: '0.5',
    min: 1.0,
    trueMin: 0.0,
    max: 4.0,
    trueMax: 50.0,
    hint: (
      <span>
        {'A multiplier that determines how quickly the amplitudes diminish for each successive octave in the noise function.'}
        <br /><br />
        {'The amplitude of each successive octave is equal to the product of the previous octave\'s amplitude and the persistence value. Increasing the persistence produces "rougher" noise.'}
      </span>
    ),
  },
  seed: {
    title: 'Seed',
    default: '3YRQQJetSaodHS4h3cDurG3cjjTyWmHr',
    text: true, // indicates that this is a text-based field and to ignore any numeric constraints like `min` and `max`
    hint: 'The value entered here is hashed and used to seed the noise module.',
    processor: hashString, // Optional; a function that is applied to the entered value before scaling or sending to the backend
  },
  canvasSize: {
    title: 'Canvas Size',
    min: 50,
    trueMin: 1,
    max: Infinity,
    trueMax: Infinity,
  },
  rangeFunction: {
    title: 'Range Function',
    enum: true, // indicates that this is an enum of strings that a user can choose between with a dropdown
    default: 'euclidean',
    enumValues: [{
      key: 'euclidean',
      title: 'Euclidean',
      description: 'The standard linear distance. Expensive to compute because it requires square root calculations.',
    }, {
      key: 'euclideanSquared',
      title: 'EuclideanSquared',
      description: 'Same as Euclidean, but without the square root calculations. Distance results will be smaller, however, but hash patterns will be the same.',
    }, {
      key: 'manhattan',
      title: 'Manhattan',
      description: 'Measured by only moving in straight lines along the axes. Diagonal movement is not allowed, which leads to increased distances.',
    }, {
      key: 'chebyshev',
      title: 'Chebyshev',
      description: 'Measured by taking the largest distance along any axis as the total distance. Since this eliminates all but one dimension, it results in significantly shorter distances and produces regions where the distances are uniform.',
    }, {
      key: 'quadratic',
      title: 'Quadratic',
      description: 'Experimental function where all values are multiplied together and then added up like a quadratic equation.',
    }],
    hint: 'Set of distance functions that can be used in the Worley noise module.  Sets the method used to determine how far apart two points are.',
  },
  worleyFrequency: {
    title: 'Frequency',
    description: 'Frequency of the seed points.',
    default: '1.0',
    min: 0.0,
    trueMin: 0.0,
    max: 200,
    trueMax: 100000,
  },
  enableRange: {
    title: 'Enable Range',
    bool: true, // indicates that this value is a boolean and should be represented by a checkbox
    default: 'true',
    hint: 'Determines if the distance from the nearest seed point is applied to the output value.',
  },
  attenuation: {
    title: 'Attenuation',
    default: '2.0',
    min: 0.0,
    trueMin: 0.0,
    max: 5.0,
    trueMax: 5.0,
    hint: 'The attenuation to apply to the weight on each octave. This reduces the strength of each successive octave, making their respective ridges smaller. The default attenuation is 2.0, making each octave half the height of the previous.',
  },
  displacement: {
    title: 'Displacement',
    default: '1.0',
    min: 0.0,
    trueMin: 0.0,
    max: 5.0,
    trueMax: 100.0,
    hint: (
      <span>
        {'Scale of the random displacement to apply to each cell.'}
        <br /><br />
        {'The noise module assigns each Worley cell a random constant value from a value noise function. The displacement value controls the range random values to assign to each cell. The range of random values is +/- the displacement value.'}
      </span>
    ),
  },
  constant: {
    title: 'Constant Value',
    default: '0.5',
    min: -1.0,
    trueMin: -Infinity,
    max: 1.0,
    trueMax: Infinity,
    hint: 'The constant value returned for all points',
  },
  zoom: {
    title: 'Zoom',
    default: '0.015',
    min: 0.0,
    trueMin: 0.0,
    max: 10e6,
    trueMax: 10e6,
    hint: 'How magnified the image in the canvas is displayed.  A value of 1 corresponds to a distance of 1 unit per pixel.',
  },
  speed: {
    title: 'Speed',
    default: '0.008',
    min: 0.00000001,
    trueMin: 0.0,
    max: 10e4,
    trueMax: 10e10,
    hint: 'How fast the Z axis is traversed.  A value of 2.0 means that 2 units are traversed per tick of the visualization.',
  },
  moduleType: {
    title: 'Noise Module Type',
    default: 'Fbm',
    enum: true,
    enumValues: noiseModules.map( ({key, name, content}) => ({key, title: name, description: content}) ),
    hint: 'The noise module is the function that produces noise values.  For each pixel of the canvas, the X and Y coordinate is passed into this function along with the current sequence number which returns a value to color that pixel.',
  },
  compositionScheme: {
    title: 'Composition Scheme',
    default: 'average',
    enum: true,
    enumValues: compositionSchemes.map( ({key, name, content}) => ({key, title: name, description: content})),
    hint: '',
  },
  averageWeights: {
    title: 'Weights',
    default: {},
    component: WeightedAverages,
  },
  inputTransformationType: {
    title: 'Transformation Type',
    default: 'zoomScale',
    enum: true,
    enumValues: inputTransformationTypes.map( ({key, name, content}) => ({key, title: name, description: content}) ),
  },
  replacedDim: {
    title: 'Replaced Dimension',
    default: 'x',
    enum: true,
    enumValues: [
      { key: 'x', title: 'X' },
      { key: 'y', title: 'Y' },
      { key: 'z', title: 'Z' },
    ],
  },
  scaleFactor: {
    title: 'Scale Factor',
    default: '1',
    hint: 'All input coordinates are multipled by this number before being passed to the inner noise function.',
  },
  colorFunction: {
    title: 'Color Map Function',
    description: 'The function that is used to map the output from the noise functions to the color displayed for that pixel on the canvas.',
    default: 'tieDye',
    enum: true,
    enumValues: [
      { key: 'tieDye', title: 'Tie-Dye' },
      { key: 'blackAndWhite', title: 'Black + White' },
      { key: 'lavaFlow', title: 'Lava Flow' },
      { key: 'oceanic', title: 'Oceanic' },
      { key: 'sunset', title: 'Sunset' },
      { key: 'cosmos', title: 'Cosmos' },
      { key: 'pastelSea', title: 'Pastel Sea' },
      { key: 'vaporwave', title: 'Vaporwave' },
      { key: 'algaeFloat', title: 'Algae Float' },
    ],
  }
};

const mapSettingState = ({ compositionTree: { entities: { settings } } }) => ({ settings });

export const HelpPopup = ({ helpContent, style={} }) => (
  <Popup
    trigger={<Icon name='question circle' circular fitted style={{...style, marginBottom: -10, marginTop: -10}} />}
    style={{
      borderRadius: 0,
      border: '1px solid #555',
    }}
    inverted
  >
    {helpContent}
  </Popup>
);

const UnconnectedSemanticField = ({
  name, id, as: As=Input, componentProps={}, label='', helpContent, settings, setSetting, changeHandlerGenerator
}) => {
  const icon = helpContent ? <HelpPopup helpContent={helpContent} /> : null;

  const labelContent = (
    <p style={{fontWeight: 'bold', marginBottom: 4}}>
      {icon}
      <span style={{fontSize: '9pt'}}>{label}</span>
    </p>
  );

  // If the setting definition has a change handler generator, use it to create the change handler
  // otherwise, assume that the component expects a single argument which is the new value.
  const changeHandler = changeHandlerGenerator ? changeHandlerGenerator(setSetting) : R.partial(setSetting, [id]);

  return (
    <div style={{marginTop: 5}}>
      {labelContent}
      <As {...componentProps} value={settings[id].value} onChange={changeHandler} />
    </div>
  );
};

/**
 * Wrapper around an inner component that wraps it in a popup displaying help text (if help text is supplied) and automatically
 * wires up the inner component's `onChange` method to set the value into Redux.
 */
const SemanticField = connect(mapSettingState, { setSetting })(UnconnectedSemanticField);

const buildEnumField = (name, id, {title, hint, enumValues}) => (
  <SemanticField
    name={name}
    id={id}
    as={Dropdown}
    componentProps={{
      fluid: true,
      selection: true,
      options: R.map(({key, title, description}) => ({
        key,
        text: title,
        value: key,
        content: <Header content={title} subheader={description} />
      }), enumValues),
      size: 'mini',
    }}
    changeHandlerGenerator={setSetting => (event, props) => setSetting(id, props.value)}
    label={title}
    helpContent={hint}
  />
);

// wrapper around `<Checkbox>` that shifts the `value` prop to `checked`.
const CheckboxWrapper = props => {
  const mappedProps = {
    ...props,
    checked: props.value === 'true' || props.value === true,
    value: undefined,
  };

  return <Checkbox {...mappedProps} />;
};

const buildBoolField = (name, id, {title, hint}) => (
  <SemanticField
    name={name}
    id={id}
    as={CheckboxWrapper}
    label={title}
    helpContent={hint}
    changeHandlerGenerator={ setSetting => (e, { checked }) => setSetting(id, checked.toString()) }
  />
);

const buildTextField = (name, id, {title, hint}) => (
  <SemanticField
    name={name}
    id={id}
    label={title}
    helpContent={hint}
    changeHandlerGenerator={setSetting => (event, props) => setSetting(id, props.value)}
  />
);

const buildNumericField = (name, id, {title, hint}) => (
  // TODO: Add support for toggling field to an input box for manually entering values
  // TODO: Proper validation, scaling, etc.
  <SemanticField
    name={name}
    id={id}
    label={title}
    helpContent={hint}
    changeHandlerGenerator={setSetting => (event, props) => setSetting(id, props.value)}
  />
);

/**
 * Given a field definition from the above map, constructs a semantic UI field from it that can be used with `redux-form`.
 */
const UnconnectedSettingGui = ({ name, id, nodes }) => {
  const def = settingDefinitions[name];
  if(!def) {
    console.error(`Attempted to create field for component with name ${name}, but no definition exists!`);
    return <div>ERROR</div>;
  }

  if(def.enum) {
    return buildEnumField(name, id, def);
  } else if(def.bool) {
    return buildBoolField(name, id, def);
  } else if(def.text) {
    return buildTextField(name, id, def);
  } else if(def.component) {
    const parentNodeId = R.values(nodes).find( ({ settings }) => settings.includes(id) ).id;

    // The custom setting GUI component defined in the node's definition is passed the parent node's id
    return (
      <SemanticField
        name={name}
        id={id}
        label={def.title}
        helpContent={def.hint}
        as={def.component}
        componentProps={{ parentNodeId }}
      />
    );
  } else {
    return buildNumericField(name, id, def);
  }
};

// TODO: Create parent node id selector based on setting id
const mapState = ({ compositionTree: { entities: { nodes } } }) => ({ nodes });

export const SettingGui = connect(mapState)(UnconnectedSettingGui);
