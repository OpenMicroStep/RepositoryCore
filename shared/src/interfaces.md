## class Session
### category server
### farCategory client
#### loginByPassword(q: { login: string, password: string }): boolean
### aspect server
#### categories: server client
### aspect client
#### farCategories: client

## class R_Internal_Right
### attributes
#### `_r_operation`: <0,*,VersionedObject>
#### `_r_who`: <0,*,VersionedObject>
### aspect obi

## class R_Element
### attributes
#### `_system_name`: string
#### `_order`: integer
### aspect obi

## class R_Person
### attributes
#### `_disabled`: boolean
#### `_urn`: string
#### `_login`: <0,*,string>
#### `_r_authentication`: <0,*,R_AuthenticationPWD | R_AuthenticationPK | R_AuthenticationLDAP>
#### `_parameter`: <0,*,Parameter>
#### `_first_name`: string
#### `_middle_name`: string
#### `_last_name`: string
### aspect obi

## class R_AuthenticationPK
### attributes
#### `_mlogin`: string
#### `_public_key`: string
#### `_private_key`: string
#### `_ciphered_private_key`: string
### aspect obi

## class R_AuthenticationPWD
### attributes
#### `_mlogin`: string
#### `_password`: string
#### `_hashed_password`: string
#### `_must_change_password`: boolean
### aspect obi

## class R_AuthenticationLDAP
### attributes
#### `_mlogin`: string
#### `_ldap_dn`: string
### aspect obi

## class R_Service
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_parent_service`: R_Service
#### `_r_administrator`: <0,*,R_Person>
#### `_r_member`: <0,*,R_Person>
### aspect obi

## class R_LDAPConfiguration
### attributes
#### `_ldap_url`: string
#### `_ldap_dn`: string
#### `_ldap_password`: string
#### `_ldap_user_base`: string
#### `_ldap_user_filter`: string
#### `_ldap_attribute_map`: <0,*,R_LDAPAttribute>
#### `_ldap_group_map`: <0,*,R_LDAPGroup>

## class R_LDAPAttribute
### attributes
#### `_ldap_attribute_name`: string
#### `_ldap_to_attribute_name`: string
### aspect obi

## class R_LDAPGroup
### attributes
#### `_ldap_dn`: string
#### `_ldap_group`: R_Authorization
### aspect obi

## class Parameter
### attributes
#### `_label`: string
#### `_string`: string
### aspect obi

## class R_Application
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_login`: <0,*,string>
#### `_r_authentication`: <0,*,R_AuthenticationPWD | R_AuthenticationPK>
#### `_parameter`: <0,*,Parameter>
#### `_r_sub_license`: <0,*,R_License>
#### `_r_software_context`: R_Software_Context
#### `_r_sub_use_profile`: <0,*,R_Use_Profile>
#### `_r_sub_device_profile`: <0,*,R_Device_Profile>
### aspect obi

## class R_License
### attributes
#### `_label`: string
#### `_r_software_context`: R_Software_Context
#### `_r_use_profile`: R_Use_Profile
#### `_r_device_profile`: R_Device_Profile
#### `_r_license_number`: string
### aspect obi

## class R_Software_Context
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_parent_context`: R_Software_Context
_relation_: `_r_child_contexts`
#### `_r_child_contexts`: <0,*,R_Software_Context>
_relation_: `_r_parent_context`
#### `_r_license_needed`: integer
### aspect obi

## class R_Use_Profile
### attributes
#### `_label`: string
### aspect obi

## class R_Device_Profile
### attributes
#### `_label`: string
#### `_r_device`: <0,*,R_Device>
### aspect obi

## class R_Device
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_serial_number`: string
#### `_r_out_of_order`: boolean
### aspect obi

## class R_Right
### attributes
#### `_label`: string
#### `_r_action`: R_Element
#### `_r_application`: R_Application
#### `_r_software_context`: R_Software_Context
#### `_r_use_profile`: R_Use_Profile
#### `_r_device_profile`: R_Device_Profile
### aspect obi

## class R_Authorization
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_authenticable`: <0,*,R_Person | R_Application>
#### `_r_sub_right`: <0,*,R_Right>
### aspect obi

## class R_LDAPAttribute
### attributes
#### `_ldap_attribute_name`: string
#### `_ldap_to_attribute_name`: string
### aspect obi

## class R_LDAPGroup
### attributes
#### `_ldap_dn`: string
#### `_ldap_group`: R_Authorization
### aspect obi

## class R_LDAPConfiguration
### attributes
#### `_ldap_url`: string
#### `_ldap_dn`: string
#### `_ldap_password`: string
#### `_ldap_user_base`: string
#### `_ldap_user_filter`: string
#### `_ldap_attribute_map`: <0,*,R_LDAPAttribute>
#### `_ldap_group_map`: <0,*,R_LDAPGroup>
### aspect obi
