import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationPK } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOLoadComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-pk',
  template: `
  <div><vo-input-text label="Login"      [object]="this.object" attribute="_mlogin"     ></vo-input-text></div>
  <div><vo-input-text label="Public Key" [object]="this.object" attribute="_public_key"></vo-input-text></div>
`
})
export class AuthenticationPKComponent extends VOLoadComponent<R_AuthenticationPK.Aspects.obi> {
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() {
    return ["_mlogin", "_public_key"];
  }
}
