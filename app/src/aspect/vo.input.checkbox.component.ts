import { Component, Input } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-checkbox',
  template: `
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">{{this.label}}</label>
    <input type="checkbox" class="form-control" [(ngModel)]="this.value">
  </div>`
})
export class VOInputCheckboxComponent extends VOInputComponent<boolean> {

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }

  class() {
    let state = this.state();
    return {
       'has-warning': state === VersionedObjectManager.AttributeState.INCONFLICT
                   || state === VersionedObjectManager.AttributeState.NOTLOADED,
       'has-success': state === VersionedObjectManager.AttributeState.MODIFIED,
    }
  }
}
