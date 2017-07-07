import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { DeviceComponent } from '../components/device.component';
import { DeviceTreeComponent }  from '../components/devicetree.component';
import { AdminTreeComponent }  from '../tree.component';

@Component({
  selector: 'manage-devices',
  template:
  `
<div class="col-md-4">
  <admin-tree query="devicetrees" parent_attribute="_r_parent_devicetree" child_attribute="_r_child_devicetrees">
    <ng-template let-item="$implicit">
      <devicetree-li [item]="item"></devicetree-li>
    </ng-template>
  </admin-tree>
  <search-list query="devices">
    <ng-template let-item="$implicit">
      <device-li [item]="item"></device-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6">
  <device></device>
  <devicetree></devicetree>
</div>
`
})
export class ManageDevicesComponent extends AspectComponent {
  @ViewChild(DeviceComponent) deviceComponent: DeviceComponent;
  @ViewChild(SearchListComponent) searchListComponent: SearchListComponent;
  @ViewChild(DeviceTreeComponent) deviceTreeComponent: DeviceTreeComponent;
  @ViewChild(AdminTreeComponent) adminTreeComponent: AdminTreeComponent;

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onSelect', SearchListComponent.select, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreate', SearchListComponent.create, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onSelectDeviceTree', AdminTreeComponent.select, this.adminTreeComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreateDeviceTree', AdminTreeComponent.create, this.adminTreeComponent);
  }

  setObject(p, s) {
    this.deviceComponent.object = p;
    this.deviceTreeComponent.object = s;
  }

  onSelect(notification: Notification) {
    this.setObject(notification.info.selected, undefined);
  }

  onCreate(notification: Notification) {
    this.setObject(new this.ctx.R_Device(), undefined);
  }

  onSelectDeviceTree(notification: Notification) {
    this.setObject(undefined, notification.info.selected);
  }
  onCreateDeviceTree(notification: Notification) {
    this.setObject(undefined, new this.ctx.R_DeviceTree());
  }
}
