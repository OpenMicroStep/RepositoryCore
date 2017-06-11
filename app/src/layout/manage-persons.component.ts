import { Component, ViewChildren, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { PersonComponent } from '../components/person.component';

@Component({
  selector: 'manage-persons',
  template:
  `
<div class="col-md-4">
  <search-list query="persons">
    <ng-template let-item="$implicit">
      <person-li [item]="item"></person-li>
    </ng-template>
  </search-list>
</div>
<div class="col-md-6"><person></person></div>
`
})
export class ManagePersonsComponent extends AspectComponent {
  @ViewChild(PersonComponent) personComponent: PersonComponent;
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
    this.personComponent.object = notification.info.selected;
  }

  onCreate(notification: Notification) {
    this.personComponent.object = new this.ctx.R_Person();
  }
}
