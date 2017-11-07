import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Use_Profile } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'use-profile',
  template: `
  <div><vo-input-text label="Libéllé"      [object]="this.object" attribute="_label"     ></vo-input-text></div>
`
})
export class UseProfileComponent extends VOComponent<R_Use_Profile.Aspects.obi> {
  static readonly scope = ["_label"];
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
