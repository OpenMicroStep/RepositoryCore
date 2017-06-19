import { Component, Input, ContentChild, Type, OnInit, TemplateRef } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-set',
  template:
  `
  <div class="form-group has-feedback">
    <label class="control-label">{{this.label}}</label>
    <ul class="list-group">
      <li class="list-group-item" *ngFor="let item of this.value">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        <button type="button" class="btn btn-danger" (click)="this.delete(item)">X</button>
      </li>
      <li class="list-group-item">
        <button  *ngFor="let t of this.domains" class="btn btn-success" type="submit" (click)="create(t)">Create {{t.label}}</button>
      </li>
    </ul>
  </div>
`
})
export class VOInputSetComponent<T> extends VOInputComponent<Set<T>> {
  @Input() domains: VOInputSetComponent.Domain[];
  @ContentChild(TemplateRef) template: any;

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }

  create(t: { create: () => T }) {
    this.value = new Set(this.value || []).add(t.create());
  }

  delete(item: T) {
    let s = new Set(this.value || []);
    s.delete(item);
    this.value = s;
    if (item instanceof VersionedObject) // TODO: this is not modular...
      item.manager().delete();
  }
}
export namespace VOInputSetComponent {
  export type Domain = { label: string, create: () => any };
}
