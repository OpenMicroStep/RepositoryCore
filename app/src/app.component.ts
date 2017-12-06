import { Component, ApplicationRef } from '@angular/core';
import { AppContext } from './main';
import { AspectComponent } from './aspect/aspect.component';
import { Invocation, ControlCenterContext } from '@openmicrostep/aspects';

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
          <li role="presentation" (click)="_tab = 'persons'"        [class.active]="_tab == 'persons'"       ><a href="#" role="tab">Utilisateurs</a></li>
          <li role="presentation" (click)="_tab = 'devices'"        [class.active]="_tab == 'devices'"       ><a href="#" role="tab">Appareils</a></li>
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
      <div *ngIf="_state === 'bad login'" class="form-group">
        <div class="alert alert-danger" role="alert">
          Mauvais nom d'utilisateur ou mot de passe
        </div>
      </div>
      <div *ngIf="_state === 'bad network'" class="form-group">
        <div class="alert alert-warning" role="alert">
          Problème de communication avec le serveur
        </div>
      </div>
      <div *ngIf="_state === 'loggingout'" class="form-group">
        <div class="alert alert-info" role="alert">
          Déconnexion
        </div>
      </div>
      <div *ngIf="_state === 'loggedout'" class="form-group">
        <div class="alert alert-success" role="alert">
          Déconnecté
        </div>
      </div>
      <div class="form-group">
        <label class="control-label">Nom d'utilisateur</label>
        <input class="form-control" type="text" name="login" [(ngModel)]="this._login">
      </div>
      <div class="form-group">
        <label class="control-label">Mot de passe</label>
        <input class="form-control" type="password" name="password" [(ngModel)]="this._password">
      </div>
      <div class="form-group">
        <button class="btn btn-primary" type="submit" (click)="this.logIn()">Se connecter</button>
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

  constructor(public ctx: AppContext, ref: ApplicationRef) {
    super(ctx.cc);
    this._controlCenter.notificationCenter().addObserver(this, 'onLogged', 'onLogged', this);
    this._controlCenter.notificationCenter().addObserver(this, 'onIsAuthenticated', 'onIsAuthenticated', this);
    this._controlCenter.notificationCenter().addObserver(this, 'onLoggedOut', 'onLoggedOut', this);
    Invocation.farEvent(this.ctx.session.isAuthenticated, undefined, 'onIsAuthenticated', this);
    let destroy = ControlCenterContext.prototype.destroy;
    Object.defineProperty(ControlCenterContext.prototype, "destroy",
      {
        ...Object.getOwnPropertyDescriptor(ControlCenterContext.prototype, "destroy"),
        value: function(this: ControlCenterContext) {
          if ((ref as any)._runningTick === false)
            ref.tick();
          destroy.apply(this, arguments);
        },
      }
    )
  }

  logIn() {
    Invocation.farEvent(this.ctx.session.loginByPassword, { login: this._login, password: this._password }, 'onLogged', this);
  }

  logOut() {
    Invocation.farEvent(this.ctx.session.logout, undefined, 'onLoggedOut', this);
    this._state = 'loggingout';
    this._login = '';
    this._password = '';
  }

  onLoggedOut(n) {
    this._state = 'loggedout';
  }

  onIsAuthenticated(n) {
    this._is_logged(n);
  }

  private _is_logged(n: any) {
    let r = n.info.hasOneValue() && n.info.value() === true;
    if (r) {
      let redirect = document.location.search.match(/[&?]url=(.+?)(?:&|$)/);
      if (redirect)
        document.location.href = redirect[1];
      else
        this._state = 'logged';
    }
    return r;
  }

  onLogged(n) {
    if (!this._is_logged(n)) {
      if (n.info.hasOneValue())
        this._state = 'bad login';
      else
        this._state = 'bad network';
    }
  }
}
