//! Contains a variety of settings that a user can use to interact with the visualization

import React from 'react';
import { connect } from 'react-redux';
import { reduxForm } from 'redux-form';
import { Button, Grid } from 'semantic-ui-react';
import _ from 'lodash';

import store from '../../reducers';
import noiseModules from '../../data/noiseModules';
import { init, setConfig, SETTING_TYPES } from '../../interop';
import moduleCapabilities from '../../data/moduleCapabilities';
import createSettingField from '../../data/moduleSettings';

const { Column } = Grid;

const columnStyle = {padding: 6};

const VizSettings = ({noiseModule}) => (
  <div style={{width: '100%', height: '100%', marginTop: 25}}>
    <form style={{border: '1px solid #999', borderRadius: 4, marginRight: 25, marginLeft: 25}}>
      <Grid celled='internally' textAlign='center'>
        <Column width={16}>
          {createSettingField('noiseModule')}
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
      <Button onClick={init}>Initialize Noise Engine</Button>
    </center>
  </div>
);

var lastValues = {
  noiseModule: noiseModules[7].key,
  canvasSize: 700,
  zoom: 20000,
  speed: 6000,
  seed: '75iTgPGxbUvkZRAfnUQyp',
  octaves: 8,
  frequency: 10000000,
  lacunarity: 20000000,
  persistence: 1.5 * 10e8,
  attenuation: 2.0 * 10e8,
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
  noiseModule: {id: SETTING_TYPES['NOISE_MODULE'], parser: id => _.findIndex(noiseModules, {key: id})},
  canvasSize: {id: SETTING_TYPES['CANVAS_SIZE'], parser: parseInt},
  zoom: {id: SETTING_TYPES['ZOOM'], parser: parseInt},
  speed: {id: SETTING_TYPES['SPEED'], parser: parseInt},
  seed: {id: SETTING_TYPES['SEED'], parser: hashCode},
  octaves: {id: SETTING_TYPES['OCTAVES'], parser: parseInt},
  frequency: {id: SETTING_TYPES['FREQUENCY'], parser: parseInt},
  lacunarity: {id: SETTING_TYPES['LACUNARITY'], parser: parseInt},
  persistence: {id: SETTING_TYPES['PERSISTENCE'], parser: parseInt},
  attenuation: {id: SETTING_TYPES['ATTENUATION'], parser: parseInt},
  rangeFunction: {id: SETTING_TYPES['RANGE_FUNCTION'], parser: null},
};

const mapState = state => ({
  noiseModule: state.form.vizSettings.values.noiseModule,
});

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
      if(!nameMap[key]) {
        console.error(`Unhandled setting type in form: ${key}`);
      }
      const {id, parser} = nameMap[key];
      console.log('Setting config values: ', parser(values[key]), enginePointer);
      setConfig(id, parser(values[key]), enginePointer);
    });
  },
})(connect(mapState)(VizSettings));
