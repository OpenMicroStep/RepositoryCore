import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOLoadComponent, VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'person',
  template: `
<form *ngIf="this.object">
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
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
  <button class="btn btn-warning" [disabled]="!this.canDelete()" type="submit" (click)="this.delete()">Delete</button>
</form>
`
})
export class PersonComponent extends VOLoadComponent<R_Person.Aspects.obi> {
  _r_authentication_domains: VOInputSetComponent.Domain[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_authentication_domains.push({
      label: "by password",
      create: () => new ctx.R_AuthenticationPWD()
    });
    this._r_authentication_domains.push({
      label: "by public key",
      create: () => new ctx.R_AuthenticationPK()
    });
    this._r_authentication_domains.push({
      label: "by ldap",
      create: () => new ctx.R_AuthenticationLDAP()
    });
  }

  isAuthPWD(item) { return item instanceof this.ctx.R_AuthenticationPWD; }
  isAuthPK(item) { return item instanceof this.ctx.R_AuthenticationPK; }
  isAuthLDAP(item) { return item instanceof this.ctx.R_AuthenticationLDAP; }

  scope() {
    return ["_first_name", "_middle_name", "_last_name", "_disabled", "_mail", "_r_authentication", "_login", "_r_services"];
  }

  objectsToSave(): VersionedObject[] {
    return VersionedObjectManager.objectsInScope([this.object!], ["_r_authentication"]);
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
  static readonly scope = ['_first_name', '_last_name']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
