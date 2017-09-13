import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, Parameter } from '../main';
import { Notification } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';

@Component({
  selector: 'parameter',
  template: `
  <div><vo-input-text label="Label"      [object]="this.object" attribute="_label"     ></vo-input-text></div>
  <div><vo-input-text label="Label"      [object]="this.object" attribute="_string"     ></vo-input-text></div>
`
})
export class ParameterComponent extends VOComponent<Parameter.Aspects.obi> {
  static readonly scope = ["_label", "_string"];
  constructor(public ctx: AppContext) {
    super(ctx.controlCenter);
  }
}
