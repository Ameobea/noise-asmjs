/**
 * Defines the tree viewer, showing a full view of the entire composition tree.
 */

import React from 'react';
import { Tree } from 'antd';
const TreeNode = Tree.TreeNode;

const TreeViewer = () => (
  <div style={{backgroundColor: '#fff'}}>
    <Tree
      showLine
      showIcon={false}
      defaultExpandedKeys={[0]}
    >
      <TreeNode title='Global Configuration' key={-1} />
      <TreeNode title='Root Node' key={0}>
        <TreeNode title='children' key={1}>
          <TreeNode title='Worley' key={2} />
          <TreeNode title='Billow' key={3} />
          <TreeNode title='SuperSimplex' key={4} />
          <TreeNode title='Add...' key={5} />
        </TreeNode>
      </TreeNode>
    </Tree>
  </div>
);

export default TreeViewer;
