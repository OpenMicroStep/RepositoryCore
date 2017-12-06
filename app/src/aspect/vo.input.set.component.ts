import { Component, Input, ContentChild, Type, OnInit, TemplateRef } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOInputComponent, sort } from './vo.input.component';

@Component({
  selector: 'vo-input-set',
  template:
  `
  <div class="form-group">
    <label class="control-label">{{this.label}}</label>
    <ul class="list-group">
      <li class="list-group-item" *ngFor="let item of this.valueItems()">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        <span (click)="this.delete(item)" class="btn btn-danger glyphicon glyphicon-remove" style="
            position: absolute;
            top: 2px;
            right: 2px;
            border-radius: 30px;
            padding: 6px 9px;
        "></span>
      </li>
      <li class="list-group-item">
        <button  *ngFor="let t of this.domains" class="btn btn-success" type="submit" (click)="create(t)">Créer: {{t.label}}</button>
      </li>
    </ul>
  </div>
`
})
export class VOInputSetComponent<T> extends VOInputComponent<Set<T>> {
  @Input() domains: VOInputSetComponent.Domain[];
  @ContentChild(TemplateRef) template: any;
  @Input() sort: string;

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }

  valueItems() {
    let v = this.value;
    return v ? sort(this.sort, [...v]) : [];
  }

  create(t: { create: () => T }) {
    this.value = new Set(this.value || []).add(t.create());
  }

  delete(item: T) {
    let s = new Set(this.value || []);
    s.delete(item);
    this.value = s;
  }
}
export namespace VOInputSetComponent {
  export type Domain = { label: string, create: () => any };
}
