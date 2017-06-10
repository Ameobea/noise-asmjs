//! Wrapper around the visualization's core that only loads once `redux-form` has been initialized.

import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import VizCanvas from './VizCanvas';

const Vizualization = ({form, stageSize}) => {
  if(form.vizSettings && stageSize !== 0) {
    const vizSettings = form.vizSettings.values;

    return (
      <div style={{marginBottom: 20}}>
        <VizCanvas size={_.min([vizSettings.canvasSize, stageSize]) - 50} />
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
};

const mapStateToProps = state => {
  return {
    form: state.form,
    stageSize: state.maxStageSize,
  };
};

export default connect(mapStateToProps)(Vizualization);
