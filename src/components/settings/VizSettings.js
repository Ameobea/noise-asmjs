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
    <Popup trigger={<Icon name='question circle' circular fitted size='normal' style={{marginBottom: -10, marginTop: -10}} />} content={helpContent} />
  ) : <span />;

  const labelContent = (
    <p style={{fontWeight: 'bold', marginBottom: 6}}>
      {icon}
      {label}
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
      options: noiseGeneratorOptions
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
      fluid: true
    }}
  />
);

const VizSettings = () => (
  <div style={{width: '100%', height: '100%', marginTop: 25}}>
    <form style={{border: '1px solid #999', borderRadius: 15, marginRight: 25}}>
      <Grid celled='internally'>
        <Row>
          <Column width={16}>
            <NoiseGeneratorDropdown />
          </Column>
        </Row>
        <Row>
          <Column width={8}>
            <CanvasSize />
          </Column>
        </Row>
        <Row>
          <Column width={8}>
            <SemanticField label='Zoom Level' name='zoom' componentProps={{fluid: true}} />
          </Column>
          <Column width={8}>
            <SemanticField label='Speed Level' name='speed' componentProps={{fluid: true}} />
          </Column>
        </Row>
        <Row>
          <Column width={8}>
            <SemanticField label='seed' name='Noise Generator Seed' componentProps={{flud: true}} helpContent='SEED DATA' />
          </Column>
          <Column width={8}>
            <SemanticField label='frequency' name='Frequency' componentProps={{flud: true}} />
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
  },
  onChange: (values, dispatch, props) => {
    console.log('dispatch', dispatch); // TODO
  },
})(VizSettings);
