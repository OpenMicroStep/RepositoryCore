import { Component } from '@angular/core';
import { AppContext } from './main';
import { AspectComponent } from './aspect/aspect.component';

@Component({
  selector: 'my-app',
  template:
  `
<div [ngSwitch]="_state">
  <div *ngSwitchCase="'logged'">
    <nav class="navbar navbar-default navbar-fixed-top">
      <div class="navbar-header">
        <a class="navbar-brand" style="padding: 5px;" href="#">
          <img class="navbar-logo" style="height: 40px;" alt="Logo Logitud" src="images/logo_logitud_@2x.png" />
        </a>
      </div>
      <div class="collapse navbar-collapse">
        <ul class="nav navbar-nav">
          <li role="presentation" (click)="_tab = 'persons'"        [class.active]="_tab == 'persons'"       ><a href="#" role="tab">Persons</a></li>
          <li role="presentation" (click)="_tab = 'devices'"        [class.active]="_tab == 'devices'"       ><a href="#" role="tab">Devices</a></li>
          <li role="presentation" (click)="_tab = 'applications'"   [class.active]="_tab == 'applications'"  ><a href="#" role="tab">Applications</a></li>
          <li role="presentation" (click)="_tab = 'authorizations'" [class.active]="_tab == 'authorizations'"><a href="#" role="tab">Autorisations</a></li>
          <li role="presentation" (click)="_tab = 'settings'"       [class.active]="_tab == 'settings'"      ><a href="#" role="tab">Administration</a></li>
        </ul>
        <ul class="nav navbar-nav navbar-right">
          <li><a href="#" (click)="this.logOut()">Déconnexion</a></li>
        </ul>
      </div>
    </nav>
    <div style="padding-top: 70px;">
      <div *ngIf="_tab == 'persons'">
        <manage-persons></manage-persons>
      </div>
      <div *ngIf="_tab == 'devices'">
        <manage-devices></manage-devices>
      </div>
      <div *ngIf="_tab == 'applications'">
        <manage-applications></manage-applications>
      </div>
      <div *ngIf="_tab == 'authorizations'">
        <manage-authorizations></manage-authorizations>
      </div>
      <div *ngIf="_tab == 'settings'">
        <manage-settings></manage-settings>
      </div>
    </div>
  </div>
  <div *ngSwitchDefault style="height: 100%; display: flex; align-items: center; justify-content: center;">
    <form class="jumbotron" style="padding: 50px 100px; border-radius: 10px;">
      <div class="form-group text-center">
        <img class="navbar-logo" alt="Logo Logitud" src="images/logo_logitud_@2x.png">
      </div>
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
</div>
`
})
export class AppComponent extends AspectComponent {
  _state = '';
  _login = '';
  _password = '';
  _tab = 'persons';

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
    this._controlCenter.notificationCenter().addObserver(this, 'onLogged', 'onLogged', this);
    this._controlCenter.notificationCenter().addObserver(this, 'onLogged', 'onIsAuthenticated', this);
    this.ctx.session.farEvent('isAuthenticated', undefined, 'onIsAuthenticated', this);
  }

  logIn() {
    this.ctx.session.farEvent('loginByPassword', { login: this._login, password: this._password }, 'onLogged', this);
  }

  logOut() {
    this.ctx.session.farPromise('logout', undefined);
    this._state = 'loggedout';
  }

  onLogged(n) {
    if (n.info.hasResult() && n.info.result() === true) {
      this._state = 'logged';
    }
  }
}
