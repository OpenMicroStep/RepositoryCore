import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Software_Context } from '../main';
import { Notification, Invocation } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';
import { AspectComponent } from '../aspect/aspect.component';

@Component({
  selector: 'software-context',
  template: `
<form *ngIf="this.object">
  <div><vo-input-text     label="Label"         [object]="this.object" attribute="_label"           ></vo-input-text    ></div>
  <div><vo-input-text     label="URN"           [object]="this.object" attribute="_urn"             ></vo-input-text    ></div>
  <div><vo-input-checkbox label="Disabled"      [object]="this.object" attribute="_disabled"        ></vo-input-checkbox></div>
  <div>
    <vo-input-select label="Parent" [object]="this.object" attribute="_r_parent_context" query="software-contexts"></vo-input-select>
  </div>
    <div>
    <vo-input-set label="Childs" [object]="this.object" attribute="_r_child_contexts" [domains]="this._r_child_contexts_domains">
       <ng-template let-item="$implicit">
        <software-context [object]="item"></software-context>
      </ng-template>
    </vo-input-set>
  </div>
  <button class="btn btn-default" [disabled]="!this.object.manager().hasChanges()" type="submit" (click)="this.object.manager().clear()">Undo</button>
  <button class="btn btn-primary" [disabled]="!this.canSave()" type="submit" (click)="this.save()">Save</button>
</form>
`
})
export class SoftwareContextComponent extends VOComponent<R_Software_Context.Aspects.obi> {
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  scope() { 
    return ["_label", "_disabled", "_urn", "_r_parent_context", "_r_child_contexts"];
  }
}

@Component({
  selector: 'software-context-li',
  template: `{{this.item._label}}` 
})
export class SoftwareContextListItemComponent extends AspectComponent {
  @Input() item: R_Software_Context.Aspects.obi;

  static scope: ['_label']
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
