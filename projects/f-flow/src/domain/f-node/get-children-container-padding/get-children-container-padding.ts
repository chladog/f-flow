import { inject, Injectable } from '@angular/core';
import { GetChildrenContainerPaddingRequest } from './get-children-container-padding.request';
import { FExecutionRegister, IExecution } from '@foblex/mediator';
import { FNodeBase } from '../../../f-node';
import { BrowserService } from '@foblex/platform';

/**
 * Execution that retrieves the padding data based on fChildren container.
 * If fChildren is present, calculate distance between parent's content box and fChildren content boxes.
 * Otherwise, returns [0, 0, 0, 0].
 */
@Injectable()
@FExecutionRegister(GetChildrenContainerPaddingRequest)
export class GetChildrenContainerPadding
  implements IExecution<GetChildrenContainerPaddingRequest, [number, number, number, number] | null>
{
  private readonly _browser = inject(BrowserService);

  public handle(
    request: GetChildrenContainerPaddingRequest,
  ): [number, number, number, number] | null {
    const fChildrenElement = this._findFChildrenElement(request.fNode);
    if (!fChildrenElement) {
      return null;
    }

    return this._calculatePaddingFromChildren(request.fNode, fChildrenElement);
  }

  private _findFChildrenElement(node: FNodeBase): HTMLElement | null {
    if (!this._browser.isBrowser()) {
      return null;
    }

    // Find the element with fChildren attribute
    const element = node.hostElement.querySelector(`[data-f-children]`) as HTMLElement;

    return element || null;
  }

  private _calculatePaddingFromChildren(
    node: FNodeBase,
    childrenElement: HTMLElement,
  ): [number, number, number, number] {
    // Get the bounding rects
    const parentRect = node.hostElement.getBoundingClientRect();
    const childrenRect = childrenElement.getBoundingClientRect();

    // Calculate the distance between parent's content box and children's content box
    // Order: [left, top, right, bottom]
    const left = childrenRect.left - parentRect.left;
    const top = childrenRect.top - parentRect.top;
    const right = parentRect.right - childrenRect.right;
    const bottom = parentRect.bottom - childrenRect.bottom;

    return [left, top, right, bottom];
  }
}
