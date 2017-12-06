import {VersionedObjectConstructor, Validation, VersionedObjectManager, VersionedObject} from '@openmicrostep/aspects';
import * as interfaces from '../../generated/aspects.interfaces';
export * from '../../generated/aspects.interfaces';
import {AttributeTypes as V, Reporter} from '@openmicrostep/msbuildsystem.shared';

const validateR_Person = Validation.attributesValidator<interfaces.R_Person>({
  _first_name: V.validateString,
  _last_name: V.validateString,
})
interfaces.R_Person.category('validation', {
  validate(reporter) {
    validateR_Person(reporter, this);
  }
});

const validateR_Application = Validation.attributesValidator<interfaces.R_Application>({
  _label: V.validateString,
  _r_software_context: Validation.validateHasValue,
})
interfaces.R_Application.category('validation', {
  validate(reporter) {
    validateR_Application(reporter, this);
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
