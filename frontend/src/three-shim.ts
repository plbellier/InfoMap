import * as THREE from 'three';

// COMPATIBILITY SHIM
// High-level Three.js constants that some dependencies (like globe.gl sub-deps) 
// still expect, but were removed in recent versions.
if ((THREE as any).VertexColors === undefined) (THREE as any).VertexColors = 2;
if ((THREE as any).NoColors === undefined) (THREE as any).NoColors = 0;
if ((THREE as any).FaceColors === undefined) (THREE as any).FaceColors = 1;

// Export everything from the original THREE
export * from 'three';
export default THREE;
