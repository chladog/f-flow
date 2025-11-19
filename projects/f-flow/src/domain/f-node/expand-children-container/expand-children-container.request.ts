import { FNodeBase } from '../../../f-node';
import { IRect } from '@foblex/2d';

export class ExpandChildrenContainerRequest {
  static readonly fToken = Symbol('ExpandChildrenContainerRequest');

  constructor(
    public readonly nodeOrGroup: FNodeBase,
    public readonly newRect: IRect,
  ) {}
}
