import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Authorization, R_Right } from '../main';
import { Notification, Invocation, VersionedObject } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { VOComponent } from '../aspect/vo.component';
import { AuthenticationPWDComponent } from './authentication.pwd.component';

@Component({
  selector: 'authorization',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Urn"         [object]="this.object" attribute="_urn"        ></vo-input-text    ></div>
  <div><vo-input-text     label="Label"       [object]="this.object" attribute="_label"      ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"    [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-set label="Persons & Applications" [object]="this.object" attribute="_r_authenticable" [domains]="this._r_authenticabledomains">
       <ng-template let-item="$implicit">
        <person      *ngIf="isPerson(item)"       [object]="item"></person     >
        <application *ngIf="isApplication(item)"  [object]="item"></application>
      </ng-template>
    </vo-input-set>
  </div>
  <div>
    <vo-input-set label="Rights" [object]="this.object" attribute="_r_sub_right" [domains]="this._r_sub_right_domains">
       <ng-template let-item="$implicit">
        <right [object]="item"></right>
      </ng-template>
    </vo-input-set>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class AuthorizationComponent extends VOComponent<R_Authorization.Aspects.obi> {
  _r_authenticabledomains: VOInputSetComponent.Domain[] = [];
  _r_sub_right_domains: VOInputSetComponent.Domain[] = [];
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
    this._r_sub_right_domains.push({ label: "right" , create: () => new ctx.R_Right() });
  }

  isPerson(item) { return item instanceof this.ctx.R_Person; }
  isApplication(item) { return item instanceof this.ctx.R_Application; }

  scope() { 
    return ["_label", "_disabled", "_urn", "_r_authenticable", "_r_sub_right"];
  }

  objectsToSave(): VersionedObject[] {
    return [this.object!, ...this.object!._r_sub_right];
  }
}

@Component({
  selector: 'authorization-li',
  template: `{{this.item._label}}` 
})
export class AuthorizationListItemComponent extends AspectComponent {
  @Input() item: R_Authorization.Aspects.obi;

  static scope: ['_label']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
