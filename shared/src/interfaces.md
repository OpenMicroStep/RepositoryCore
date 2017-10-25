## class Session
### category server
#### setData(data: any): void
#### data(): any
### farCategory client
#### isAuthenticated(): boolean
#### loginByPassword(q: { login: string, password: string }): boolean
#### logout(): void
#### oneTimePasswordForDevice(device: R_Device): string
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

## class R_AuthenticationTicket
### attributes
#### `_r_authenticable`: R_Person | R_Application
#### `_r_device`: R_Device
#### `_r_token`: string
#### `_creation_date`: date
#### `_disabled`: boolean
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
#### `_mail`: string
#### `_r_services`: <0,*,R_Service>
_relation_: `_r_member`
### aspect obi

## class R_AuthenticationPK
_sub object_
### attributes
#### `_mlogin`: string
#### `_public_key`: string
#### `_private_key`: string
#### `_ciphered_private_key`: string
### aspect obi

## class R_AuthenticationPWD
_sub object_
### attributes
#### `_mlogin`: string
#### `_hashed_password`: string
#### `_must_change_password`: boolean
### aspect obi

## class R_AuthenticationLDAP
_sub object_
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
_relation_: `_r_child_services`
#### `_r_child_services`: <0,*,R_Service>
_relation_: `_r_parent_service`
#### `_r_administrator`: <0,*,R_Person>
#### `_r_member`: <0,*,R_Person>
_relation_: `_r_services`
### aspect obi

## class R_AppTree
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_parent_apptree`: R_AppTree
_relation_: `_r_child_apptrees`
#### `_r_child_apptrees`: <0,*,R_AppTree>
_relation_: `_r_parent_apptree`
#### `_r_administrator`: <0,*,R_Person>
#### `_r_application`: <0,*,R_Application>
### aspect obi

## class R_DeviceTree
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_parent_devicetree`: R_DeviceTree
_relation_: `_r_child_devicetrees`
#### `_r_child_devicetrees`: <0,*,R_DeviceTree>
_relation_: `_r_parent_devicetree`
#### `_r_administrator`: <0,*,R_Person>
#### `_r_device`: <0,*,R_Device>
### aspect obi

## class Parameter
_sub object_
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
_sub object_
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
_disabled sub object_
### attributes
#### `_label`: string
### aspect obi

## class R_Device_Profile
_disabled sub object_
### attributes
#### `_label`: string
#### `_r_device`: <0,*,R_Device>
_relation_: `_r_device_profiles`
### aspect obi

## class R_Device
### attributes
#### `_label`: string
#### `_disabled`: boolean
#### `_urn`: string
#### `_r_serial_number`: string
#### `_r_out_of_order`: boolean
#### `_r_device_profiles`: <0,*,R_Device_Profile>
_relation_: `_r_device`
### aspect obi

## class R_Right
_sub object_
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
_sub object_
### attributes
#### `_ldap_attribute_name`: string
#### `_ldap_to_attribute_name`: string
### aspect obi

## class R_LDAPGroup
_sub object_
### attributes
#### `_ldap_dn`: string
#### `_ldap_group`: R_Authorization
### aspect obi

## class R_LDAPConfiguration
### attributes
#### `_urn`: string
#### `_ldap_url`: string
#### `_ldap_dn`: string
#### `_ldap_password`: string
#### `_ldap_user_base`: string
#### `_ldap_user_filter`: string
#### `_ldap_attribute_map`: <0,*,R_LDAPAttribute>
#### `_ldap_group_map`: <0,*,R_LDAPGroup>
### aspect obi
