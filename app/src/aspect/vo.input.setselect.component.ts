import { Component, Input, ContentChild, Type, OnInit, TemplateRef } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager, DataSource, Notification, Invocation } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-setselect',
  template:
  `
  <div class="form-group has-feedback">
    <label class="control-label">{{this.label}}</label>
    <ul class="list-group">
      <li class="list-group-item" *ngFor="let item of this.value; let i = index">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        <button type="button" class="btn btn-danger" (click)="this.delete(item)">X</button>
      </li>
      <li class="list-group-item">
        <input-select [(value)]="_value" [items]="this.availableItems()">
          <ng-template let-item="$implicit">
            <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
          </ng-template>
        </input-select>
        <button class="btn btn-success" type="submit" [disabled]="!_value" (click)="add(_value); _value= undefined;">Ajouter</button>
      </li>
    </ul>
  </div>
`
})
export class VOInputSetSelectComponent<T extends VersionedObject> extends VOInputComponent<Set<T>> {
  private _query: string | { id: string, [s: string]: any };
  protected _dataSource: DataSource.Aspects.client;
  _items: T[] = [];
  _isOpen = false;
  _value: T | undefined;

  @ContentChild(TemplateRef) template: any;

  @Input() set items(items: IterableIterator<T>) {
    this._items = [...items];
  }

  @Input() set query(query: string | { id: string, [s: string]: any }) {
    if (this._query === query)
      return;
    this._query = query;
    this._dataSource.farEvent('query', typeof query === "string" ? { id: query } : query, 'onItems', this);
  }

  constructor(dataSource: DataSource) {
    super(dataSource.controlCenter())
    this._dataSource = dataSource as DataSource.Aspects.client;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onItems', 'onItems', this);
  }

  onItems(notification: Notification<Invocation<{ items: T[] }>>) {
    let items = notification.info.result().items;
    this._items = this._controlCenter.swapObjects(this, this._items, items);
  }

  availableItems() {
    let v = this.value;
    return v ? this._items.filter(i => !v!.has(i)) : this._items;
  }

  class() {
    let state = this.state();
    return {
      'has-warning': state === VersionedObjectManager.AttributeState.INCONFLICT
                  || state === VersionedObjectManager.AttributeState.NOTLOADED,
      'has-success': state === VersionedObjectManager.AttributeState.MODIFIED,
    }
  }

  add(t: T) {
    this.value = new Set(this.value || []).add(t);
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
