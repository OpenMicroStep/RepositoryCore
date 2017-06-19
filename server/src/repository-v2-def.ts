export const repositoryV2Definition = `
ENT // ENT-Gab
_id: 7
pattern: 
  Gab
  _id: 1089
  characteristic: r_internal right
  cardinality: multi
  _end:
_end:

Car
_id: 301
system name: urn
type: STR
unique: 1
_end:

Car
_id: 302
system name: version
type: INT
_end:

Car
_id: 311
system name: first name
type: STR
_end:

Car
_id: 313
system name: middle name
type: STR
_end:

Car
_id: 315
system name: last name
type: STR
_end:

Car
_id: 321
system name: login
type: STR
unique: 1
_end:

Car
_id: 322
system name: mlogin
type: STR
_end:

Car
_id: 323
system name: hashed password
type: STR
_end:

Car
_id: 325
system name: must change password
type: BOOL
_end:

Car
_id: 331
system name: public key
type: STR
unique: 1
_end:

Car
_id: 333
system name: private key
type: STR
_end:

Car
_id: 335
system name: ciphered private key
type: STR
_end:

ENT // ENT-R_Element
_id: 10011
system name: R_Element
pattern: 
  Gab
  _id: 10013
  characteristic: system name
  cardinality: one
  _end:
pattern: 
  Gab
  _id: 10015
  characteristic: order
  cardinality: one
  _end:
_end:

ENT // ENT-R_Internal Right
_id: 10021
system name: R_Internal Right
pattern: 
  Gab
  _id: 10023
  characteristic: r_operation
  cardinality: multi
  mandatory: 1
  _end:
pattern: 
  Gab
  _id: 10027
  characteristic: r_who
  cardinality: multi
  mandatory: 1
  _end:
_end:

ENT // ENT-R_Person (101)
_id: 10101
system name: R_Person
pattern: 
  Gab
  _id: 10102
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Person-entity, used for the creat-id and invalidate-id rights
  Gab
  _id: 10111
  characteristic: entity
  r_internal right: 
    R_Internal Right
    _id: 10115
    r_operation: pseudo-read
    r_who: public
    _end:
  r_internal right: 
    R_Internal Right
    _id: 10117
    r_operation: create-id
    r_who: black
    _end:
  _end:
pattern:  // ENT-R_Person-disabled
  Gab
  _id: 10131
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Person-urn
  Gab
  _id: 10141
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Person-login
  Gab
  _id: 10143
  characteristic: login
  cardinality: multi
  _end:
pattern:  // ENT-R_Person-authentication
  Gab
  _id: 10142
  characteristic: r_authentication
  cardinality: multi
  _end:
pattern:  // ENT-R_Person-r_matricule
  Gab
  _id: 10204
  characteristic: r_matricule
  cardinality: one
  _end:
pattern:  // ENT-R_Person-first name
  Gab
  _id: 10311
  characteristic: first name
  mandatory: 1
  cardinality: one
  r_internal right: 
    R_Internal Right
    _id: 10313
    r_operation: read
    r_who: public
    _end:
  r_internal right: 
    R_Internal Right
    _id: 10315
    r_operation: add
    r_who: black
    _end:
  _end:
pattern:  // ENT-R_Person-middle name
  Gab
  _id: 10331
  characteristic: middle name
  cardinality: one
  r_internal right: 
    R_Internal Right
    _id: 10333
    r_operation: read
    r_who: public
    _end:
  r_internal right: 
    R_Internal Right
    _id: 10335
    r_operation: add
    r_who: black
    _end:
  _end:
pattern:  // ENT-R_Person-last name
  Gab
  _id: 10351
  characteristic: last name
  mandatory: 1
  cardinality: one
  r_internal right: 
    R_Internal Right
    _id: 10353
    r_operation: read
    r_who: public
    _end:
  r_internal right: 
    R_Internal Right
    _id: 10355
    r_operation: add
    r_who: black
    _end:
  _end:
_end:

ENT // ENT-R_Service (105)
_id: 10501
system name: R_Service
pattern: 
  Gab
  _id: 10502
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Service-entity
  Gab
  _id: 10511
  characteristic: entity
  _end:
pattern:  // ENT-R_Service-label
  Gab
  _id: 10521
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Service-disabled
  Gab
  _id: 10531
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Service-urn
  Gab
  _id: 10541
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Service-r_parent service
  Gab
  _id: 10551
  characteristic: r_parent service
  cardinality: one
  _end:
pattern:  // ENT-R_Service-r_administrator
  Gab
  _id: 10561
  characteristic: r_administrator
  cardinality: multi
  _end:
pattern:  // ENT-R_Service-r_member
  Gab
  _id: 10571
  characteristic: r_member
  cardinality: multi
  _end:
_end:

ENT // ENT-R_Application (109)
_id: 10901
system name: R_Application
pattern: 
  Gab
  _id: 10902
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Application-entity
  Gab
  _id: 10911
  characteristic: entity
  _end:
pattern:  // ENT-R_Application-label
  Gab
  _id: 10921
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Application-disabled
  Gab
  _id: 10931
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Application-urn
  Gab
  _id: 10941
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Person-login
  Gab
  _id: 10943
  characteristic: login
  cardinality: multi
  _end:
pattern:  // ENT-R_Application-authentication
  Gab
  _id: 10942
  characteristic: r_authentication
  cardinality: multi
  _end:
pattern:  // ENT-R_Application-parameter
  Gab
  _id: 11111
  characteristic: parameter
  cardinality: multi
//  subobject: 1
  _end:
pattern:  // ENT-R_Application-r_sub-license
  Gab
  _id: 11121
  characteristic: r_sub-license
  cardinality: multi
//  subobject: 1
  _end:
pattern:  // ENT-R_Application-r_software context
  Gab
  _id: 11131
  characteristic: r_software context
  cardinality: one
  _end:
pattern:  // ENT-R_Application-r_sub-use profile
  Gab
  _id: 11151
  characteristic: r_sub-use profile
  cardinality: multi
//  subobject: 1
  _end:
pattern:  // ENT-R_Application-r_sub-device profile
  Gab
  _id: 11171
  characteristic: r_sub-device profile
  cardinality: multi
//  subobject: 1
  _end:
_end:

ENT // ENT-R_Software Context (113)
_id: 11301
system name: R_Software Context
pattern: 
  Gab
  _id: 11302
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Software Context-entity
  Gab
  _id: 11311
  characteristic: entity
  _end:
pattern:  // ENT-R_Software Context-label
  Gab
  _id: 11321
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Software Context-disabled
  Gab
  _id: 11331
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Software Context-urn
  Gab
  _id: 11341
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Software Context-r_parent context
  Gab
  _id: 11351
  characteristic: r_parent context
  cardinality: one
  _end:
pattern:  // ENT-R_Software Context-r_license needed
  Gab
  _id: 11361
  characteristic: r_license needed
  cardinality: one
  _end:
_end:

ENT // ENT-R_Right (117)
_id: 11701
system name: R_Right
pattern:  // ENT-R_Right-entity
  Gab
  _id: 11711
  characteristic: entity
  _end:
pattern:  // ENT-R_Right-label
  Gab
  _id: 11721
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Right-r_action
  Gab
  _id: 11751
  characteristic: r_action
  cardinality: one
  _end:
pattern:  // ENT-R_Right-r_application
  Gab
  _id: 11761
  characteristic: r_application
  cardinality: one
  _end:
pattern:  // ENT-R_Right-r_software context
  Gab
  _id: 11771
  characteristic: r_software context
  cardinality: one
  _end:
pattern:  // ENT-R_Right-r_use profile
  Gab
  _id: 11781
  characteristic: r_use profile
  cardinality: one
  _end:
pattern:  // ENT-R_Right-r_device profile
  Gab
  _id: 11791
  characteristic: r_device profile
  cardinality: one
  _end:
_end:

ENT // ENT-R_Authorization (121)
_id: 12101
system name: R_Authorization
pattern: 
  Gab
  _id: 12102
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Authorization-entity
  Gab
  _id: 12111
  characteristic: entity
  _end:
pattern:  // ENT-R_Authorization-label
  Gab
  _id: 12121
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Authorization-disabled
  Gab
  _id: 12131
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Authorization-urn
  Gab
  _id: 12141
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Authorization-r_authenticable
  Gab
  _id: 12151
  characteristic: r_authenticable
  cardinality: multi
  _end:
pattern:  // ENT-R_Authorization-r_sub-right
  Gab
  _id: 12161
  characteristic: r_sub-right
  cardinality: multi
//  subobject: 1
  _end:
_end:

ENT // ENT-R_Use Profile (124)
_id: 12401
system name: R_Use Profile
pattern:  // ENT-Use Profile-entity
  Gab
  _id: 12411
  characteristic: entity
  _end:
pattern:  // ENT-R_Use Profile-label
  Gab
  _id: 12421
  characteristic: label
  cardinality: one
  _end:
_end:

ENT // ENT-R_Device Profile (127)
_id: 12701
system name: R_Device Profile
pattern:  // ENT-Device Profile-entity
  Gab
  _id: 12711
  characteristic: entity
  _end:
pattern:  // ENT-R_Device Profile-label
  Gab
  _id: 12721
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Device Profile-r_device
  Gab
  _id: 12751
  characteristic: r_device
  cardinality: multi
  _end:
_end:

ENT // ENT-R_Device (131)
_id: 13101
system name: R_Device
pattern: 
  Gab
  _id: 13102
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_Device-entity
  Gab
  _id: 13111
  characteristic: entity
  _end:
pattern:  // ENT-R_Device-label
  Gab
  _id: 13121
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_Device-disabled
  Gab
  _id: 13131
  characteristic: disabled
  cardinality: one
  _end:
pattern:  // ENT-R_Device-urn
  Gab
  _id: 13141
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Device-r_serial number
  Gab
  _id: 13151
  characteristic: r_serial number
  cardinality: one
  _end:
pattern:  // ENT-R_Device-r_out of order
  Gab
  _id: 13161
  characteristic: r_out of order
  cardinality: one
  _end:
_end:

ENT // ENT-R_License (135)
_id: 13501
system name: R_License
pattern:  // ENT-License-entity
  Gab
  _id: 13511
  characteristic: entity
  _end:
pattern:  // ENT-R_License-label
  Gab
  _id: 13521
  characteristic: label
  cardinality: one
  _end:
pattern:  // ENT-R_License-r_software context
  Gab
  _id: 13571
  characteristic: r_software context
  cardinality: one
  _end:
pattern:  // ENT-R_License-r_use profile
  Gab
  _id: 13581
  characteristic: r_use profile
  cardinality: one
  _end:
pattern:  // ENT-R_License-r_device profile
  Gab
  _id: 13591
  characteristic: r_device profile
  cardinality: one
  _end:
pattern:  // ENT-R_Device-r_license number
  Gab
  _id: 13601
  characteristic: r_license number
  cardinality: one
  _end:
_end:


ENT
_id: 13701
system name: R_AuthenticationPWD
pattern:
  Gab
  _id: 13710
  characteristic: mlogin
  cardinality: one
  mandatory: 1
  r_internal right: 
    R_Internal Right
    _id: 13720
    r_operation: read
    r_who: authentication
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13730
    r_operation: read
    r_operation: modify
    r_operation: add
    r_operation: remove
    r_who: black
    _end:
  _end:
pattern:
  Gab
  _id: 13740
  characteristic: hashed password
  cardinality: one
  r_internal right: 
    R_Internal Right
    _id: 13750
    r_operation: read
    r_who: nobody
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13760
    r_operation: modify
    r_who: logged
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13770
    r_operation: modify
    r_operation: add
    r_operation: remove
    r_who: black
    _end:
  _end:
pattern:
  Gab
  _id: 13780
  characteristic: must change password
  cardinality: one
  _end:
_end:

ENT
_id: 13801
system name: R_AuthenticationPK
pattern:
  Gab
  _id: 13810
  characteristic: mlogin
  cardinality: one
  mandatory: 1
  r_internal right: 
    R_Internal Right
    _id: 13820
    r_operation: read
    r_who: authentication
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13830
    r_operation: read
    r_operation: modify
    r_operation: add
    r_operation: remove
    r_who: black
    _end:
  _end:
pattern:
  Gab
  _id: 13840
  characteristic: public key
  cardinality: one
  _end:
pattern:
  Gab
  _id: 13850
  characteristic: private key
  cardinality: one
  _end:
pattern:
  Gab
  _id: 13860
  characteristic: ciphered private key
  cardinality: one
  _end:
_end:

ENT
_id: 13901
system name: R_AuthenticationLDAP
pattern:
  Gab
  _id: 13910
  characteristic: mlogin
  cardinality: one
  mandatory: 1
  r_internal right: 
    R_Internal Right
    _id: 13920
    r_operation: read
    r_who: authentication
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13930
    r_operation: read
    r_operation: modify
    r_operation: add
    r_operation: remove
    r_who: black
    _end:
  _end:
pattern:
  Gab
  _id: 13940
  characteristic: ldap_dn
  cardinality: one
  mandatory: 1
  r_internal right: 
    R_Internal Right
    _id: 13950
    r_operation: read
    r_who: nobody
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13960
    r_operation: modify
    r_who: logged
    _end:
  r_internal right: 
    R_Internal Right
    _id: 13970
    r_operation: modify
    r_operation: add
    r_operation: remove
    r_who: black
    _end:
  _end:
_end:

ENT
_id: 14001
system name: R_LDAPConfiguration
pattern:
  Gab
  _id: 14010
  characteristic: ldap_url
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14020
  characteristic: ldap_dn
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14030
  characteristic: ldap_password
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14040
  characteristic: ldap_user_base
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14050
  characteristic: ldap_user_filter
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14080
  characteristic: ldap_attribute_map
  cardinality: multi
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14090
  characteristic: ldap_group_map
  cardinality: multi
  mandatory: 1
  _end:
_end:

ENT
_id: 14101
system name: R_LDAPAttribute
pattern:
  Gab
  _id: 14110
  characteristic: ldap_attribute_name
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14120
  characteristic: ldap_to_attribute_name
  cardinality: one
  mandatory: 1
  _end:
_end:

ENT
_id: 14201
system name: R_LDAPGroup
pattern:
  Gab
  _id: 14210
  characteristic: ldap_dn
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 14220
  characteristic: ldap_group
  cardinality: one
  mandatory: 1
  _end:
_end:

Car
_id: 10020
system name: r_authentication
type: SID
domain entity: R_AuthenticationPK
domain entity: R_AuthenticationPWD
domain entity: R_AuthenticationLDAP
_end:

Car
_id: 10022
system name: r_internal right
type: SID
domain entity: R_Internal Right
_end:

Car
_id: 10024
system name: r_operation
type: ID
domain list: the r_operations
_end:

Car
_id: 10028
system name: r_who
type: ID
domain list: the r_who’s
_end:

Car
_id: 10545
system name: r_matricule
type: STR
_end:

Car
_id: 10553
system name: r_parent service
type: ID
domain entity: R_Service
_end:

Car
_id: 10563
system name: r_administrator
type: ID
domain entity: R_Person
_end:

Car
_id: 10573
system name: r_member
type: ID
domain entity: R_Person
_end:

Car
_id: 11123
system name: r_sub-license
type: SID
domain entity: R_License
_end:

Car
_id: 11133
system name: r_software context
type: ID
domain entity: R_Software Context
_end:

Car
_id: 11153
system name: r_sub-use profile
type: SID
domain entity: R_Use Profile
_end:

Car
_id: 11154
system name: r_use profile
type: ID
domain entity: R_Use Profile
_end:

Car
_id: 11173
system name: r_sub-device profile
type: SID
domain entity: R_Device Profile
_end:

Car
_id: 11174
system name: r_device profile
type: ID
domain entity: R_Device Profile
_end:

Car
_id: 11353
system name: r_parent context
type: ID
domain entity: R_Software Context
_end:

Car
_id: 11363
system name: r_license needed
type: INT
_end:

Car
_id: 11753
system name: r_action
type: ID
domain list: the r_actions
_end:

Car
_id: 11763
system name: r_application
type: ID
domain entity: R_Application
_end:

Car
_id: 12153
system name: r_authenticable
type: ID
domain entity: R_Person
domain entity: R_Application // 2 domaines ???
_end:

Car
_id: 12163
system name: r_sub-right
type: SID
domain entity: R_Right
_end:

Car
_id: 12753
system name: r_device
type: ID
domain entity: R_Device
_end:

Car
_id: 13153
system name: r_serial number
type: STR
_end:

Car
_id: 13163
system name: r_out of order
type: BOOL
_end:

Car
_id: 13603
system name: r_license number
type: STR
_end:

Car
_id: 14701
system name: ldap_url
type: STR
_end:

Car
_id: 14702
system name: ldap_dn
type: STR
_end:

Car
_id: 14703
system name: ldap_password
type: STR
_end:

Car
_id: 14704
system name: ldap_user_base
type: STR
_end:

Car
_id: 14705
system name: ldap_user_filter
type: STR
_end:

Car
_id: 14708
system name: ldap_attribute_map
type: SID
domain entity: R_LDAPAttribute
_end:

Car
_id: 14709
system name: ldap_group_map
type: SID
domain entity: R_LDAPGroup
_end:

Car
_id: 14710
system name: ldap_attribute_name
type: STR
_end:

Car
_id: 14711
system name: ldap_to_attribute_name
type: STR
_end:

Car
_id: 14712
system name: ldap_group
type: ID
domain entity: R_Authorization
_end:

Lst
_id: 10025
system name: the r_operations
element entity: R_Element
element: pseudo-read
element: read
element: move
element: modify
element: add
element: remove
element: create-id
element: invalidate-id
_end:

Lst
_id: 10029
system name: the r_who’s
element entity: R_Element
element: nobody
element: public
element: authentication
element: logged
element: black
element: red
element: blue
element: admin
_end:

Lst
_id: 10030
system name: the r_actions
element entity: R_Element
element: r_none
element: r_authenticate
element: r_use
element: r_superuse
_end:

R_Element
_id: 10031
system name: pseudo-read
order: 110
_end:

R_Element
_id: 10033
system name: read
order: 120
_end:

R_Element
_id: 10035
system name: move
order: 130
_end:

R_Element
_id: 10037
system name: modify
order: 140
_end:

R_Element
_id: 10039
system name: add
order: 150
_end:

R_Element
_id: 10041
system name: remove
order: 160
_end:

R_Element
_id: 10051
system name: create-id
order: 200
_end:

R_Element
_id: 10053
system name: invalidate-id
order: 210
_end:

R_Element
_id: 10071
system name: nobody
order: 1010
_end:

R_Element
_id: 10073
system name: public
order: 1020
_end:

R_Element
_id: 10075
system name: authentication
order: 1030
_end:

R_Element
_id: 10077
system name: logged
order: 1040
_end:

R_Element
_id: 10081
system name: black
order: 1110
_end:

R_Element
_id: 10083
system name: red
order: 1120
_end:

R_Element
_id: 10085
system name: blue
order: 1130
_end:

R_Element
_id: 10091
system name: admin
order: 1190
_end:

R_Element
_id: 11900
system name: r_none
order: 0
_end:

R_Element
_id: 11910
system name: r_authenticate
order: 10
_end:

R_Element
_id: 11990
system name: r_use
order: 90
_end:

R_Element
_id: 11999
system name: r_superuse
order: 100
_end:
`;
