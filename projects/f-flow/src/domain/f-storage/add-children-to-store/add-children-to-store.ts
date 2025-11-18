import { inject, Injectable } from '@angular/core';
import { FExecutionRegister, IExecution } from '@foblex/mediator';
import { AddChildrenToStoreRequest } from './add-children-to-store-request';
import { FComponentsStore } from '../../../f-storage';

@Injectable()
@FExecutionRegister(AddChildrenToStoreRequest)
export class AddChildrenToStore implements IExecution<AddChildrenToStoreRequest, void> {
  private readonly _store = inject(FComponentsStore);

  public handle({ children }: AddChildrenToStoreRequest): void {
    this._store.addComponent(this._store.fChildren, children);
  }
}