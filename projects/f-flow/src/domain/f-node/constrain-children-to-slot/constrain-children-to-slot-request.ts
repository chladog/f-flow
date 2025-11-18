import { FNodeBase } from '../../../f-node';

export class ConstrainChildrenToSlotRequest {
  static readonly fToken = Symbol('ConstrainChildrenToSlotRequest');

  constructor(public readonly nodeOrGroup: FNodeBase) {}
}