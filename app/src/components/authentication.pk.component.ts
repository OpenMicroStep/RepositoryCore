import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_AuthenticationPK } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'authentication-pk',
  template: `
  <div><vo-input-text label="Nom d'utilisateur"      [object]="this.object" attribute="_mlogin"     ></vo-input-text></div>
  <div><vo-input-text label="Clé publique (PEM)" [object]="this.object" attribute="_public_key"></vo-input-text></div>
`
})
export class AuthenticationPKComponent extends VOComponent<R_AuthenticationPK.Aspects.obi> {
  static readonly scope = ["_mlogin", "_public_key"];

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
