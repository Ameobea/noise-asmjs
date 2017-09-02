export const SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_POPULAR: 'most_popular',
};

export const SET_SORT = 'SET_SORT';
export const ADD_COMPOSITIONS = 'ADD_COMPOSITIONS';

export const setSort = sort => ({ type: SET_SORT, sort });
export const addCompositions = compositions => ({ type: ADD_COMPOSITIONS, compositions });
