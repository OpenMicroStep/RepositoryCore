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
#### `_r_authentication`: <0,*,R_AuthenticationPWD | R_AuthenticationPK>
#### `_r_matricule`: string
#### `_first_name`: string
#### `_middle_name`: string
#### `_last_name`: string
### aspect obi

## class R_AuthenticationPK
### attributes
#### `_login`: string
#### `_public_key`: string
#### `_private_key`: string
#### `_ciphered_private_key`: string
### aspect obi

## class R_AuthenticationPWD
### attributes
#### `_login`: string
#### `_hashed_password`: string
#### `_must_change_password`: boolean
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
#### `_r_child_contexts`: R_Software_Context
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
#### `_r_action`: VersionedObject
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