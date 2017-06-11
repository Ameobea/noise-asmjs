//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { Dropdown, Grid, Icon, Header, Input, Popup } from 'semantic-ui-react';
import _ from 'lodash';

import noiseGenerators from '../../data/noiseGenerators';

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
              helpContent="The value entered here is hashed and used to seed the noise module."
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
  </div>
);

export default reduxForm({
  form: 'vizSettings',
  initialValues: {
    noiseFunction: noiseGenerators[0].key,
    canvasSize: 700,
    zoom: 0.0132312,
    speed: 0.00758,
    seed: '75iTgPGxbUvkZRAfnUQyp',
    octaves: 6,
    frequency: '1.0',
    lacunarity: '2.0',
    persistence: '0.5',
  },
  onChange: (values, dispatch, props) => {
    console.log('dispatch', dispatch); // TODO
  },
})(VizSettings);
