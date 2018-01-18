import { ControlCenter, DataSource, AspectConfiguration, AspectSelection, VersionedObjectManager } from '@openmicrostep/aspects';
import { XHRTransport } from '@openmicrostep/aspects.xhr';
import {Session} from '../../shared/src/classes';
import * as interfaces from '../../shared/src/classes';
export * from '../../shared/src/classes';
import './qrcode';
const xhr = new XHRTransport();
const cfg = new AspectConfiguration({
  selection: new AspectSelection([
    interfaces.Session.Aspects.client            ,
    DataSource.Aspects.client                    ,
    interfaces.R_AuthenticationTicket.Aspects.obi,
    interfaces.R_AuthenticationPK.Aspects.obi    ,
    interfaces.R_AuthenticationPWD.Aspects.obi   ,
    interfaces.R_AuthenticationLDAP.Aspects.obi  ,
    interfaces.R_Person.Aspects.obi              ,
    interfaces.R_Service.Aspects.obi             ,
    interfaces.R_DeviceTree.Aspects.obi          ,
    interfaces.R_AppTree.Aspects.obi             ,
    interfaces.R_Application.Aspects.obi         ,
    interfaces.R_Use_Profile.Aspects.obi         ,
    interfaces.R_Device_Profile.Aspects.obi      ,
    interfaces.R_License.Aspects.obi             ,
    interfaces.R_Software_Context.Aspects.obi    ,
    interfaces.R_Device.Aspects.obi              ,
    interfaces.R_Authorization.Aspects.obi       ,
    interfaces.R_Right.Aspects.obi               ,
    interfaces.R_Element.Aspects.obi             ,
    interfaces.Parameter.Aspects.obi             ,
    interfaces.R_LDAPAttribute.Aspects.obi       ,
    interfaces.R_LDAPGroup.Aspects.obi           ,
    interfaces.R_LDAPConfiguration.Aspects.obi   ,
  ]),
  defaultFarTransport: xhr,
  validators: interfaces.validators,
});
const controlCenter = new ControlCenter(cfg);
const ccc = controlCenter.registerComponent({});
const dataSource = DataSource.Aspects.client.create(ccc);
const session = Session.Aspects.client.create(ccc);

export type AppContext = { cc: ControlCenter, db: DataSource.Aspects.client, session: Session.Aspects.client };
export const AppContext: { new(): AppContext } = function AppContext() {
    throw new Error(`shouldn't be called, just here to allow dep injection`);
} as any;
export const appContext: AppContext = { cc: controlCenter, db: dataSource, session: session };

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { CommonModule } from '@angular/common';
import { NgModule, Injectable }      from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule }   from '@angular/router';
import { AspectModule }  from './aspect/aspect.module';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppComponent }  from './app.component';

// Main objects
import { ApplicationComponent, ApplicationListItemComponent }  from './components/application.component';
import { PersonComponent, PersonListItemComponent }  from './components/person.component';
import { DeviceComponent, DeviceListItemComponent }  from './components/device.component';
import { ServiceComponent, ServiceListItemComponent }  from './components/service.component';
import { AppTreeComponent, AppTreeListItemComponent }  from './components/apptree.component';
import { DeviceTreeComponent, DeviceTreeListItemComponent }  from './components/devicetree.component';
import { SoftwareContextComponent, SoftwareContextListItemComponent }  from './components/software-context.component';
import { AuthorizationComponent, AuthorizationListItemComponent, SoftwareContextTreeItemComponent }  from './components/authorization.component';
// Sub objects
import { AuthenticationPWDComponent }  from './components/authentication.pwd.component';
import { AuthenticationPKComponent }  from './components/authentication.pk.component';
import { AuthenticationLDAPComponent }  from './components/authentication.ldap.component';
import { DeviceProfileComponent }  from './components/device-profile.component';
import { UseProfileComponent }  from './components/use-profile.component';
import { ParameterComponent }  from './components/parameter.component';

import { ManagePersonsComponent }  from './layout/manage-persons.component';
import { ManageDevicesComponent }  from './layout/manage-devices.component';
import { ManageApplicationsComponent }  from './layout/manage-applications.component';
import { ManageAuthorizationsComponent }  from './layout/manage-authorizations.component';
import { ManagePairingComponent }  from './layout/manage-pairing.component';
import { ManageSettingsComponent }  from './layout/manage-settings.component';

import { AdminTreeComponent, AdminTreeItemComponent }  from './tree.component';
import { SearchListComponent }  from './search.component';

@NgModule({
  imports: [ CommonModule, BrowserModule, FormsModule, BrowserAnimationsModule, AspectModule.withComponents([
    AuthenticationPWDComponent
  ])],
  declarations: [ AppComponent,
    SearchListComponent, AdminTreeComponent, AdminTreeItemComponent,
    ManagePersonsComponent, ManageDevicesComponent, ManageApplicationsComponent,
    ManageAuthorizationsComponent, ManagePairingComponent, ManageSettingsComponent,

    PersonComponent, PersonListItemComponent,
    ApplicationComponent, ApplicationListItemComponent,
    DeviceComponent, DeviceListItemComponent,
    AppTreeComponent, AppTreeListItemComponent,
    DeviceTreeComponent, DeviceTreeListItemComponent,
    ServiceComponent, ServiceListItemComponent,
    AuthorizationComponent, AuthorizationListItemComponent,
    SoftwareContextTreeItemComponent, SoftwareContextListItemComponent,
    DeviceProfileComponent,
    UseProfileComponent,
    ParameterComponent,
    AuthenticationPWDComponent,
    AuthenticationPKComponent,
    AuthenticationLDAPComponent,
  ],
  bootstrap: [ AppComponent ],
  providers: [
    { provide: ControlCenter, useValue: controlCenter },
    { provide: DataSource   , useValue: dataSource    },
    { provide: AppContext   , useValue: appContext    },
  ]
})
export class AppModule { }

platformBrowserDynamic().bootstrapModule(AppModule);

dataSource.manager().setSavedIdVersion('odb', VersionedObjectManager.UndefinedVersion);
session.manager().setSavedIdVersion('session', VersionedObjectManager.UndefinedVersion);
