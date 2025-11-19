import { FNodeBase } from '../../../f-node';

export class FitChildrenToChildNodesRequest {
  static readonly fToken = Symbol('FitChildrenToChildNodesRequest');

  constructor(public readonly nodeOrGroup: FNodeBase) {}
}
