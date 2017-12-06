import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Device } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { AspectComponent } from '../aspect/aspect.component';
import { DeviceProfileComponent } from './device-profile.component';

@Component({
  selector: 'device',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="URN"             [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-text     label="Libéllé"         [object]="this.object" attribute="_label"           ></vo-input-text    ></div>
  <div><vo-input-text     label="Numéro de série" [object]="this.object" attribute="_r_serial_number" ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Désactiver"      [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div><vo-input-checkbox label="Hors service"    [object]="this.object" attribute="_r_out_of_order"  ></vo-input-checkbox></div>
  <div *ngIf="!this.isNew()" class="form-group">
    <button class="btn btn-default" [disabled]="this.object._disabled" (click)="this.pair()">
      {{ this._token }}
    </button>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().isModified()" type="submit" (click)="this.object.manager().clearAllModifiedAttributes()">Annuler</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Enregistrer</button>
</form>
`
})
export class DeviceComponent extends VOLoadComponent<R_Device.Aspects.obi> {
  _token: string = "Code d'appairage";
  constructor(public ctx: AppContext) {
    super(ctx.db);
  }

  async pair() {
    let ccc = this._controlCenter.ccc(this);
    let inv = await ccc.farPromise(this.ctx.session.oneTimePasswordForDevice, this.object);
    if (inv.hasOneValue())
      this._token = inv.value();
  }

  setObject(object: R_Device.Aspects.obi | undefined) {
    super.setObject(object);
    this._token = "Code d'appairage";
  }

  scope() {
    return {
      R_Device: { '.': ["_label", "_disabled", "_r_out_of_order", "_urn", "_r_serial_number"] },
    };
  }
}

@Component({
  selector: 'device-li',
  template: `
<span *ngIf="this._object._disabled" class="glyphicon pull-right glyphicon-off text-warning" aria-hidden="true"></span>
<span *ngIf="this._object._r_out_of_order" class="glyphicon pull-right glyphicon-wrench text-danger" aria-hidden="true"></span>
{{this.object._label}}
  `
})
export class DeviceListItemComponent extends VOComponent<R_Device.Aspects.obi> {
  static readonly scope = ['_label', "_disabled", "_r_out_of_order"];
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
