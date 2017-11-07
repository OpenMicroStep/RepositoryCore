import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationPWD } from '../main';
import { Notification, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-pwd',
  template: `
<ng-template [ngIf]="this.object">
  <vo-input-text label="Nom d'utilisateur" [object]="this.object" attribute="_mlogin"></vo-input-text>
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">Mot de passe</label>
    <input type="name" class="form-control" [(ngModel)]="this._object._hashed_password">
    <span *ngIf="this.class()['has-warning']" class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>
    <span *ngIf="this.class()['has-success']" class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
  </div>
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">Vérification</label>
    <input type="name" class="form-control" [(ngModel)]="this.password2">
    <span *ngIf="this.class()['has-warning']" class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>
    <span *ngIf="this.class()['has-success']" class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
  </div>
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">Autoriser sur les appareils</label>
    <input type="checkbox" class="form-control" [readonly]="!this._object._hashed_password" [(ngModel)]="this._ciphered_private_key">
  </div>
</ng-template>
`
})
export class AuthenticationPWDComponent extends VOComponent<R_AuthenticationPWD.Aspects.obi> {
  password2: string;
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }

  static readonly scope = ["_mlogin", "_hashed_password", "_ciphered_private_key"];

  get _ciphered_private_key() {
    return this._object!._ciphered_private_key === "";
  }
  set _ciphered_private_key(v) {
    this._object!._ciphered_private_key = v ? "" : undefined;
  }

  class() {
    let isnew = this._object!.manager().state() === VersionedObjectManager.State.NEW;
    let newpwd = this._object!._hashed_password && this.password2;
    let pwdok = newpwd && this._object!._hashed_password === this.password2;
    return {
      'has-warning': isnew && !pwdok,
      'has-success': pwdok,
    }
  }
}
