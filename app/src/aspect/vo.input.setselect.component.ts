import { Component, Input, ContentChild, Type, OnInit, TemplateRef } from '@angular/core';
import { Invocation, VersionedObject, VersionedObjectManager, DataSource, Notification, Result } from '@openmicrostep/aspects';
import { VOInputComponent, sort } from './vo.input.component';

@Component({
  selector: 'vo-input-setselect',
  template:
  `
  <div class="form-group">
    <label class="control-label">{{this.label}}</label>
    <ul class="list-group">
      <li class="list-group-item" *ngFor="let item of this.valueItems(); let i = index">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
        <span (click)="this.delete(item)" class="btn btn-danger glyphicon glyphicon-remove" style="
            position: absolute;
            top: 50%;
            right: 2px;
            border-radius: 30px;
            margin-top: -17px;
            padding: 6px 9px;
        "></span>
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

  @Input() sort: string;

  @Input() set query(query: string | { id: string, [s: string]: any }) {
    if (this._query === query)
      return;
    this._query = query;
    Invocation.farEvent(this._dataSource.query, typeof query === "string" ? { id: query } : query, 'onItems', this);
  }

  constructor(dataSource: DataSource) {
    super(dataSource.controlCenter())
    this._dataSource = dataSource as DataSource.Aspects.client;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onItems', 'onItems', this);
  }

  onItems(notification: Notification<Result<{ items: T[] }>>) {
    let items = notification.info.value().items;
    this._items = this._controlCenter.ccc(this).swapObjects(this._items, items);
  }

  availableItems() {
    let v = this.value;
    return v ? this._sort(this._items.filter(i => !v!.has(i))) : this._items;
  }

  valueItems() {
    let v = this.value;
    return v ? this._sort([...v]) : [];
  }

  add(t: T) {
    this.value = new Set(this.value || []).add(t);
  }

  delete(item: T) {
    let s = new Set(this.value || []);
    s.delete(item);
    this.value = s;
  }

  private _sort(items: T[]) {
    return sort(this.sort, items);
  }
}
export namespace VOInputSetComponent {
  export type Domain = { label: string, create: () => any };
}
