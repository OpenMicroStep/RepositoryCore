import {ControlCenter} from '@openmicrostep/aspects';
import {Injectable} from '@angular/core';

Injectable()(ControlCenter); // Makes ControlCenter injectable

export class AspectComponent {
  constructor(protected _controlCenter: ControlCenter) {
    this._controlCenter.registerComponent(this);
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
      this._controlCenter.notificationCenter().removeObserver(this);
      this._controlCenter.unregisterComponent(this);
  }
}
