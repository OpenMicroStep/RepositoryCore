import {ControlCenter} from '@openmicrostep/aspects';
import {Injectable, Component} from '@angular/core';

Injectable()(ControlCenter); // Makes ControlCenter injectable

export class AspectComponent {
  constructor(protected _controlCenter: ControlCenter) {}

  ngAfterViewInit() {
      this._controlCenter.registerComponent(this);
  }

  ngOnDestroy() {
      this._controlCenter.notificationCenter().removeObserver(this);
      this._controlCenter.unregisterComponent(this);
  }
}
