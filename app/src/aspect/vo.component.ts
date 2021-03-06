import { Component, ViewChild, AfterViewInit, OnDestroy, Input } from '@angular/core';
import {
  Notification, Result, Invocation, Event,
  VersionedObject, VersionedObjectManager, traverseAllScope,
  DataSource, DataSourceInternal, Diagnostic, ImmutableList, ControlCenterContext,
} from '@openmicrostep/aspects';
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
  diagnostics: ImmutableList<Diagnostic> = [];

  constructor(dataSource: DataSource) {
    super(dataSource.controlCenter());
    this._datasource = dataSource as DataSource.Aspects.client;
  }

  abstract scope(): Scope;

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this._controlCenter.notificationCenter().addObserver(this, "loaded", VOLoadComponent.loaded, this);
    this._controlCenter.notificationCenter().addObserver(this, "saved", VOLoadComponent.saved, this._datasource);
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
    this.diagnostics = [];
    this._object = undefined;
    if (object)
      Invocation.farEvent(this._datasource.load, { objects: [object], scope: this.scope() }, VOLoadComponent.loaded, this);
  }

  loaded(n: Notification<Result<T[]>>) {
    let r = n.info;
    if (r.hasOneValue()) {
      let olds = this._object ? traverseAllScope([this._object], this.scope()) : [];
      let news = traverseAllScope(r.value(), this.scope());
      this._controlCenter.ccc(this).swapObjects(olds, news);
      this._object = r.value()[0];
    }
  }

  saved(n: Notification<Result<T[]>>) {
    let r = n.info;

  }

  isNew(): boolean {
    return this.object ? this.object.manager().isNew() : true;
  }

  canSave() : boolean {
    return this.object ? this.object.manager().isModified() : false;
  }

  canDelete() : boolean {
    return true
  }
  objectsToSave() : VersionedObject[] {
    return [this._object!];
  }
  save() {
    this._controlCenter.safe(async ccc => {
      let objects = this.objectsToSave();
      this.handleSave(ccc, await ccc.farPromise(this._datasource.save, objects) as any);
    });
  }
  handleSave(ccc: ControlCenterContext, r: Result<T[]>) {
    this.diagnostics = r.diagnostics();
    if (r.hasDiagnostics()) {
      for (let d of r.diagnostics())
        console.info(d);
    }
    if (this._object!.manager().isDeleted())
      this.object = undefined;
    ccc.controlCenter().notificationCenter().postNotification({
      name: VOLoadComponent.saved,
      object: this._datasource,
      info: r,
    })
  }

  delete() {
    this._object!.manager().setPendingDeletion(true);
    this.save();
  }
}
