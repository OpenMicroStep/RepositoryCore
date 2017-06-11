import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { AppContext, R_Right } from '../main';
import { Notification, Invocation, Identifier } from '@openmicrostep/aspects';
import { VOComponent } from '../aspect/vo.component';
import { VOInputSetComponent }  from '../aspect/vo.input.set.component';

@Component({
  selector: 'right',
  template: `
  <div><vo-input-text label="Label"           [object]="this.object" attribute="_label"   ></vo-input-text></div>
  <div>
    <vo-input-select label="Action"           [object]="this.object" attribute="_r_action"           query="actions"></vo-input-select>
  </div>
  <div>
    <vo-input-select label="Application"      [object]="this.object" attribute="_r_application"      query="applications"></vo-input-select>
  </div>
  <div>
    <vo-input-select label="Software Context" [object]="this.object" attribute="_r_software_context" [query]="this.appQuery('software-contexts')"></vo-input-select>
  </div>
  <div>
    <vo-input-select label="Use profile"      [object]="this.object" attribute="_r_use_profile"      [query]="this.appQuery('use-profiles')"></vo-input-select>
  </div>
  <div>
    <vo-input-select label="Device profile"   [object]="this.object" attribute="_r_device_profile"   [query]="this.appQuery('device-profiles')"></vo-input-select>
  </div>
`
})
export class RightComponent extends VOComponent<R_Right.Aspects.obi> {
  private  _cache: { [s: string]: { id: string, app_id?: Identifier } } = {};
  constructor(public ctx: AppContext) {
    super(ctx.dataSource);
  }

  appQuery(name: string) {
    let cached = this._cache[name];
    let app_id = this.object && this.object._r_application && this.object._r_application.id();
    if (!cached || cached.app_id !== app_id)
      this._cache[name] = cached = { id: name, app_id: app_id };
    return cached;
  }
  scope() { 
    return ["_label", "_r_action", "_r_application", "_r_software_context", "_r_use_profile", "_r_device_profile"];
  }
}