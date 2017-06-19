import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Authorization, R_Right, R_Application, R_Software_Context, R_Element, R_Use_Profile, R_Device_Profile } from '../main';
import { Notification, Invocation, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'software-context-ti',
  template: `
<li class="list-group-item">
  <span *ngIf="this._r_child_contexts.length" class="glyphicon glyphicon" 
    [class.glyphicon-menu-right]="!this._expanded" 
    [class.glyphicon-menu-down]="this._expanded"
    (click)="this._expanded = !this._expanded"></span>
  {{this._item._label}}
  <div *ngIf="this.allowFastValue()" class="btn-group" role="group">
    <div class="btn-group" role="group" [class.open]="this._fastIsOpen">
      <button type="button" class="btn btn-default dropdown-toggle" (click)="this._fastIsOpen = !this._fastIsOpen;">
        {{this.fastValue()._system_name}}
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu" (click)="this._fastIsOpen = false">
        <li (click)="this.setFastValue(this._UndefinedRight)">
          <a href="#">{{this._UndefinedRight._system_name}}</a>
        </li>
        <li role="separator" class="divider"></li>
        <li *ngFor="let item of this._auth._actions" (click)="this.setFastValue(item)">
          <a href="#">{{item._system_name}}</a>
        </li>
      </ul>
    </div>
    <button type="button" class="btn btn-default"  (click)="this._advanced = !this._advanced;">Advanced</button>
  </div>
  <ul *ngIf="!this.allowFastValue() || this._advanced" class="list-group">
    <li class="list-group-item form-inline" *ngFor="let right of this.rights()">
      <vo-input-text   label="Label"            [object]="right" attribute="_label"></vo-input-text>
      <vo-input-select label="Action"           [object]="right" attribute="_r_action"           [items]="this._auth._actions">
        <ng-template let-item="$implicit">
          {{item._system_name}}
        </ng-template>
      </vo-input-select>
      <vo-input-select label="Use profile"      [object]="right" attribute="_r_use_profile"      [items]="this._app._r_sub_use_profile">
        <ng-template let-item="$implicit">
          {{item._label}}
        </ng-template>
      </vo-input-select>
      <vo-input-select label="Device profile"   [object]="right" attribute="_r_device_profile"   [items]="this._app._r_sub_device_profile">
        <ng-template let-item="$implicit">
          {{item._label}}
        </ng-template>
      </vo-input-select>
      <button class="btn btn-warning" type="submit" (click)="this.deleteRight(right)">X</button>
    </li>
    <li class="list-group-item">
      <button class="btn btn-success" type="submit" (click)="this.createRight()">Add right</button>
    </li>
  </ul>
  <ul *ngIf="this._expanded !== undefined && this._r_child_contexts.length" [class.hidden]="!this._expanded"  class="list-group">
    <software-context-ti *ngFor="let child of this._r_child_contexts" [item]="child" [app]="this._app" [auth]="this._auth"></software-context-ti>
  </ul>
</li>
` 
})
export class SoftwareContextTreeItemComponent extends AspectComponent {
  _expanded = undefined;
  _item: R_Software_Context;
  _r_child_contexts: R_Software_Context[] = [];
  _auth: AuthorizationComponent;
  _app: R_Application;
  _UndefinedRight = { _system_name: "Undefined" };
  
  @Input() set app(app) {
    this._app = app;
  }

  @Input() set auth(auth) {
    this._auth = auth;
  }

  @Input() set item(item: R_Software_Context) {
    this._item = this._controlCenter.swapObject(this, this._item, item);
    this._r_child_contexts = [...this._item._r_child_contexts].sort((a, b) => a._label! < b._label! ? -1 : 1);
  }

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  rights() {
    return this._auth.rightsOnSoftwareContext(this._item)
  }

  allowFastValue() {
    let r = this.rights();
    return r.length === 0 || (r.length === 1 && !r[0]._r_use_profile && !r[0]._r_device_profile);
  }

  fastValue() {
    let r = this.rights();
    if (r.length > 0)
      return r[0]._r_action;
    else
      return this._UndefinedRight;
  }

  setFastValue(value: R_Element) {
    let r = this.rights();
    if (r.length > 0) {
      if (value !== this._UndefinedRight)
        r[0]._r_action = value;
      else
        this.deleteRight(r[0]);
    }
    else if (value !== this._UndefinedRight)
      this.createRight()._r_action = value;
  }

  createRight() {
    return this._auth.createRight(this._app, this._item!);
  }

  deleteRight(right: R_Right) {
    this._auth.deleteRight(right)
  }
}


@Component({
  selector: 'authorization',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Urn"         [object]="this.object" attribute="_urn"        ></vo-input-text    ></div>
  <div><vo-input-text     label="Label"       [object]="this.object" attribute="_label"      ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Persons & Applications" [object]="this.object" attribute="_r_authenticable" [domains]="this._r_authenticabledomains">
       <ng-template let-item="$implicit">
        <person      *ngIf="isPerson(item)"       [object]="item"></person     >
        <application *ngIf="isApplication(item)"  [object]="item"></application>
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <div class="form-group has-feedback">
      <label class="control-label">Rights</label>
      <ul *ngIf="this._rights_loaded" class="list-group">
        <li class="list-group-item" *ngFor="let app of this._applications">
          Application {{app._label}} ({{app._urn}})
          <software-context-ti [item]="app._r_software_context" [app]="app" [auth]="this"></software-context-ti>
        </li>
      </ul>
    </div>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class AuthorizationComponent extends VOComponent<R_Authorization.Aspects.obi> {
  _r_authenticabledomains: VOInputSetComponent.Domain[] = [];
  _r_sub_right_domains: VOInputSetComponent.Domain[] = [];
  _rights_loaded = false;
  _applications: R_Application[] = [];
  _actions: R_Element[] = [];
  _use_profiles: R_Use_Profile[] = [];
  _device_profiles: R_Device_Profile[] = [];
  _rights_by_ctx = new Map<R_Software_Context, R_Right[]>();

  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_sub_right_domains.push({ label: "right" , create: () => new ctx.R_Right() });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'onTree', 'onTree', this);
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'onRights', 'onRights', this);
    this.ctx.dataSource.farEvent('query', { id: "application-tree" }, 'onTree', this);
  }

  isPerson(item) { return item instanceof this.ctx.R_Person; }
  isApplication(item) { return item instanceof this.ctx.R_Application; }

  loaded(n: Notification<Invocation<R_Authorization.Aspects.obi[]>>) {
    super.loaded(n);
    this._rights_loaded = false;
    if (this._object && this._object._r_sub_right.size > 0) {
      this.ctx.dataSource.farEvent('load', { 
        objects: [...this._object._r_sub_right], 
        scope: ["_label", "_r_action", "_r_application", "_r_software_context", "_r_use_profile", "_r_device_profile"] 
      }, "onRights", this);
    }
    else {
      this.onRights();
    }
  }

  onRights() {
    this._rights_loaded = true;
    this._rights_by_ctx = new Map();
  }

  onTree(notification: Notification<Invocation<{ "applications": R_Application[], "actions": R_Element[] }>>) {
    if (!notification.info.hasResult()) return;
    let r = notification.info.result();
    this._applications = this._controlCenter.swapObjects(this, this._applications, r.applications);
    this._actions = this._controlCenter.swapObjects(this, this._actions, r.actions.sort((a, b) => a._order! < b._order! ? -1 : 1));
  }

  rightsOnSoftwareContext(sc: R_Software_Context): R_Right[] {
    let b = this._rights_by_ctx.get(sc);
    if (b === undefined) {
      b = [];
      for (let r of this._object!._r_sub_right) {
        if (r._r_software_context === sc)
          b.push(r);
      }
      this._rights_by_ctx.set(sc, b);
    }
    return b;
  }

  createRight(app: R_Application, sc: R_Software_Context) : R_Right {
    let r = new this.ctx.R_Right();
    r._r_action = this._actions[0];
    r._r_application = app;
    r._r_software_context = sc;
    this._object!._r_sub_right = new Set(this._object!._r_sub_right).add(r);
    this._rights_by_ctx.delete(sc);
    return r;
  }

  deleteRight(right: R_Right) {
    let rs = new Set(this._object!._r_sub_right);
    rs.delete(right);
    this._rights_by_ctx.delete(right._r_software_context!);
    this._object!._r_sub_right = rs;
    right.manager().delete();
  }

  scope() {
    return ["_label", "_disabled", "_urn", "_r_authenticable", "_r_sub_right"/*, "_r_action", "_r_application",  "_r_software_context",  "_r_use_profile",  "_r_device_profile"*/];
  }

  objectsToSave(): VersionedObject[] {
    return VersionedObjectManager.objectsInScope([this.object!], ["_r_sub_right"]);
  }
}

@Component({
  selector: 'authorization-li',
  template: `{{this.item._label}}` 
})
export class AuthorizationListItemComponent extends AspectComponent {
  @Input() item: R_Authorization.Aspects.obi;

  static scope: ['_label']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
