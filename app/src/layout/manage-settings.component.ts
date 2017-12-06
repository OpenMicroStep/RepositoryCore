import { Component } from '@angular/core';
import { AppContext, R_LDAPConfiguration, R_LDAPAttribute, R_LDAPGroup } from '../main';
import { Notification, Result, VersionedObjectManager, Invocation } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOLoadComponent }  from '../aspect/vo.component';

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
    <button class="btn btn-default" [disabled]="!object.manager().isModified()" type="submit" (click)="object.manager().clearAllModifiedAttributes()">Annuler les modifications</button>
    <button class="btn btn-primary" [disabled]="!object.manager().isModified()" type="submit" (click)="this.saveLDAPConfiguration(object)">Enregistrer</button>
  </form>
  <button class="btn btn-success" type="submit" (click)="createLDAPConfiguration()">Ajouter une configuration LDAP</button>
</div>
`
})
export class ManageSettingsComponent extends AspectComponent {
  _person_attributes = ["_first_name", "_last_name", "_mail"];
  _ldap_configurations: R_LDAPConfiguration[] = [];
  _ldap_attribute_map_domains: VOInputSetComponent.Domain[] = [];
  _ldap_group_map_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.cc);
    this._ldap_attribute_map_domains.push({ label: "by attribute map"   , create: () => R_LDAPAttribute.create(ctx.cc.ccc(this)) });
    this._ldap_group_map_domains    .push({ label: "by group map" , create: () => R_LDAPGroup.create(ctx.cc.ccc(this))  });
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.ctx.cc.notificationCenter().addObserver(this, 'onSettings', 'onSettings', this);
    Invocation.farEvent(this.ctx.db.query, { id: "settings" }, 'onSettings', this);
  }

  onSettings(notification: Notification<Result<{ "ldap-configurations": R_LDAPConfiguration[] }>>) {
    if (!notification.info.hasOneValue()) return;
    this._ldap_configurations = this._controlCenter.ccc(this).swapObjects(this._ldap_configurations, notification.info.value()["ldap-configurations"]);
  }

  createLDAPConfiguration() {
    let c = R_LDAPConfiguration.create(this.ctx.cc.ccc(this));
    this._controlCenter.ccc(this).registerObject(c);
    this._ldap_configurations.push(c);
  }

  saveLDAPConfiguration(object: R_LDAPConfiguration) {
    Invocation.farEvent(this.ctx.db.save, [object], VOLoadComponent.saved, this);
  }
}
