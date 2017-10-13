import { Component, Input, ContentChild, Type, OnInit, TemplateRef, HostListener, Output, EventEmitter } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager, DataSource, Notification, Result, Invocation } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';
import { AspectComponent } from './aspect.component';

@Component({
  selector: 'input-select',
  template:
  `
<span class="dropdown" [class.open]="this._isOpen">
  <button class="btn btn-default" type="button" (click)="this._isOpen = !this._isOpen;">
    <ng-template [ngIf]="this.value && this._items.length">
      <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: this.value }"></ng-container>
    </ng-template>
    <ng-template [ngIf]="!(this.value && this._items.length)">
      &nbsp;
    </ng-template>
    <span class="caret"></span>
  </button>
  <ul class="dropdown-menu">
    <li *ngFor="let item of this._items" (click)="this.value = item; this._isOpen = false;">
      <a href="#"><ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container></a>
    </li>
  </ul>
</span>
`
})
export class InputSelectComponent<T> extends AspectComponent {
  _items: any[] = [];
  _isOpen = false;
  @ContentChild(TemplateRef) template: any;

  @Input() set items(items: IterableIterator<T>) {
    this._items = [...items];
  }

  _value: T | undefined = undefined;
  @Input() get value(): T | undefined {
    return this._value;
  }
  @Output() valueChange = new EventEmitter();
  set value(newValue: T | undefined) {
    if (this._value === newValue) return;
    if (this._value instanceof VersionedObject || newValue instanceof VersionedObject)
      this._value = this._controlCenter.ccc(this).swapObject(this._value as any, newValue as any);
    else
    this._value = newValue;
    this.valueChange.emit(this._value);
  }

  constructor(controlCenter: ControlCenter) {
    super(controlCenter)
  }
}

@Component({
  selector: 'vo-input-select',
  template:
  `
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">{{this.label}}</label>
    <input-select [(value)]="this.value" [items]="this._items">
      <ng-template let-item="$implicit">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
      </ng-template>
    </input-select>
  </div>
`
})
export class VOInputSelectComponent extends VOInputComponent<VersionedObject> {
  private _query: string | { id: string, [s: string]: any };
  protected _dataSource: DataSource.Aspects.client;
  _items: VersionedObject[] = [];
  _isOpen = false;

  @ContentChild(TemplateRef) template: any;

  @Input() set items(items: IterableIterator<VersionedObject>) {
    this._items = [...items];
  }

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

  onItems(notification: Notification<Result<{ items: VersionedObject[] }>>) {
    let items = notification.info.value().items;
    this._items = this._controlCenter.ccc(this).swapObjects(this._items, items);
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

