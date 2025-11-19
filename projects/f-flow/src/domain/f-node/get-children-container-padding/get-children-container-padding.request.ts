import { FNodeBase } from '../../../f-node';
import { IRect } from '@foblex/2d';

export class GetChildrenContainerPaddingRequest {
  static readonly fToken = Symbol('GetChildrenContainerPaddingRequest');

  constructor(
    public readonly fNode: FNodeBase,
    public readonly rect: IRect,
  ) {}
}
