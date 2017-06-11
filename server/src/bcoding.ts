enum BCODE {
  NIL = 0x00,
  NSNULL = 0x01,
  ALREADY_REFERENCED_OBJECT = 0x02,
  STRING = 0x03,
  NUMBER = 0x04,
  DECIMAL = 0x05,
  DATA = 0x06,
  SDATE = 0x07,
  DDATE = 0x08,
  COLOR = 0x09,
  COUPLE = 0x0a,
  ARRAY = 0x0b,
  LIST = 0x0d,
  DICT = 0x0e,
  NARRAY = 0x0f,
  SNAPSHOT = 0x10,
  XNETVAR = 0x11,
  FAKEARRAY = 0x12,
  INTERVAL = 0x13,
  INTERVALENTRY = 0x14,
  INTERVALSET = 0x15,
  NEW_CLASS_SNAPSHOT = 0x16,
  KNOWN_CLASS_SNAPSHOT = 0x17,
}

export function decodeData(data: Buffer) {
  if (data.length > 4) {
    let header = data.toString('utf8', 0, 4);
    if (header === "BE01") {

    }
    else {

    }
  }
  throw new Error(`unable to decode bencoded data, header is invalid`);
}

abstract class XBDecoder {
  _classCorrespondances: Map<any, any>;
  _objects: any[] = [];
  _classes: string[] = [];

  decodedRetainedRootObject(): any {
    if (this.nextBytes(16).toString('utf8') != "BE02BE02BE02BE02")
      throw new Error('bad header format in buffer');
    this.nextRetainedObject();
  }
  abstract nextBytes(length: number): Buffer;

  nextChar(): number { return this.nextBytes(1).readInt8(0); }
  nextUnsignedChar(): number { return this.nextBytes(1).readUInt8(0); }

  nextShort(): number { return this.nextBytes(2).readInt16BE(0); }
  nextUnsignedShort(): number { return this.nextBytes(2).readUInt16BE(0); }

  nextInt(): number { return this.nextBytes(4).readInt32BE(0); }
  nextUnsignedInt(): number { return this.nextBytes(4).readUInt32BE(0); }

  nextLongLong(): number { return this.nextBytes(8).readIntBE(0, 8); }
  nextUnsignedLongLong(): number { return this.nextBytes(8).readUIntBE(0, 8); }

  nextFloat(): number { return this.nextBytes(4).readFloatBE(0); }
  nextDouble(): number { return this.nextBytes(8).readDoubleBE(0); }

  nextLength(): number { return this.nextUnsignedInt(); }

  nextRetainedString(): string {
    let len = this.nextUnsignedInt();
    let str = len ? this.nextBytes(len).toString('utf8') : "";
    return str;
  }

  nextRetainedData(): Buffer {
    let len = this.nextUnsignedInt();
    return Buffer.from(this.nextBytes(len));
  }

  referenceObject<T>(anObject: T): T {
    if (anObject)
      this._objects.push(anObject);
    return anObject;
  }

  nextRetainedKey() { return this.nextRetainedObject(); }
  nextCode() { return this.nextUnsignedChar(); }
  nextReference() { return this.nextUnsignedInt(); }

  nextRetainedObject() {
    let code = this.nextCode() & 0x1F;
    switch (code) {
      case BCODE.NIL: return undefined;
      case BCODE.NSNULL: return null;
      case BCODE.ALREADY_REFERENCED_OBJECT: {
        let idx = this.nextReference();
        if (0 <= idx && idx < this._objects.length)
          return this._objects[idx];
        throw new Error(`referenced index ${idx} is out of bounds [0, ${this._objects.length}[`);
      };
      case BCODE.STRING: return this.referenceObject(this.nextRetainedString());
      case BCODE.DATA: return this.referenceObject(this.nextRetainedData());
      case BCODE.SDATE: {
        let date = this.nextUnsignedInt(); // minutes since 1st January 0001
        date -= 1035593280; // minutes since 1st January 1970
        return this.referenceObject(new Date(date * 60 * 1000));
      }
      case BCODE.DDATE: return this.referenceObject(new Date((this.nextDouble() + 978307200) * 1000));
      case BCODE.COLOR: {
        let color = this.nextUnsignedInt();
        let red = ((color >> 24) & 0xff);
        let green = ((color >> 16) & 0xff);
        let blue = ((color >> 8) & 0xff);
        let opacity = (color & 0xff);
        return this.referenceObject({ r: red, g: green, b: blue, a: opacity / 255 });
      }
      case BCODE.FAKEARRAY: {
        return this.referenceObject(new Array(this.nextUnsignedInt()));
      }
      case BCODE.INTERVAL: {
        let p = this.nextUnsignedInt();
        let l = this.nextUnsignedInt();
        return this.referenceObject({ is: "XInterval", range: [p, l] });
      }
      case BCODE.INTERVALSET: {
        let i = this.nextUnsignedInt();
        let ranges: [number, number][] = [];
        while (i-- > 0) {
          let p = this.nextUnsignedInt();
          let l = this.nextUnsignedInt();
          ranges.push([p, l]);
        }
        return this.referenceObject({ is: "XIntervalSet", ranges: ranges });
      }
      case BCODE.INTERVALENTRY: {
        let p = this.nextUnsignedInt();
        let l = this.nextUnsignedInt();
        let weight = this.nextInt();
        let ret = this.referenceObject({ is: "XIntervalEntry", range: [p, l], weight: weight, content: undefined as any });
        ret.content = this.nextRetainedObject();
        return ret;
      }
      case BCODE.NARRAY: {
        let i = this.nextUnsignedInt();
        let ret: number[] = this.referenceObject([]);
        while (i-- > 0) ret.push(this.nextUnsignedInt());
        return ret;
      }
      case BCODE.NUMBER: {
        let type = String.fromCharCode(this.nextUnsignedChar());
        let ret: number | boolean;
        switch (type) {
          case '0': ret = false; break;
          case '1': ret = true; break;
          case 'U': ret = this.nextUnsignedInt(); break;
          case 'c': ret = this.nextChar(); break;
          case 'C': ret = this.nextUnsignedChar(); break;
          case 's': ret = this.nextShort(); break;
          case 'S': ret = this.nextUnsignedShort(); break;
          case 'i': ret = this.nextInt(); break;
          case 'I': ret = this.nextUnsignedInt(); break;
          case 'l': ret = this.nextInt(); break;
          case 'L': ret = this.nextUnsignedInt(); break;
          case 'q': ret = this.nextLongLong(); break;
          case 'Q': ret = this.nextUnsignedLongLong(); break;
          case 'f': ret = this.nextFloat(); break;
          case 'd': ret = this.nextDouble(); break;
          default: throw new Error(`bad number format '${type}'`);
        }
        return this.referenceObject(ret);
      }
      case BCODE.DECIMAL: {
        let exponent = this.nextInt();
        let length = this.nextUnsignedInt();
        let isNegative = this.nextUnsignedInt();
        let isCompact = this.nextUnsignedInt();
        let reserved = this.nextUnsignedInt();
        return this.referenceObject({
          is: "NSDecimal",
          exponent: exponent,
          length: length,
          isNegative: isNegative,
          isCompact: isCompact,
          reserved: reserved,
        });
      }

      // =========== from here, all decoded object must be pre-referenced because they are containers
      // so we don't break, we reference them and we return the value directly
      case BCODE.COUPLE: {
        let ret = this.referenceObject([undefined as any, undefined as any]);
        ret[0] = this.nextRetainedObject();
        ret[1] = this.nextRetainedObject();
        return ret;
      }
      case BCODE.ARRAY:
      case BCODE.LIST: {
        let i = this.nextUnsignedInt();
        let ret: any[] = this.referenceObject([]);
        while (i-- > 0)
          ret.push(this.nextRetainedObject());
        return ret;
      }
      case BCODE.DICT:
      case BCODE.SNAPSHOT: return this.nextRetainedDictionary();
      case BCODE.NEW_CLASS_SNAPSHOT: {
        let className = this.nextRetainedString();
        this._classes.push(className);
        return this.nextRetainedDictionary(className);
      }
      case BCODE.KNOWN_CLASS_SNAPSHOT: {
        let i = this.nextUnsignedInt() - 1;
        return this.nextRetainedDictionary(this._classes[i]);
      }
      case BCODE.XNETVAR: {
        let flags = this.nextUnsignedInt();
        let index = this.nextInt();
        let objectKey = this.nextInt();
        let ret = this.referenceObject({ is: "XVar", flags: flags, index: index, objectKey: objectKey, v: undefined as any, o: undefined as any, g: undefined as any });
        ret.v = this.nextRetainedObject();
        ret.o = this.nextRetainedObject();
        ret.g = this.nextRetainedObject();
        return ret;
      }
    }
    throw new Error(`unknown data type ${code}`);
  }

  nextRetainedDictionary(clazz?: string) {
    let count = this.nextUnsignedInt();
    let ret = this.referenceObject({ is: clazz });
    for (let i = 0; i < count; i++) {
      let key: any = this.nextRetainedKey();
      let value = this.nextRetainedObject();
      ret[key] = value;
    }
    return ret;
  }
}

class XBDataDecoder extends XBDecoder {
  _position = 0;
  constructor(public _data: Buffer) {
    super();
  }
  nextBytes(length: number): Buffer {
    let ret = this._data.slice(this._position, length);
    this._position += length;
    return ret;
  }
}
class XBV1DataDecoder extends XBDataDecoder {
  _keys: any[] = [];
  _useReferences = false;

  decodedRetainedRootObject() {
    let header = this.nextBytes(4).toString('utf8');
    if (header !== 'BE01')
      throw new Error(`bad header format in buffer`);

    let crc = this.nextUnsignedInt();
    let contentLength = this.nextUnsignedInt();
    let idsLength = this.nextUnsignedInt();

    this._useReferences = false;

    // decode identifiers
    {
      let pos = this._position;
      let count = this.nextUnsignedInt();
      this._position += contentLength;
      this._classes.length = count;
      for (let i = 0; i < count; i++) {
        let clsId = this.nextUnsignedChar();
        let className = this.nextRetainedString();
        this._classes[clsId - 1] = className;
      }
      if (this._position != 16 + contentLength + idsLength)
        throw new Error("Wrong keys position in buffer");
      this._position = pos;
    }

    // decode keys
    {
      let pos = this._position;
      let count = this.nextUnsignedInt();
      this._position += contentLength + idsLength;
      this._keys.length = count;
      for (let i = 0; i < count; i++) {
        let keyId = this.nextUnsignedInt();
        let key = this.nextRetainedObject();
        this._keys[keyId - 1] = key;
      }
      this._position = pos;
    }

    this._useReferences = true;

    return this.nextRetainedObject();
  }

  nextCode() {
    // In V1 the code is always followed by the reference
    let code = this.nextUnsignedChar();
    if (this._useReferences && code != BCODE.ALREADY_REFERENCED_OBJECT && code != BCODE.NIL) {
      let ref = this.nextReference(); // consume and check coherence
      if (ref != this._objects.length)
        throw new Error(`Reference isn't correctly incremented (found ${ref}, expecting ${this._objects.length})`);
    }
    return code;
  }

  nextReference() {
    if (!this._useReferences)
      throw new Error("References are disable in this part of the decoding");
    let c = this.nextUnsignedChar();
    if (c & 0x80)
      return c & 0x7f;
    if (c & 0x40) {
      let c1 = this.nextUnsignedChar();
      return ((c & 0x3f) << 8) | c1;
    }
    return this.nextUnsignedInt();
  }

  nextRetainedString() {
    let r = super.nextRetainedString();
    if (r.length && this.nextUnsignedChar() != 0)
      throw new Error("string must end with \\0");
    return r;
  }

  referenceObject<T>(anObject: T): T {
    return this._useReferences ? super.referenceObject(anObject) : anObject;
  }

  nextRetainedKey() {
    let keyId = this.nextUnsignedInt();
    return this._keys[keyId - 1];
  }

  nextRetainedDictionary(clazz?: string) {
    let identifier = this.nextUnsignedChar();
    clazz = identifier > 0 ? this._classes[identifier - 1] : undefined;
    return super.nextRetainedDictionary(clazz);
  }
}


function insertReference<T>(table: Map<T, number>, key: T): { ref: number, inserted: boolean } {
  let ret = table.get(key);
  let inserted = !ret;
  if (!ret) {
    if (table.size + 1 == 0xFFFF)
      throw new Error("too many things to be encoded");
    ret = table.size + 1;
    table.set(key, ret);
  }
  return { ref: ret, inserted: inserted };
}

abstract class XBEncoder {
  static defaultEncoderVersion = 2;

  abstract encodeBytes(bytes: Buffer);

  _classeReferences = new Map<string, number>();
  _objectReferences = new Map<any, number>();
  _objects: any[] = [];

  encodeRootObject(anObject) {
    this.encodeObjectsFromRootObject(anObject);
  }
  encodeString(str: string) {
    this.encodeUnsignedInt(str.length);
    this.encodeBytes(Buffer.from(str));
  }

  encodeLength(length: number) {
    this.encodeUnsignedInt(length);
  }


  encodeChar(c: number) { let b = Buffer.alloc(1); b.writeInt8(c, 0); this.encodeBytes(b); }
  encodeUnsignedChar(c: number) { let b = Buffer.alloc(1); b.writeUInt8(c, 0); this.encodeBytes(b); }

  encodeShort(c: number) { let b = Buffer.alloc(2); b.writeInt16BE(c, 0); this.encodeBytes(b); }
  encodeUnsignedShort(c: number) { let b = Buffer.alloc(2); b.writeUInt16BE(c, 0); this.encodeBytes(b); }

  encodeInt(c: number) { let b = Buffer.alloc(4); b.writeInt32BE(c, 0); this.encodeBytes(b); }
  encodeUnsignedInt(c: number) { let b = Buffer.alloc(4); b.writeUInt32BE(c, 0); this.encodeBytes(b); }

  encodeLongLong(c: number) { let b = Buffer.alloc(8); b.writeIntBE(c, 0, 8); this.encodeBytes(b); }
  encodeUnsignedLongLong(c: number) { let b = Buffer.alloc(8); b.writeUIntBE(c, 0, 8); this.encodeBytes(b); }

  encodeFloat(c: number) { let b = Buffer.alloc(4); b.writeFloatBE(c, 0); this.encodeBytes(b); }
  encodeDouble(c: number) { let b = Buffer.alloc(8); b.writeDoubleBE(c, 0); this.encodeBytes(b); }

  encodeCode(code: number, reference: number) {
    this.encodeUnsignedChar(code);
    if (code == BCODE.ALREADY_REFERENCED_OBJECT) // BEncoder V2 don't waste time encoding useless data
      this.encodeUnsignedInt(reference - 1);
  }

  encodeClassIdentifier(classIdentifier: string, reference: number) {
    if (classIdentifier) {
      let { ref, inserted } = insertReference(this._classeReferences, classIdentifier);
      if (inserted) {
        this.encodeCode(BCODE.NEW_CLASS_SNAPSHOT, reference)
        this.encodeString(classIdentifier);
      }
      else {
        this.encodeCode(BCODE.KNOWN_CLASS_SNAPSHOT, reference)
        this.encodeUnsignedShort(ref);
      }
    }
    else {
      // we coud use BCODE.DICT here
      this.encodeCode(BCODE.SNAPSHOT, reference)
    }
  }

  encodeDictionary(aDictionary: object, reference: number, identifier: string) {
    // parameter identifier and manageReferences are not used anymore in that implementation
    let keys = Object.keys(aDictionary);
    this.encodeClassIdentifier(identifier, reference);
    this.encodeLength(keys.length);
    for (let key of keys) {
      this.encodeKey(key);
      this.encodeObject(aDictionary[key]);
    }
  }

  encodeKey(key: any) {
    this.encodeObject(key);
  }

  encodeReference(anObject: any): number | 0 {
    let { ref, inserted } = insertReference(this._objectReferences, anObject);
    if (inserted)
      this._objects.push(anObject);
    else {
      this.encodeCode(BCODE.ALREADY_REFERENCED_OBJECT, ref);
      ref = 0;
    }
    return ref;
  }

  encodeObject(anObject: any) {
    if (anObject) {
      let reference = this.encodeReference(anObject);
      if (reference) {
        let bCode = anObject.bCode(); // TODO
        let snapshot;
        if (!bCode || ((bCode & 0x1f) == BCODE.SNAPSHOT) || ((bCode & 0x1f) == BCODE.DICT)) {
          if (!(snapshot = anObject.bSnapshot()))
            throw new Error(`cannot encode object of class ${anObject.constructor.name} (bCode=${bCode})`);
        }

        if (snapshot) {
          let classIdentifier = anObject.bIdentifier();
          this.encodeDictionary(snapshot, reference, classIdentifier);
        }
        else {
          this.encodeCode(bCode, reference);
          anObject.encodeWithXBEncoder(this);
        }
      }
    }
    else { this.encodeUnsignedChar(BCODE.NIL); }
  }

  encodeObjectsFromRootObject(anObject: any) {
    this.encodeBytes(Buffer.from("BE02BE02BE02BE02"));
    this.encodeObject(anObject);
  }
}

class XBDataEncoder extends XBEncoder {
  slices: Buffer[] = [];
  length = 0;
  encodeBytes(data: Buffer) {
    this.slices.push(data);
    this.length += data.length;
  }
  data(): Buffer {
    if (this.slices.length === 1)
      return this.slices[0];
    let ret = Buffer.concat(this.slices, this.length);
    this.slices = [ret];
    return ret;
  }
}

class XBV1DataEncoder extends XBDataEncoder {
  _keysReferences = new Map<any, number>();
  _useReferences = true;
  encodeString(str: string) {
    super.encodeString(str);
    if (str) this.encodeChar(0);
  }

  encodeCode(code: number, reference: number) {
    this.encodeUnsignedChar(code);
    if (this._useReferences) {
      reference -= 1;

      // BEncoder V1 is trying to gain a bit a data space but is loosing a LOT by encoding useless things
      // By the way, this is a very limited variant of the common varint encoding
      if (reference < 0x80) {
        // on ne prend qu'un octet pour gerer cette reference
        this.encodeUnsignedChar((reference | 0x80) & 0xff);
      }
      else if (reference < 0x4000) {
        // on ne vas prendre que 2 octets pour gerer cette reference
        this.encodeUnsignedChar(((reference >> 8) & 0x7f) | 0x40);
        this.encodeUnsignedChar((reference & 0xff));
      }
      else {
        // au dela de 16383 on est mauvais car on prend 5 bytes au lieu de 4
        this.encodeUnsignedChar(0);
        this.encodeUnsignedInt(reference);
      }
    }
  }

  encodeClassIdentifier(classIdentifier: string, reference: number) {
    if (classIdentifier) {
      let { ref, inserted } = insertReference(this._classeReferences, classIdentifier);
      if (ref >= 255) {
        throw new Error(`did overflow`);
      }
      this.encodeCode(BCODE.SNAPSHOT, reference);
      this.encodeUnsignedChar(ref);
    }
    else {
      // we could use BCODE.SNAPSHOT but some copies of the old implementation commented out the BCODE.SNAPSHOT decoding path
      this.encodeCode(BCODE.DICT, reference);
      this.encodeUnsignedChar(0);
    }
  }

  encodeKey(key: any) {
    let { ref, inserted } = insertReference(this._keysReferences, key);
    this.encodeUnsignedInt(ref);
  }

  encodeReference(anObject: any) {
    return this._useReferences ? super.encodeReference(anObject) : 1;
  }

  encodeObjectsFromRootObject(anObject: any) {
    let header = Buffer.from("BE01<CRC<CL><IL>");
    this.encodeBytes(header);

    this._useReferences = true;
    this.encodeObject(anObject);
    this._useReferences = false;

    let contentLength = this.length - 16;
    header.writeUInt32BE(contentLength, 8);

    // encode identifiers
    {
      this.encodeUnsignedInt(this._classeReferences.size);
      for (let [k, identifier] of this._classeReferences) {
        this.encodeUnsignedChar(identifier);
        this.encodeString(k);
      }
    }

    let idsLength = this.length - 16 - contentLength;
    header.writeUInt32BE(idsLength, 12);

    // encode keys
    {
      this.encodeUnsignedInt(this._keysReferences.size);
      for (let [k, identifier] of this._keysReferences) {
        this.encodeUnsignedInt(identifier);
        this.encodeObject(k);
      }
    }

    let data = this.data();
    let crc = crc32(data.slice(8, data.length - 8));
    data.writeUInt32BE(crc, 12);
  }
}

const crcTable = (function prepareCRCTable() {
  var c, n, k, ret = <number[]>[];
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    ret[n] = c;
  }
  return ret;
})();

function crc32<T>(bytes: Buffer) {
  let crc = 0 ^ -1;
  let i, length = bytes.length;
  for (i = 0; i < length; i++) {
    crc = ((crc >> 8) & 0x00ffffff) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;;
}
