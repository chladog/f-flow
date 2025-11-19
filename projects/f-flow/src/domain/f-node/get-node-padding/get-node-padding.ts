import { inject, Injectable } from '@angular/core';
import { GetNodePaddingRequest } from './get-node-padding.request';
import { FExecutionRegister, FMediator, IExecution } from '@foblex/mediator';
import { FNodeBase } from '../../../f-node';
import { IRect } from '@foblex/2d';
import { BrowserService } from '@foblex/platform';
import { GetChildrenContainerPaddingRequest } from '../get-children-container-padding';

/**
 * Execution that retrieves the padding data of a Node.
 * If fChildren directive is present, uses distance between parent content box and fChildren.
 * Otherwise, if the Node includes padding, returns the padding data.
 * If neither, returns [0, 0, 0, 0].
 */
@Injectable()
@FExecutionRegister(GetNodePaddingRequest)
export class GetNodePadding
  implements IExecution<GetNodePaddingRequest, [number, number, number, number]>
{
  private readonly _browser = inject(BrowserService);
  private readonly _mediator = inject(FMediator);

  public handle(request: GetNodePaddingRequest): [number, number, number, number] {
    // First, check if fChildren directive is present
    const childrenPadding = this._mediator.execute<[number, number, number, number] | null>(
      new GetChildrenContainerPaddingRequest(request.fNode, request.rect),
    );

    if (childrenPadding !== null) {
      return childrenPadding;
    }

    // Otherwise, use the original fIncludePadding logic
    return request.fNode.fIncludePadding()
      ? this._getPaddingData(request.fNode, request.rect)
      : [0, 0, 0, 0];
  }

  private _getPaddingData(node: FNodeBase, rect: IRect): [number, number, number, number] {
    const style = this._browser.window.getComputedStyle(node.hostElement);

    return [
      this._browser.toPixels(style.paddingLeft, rect.width, rect.height, style.fontSize),
      this._browser.toPixels(style.paddingTop, rect.width, rect.height, style.fontSize),
      this._browser.toPixels(style.paddingRight, rect.width, rect.height, style.fontSize),
      this._browser.toPixels(style.paddingBottom, rect.width, rect.height, style.fontSize),
    ];
  }
}
