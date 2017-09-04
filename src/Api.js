/**
 * Defines functions for interfacing with our backend including things like sharing/browsing/loading
 * shared noise function compositions.
 */

import { getRootNodeDefinition } from 'src/selectors/compositionTree';
import {
  API_URL,
  SHARE_SUBMISSION_URL,
  GET_SHARED_COMPOSITION_URL,
  LIST_SHARED_COMPOSITIONS_URL,
  COMPOSITIONS_PER_PAGE,
} from 'src/data/api';

/**
 * Submits a new composition to be shared.
 */
export const submitComposition = (entities, username, description, title) => {
  return fetch(`${API_URL}/${SHARE_SUBMISSION_URL}`, {
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
  }).then(res => res.json());
};

/**
 * Retrieves the JSON string definition of a noise composition given its ID.
 */
export const loadDefinition = id => {
  return fetch(`${API_URL}/${GET_SHARED_COMPOSITION_URL}/${id}`)
    .then(res => res.json());
};

export const loadSharedCompositions = (start, end, sort) => {
  const startPage = Math.floor(start / COMPOSITIONS_PER_PAGE);
  const endPage = Math.floor(end / COMPOSITIONS_PER_PAGE);
  const url = `${API_URL}/${LIST_SHARED_COMPOSITIONS_URL}/${sort}/${startPage}/${endPage}`;

  return fetch(url).then(res => res.json());
};
