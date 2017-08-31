import React from 'react';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';
import { ConnectedRouter } from 'react-router-redux'

import Composition from 'src/routes/Composition';
import BrowseSharedCompositions from 'src/routes/BrowseSharedCompositions';
import store, { history } from 'src/reducers';

export const COMPOSITION = '/';
export const BROWSE_SHARED_COMPOSITIONS = '/browse';

export default () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path={COMPOSITION} component={Composition} />
        <Route exact path={BROWSE_SHARED_COMPOSITIONS} component={BrowseSharedCompositions} />
      </Switch>
    </ConnectedRouter>
  </Provider>
);
