function callListeners(target,key,value){
	if (key in target._callbacks) {
        target._callbacks[key].forEach(callback => callback(value));
        delete target._callbacks[key];
      }
}
function lazySet(object, property, someExpensiveComputation) {
  Object.defineProperty(object, property, {
    get() {
      const actualData = someExpensiveComputation();
	  //callListeners(this,property,actualData);
      Object.defineProperty(this, property, {
        value: actualData,
        writable: true,
        configurable: true
      });

      return actualData;
    },
    configurable: true,
    enumerable: true
  });
}



var groupby = require("lodash.groupby")
var _get = require("lodash.get")
var _set = require("lodash.set")
var ffi = require('ffi-napi');
var ref = require('ref-napi');
var Struct = require('ref-struct-di')(ref)
var Union = require('ref-union-di')(ref);
var ArrayB = require('ref-array-di')(ref);
var assert = require('node:assert');
var path = require('node:path');
var fs = require('node:fs');
var util = require('node:util');


//Should this be optional or something?
Buffer.prototype._toJSON=Buffer.prototype.toJSON
Buffer.prototype.toJSON=function toJSON(){
	var obj=this._toJSON();
	var size=this?.type?.size;
	var indirection=this.type.indirection;
	var type=this?.type?.name;
	var address=this.address();
	return {...obj,size,indirection,type,address};
}
const isObject = (input) => (
	null !== input &&  typeof input === 'object' &&     Object.getPrototypeOf(input).isPrototypeOf(Object)
)

/**
 * @param   {object}    obj
 * @param   {string}    path
 * @param   {any}       value
 */

const setByString = (obj, path, value) => {
	const pList = Array.isArray(path) ? path : path.split('.');
	const len = pList.length;
	// changes second last key to {}
	for (let i = 0; i < len - 1; i++) {
		const elem = pList[i];
		if (!obj[elem] || !isObject(obj[elem])) {
			obj[elem] = {};
		}
		obj = obj[elem];
	}

	// set value to second last key
	obj[pList[len - 1]] = value;
};
function flattenObject(o, prefix = '', result = {}, keepNull = true) {
	if (typeof o!=="object" || (keepNull && o==null)) {
		result[prefix] = o;
		return result;
	}
	for (let i in o) {
		let pref = prefix;
		if (Array.isArray(o)) {
			pref = pref + `[${i}]`;
		} else {
			if (Object.keys(prefix).length === 0) {
				pref = i;
			} else {
				pref = prefix + '.' + i;
			}
		}
		flattenObject(o[i], pref, result, keepNull);
	}
	return result;
}
function StructType(){
	function toJSONrec(){
		var that=this;
		while(that.toJSON==toJSONrec){//find previous JSON definition :)
			that=that.__proto__;
		}
		//assert(this.__proto__.__proto__.toJSON!=toJSONrec,"this shouldn't be the same...")
		return Object.entries(that.toJSON.call(this)).map(([k,v])=>[k,(v.toJSON)?v.toJSON():v])
	}
	//if(b)b.packed=true; else b={packed:true};
	var obj=Struct(...arguments);
	var someproto=Object.create(Object.getPrototypeOf(obj.prototype))
	someproto.toJSON=toJSONrec;
	someproto.fromObject=function(d){
		//var l=this;
		Object.entries(flattenObject(d)).forEach(([k,v])=>setByString(this,k,v))
	}
	Object.setPrototypeOf(obj.prototype,someproto)
	obj.defineProperties=(_=>Object.entries(_).forEach(([k,v])=>obj.defineProperty(k,v)));
	return obj;
}
function ArrayType(){
	function toJSONrec(){
		return this._toJSON().map(_=>_.toJSON?_.toJSON():_);
	}
	var obj=ArrayB(...arguments);
	obj.prototype._toJSON=obj.prototype.toJSON
	obj.prototype.toJSON=toJSONrec;
	return obj;
}
var wchar_size = process.platform == 'win32' ? 2 : 4;
ref.types.wchar_t = ref.types.ushort;
ref.types.WCString = Object.create(ref.types.CString)
ref.types.WCString.get = function get (buf, offset) {
	var _buf = buf.readPointer(offset)
	if (_buf.isNull()) {
		return null
	}
	var stringBuf = _buf.reinterpretUntilZeros(wchar_size)
	return stringBuf.toString('utf16le') // TODO: decode UTF-32 on Unix
};
ref.types.WCString.set = function set (buf, offset, val) {
	// TODO: better UTF-16 and UTF-32 encoding
	var _buf = new Buffer((val.length + 1) * wchar_size)
	_buf.fill(0)
	var l = 0
	for (var i = wchar_size - 1; i < _buf.length; i += wchar_size) {
		_buf[i] = val.charCodeAt(l++)
	}
	return buf.writePointer(_buf, offset);
};
var ntvhlprfun=({size,indirection,alignment,ffi_type})=>({size,indirection,alignment,ffi_type});
var nativehelper = new Proxy({
    Byte: {
    typeobj: (ntvhlprfun)(ref.types.uint8),
    writebuf: "writeUint8",
    readbuf: "readUint8",
  },SByte: {
    typeobj: (ntvhlprfun)(ref.types.int8),
    writebuf: "writeInt8",
    readbuf: "readInt8",
  },Single: {
    typeobj: (ntvhlprfun)(ref.types.float),
    writebuf: "writeFloatLE",
    readbuf: "readFloatLE",
  },Boolean: {
    typeobj: (ntvhlprfun)(ref.types.uint8),
    writebuf: "writeUint8",
    readbuf: "readUint8",
  }
}, {
  get: (target, prop) => {
    if (prop in target) {
      return target[prop];
    } else {
      const propLowerCase = prop.toLowerCase();
      const typeobjExists = propLowerCase in ref.types;

      if (typeobjExists) {
        const typeobj = (ntvhlprfun)(ref.types[propLowerCase]);

        const writebuf = `write${prop}LE`;
        const readbuf = `read${prop}LE`;

        if (Buffer.prototype[writebuf] && Buffer.prototype[readbuf]) {
          target[prop] = { typeobj, writebuf, readbuf };
          return target[prop];
        }
      }
    }
  },
});

function longeSTring(a, b) {
  return a.length > b.length ? a : b;
}
//var eventEmitter = new events.EventEmitter();
var wintypes = new Proxy({}, {
	 defineProperty: function (target, key, descriptor) {
    if ("value" in descriptor) {
      if (!target.hasOwnProperty("_callbacks")) {
        target._callbacks = {};
      }
	   callListeners(target,key,descriptor.value)
    }
    return Object.defineProperty(target, key, descriptor);
  },
  set(target, property, value, receiver) {
    if (!(property in target)) {
      if (!target.hasOwnProperty("_callbacks")) {
        target._callbacks = {};
      }
	   callListeners(target,property,value);
    }
    Reflect.set(target, property, value, receiver);
    return true;
  },
  get: function(target, name) {
    var arr, lname;
    if (name in target) return target[name];
    else if (name.toLowerCase() in ref.types)
      return target[name] = ref.types[name.toLowerCase()]
    else if (name in nativehelper){
	  return target[name] = nativehelper[name].typeobj;
	}
    else if ((arr = name.match(/^[LNS]?P(C?(U?(N?(Z?(Z?(.*)|.*)|.*)|.*)|.*)|.*)/)?.slice(1).filter(_ => this.has(target, _)))?.length | 0 > 0) {
      if ((lname = arr.reduce(longeSTring)) == "STR") {
        return target[name] = ref.types.CString;
      } else
        return target[name] = ref.refType(this.get(target, lname));
    } //else if (name[0] == "H") return target[name] = ref.types.uint64;
  },
  has: function(target, name) {
    if (name in target ||
      name.toLowerCase() in ref.types ||
      name.match(/^[LNS]?P(C?(U?(N?(Z?(Z?(.*)|.*)|.*)|.*)|.*)|.*)/)?.slice(1).filter(_ => this.has(target, _))?.length | 0 > 0 ||
      //name[0] == "H" ||
	  name == "STR") return true;
    else return false;
  }
});

wintypes.attr = function (property) {
  return new Promise((resolve, reject) => {
    if (property in wintypes) {
      resolve(wintypes[property]);
    } else {
      if (!wintypes._callbacks) {
        wintypes._callbacks = {};
      }
      if (!wintypes._callbacks[property]) {
        wintypes._callbacks[property] = [];
      }
      wintypes._callbacks[property].push(value => {
        resolve(value);
      });
    }
  });
};

function methodProxy(obj1, property1, path) {
  Object.defineProperty(obj1, property1, {
    get() {
      //console.log("just so I can get this right, this is ",this,path)
      return _get(this, path);
    },
    set(value) {
      _set(this, path, value);
    },
    configurable: true,
    enumerable: true
  });
}
var CFTypeConstructor = function(rtype, args) {
  return {
    size: ref.sizeof.pointer,
    alignment: ref.alignof.pointer,
    rtype,
    name: `(${args.map(a=>a.name).join(',')}) -> ${rtype.name}`,
    ffi_type: ffi.FFI_TYPES.pointer,
    args,
    indirection: 1,
    get: function get(buf, offset) {
      const _buf = ref.readPointer(buf, offset)
      if (ref.isNull(_buf)) {
        return null;
      }
      return ffi.ForeignFunction(_buf, rtype, args);
    },
    set: function set(buf, offset, val) {
      let _buf
      if (Buffer.isBuffer(val)) {
        _buf = val;
      } else if ("_buf" in val) {
        _buf = val._buf;
      } else {
        // assume fn
		assert(typeof val=="function","val is not a function.")
        _buf = ffi.Callback(rtype, args, val);
        val._buf = _buf; //make lifetime valid as long as val is valid.
      }
      return ref.writePointer(buf, offset, _buf);
    }
  }
}
wintypes.IntPtr = ref.types[`int${ref.sizeof.pointer*8}`];
wintypes.UIntPtr = ref.types[`uint${ref.sizeof.pointer*8}`];

function objApiToJSApi(obj) {
  if (obj.Kind == "Struct") {
    return objApiStructToJSStruct(obj);
  } else if (obj.Kind == "Enum") {
    return objApiEnumToJSEnum(obj);
  } else if (obj.Kind == "Union") {
    return objApiUnionToJSUnion(obj);
  } else if (obj.Kind == "Array") {
    return objApiArrayToJSArray(obj);
  }
}

function getNestedTypes(objApi) {
  return Object.fromEntries(Object.entries((objApi.NestedTypes?.length) ? groupby(objApi.NestedTypes.map(objApiToJSApi), _ => ( /*console.log("this will break",_),*/ _.Name)) : {}).map(([a, b]) => (assert(b.length == 1), [a, b[0]])));

}

function getFields(someType) {
  return Object.keys(someType.fields).flatMap(a => (someType.anonfields?.includes(a)) ? getFields(someType.fields[a].type) : a)
}


function objApiStructToJSStruct(objApi) {
  var nestedTypes = getNestedTypes(objApi);
  console.log(`STRUCT nestedTypes: `, objApi.Fields.map(a => [a.Name, a.Type.Name]).filter(([n, b]) => /Anonymous.*?_e__/.test(b)).map(([a, b]) => [a, Object.keys(nestedTypes[b].fields)]));
  var obj = StructType(Object.fromEntries(objApi.Fields.map(_ => [_.Name, convertApiTypeToJSType(_.Type, nestedTypes)])));
  obj["anonfields"] = objApi.Fields.map(a => [a.Name, a.Type.Name]).filter(([n, b]) => /Anonymous.*?_e__/.test(b)).map(([a, b]) => {
    console.log(getFields(nestedTypes[b]), a);
    var attrs = getFields(nestedTypes[b]);
    attrs.forEach(name => {
      methodProxy(obj.prototype, name, `${a}.${name}`)
    })
    return a
  });
  obj.Name = objApi.Name;
  return obj
}

function convertApiTypeToJSType(type, nestedTypes) {
  if (type.Kind == "Native") {
    if (!wintypes[type.Name]) {
      throw new Error(`${type.Name} not found in wintypes`);
    } else {
      return wintypes[type.Name];
    }
  } else if (type.Kind == "ApiRef") {
    if (type.Parents.length == 0 && (!nestedTypes || (nestedTypes && !nestedTypes[type.Name]))) {
      if (!wintypes[type.Name]) {
        throw new Error(`${type.Name} not found in wintypes`);
      } else {
        return wintypes[type.Name];
      }
    } else
    if (nestedTypes) {
      if (!nestedTypes[type.Name]) {
        throw new Error(`${type.Name} not found in nestedTypes: ${Object.keys(nestedTypes)}`);
      } else {
        return nestedTypes[type.Name];
      }
    } else {

    }
  } else if (type.Kind == "Array") {
    return ArrayType(convertApiTypeToJSType(type.Child, nestedTypes), type.Shape.Size);
  } else if (type.Kind == "PointerTo") {
    return ref.refType(convertApiTypeToJSType(type.Child, nestedTypes));
  } else if (type.Kind == "LPArray") {
    //For C there is no difference, but for us there is, we can think about how to handle this later.
    return ref.refType(convertApiTypeToJSType(type.Child, nestedTypes));
  } else {
    throw new Error("type " + type.Kind + " not found")
  }
}

function objApiEnumToJSEnum(objApi) {
  var nestedTypes = getNestedTypes(objApi);
  return "todoEnum"
}

function objApiUnionToJSUnion(objApi) {
  var nestedTypes = getNestedTypes(objApi);
  console.log(`UNION nestedTypes: `, objApi.Fields.map(a => [a.Name, a.Type.Name]).filter(([n, b]) => /Anonymous.*?_e__/.test(b)).map(([a, b]) => [a, Object.keys(nestedTypes[b].fields)]));
  var obj = new Union(Object.fromEntries(objApi.Fields.map(_ => [_.Name, convertApiTypeToJSType(_.Type, nestedTypes)])));
  obj["anonfields"] = objApi.Fields.map(a => [a.Name, a.Type.Name]).filter(([n, b]) => /Anonymous.*?_e__/.test(b)).map(([a, b]) => {
    console.log(getFields(nestedTypes[b]), a);
    var attrs = getFields(nestedTypes[b]);
    attrs.forEach(name => {
      methodProxy(obj.prototype, name, `${a}.${name}`)
    })
    return a
  });
  obj.Name = objApi.Name
  return obj
}

function objApiArrayToJSArray(objApi) {
  var nestedTypes = getNestedTypes(objApi);
  return "todoArray"
}

function fun2Type(E) {
  var r = CFTypeConstructor(convertApiTypeToJSType(E.ReturnType), E.Params.map(a => convertApiTypeToJSType(a.Type)));
  //assert(E.ReturnAttrs.length == 0); These are C# attributes, 
  if (E.Platform !== null) {
    console.log(`Loading function ${E.Name} with Platform ${E.Platform}`)
  }
  r.SetLastError = E.SetLastError;
  r.Params = E.Params;
  return r;

}
function convertWinapiInterface2ffi(interfaceWinApiJson){
    //an interface is just a struct :o
var sumInterface=StructType();
    //Create type wrapper around struct
    function InterfaceStruct(strobject) {
    //is structObj a StructType or an Object
    if (strobject instanceof sumInterface) {
      this._$struct = strobject;
    } else {
      //whether buffer or Object should still work.
      this._$struct = new sumInterface(strobject);
      this._$struct['ref.buffer'].type=InterfaceStruct;
    }
        //This is definining how to call the methods from the JavaScript and not from the FFI api
    /*interfaceWinApiJson.Methods.map(_=>_.Name).forEach((k) =>
      this[k] = function(...args) {
        return this._$struct[k]?.(this.ref(), ...args);
      }
    )*/
    return this;
  }
  InterfaceStruct.prototype.ref = function(...args) {
    return this._$struct.ref(...args)
  }
Object.setPrototypeOf(InterfaceStruct, sumInterface);
    InterfaceStruct.get = function(buf, offset) {
        assert(offset==0,"offset is not zero, what do?");
    return new this(buf);
  }
    InterfaceStruct.GUID=new wintypes.GUID(Buffer.from(interfaceWinApiJson.Guid.split('-').join(''), "hex"));
    InterfaceStruct.methods=[];
    if(interfaceWinApiJson.Interface){
        assert(interfaceWinApiJson.Interface.Kind=='ApiRef',"Kind!=ApiRef")
        assert(interfaceWinApiJson.Interface.TargetKind== 'Com',"TargetKind!=Com")
        sumInterface.defineProperty("_anonymous__$parent",wintypes[interfaceWinApiJson.Interface.Name]);
        wintypes[interfaceWinApiJson.Interface.Name].methods.forEach(prop=>methodProxy(InterfaceStruct.prototype, prop, `_anonymous__$parent.${prop}`))
        InterfaceStruct.methods=wintypes[interfaceWinApiJson.Interface.Name].methods.slice();
        
    }
var methods=interfaceWinApiJson.Methods.map(_=>[_.Name,method2Type(InterfaceStruct,_)]);
    methods.forEach(_=>sumInterface.defineProperty(..._));
    InterfaceStruct.methods=[...InterfaceStruct.methods,...methods.map(([n,_])=>n)];
    return InterfaceStruct;
}
function method2Type(InterfaceStruct,E) {
  var r = CFTypeConstructor(convertApiTypeToJSType(E.ReturnType), [ref.refType(InterfaceStruct),...E.Params.map(a => convertApiTypeToJSType(a.Type))]);
  assert(E.ReturnAttrs.length == 0);
  if (E.Platform !== null) {
    console.log(`Loading function ${E.Name} with Platform ${E.Platform}`)
  }
  r.SetLastError = E.SetLastError;
  r.Params = E.Params;
  return r;

}
function appendDLL(filePath) {
  const fileExtension = path.extname(filePath);
  if (fileExtension === "") {
    return filePath + ".dll";
  } else {
    return filePath;
  }
}

function getDll(dllname) {
  var dllstr = appendDLL(dllname);
  if (dll[dllname]) return dll[dllname];
  dll[dllname] = ffi.DynamicLibrary(dllstr, ffi.DynamicLibrary.FLAGS.RTLD_LAZY);
  return dll[dllname];
}
var dll = {};
var functions = {};
var clsIDs={}
const debug = false

var readdir = util.promisify(fs.readdir);

async function requireJSONFiles(dirPath) {
  const fileNames = await readdir(dirPath);
  const jsonFiles = fileNames.filter(fileName => fileName.endsWith('.json'));
  var jsonarr = {};
  for (const fileName of jsonFiles) {
    const filePath = path.join(dirPath, fileName);
    const fileData = require("./" + filePath);
    jsonarr[fileName] = fileData;
  }
  return jsonarr;
}


function procedureConvertApiFromJSON(apitoconvert) {
  var typesbykind = groupby(apitoconvert.Types, a => a.Kind);
  typesbykind.Enum?.forEach(enumv => {
    lazySet(wintypes, enumv.Name, _ => ({
      name: enumv.Name,
      ...nativehelper[enumv.IntegerBase].typeobj,
      values: (enumv.Values.map(a => {
        let x = {};
        x[a.Name] = a.Value;
        return x
      }).reduce((a, b) => ({
        ...a,
        ...b
      }))),
      get(buf, offset) {
        const _buf = buf[nativehelper[enumv.IntegerBase].readbuf](offset);
        if (debug) {
          if (enumv.Flags) {
            return {
              flags: Object.entries(this.values).filter(a => _buf & a[1]).map(a => a[0]),
              _$debugValue: _buf
            }
          } else {
            return {
              possibleFlags: Object.entries(this.values).filter(a => a[1] == _buf).map(a => a[0]),
              _$debugValue: _buf
            }
          }
        } else
          return _buf;
      },
      set(buf, offset, val) {
        var setstr = nativehelper[enumv.IntegerBase].writebuf
        if (debug && val._$debugValue) {
          buf[setstr](val._$debugValue, offset);
        } else if (Buffer.isBuffer(val)) {
          val.copy(buf, offset, 0, this.size);
        } else if (typeof val == "number") {
          buf[setstr](val, offset);
        } else {
          var a = +this.values[val]
          a = a ?? val;
          buf[setstr](a, offset);
        }
      }
    }));
  });

  typesbykind.NativeTypedef?.forEach(A => lazySet(wintypes, A.Name, _ => convertApiTypeToJSType(A.Def)));
  //ComClassID are instances of interfaces
  
  typesbykind.Com?.forEach(I=>lazySet(wintypes,I.Name,_=>convertWinapiInterface2ffi(I)))
  typesbykind.ComClassID?.forEach(A=>{
	  var i=A.Name;
var clsID=new wintypes.GUID(Buffer.from(A.Guid.split('-').join(''), "hex"));
clsIDs[i]=clsID;    
});
	  

  typesbykind.FunctionPointer?.forEach(E => lazySet(wintypes, E.Name, _ => fun2Type(E)));

  typesbykind.Struct?.forEach(Struct => lazySet(wintypes, Struct.Name, _ => {
    return objApiToJSApi(Struct);
  }));
  typesbykind.Union?.forEach(Union => lazySet(wintypes, Union.Name, _ => {
    return objApiToJSApi(Union);
  }));
  apitoconvert.Constants?.forEach(_ => {
	  wintypes.attr(_.Type.Name).then(v=>{
    v.constants = v.constants ?? {};
    v.constants[_.Name] = _.Value;
	  
  });
  });
  apitoconvert.Functions?.forEach(a => lazySet(functions, a.Name, _ => ref.alloc(fun2Type(a), getDll(a.DllImport).get(a.Name))));
}

wintypes.GUID = StructType({
  Data1: wintypes.ULONG,
  Data2: wintypes.USHORT,
  Data3: wintypes.USHORT,
  Data4: ArrayType(wintypes.UCHAR, 8)
});

wintypes.Guid=wintypes.IID = wintypes.GUID;
wintypes.FMTID = wintypes.GUID;
//var apis = requireJSONFiles("win32json/api");


module.exports={lazySet,groupby,_get,_set,ffi,ref,StructType,Union,ArrayType,assert,path,nativehelper,longeSTring,wintypes,methodProxy,CFTypeConstructor,objApiToJSApi,getNestedTypes,
getFields,objApiStructToJSStruct,convertApiTypeToJSType,objApiEnumToJSEnum,objApiUnionToJSUnion,objApiArrayToJSArray,fun2Type,
convertWinapiInterface2ffi,method2Type,appendDLL,getDll,dll,functions,clsIDs,debug,readdir,requireJSONFiles,procedureConvertApiFromJSON,
done:requireJSONFiles("win32json/api").then(_=>Object.values(_).forEach(procedureConvertApiFromJSON))
};