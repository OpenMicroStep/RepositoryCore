import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationLDAP } from '../main';
import { Notification, Invocation } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-ldap',
  template: `
  <div><vo-input-text label="Login"      [object]="this.object" attribute="_mlogin"  ></vo-input-text></div>
  <div><vo-input-text label="DN"         [object]="this.object" attribute="_ldap_dn"></vo-input-text></div>
`
})
export class AuthenticationLDAPComponent extends VOComponent<R_AuthenticationLDAP.Aspects.obi> {
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() { 
    return ["_mlogin", "_ldap_dn"];
  }
}