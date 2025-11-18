import { inject, Injectable } from '@angular/core';
import { FExecutionRegister, FMediator, IExecution } from '@foblex/mediator';
import { FitToChildNodesAndGroupsRequest } from './fit-to-child-nodes-and-groups-request';
import { FComponentsStore } from '../../../f-storage';
import { FNodeBase, FNodeChildrenBase } from "../../../f-node";
import { IRect, RectExtensions } from "@foblex/2d";
import { GetNormalizedElementRectRequest } from "../../get-normalized-element-rect";
import { GetNodePaddingRequest } from "../get-node-padding";

@Injectable()
@FExecutionRegister(FitToChildNodesAndGroupsRequest)
export class FitToChildNodesAndGroups
  implements IExecution<FitToChildNodesAndGroupsRequest, void> {

  private readonly _mediator = inject(FMediator);
  private readonly _store = inject(FComponentsStore);

  private get _nodes(): FNodeBase[] {
    return this._store.fNodes;
  }

  public handle({ nodeOrGroup }: FitToChildNodesAndGroupsRequest): void {
    const childrenSlot = this._store.fChildren.find(x => x.fNodeId() === nodeOrGroup.fId()) as FNodeChildrenBase | undefined;
    const isAutoSizeToFit = nodeOrGroup.fAutoSizeToFitChildren() || !!childrenSlot?.fAutoSizeToFitChildren;
    
    if (isAutoSizeToFit) {
      const directChildren = this._calculateDirectChildren(nodeOrGroup);
      if (directChildren.length) {
        if (childrenSlot) {
          this._handleWithChildrenSlot(nodeOrGroup, childrenSlot, directChildren);
        } else {
          this._handleWithPaddingOnly(nodeOrGroup, directChildren);
        }
      }
    }

    // Recurse to parent
    const parent = nodeOrGroup.fParentId();
    if (!parent) {
      return;
    }

    const parentNode = this._nodes.find(x => x.fId() === parent);
    if (!parentNode) {
      return;
    }

    this._mediator.execute<void>(new FitToChildNodesAndGroupsRequest(parentNode));
  }

  private _handleWithChildrenSlot(nodeOrGroup: FNodeBase, childrenSlot: FNodeChildrenBase, directChildren: FNodeBase[]): void {
    const currentParentRect = this._boundingRect(nodeOrGroup);
    const currentSlotRect = this._childrenSlotRect(childrenSlot);

    // Step 0: First constrain children to reasonable positions within or near the slot
    // This prevents massive expansion when children are at global coordinates
    this._constrainChildrenToReasonableBounds(directChildren, currentSlotRect, currentParentRect);

    // Step 1: Calculate what size the slot needs to be to contain all children (in global coordinates)
    const childrenUnion = this._unionRect(directChildren);
    
    if (childrenUnion.width === 0 || childrenUnion.height === 0) {
      return; // No children or invalid union
    }
    
    // Step 2: Calculate the effective padding (offset between parent edges and slot edges)
    // This includes CSS padding + any space taken by sibling content
    const effectivePadding = {
      left: currentSlotRect.x - currentParentRect.x,
      top: currentSlotRect.y - currentParentRect.y,
      right: (currentParentRect.x + currentParentRect.width) - (currentSlotRect.x + currentSlotRect.width),
      bottom: (currentParentRect.y + currentParentRect.height) - (currentSlotRect.y + currentSlotRect.height)
    };

    // Step 3: Calculate new parent rect to fit exactly around children + effective padding
    // Children are in global coordinates, so we can directly calculate parent rect
    const newParentRect = RectExtensions.initialize(
      childrenUnion.x - effectivePadding.left,
      childrenUnion.y - effectivePadding.top,
      childrenUnion.width + effectivePadding.left + effectivePadding.right,
      childrenUnion.height + effectivePadding.top + effectivePadding.bottom
    );

    // Step 4: Calculate required slot size (fits exactly to children)
    const requiredSlotWidth = childrenUnion.width;
    const requiredSlotHeight = childrenUnion.height;

    // Step 5: Update both parent and slot dimensions together - use atomic update
    if (this._hasRectChanged(currentParentRect, newParentRect) || 
        requiredSlotWidth !== currentSlotRect.width || 
        requiredSlotHeight !== currentSlotRect.height) {
      // Use requestAnimationFrame to ensure synchronous updates
      requestAnimationFrame(() => {
        // Update parent first
        nodeOrGroup.updatePosition(newParentRect);
        nodeOrGroup.updateSize(newParentRect);
        nodeOrGroup.redraw();

        // Update slot size only (stays in natural flow position)
        this._updateSlotSize(childrenSlot, requiredSlotWidth, requiredSlotHeight);
        
        // Step 6: Cascade resizing - if this parent has a parent, trigger its resizing too
        this._cascadeParentResizing(nodeOrGroup);
      });
    }
  }

  private _handleWithPaddingOnly(nodeOrGroup: FNodeBase, directChildren: FNodeBase[]): void {
    // Original padding-based logic
    const currentBounding = this._boundingRect(nodeOrGroup);
    const childrenBounding = this._calculateChildrenBounding(directChildren, this._paddings(nodeOrGroup, currentBounding));
    
    if (this._hasRectChanged(currentBounding, childrenBounding)) {
      nodeOrGroup.updatePosition(childrenBounding);
      nodeOrGroup.updateSize(childrenBounding);
      nodeOrGroup.redraw();
      
      // Also cascade resizing for padding-only nodes
      this._cascadeParentResizing(nodeOrGroup);
    }
  }

  private _constrainChildrenToReasonableBounds(directChildren: FNodeBase[], slotRect: IRect, parentRect: IRect): void {
    directChildren.forEach(child => {
      const childRect = this._boundingRect(child);
      let newPosition = { x: childRect.x, y: childRect.y };
      let needsUpdate = false;

      // If child is way outside parent bounds (indicating global coordinates issue)
      // move it to be within or near the slot area
      const maxReasonableDistance = Math.max(parentRect.width, parentRect.height) * 2;
      
      // Check if child is unreasonably far from parent
      const distanceFromParent = Math.sqrt(
        Math.pow(childRect.x - parentRect.x, 2) + Math.pow(childRect.y - parentRect.y, 2)
      );
      
      if (distanceFromParent > maxReasonableDistance) {
        // Position child within the slot area
        newPosition.x = slotRect.x + 10; // Small offset from slot edge
        newPosition.y = slotRect.y + 10;
        needsUpdate = true;
      }

      if (needsUpdate) {
        child.updatePosition(newPosition);
        child.redraw();
      }
    });
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

  private _updateSlotSize(
    childrenSlot: FNodeChildrenBase,
    width: number,
    height: number
  ): void {
    const element = childrenSlot.hostElement;
    
    // Only set width and height - slot stays in natural document flow position
    // The effective padding (including sibling content) determines the slot's natural position
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }

  private _hasRectChanged(rect1: IRect, rect2: IRect): boolean {
    return !(rect1.x === rect2.x && rect1.y === rect2.y && 
             rect1.width === rect2.width && rect1.height === rect2.height);
  }

  private _cascadeParentResizing(nodeOrGroup: FNodeBase): void {
    const parentId = nodeOrGroup.fParentId();
    if (!parentId) {
      return; // No parent to cascade to
    }

    // Find the parent node
    const parent = this._nodes.find(x => x.fId() === parentId);
    if (!parent) {
      return; // Parent not found
    }

    // Use setTimeout to avoid infinite recursion and allow current update to complete
    setTimeout(() => {
      // Trigger parent resizing after a brief delay
      this._mediator.execute<void>(new FitToChildNodesAndGroupsRequest(parent));
    }, 5); // Very small delay to ensure proper sequencing
  }

  private _calculateDirectChildren(nodeOrGroup: FNodeBase): FNodeBase[] {
    return this._nodes.filter(x => x.fParentId() === nodeOrGroup.fId());
  }

  private _unionRect(nodeOrGroups: FNodeBase[]): IRect {
    return RectExtensions.union(
      nodeOrGroups.map((x) => this._boundingRect(x)),
    ) || RectExtensions.initialize();
  }

  private _boundingRect(nodeOrGroup: FNodeBase): IRect {
    return this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(nodeOrGroup.hostElement));
  }

  private _childrenSlotRect(childrenSlot: FNodeChildrenBase): IRect {
    return this._mediator.execute<IRect>(new GetNormalizedElementRectRequest(childrenSlot.hostElement));
  }

  private _paddings(nodeOrGroup: FNodeBase, rect: IRect): [number, number, number, number] {
    return this._mediator.execute<[number, number, number, number]>(new GetNodePaddingRequest(nodeOrGroup, rect));
  }

  private _calculateChildrenBounding(directChildren: FNodeBase[], [top, right, bottom, left]: [number, number, number, number]): IRect {
    let childrenBounding = this._unionRect(directChildren);
    childrenBounding = RectExtensions.initialize(
      childrenBounding.x - left,
      childrenBounding.y - top,
      childrenBounding.width + left + right,
      childrenBounding.height + top + bottom,
    );

    return childrenBounding;
  }
}

