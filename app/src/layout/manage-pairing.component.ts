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
  pki: "ANTAI" | "LOCAL",
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
  paired_app_urn: string,
  state: string,
  smartcard?: SmartCard,
  timeout: number,
  will_actions: Action[],
  pending_actions: Action[],
  action: Action | undefined,
  past_actions: (Action & { state: "done" | "error" })[],
};

export type Action =
    { kind: "pair", app: R_Application, device_profile: R_Device_Profile } |
    { kind: "pair+end", app: R_Application, device_profile: R_Device_Profile } |
    { kind: "set-pin", old?: string, new?: string } |
    { kind: "unblock", puk?: string, new?: string } |
    { kind: "enroll",
      pki: "ANTAI" | "LOCAL",
      pin?: string,
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
              <div class="col-sm-9"><input type="text" [(ngModel)]="wifi_ssid" class="form-control pairing-data" name="wifi_ssid"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Password</label>
              <div class="col-sm-9"><input type="password" [(ngModel)]="wifi_pwd" class="form-control pairing-data" name="wifi_password"></div>
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
              <div class="col-sm-9"><input type="text" class="form-control pairing-enroll" [(ngModel)]="_codeunite" name="codeunite"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Login</label>
              <div class="col-sm-9"><input type="text" class="form-control pairing-enroll" [(ngModel)]="_login" name="login"></div>
            </div>
            <div class="form-group">
              <label class="col-sm-3 control-label">Password</label>
              <div class="col-sm-9"><input type="password" class="form-control pairing-enroll" [(ngModel)]="_password" name="password"></div>
            </div>
          </div>
          <div *ngIf="this._enrol_kind === 'LOCAL'" class="form-horizontal">
            PKI Locale
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="!_final_pairing" class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><span>QRCode à scanner</span></div>
        <div class="panel-body">
          <div #qrcode class="pairing-qrcode" style="margin:auto; width: 256px;">
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="_final_pairing" class="col-md-6">
      <button class="btn btn-primary" [disabled]="!!interval" (click)="this.restart()">
        Démarrer une nouvelle session d'appairage
      </button>
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
            Appairer pour:
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
              <span class="label" [ngClass]="a_state_class(action)">{{ a_state_label(action) }}</span>
              {{ action_label(action) }}
            </div>
            <div *ngIf="!device.action">
              <span class="label" [ngClass]="d_state_class(device)">{{ d_state_label(device) }}</span>
              <span *ngIf="!device.smartcard">
                Pas de SmartCard
              </span>
              <span *ngIf="device.smartcard && !device.smartcard.uid">
                SmartCard ({{ smartcard_kind_label(device.smartcard) }}) vierge
              </span>
              <span *ngIf="device.smartcard && device.smartcard.uid">
                SmartCard ({{ smartcard_kind_label(device.smartcard) }}) enrolé ({{ device.smartcard.pki }}): {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} (valide jusqu'à {{ device.smartcard.expirationDate | date }})
              </span>
            </div>
            <div *ngFor="let action of device.pending_actions">
              <span class="label label-primary">En attente</span>
              {{ action_label(action) }}
            </div>
            <div *ngIf="device.action">
              <span class="label" [ngClass]="d_state_class(device)">{{ d_state_label(device) }}</span>
              {{ action_label(device.action) }}
            </div>
            <div *ngFor="let action of device.will_actions" class="row">
              <div class="col-md-6">
                <span class="label label-info">Préparation</span>
                {{ action_label(action) }}
              </div>
              <div class="col-md-6 form-inline text-right">
                <ng-template [ngIf]="action.kind === 'enroll'">
                  <input class="form-control" type="password" autocomplete="off" placeholder="PIN" [(ngModel)]="action.pin" maxlength="4" size="4"/>
                </ng-template>
                <ng-template [ngIf]="action.kind === 'set-pin'">
                  <input class="form-control" type="password" autocomplete="off" placeholder="Ancien PIN" [(ngModel)]="action.old" maxlength="4" size="4"/>
                  <input class="form-control" type="password" autocomplete="off" placeholder="Nouveau PIN" [(ngModel)]="action.new" maxlength="4" size="4"/>
                </ng-template>
                <ng-template [ngIf]="action.kind === 'unblock'">
                  <input class="form-control" type="password" autocomplete="off" placeholder="Code PUK" [(ngModel)]="action.puk" maxlength="8" size="8"/>
                  <input class="form-control" type="password" autocomplete="off" placeholder="Nouveau PIN" [(ngModel)]="action.new" maxlength="4" size="4"/>
                </ng-template>
                <button class="btn btn-success" [disabled]="this._final_pairing" (click)="this.validate_action(device, action, true)">
                  <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                </button>
                <button class="btn btn-danger" [disabled]="this._final_pairing" (click)="this.validate_action(device, action, false)">
                  <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <ng-template [ngIf]="_droptarget === device">
              <ng-template [ngIf]="_draggedIsSetPin(_dragged)">
                <span>
                  Changer le code pin
                </span>
              </ng-template>
              <ng-template [ngIf]="_draggedIsUnblock(_dragged)">
                <span>
                  Débloquer la carte
                </span>
              </ng-template>
              <ng-template [ngIf]="_draggedIsPerson(_dragged)">
                <span *ngIf="!device.smartcard.uid">
                  Enrôler ({{_enrol_kind }}) {{ _dragged._last_name }} {{ _dragged._first_name }} sur une SmartCard ({{ smartcard_kind_label(device.smartcard) }}) vierge
                </span>
                <span *ngIf="device.smartcard.uid && device.smartcard.matricule === p_matricule(_dragged)">
                  Re-Enrôler ({{_enrol_kind }}) {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} sur SmartCard ({{ smartcard_kind_label(device.smartcard) }})
                </span>
                <span *ngIf="device.smartcard.uid && device.smartcard.matricule !== p_matricule(_dragged)">
                  Révoker ({{_enrol_kind }}) {{ device.smartcard.lastName }} {{ device.smartcard.firstName }} puis enrôler {{ _dragged._last_name }} {{ _dragged._first_name }} sur SmartCard ({{ smartcard_kind_label(device.smartcard) }})
                </span>
              </ng-template>
            </ng-template>
          </li>
          <li *ngIf="selected_app && selected_device_profile" class="list-group-item">
            <button class="btn btn-success btn-lg btn-block" type="submit" [disabled]="this._final_pairing" (click)="this.commit()">
              Terminer la session d'appairage
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading"><span>Utilisateurs</span></div>
        <div class="panel-body">
          <div class="input-group">
            <span class="input-group-addon" id="sizing-addon1"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></span>
            <input type="text" class="form-control" placeholder="Rechercher" aria-describedby="sizing-addon1" [(ngModel)]="search">
          </div>
          <div class="row" style="margin-top:  10px;margin-bottom:  10px;">
            <div class="col-xs-6" draggable="true" (dragstart)="drag($event, { kind: 'set-pin' })">
              <span class="glyphicon glyphicon-move"></span> Changer le code pin
            </div>
            <div class="col-xs-6" draggable="true" (dragstart)="drag($event, { kind: 'unblock' })">
              <span class="glyphicon glyphicon-move"></span> Débloquer la carte
            </div>
          </div>
          <ul class="list-group">
            <li *ngFor="let p of this._items" class="list-group-item" draggable="true" (dragstart)="drag($event, p)">
              <div><span class="glyphicon glyphicon-move"></span> {{ p._last_name }} {{ p._first_name }} <span class="label label-default">{{ p_matricule(p) }}</span></div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
`
})
export class ManagePairingComponent extends AspectComponent {
  @ViewChild('qrcode') input: ElementRef;
  qr_code_data = {
    url: "",
    wifi: { ssid: "", pwd: ""}
  };
  device_actions: DeviceAction[] = [];
  devices: Device[] = [];
  interval: any
  _enrol_kind: "ANTAI" | "LOCAL" = "ANTAI";
  _final_pairing = false;

  constructor(public ctx: AppContext) {
    super(ctx.cc);
    this.restart();
  }

  ngOnDestroy() {
    if (this._final_pairing && this.interval !== undefined) {
      this._controlCenter.ccc(this).farPromise(this.ctx.session.pairingSessionPoll, { kind: "end" });
    }
    super.ngOnDestroy();
    clearTimeout(this.interval);
    this.interval = undefined;
  }

  get wifi_ssid() { return this.qr_code_data.wifi.ssid; }
  set wifi_ssid(ssid) { this.qr_code_data.wifi.ssid = ssid; this.setCode(); }

  get wifi_pwd() { return this.qr_code_data.wifi.pwd; }
  set wifi_pwd(pwd) { this.qr_code_data.wifi.pwd = pwd; this.setCode(); }

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
    let res = await ccc.farPromise(this.ctx.session.pairingSessionPoll, { kind: "ui", device_actions: device_actions });
    if (!res.hasDiagnostics()) {
      let { devices } = res.value() as { devices: Device[] };
      let remaining = new Map();
      for (let device of this.devices) {
        remaining.set(JSON.stringify([device.serial, device.brand, device.model]), device);
      }
      for (let device of devices) {
        let key = JSON.stringify([device.serial, device.brand, device.model]);
        let found = remaining.get(key);
        if (found) {
          remaining.delete(key);
          found.action = undefined;
          found.smartcard = undefined;
          device = Object.assign(found, device);
        }
        else {
          device.will_actions = [];
          this.devices.push(device);
          if (!device.paired_app_urn) {
            this.validate_action(device, {
              kind: "pair",
              app: this.selected_app!,
              device_profile: this.selected_device_profile!,
            }, true);
          }
        }
        if (this._droptarget === device && !device.smartcard)
          this._droptarget = undefined;
      }
      for (let device of remaining.values()) {
        let idx = this.devices.indexOf(device);
        if (idx !== -1)
          this.devices.splice(idx, 1);
      }
    }
    if (this.interval !== undefined) {
      if (this._final_pairing && this.devices.filter(d => !this.d_timedout(d)).length === 0) {
        this.interval = undefined;
        await ccc.farPromise(this.ctx.session.pairingSessionPoll, { kind: "end" });
        this.devices = [];
      }
      else {
        this.interval = setTimeout(() => this.poll(), 2000);
      }
    }
  }

  restart() {
    this._qrcode = undefined;
    this._final_pairing = false;
    let ccc = this._controlCenter.ccc(this);
    ccc.farPromise(this.ctx.session.pairingSession, undefined).then((result) => {
      this.qr_code_data = {
        url: document.location.origin + document.location.pathname,
        wifi: { ssid: "", pwd: ""},
        ...result.value(),
      };
      this.setCode();
      this.interval = setTimeout(() => this.poll(), 10);
    });
    ccc.farPromise(this.ctx.db.query, { id: "application-tree" }).then(res => {
      this._applications = res.value().applications as R_Application[]
      this.selected_app = this._applications.find(a => a._urn === "lsmobile");
    });
    this.search = "";
  }

  commit() {
    if (!this._final_pairing) {
      this._final_pairing = true;
      for (let d of this.devices) {
        let action: Action = {
          kind: "pair+end",
          app: this.selected_app!,
          device_profile: this.selected_device_profile!,
        };
        d.pending_actions.push(action);
        this.device_actions.push({
          brand: d.brand,
          model: d.model,
          serial: d.serial,
          action: action,
        });
      }
    }
  }

  _lastcode = "";
  _qrcode: QRCode | undefined = undefined;
  setCode() {
    let text = JSON.stringify(this.qr_code_data);
    if (text !== this._lastcode || !this._qrcode) {
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
    return (d.timeout > (d.action ? 240 * 1000 : 30 * 1000));
  }

  d_state(d: Device): string {
    if (d.timeout > (d.action ? 240 * 1000 : 30 * 1000))
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

  a_state_label(a: { state: "done" | "error" }) {
    switch (a.state) {
      case "error": return "Erreur";
      case "done": return "Terminé";
    }
    return "?";
  }

  a_state_class(a: { state: "done" | "error" }) {
    switch (a.state) {
      case "error": return "label-danger";
      case "done": return "label-success";
    }
    return "?";
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
    if (a.kind === "set-pin")
      return `Changement de code PIN`;
    if (a.kind === "unblock")
      return `Débloquer la carte`;
    if (a.kind === "pair")
      return `Appairage`;
    if (a.kind === "pair+end")
      return `Appairage puis déconnexion`;
    if (a.kind === "end")
      return `Déconnexion`;
    return "";
  }

  _dragged: { kind: "set-pin" } | { kind: "unblock" } | R_Person | undefined = undefined;
  _droptarget: Device | undefined = undefined;
  _draggedIsSetPin(d: { kind: "set-pin" } | { kind: "unblock" } | R_Person): d is { kind: "set-pin" } {
    return (d as any).kind === "set-pin";
  }
  _draggedIsUnblock(d: { kind: "set-pin" } | { kind: "unblock" } | R_Person): d is { kind: "unblock" } {
    return (d as any).kind === "unblock";
  }
  _draggedIsPerson(d: { kind: "set-pin" } | { kind: "unblock" } | R_Person): d is R_Person {
    return d instanceof R_Person;
  }
  drag($event: DragEvent, p: { kind: "set-pin" } | R_Person) {
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
    if (d.smartcard) {
      $event.preventDefault();
      this._droptarget = d;
    }
  }

  _codeunite = "";
  _login = "";
  _password = "";
  drop($event: DragEvent, d: Device) {
    $event.preventDefault();
    let p = this._dragged;
    if (d && p) {
      let action: Action;
      if (this._draggedIsPerson(p)) {
        let inject = this._enrol_kind === "ANTAI" ? {
          codeunite: this._codeunite,
          login: this._login,
          password: this._password,
        } : {};
        action = {
          kind: "enroll",
          pin: undefined,
          pki: this._enrol_kind,
          enroll: { uid: this.p_matricule(p)!, urn: p._urn!, firstname: p._first_name!, lastname: p._last_name!, ...inject },
          revoke: d.smartcard && d.smartcard.uid ? { uid: d.smartcard.uid, urn: p._urn!, ...inject } : undefined,
        }
      }
      else if (this._draggedIsSetPin(p)) {
        action = { kind: "set-pin", old: undefined, new: undefined }
      }
      else {
        action = { kind: "unblock", puk: undefined, new: undefined }
      }
      d.will_actions.push(action);
    }
  }

  validate_action(d: Device, a: Action, execute: boolean) {
    let idx = d.will_actions.indexOf(a);
    if (idx !== -1)
      d.will_actions.splice(idx, 1);
    if (execute) {
      d.pending_actions.push(a);
      this.device_actions.push({
        serial: d.serial,
        model: d.model,
        brand: d.brand,
        action: a,
      });
    }
  }
}
