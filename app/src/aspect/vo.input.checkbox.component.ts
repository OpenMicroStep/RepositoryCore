import { Component, Input } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-checkbox',
  template: `
  <div class="form-group" [ngClass]="this.class()">
    <label class="control-label">{{this.label}}</label>
    <input type="checkbox" class="form-control" [(ngModel)]="this.value">
  </div>`
})
export class VOInputCheckboxComponent extends VOInputComponent<boolean> {

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }
}
