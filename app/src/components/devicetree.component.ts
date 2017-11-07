import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD, R_DeviceTree } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';
import { PersonListItemComponent } from './person.component';
import { DeviceListItemComponent } from './device.component';

@Component({
  selector: 'devicetree',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="URN"         [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-text     label="Nom"         [object]="this.object" attribute="_label"           ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Désactivé"   [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-setselect label="Administrateurs" [object]="this.object" attribute="_r_administrator" query="persons">
      <ng-template let-item="$implicit">
        <person-li [object]="item"></person-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
    <vo-input-setselect label="Appareils" [object]="this.object" attribute="_r_device" query="devices">
      <ng-template let-item="$implicit">
        <device-li [object]="item"></device-li>
      </ng-template>
    </vo-input-setselect>
  </div>
  <div>
      <vo-input-select label="Parent" [object]="this.object" attribute="_r_parent_devicetree" [items]="[]">
        <ng-template let-item="$implicit">
          <devicetree-li [object]="item"></devicetree-li>
        </ng-template>
      </vo-input-select>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class DeviceTreeComponent extends VOLoadComponent<R_DeviceTree.Aspects.obi> {

  constructor(public ctx: AppContext) {
    super(ctx.db);
  }

  scope() {
    return {
      R_DeviceTree: {
        '.': ["_label", "_urn", "_disabled", "_r_device", "_r_administrator", "_r_parent_devicetree"],
      },
      R_Person: {
        '_r_administrator.': PersonListItemComponent.scope,
      },
      R_Device: {
        '_r_device.': DeviceListItemComponent.scope,
      },
    };
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!];
  }
}

@Component({
  selector: 'devicetree-li',
  template: `{{this.object._label}}`
})
export class DeviceTreeListItemComponent extends VOComponent<R_DeviceTree.Aspects.obi> {
  static readonly scope = ['_label', '_disabled'];

  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
