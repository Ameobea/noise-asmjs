//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { Button, Dropdown, Grid, Icon, Header, Input, Popup } from 'semantic-ui-react';
import Slider from 'material-ui/Slider';
import _ from 'lodash';

import { store } from '../../';
import noiseGenerators from '../../data/noiseGenerators';
import { init, setConfig, SETTING_TYPES } from '../../interop';

const { Column, Row } = Grid;

const noiseGeneratorOptions = _.map(noiseGenerators, ({key, name, content}) => {
  return {
    key,
    text: name,
    value: key,
    content: <Header content={name} subheader={content} />
  };
});

/// Stolen from https://stackoverflow.com/a/42422255/3833068
const SemanticReduxFormField = (props) => {
  const { input, as: As = Input, componentProps } = props;

  const handleChange =  (e, { value }) => input.onChange(value);

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

const NoiseGeneratorDropdown = () => (
  <SemanticField
    label='Noise Function'
    name='noiseFunction'
    as={Dropdown}
    componentProps={{
      fluid: true,
      selection: true,
      options: noiseGeneratorOptions,
      size: 'mini',
    }}
  />
);

const CanvasSize = () => (
  <SemanticField
    label='Canvas Size'
    name='canvasSize'
    componentProps={{
      label: {
        basic: true,
        content: 'px'
      },
      labelPosition: 'right',
      fluid: true,
      size: 'mini',
    }}
  />
);

const columnStyle = {padding: 6};

const VizSettings = () => (
  <div style={{width: '100%', height: '100%', marginTop: 25}}>
    <form style={{border: '1px solid #999', borderRadius: 4, marginRight: 25, marginLeft: 25}}>
      <Grid celled='internally'>
        <Row>
          <Column style={columnStyle} width={16}>
            <NoiseGeneratorDropdown />
          </Column>
        </Row>
        <Row>
          <Column style={columnStyle} width={8}>
            <CanvasSize />
          </Column>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Frequency'
              name='frequency'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent='The number of cycles per unit length that the noise function outputs.'
            />
          </Column>
        </Row>
        <Row>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Zoom Level'
              name='zoom'
              componentProps={{fluid: true, size: 'mini'}}
            />
          </Column>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Speed Level'
              name='speed'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent='This sets how much Z-axis distance is traversed every tick.  Higher values make the visualization appear faster at the cost of detail.'
            />
          </Column>
        </Row>
        <Row>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Seed'
              name='seed'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent='The value entered here is hashed and used to seed the noise module.'
            />
          </Column>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Octaves'
              name='octaves'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent={
                <span>
                  {'Total number of frequency octaves to generate the noise with.  '}
                  <br /><br />
                  {'The number of octaves control the '}
                  <i>amount of detail</i>
                  {' in the noise function. Adding more octaves increases the detail, with the drawback of increasing the calculation time.'}
                </span>
              }
            />
          </Column>
        </Row>
        <Row>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Lacunarity'
              name='lacunarity'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent={
                <span>
                  {'A multiplier that determines how quickly the frequency increases for each successive octave in the noise function.'}
                  <br /><br />
                  {'The frequency of each successive octave is equal to the product of the previous octave\'s frequency and the lacunarity value.'}
                  <br /><br />
                  {'A lacunarity of 2.0 results in the frequency doubling every octave. For almost all cases, 2.0 is a good value to use.'}
                </span>
              }
            />
          </Column>
          <Column style={columnStyle} width={8}>
            <SemanticField
              label='Persistence'
              name='persistence'
              componentProps={{fluid: true, size: 'mini'}}
              helpContent={
                <span>
                  {'A multiplier that determines how quickly the amplitudes diminish for each successive octave in the noise function.'}
                  <br /><br />
                  {'The amplitude of each successive octave is equal to the product of the previous octave\'s amplitude and the persistence value. Increasing the persistence produces "rougher" noise.'}
                </span>
              }
            />
          </Column>
        </Row>
      </Grid>
    </form>

    <center>
      <Button onClick={init}>Initialize Noise Engine</Button>
    </center>
  </div>
);

var lastValues = {
  noiseFunction: noiseGenerators[7].key,
  canvasSize: 700,
  zoom: 20000,
  speed: 6000,
  seed: '75iTgPGxbUvkZRAfnUQyp',
  octaves: 8,
  frequency: 10000000,
  lacunarity: 20000000,
  persistence: 15000000,
};

// stolen from https://stackoverflow.com/a/7616484/3833068
// which stole it from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
const hashCode = input => {
  var hash = 0, i, chr;
  if (input.length === 0) return hash;
  for (i = 0; i < input.length; i++) {
    chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// used to map the input names to `SETTING_TYPES` used in the interop
const nameMap = {
  noiseFunction: {id: SETTING_TYPES['GENERATOR_TYPE'], parser: id => _.findIndex(noiseGenerators, {key: id})},
  canvasSize: {id: SETTING_TYPES['CANVAS_SIZE'], parser: parseInt},
  zoom: {id: SETTING_TYPES['ZOOM'], parser: parseInt},
  speed: {id: SETTING_TYPES['SPEED'], parser: parseInt},
  seed: {id: SETTING_TYPES['SEED'], parser: hashCode},
  octaves: {id: SETTING_TYPES['OCTAVES'], parser: parseInt},
  frequency: {id: SETTING_TYPES['FREQUENCY'], parser: parseInt},
  lacunarity: {id: SETTING_TYPES['LACUNARITY'], parser: parseInt},
  persistence: {id: SETTING_TYPES['PERSISTENCE'], parser: parseInt},
};

export default reduxForm({
  form: 'vizSettings',
  initialValues: _.cloneDeep(lastValues),
  onChange: (values, dispatch, props) => {
    // Find the keys of all settings that have changed
    // (Stolen from https://stackoverflow.com/a/31686152/3833068)
    const diffKeys = _.reduce(
      values,(result, value, key) => {
        return _.isEqual(value, lastValues[key]) ? result : result.concat(key);
      }, []);
    lastValues = values;

    // map them to `SETTING_TYPES` from the interop and call the configuration callback with the noise engine's pointer
    const enginePointer = store.getState().enginePointer.pointer;
    _.each(diffKeys, key => {
      const {id, parser} = nameMap[key];
      console.log('Setting config values: ', parser(values[key]), enginePointer);
      setConfig(id, parser(values[key]), enginePointer);
    });
  },
})(VizSettings);
