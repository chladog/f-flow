import { FNodeChildrenBase } from '../../../f-node';

export class RemoveChildrenFromStoreRequest {
  static readonly fToken = Symbol('RemoveChildrenFromStoreRequest');

  constructor(public readonly children: FNodeChildrenBase) {}
}