/**
 * Defines the tree viewer, showing a full view of the entire composition tree.
 */

import React from 'react';
import Tree, { TreeNode } from 'rc-tree';
import 'rc-tree/assets/index.css';

const handleSelect = (a, b, c) => {
  console.log(a, b, c); // TODO
};

const TreeViewer = () => (
  <div>
    <Tree showLine showIcon={false} onSelect={handleSelect}>
      <TreeNode title='test' key='test'>
        <TreeNode title='test 2' key='test2' isLeaf />
      </TreeNode>
    </Tree>
  </div>
);

export default TreeViewer;
