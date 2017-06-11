import { Component, Input, ContentChild, Type, OnInit, TemplateRef } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager, DataSource, Notification, Invocation } from '@openmicrostep/aspects';
import { VOInputComponent } from './vo.input.component';

@Component({
  selector: 'vo-input-select',
  template:
  `
 Here will be a select list
`
})
export class VOInputSelectComponent extends VOInputComponent<Set<VersionedObject>> {
  private _query: string | { id: string, [s: string]: any };
  protected _dataSource: DataSource.Aspects.client;
  _items: VersionedObject[] = [];

  @Input() set query(query: string | { id: string, [s: string]: any }) {
    if (this._query === query)
      return;
    this._query = query;
    this._dataSource.farEvent('query', typeof query === "string" ? { id: query } : query, 'onItems', this);
  }
  @ContentChild(TemplateRef) template: any;

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

  selected(item) {
  }
}

