import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { Notification, Result, VersionedObject, Event, DataSource, VersionedObjectManager, DataSourceInternal, Invocation } from '@openmicrostep/aspects';
import { AspectComponent } from './aspect.component';
import { VOInputSetComponent }  from './vo.input.set.component';
import Scope = DataSourceInternal.Scope;

export class VOComponent<T extends VersionedObject> extends AspectComponent {
  _object?: T;
  get object(): T | undefined {
    return this._object;
  }
  @Input() set object(object: T | undefined) {
    this._object = this._controlCenter.ccc(this).swapObject(this._object, object);
  }
}

export abstract class VOLoadComponent<T extends VersionedObject> extends AspectComponent {
  static loaded: Event<Result<[VersionedObject]>> = "loaded";
  static saved: Event<[VersionedObject]> = "saved";

  protected _datasource: DataSource.Aspects.client;
  protected _object?: T;

  constructor(dataSource: DataSource) {
    super(dataSource.controlCenter());
    this._datasource = dataSource as DataSource.Aspects.client;
  }

  abstract scope(): Scope;

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, "loaded", VOLoadComponent.loaded, this);
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
      Invocation.farEvent(this._datasource.load, { objects: [object], scope: this.scope() }, VOLoadComponent.loaded, this);
  }

  loaded(n: Notification<Result<T[]>>) {
    let r = n.info;
    if (r.hasOneValue()) {
      this._object = this._controlCenter.ccc(this).swapObject(this._object, r.value()[0]);
    }
  }

  canSave() : boolean {
    return this.object ? this.object.manager().hasChanges() : false;
  }

  canDelete() : boolean {
    let state = this.object ? this.object.manager().state() : VersionedObjectManager.State.NEW;
    return state !== VersionedObjectManager.State.NEW && state !== VersionedObjectManager.State.DELETED;
  }

  objectsToSave(): VersionedObject[] {
    return [this._object!];
  }

  save() {
    Invocation.farEvent(this._datasource.save, this.objectsToSave(), VOLoadComponent.saved, this);
  }

  markForDeletion() {
    this._object!.manager().delete();
  }
  delete() {
    this.markForDeletion();
    this.save();
    this._object = undefined;
  }
}
