//! Defines the parameters of all of the possible module setting fields.

import React from 'react';
import _ from 'lodash';
import { Field } from 'redux-form';
import { Checkbox, Dropdown, Header, Icon, Input, Popup } from 'semantic-ui-react';
// import { Slider } from 'material-ui/Slider';

import store from '../reducers';
import noiseModules from './noiseModules';

const maxStageSize = store.getState().maxStageSize;

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

/**
 * Defines the schema and content of all setting types for noise modules.  Using these definitions, an input field that
 * processes the entered input and relays it to the backend can be automatically constructed.
 */
const settingDefinitions = {
  octaves: {
    title: 'Octaves',
    min: 0.0,
    trueMin: 0.0,
    max: 80.0, // the limit that the user is capped at for sliders
    trueMax: 350.0, // the limit that the user is capped at when the slider is unlocked
    scale: 1.0, // number that the input value is multiplied by before passing into the backend
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
    min: 0.0,
    trueMin: 0.0,
    max: 20.0,
    trueMax: 500.0,
    scale: 10e8,
    hint: 'The number of cycles per unit length that the noise function outputs.',
  },
  lacunarity: {
    title: 'Lacunarity',
    min: 1.0,
    trueMin: 0.0,
    max: 4.0,
    trueMax: 50.0,
    scale: 10e8,
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
    min: 1.0,
    trueMin: 0.0,
    max: 4.0,
    trueMax: 50.0,
    scale: 10e8,
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
    text: true, // indicates that this is a text-based field and to ignore any numeric constraints like `min` and `max`
    hint: 'The value entered here is hashed and used to seed the noise module.',
    processor: hashString, // Optional; a function that is applied to the entered value before scaling or sending to the backend
  },
  canvasSize: {
    title: 'Canvas Size',
    min: 50,
    trueMin: 1,
    max: maxStageSize,
    trueMax: maxStageSize,
    scale: 1,
  },
  rangeFunction: {
    title: 'Range Function',
    enum: true, // indicates that this is an enum of strings that a user can choose between with a dropdown
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
  enableRange: {
    title: 'Enable Range',
    bool: true, // indicates that this value is a boolean and should be represented by a checkbox
    hint: 'Determines if the distance from the nearest seed point is applied to the output value.',
  },
  attenuation: {
    title: 'Attenuation',
    min: 0.0,
    trueMin: 0.0,
    max: 5.0,
    trueMax: 5.0,
    scale: 10e8,
    hint: 'The attenuation to apply to the weight on each octave. This reduces the strength of each successive octave, making their respective ridges smaller. The default attenuation is 2.0, making each octave half the height of the previous.',
  },
  displacement: {
    title: 'Displacement',
    min: 0.0,
    trueMin: 0.0,
    max: 5.0,
    trueMax: 100.0,
    scale: 10e8,
    hint: (
      <span>
        {'Scale of the random displacement to apply to each cell.'}
        <br /><br />
        {'The noise module assigns each Worley cell a random constant value from a value noise function. The displacement value controls the range random values to assign to each cell. The range of random values is +/- the displacement value.'}
      </span>
    ),
  },
  zoom: {
    title: 'Zoom',
    min: 0.0,
    trueMin: 0.0,
    max: 10e6,
    trueMax: 10e6,
    scale: 10e10,
    hint: 'How magnified the image in the canvas is displayed.  A value of 1 corresponds to a distance of 1 unit per pixel.',
  },
  speed: {
    title: 'Speed',
    min: 0.00000001,
    trueMin: 0.0,
    max: 10e4,
    trueMax: 10e10,
    scale: 10e8,
    hint: 'How fast the Z axis is traversed.  A value of 2.0 means that 2 units are traversed per tick of the visualization.',
  },
  noiseModule: {
    title: 'Noise Modules',
    enum: true,
    enumValues: noiseModules.map(({key, name, content}) => ({key, title: name, description: content})),
    hint: 'The noise module is the function that produces noise values.  For each pixel of the canvas, the X and Y coordinate is passed into this function along with the current sequence number which returns a value to color that pixel.',
  },
};

/// Stolen from https://stackoverflow.com/a/42422255/3833068
const SemanticReduxFormField = (props) => {
  const { input, as: As = Input, componentProps } = props;

  const handleChange = (e, { value, checked }) => {
    input.onChange(value || checked);
  };

  return <As value={input.value} onChange={handleChange} onFocus={_.noop} {...componentProps} />;
};

const SemanticField = ({name, as=Input, componentProps={}, label='', helpContent}) => {
  const icon = helpContent ? (
    <Popup
      trigger={<Icon name='question circle' circular fitted style={{marginBottom: -10, marginTop: -10}} />}
      style={{
        borderRadius: 0,
        border: '1px solid #555',
      }}
      inverted
    >
      {helpContent}
    </Popup>
  ) : <span />;

  const labelContent = (
    <p style={{fontWeight: 'bold', marginBottom: 4}}>
      {icon}
      <span style={{fontSize: '9pt'}}>{label}</span>
    </p>
  );

  return (
    <div>
      {labelContent}
      <Field name={name} component={SemanticReduxFormField} as={as} componentProps={componentProps} />
    </div>
  );
};

const buildEnumField = (name, {title, hint, enumValues}) => (
  <SemanticField
    name={name}
    as={Dropdown}
    componentProps={{
      fluid: true,
      selection: true,
      options: _.map(enumValues, ({key, title, description}) => ({
        key,
        text: title,
        value: key,
        content: <Header content={title} subheader={description} />
      })),
      size: 'mini',
    }}
    label={title}
    helpContent={hint}
  />
);

// wrapper around `<Checkbox>` that shifts the `value` prop to `checked`.
const CheckboxWrapper = props => {
  const mappedProps = {
    ...props,
    checked: props.value,
    value: undefined,
  };

  return <Checkbox {...mappedProps} />;
};

const buildBoolField = (name, {title, hint}) => (
  <SemanticField
    name={name}
    as={CheckboxWrapper}
    label={title}
    helpContent={hint}
  />
);

const buildTextField = (name, {title, hint}) => (
  <SemanticField
    name={name}
    label={title}
    helpContent={hint}
  />
);

const buildNumericField = (name, {title, hint}) => (
  // TODO: Add support for toggling field to an input box for manually entering values
  // TODO: Proper validation, scaling, etc.
  <SemanticField
    name={name}
    label={title}
    helpContent={hint}
  />
);

/**
 * Given a field definition from the above map, constructs a semantic UI field from it that can be used with `redux-form`.
 */
export default (name) => {
  const def = settingDefinitions[name];
  if(!def) {
    console.error(`Attempted to create field for component with name ${name}, but no definition exists!`);
    return <div>ERROR</div>;
  }

  if(def.enum) {
    return buildEnumField(name, def);
  } else if(def.bool) {
    return buildBoolField(name, def);
  } else if(def.text) {
    return buildTextField(name, def);
  } else {
    return buildNumericField(name, def);
  }
};
