import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, ImmutableSet} from '@openmicrostep/aspects';
import * as interfaces from '../../generated/aspects.interfaces';
export * from '../../generated/aspects.interfaces';

function cachedClasses<T extends object>(classes: { name: keyof T, aspect: string, cstor: VersionedObjectConstructor }[]) : (cc: ControlCenter) => T {
  class Cache {
    [s: string]: Aspect.Constructor;
    
    constructor (cc: ControlCenter) {
      for (let c of classes) {
        let cstor = cc.cache().createAspect(cc, c.aspect, c.cstor);
        this[c.name] = cstor;
      }
    }
  }
  return (cc: ControlCenter) => new Cache(cc) as any;
}

export type All = {
  R_AuthenticationPK : { new(): interfaces.R_AuthenticationPK.Aspects.obi  },
  R_AuthenticationPWD: { new(): interfaces.R_AuthenticationPWD.Aspects.obi },
  R_Person           : { new(): interfaces.R_Person.Aspects.obi            },
  R_Service          : { new(): interfaces.R_Service.Aspects.obi           },
  R_Application      : { new(): interfaces.R_Application.Aspects.obi       },
  R_Use_Profile      : { new(): interfaces.R_Use_Profile.Aspects.obi       },
  R_Device_Profile   : { new(): interfaces.R_Device_Profile.Aspects.obi    },
  R_License          : { new(): interfaces.R_License.Aspects.obi           },
  R_Software_Context : { new(): interfaces.R_Software_Context.Aspects.obi  },
  R_Device           : { new(): interfaces.R_Device.Aspects.obi            },
  R_Authorization    : { new(): interfaces.R_Authorization.Aspects.obi     },
  R_Right            : { new(): interfaces.R_Right.Aspects.obi             },
  R_Element          : { new(): interfaces.R_Element.Aspects.obi           },
  Parameter          : { new(): interfaces.Parameter.Aspects.obi           },
};

export const cache = cachedClasses<All>([
  { name: "R_AuthenticationPK" , aspect: "obi", cstor: interfaces.R_AuthenticationPK  },
  { name: "R_AuthenticationPWD", aspect: "obi", cstor: interfaces.R_AuthenticationPWD },
  { name: "R_Person"           , aspect: "obi", cstor: interfaces.R_Person            },
  { name: "R_Service"          , aspect: "obi", cstor: interfaces.R_Service           },
  { name: "R_Application"      , aspect: "obi", cstor: interfaces.R_Application       },
  { name: "R_Use_Profile"      , aspect: "obi", cstor: interfaces.R_Use_Profile       },
  { name: "R_Device_Profile"   , aspect: "obi", cstor: interfaces.R_Device_Profile    },
  { name: "R_License"          , aspect: "obi", cstor: interfaces.R_License           },
  { name: "R_Software_Context" , aspect: "obi", cstor: interfaces.R_Software_Context  },
  { name: "R_Device"           , aspect: "obi", cstor: interfaces.R_Device            },
  { name: "R_Authorization"    , aspect: "obi", cstor: interfaces.R_Authorization     },
  { name: "R_Right"            , aspect: "obi", cstor: interfaces.R_Right             },
  { name: "R_Element"          , aspect: "obi", cstor: interfaces.R_Element           },
  { name: "Parameter"          , aspect: "obi", cstor: interfaces.Parameter           },
]);