import { FNodeChildrenBase } from '../../../f-node';

export class AddChildrenToStoreRequest {
  static readonly fToken = Symbol('AddChildrenToStoreRequest');

  constructor(public readonly children: FNodeChildrenBase) {}
}