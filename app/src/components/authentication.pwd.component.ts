import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationPWD } from '../main';
import { Notification, Invocation, VersionedObjectManager } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-pwd',
  template: `
<ng-template [ngIf]="this.object">
  <vo-input-text label="Login" [object]="this.object" attribute="_mlogin"></vo-input-text>
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">Password</label>
    <input type="name" class="form-control" [(ngModel)]="this._object._password">
    <span *ngIf="this.class()['has-warning']" class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>
    <span *ngIf="this.class()['has-success']" class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
  </div>
  <div class="form-group has-feedback" [ngClass]="this.class()">
    <label class="control-label">Vérification</label>
    <input type="name" class="form-control" [(ngModel)]="this.password2">
    <span *ngIf="this.class()['has-warning']" class="glyphicon glyphicon-warning-sign form-control-feedback" aria-hidden="true"></span>
    <span *ngIf="this.class()['has-success']" class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>
  </div>
</ng-template>
`
})
export class AuthenticationPWDComponent extends VOComponent<R_AuthenticationPWD.Aspects.obi> {
  password2: string;
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() { 
    return ["_mlogin", "_hashed_password"]; // TODO: fix this workaround (will load _password)
  }

  class() {
    let isnew = this._object!.manager().state() === VersionedObjectManager.State.NEW;
    let newpwd = this._object!._password && this.password2;
    let pwdok = newpwd && this._object!._password === this.password2;
    return {
      'has-warning': isnew && !pwdok,
      'has-success': pwdok,
    }
  }
}