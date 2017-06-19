import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { DeviceComponent } from '../components/device.component';

@Component({
  selector: 'manage-devices',
  template:
  `
<div class="col-md-4">
  <search-list query="devices">
    <ng-template let-item="$implicit">
      <device-li [item]="item"></device-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6"><device></device></div>
`
})
export class ManageDevicesComponent extends AspectComponent {
  @ViewChild(DeviceComponent) deviceComponent: DeviceComponent;
  @ViewChild(SearchListComponent) searchListComponent: SearchListComponent;

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onSelect', SearchListComponent.select, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreate', SearchListComponent.create, this.searchListComponent);
  }

  onSelect(notification: Notification) {
    this.deviceComponent.object = notification.info.selected;
  }

  onCreate(notification: Notification) {
    this.deviceComponent.object = new this.ctx.R_Device();
  }
}
