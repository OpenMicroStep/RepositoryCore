import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { ApplicationComponent } from '../components/application.component';

@Component({
  selector: 'manage-applications',
  template:
  `
<div class="col-md-4">
  <search-list query="applications">
    <ng-template let-item="$implicit">
      <application-li [item]="item"></application-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6"><application></application></div>
`
})
export class ManageApplicationsComponent extends AspectComponent {
  @ViewChild(ApplicationComponent) applicationComponent: ApplicationComponent;
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
    this.applicationComponent.object = notification.info.selected;
  }

  onCreate(notification: Notification) {
    this.applicationComponent.object = new this.ctx.R_Application();
  }
}
