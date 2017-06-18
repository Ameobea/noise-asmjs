//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Button, Grid } from 'semantic-ui-react';
import _ from 'lodash';

import noiseModules from 'src/data/noiseModules';
import { init, RANGE_FUNCTIONS } from 'src/interop';
import moduleCapabilities from 'src/data/moduleCapabilities';
import createSettingField from 'src/data/moduleSettings';
import { doSetConfig } from 'src/helpers/engineSettings';
import { getEnginePointer } from 'src/selectors/enginePointer';
import { getTrueCanvasSize } from 'src/selectors/stageSize';

const { Column } = Grid;

const columnStyle = {padding: 6};

const initializer = (chosenCanvasSize, maxStageContainerSize) => () => {
  console.log('chosen: ', chosenCanvasSize, 'max: ', maxStageContainerSize);
  init(getTrueCanvasSize(chosenCanvasSize, maxStageContainerSize));
}

const VizSettings = ({noiseModule, chosenCanvasSize, maxStageContainerSize}) => (
  <div style={{width: '100%', height: '100%', marginTop: 25}}>
    <form style={{border: '1px solid #999', borderRadius: 4, marginRight: 25, marginLeft: 25}}>
      <Grid celled='internally' textAlign='center'>
        <Column width={16}>
          {createSettingField('noiseModule')}
        </Column>
        <Column width={8}>
          {createSettingField('canvasSize')}
        </Column>
        {moduleCapabilities[noiseModule]
          .toJS()
          .map(name => (
            <Column key={name} style={columnStyle} width={8}>
              {createSettingField(name)}
            </Column>
          ))
        }
      </Grid>
    </form>

    <center>
      <Button onClick={initializer(chosenCanvasSize, maxStageContainerSize)}>Initialize Noise Engine</Button>
    </center>
  </div>
);

var lastValues = {
  noiseModule: noiseModules[7].key,
  canvasSize: 700,
  zoom: 500,
  speed: 0.006,
  seed: '75iTgPGxbUvkZRAfnUQyp',
  octaves: 8,
  frequency: 1.0,
  lacunarity: 2.0,
  persistence: 1.5,
  attenuation: 2.0,
  rangeFunction: _.first(_.keys(RANGE_FUNCTIONS)),
  enableRange: false,
  displacement: 1.0,
};

const mapState = state => ({
  noiseModule: state.form.vizSettings.values.noiseModule,
  chosenCanvasSize: state.form.vizSettings && state.form.vizSettings.values.canvasSize,
  maxStageContainerSize: state.stageSize.containerSize && _.min([state.stageSize.containerSize.height, state.stageSize.containerSize.width]),
});

export default reduxForm({
  form: 'vizSettings',
  initialValues: _.cloneDeep(lastValues),
  onChange: (values, dispatch, props) => {
    // Find the keys of all settings that have changed
    // (Stolen from https://stackoverflow.com/a/31686152/3833068)
    const diffKeys = _.reduce(
      values, (result, value, key) => {
        return _.isEqual(value, lastValues[key]) ? result : result.concat(key);
      }, []
    );
    lastValues = values;

    _.each(diffKeys, key => {
      // transform the raw input from the form into the format expected by the backend and call the interop function
      doSetConfig(key, values, getEnginePointer());
    });
  },
})(connect(mapState)(VizSettings));
