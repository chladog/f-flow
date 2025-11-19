import { inject, Injectable } from '@angular/core';
import { ExpandChildrenContainerRequest } from './expand-children-container.request';
import { FExecutionRegister, IExecution } from '@foblex/mediator';
import { BrowserService } from '@foblex/platform';
import { FNodeBase } from '../../../f-node';
import { IRect } from '@foblex/2d';

/**
 * Execution that expands the fChildren container when parent node expands due to auto-expand.
 * The fChildren element should maintain its padding distance from the parent edges.
 */
@Injectable()
@FExecutionRegister(ExpandChildrenContainerRequest)
export class ExpandChildrenContainer implements IExecution<ExpandChildrenContainerRequest, void> {
  private readonly _browser = inject(BrowserService);

  public handle({ nodeOrGroup, newRect }: ExpandChildrenContainerRequest): void {
    const fChildrenElement = this._findFChildrenElement(nodeOrGroup);
    if (!fChildrenElement) {
      return;
    }

    this._expandFChildren(nodeOrGroup, fChildrenElement, newRect);
  }

  private _findFChildrenElement(node: FNodeBase): HTMLElement | null {
    if (!this._browser.isBrowser()) {
      return null;
    }

    const element = node.hostElement.querySelector(`[data-f-children]`) as HTMLElement;

    return element || null;
  }

  private _expandFChildren(
    node: FNodeBase,
    fChildrenElement: HTMLElement,
    newParentRect: IRect,
  ): void {
    // Get current dimensions
    const parentRect = node.hostElement.getBoundingClientRect();
    const childrenRect = fChildrenElement.getBoundingClientRect();

    // Calculate current padding
    const paddingLeft = childrenRect.left - parentRect.left;
    const paddingTop = childrenRect.top - parentRect.top;
    const paddingRight = parentRect.right - childrenRect.right;
    const paddingBottom = parentRect.bottom - childrenRect.bottom;

    // Calculate new fChildren size based on new parent size and maintaining padding
    const newChildrenWidth = newParentRect.width - paddingLeft - paddingRight;
    const newChildrenHeight = newParentRect.height - paddingTop - paddingBottom;

    // Apply new size to fChildren
    fChildrenElement.style.width = `${newChildrenWidth}px`;
    fChildrenElement.style.height = `${newChildrenHeight}px`;
  }
}
