/**
 * Defines a method for converting the composition tree into a JSON format that can be read by the Rust
 * WebAssembly backend.
 *
 * First, the normalized structure stored in Redux is converted back into a tree.  Inactive settings are
 * trimmed off, and then the tree is modified to match the schema expected by the backend.
 */
