import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Optional,
} from '@angular/core';
import { FNodeChildrenBase } from './f-children-base';
import { FMediator } from '@foblex/mediator';
import { F_NODE, FNodeBase } from './f-node-base';
import { AddChildrenToStoreRequest, RemoveChildrenFromStoreRequest } from '../domain';

/**
 * Directive that defines a children container area within a node or group.
 * This allows for more precise control over where child nodes can be placed
 * and how the parent should size itself relative to children.
 * 
 * Automatically inherits fNodeId, fAutoSizeToFitChildren, and fAutoExpandOnChildHit
 * from the parent node/group unless explicitly overridden.
 * 
 * Usage:
 * ```html
 * <div fGroup fGroupId="parent">
 *   <div class="header">Group Header</div>
 *   <div fChildren>
 *     <!-- Child nodes will be constrained to this area -->
 *     <!-- Automatically uses parent's ID and settings -->
 *   </div>
 * </div>
 * ```
 */
@Directive({
  selector: '[fChildren]',
  exportAs: 'fChildren',
  host: {
    class: 'f-children',
    '[attr.data-f-node-id]': 'fNodeId()',
  },
})
export class FChildrenDirective extends FNodeChildrenBase implements OnInit, OnDestroy {
  private readonly _mediator = inject(FMediator);
  private readonly _parentNode = inject(F_NODE, { optional: true });

  /**
   * The ID of the parent node/group this children container belongs to.
   * If not provided, automatically uses the parent node's ID.
   */
  public readonly _explicitNodeId = input<string | undefined>(undefined, { alias: 'fNodeId' });

  public override get fNodeId() {
    const explicitId = this._explicitNodeId();
    const parentId = this._parentNode?.fId();
    const nodeId = explicitId || parentId || '';
    
    // Return a signal-like object
    return (() => nodeId) as any;
  }

  constructor() {
    super();
    const elementRef = inject(ElementRef<HTMLElement>);
    this.hostElement = elementRef.nativeElement;
  }

  /**
   * Whether this children container should auto-size to fit its children.
   * When undefined, inherits from parent node. When explicitly set, overrides parent.
   */
  public readonly _explicitAutoSizeToFitChildren = input(undefined, {
    alias: 'fAutoSizeToFitChildren',
    transform: (value: boolean | string | undefined) => 
      value === undefined ? undefined : booleanAttribute(value)
  });

  /**
   * Whether this children container should auto-expand when a child hits its boundary.
   * When undefined, inherits from parent node. When explicitly set, overrides parent.
   */
  public readonly _explicitAutoExpandOnChildHit = input(undefined, {
    alias: 'fAutoExpandOnChildHit',
    transform: (value: boolean | string | undefined) => 
      value === undefined ? undefined : booleanAttribute(value)
  });

  public ngOnInit(): void {
    // Set inherited properties from parent node
    const explicitAutoSize = this._explicitAutoSizeToFitChildren();
    const explicitAutoExpand = this._explicitAutoExpandOnChildHit();
    
    this.fAutoSizeToFitChildren = explicitAutoSize !== undefined 
      ? explicitAutoSize 
      : this._parentNode?.fAutoSizeToFitChildren?.();
      
    this.fAutoExpandOnChildHit = explicitAutoExpand !== undefined 
      ? explicitAutoExpand 
      : this._parentNode?.fAutoExpandOnChildHit?.();

    // Register this children container with the store
    this._mediator.execute<void>(new AddChildrenToStoreRequest(this));
    console.log('FChildren directive initialized for node:', this.fNodeId(), {
      autoSize: this.fAutoSizeToFitChildren,
      autoExpand: this.fAutoExpandOnChildHit
    });
  }

  public ngOnDestroy(): void {
    // Remove this children container from the store
    this._mediator.execute<void>(new RemoveChildrenFromStoreRequest(this));
    console.log('FChildren directive destroyed for node:', this.fNodeId());
  }
}