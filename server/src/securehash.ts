import * as crypto from 'crypto';

export function randomBytesUnsafe(size = SecureHash.defaultSaltBytes): string {
  let buffer = new Buffer(SecureHash.defaultSaltBytes);
  for (let i = 0; i < buffer.length; i++)
    buffer[i] = Math.floor(Math.random() * 256); // [0-255[ of bad quality random bytes
  return buffer.toString('base64');
}

export function randomBytesSafe(size = SecureHash.defaultSaltBytes): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(size, (err, buf) => {
      if(err) return reject(err);
      resolve(buf.toString('base64'));
    });
  });
}

export namespace SecurePK {
  export let defaultHardness = 2000;

  export function fakeChallenge() {
    return randomBytesUnsafe();
  }

  export function challenge() {
    return randomBytesUnsafe();
  }

  export function isChallengeResponseValid(challenge: string, signature: string, publicKey: string) {
    var verify = crypto.createVerify('RSA-SHA1');
    verify.update(challenge);
    return verify.verify(publicKey, signature, 'base64');
  }

  export async function generatePasswordRequest() : Promise<string> {
    return `${SecureHash.defaultAlgorithm}:${SecurePK.defaultHardness}<${await randomBytesSafe()}>`;
  }
}

export namespace SecureHash {
  export enum Algorithm {
    SHA512_N = 1,
    PBKDF2_512 = 2,
  }
  export let defaultAlgorithm = 1;
  export let defaultHardness = 1000;
  export let defaultSaltBytes = 32;

  export function fakeChallenge() {
    // random bytes, defaultAlgorithm, defaultHardness fast could be detected with statistics to find out if a challenge is a real one or a fake one
    // hidding the login list is good, but not mandatory for security (probably not worth the cost of crypto.randomBytes and the risk of entropy consuption)
    return `${SecureHash.defaultAlgorithm}:${SecureHash.defaultHardness}<${randomBytesUnsafe()}>${SecureHash.defaultAlgorithm}:${SecureHash.defaultHardness}<${randomBytesUnsafe()}>`;
  }

  export async function isValid(password: string, hashedPassword: string) {
    let matches = hashedPassword.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>(.+)$/);
    if (matches) {
      let hp = await computeHash(password, +matches[1], +matches[2], matches[3]);
      return matches[4] === hp;
    }
    return false;
  }

  export async function challenge(hashedPassword: string) {
    let matches = hashedPassword.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>(.+)$/);
    if (matches) {
      let salt = await randomBytesSafe(SecureHash.defaultSaltBytes);
      return `${matches[1]}:${matches[2]}<${matches[3]}>${SecureHash.defaultAlgorithm}:${SecureHash.defaultHardness}<${salt}>`;
    }
    return undefined;
  }

  export async function generatePasswordRequest() : Promise<string> {
    return `${SecureHash.defaultAlgorithm}:${SecureHash.defaultHardness}<${await randomBytesSafe()}>`;
  }

  export async function challengedResult(password: string, challenge: string): Promise<string> {
    let matches = challenge.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>$/);
    if(matches) {
      let hashedPassword = await computeHash(password, +matches[1], +matches[2], matches[3]);
      return await computeHash(hashedPassword, +matches[4], +matches[5], matches[6]);
    }
    return Promise.reject(`bad challenge format`);
  }

  export async function isChallengeResponseValid(challenge: string, response: string, hashedPassword: string): Promise<boolean> {
    let matches = challenge.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>$/);
    if(matches) {
      let expect = await computeHash(hashedPassword, +matches[4], +matches[5], matches[6]);
      return response === expect;
    }
    return Promise.reject(`bad challenge format`);
  }

  export async function hashedPasswordFromRequest(password, hashInfo): Promise<string> {
    var matches = hashInfo.match(/^(\d+):(\d+)<([a-zA-Z0-9+\/=]+)>$/);
    if(matches) {
      let algorithm = +matches[1];
      let hardness = +matches[2];
      let salt = matches[3];
      let hash = await computeHash(password, algorithm, hardness, salt);
      return `${algorithm}:${hardness}<${salt}>${hash}`;
    }
    return Promise.reject(`bad hash info format`);
  }

  export async function hashedPassword(password): Promise<string> {
    let algorithm = defaultAlgorithm;
    let hardness = defaultHardness;
    let salt = await randomBytesSafe(SecureHash.defaultSaltBytes);
    let hash = await computeHash(password, algorithm, hardness, salt);
    return `${algorithm}:${hardness}<${salt}>${hash}`;
  }

  export function computeHash(content, algorithm, hardness, salt): Promise<string> {
    switch(algorithm) {
      case Algorithm.SHA512_N  : return computeAlgorithm_SHA512_N  (content, hardness, salt);
      case Algorithm.PBKDF2_512: return computeAlgorithm_PBKDF2_512(content, hardness, salt);
      default: return Promise.reject('unsupported algorithm');
    }
  }
  function computeAlgorithm_SHA512_N(content, hardness, salt): Promise<string> {
    let hash = crypto.createHash('sha512');
    hash.update(salt);
    hash.update(content);
    let step = hash.digest();
    for(let i = 0; i < hardness ; ++i) {
      hash = crypto.createHash('sha512');
      hash.update(step);
      step = hash.digest();
    }
    return Promise.resolve(step.toString('hex').toUpperCase());
  }
  function computeAlgorithm_PBKDF2_512(content, hardness, salt): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(content, salt, hardness, 512, 'sha512', (err, key) => {
        if (err) reject(err);
        resolve(key.toString('hex').toUpperCase());
      });
    });
  }
}
