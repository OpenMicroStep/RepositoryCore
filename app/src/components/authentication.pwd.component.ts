import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationPWD } from '../main';
import { Notification, Invocation } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-pwd',
  template: `
  <div><vo-input-text label="Login" [object]="this.object" attribute="_login"></vo-input-text></div>
`
})

@Component({
  selector: 'authentication-pk',
  template: `
  <div><vo-input-text label="Login"      [object]="this.object" attribute="_login"     ></vo-input-text></div>
  <div><vo-input-text label="Public Key" [object]="this.object" attribute="_public_key"></vo-input-text></div>
`
})
export class AuthenticationPWDComponent extends VOComponent<R_AuthenticationPWD.Aspects.obi> {
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() { 
    return ["_login"];
  }
}