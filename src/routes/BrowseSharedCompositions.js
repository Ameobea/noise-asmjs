/**
 * Browse the creations of other users
 */

import React from 'react';
import { connect } from 'react-redux';
import { InfiniteLoader, List, WindowScroller } from 'react-virtualized';
import { Dropdown, Form } from 'semantic-ui-react';
import R from 'ramda';

import { SORT, setSort } from 'src/actions/browse';

const normalize = s => {
  const replaced = R.replace('_', ' ', s);
  return replaced.charAt(0).toUpperCase() + replaced.slice(1).toLowerCase();
};

const renderRow = loadedCompositions => ({ index, key, style, parent }) => (
  <div key={index}>
    { index }
  </div>
);

const loadMoreRows = ({ startIndex, stopIndex }) => {
  console.log(startIndex, stopIndex);
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

const BrowseSharedCompositions = ({ loadedCompositions, selectedSort, totalCompositions }) => (
  <div>
    <BrowseControls selectedSort={selectedSort} />

    <InfiniteLoader
      isRowLoaded={ ({ index }) => index < loadedCompositions }
      loadMoreRows={loadMoreRows}
    >
      { ({ onRowsRendered, registerChild }) => (
        <WindowScroller scrollElement={document.getElementById('mainBrowse')}>
          { ({ height, width, isScrolling, onChildScroll, scrollTop }) => (
            <List
              ref={registerChild}
              autoHeight
              isScrolling={isScrolling}
              onRowsRendered={onRowsRendered}
              onScroll={onChildScroll}
              scrollTop={scrollTop}
              rowHeight={420 /* blaze it */}
              height={height}
              width={width}
              rowRenderer={renderRow(loadedCompositions)}
              rowCount={totalCompositions}
            />
          ) }
        </WindowScroller>
      ) }
    </InfiniteLoader>

    <div id='mainBrowse'>

    </div>
  </div>
);

const mapState = ({ browse: { loadedCompositions, selectedSort, totalCompositions, } }) => ({ loadedCompositions, selectedSort, totalCompositions });

export default connect(mapState)(BrowseSharedCompositions);
