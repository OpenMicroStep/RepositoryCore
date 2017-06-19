import {ControlCenter, VersionedObject, VersionedObjectConstructor, DataSource, Aspect, InvocationState, DataSourceQuery, ImmutableSet, Validation} from '@openmicrostep/aspects';
import * as interfaces from '../../generated/aspects.interfaces';
export * from '../../generated/aspects.interfaces';
import {AttributePath, AttributeTypes as V, Reporter} from '@openmicrostep/msbuildsystem.shared';

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
  R_AuthenticationPK  : { new(): interfaces.R_AuthenticationPK.Aspects.obi   },
  R_AuthenticationPWD : { new(): interfaces.R_AuthenticationPWD.Aspects.obi  },
  R_AuthenticationLDAP: { new(): interfaces.R_AuthenticationLDAP.Aspects.obi },
  R_Person            : { new(): interfaces.R_Person.Aspects.obi             },
  R_Service           : { new(): interfaces.R_Service.Aspects.obi            },
  R_Application       : { new(): interfaces.R_Application.Aspects.obi        },
  R_Use_Profile       : { new(): interfaces.R_Use_Profile.Aspects.obi        },
  R_Device_Profile    : { new(): interfaces.R_Device_Profile.Aspects.obi     },
  R_License           : { new(): interfaces.R_License.Aspects.obi            },
  R_Software_Context  : { new(): interfaces.R_Software_Context.Aspects.obi   },
  R_Device            : { new(): interfaces.R_Device.Aspects.obi             },
  R_Authorization     : { new(): interfaces.R_Authorization.Aspects.obi      },
  R_Right             : { new(): interfaces.R_Right.Aspects.obi              },
  R_Element           : { new(): interfaces.R_Element.Aspects.obi            },
  Parameter           : { new(): interfaces.Parameter.Aspects.obi            },
  R_LDAPAttribute     : { new(): interfaces.R_LDAPAttribute                  },
  R_LDAPGroup         : { new(): interfaces.R_LDAPGroup                      },
  R_LDAPConfiguration : { new(): interfaces.R_LDAPConfiguration              },
};

export const cache = cachedClasses<All>([
  { name: "R_AuthenticationPK"  , aspect: "obi", cstor: interfaces.R_AuthenticationPK   },
  { name: "R_AuthenticationPWD" , aspect: "obi", cstor: interfaces.R_AuthenticationPWD  },
  { name: "R_AuthenticationLDAP", aspect: "obi", cstor: interfaces.R_AuthenticationLDAP },
  { name: "R_Person"            , aspect: "obi", cstor: interfaces.R_Person             },
  { name: "R_Service"           , aspect: "obi", cstor: interfaces.R_Service            },
  { name: "R_Application"       , aspect: "obi", cstor: interfaces.R_Application        },
  { name: "R_Use_Profile"       , aspect: "obi", cstor: interfaces.R_Use_Profile        },
  { name: "R_Device_Profile"    , aspect: "obi", cstor: interfaces.R_Device_Profile     },
  { name: "R_License"           , aspect: "obi", cstor: interfaces.R_License            },
  { name: "R_Software_Context"  , aspect: "obi", cstor: interfaces.R_Software_Context   },
  { name: "R_Device"            , aspect: "obi", cstor: interfaces.R_Device             },
  { name: "R_Authorization"     , aspect: "obi", cstor: interfaces.R_Authorization      },
  { name: "R_Right"             , aspect: "obi", cstor: interfaces.R_Right              },
  { name: "R_Element"           , aspect: "obi", cstor: interfaces.R_Element            },
  { name: "Parameter"           , aspect: "obi", cstor: interfaces.Parameter            },
  { name: "R_LDAPAttribute"     , aspect: "obi", cstor: interfaces.R_LDAPAttribute      },
  { name: "R_LDAPGroup"         , aspect: "obi", cstor: interfaces.R_LDAPGroup          },
  { name: "R_LDAPConfiguration" , aspect: "obi", cstor: interfaces.R_LDAPConfiguration  },
]);

function validate_r_authentication(reporter: Reporter, o: interfaces.R_Person | interfaces.R_Application) {
  let m = o.manager();
  if (m.hasChanges(["_login", "_r_authentication"])) {
    if (m.hasAttributeValues(["_login", "_r_authentication"])) {
      let vlogin = m.versionAttributeValue("_login");
      let nlogin = new Set<string>(m.attributeValue("_login"));
      let vauth = m.versionAttributeValue("_r_authentication");
      let nauth = m.attributeValue("_r_authentication");
      for (let a of nauth) {
        let am = a.manager();
        if (am.hasChanges(["_mlogin"])) {
          nlogin.delete(am.versionAttributeValue("_mlogin"));
          nlogin.add(am.attributeValue("_mlogin"));
        }
      }
      for (let a of vauth) {
        if (!nauth.has(a)) {
          if (a.manager().hasAttributeValue("_mlogin"))
            nlogin.delete(a.manager().versionAttributeValue("_mlogin"));
          else
            reporter.diagnostic({ type: "warning", msg: `_mlogin must be loaded on delete authentication (this shouln't stay that way)` });
        }
      }
      o._login = nlogin;
    }
    else
      reporter.diagnostic({ type: "warning", msg: `changes to _login and _r_authentication are related, they both need to be loaded` });
  }
}
const validateR_Person = Validation.attributesValidator<interfaces.R_Person>({
  _first_name: V.validateString,
  _last_name: V.validateString,
})
interfaces.R_Person.category('validation', {
  validate(reporter) {
    validateR_Person(reporter, this);
    validate_r_authentication(reporter, this);
  }
});

const validateR_Application = Validation.attributesValidator<interfaces.R_Application>({
  _label: V.validateString,
  _r_software_context: Validation.validateHasValue,
})
interfaces.R_Application.category('validation', {
  validate(reporter) {
    validateR_Application(reporter, this);
    validate_r_authentication(reporter, this);
  }
});

Validation.categoryValidation<interfaces.R_AuthenticationPK>(interfaces.R_AuthenticationPK, {
  _mlogin: V.validateString,
  _public_key: V.validateString,
});

Validation.categoryValidation<interfaces.R_AuthenticationPWD>(interfaces.R_AuthenticationPWD, {
  _mlogin: V.validateString,
});

Validation.categoryValidation<interfaces.R_AuthenticationLDAP>(interfaces.R_AuthenticationLDAP, {
  _mlogin: V.validateString,
  _ldap_dn: V.validateString,
});

Validation.categoryValidation<interfaces.R_LDAPConfiguration>(interfaces.R_LDAPConfiguration, {
  _ldap_url: V.validateString,
  _ldap_dn: V.validateString,
  _ldap_password: V.validateString,
  _ldap_user_base: V.validateString,
  _ldap_user_filter: V.validateString,
});

Validation.categoryValidation<interfaces.R_LDAPAttribute>(interfaces.R_LDAPAttribute, {
  _ldap_attribute_name: V.validateString,
  _ldap_to_attribute_name: V.validateString,
});

Validation.categoryValidation<interfaces.R_LDAPGroup>(interfaces.R_LDAPGroup, {
  _ldap_dn: V.validateString,
  _ldap_group: Validation.classValidator("R_Authorization", false),
});
