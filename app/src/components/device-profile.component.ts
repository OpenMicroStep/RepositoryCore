import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Use_Profile } from '../main';
import { Notification, Invocation } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';

@Component({
  selector: 'device-profile',
  template: `
  <div><vo-input-text label="Label"      [object]="this.object" attribute="_label"   ></vo-input-text></div>
  <div>
    <vo-input-set label="Appareils" [object]="this.object" attribute="_r_device" [domains]="this._r_device_domains">
       <ng-template let-item="$implicit">
        <device [object]="item"></device>
      </ng-template>
    </vo-input-set>
  </div>
`
})
export class DeviceProfileComponent extends VOComponent<R_Use_Profile.Aspects.obi> {
  _r_device_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_device_domains.push({ label: "device", create: () => new ctx.R_Device() });
  }

  scope() { 
    return ["_label", "_r_device"];
  }
}