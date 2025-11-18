import { inject, Injectable } from '@angular/core';
import { FExecutionRegister, IExecution } from '@foblex/mediator';
import { RemoveChildrenFromStoreRequest } from './remove-children-from-store-request';
import { FComponentsStore } from '../../../f-storage';

@Injectable()
@FExecutionRegister(RemoveChildrenFromStoreRequest)
export class RemoveChildrenFromStore implements IExecution<RemoveChildrenFromStoreRequest, void> {
  private readonly _store = inject(FComponentsStore);

  public handle({ children }: RemoveChildrenFromStoreRequest): void {
    this._store.removeComponent(this._store.fChildren, children);
  }
}