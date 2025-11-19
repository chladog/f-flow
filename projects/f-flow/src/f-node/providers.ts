import { FNodeDirective } from './f-node.directive';
import { FResizeHandleDirective } from './f-resize-handle';
import { FGroupDirective } from './f-group.directive';
import { FDragHandleDirective } from './f-drag-handle.directive';
import { FRotateHandleDirective } from './f-rotate-handle';
import { FChildrenDirective } from './f-children.directive';

export const F_NODE_PROVIDERS = [
  FGroupDirective,

  FNodeDirective,

  FDragHandleDirective,

  FResizeHandleDirective,

  FRotateHandleDirective,

  FChildrenDirective,
];
