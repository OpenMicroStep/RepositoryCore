import { Component, Input } from '@angular/core';
import { ControlCenter, VersionedObject, VersionedObjectManager } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect.component';

export function sort<T>(sort: string | undefined, items: T[]) : T[] {
  if (sort) {
    let attribute_names = sort.split(',');
    items = items.sort((a, b) => {
      for (let attribute_name of attribute_names) {
        let aa = a[attribute_name];
        let ab = b[attribute_name];
        if (aa < ab)
          return -1;
        if (aa > ab)
          return +1;
      }
      return 0;
    });
  }
  return items;
}

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

  isAttributeLoaded(): boolean {
    return !!(this.object && this.attribute) && this.object!.manager().hasAttributeValue(this.attribute!);
  }

  isAttributeModified() {
    return this.isAttributeLoaded() && this.object!.manager().isAttributeModified(this.attribute!);
  }

  isAttributeSaved() {
    return this.isAttributeLoaded() && this.object!.manager().isAttributeSaved(this.attribute!);
  }

  isAttributeInConflict() {
    return this.isAttributeLoaded() && this.object!.manager().isAttributeInConflict(this.attribute!);
  }

  class() {
    let has_warning = this.isAttributeInConflict() || !this.isAttributeLoaded(); // TODO: attribute validation
    let has_success = this.isAttributeModified();
    return {
      'has-feedback': has_warning || has_success,
      'has-warning': has_warning,
      'has-success': has_success,
    }
  }
}
