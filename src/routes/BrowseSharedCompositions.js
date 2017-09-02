/**
 * Browse the creations of other users
 */

import React from 'react';
import { connect } from 'react-redux';
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
    console.log(selectedSort, startIndex, stopIndex);
    return new Promise((f, r) => {
      loadSharedCompositions(startIndex, stopIndex, selectedSort).then(res => {
        res.Success && addCompositions(res.Success);
        f();
      });
    });
  };

  const renderRow = ({ index, key, style, parent }) => {
    console.log('render', index);

    return (
      <div key={key} style={style}>
        { (loadedCompositions.length > index &&
          <div key={index} style={{height: 420}}>
            <Grid columns={4}>
              <Grid.Column key={0}>
                <Image src={loadedCompositions[index].thumbnail_url} height={400} width={400} />
              </Grid.Column>
              <Grid.Column key={1}>
                { loadedCompositions[index].title }
              </Grid.Column>
              <Grid.Column key={2}>

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
                rowHeight={420 /* blaze it */}
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
