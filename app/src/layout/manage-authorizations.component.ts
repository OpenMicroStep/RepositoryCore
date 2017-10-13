import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext, R_Authorization } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { AuthorizationComponent } from '../components/authorization.component';

@Component({
  selector: 'manage-authorizations',
  template:
  `
<div class="col-md-4">
  <search-list query="authorizations">
    <ng-template let-item="$implicit">
      <authorization-li [object]="item"></authorization-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6"><authorization></authorization></div>
`
})
export class ManageAuthorizationsComponent extends AspectComponent {
  @ViewChild(AuthorizationComponent) authorizationComponent: AuthorizationComponent;
  @ViewChild(SearchListComponent) searchListComponent: SearchListComponent;

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, 'onSelect', SearchListComponent.select, this.searchListComponent);
    this._controlCenter.notificationCenter().addObserver(this, 'onCreate', SearchListComponent.create, this.searchListComponent);
  }

  onSelect(notification: Notification) {
    this.authorizationComponent.object = notification.info.selected;
  }

  onCreate(notification: Notification) {
    this.authorizationComponent.object = R_Authorization.create(this.ctx.cc.ccc(this));
  }
}
