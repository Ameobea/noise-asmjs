import React from 'react';
import { connect } from 'react-redux';
import { Button, Form, Menu, Modal } from 'semantic-ui-react';
import { push } from 'react-router-redux';
import R from 'ramda';

import { COMPOSITION, BROWSE_SHARED_COMPOSITIONS } from 'src/Router';
import { pause, resume, setCanvasSize } from 'src/interop';
import { SHARE_SUBMISSION_URL } from 'src/data/misc';
import { getRootNodeDefinition } from 'src/selectors/compositionTree';
import store from 'src/reducers';

const MenuItem = Menu.Item;

const getActiveTab = location => ({
  [COMPOSITION]: 0,
  [BROWSE_SHARED_COMPOSITIONS]: 1,
}[location]);

const mapState = ({ router: { location }, stageSize: { containerSize } }) => ({
  activeTab: getActiveTab(location),
  lastCanvasSize: containerSize,
});

const MappedMenuItem = connect(mapState, { push })(({
  name, index, path, push, activeTab, lastCanvasSize
}) => (
  <MenuItem
    name={name}
    active={activeTab === index}
    onClick={ () => {
      if(index !== 0) {
        pause();
      } else {
        setCanvasSize(lastCanvasSize);
        resume();
      }

      push(path);
    } }
  />
));

const submitComposition = (username, description, title) => {
  const entities = store.getState().compositionTree.entities;

  fetch(SHARE_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      description,
      title,
      definition_string: getRootNodeDefinition(entities),
    }),
  }).then(res => res.json())
    .then(console.log);
};

class ShareForm extends React.Component {
  state = {
    username: 'Anonymous User',
    description: 'No description given',
    title: 'Untitled,'
  };

  render() {
    return (
      <Form onSubmit={console.log}>
        <Form.Input
          label='Your Name / Username (Optional)'
          onChange={ (e, { value }) => this.setState({ username: value })}
        />
        <Form.Input
          label='Title'
          onChange={ (e, { value }) => this.setState({ title: value })}
        />
        <Form.TextArea
          label='Description'
          onChange={ (e, { value }) => this.setState({ description: value })}
        />
        <Form.Button
          onClick={R.partial(submitComposition, [
            this.state.username,
            this.state.description,
            this.state.title
          ])}
        >
          Submit
        </Form.Button>
      </Form>
    );
  }
}

const VizHeader = ({ activeTab, push }) => (
  <Menu inverted>
    {[
      ['home', COMPOSITION],
      ['browse', BROWSE_SHARED_COMPOSITIONS],
    ].map( (item, i) => (
      <MappedMenuItem
        key={i}
        name={item[0]}
        index={i}
        path={item[1]}
      />
    ) )}

    <MenuItem>
      <Modal
        trigger={<Button>Share this Composition</Button>}
        onOpen={pause}
        onClose={resume}
      >
        <Modal.Header>Share This Composition</Modal.Header>
        <Modal.Content>
          <ShareForm />
        </Modal.Content>
      </Modal>
    </MenuItem>
  </Menu>
);

export default connect(state => state, { push })(VizHeader);
