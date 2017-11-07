import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD, R_AuthenticationLDAP, Parameter } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOLoadComponent, VOComponent } from '../aspect/vo.component';
import { ServiceListItemComponent } from './service.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';
import { AuthenticationPKComponent } from './authentication.pk.component';
import { AuthenticationLDAPComponent } from './authentication.ldap.component';
import { ParameterComponent } from './parameter.component';

@Component({
  selector: 'person',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="URN"          [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-text     label="Nom"          [object]="this.object" attribute="_last_name"       ></vo-input-text    ></div>
  <div><vo-input-text     label="Prénom"       [object]="this.object" attribute="_first_name"      ></vo-input-text    ></div>
  <div><vo-input-text     label="Deuxième nom" [object]="this.object" attribute="_middle_name"     ></vo-input-text    ></div>
  <div><vo-input-text     label="Adresse mail" [object]="this.object" attribute="_mail"            ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Désactiver"   [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Authentification" [object]="this.object" attribute="_r_authentication" [domains]="this._r_authentication_domains">
       <ng-template let-item="$implicit">
        <authentication-pwd  *ngIf="isAuthPWD(item)"  [object]="item"></authentication-pwd >
        <authentication-pk   *ngIf="isAuthPK(item)"   [object]="item"></authentication-pk  >
        <authentication-ldap *ngIf="isAuthLDAP(item)" [object]="item"></authentication-ldap>
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-setselect label="Services" [object]="this.object" attribute="_r_services" query="services">
      <ng-template let-item="$implicit">
        <service-li [object]="item"></service-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-set label="Paramètres" [object]="this.object" attribute="_parameter" [domains]="this._parameter_domains">
      <ng-template let-item="$implicit">
        <parameter [object]="item"></parameter>
      </ng-template>
    </vo-input-set>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
  <button class="btn btn-warning" [disabled]="!this.canDelete()" type="submit" (click)="this.delete()">Delete</button>
</form>
`
})
export class PersonComponent extends VOLoadComponent<R_Person.Aspects.obi> {
  _r_authentication_domains: VOInputSetComponent.Domain[] = [];
  _parameter_domains: VOInputSetComponent.Domain[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.db);
    let ccc = ctx.cc.ccc(this);
    this._r_authentication_domains.push({
      label: "by password",
      create: () => R_AuthenticationPWD.create(ctx.cc.ccc(this))
    });
    this._r_authentication_domains.push({
      label: "by public key",
      create: () => R_AuthenticationPK.create(ctx.cc.ccc(this))
    });
    this._r_authentication_domains.push({
      label: "by ldap",
      create: () => R_AuthenticationLDAP.create(ctx.cc.ccc(this))
    });
    this._parameter_domains           .push({ label: "parameter"     , create: () => Parameter.create(ccc)           });
  }

  isAuthPWD(item) { return item instanceof R_AuthenticationPWD; }
  isAuthPK(item) { return item instanceof R_AuthenticationPK; }
  isAuthLDAP(item) { return item instanceof R_AuthenticationLDAP; }

  scope() {
    return {
      R_Person: { '.': ["_urn", "_first_name", "_middle_name", "_last_name", "_disabled", "_mail", "_r_authentication", "_r_services", "_parameter"] },
      R_Service: { '_r_services.': ServiceListItemComponent.scope },
      R_AuthenticationPWD: { '_r_authentication.': AuthenticationPWDComponent.scope },
      R_AuthenticationPK: { '_r_authentication.': AuthenticationPKComponent.scope },
      R_AuthenticationLDAP: { '_r_authentication.': AuthenticationLDAPComponent.scope },
      Parameter: { '_parameter.': ParameterComponent.scope },
    };
  }

  objectsToSave(): VersionedObject[] {
    return VersionedObjectManager.objectsInScope([this.object!], ["_r_authentication", "_parameter"]);
  }

  markForDeletion() {
    for (let a of this.objectsToSave())
      a.manager().delete();
  }
}

@Component({
  selector: 'person-li',
  template: `{{this.object._first_name}} {{this.object._last_name}}`
})
export class PersonListItemComponent extends VOComponent<R_Person.Aspects.obi> {
  static readonly scope = ['_first_name', '_last_name'];

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
