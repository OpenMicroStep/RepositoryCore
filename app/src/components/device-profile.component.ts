import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Use_Profile, R_Device } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';

@Component({
  selector: 'device-profile',
  template: `
  <div><vo-input-text label="Libéllé"      [object]="this.object" attribute="_label"   ></vo-input-text></div>
  <div>
    <vo-input-setselect label="Appareils" [object]="this.object" attribute="_r_device" query="devices">
      <ng-template let-item="$implicit">
        <device-li [object]="item"></device-li>
      </ng-template>
    </vo-input-setselect>
  </div>
`
})
export class DeviceProfileComponent extends VOComponent<R_Use_Profile.Aspects.obi> {
  static readonly scope = ["_label", "_r_device"];
  _r_device_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.cc);
    this._r_device_domains.push({ label: "device", create: () => R_Device.create(ctx.cc.ccc(this)) });
  }
}
