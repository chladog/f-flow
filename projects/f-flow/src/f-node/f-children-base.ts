import { Signal } from '@angular/core';
import { IHasHostElement } from '../i-has-host-element';

/**
 * Base class for fChildren directives that define child container areas within nodes/groups
 */
export abstract class FNodeChildrenBase implements IHasHostElement {
  public hostElement!: HTMLElement;
  
  /**
   * The ID of the parent node/group this children container belongs to
   */
  public abstract fNodeId: Signal<string>;
  
  /**
   * Whether this children container should auto-size to fit its children
   * This can override the parent node's fAutoSizeToFitChildren setting
   */
  public fAutoSizeToFitChildren: boolean | undefined;
  
  /**
   * Whether this children container should auto-expand when a child hits its boundary
   * This can override the parent node's fAutoExpandOnChildHit setting
   */
  public fAutoExpandOnChildHit: boolean | undefined;
}