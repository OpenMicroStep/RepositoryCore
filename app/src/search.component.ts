import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy, Input, ContentChild, TemplateRef } from '@angular/core';
import { AppContext } from './main';
import { Notification, Result, DataSource, VersionedObject, Event } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect/aspect.component';

@Component({
  selector: 'search-list',
  template:
  `
<div style="position: relative;">
  <div class="input-group input-group-lg">
    <span class="input-group-addon" id="sizing-addon1"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></span>
    <input type="text" class="form-control" placeholder="Rechercher" aria-describedby="sizing-addon1" [(ngModel)]="search">
  </div>
  <ul class="list-group" style="
  overflow-x: hidden;
  height: 600px;
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow-y: scroll;">
    <li class="list-group-item" *ngFor="let item of this._items" (click)="selected(item)">
      <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
    </li>
  </ul>
  <button class="btn btn-success" style="position: absolute;bottom: 15px;right: 20px;" type="submit" (click)="create()">Create</button>
</div>
`
})
export class SearchListComponent extends AspectComponent {
  static select: Event<{ selected: VersionedObject }> = "select";
  static create: Event<undefined> = "create";

  @Input() query: string;
  @ContentChild(TemplateRef) template: any;
  _search: string = "";
  _items: any[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  get search() {
    return this._search;
  }
  set search(value) {
    this._search = value;
    this.ctx.dataSource.farEvent('query', { id: this.query, text: value }, 'onItems', this);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'onItems', 'onItems', this);
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'refresh', 'saved', this.ctx.dataSource);
    this.ctx.dataSource.farEvent('query', { id: this.query, text: "" }, 'onItems', this);
  }

  refresh(notification) {
    this.ctx.dataSource.farEvent('query', { id: this.query, text: this._search }, 'onItems', this);
  }

  onItems(notification: Notification<Result<{ items: VersionedObject[] }>>) {
    let items = notification.info.value().items;
    this._items = this.ctx.controlCenter.swapObjects(this, this._items, items);
  }

  selected(item) {
    this.ctx.controlCenter.notificationCenter().postNotification({
      name: SearchListComponent.select,
      object: this,
      info: { selected: item }
    });
  }

  create() {
    this.ctx.controlCenter.notificationCenter().postNotification({
      name: SearchListComponent.create,
      object: this,
      info: undefined
    });
  }
}
