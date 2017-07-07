import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { AppContext } from './main';
import { Notification, Invocation, DataSource, VersionedObject, Event, ControlCenter } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect/aspect.component';

@Component({
  selector: 'admin-tree-item',
  template:
  `
<li class="list-group-item">
  <span (click)="this.selected.emit(this.item)">
    <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: this.item }"></ng-container>
  </span>
  <ul class="list-group" style="margin: 0; margin-top: 5px">
    <admin-tree-item *ngFor="let child of this.item[this.child_attribute]" [item]="child" [child_attribute]="this.child_attribute" (selected)="this.selected.emit(child)">
      <ng-template let-item="$implicit">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
      </ng-template>
    </admin-tree-item>
  </ul>
</li>
`
})
export class AdminTreeItemComponent extends AspectComponent {
  @Input() item: VersionedObject;
  @Input() child_attribute: string;
  @Output() selected = new EventEmitter();
  @ContentChild(TemplateRef) template: any;

  constructor(controlCenter: ControlCenter) {
    super(controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}

@Component({
  selector: 'admin-tree',
  template:
  `
<div>
  <ul class="list-group">
    <admin-tree-item *ngFor="let child of this._roots" [item]="child" [child_attribute]="this.child_attribute" (selected)="this.selected($event)">
      <ng-template let-item="$implicit">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
      </ng-template>
    </admin-tree-item>
    <li class="list-group-item">
      <button class="btn btn-success" type="submit" (click)="create()">Create</button>
    </li>
  </ul>
</div>
`
})
export class AdminTreeComponent extends AspectComponent {
  static select: Event<{ selected: VersionedObject }> = "select";
  static create: Event<undefined> = "create";

  @Input() query: string;
  @Input() child_attribute: string;
  @Input() parent_attribute: string;
  @ContentChild(TemplateRef) template: any;
  _items: VersionedObject[] = [];
  _roots: VersionedObject[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'onItems', 'onItems', this);
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'refresh', 'saved', this.ctx.dataSource);
    this.ctx.dataSource.farEvent('query', { id: this.query, text: "" }, 'onItems', this);
  }

  refresh(notification) {
    this.ctx.dataSource.farEvent('query', { id: this.query, text: "" }, 'onItems', this);
  }

  onItems(notification: Notification<Invocation<{ items: VersionedObject[] }>>) {
    let items = notification.info.result().items;
    this._items = this.ctx.controlCenter.swapObjects(this, this._items, items);
    this._roots = this._items.filter(i => !i[this.parent_attribute]);
  }

  selected(item) {
    this.ctx.controlCenter.notificationCenter().postNotification({
      name: AdminTreeComponent.select,
      object: this,
      info: { selected: item }
    });
  }

  create() {
    this.ctx.controlCenter.notificationCenter().postNotification({
      name: AdminTreeComponent.create,
      object: this,
      info: undefined
    });
  }
}
