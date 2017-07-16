/**
 * Defines the internal representation of the composition tree.  Contains methods for converting it to the JSON format
 * expected by the backend.
 */

import React from 'react';
import { connect } from 'react-redux';
import Tree, { TreeNode } from 'rc-tree';
import 'rc-tree/assets/index.css';
import R from 'ramda';

import { getNodeData, getLeafStatus, getLeafTitle } from 'src/data/compositionTree/nodeTypes';
import { NULL_UUID } from 'src/data/misc';
import { selectNode } from 'src/actions/compositionTree';

const mapIdsToEntites = (entities, ids) => R.map(id => entities[id], ids);

const buildTreeNode = (allNodes, allSettings, node) => {
  const { id, type, childNodes, settings } = node;
  const nodeSchema = getNodeData(type);

  const children = R.map(props => buildTreeNode(allNodes, allSettings, {
    id: props.id,
    type: props.type,
    childNodes: mapIdsToEntites(allNodes, props.children),
    settings: mapIdsToEntites(allSettings, props.settings),
  }), childNodes);
  // Passing even an empty array still gives the node a `+` expander icon, so this is necessary to remove that.
  const realChildren = children.length !== 0 ? children : undefined;

  return (
    <TreeNode
      title={ getLeafTitle(nodeSchema, settings) }
      key={id}
      isLeaf={ getLeafStatus(nodeSchema, settings) }
      filterTreeNode={ R.T }
    >
      { realChildren }
    </TreeNode>
  );
};

const mapSelectedNodes = selectedNodes => selectedNodes.length === 0 ? null : selectedNodes[0];

/**
 * Given a tree definition in the "normalized" form, transforms it into the tree GUI used by the tree viewer.
 */
const UnconnectedBuiltTree = ({ allNodes, allSettings, selectedNode, selectNode }) => {
  const { id, type, children, settings } = allNodes[NULL_UUID];

  return (
    <Tree
      showLine
      showIcon={false}
      onSelect={R.compose(selectNode, mapSelectedNodes)}
      selectedKeys={[selectedNode]}
      defaultExpandedKeys={[NULL_UUID]}
    >
      {
        buildTreeNode(allNodes, allSettings, {
          id,
          type,
          childNodes: mapIdsToEntites(allNodes, children),
          settings: mapIdsToEntites(allSettings, settings),
        })
      }
    </Tree>
  );
};

export const BuiltTree = connect(({ compositionTree: { selectedNode } }) => ({ selectedNode }), {selectNode})(UnconnectedBuiltTree);
