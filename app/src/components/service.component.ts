import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD, R_Service } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'service',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Label"       [object]="this.object" attribute="_label"           ></vo-input-text    ></div>
  <div><vo-input-text     label="URN"         [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-setselect label="Administrateurs" [object]="this.object" attribute="_r_administrator" query="persons">
      <ng-template let-item="$implicit">
        <person-li [object]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-setselect label="Membres" [object]="this.object" attribute="_r_member" query="persons">
      <ng-template let-item="$implicit">
        <person-li [object]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-select label="Parent" [object]="this.object" attribute="_r_parent_service" query="services">
      <ng-template let-item="$implicit">
        <service-li [object]="item"></service-li>
      </ng-template>
    </vo-input-select>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class ServiceComponent extends VOLoadComponent<R_Service.Aspects.obi> {
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() {
    return ["_label", "_urn", "_disabled", "_r_member", "_r_administrator", "_r_parent_service"];
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!];
  }
}

@Component({
  selector: 'service-li',
  template: `{{this.object._label}}`
})
export class ServiceListItemComponent extends VOComponent<R_Service.Aspects.obi> {
  static readonly scope = ['_label', '_disabled']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
