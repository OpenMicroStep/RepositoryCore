import { Component, Input } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-text',
  template: `
  <div class="form-group" [ngClass]="this.class()">
    <label class="control-label">{{this.label}}</label>
    <input type="name" class="form-control" [(ngModel)]="this.value">
    <span *ngIf="this.class()['has-warning']" class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>
    <span *ngIf="this.class()['has-success']" class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
  </div>`
})
export class VOInputTextComponent extends VOInputComponent<string> {

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }

  setValue(newValue: string | undefined) {
    super.setValue(newValue || undefined); // empty string -> undefined
  }
}
