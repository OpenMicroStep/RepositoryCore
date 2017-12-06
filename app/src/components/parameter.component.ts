import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, Parameter } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'parameter',
  template: `
  <div class="form-inline">
    <vo-input-text label="Clé"         [object]="this.object" attribute="_label"     ></vo-input-text>
    <vo-input-text label="Valeur"      [object]="this.object" attribute="_string"     ></vo-input-text>
  </div>
`
})
export class ParameterComponent extends VOComponent<Parameter.Aspects.obi> {
  static readonly scope = ["_label", "_string"];
  constructor(public ctx: AppContext) {
    super(ctx.cc);
  }
}
