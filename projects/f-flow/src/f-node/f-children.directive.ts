import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FMediator } from '@foblex/mediator';
import { F_NODE } from './f-node-base';
import { BrowserService } from '@foblex/platform';

export const F_CHILDREN = 'fChildren';

@Directive({
  selector: '[fChildren]',
  exportAs: 'fChildren',
  host: {
    class: 'f-children',
    '[attr.data-f-children]': 'true',
  },
})
export class FChildrenDirective implements OnInit, AfterViewInit, OnDestroy {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _mediator = inject(FMediator);
  private readonly _browser = inject(BrowserService);
  private readonly _parentNode = inject(F_NODE, { optional: true });
  private readonly _elementRef = inject(ElementRef<HTMLElement>);

  public readonly hostElement: HTMLElement;

  private _resizeObserver: ResizeObserver | null = null;
  private _mutationObserver: MutationObserver | null = null;

  constructor() {
    this.hostElement = this._elementRef.nativeElement;
  }

  public ngOnInit(): void {
    if (!this._parentNode) {
      console.warn('fChildren directive must be used inside fNode or fGroup');

      return;
    }
  }

  public ngAfterViewInit(): void {
    if (!this._browser.isBrowser()) {
      return;
    }

    this._setupObservers();
  }

  private _setupObservers(): void {
    // Observe size changes of the fChildren element
    this._resizeObserver = new ResizeObserver(() => {
      this._onChildrenResize();
    });
    this._resizeObserver.observe(this.hostElement);

    // Observe text content changes that might cause layout shifts
    const parentElement = this.hostElement.parentElement;
    if (parentElement) {
      this._mutationObserver = new MutationObserver(() => {
        this._onContentMutation();
      });
      this._mutationObserver.observe(parentElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
  }

  private _onChildrenResize(): void {
    if (this._parentNode) {
      this._parentNode.refresh();
    }
  }

  private _onContentMutation(): void {
    // Refresh on content changes that might affect layout
    if (this._parentNode) {
      this._parentNode.refresh();
    }
  }

  public ngOnDestroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
    }
  }
}
