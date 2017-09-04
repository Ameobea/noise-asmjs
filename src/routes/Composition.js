/**
 * Main noise function composition view with composition tree, leaf editor, and
 * visualization canvas.
 */

import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'semantic-ui-react';

import Visualization from 'src/components/visualization';
import CompositionTreeGUI from 'src/components/tree';
import { NULL_UUID } from 'src/data/misc';
import { setRootNode } from 'src/actions/compositionTree';
import { loadDefinition } from 'src/Api';
import { resume } from 'src/interop';

const { Column, Row } = Grid;

class Composition extends React.Component {
  constructor(props) {
    super(props);

    setTimeout(resume, 500);

    window.setRootNode = this.props.setRootNode;

    if(this.props.sharedId) {
      loadDefinition(this.props.sharedId).then(res => {
        if(res.Success) {
          this.props.setRootNode(JSON.parse(res.Success.definition_string));
        }
      });
    }
  }

  render() {
    return (
      <Grid relaxed>
        <Row>
          <Column computer={10} mobile={16}>
            {/* MAIN VISUALIZATION CONTENT */}
            <Visualization />
          </Column>

          <Column computer={6} mobile={16}>
            {/* MAIN SETTINGS / GUI */}
            <CompositionTreeGUI />
          </Column>
        </Row>
      </Grid>
    );
  }
}

export default connect(null, { setRootNode })(Composition);
