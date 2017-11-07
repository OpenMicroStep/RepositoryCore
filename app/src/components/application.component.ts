import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Application, R_AuthenticationPK, R_AuthenticationPWD, Parameter, R_Use_Profile, R_Device_Profile } from '../main';
import { Notification, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent, VOLoadComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';
import { SoftwareContextListItemComponent } from './software-context.component';
import { UseProfileComponent } from './use-profile.component';
import { DeviceProfileComponent } from './device-profile.component';
import { DeviceListItemComponent } from './device.component';
import { ParameterComponent } from './parameter.component';

@Component({
  selector: 'application',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="URN"       [object]="this.object" attribute="_urn"        ></vo-input-text    ></div>
  <div><vo-input-text     label="Nom"       [object]="this.object" attribute="_label"      ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Désactivé" [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Authentification" [object]="this.object" attribute="_r_authentication" [domains]="this._r_authentication_domains">
       <ng-template let-item="$implicit">
        <authentication-pwd *ngIf="isAuthPWD(item)" [object]="item"></authentication-pwd>
        <authentication-pk  *ngIf="isAuthPK(item)"  [object]="item"></authentication-pk >
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-select label="Contexte applicatif racine" [object]="this.object" attribute="_r_software_context" query="root-software-contexts">
      <ng-template let-item="$implicit">
        <software-context-li [object]="item"></software-context-li>
      </ng-template>
    </vo-input-select>
  </div>
  <div>
    <vo-input-set label="Paramètres" [object]="this.object" attribute="_parameter" [domains]="this._parameter_domains">
      <ng-template let-item="$implicit">
        <parameter [object]="item"></parameter>
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-set label="Profiles d'utilisations" [object]="this.object" attribute="_r_sub_use_profile" [domains]="this._r_sub_use_profile_domains">
      <ng-template let-item="$implicit">
        <use-profile [object]="item"></use-profile>
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-set label="Profiles d'appareils" [object]="this.object" attribute="_r_sub_device_profile" [domains]="this._r_sub_device_profile_domains">
      <ng-template let-item="$implicit">
        <device-profile [object]="item"></device-profile>
      </ng-template>
    </vo-input-set>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Annuler</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Enregistrer</button>
</form>
`
})
export class ApplicationComponent extends VOLoadComponent<R_Application.Aspects.obi> {
  _r_authentication_domains: VOInputSetComponent.Domain[] = [];
  _parameter_domains: VOInputSetComponent.Domain[] = [];
  _r_sub_use_profile_domains: VOInputSetComponent.Domain[] = [];
  _r_sub_device_profile_domains: VOInputSetComponent.Domain[] = [];
  _sc_query: any;
  constructor(public ctx: AppContext) {
    super(ctx.db);
    let ccc = ctx.cc.ccc(this);
    this._r_authentication_domains    .push({ label: "by password"   , create: () => R_AuthenticationPWD.create(ccc) });
    this._r_authentication_domains    .push({ label: "by public key" , create: () => R_AuthenticationPK.create(ccc)  });
    this._parameter_domains           .push({ label: "parameter"     , create: () => Parameter.create(ccc)           });
    this._r_sub_use_profile_domains   .push({ label: "use profile"   , create: () => R_Use_Profile.create(ccc)       });
    this._r_sub_device_profile_domains.push({ label: "device profile", create: () => R_Device_Profile.create(ccc)    });
  }

  isAuthPWD(item) { return item instanceof R_AuthenticationPWD; }
  isAuthPK(item) { return item instanceof R_AuthenticationPK; }

  scope() {
    return {
      R_Application: {
        '.': ["_label", "_urn", "_r_authentication", "_parameter", "_r_software_context", "_r_sub_use_profile", "_r_sub_device_profile"],
      },
      R_Software_Context: {
        '_r_software_context.': SoftwareContextListItemComponent.scope,
      },
      Parameter: {
        '_parameter.': ParameterComponent.scope
      },
      R_Use_Profile: {
        '_r_sub_use_profile.': UseProfileComponent.scope
      },
      R_Device_Profile: {
        '_r_sub_device_profile.': DeviceProfileComponent.scope
      },
      R_Device: {
        '_r_sub_device_profile._r_device.': DeviceListItemComponent.scope
      },
    };
  }

  objectsToSave(): VersionedObject[] {
    return VersionedObjectManager.objectsInScope([this.object!], ["_r_authentication", "_parameter", "_r_sub_use_profile", "_r_sub_device_profile"]);
  }
}

@Component({
  selector: 'application-li',
  template: `{{this.object._label}} ({{this.object._urn}})`
})
export class ApplicationListItemComponent extends VOComponent<R_Application.Aspects.obi> {
  static readonly scope = ['_label', '_urn']
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
