export const SORT = {
  NEWEST: 'NEWEST',
  MOST_POPULAR: 'MOST_POPULAR',
};

export const SET_SORT = 'SET_SORT';

export const setSort = sort => ({ type: SET_SORT, sort });
