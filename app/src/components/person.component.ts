import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Person, R_AuthenticationPK, R_AuthenticationPWD } from '../main';
import { Notification, Invocation, VersionedObject } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'person',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="First name"  [object]="this.object" attribute="_first_name"      ></vo-input-text    ></div>
  <div><vo-input-text     label="Middle name" [object]="this.object" attribute="_middle_name"     ></vo-input-text    ></div>
  <div><vo-input-text     label="Last name"   [object]="this.object" attribute="_last_name"       ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Authentification" [object]="this.object" attribute="_r_authentication" [domains]="this._r_authentication_domains">
       <ng-template let-item="$implicit">
        <authentication-pwd *ngIf="isAuthPWD(item)" [object]="item"></authentication-pwd>
        <authentication-pk  *ngIf="isAuthPK(item)"  [object]="item"></authentication-pk >
      </ng-template>
    </vo-input-set>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class PersonComponent extends VOComponent<R_Person.Aspects.obi> {
  _r_authentication_domains: VOInputSetComponent.Domain[] = [];

  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_authentication_domains.push({
      label: "by password",
      create: () => new ctx.R_AuthenticationPWD()
    });
    this._r_authentication_domains.push({
      label: "by public key",
      create: () => new ctx.R_AuthenticationPK()
    });
  }

  isAuthPWD(item) { return item instanceof this.ctx.R_AuthenticationPWD; }
  isAuthPK(item) { return item instanceof this.ctx.R_AuthenticationPK; }

  scope() { 
    return ["_first_name", "_middle_name", "_last_name", "_disabled", "_r_authentication"];
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!, ...this.object!._r_authentication];
  }
}

@Component({
  selector: 'person-li',
  template: `{{this.item._first_name}} {{this.item._last_name}}` 
})
export class PersonListItemComponent extends AspectComponent {
  @Input() item: R_Person.Aspects.obi;

  static scope: ['_first_name', '_last_name']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
