import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { PersonComponent } from '../components/person.component';
import { ServiceComponent }  from '../components/service.component';
import { AdminTreeComponent }  from '../tree.component';

@Component({
  selector: 'manage-persons',
  template:
  `
<div class="col-md-4">
  <admin-tree query="services" parent_attribute="_r_parent_service" child_attribute="_r_child_services">
    <ng-template let-item="$implicit">
      <service-li [item]="item"></service-li>
    </ng-template>
  </admin-tree>
  <search-list query="persons">
    <ng-template let-item="$implicit">
      <person-li [item]="item"></person-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6">
  <person></person>
  <service></service>
</div>
`
})
export class ManagePersonsComponent extends AspectComponent {
  @ViewChild(PersonComponent) personComponent: PersonComponent;
  @ViewChild(SearchListComponent) searchListComponent: SearchListComponent;
  @ViewChild(ServiceComponent) serviceComponent: ServiceComponent;
  @ViewChild(AdminTreeComponent) adminTreeComponent: AdminTreeComponent;

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onSelect', SearchListComponent.select, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreate', SearchListComponent.create, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onSelectService', AdminTreeComponent.select, this.adminTreeComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreateService', AdminTreeComponent.create, this.adminTreeComponent);
  }

  setObject(p, s) {
    this.personComponent.object = p;
    this.serviceComponent.object = s;
  }

  onSelect(notification: Notification) {
    this.setObject(notification.info.selected, undefined);
  }

  onCreate(notification: Notification) {
    this.setObject(new this.ctx.R_Person(), undefined);
  }

  onSelectService(notification: Notification) {
    this.setObject(undefined, notification.info.selected);
  }
  onCreateService(notification: Notification) {
    this.setObject(undefined, new this.ctx.R_Service());
  }
}
