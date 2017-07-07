import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD, R_AppTree } from '../main';
import { Notification, Invocation, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'apptree',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Label"       [object]="this.object" attribute="_label"           ></vo-input-text    ></div>
  <div><vo-input-text     label="URN"         [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-setselect label="Administrateurs" [object]="this.object" attribute="_r_administrator" query="persons">
      <ng-template let-item="$implicit">
        <person-li [item]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-setselect label="Membres" [object]="this.object" attribute="_r_application" query="persons">
      <ng-template let-item="$implicit">
        <application-li [item]="item"></application-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-select label="Parent" [object]="this.object" attribute="_r_parent_apptree" [items]="[]">
      <ng-template let-item="$implicit">
        <apptree-li [item]="item"></apptree-li>
      </ng-template>
    </vo-input-select>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class AppTreeComponent extends VOComponent<R_AppTree.Aspects.obi> {

  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() {
    return ["_label", "_urn", "_disabled", "_r_member", "_r_administrator", "_r_parent_AppTree"];
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!];
  }
}

@Component({
  selector: 'apptree-li',
  template: `{{this.item._first_name}} {{this.item._last_name}}` 
})
export class AppTreeListItemComponent extends AspectComponent {
  @Input() item: R_AppTree.Aspects.obi;

  static scope: ['_label', '_disabled']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
