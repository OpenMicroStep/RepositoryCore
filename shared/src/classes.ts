import {VersionedObjectConstructor, Validation} from '@openmicrostep/aspects';
import * as interfaces from '../../generated/aspects.interfaces';
export * from '../../generated/aspects.interfaces';
import {AttributeTypes as V, Reporter} from '@openmicrostep/msbuildsystem.shared';

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
            reporter.diagnostic({ is: "warning", msg: `_mlogin must be loaded on delete authentication (this shouln't stay that way)` });
        }
      }
      o._login = nlogin;
    }
    else
      reporter.diagnostic({ is: "warning", msg: `changes to _login and _r_authentication are related, they both need to be loaded` });
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
