/**
 * Browse the creations of other users
 */

import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AutoSizer, InfiniteLoader, List } from 'react-virtualized';
import { Dropdown, Form, Grid, Image } from 'semantic-ui-react';
import R from 'ramda';

import { loadSharedCompositions } from 'src/Api';
import { SORT, addCompositions, setSort } from 'src/actions/browse';

const normalize = s => {
  const replaced = R.replace('_', ' ', s);
  return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

const sortItems = R.keys(SORT).map(key => {
  const val = normalize(key);
  return { key: val, text: val, value: key };
});

const UnconnectedBrowseControls = ({ selectedSort, setSort }) => (
  <div className='browseControls'>
    <Form>
      <Form.Group widths={1}>
        <Form.Field width={1}>
          <label>Sort By</label>
          <Dropdown
            selection
            options={sortItems}
            value={selectedSort}
            onChange={ (e, { value }) => setSort(value) }
          />
        </Form.Field>
      </Form.Group>
    </Form>
  </div>
);

const BrowseControls = connect(state => state, { setSort })(UnconnectedBrowseControls);

const BrowseSharedCompositions = ({
  dispatch, loadedCompositions, selectedSort, totalCompositions, addCompositions
}) => {
  const loadMoreRows = ({ startIndex, stopIndex }) => {
    return new Promise((f, r) => {
      loadSharedCompositions(startIndex, stopIndex, selectedSort).then(res => {
        res.Success && addCompositions(res.Success);
        f();
      });
    });
  };

  const renderRow = ({ index, key, style, parent }) => {
    const comp = loadedCompositions[index];

    return (
      <div key={key} style={style}>
        { (loadedCompositions.length > index &&
          <div key={index} style={{height: 270}}>
            <Grid columns={2}>
              <Grid.Column key={0}>
                <Link to={`/v/${comp.id}`}>
                  <Image
                    src={comp.thumbnail_url}
                    height={250}
                    width={250}
                    shape='circular'
                  />
                </Link>
              </Grid.Column>
              <Grid.Column key={1}>
                <Link to={`/v/${comp.id}`}>
                  <h2>{ comp.title }</h2>
                </Link>

                <div style={{ marginTop: 2, marginBottom: 2, fontStyle: 'italic' }}>
                  { 'Created by ' } <b style={{ color: '#aaa' }}> { comp.username } </b>
                </div>

                <br />
                { comp.description }
              </Grid.Column>
            </Grid>
          </div>) || 'Loading...'
        }
      </div>
    );
  };

  return (
    <div>
      <BrowseControls selectedSort={selectedSort} />

      <InfiniteLoader
        isRowLoaded={ ({ index }) => index < loadedCompositions.length }
        loadMoreRows={ loadMoreRows }
        rowCount={totalCompositions}
      >
        { ({ onRowsRendered, registerChild }) => (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={registerChild}
                autoHeight
                onRowsRendered={onRowsRendered}
                rowHeight={270}
                rowRenderer={renderRow}
                rowCount={loadedCompositions.length + 1}
                height={height}
                width={width}
              />
            )}
          </AutoSizer>
        ) }
      </InfiniteLoader>

      <div id='mainBrowse'>

      </div>
    </div>
  );
};

const mapState = ({ browse: { loadedCompositions, selectedSort, totalCompositions } }) => ({ loadedCompositions, selectedSort, totalCompositions });

export default connect(mapState, { addCompositions })(BrowseSharedCompositions);
