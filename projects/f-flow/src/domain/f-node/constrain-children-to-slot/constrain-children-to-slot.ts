import { inject, Injectable } from '@angular/core';
import { FExecutionRegister, FMediator, IExecution } from '@foblex/mediator';
import { ConstrainChildrenToSlotRequest } from './constrain-children-to-slot-request';
import { FComponentsStore } from '../../../f-storage';
import { FNodeBase, FNodeChildrenBase } from "../../../f-node";
import { IRect } from "@foblex/2d";
import { GetNormalizedElementRectRequest } from '../../get-normalized-element-rect';

@Injectable()
@FExecutionRegister(ConstrainChildrenToSlotRequest)
export class ConstrainChildrenToSlot
  implements IExecution<ConstrainChildrenToSlotRequest, void> {

  private readonly _mediator = inject(FMediator);
  private readonly _store = inject(FComponentsStore);

  private get _nodes(): FNodeBase[] {
    return this._store.fNodes;
  }

  public handle({ nodeOrGroup }: ConstrainChildrenToSlotRequest): void {
    const childrenSlot = this._store.fChildren.find(x => x.fNodeId() === nodeOrGroup.fId()) as FNodeChildrenBase | undefined;
    if (!childrenSlot) {
      return; // No slot to constrain to
    }

    const directChildren = this._calculateDirectChildren(nodeOrGroup);
    if (!directChildren.length) {
      return; // No children to constrain
    }

    const slotRect = this._childrenSlotRect(childrenSlot);
    this._constrainChildrenToSlot(directChildren, slotRect);
  }

  private _calculateDirectChildren(nodeOrGroup: FNodeBase): FNodeBase[] {
    return this._nodes.filter(x => x.fParentId() === nodeOrGroup.fId());
  }

  private _childrenSlotRect(childrenSlot: FNodeChildrenBase): IRect {
    return this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(childrenSlot.hostElement));
  }

  private _constrainChildrenToSlot(directChildren: FNodeBase[], slotRect: IRect): void {
    directChildren.forEach(child => {
      const childRect = this._boundingRect(child);
      let newPosition = { x: childRect.x, y: childRect.y };
      let needsUpdate = false;

      // Constrain top edge - child top cannot go above slot top
      if (childRect.y < slotRect.y) {
        newPosition.y = slotRect.y;
        needsUpdate = true;
      }

      // Constrain left edge - child left cannot go left of slot left
      if (childRect.x < slotRect.x) {
        newPosition.x = slotRect.x;
        needsUpdate = true;
      }

      // Constrain bottom edge - child bottom cannot go below slot bottom
      if (childRect.y + childRect.height > slotRect.y + slotRect.height) {
        newPosition.y = slotRect.y + slotRect.height - childRect.height;
        needsUpdate = true;
      }

      // Constrain right edge - child right cannot go right of slot right
      if (childRect.x + childRect.width > slotRect.x + slotRect.width) {
        newPosition.x = slotRect.x + slotRect.width - childRect.width;
        needsUpdate = true;
      }

      if (needsUpdate) {
        child.updatePosition(newPosition);
        child.redraw();
      }
    });
  }

  private _boundingRect(nodeOrGroup: FNodeBase): IRect {
    return this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(nodeOrGroup.hostElement));
  }
}