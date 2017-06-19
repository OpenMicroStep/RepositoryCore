import { Component } from '@angular/core';
import { AppContext } from './main';
import { AspectComponent } from './aspect/aspect.component';

@Component({
  selector: 'my-app',
  template:
  `
<div [ngSwitch]="_state">
  <md-tab-group *ngSwitchCase="'logged'">
    <md-tab label="Persons"><manage-persons></manage-persons></md-tab>
    <md-tab label="Devices"><manage-devices></manage-devices></md-tab>
    <md-tab label="Applications"><manage-applications></manage-applications></md-tab>
    <md-tab label="Autorisations"><manage-authorizations></manage-authorizations></md-tab>
    <md-tab label="Administration"><manage-settings></manage-settings></md-tab>
  </md-tab-group>
  <form *ngSwitchDefault>
    <div class="form-group">
      <label class="control-label">Login</label>
      <input class="form-control" type="text" name="login" [(ngModel)]="this._login">
    </div>
    <div class="form-group">
      <label class="control-label">Password</label>
      <input class="form-control" type="password" name="password" [(ngModel)]="this._password">
    </div>
    <div class="form-group">
      <button class="btn btn-primary" type="submit" (click)="this.logIn()">Log me in</button>
    </div>
  </form>
</div>
`
})
export class AppComponent extends AspectComponent {
  _state = '';
  _login = '';
  _password = '';

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
    this._controlCenter.notificationCenter().addObserver(this, 'onLogged', 'onLogged', this);
  }

  logIn() {
    this.ctx.session.farEvent('loginByPassword', { login: this._login, password: this._password }, 'onLogged', this);
  }

  onLogged(n) {
    if (n.info.hasResult() && n.info.result() === true) {
      this._state = 'logged';
    }
  }
}
