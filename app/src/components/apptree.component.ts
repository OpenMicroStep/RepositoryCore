import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD, R_AppTree } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';
import { PersonListItemComponent } from './person.component';
import { ApplicationListItemComponent } from './application.component';

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
        <person-li [object]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-setselect label="Applications" [object]="this.object" attribute="_r_application" query="applications">
      <ng-template let-item="$implicit">
        <application-li [object]="item"></application-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-select label="Parent" [object]="this.object" attribute="_r_parent_apptree" [items]="[]">
      <ng-template let-item="$implicit">
        <apptree-li [object]="item"></apptree-li>
      </ng-template>
    </vo-input-select>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class AppTreeComponent extends VOLoadComponent<R_AppTree.Aspects.obi> {

  constructor(public ctx: AppContext) {
    super(ctx.db);
  }

  scope() {
    return {
      R_AppTree: {
        '.': ["_label", "_urn", "_disabled", "_r_application", "_r_administrator", "_r_parent_apptree"],
      },
      R_Person: {
        '_r_administrator.': PersonListItemComponent.scope,
      },
      R_Application: {
        '_r_application.': ApplicationListItemComponent.scope,
      },
    };
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!];
  }
}

@Component({
  selector: 'apptree-li',
  template: `{{this.object._label}}`
})
export class AppTreeListItemComponent extends VOComponent<R_AppTree.Aspects.obi> {
  static readonly scope = ['_label', '_disabled']
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
