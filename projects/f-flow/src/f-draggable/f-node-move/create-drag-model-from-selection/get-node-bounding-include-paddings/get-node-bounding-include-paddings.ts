import { inject, Injectable } from '@angular/core';
import { GetNodeBoundingIncludePaddingsRequest } from './get-node-bounding-include-paddings-request';
import { IRect, RectExtensions } from '@foblex/2d';
import { FExecutionRegister, FMediator, IExecution } from '@foblex/mediator';
import { FNodeBase, FNodeChildrenBase } from "../../../../f-node";
import { GetNodePaddingRequest, GetNormalizedElementRectRequest } from "../../../../domain";
import { GetNodeBoundingIncludePaddingsResponse } from "./get-node-bounding-include-paddings-response";
import { FComponentsStore } from '../../../../f-storage';

@Injectable()
@FExecutionRegister(GetNodeBoundingIncludePaddingsRequest)
export class GetNodeBoundingIncludePaddings
  implements IExecution<GetNodeBoundingIncludePaddingsRequest, GetNodeBoundingIncludePaddingsResponse> {

  private readonly _mediator = inject(FMediator);
  private readonly _store = inject(FComponentsStore);

  public handle({ nodeOrGroup, childrenPaddings }: GetNodeBoundingIncludePaddingsRequest): GetNodeBoundingIncludePaddingsResponse {
    return this._rect(nodeOrGroup, childrenPaddings);
  }

  private _rect(nodeOrGroup: FNodeBase, childrenPaddings: [number, number, number, number]): GetNodeBoundingIncludePaddingsResponse {
    const boundingRect = this._boundingRect(nodeOrGroup);
    
    // Check if parent has an fChildren slot - if so, use it as the inner rect for constraints
    const childrenSlot = this._store.fChildren.find(x => x.fNodeId() === nodeOrGroup.fId()) as FNodeChildrenBase | undefined;
    if (childrenSlot) {
      const slotRect = this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(childrenSlot.hostElement));
      
      // Calculate effective paddings based on slot position relative to parent
      // Padding order is: [LEFT, TOP, RIGHT, BOTTOM]
      const effectivePaddings: [number, number, number, number] = [
        slotRect.x - boundingRect.x, // left
        slotRect.y - boundingRect.y, // top
        (boundingRect.x + boundingRect.width) - (slotRect.x + slotRect.width), // right
        (boundingRect.y + boundingRect.height) - (slotRect.y + slotRect.height), // bottom
      ];
      
      // Add any additional children paddings
      effectivePaddings[0] += childrenPaddings[0];
      effectivePaddings[1] += childrenPaddings[1];
      effectivePaddings[2] += childrenPaddings[2];
      effectivePaddings[3] += childrenPaddings[3];
      
      // The innerRect is the slot rect - this is where children can move
      return new GetNodeBoundingIncludePaddingsResponse(
        nodeOrGroup,
        boundingRect,
        slotRect,
        effectivePaddings,
      );
    }
    
    // No fChildren slot - use traditional padding-based approach
    const paddings = this._paddings(nodeOrGroup, boundingRect);
    paddings[0] += childrenPaddings[0];
    paddings[1] += childrenPaddings[1];
    paddings[2] += childrenPaddings[2];
    paddings[3] += childrenPaddings[3];

    return new GetNodeBoundingIncludePaddingsResponse(
      nodeOrGroup,
      boundingRect,
      RectExtensions.initialize(
        boundingRect.x + paddings[0],
        boundingRect.y + paddings[1],
        boundingRect.width - paddings[0] - paddings[2],
        boundingRect.height - paddings[1] - paddings[3],
      ),
      paddings,
    )
  }

  private _boundingRect(nodeOrGroup: FNodeBase): IRect {
    return this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(nodeOrGroup.hostElement));
  }

  private _paddings(nodeOrGroup: FNodeBase, rect: IRect): [number, number, number, number] {
    return this._mediator.execute<[number, number, number, number]>(new GetNodePaddingRequest(nodeOrGroup, rect));
  }
}
