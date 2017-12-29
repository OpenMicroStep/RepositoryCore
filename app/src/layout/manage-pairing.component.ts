import { Component, ViewChildren, ViewChild, ElementRef } from '@angular/core';
import { SearchListComponent } from '../search.component';
import { AppContext, R_Service, R_Person, R_Application, R_Device_Profile } from '../main';
import { ControlCenter, Notification, areEquals } from '@openmicrostep/aspects';
import { AspectComponent } from '../aspect/aspect.component';
import { PersonComponent } from '../components/person.component';
import { ServiceComponent }  from '../components/service.component';
import { AdminTreeComponent }  from '../tree.component';
import { QRCode } from '../qrcode';

export type SmartCard = {
  kind: "nfc" | "sd",
  serial: string,
  lastName?: string,
  firstName?: string,
  expirationDate?: Date,
  uid?: string,
};

export type Device = {
  id: string,
  label: string,
  brand: string,
  model: string,
  serial: string,
  state: string,
  smartcard?: SmartCard,
  time: number,
  action: Action | undefined,
  past_actions: Action[],
};

export type Action =
    { kind: "pair" } |
    { kind: "pair+end" } |
    { kind: "enroll",
      pki: "ANTAI" | "LOCAL",
      enroll?: { uid: string, urn: string, firstname: string, lastname: string },
      revoke?: { uid: string, urn: string }
    } |
    { kind: "end" };

export type DeviceAction = {
  brand: string,
  model: string,
  serial: string,
  action: Action
}

@Component({
  selector: 'manage-pairing',
  template:
  `
<div class="container-fluid">
  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><span>Configuration wifi</span></div>
        <div class="panel-body">
          <div class="form-horizontal">
            <div class="form-group">
              <label class="col-sm-3 control-label">SSID</label>
              <div class="col-sm-9"><input type="text" class="form-control pairing-data" name="ssid"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Password</label>
              <div class="col-sm-9"><input type="password" class="form-control pairing-data" name="password"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel panel-default">
        <div class="panel-heading">
          <span>Configuration enrôlement: </span>
          <input-select [(value)]="this._enrol_kind" [items]="['ANTAI', 'LOCAL']">
            <ng-template let-item="$implicit">
              {{ item }}
            </ng-template>
          </input-select>
        </div>
        <div class="panel-body">
          <div *ngIf="this._enrol_kind === 'ANTAI'" class="form-horizontal">
            <div class="form-group">
              <label class="col-sm-3 control-label">Code unité</label>
              <div class="col-sm-9"><input type="text" class="form-control pairing-enroll" name="codeunite"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Login</label>
              <div class="col-sm-9"><input type="text" class="form-control pairing-enroll" name="login"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Password</label>
              <div class="col-sm-9"><input type="password" class="form-control pairing-enroll" name="password"></div>
            </div>
          </div>
          <div *ngIf="this._enrol_kind === 'LOCAL'" class="form-horizontal">
            PKI Locale
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><span>QRCode à scanner</span></div>
        <div class="panel-body">
          <div #qrcode class="pairing-qrcode" style="margin:auto; width: 256px;">
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <span>Appareils en cours de configuration</span>
        </div>
        <ul class="panel-body list-group">
          <li class="list-group-item">
            Application & profil d'appareil pour les nouveaux appareils:
            <input-select [(value)]="selected_app" [items]="_applications">
              <ng-template let-item="$implicit">
                <application-li [object]="item"></application-li>
              </ng-template>
            </input-select>
            <input-select [(value)]="selected_device_profile" [items]="availableDeviceProfiles()">
              <ng-template let-item="$implicit">
                {{item._label}}
              </ng-template>
            </input-select>
          </li>
          <li *ngFor="let device of this.devices" class="list-group-item dropzone" (drop)="drop($event, device)" (dragover)="dragover($event, device)" (dragleave)="dragleave($event)">
            <div>
              {{ device.label }}
              <span class="label label-default">S/N: {{ device.serial }}</span>
              <span class="pull-right badge">#{{ device.id }}</span>
            </div>
            <div *ngFor="let action of device.past_actions">
              <span class="label label-success">Terminé</span>
              {{ action_label(action) }}
            </div>
            <div *ngIf="!device.action">
              <span class="label" [ngClass]="d_state_class(device)">{{ d_state_label(device) }}</span>
              <ng-template [ngIf]="_droptarget !== device">
                <span *ngIf="!device.smartcard">
                  Pas de SmartCard
                </span>
                <span *ngIf="device.smartcard && !device.smartcard.uid">
                  SmartCard ({{ smartcard_kind_label(device.smartcard) }}) vierge
                </span>
                <span *ngIf="device.smartcard && device.smartcard.uid">
                  SmartCard ({{ smartcard_kind_label(device.smartcard) }}) enrolé: {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} (valide jusqu'à {{ device.smartcard.expirationDate | date }})
                </span>
              </ng-template>
              <ng-template [ngIf]="_droptarget === device">
                <span *ngIf="device.smartcard && !device.smartcard.uid">
                  Enrôler ({{_enrol_kind }}) {{ _dragged._last_name }} {{ _dragged._first_name }} sur une SmartCard ({{ smartcard_kind_label(device.smartcard) }}) vierge
                </span>
                <span *ngIf="device.smartcard.uid && device.smartcard.matricule === p_matricule(_dragged)">
                  Re-Enrôler ({{_enrol_kind }}) {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} sur SmartCard ({{ smartcard_kind_label(device.smartcard) }})
                </span>
                <span *ngIf="device.smartcard.uid && device.smartcard.matricule !== p_matricule(_dragged)">
                  Révoker ({{_enrol_kind }}) {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} puis enrôler {{ _dragged._last_name }} {{ _dragged._first_name }} sur SmartCard ({{ smartcard_kind_label(device.smartcard) }})
                </span>
              </ng-template>
            </div>
            <div *ngIf="device.action">
              <span class="label" [ngClass]="d_state_class(device)">{{ d_state_label(device) }}</span>
              {{ action_label(device.action) }}
            </div>
          </li>
          <li class="list-group-item">
            <button class="btn btn-success btn-lg btn-block" type="submit" [disabled]="this._final_pairing" (click)="this.commit()">Terminer la session d'appairage</button>
          </li>
        </ul>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><span>Utilisateurs</span></div>
        <div class="panel-body input-group">
          <span class="input-group-addon" id="sizing-addon1"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></span>
          <input type="text" class="form-control" placeholder="Rechercher" aria-describedby="sizing-addon1" [(ngModel)]="search">
        </div>
        <ul class="panel-body list-group">
          <li *ngFor="let p of this._items" class="list-group-item" draggable="true" (dragstart)="drag($event, p)">
            <div><span class="glyphicon glyphicon-move"></span> {{ p._last_name }} {{ p._first_name }} <span class="label label-default">{{ p_matricule(p) }}</span></div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
`
})
export class ManagePairingComponent extends AspectComponent {
  @ViewChild('qrcode') input: ElementRef;
  device_actions: DeviceAction[] = [];
  devices: Device[] = [];
  interval: any
  _enrol_kind: "ANTAI" | "LOCAL" = "ANTAI";
  _final_pairing = false;

  constructor(public ctx: AppContext) {
    super(ctx.cc);
    let ccc = this._controlCenter.ccc(this);
    ccc.farPromise(this.ctx.session.pairingSession, undefined).then((result) => {
      this.setCode(JSON.stringify({
        url: document.location.origin + document.location.pathname,
        wifi: undefined, // TODO
        ...result.value(),
      }));
      this.interval = setTimeout(() => this.poll(), 10);
    });
    ccc.farPromise(this.ctx.db.query, { id: "application-tree" }).then(res => {
      this._applications = res.value().applications as R_Application[]
      this.selected_app = this._applications.find(a => a._urn === "lsmobile");
    });
    this.search = "";
  }

  ngOnDestroy() {
    if (this._final_pairing && this.interval !== undefined) {
      this._controlCenter.ccc(this).farPromise(this.ctx.session.pairingSessionPoll, { kind: "end" });
    }
    super.ngOnDestroy();
    clearTimeout(this.interval);
    this.interval = undefined;
  }

  _applications: R_Application[] = [];
  _selected_app: R_Application | undefined = undefined;
  _selected_device_profile: R_Device_Profile | undefined = undefined;
  get selected_app() { return this._selected_app; }
  set selected_app(nv) {
    this._selected_app = nv;
    this._selected_device_profile = nv && nv._r_sub_device_profile.size === 1 ? [...nv._r_sub_device_profile][0] : undefined;
  }
  availableDeviceProfiles() {
    return this._selected_app ? [...this._selected_app._r_sub_device_profile].sort((a, b) => a._label! < b._label! ? -1 : +1) : []; // TODO: add a cache
  }
  get selected_device_profile() { return this._selected_device_profile; }
  set selected_device_profile(nv) {
    this._selected_device_profile = nv;
  }

  async poll() {
    let ccc = this._controlCenter.ccc(this);
    let device_actions = this.device_actions;
    this.device_actions = [];
    let res = await ccc.farPromise(this.ctx.session.pairingSessionPoll, { kind: "ui", device_actions: device_actions, app: this.selected_app, device_profile: this.selected_device_profile });
    if (!res.hasDiagnostics()) {
      let { devices } = res.value() as { devices: Device[] };
      this.devices = devices;
    }
    if (this.interval !== undefined) {
      if (this._final_pairing && this.devices.filter(d => !this.d_timedout(d)).length === 0) {
        this.interval = undefined;
        await ccc.farPromise(this.ctx.session.pairingSessionPoll, { kind: "end" });
        this.devices = [];
      }
      this.interval = setTimeout(() => this.poll(), 2000);
    }
  }

  commit() {
    if (!this._final_pairing) {
      this._final_pairing = true;
      for (let d of this.devices) {
        d.action = {
          kind: "pair+end"
        };
        this.device_actions.push({
          brand: d.brand,
          model: d.model,
          serial: d.serial,
          action: d.action,
        });
      }
    }
  }

  _lastcode = "";
  _qrcode: QRCode | undefined = undefined;
  setCode(text: string) {
    if (text !== this._lastcode) {
      if (!this._qrcode)
        this._qrcode = new QRCode(this.input.nativeElement, {
          width: 256,
          height: 256,
        });
      this._qrcode.makeCode(text);
    }
    this._lastcode = text;
  }

  _search: string = "";
  _items: R_Person[] = [];
  get search() {
    return this._search;
  }
  set search(value) {
    this._search = value;
    let ccc = this._controlCenter.ccc(this);
    ccc.farPromise(this.ctx.db.query, { id: "pairing-persons", text: value }).then((res) => {
      this._items = res.value().items as R_Person[];
    });
  }

  p_matricule(p: R_Person | undefined) {
    if (p) for (let param of p._parameter) {
      if (param._label === 'matricule')
        return param._string;
    }
    return undefined;
  }

  d_timedout(d: Device): boolean {
    let now = Date.now();
    return (d.time < now - (d.action ? 240 * 1000 : 30 * 1000));
  }

  d_state(d: Device): string {
    let now = Date.now();
    if (d.time < now - (d.action ? 240 * 1000 : 30 * 1000))
      return "timedout"
    return d.state;
  }

  smartcard_kind_label(sc: SmartCard) {
    if (sc.kind === "nfc")
      return "NFC";
    if (sc.kind === "sd")
      return "microSD";
    return "?"
  }

  d_state_label(d: Device) {
    let state = this.d_state(d);
    if (state === "timedout")
      return "Injoignable";
    if (state === "error")
      return "Erreur";
    if (d.action) {
      switch (state) {
        case "gencsr": return "Génération des certificats";
        case "signcrt": return "Signature des certificats";
        default: return "En cours";
      }
    }
    switch (state) {
      case "init":
      case "idle": return "En attente";
      case "done": return "Terminé";
    }
    return "?";
  }

  d_state_class(d: Device) {
    let state = this.d_state(d);
    if (state === "timedout")
      return "label-default";
    if (state === "error")
      return "label-danger";
    if (d.action)
      return "label-warning";
    switch (state) {
      case "init":
      case "idle": return "label-info";
      case "done": return "label-success";
    }
    return "label-danger";
  }

  action_label(a: Action): string {
    if (a.kind === "enroll") {
      if (a.enroll && !a.revoke)
        return `Enrôlement (${a.pki}) de ${ a.enroll.lastname } ${ a.enroll.firstname } sur une carte vierge`;
      if (a.enroll && a.revoke && a.enroll.uid === a.revoke.uid)
        return `Re-Enrôlement (${a.pki}) de ${ a.enroll.lastname } ${ a.enroll.firstname }`;
      if (a.enroll && a.revoke)
        return `Révocation (${a.pki}) de ${ a.revoke.uid } puis enrôlement de ${ a.enroll.lastname } ${ a.enroll.firstname }`;
    }
    if (a.kind === "pair")
      return `Appairage`;
    if (a.kind === "pair+end")
      return `Appairage puis déconnexion`;
    if (a.kind === "end")
      return `Déconnexion`;
    return "";
  }

  _dragged: R_Person | undefined = undefined;
  _droptarget: Device | undefined = undefined;
  drag($event: DragEvent, p: R_Person) {
    console.info("drag", $event);
    this._dragged = p;
    const handler = () => {
      this._dragged = undefined;
      this._droptarget = undefined;
      document.removeEventListener("dragend", handler, false);
    }
    document.addEventListener("dragend", handler, false);
  }

  dragleave($event) {
    if ($event.target.className.indexOf("dropzone") !== -1)
      this._droptarget = undefined;
  }

  dragover($event: DragEvent, d: Device) {
    console.info("dragover");
    if (d.smartcard && !d.action) {
      $event.preventDefault();
      this._droptarget = d;
    }
  }

  drop($event: DragEvent, d: Device) {
    $event.preventDefault();
    let p = this._dragged;
    if (d && p) {
      d.action = {
        kind: "enroll",
        pki: this._enrol_kind,
        enroll: { uid: this.p_matricule(p)!, urn: p._urn!, firstname: p._first_name!, lastname: p._last_name! },
        revoke: d.smartcard && d.smartcard.uid ? { uid: d.smartcard.uid, urn: p._urn! } : undefined,
      };
      this.device_actions.push({
        brand: d.brand,
        model: d.model,
        serial: d.serial,
        action: d.action,
      });
    }
  }
}
