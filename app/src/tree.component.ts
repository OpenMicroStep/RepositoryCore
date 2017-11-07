import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { AppContext } from './main';
import { Notification, Result, Invocation, VersionedObject, Event, ControlCenter } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect/aspect.component';
import { VOComponent } from './aspect/vo.component';


export type AdminTreeItem = {
  vo: VersionedObject;
  childs: AdminTreeItem[];
};
@Component({
  selector: 'admin-tree-item',
  template:
  `
<li class="list-group-item">
  <span (click)="this.selected.emit(this.object)">
    <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: this.object }"></ng-container>
  </span>
  <ul class="list-group" style="margin: 0; margin-top: 5px">
    <admin-tree-item *ngFor="let child of this.childs" [object]="child.vo" [childs]="child.childs" (selected)="this.selected.emit($event)">
      <ng-template let-item="$implicit">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
      </ng-template>
    </admin-tree-item>
  </ul>
</li>
`
})
export class AdminTreeItemComponent extends VOComponent<VersionedObject> {
  @Input() childs: AdminTreeItem[];
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
    <admin-tree-item *ngFor="let child of this._roots" [object]="child.vo" [childs]="child.childs" (selected)="this.selected($event)">
      <ng-template let-item="$implicit">
        <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
      </ng-template>
    </admin-tree-item>
    <li class="list-group-item">
      <button class="btn btn-success" type="submit" (click)="create()">Ajouter un groupe d'administration</button>
    </li>
  </ul>
</div>
`
})
export class AdminTreeComponent extends AspectComponent {
  static select: Event<{ selected: VersionedObject }> = "select";
  static create: Event<undefined> = "create";

  @Input() query: string;
  @Input() parent_attribute: string;
  @ContentChild(TemplateRef) template: any;
  _items: VersionedObject[] = [];
  _roots: AdminTreeItem[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.cc.notificationCenter().addObserver(this, 'onItems', 'onItems', this);
    this.ctx.cc.notificationCenter().addObserver(this, 'refresh', 'saved', this.ctx.db);
    Invocation.farEvent(this.ctx.db.query, { id: this.query, text: "" }, 'onItems', this);
  }

  refresh(notification) {
    Invocation.farEvent(this.ctx.db.query, { id: this.query, text: "" }, 'onItems', this);
  }

  onItems(notification: Notification<Result<{ items: VersionedObject[] }>>) {
    let items = notification.info.value().items;
    this._items = this.ctx.cc.ccc(this).swapObjects(this._items, items);
    this._roots = [];
    let roots = new Map<VersionedObject | undefined, AdminTreeItem>();
    for (let vo of this._items) {
      let node_vo = roots.get(vo);
      if (!node_vo)
        roots.set(vo, node_vo = { vo: vo, childs: [] });

      let parent = vo[this.parent_attribute];
      if (parent) {
        let node_p = roots.get(parent);
        if (!node_p)
          roots.set(vo, node_p = { vo: vo, childs: [] });
        node_p.childs.push(node_vo);
      }
      else {
        this._roots.push(node_vo);
      }
    }
  }

  selected(item) {
    this.ctx.cc.notificationCenter().postNotification({
      name: AdminTreeComponent.select,
      object: this,
      info: { selected: item }
    });
  }

  create() {
    this.ctx.cc.notificationCenter().postNotification({
      name: AdminTreeComponent.create,
      object: this,
      info: undefined
    });
  }
}
