import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Application, R_AuthenticationPK, R_AuthenticationPWD } from '../main';
import { Notification, Invocation, VersionedObject } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'application',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Urn"         [object]="this.object" attribute="_urn"        ></vo-input-text    ></div>
  <div><vo-input-text     label="Label"       [object]="this.object" attribute="_label"      ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Authentification" [object]="this.object" attribute="_r_authentication" [domains]="this._r_authentication_domains">
       <ng-template let-item="$implicit">
        <authentication-pwd *ngIf="isAuthPWD(item)" [object]="item"></authentication-pwd>
        <authentication-pk  *ngIf="isAuthPK(item)"  [object]="item"></authentication-pk >
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-select label="Software Context" [object]="this.object" attribute="_r_software_context" query="software-contexts"></vo-input-select>
  </div>
  <div>
    <vo-input-set label="Parameters" [object]="this.object" attribute="_parameter" [domains]="this._parameter_domains">
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
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class ApplicationComponent extends VOComponent<R_Application.Aspects.obi> {
  _r_authentication_domains: VOInputSetComponent.Domain[] = [];
  _parameter_domains: VOInputSetComponent.Domain[] = [];
  _r_sub_use_profile_domains: VOInputSetComponent.Domain[] = [];
  _r_sub_device_profile_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_authentication_domains    .push({ label: "by password"   , create: () => new ctx.R_AuthenticationPWD() });
    this._r_authentication_domains    .push({ label: "by public key" , create: () => new ctx.R_AuthenticationPK()  });
    this._parameter_domains           .push({ label: "parameter"     , create: () => new ctx.Parameter()           });
    this._r_sub_use_profile_domains   .push({ label: "use profile"   , create: () => new ctx.R_Use_Profile()       });
    this._r_sub_device_profile_domains.push({ label: "device profile", create: () => new ctx.R_Device_Profile()    });
  }

  isAuthPWD(item) { return item instanceof this.ctx.R_AuthenticationPWD; }
  isAuthPK(item) { return item instanceof this.ctx.R_AuthenticationPK; }

  scope() { 
    return ["_label", "_urn", "_r_authentication", "_parameter", "_r_software_context", "_r_sub_use_profile", "_r_sub_device_profile"];
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!, ...this.object!._r_authentication, ...this.object!._parameter, this.object!._r_software_context!, ...this.object!._r_sub_use_profile, ...this.object!._r_sub_device_profile];
  }
}

@Component({
  selector: 'application-li',
  template: `{{this.item._label}} ({{this.item._urn}})` 
})
export class ApplicationListItemComponent extends AspectComponent {
  @Input() item: R_Application.Aspects.obi;

  static scope: ['_label', '_urn']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
