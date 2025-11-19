import { inject, Injectable } from '@angular/core';
import { FExecutionRegister, FMediator, IExecution } from '@foblex/mediator';
import { FitChildrenToChildNodesRequest } from './fit-children-to-child-nodes.request';
import { FComponentsStore } from '../../../f-storage';
import { FNodeBase } from '../../../f-node';
import { IRect, RectExtensions } from '@foblex/2d';
import { GetNormalizedElementRectRequest } from '../../get-normalized-element-rect';
import { BrowserService } from '@foblex/platform';

@Injectable()
@FExecutionRegister(FitChildrenToChildNodesRequest)
export class FitChildrenToChildNodes implements IExecution<FitChildrenToChildNodesRequest, void> {
  private readonly _mediator = inject(FMediator);
  private readonly _store = inject(FComponentsStore);
  private readonly _browser = inject(BrowserService);

  private get _nodes(): FNodeBase[] {
    return this._store.fNodes;
  }

  public handle({ nodeOrGroup }: FitChildrenToChildNodesRequest): void {
    const fChildrenElement = this._findFChildrenElement(nodeOrGroup);
    if (!fChildrenElement) {
      return;
    }

    if (nodeOrGroup.fAutoSizeToFitChildren()) {
      const directChildren = this._calculateDirectChildren(nodeOrGroup);
      if (directChildren.length) {
        this._fitChildrenAndParent(nodeOrGroup, fChildrenElement, directChildren);
      }
    }

    // Recursively update parent
    const parent = nodeOrGroup.fParentId();
    if (!parent) {
      return;
    }

    const parentNode = this._nodes.find((x) => x.fId() === parent);
    if (!parentNode) {
      return;
    }

    this._mediator.execute<void>(new FitChildrenToChildNodesRequest(parentNode));
  }

  private _findFChildrenElement(node: FNodeBase): HTMLElement | null {
    if (!this._browser.isBrowser()) {
      return null;
    }

    const element = node.hostElement.querySelector(`[data-f-children]`) as HTMLElement;

    return element || null;
  }

  private _calculateDirectChildren(nodeOrGroup: FNodeBase): FNodeBase[] {
    return this._nodes.filter((x) => x.fParentId() === nodeOrGroup.fId());
  }

  private _fitChildrenAndParent(
    nodeOrGroup: FNodeBase,
    fChildrenElement: HTMLElement,
    directChildren: FNodeBase[],
  ): void {
    // Get the union of all child nodes
    const childrenUnion = this._unionRect(directChildren);
    if (!childrenUnion) {
      return;
    }

    // Get parent and fChildren current positions
    const parentRect = this._boundingRect(nodeOrGroup);
    const childrenRect = fChildrenElement.getBoundingClientRect();

    // Calculate current padding from parent to fChildren
    const paddingLeft = childrenRect.left - parentRect.x;
    const paddingTop = childrenRect.top - parentRect.y;
    const paddingRight = parentRect.x + parentRect.width - (childrenRect.left + childrenRect.width);
    const paddingBottom =
      parentRect.y + parentRect.height - (childrenRect.top + childrenRect.height);

    // Set fChildren size to fit child nodes tightly
    const newChildrenWidth = childrenUnion.width;
    const newChildrenHeight = childrenUnion.height;

    fChildrenElement.style.width = `${newChildrenWidth}px`;
    fChildrenElement.style.height = `${newChildrenHeight}px`;

    // Update parent size based on fChildren size + padding
    const newParentWidth = newChildrenWidth + paddingLeft + paddingRight;
    const newParentHeight = newChildrenHeight + paddingTop + paddingBottom;

    // Calculate new parent position to keep children in same place
    const newParentX = childrenUnion.x - paddingLeft;
    const newParentY = childrenUnion.y - paddingTop;

    nodeOrGroup.updatePosition({ x: newParentX, y: newParentY });
    nodeOrGroup.updateSize({ width: newParentWidth, height: newParentHeight });
    nodeOrGroup.redraw();
  }

  private _unionRect(nodeOrGroups: FNodeBase[]): IRect | null {
    return (
      RectExtensions.union(nodeOrGroups.map((x) => this._boundingRect(x))) ||
      RectExtensions.initialize()
    );
  }

  private _boundingRect(nodeOrGroup: FNodeBase): IRect {
    return this._mediator.execute<IRect>(
      new GetNormalizedElementRectRequest(nodeOrGroup.hostElement),
    );
  }
}
