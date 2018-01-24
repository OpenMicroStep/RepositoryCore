import {VersionedObjectConstructor, VersionedObjectManager, VersionedObject, PathReporter, Validate as V} from '@openmicrostep/aspects';
import * as interfaces from '../../generated/aspects.interfaces';
export * from '../../generated/aspects.interfaces';

const EMAIL_REGEX = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const PEM_ENCODED_REGEX = /^-----BEGIN PUBLIC KEY-----[a-zA-Z0-9\/+= \n]+-----END PUBLIC KEY-----[ \n]*$/;
export const validators = {
  "str_len_gt_0": (at: PathReporter, value: string | undefined) => {
    if (!value || value.length === 0)
      at.diagnostic({ is: "error", msg: "must not be an empty string" });
  },
  "exists": (at: PathReporter, value: any | undefined) => {
    if (!value)
      at.diagnostic({ is: "error", msg: "must exists" });
  },
  "mail": (at: PathReporter, value: string | undefined) => {
    if (value && !EMAIL_REGEX.test(value))
      at.diagnostic({ is: "error", msg: "must be an email" });
  },
  "pem_encoded_pubkey": (at: PathReporter, value: string | undefined) => {
    if (!value || !PEM_ENCODED_REGEX.test(value))
      at.diagnostic({ is: "error", msg: "must be an email" });
  },
}
