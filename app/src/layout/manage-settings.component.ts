import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext, R_LDAPConfiguration } from '../main';
import { Notification, Result, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOLoadComponent }  from '../aspect/vo.component';
import { PersonComponent } from '../components/person.component';

@Component({
  selector: 'manage-settings',
  template: `
<div class="col-md-12">
  <form *ngFor="let object of this._ldap_configurations">
    <div><vo-input-text     label="Url"          [object]="object" attribute="_ldap_url"          ></vo-input-text></div>
    <div><vo-input-text     label="ReadOnly DN"     [object]="object" attribute="_ldap_dn"           ></vo-input-text></div>
    <div><vo-input-text     label="ReadOnly password"     [object]="object" attribute="_ldap_password"     ></vo-input-text></div>
    <div><vo-input-text     label="User base"    [object]="object" attribute="_ldap_user_base"    ></vo-input-text></div>
    <div><vo-input-text     label="User filter"  [object]="object" attribute="_ldap_user_filter"  ></vo-input-text></div>
    <div>
      <vo-input-set label="Attribute Map" [object]="object" attribute="_ldap_attribute_map" [domains]="this._ldap_attribute_map_domains">
        <ng-template let-item="$implicit">
          <div><vo-input-text label="LDAP Attribute Name" [object]="item" attribute="_ldap_attribute_name"   ></vo-input-text></div>
          <div><vo-input-select label="Person Attribute Name" [object]="item" attribute="_ldap_to_attribute_name" [items]="_person_attributes">
            <ng-template let-item="$implicit">{{ item }}</ng-template>
          </vo-input-select></div>
        </ng-template>
      </vo-input-set>
    </div>
    <div>
      <vo-input-set label="Group Map" [object]="object" attribute="_ldap_group_map" [domains]="this._ldap_group_map_domains">
        <ng-template let-item="$implicit">
          <div><vo-input-text   label="LDAP DN"       [object]="item" attribute="_ldap_dn"   ></vo-input-text  ></div>
          <div>
            <vo-input-select label="Authorization" [object]="item" attribute="_ldap_group" query="authorizations">
              <ng-template let-item="$implicit">
                <authorization-li [object]="item"></authorization-li>
              </ng-template>
            </vo-input-select>
          </div>
        </ng-template>
      </vo-input-set>
    </div>
    <button class="btn btn-default" [disabled]="!object.manager().hasChanges()" type="submit" (click)="object.manager().clear()">Undo</button>
    <button class="btn btn-primary" [disabled]="!object.manager().hasChanges()" type="submit" (click)="this.saveLDAPConfiguration(object)">Save</button>
  </form>
  <button class="btn btn-success" type="submit" (click)="createLDAPConfiguration()">Create</button>
</div>
`
})
export class ManageSettingsComponent extends AspectComponent {
  _person_attributes = ["_first_name", "_last_name", "_mail"];
  _ldap_configurations: R_LDAPConfiguration[] = [];
  _ldap_attribute_map_domains: VOInputSetComponent.Domain[] = [];
  _ldap_group_map_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
    this._ldap_attribute_map_domains.push({ label: "by attribute map"   , create: () => new ctx.R_LDAPAttribute() });
    this._ldap_group_map_domains    .push({ label: "by group map" , create: () => new ctx.R_LDAPGroup()  });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.controlCenter.notificationCenter().addObserver(this, 'onSettings', 'onSettings', this);
    this.ctx.dataSource.farEvent('query', { id: "settings" }, 'onSettings', this);
  }

  onSettings(notification: Notification<Result<{ "ldap-configurations": R_LDAPConfiguration[] }>>) {
    if (!notification.info.hasOneValue()) return;
    this._ldap_configurations = this._controlCenter.swapObjects(this, this._ldap_configurations, notification.info.value()["ldap-configurations"]);
  }

  createLDAPConfiguration() {
    let c = new this.ctx.R_LDAPConfiguration();
    this._controlCenter.registerObjects(this, [c]);
    this._ldap_configurations.push(c);
  }

  saveLDAPConfiguration(object: R_LDAPConfiguration) {
    this.ctx.dataSource.farEvent("save", VersionedObjectManager.objectsInScope([object], ["_ldap_attribute_map", "_ldap_group_map"]), VOLoadComponent.saved, this);
  }
}
