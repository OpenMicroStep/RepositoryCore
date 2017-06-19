import { Component, Input, ContentChild, Type, OnInit, TemplateRef, HostListener } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager, DataSource, Notification, Invocation } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-select',
  template:
  `
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">{{this.label}}</label>
    <div class="dropdown" [ngClass]="{ open: this._isOpen }">
      <button class="btn btn-default" type="button" (click)="this._isOpen = !this._isOpen;">
        <ng-template [ngIf]="this.value">
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: this.value }"></ng-container>
        </ng-template>
        <ng-template [ngIf]="!this.value">
          &nbsp;
        </ng-template>
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu">
        <li *ngFor="let item of this._items" (click)="this.value = item; this._isOpen = false;">
          <a href="#"><ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container></a>
        </li>
      </ul>
    </div>
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

  onItems(notification: Notification<Invocation<{ items: VersionedObject[] }>>) {
    let items = notification.info.result().items;
    this._items = this._controlCenter.swapObjects(this, this._items, items);
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

