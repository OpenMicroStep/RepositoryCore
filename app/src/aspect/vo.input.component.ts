import { Component, Input } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect.component';

export class VOInputComponent<T> extends AspectComponent {
  @Input() label?: string;
  @Input() attribute?: string;

  _object?: VersionedObject;
  get object(): VersionedObject | undefined {
    return this._object;
  }
  @Input() set object(object: VersionedObject | undefined) {
    this._object = this._controlCenter.ccc(this).swapObject(this._object, object);
  }

  get value(): T | undefined {
    return this.getValue();
  }
  set value(newValue: T | undefined) {
    this.setValue(newValue);
  }

  getValue(): T | undefined {
    if (!this.object || !this.attribute)
      return undefined;
    let m = this.object.manager();
    if (m.hasAttributeValue(this.attribute as any))
      return m.attributeValue(this.attribute as any);
    return undefined;
  }

  setValue(newValue: T | undefined) {
    if (this.object && this.attribute)
      this.object[this.attribute] = newValue;
  }

  state() {
    if (!this.object || !this.attribute)
        return VersionedObjectManager.AttributeState.NOTLOADED;
    let m = this.object.manager();
    return m.attributeState(this.attribute);
  }
}
