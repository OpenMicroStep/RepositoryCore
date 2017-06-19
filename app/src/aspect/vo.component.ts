import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { Notification, Invocation, VersionedObject, Event, DataSource } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect.component';
import { VOInputSetComponent }  from './vo.input.set.component';

export abstract class VOComponent<T extends VersionedObject> extends AspectComponent {
  static loaded: Event<Invocation<[VersionedObject]>> = "loaded";
  static saved: Event<[VersionedObject]> = "saved";

  protected _datasource: DataSource.Aspects.client;
  protected _object?: T;

  constructor(dataSource: DataSource) {
    super(dataSource.controlCenter());
    this._datasource = dataSource as DataSource.Aspects.client;
  }

  abstract scope(): string[];

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, "loaded", VOComponent.loaded, this);
  }

  get object(): T | undefined {
    return this._object;
  }

  @Input() set object(object: T | undefined) {
    this.setObject(object);
  }

  setObject(object: T | undefined) {
    if (this._object === object)
      return;
    this._object = undefined;
    if (object)
      this._datasource.farEvent("load", { objects: [object], scope: this.scope() }, VOComponent.loaded, this);
  }

  loaded(n: Notification<Invocation<T[]>>) {
    let r = n.info;
    if (r.hasResult()) {
      if (this._object)
        this._controlCenter.unregisterObjects(this, [this._object]);
      this._object = r.result()[0];
      this._controlCenter.registerObjects(this, [this._object]);
    }
  }

  canSave() : boolean {
    return true; //return this._person ? this._person.manager().hasChanges() : false;
  }

  objectsToSave(): VersionedObject[] {
    return [this._object!];
  }

  save() {
    this._datasource.farEvent("save", this.objectsToSave(), VOComponent.saved, this);
  }
}
