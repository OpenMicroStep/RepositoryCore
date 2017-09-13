import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { ApplicationComponent } from '../components/application.component';
import { AppTreeComponent }  from '../components/apptree.component';
import { AdminTreeComponent }  from '../tree.component';

@Component({
  selector: 'manage-applications',
  template:
  `
<div class="col-md-4">
  <admin-tree query="apptrees" parent_attribute="_r_parent_apptree" child_attribute="_r_child_apptrees">
    <ng-template let-item="$implicit">
      <apptree-li [object]="item"></apptree-li>
    </ng-template>
  </admin-tree>
  <search-list query="applications">
    <ng-template let-item="$implicit">
      <application-li [object]="item"></application-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6">
  <application></application>
  <apptree></apptree>
</div>
`
})
export class ManageApplicationsComponent extends AspectComponent {
  @ViewChild(ApplicationComponent) appComponent: ApplicationComponent;
  @ViewChild(SearchListComponent) searchListComponent: SearchListComponent;
  @ViewChild(AppTreeComponent) appTreeComponent: AppTreeComponent;
  @ViewChild(AdminTreeComponent) adminTreeComponent: AdminTreeComponent;

  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onSelect', SearchListComponent.select, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreate', SearchListComponent.create, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onSelectAppTree', AdminTreeComponent.select, this.adminTreeComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreateAppTree', AdminTreeComponent.create, this.adminTreeComponent);
  }

  setObject(p, s) {
    this.appComponent.object = p;
    this.appTreeComponent.object = s;
  }

  onSelect(notification: Notification) {
    this.setObject(notification.info.selected, undefined);
  }

  onCreate(notification: Notification) {
    this.setObject(new this.ctx.R_Application(), undefined);
  }

  onSelectAppTree(notification: Notification) {
    this.setObject(undefined, notification.info.selected);
  }
  onCreateAppTree(notification: Notification) {
    this.setObject(undefined, new this.ctx.R_AppTree());
  }
}
