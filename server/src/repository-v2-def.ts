export const repositoryV2Definition = `

ENT // ENT-ENT
_id: 1
system name: ENT
pattern:
  Gab
  _id: 1002
  characteristic: system name
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 1004
  characteristic: pattern
  cardinality: multi
//  subobject: 1
  _end:
_end:

ENT // ENT-Car
_id: 3
system name: Car
pattern:
  Gab
  _id: 1032
  characteristic: system name
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 1034
  characteristic: type
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 1036
  characteristic: domain entity
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1038
  characteristic: domain list
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1046
  characteristic: unique
  cardinality: one
  _end:
_end:

ENT // ENT-Typ
_id: 5
system name: Typ
pattern:
  Gab
  _id: 1052
  characteristic: system name
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 1054
  characteristic: table
  cardinality: one
  _end:
_end:

ENT // ENT-Gab
_id: 7
system name: Gab
pattern:
  Gab
  _id: 1072
  characteristic: characteristic
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 1074
  characteristic: cardinality
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1076
  characteristic: mandatory
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1089
  characteristic: r_internal right
  cardinality: multi
  _end:
_end:

ENT // ENT-Lst
_id: 15
system name: Lst
pattern:
  Gab
  _id: 1152
  characteristic: system name
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1154
  characteristic: element entity
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1156
  characteristic: element
  cardinality: multi
  _end:
_end:

ENT // ENT-Element
_id: 23
system name: Element
pattern:
  Gab
  _id: 1232
  characteristic: system name
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1234
  characteristic: order
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1236
  characteristic: label
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1238
  characteristic: parameter
  cardinality: multi
//  subobject: 1
  _end:
_end:

ENT // ENT-Parameter
_id: 25
system name: Parameter
pattern:
  Gab
  _id: 1252
  characteristic: entity
  _end:
pattern:
  Gab
  _id: 1254
  characteristic: label
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1256
  characteristic: string
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1260
  characteristic: int
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1262
  characteristic: bool
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1266
  characteristic: gmt
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1268
  characteristic: date
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1270
  characteristic: date & time
  cardinality: one
  _end:
pattern:
  Gab
  _id: 1272
  characteristic: duration
  cardinality: one
  _end:
_end:

Car
_id: 101
system name: entity
type: ID
domain entity: ENT
_end:

Car
_id: 102
system name: system name
type: STR
unique: 1
_end:

Car
_id: 103
system name: characteristic
type: ID
domain entity: Car
_end:

Car
_id: 105
system name: type
type: ID
domain entity: Typ
_end:

Car
_id: 106
system name: table
type: STR
_end:

Car
_id: 107
system name: pattern
type: SID
domain entity: Gab
_end:

Car
_id: 109
system name: domain entity
type: ID
domain entity: ENT
_end:

Car
_id: 110
system name: domain list
type: ID
domain entity: Lst
_end:

Car
_id: 115
system name: cardinality
type: ID
domain list: the cardinalities
_end:

Car
_id: 153
system name: element entity
type: ID
domain entity: ENT
_end:

Car
_id: 155
system name: element
type: ID
_end:

Car
_id: 231
system name: order
type: INT
_end:

Car
_id: 232
system name: label
type: STR
_end:

Car
_id: 241
system name: disabled
type: BOOL
_end:

Car
_id: 243
system name: mandatory
type: BOOL
_end:

Car
_id: 245
system name: unique
type: BOOL
_end:

Car
_id: 401
system name: next oid
type: INT
_end:

Car
_id: 501
system name: parameter
type: SID
domain entity: Parameter
_end:

Car
_id: 511
system name: string
type: STR
_end:

Car
_id: 521
system name: int
type: INT
_end:

Car
_id: 523
system name: bool
type: BOOL
_end:

Car
_id: 531
system name: gmt
type: GMT
_end:

Car
_id: 533
system name: date
type: DAT
_end:

Car
_id: 535
system name: date & time
type: DTM
_end:

Car
_id: 537
system name: duration
type: DUR
_end:

Typ
_id: 2001
system name: ID
_end:

Typ
_id: 2003
system name: SID
table: ID
_end:

Typ
_id: 2021
system name: STR
_end:

Typ
_id: 2041
system name: INT
_end:

Typ
_id: 2043
system name: BOOL
table: INT
_end:

Typ
_id: 2051
system name: GMT
table: INT
_end:

Typ
_id: 2053
system name: DAT
table: INT
_end:

Typ
_id: 2055
system name: DTM
table: INT
_end:

Typ
_id: 2057
system name: DUR
table: INT
_end:

Lst
_id: 2101
system name: the cardinalities
element entity: Element
element: one
element: multi
_end:

Element
_id: 2111
system name: one
order: 20
_end:

Element
_id: 2121
system name: multi
order: 40
_end:

Element
_id: 3000
system name: non
order: 0
_end:

Element
_id: 3025
system name: standby
order: 25
_end:

Element
_id: 3100
system name: oui
order: 100
_end:

Element
_id: 9000
system name: database
next oid: 500001
parameter:
  Parameter
  _id: 9010
  label: obi version
  int: 1
  _end:
parameter:
  Parameter
  _id: 9020
  label: repository version
  int: 2
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
_id: 316
system name: mail
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
  _id: 10014
  characteristic: version
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
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 10117
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
    _end:
  _end:
pattern:  // ENT-R_Person-disabled
  Gab
  _id: 10131
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10132
    r_operation: read
    r_operation: create
    r_operation: update
    r_who: person_admin
    _end:
  _end:
pattern:  // ENT-R_Person-urn
  Gab
  _id: 10141
  characteristic: urn
  cardinality: one
  mandatory: 1
  r_internal right:
    R_Internal Right
    _id: 10145
    r_operation: read
    r_operation: create
    r_who: person_admin
    _end:
  _end:
pattern:  // ENT-R_Person-login
  Gab
  _id: 10151
  characteristic: login
  cardinality: multi
  _end:
pattern:  // ENT-R_Person-authentication
  Gab
  _id: 10142
  characteristic: r_authentication
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10144
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
    _end:
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
    _end:
  _end:
pattern:  // ENT-R_Person-middle name
  Gab
  _id: 10331
  characteristic: middle name
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10332
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 10333
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
    _id: 10352
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 10353
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
    _end:
  _end:
pattern:  // ENT-R_Person-mail
  Gab
  _id: 10361
  characteristic: mail
  mandatory: 1
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10362
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 10363
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
  r_internal right:
    R_Internal Right
    _id: 10512
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10513
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-label
  Gab
  _id: 10521
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10522
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10523
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-disabled
  Gab
  _id: 10531
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10532
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10533
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-urn
  Gab
  _id: 10541
  characteristic: urn
  cardinality: one
  mandatory: 1
  r_internal right:
    R_Internal Right
    _id: 10542
    r_operation: read
    r_who: member
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-r_parent service
  Gab
  _id: 10551
  characteristic: r_parent service
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10558
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10559
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-r_administrator
  Gab
  _id: 10561
  characteristic: r_administrator
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10562
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10563
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Service-r_member
  Gab
  _id: 10571
  characteristic: r_member
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10572
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10574
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    r_who: person_admin
    _end:
  _end:
_end:

ENT // ENT-R_AppTree (106)
_id: 10601
system name: R_AppTree
pattern:
  Gab
  _id: 10602
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_AppTree-entity
  Gab
  _id: 10611
  characteristic: entity
  r_internal right:
    R_Internal Right
    _id: 10612
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10613
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-label
  Gab
  _id: 10621
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10622
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10623
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-disabled
  Gab
  _id: 10631
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10632
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10633
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-urn
  Gab
  _id: 10641
  characteristic: urn
  cardinality: one
  mandatory: 1
  r_internal right:
    R_Internal Right
    _id: 10642
    r_operation: read
    r_who: member
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-r_parent apptree
  Gab
  _id: 10651
  characteristic: r_parent apptree
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10652
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10653
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-r_administrator
  Gab
  _id: 10661
  characteristic: r_administrator
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10662
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10663
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_AppTree-r_member
  Gab
  _id: 10671
  characteristic: r_application
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10672
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10673
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    r_who: app_admin
    _end:
  _end:
_end:

ENT // ENT-R_DeviceTree (107)
_id: 10701
system name: R_DeviceTree
pattern:
  Gab
  _id: 10702
  characteristic: version
  cardinality: one
  _end:
pattern:  // ENT-R_DeviceTree-entity
  Gab
  _id: 10711
  characteristic: entity
  r_internal right:
    R_Internal Right
    _id: 10712
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10713
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-label
  Gab
  _id: 10721
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10722
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10723
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-disabled
  Gab
  _id: 10731
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10732
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10733
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-urn
  Gab
  _id: 10741
  characteristic: urn
  cardinality: one
  mandatory: 1
  r_internal right:
    R_Internal Right
    _id: 10742
    r_operation: read
    r_who: member
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-r_parent devicetree
  Gab
  _id: 10751
  characteristic: r_parent devicetree
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10752
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10753
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-r_administrator
  Gab
  _id: 10761
  characteristic: r_administrator
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10762
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10763
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_DeviceTree-r_device
  Gab
  _id: 10771
  characteristic: r_device
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10772
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10773
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    r_who: device_admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 10912
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10913
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-label
  Gab
  _id: 10921
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10922
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10923
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-disabled
  Gab
  _id: 10931
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 10932
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10933
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-urn
  Gab
  _id: 10941
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
pattern:  // ENT-R_Application-login
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
  r_internal right:
    R_Internal Right
    _id: 10945
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-parameter
  Gab
  _id: 11111
  characteristic: parameter
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 10955
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 10956
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    r_who: admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 11132
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11134
    r_operation: create
    r_operation: update
    r_operation: delete
//  r_who: app_admin ?
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-r_sub-use profile
  Gab
  _id: 11151
  characteristic: r_sub-use profile
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 11152
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11155
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Application-r_sub-device profile
  Gab
  _id: 11171
  characteristic: r_sub-device profile
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 11172
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11175
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    r_who: admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 11313
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11312
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Software Context-label
  Gab
  _id: 11321
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11323
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11322
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Software Context-disabled
  Gab
  _id: 11331
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11333
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11332
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Software Context-urn
  Gab
  _id: 11341
  characteristic: urn
  cardinality: one
  mandatory: 1
  r_internal right:
    R_Internal Right
    _id: 11343
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11342
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Software Context-r_parent context
  Gab
  _id: 11351
  characteristic: r_parent context
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11354
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11352
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Software Context-r_license needed
  Gab
  _id: 11361
  characteristic: r_license needed
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11365
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 11362
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
_end:

ENT // ENT-R_Right (117)
_id: 11701
system name: R_Right
pattern:  // ENT-R_Right-entity
  Gab
  _id: 11711
  characteristic: entity
  r_internal right:
    R_Internal Right
    _id: 12112
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11713
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-label
  Gab
  _id: 11721
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11722
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11723
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-r_action
  Gab
  _id: 11751
  characteristic: r_action
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11752
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11754
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-r_application
  Gab
  _id: 11761
  characteristic: r_application
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11762
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11764
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-r_software context
  Gab
  _id: 11771
  characteristic: r_software context
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11772
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11773
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-r_use profile
  Gab
  _id: 11781
  characteristic: r_use profile
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11782
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11783
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Right-r_device profile
  Gab
  _id: 11791
  characteristic: r_device profile
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 11792
    r_operation: read
    r_who: member
    _end:
  r_internal right:
    R_Internal Right
    _id: 11793
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 12113
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Authorization-label
  Gab
  _id: 12121
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 12123
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Authorization-disabled
  Gab
  _id: 12131
  characteristic: disabled
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 12133
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 12154
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
pattern:  // ENT-R_Authorization-r_sub-right
  Gab
  _id: 12161
  characteristic: r_sub-right
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 12164
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: auth_admin
    r_who: admin
    _end:
  _end:
_end:

ENT // ENT-R_Use Profile (124)
_id: 12401
system name: R_Use Profile
pattern:  // ENT-Use Profile-entity
  Gab
  _id: 12411
  characteristic: entity
  r_internal right:
    R_Internal Right
    _id: 12412
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    _end:
  _end:
pattern:  // ENT-R_Use Profile-label
  Gab
  _id: 12421
  characteristic: label
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 12422
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 12722
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    _end:
  _end:
pattern:  // ENT-R_Device Profile-r_device
  Gab
  _id: 12751
  characteristic: r_device
  cardinality: multi
  r_internal right:
    R_Internal Right
    _id: 12752
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: app_admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 13112
    r_operation: read
    r_who: public
    _end:
  r_internal right:
    R_Internal Right
    _id: 13113
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: device_admin
    _end:
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
  r_internal right:
    R_Internal Right
    _id: 13152
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: device_admin
    _end:
  _end:
pattern:  // ENT-R_Device-r_out of order
  Gab
  _id: 13161
  characteristic: r_out of order
  cardinality: one
  r_internal right:
    R_Internal Right
    _id: 13154
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: device_admin
    _end:
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: logged
    _end:
  r_internal right:
    R_Internal Right
    _id: 13770
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
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
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: logged
    _end:
  r_internal right:
    R_Internal Right
    _id: 13970
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: person_admin
    _end:
  _end:
_end:

ENT
_id: 14001
system name: R_LDAPConfiguration
pattern:
  Gab
  _id: 14002
  characteristic: entity
  r_internal right:
    R_Internal Right
    _id: 14003
    r_operation: read
    r_operation: create
    r_operation: update
    r_operation: delete
    r_who: admin
    _end:
  _end:
pattern:
  Gab
  _id: 14004
  characteristic: version
  cardinality: one
  _end:
pattern:
  Gab
  _id: 14008
  characteristic: urn
  cardinality: one
  mandatory: 1
  _end:
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


ENT
_id: 15001
system name: R_AuthenticationTicket
pattern:
  Gab
  _id: 15010
  characteristic: r_authenticable
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 15020
  characteristic: r_token
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 15030
  characteristic: creation_date
  cardinality: one
  mandatory: 1
  _end:
pattern:
  Gab
  _id: 15040
  characteristic: disabled
  cardinality: one
  _end:
pattern:
  Gab
  _id: 15050
  characteristic: r_device
  cardinality: one
  mandatory: 1
  _end:
_end:

Car
_id: 10026
system name: r_token
type: STR
_end:

Car
_id: 10040
system name: creation_date
type: DAT
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
_id: 10554
system name: r_parent apptree
type: ID
domain entity: R_AppTree
_end:

Car
_id: 10555
system name: r_parent devicetree
type: ID
domain entity: R_DeviceTree
_end:

Car
_id: 10564
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
element: read
element: create
element: update
element: delete
_end:

Lst
_id: 10029
system name: the r_who’s
element entity: R_Element
element: public
element: member
element: person_admin
element: app_admin
element: device_admin
element: auth_admin
element: admin
element: nobody
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
system name: create
order: 130
_end:

R_Element
_id: 10037
system name: update
order: 140
_end:

R_Element
_id: 10039
system name: delete
order: 150
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
_id: 10074
system name: member
order: 1025
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
system name: person_admin
order: 1110
_end:

R_Element
_id: 10082
system name: auth_admin
order: 1115
_end:

R_Element
_id: 10083
system name: app_admin
order: 1120
_end:

R_Element
_id: 10085
system name: device_admin
order: 1130
_end:

R_Element
_id: 10091
system name: admin
order: 1190
_end:

R_Element
_id: 11900
version: 1
system name: r_none
order: 0
_end:

R_Element
_id: 11910
version: 1
system name: r_authenticate
order: 10
_end:

R_Element
_id: 11990
version: 1
system name: r_use
order: 90
_end:

R_Element
_id: 11999
version: 1
system name: r_superuse
order: 100
_end:

`;
