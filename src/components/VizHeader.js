import React from 'react';
import { connect } from 'react-redux';
import { Button, Form, Menu, Message, Modal } from 'semantic-ui-react';
import { push } from 'react-router-redux';
import R from 'ramda';

import { COMPOSITION, BROWSE_SHARED_COMPOSITIONS } from 'src/Router';
import { pause, resume, setCanvasSize } from 'src/interop';
import { SHARE_SUBMISSION_URL } from 'src/data/misc';
import { getRootNodeDefinition } from 'src/selectors/compositionTree';
import store from 'src/reducers';
import {
  showModal, hideModal, startLoading, stopLoading, setSuccess, setError
} from 'src/actions/submission';

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

const Error = ({ message }) => (
  <Message negative>
    <Message.Header>An error occured while submitting your composition!</Message.Header>
    { message }
  </Message>
);

const Success = () => (
  <Message color='green'>Composition submitted successfully!</Message>
);

const submitComposition = (
  username, description, title, startLoading, stopLoading, setSuccess,
  setError, hideModal, entities
) => {
  startLoading();

  fetch(SHARE_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      description,
      title,
      definition_string: getRootNodeDefinition(entities),
    }),
  }).then(res => res.json())
    .then(res => {
      stopLoading();

      if(res.Success) {
        setSuccess();
        setTimeout(hideModal, 2525);
        // TODO: Navigate to the browse page and sort by newest
      } else if(res.Error) {
        setError(res.Error);
      } else {
        setError('Unexpected response from the server!');
        console.error('Unexpected response from the server: ', res);
      }
    });
};

class UnconnectedShareForm extends React.Component {
  state = {
    username: 'Anonymous User',
    description: 'No description given',
    title: 'Untitled,'
  };

  render() {
    return (
      <div>
        { this.props.error && <Error message={this.props.error} /> }
        { this.props.success && <Success /> }

        <Form>
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

          <div className="load-7" style={{ height: 30 }}>
            <div className="square-holder">
              { this.props.loading && <div className="square"></div> }
            </div>
          </div>

          <Form.Button
            onClick={R.partial(submitComposition, [
              this.state.username,
              this.state.description,
              this.state.title,
              this.props.startLoading,
              this.props.stopLoading,
              this.props.setSuccess,
              this.props.setError,
              this.props.hideModal,
              this.props.entities,
            ])}
          >
            Submit
          </Form.Button>
        </Form>
      </div>
    );
  }
}

const mapShareFormState = ({
  submission: { loading, success, error },
  compositionTree: { entities }
}) => ({ loading, success, error, entities });

const ShareForm = connect(
  mapShareFormState,
  { startLoading, stopLoading, setSuccess, setError, hideModal }
)(UnconnectedShareForm);

const SubmissionModal = ({ open }) => (
  <Modal
    onOpen={pause}
    onClose={resume}
    open={open}
  >
    <Modal.Header>Share This Composition</Modal.Header>
    <Modal.Content>
      <ShareForm />
    </Modal.Content>
  </Modal>
);

const VizHeader = ({ activeTab, modalOpen, modalLoading, push, showModal, startLoading }) => (
  <div>
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
        <Button onClick={showModal}>Share This Composition</Button>
      </MenuItem>
    </Menu>

    <SubmissionModal open={modalOpen} loading={modalLoading} startLoading={startLoading} />
  </div>
);

const mapSubmissionState = ({ submission: { modalOpen } }) => ({ modalOpen });

export default connect(mapSubmissionState, { push, showModal })(VizHeader);
