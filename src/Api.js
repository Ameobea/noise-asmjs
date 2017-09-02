/**
 * Defines functions for interfacing with our backend including things like sharing/browsing/loading
 * shared noise function compositions.
 */

import { getRootNodeDefinition } from 'src/selectors/compositionTree';
import { SHARE_SUBMISSION_URL, GET_SHARED_COMPOSITION_URL } from 'src/data/api';

/**
 * Submits a new composition to be shared.
 */
export const submitComposition = (entities, username, description, title) => {
  return fetch(SHARE_SUBMISSION_URL, {
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
  return fetch(`${GET_SHARED_COMPOSITION_URL}/${id}`)
    .then(res => res.json());
};
