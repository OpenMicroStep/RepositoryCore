import { ControlCenter, DataSource, Aspect } from '@openmicrostep/aspects';
import {cache, All} from '../../shared/src/classes';
export * from '../../shared/src/classes';
const controlCenter = new ControlCenter();
const dataSource = new (DataSource.installAspect(controlCenter, "client"))();
export type AppContext = All & { controlCenter: ControlCenter, dataSource: DataSource.Aspects.client };
export const AppContext: { new(): AppContext } = function AppContext() {
    throw new Error(`shouldn't be called, just here to allow dep injection`);
} as any;
export const appContext: AppContext = Object.assign(cache(controlCenter), { controlCenter: controlCenter, dataSource: dataSource });

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { XHRTransport } from '@openmicrostep/aspects.xhr';

import { NgModule, Injectable }      from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AspectModule }  from './aspect/aspect.module';

import { AppComponent }  from './app.component';

// Main objects
import { ApplicationComponent, ApplicationListItemComponent }  from './components/application.component';
import { PersonComponent, PersonListItemComponent }  from './components/person.component';
import { DeviceComponent, DeviceListItemComponent }  from './components/device.component';
import { SoftwareContextComponent, SoftwareContextListItemComponent }  from './components/software-context.component';
import { AuthorizationComponent, AuthorizationListItemComponent }  from './components/authorization.component';
// Sub objects
import { AuthenticationPWDComponent }  from './components/authentication.pwd.component';
import { AuthenticationPKComponent }  from './components/authentication.pk.component';
import { DeviceProfileComponent }  from './components/device-profile.component';
import { UseProfileComponent }  from './components/use-profile.component';
import { ParameterComponent }  from './components/parameter.component';
import { RightComponent }  from './components/right.component';

import { ManagePersonsComponent }  from './layout/manage-persons.component';
import { ManageApplicationsComponent }  from './layout/manage-applications.component';
import { ManageAuthorizationsComponent }  from './layout/manage-authorizations.component';

import { SearchListComponent }  from './search.component';


const xhr = new XHRTransport();
controlCenter.installTransport(xhr);

@NgModule({
  imports: [ BrowserModule, FormsModule, AspectModule.withComponents([
    AuthenticationPWDComponent
  ]) ],
  declarations: [ AppComponent, 
    SearchListComponent, 
    ManagePersonsComponent, ManageApplicationsComponent, ManageAuthorizationsComponent,

    PersonComponent, PersonListItemComponent,
    ApplicationComponent, ApplicationListItemComponent,
    DeviceComponent, DeviceListItemComponent,
    AuthorizationComponent, AuthorizationListItemComponent,

    DeviceProfileComponent,
    UseProfileComponent,
    ParameterComponent,
    AuthenticationPWDComponent,
    AuthenticationPKComponent,
    RightComponent,
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
