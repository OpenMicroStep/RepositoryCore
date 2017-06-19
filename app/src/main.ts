import { ControlCenter, DataSource, Aspect } from '@openmicrostep/aspects';
import {cache, All, Session} from '../../shared/src/classes';
export * from '../../shared/src/classes';
const controlCenter = new ControlCenter();
const dataSource = new (DataSource.installAspect(controlCenter, "client"))();
const session = new (Session.installAspect(controlCenter, "client"))();
export type AppContext = All & { controlCenter: ControlCenter, dataSource: DataSource.Aspects.client, session: Session.Aspects.client };
export const AppContext: { new(): AppContext } = function AppContext() {
    throw new Error(`shouldn't be called, just here to allow dep injection`);
} as any;
export const appContext: AppContext = Object.assign(cache(controlCenter), { controlCenter: controlCenter, dataSource: dataSource, session: session });

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { XHRTransport } from '@openmicrostep/aspects.xhr';
import { CommonModule } from '@angular/common';
import { NgModule, Injectable }      from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule }   from '@angular/router';
import { AspectModule }  from './aspect/aspect.module';
import { MdTabsModule }        from '@angular/material';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppComponent }  from './app.component';

// Main objects
import { ApplicationComponent, ApplicationListItemComponent }  from './components/application.component';
import { PersonComponent, PersonListItemComponent }  from './components/person.component';
import { DeviceComponent, DeviceListItemComponent }  from './components/device.component';
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
import { ManageSettingsComponent }  from './layout/manage-settings.component';

import { SearchListComponent }  from './search.component';


const xhr = new XHRTransport();
controlCenter.installTransport(xhr);

@NgModule({
  imports: [ CommonModule, BrowserModule, FormsModule, MdTabsModule, BrowserAnimationsModule, AspectModule.withComponents([
    AuthenticationPWDComponent
  ])],
  declarations: [ AppComponent, 
    SearchListComponent, 
    ManagePersonsComponent, ManageDevicesComponent, ManageApplicationsComponent, ManageAuthorizationsComponent, ManageSettingsComponent,

    PersonComponent, PersonListItemComponent,
    ApplicationComponent, ApplicationListItemComponent,
    DeviceComponent, DeviceListItemComponent,
    AuthorizationComponent, AuthorizationListItemComponent,
    SoftwareContextTreeItemComponent,

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

dataSource.manager().setId('odb');
session.manager().setId('session');
