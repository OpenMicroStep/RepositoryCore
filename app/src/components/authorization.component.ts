import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Authorization, R_Right, R_Application, R_Software_Context, R_Element, R_Use_Profile, R_Device_Profile, R_Person } from '../main';
import { Notification, Result, VersionedObject, VersionedObjectManager, Invocation, ControlCenterContext } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';


const labels = {
  'r_none': { label: 'Aucun', class: 'btn-danger' },
  'r_authenticate': { label: 'Accès', class: 'btn-info' },
  'r_use': { label: 'Utilisation', class: 'btn-success' },
  'r_superuse': { label: 'Admin', class: 'btn-warning' },
};
const default_label = { label: 'Aucun', class: 'btn-danger' };
/*

Rights:

 - Application - Device Profile - Use Profile
  - SC : Right
 */
@Component({
  selector: 'software-context-ti',
  template: `
<li *ngIf="this.object" class="list-group-item">
  <div style="display: flex;align-items: center;justify-content: center;">
    <span *ngIf="this._r_child_contexts.length" class="glyphicon glyphicon"
      [class.glyphicon-menu-right]="!this._expanded"
      [class.glyphicon-menu-down]="this._expanded"
      (click)="this._expanded = !this._expanded"></span>
    <span style="flex: 1;margin: 5px;">{{this.object._label}}</span>
    <div class="btn-group" role="group">
      <button type="button"
       class="btn btn-default" [ngClass]="this.inherited_class()"
       (click)="this.setValue(this._UndefinedRight)">{{this.inherited()}}</button>
      <button *ngFor="let item of this._auth._actions" type="button"
       class="btn" [ngClass]="this.item_class(item)"
       (click)="this.setValue(item)">{{this.item_name(item)}}</button>
    </div>
  </div>
  <ul *ngIf="this._expanded !== undefined && this._r_child_contexts.length" [class.hidden]="!this._expanded"  class="list-group" style="margin: 0; margin-top: 5px">
    <software-context-ti *ngFor="let child of this._r_child_contexts" [object]="child" [grouped_right]="this._grouped_right" [auth]="this._auth"></software-context-ti>
  </ul>
</li>
`
})
export class SoftwareContextTreeItemComponent extends AspectComponent {
  _expanded = undefined;
  _r_child_contexts: R_Software_Context[] = [];
  _auth: AuthorizationComponent;
  _grouped_right: GroupedRights;
  _UndefinedRight = { _system_name: "Undefined", _order: -1 };

  @Input() set grouped_right(grouped_right) {
    this._grouped_right = grouped_right;
  }

  @Input() set auth(auth) {
    this._auth = auth;
  }

  _object?: R_Software_Context;
  get object() : R_Software_Context | undefined {
    return this._object;
  }
  @Input() set object(item: R_Software_Context | undefined) {
    this._object = this._controlCenter.ccc(this).swapObject(this._object, item);
    this._r_child_contexts = this._controlCenter.ccc(this).swapObjects(this._r_child_contexts, item ? [...item._r_child_contexts] : []).sort((a, b) => a._label! < b._label! ? -1 : 1);
  }

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }

  inherited_right() {
    let value: R_Element | undefined = undefined;
    let sc = this.object!._r_parent_context;
    while (sc && !value) {
      let r = this._grouped_right.rights.get(sc);
      value = r && r._r_action;
      sc = sc._r_parent_context;
    }
    return value;
  }

  inherited() {
    let value = this.inherited_right();
    return `Héritée: ${value ? this.item_name(value) : 'Aucun'}`;
  }

  inherited_class() {
    let value = this.inherited_right();
    return this.item_class(value || this._UndefinedRight, this._UndefinedRight);
  }

  item_class(item: { _system_name: string | undefined }, test_item?: { _system_name: string | undefined }) {
    let name = item._system_name!;
    let active = this.value() === (test_item || item);
    return {
      [active ? (labels[name] || default_label).class : "btn-default"]: true,
      active: !test_item && active,
    };
  }

  item_name(item: R_Element) {
    let name = item._system_name!;
    return labels[name].label || name;
  }

  right() {
    return this._grouped_right.rights.get(this._object!) || { _r_action: this._UndefinedRight };
  }

  value() {
    return this.right()._r_action;
  }

  setValue(value: R_Element) {
    let sc = this._object!;
    let r = this._grouped_right.rights.get(sc);
    if (r) {
      this._auth.deleteRight(this._grouped_right, r);
    }
    if (value !== this._UndefinedRight) {
      r = this._auth.createRight(this.ctx.cc.ccc(this), this._grouped_right, sc);
      r._r_action = value;
    }
  }
}


export type GroupedRights = { key: string, app: R_Application, device_profile: R_Device_Profile | undefined, use_profile: R_Use_Profile | undefined, rights: Map<R_Software_Context, R_Right> };

@Component({
  selector: 'authorization',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="URN"         [object]="this.object" attribute="_urn"        ></vo-input-text    ></div>
  <div><vo-input-text     label="Libéllé"     [object]="this.object" attribute="_label"      ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Désactiver"  [object]="this.object" attribute="_disabled"   ></vo-input-checkbox></div>
  <div>
    <vo-input-setselect label="Personnes" [object]="this.object" attribute="_r_authenticable" query="persons">
      <ng-template let-item="$implicit">
        <person-li [object]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <div class="form-group has-feedback">
      <label class="control-label">Rights</label>
      <ul class="list-group">
        <li class="list-group-item" *ngFor="let gr of this._grouped_rights">
          <div>Application {{gr.app._label}} - {{gr.device_profile ? gr.device_profile._label : "Tous les profils d'appareils"}} - {{gr.use_profile ? gr.use_profile._label : "Tous les profils d'utilisation"}}</div>
          <software-context-ti [object]="gr.app._r_software_context" [grouped_right]="gr" [auth]="this"></software-context-ti>
        </li>
        <li class="list-group-item">
          <input-select [(value)]="selected_app" [items]="_applications">
            <ng-template let-item="$implicit">
              <application-li [object]="item"></application-li>
            </ng-template>
          </input-select>
          <input-select [(value)]="_selected_device_profile" [items]="availableDeviceProfiles()">
            <ng-template let-item="$implicit">
              {{item._label}}
            </ng-template>
          </input-select>
          <input-select [(value)]="_selected_use_profile" [items]="availableUseProfiles()">
            <ng-template let-item="$implicit">
              {{item._label}}
            </ng-template>
          </input-select>
          <button class="btn btn-success" type="submit" [disabled]="!canAdd()" (click)="add()">Ajouter</button>
        </li>
      </ul>
    </div>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="clear()">Annuler</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Enregistrer</button>
</form>
`
})
export class AuthorizationComponent extends VOLoadComponent<R_Authorization.Aspects.obi> {
  _r_authenticabledomains: VOInputSetComponent.Domain[] = [];
  _r_sub_right_domains: VOInputSetComponent.Domain[] = [];
  _applications: R_Application[] = [];
  _actions: R_Element[] = [];
  _grouped_rights: GroupedRights[] = [];
  _grouped_rights_by_key = new Map<string, GroupedRights>();
  _selected_app: R_Application | undefined = undefined;
  _selected_device_profile: R_Device_Profile | undefined = undefined;
  _selected_use_profile: R_Use_Profile | undefined = undefined;

  constructor(public ctx: AppContext) {
    super(ctx.db);
    this._r_sub_right_domains.push({ label: "right" , create: () => ctx.cc.ccc(this).create<R_Right>("R_Right") });
    this._controlCenter.ccc(this).farPromise(this.ctx.db.query, { id: "application-tree" }).then(res => this.onTree(res as any));
    Invocation.farEvent(this.ctx.db.query, { id: "application-tree" }, 'onTree', this);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  isPerson(item) { return item instanceof R_Person; }
  isApplication(item) { return item instanceof R_Application; }

  get selected_app() { return this._selected_app; }
  set selected_app(nv) {
    this._selected_app = nv;
    this._selected_device_profile = undefined;
    this._selected_use_profile = undefined;
  }
  availableDeviceProfiles() {
    return this._selected_app ? [...this._selected_app._r_sub_device_profile].sort((a, b) => a._label! < b._label! ? -1 : +1) : []; // TODO: add a cache
  }
  availableUseProfiles() {
    return this._selected_app ? [...this._selected_app._r_sub_use_profile].sort((a, b) => a._label! < b._label! ? -1 : +1) : []; // TODO: add a cache
  }
  add() {
    let key = this.addKey()!;
    let g = { key, app: this._selected_app!, device_profile: this._selected_device_profile, use_profile: this._selected_use_profile, rights: new Map() };
    this._grouped_rights_by_key.set(key, g);
    this._grouped_rights = [...this._grouped_rights_by_key.values()].sort((a, b) => a.key < b.key ? -1 : +1);
  }

  addKey() {
    return this._selected_app && JSON.stringify([this._selected_app!.id(), this._selected_device_profile && this._selected_device_profile.id(), this._selected_use_profile && this._selected_use_profile.id()]);
  }

  canAdd() : boolean {
    let key = this.addKey();
    return key ? !this._grouped_rights_by_key.get(key) : false;
  }

  loaded(n: Notification<Result<R_Authorization.Aspects.obi[]>>) {
    if (n.info.hasOneValue()) {
      let s = n.info.value()[0];
      this._controlCenter.ccc(this).swapObjects(this._object ? [...this._object._r_sub_right] : [], s ? [...s._r_sub_right] : []);
    }
    super.loaded(n);
    this.buildRightsTree();
  }

  buildRightsTree() {
    let invalids: R_Right[] = [];
    this._grouped_rights_by_key = new Map();
    for (let right of this.object!._r_sub_right) {
      let { _r_application: app, _r_device_profile: device_profile, _r_use_profile: use_profile, _r_software_context: sc } = right;
      if (!app || !sc)
        invalids.push(right);
      else {
        let key = JSON.stringify([app.id(), device_profile && device_profile.id(), use_profile && use_profile.id()]);
        let g = this._grouped_rights_by_key.get(key);
        if (!g)
          this._grouped_rights_by_key.set(key, g = { key, app, device_profile, use_profile, rights: new Map() });
        let r = g.rights.get(sc!);
        if (r && r._r_action!._order! < right._r_action!._order!)
          invalids.push(r);
        else if (r && right._r_action!._order! < r._r_action!._order!)
          invalids.push(right);
        else
          g.rights.set(sc!, right);
      }
    }
    this._grouped_rights = [...this._grouped_rights_by_key.values()].sort((a, b) => a.key < b.key ? -1 : +1);
    if (invalids.length > 0) {
      let nv = new Set(this.object!._r_sub_right);
      for (let right of invalids)
        nv.delete(right);
      this.object!._r_sub_right = nv;
    }
  }

  onTree(res: Result<{ "applications": R_Application[], "actions": R_Element[] }>) {
    if (!res.hasOneValue()) return;
    let r = res.value();
    let ccc = this._controlCenter.ccc(this);
    this._applications = ccc.swapObjects(this._applications, r.applications);
    this._actions = ccc.swapObjects(this._actions, r.actions).sort((a, b) => a._order! < b._order! ? -1 : 1);
  }

  createRight(ccc: ControlCenterContext, key: GroupedRights, sc: R_Software_Context) : R_Right {
    let r = ccc.create<R_Right>("R_Right");
    r._r_action = this._actions[0];
    r._r_application = key.app;
    r._r_software_context = sc;
    r._r_device_profile = key.device_profile;
    r._r_use_profile = key.use_profile;
    this._object!._r_sub_right = new Set(this._object!._r_sub_right).add(r);
    key.rights.set(sc, r);
    return r;
  }

  clear() {
    this.object!.manager().clear();
    this.buildRightsTree();
  }

  deleteRight(key: GroupedRights, right: R_Right) {
    let rs = new Set(this._object!._r_sub_right);
    rs.delete(right);
    key.rights.delete(right._r_software_context!);
    this._object!._r_sub_right = rs;
    right.manager().delete();
  }

  scope() {
    return {
      R_Authorization: {
        '.': ["_disabled", "_urn", "_label", "_r_authenticable", "_r_sub_right"],
      },
      R_Person: {
        '_r_authenticable.': ["_disabled", "_urn", "_first_name", "_last_name"],
      },
      R_Application: {
        '_r_authenticable.': ["_disabled", "_urn", "_label"],
      },
      R_Right: {
        '_r_sub_right.': ["_label", "_r_action", "_r_application",  "_r_software_context",  "_r_use_profile",  "_r_device_profile"],
      }
    };
  }

  objectsToSave() : VersionedObject[] {
    return VersionedObjectManager.objectsInScope([this.object!], ["_r_sub_right"]);
  }
}

@Component({
  selector: 'authorization-li',
  template: `{{this.object._label}}`
})
export class AuthorizationListItemComponent extends VOComponent<R_Authorization.Aspects.obi> {
  static readonly scope = ['_label']
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
