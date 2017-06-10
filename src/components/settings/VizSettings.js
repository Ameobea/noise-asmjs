//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { Dropdown, Grid, Header, Form, Input } from 'semantic-ui-react';
// import '../semantic/dist/semantic.min.css';
import _ from 'lodash';

import noiseGenerators from '../../data/noiseGenerators';

const { Column, Row } = Grid;

const log = (...args) => {
  console.log(...args);
  return args[args.length - 1];
}

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

const NoiseGeneratorDropdown = () => {
  const options = noiseGenerators.map(gen => {
    return {...gen, value: gen.key};
  });

  return (
    <Field
      name='noiseFunction'
      component={SemanticReduxFormField}
      as={Dropdown}
      componentProps={{
        fluid: true,
        selection: true,
        options: noiseGeneratorOptions
      }}
    />
  );
};

const CanvasSize = () => (
  <Field
    name='canvasSize'
    component={SemanticReduxFormField}
    as={Input}
    componentProps={{
      label: {
        basic: true,
        content: 'px'
      },
      labelPosition: 'right',
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
      </Grid>
    </form>
  </div>
);

export default reduxForm({
  form: 'vizSettings',
  initialValues: {
    noiseFunction: noiseGenerators[0].key,
    canvasSize: 700,
    onChange: (values, dispatch, props) => {
      console.log('dispatch', dispatch); // TODO
    }
  }
})(VizSettings);
