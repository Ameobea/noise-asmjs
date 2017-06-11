//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { Dropdown, Grid, Header, Input } from 'semantic-ui-react';
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

const SemanticField = ({name, as=Input, componentProps={}}) => (
  <Field name={name} component={SemanticReduxFormField} as={as} componentProps={componentProps} />
);

const NoiseGeneratorDropdown = () => (
  <SemanticField
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
    name='canvasSize'
    componentProps={{
      label: {
        basic: true,
        content: 'px'
      },
      labelPosition: 'right',
      size: 'mini'
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
          <Column width={4}>
            <CanvasSize />
          </Column>
        </Row>
        <Row>
          <Column width={8}>
            <SemanticField name='zoom' />
          </Column>
          <Column width={8}>
            <SemanticField name='speed' />
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
