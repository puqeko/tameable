
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "SUCCESS", () => $a12cb4e874af3139$export$638cc6e36b2a737a);
$parcel$export(module.exports, "isolatedNamespace", () => $a12cb4e874af3139$export$9d8d4571f3cb93c8);
$parcel$export(module.exports, "spec", () => $a12cb4e874af3139$export$a40e83dd9f9a97c8);
$parcel$export(module.exports, "once", () => $a12cb4e874af3139$export$d2de3aaeafa91619);
$parcel$export(module.exports, "invalidate", () => $a12cb4e874af3139$export$6d6d6ad02cee4c8f);
$parcel$export(module.exports, "default", () => $a12cb4e874af3139$export$2e2bcd8739ae039);
/**
 * Simple & small functional framework for tameing interdependent code
 */ const $a12cb4e874af3139$export$638cc6e36b2a737a = {
    success: true
}; // there can only be one
// Assuming bundlers will remove `if (DEBUG) ...` for production
const $a12cb4e874af3139$var$DEBUG = process.env.NODE_ENV !== "production";
const $a12cb4e874af3139$var$INVALID = "invalid";
const $a12cb4e874af3139$var$VALID = "valid";
const $a12cb4e874af3139$var$VALIDATING = "validating";
const $a12cb4e874af3139$var$INIT = "uninitalised";
const $a12cb4e874af3139$var$ERROR = "error";
const $a12cb4e874af3139$export$9d8d4571f3cb93c8 = ()=>{
    const namespace = new Map();
    const validate = async (key)=>{
        const o = namespace.get(key);
        if (o.state === $a12cb4e874af3139$var$VALID) return o.obj;
        if (o.state === $a12cb4e874af3139$var$VALIDATING) return o.promise; // if this node is currently awaiting validation then await that promise instead of validating again
        if ($a12cb4e874af3139$var$DEBUG && o.state === $a12cb4e874af3139$var$ERROR) throw Error(`'${key}' has a previous error\nCheck your error handeling. Are you calling 'once' repeatadly and forgetting to await?`);
        o.state = $a12cb4e874af3139$var$VALIDATING;
        o.promise = Promise.all(o.deps.map(validate)) // make sure requirements met
        .then((objs)=>o.fn(...objs)); // run function with requirements as arguments 
        o.obj = await o.promise;
        o.promise = undefined;
        if (o.obj === null || typeof o.obj !== "object") {
            o.state = $a12cb4e874af3139$var$ERROR;
            if ($a12cb4e874af3139$var$DEBUG && o.obj === undefined) throw Error(`did you forget to return an object for '${key}'?\nuse \`tame.SUCCESS\` if returning nothing is intended`);
            throw Error(`'${key}' failed to validate: expected non-null object, got '${o.obj}'`);
        }
        o.state = $a12cb4e874af3139$var$VALID;
        return o.obj;
    };
    const invalidate = (key)=>{
        var _o_invalidateFn;
        if ($a12cb4e874af3139$var$DEBUG && !namespace.has(key)) throw Error(`'${key}' cannot be invalidated, it does not exist`);
        const o = namespace.get(key);
        if (o.state !== $a12cb4e874af3139$var$VALID) return;
        o.state = $a12cb4e874af3139$var$INVALID;
        (_o_invalidateFn = o.invalidateFn) === null || _o_invalidateFn === void 0 ? void 0 : _o_invalidateFn.call(o, o.obj);
        o.obj = undefined; // remove reference to allow garbage collection
        o.children.forEach(invalidate);
    };
    return {
        spec (desc, fn) {
            const { key: key, invalidateFn: invalidateFn } = desc;
            var _desc_deps;
            const deps = (_desc_deps = desc.deps) !== null && _desc_deps !== void 0 ? _desc_deps : [];
            if ($a12cb4e874af3139$var$DEBUG) {
                if (!key) throw Error("spec objects require a key");
                if (!(typeof key === "string")) throw Error("key must be a string");
                if (namespace.has(key)) throw Error(`key '${key}' is taken`);
                for (const d of deps)if (!namespace.has(d)) throw Error(`'${d}' must exist before '${key}' can depend on it`);
                if (new Set(deps).size !== deps.length) throw Error(`'${key}' has duplicate dependancies`);
                if (typeof fn !== "function") throw Error(`'${key}' must have a function that returns an object`);
            }
            for (const d of deps)namespace.get(d).children.push(key);
            namespace.set(key, {
                deps: deps,
                invalidateFn: invalidateFn,
                fn: fn,
                children: [],
                state: $a12cb4e874af3139$var$INIT
            });
        },
        async once (deps) {
            if ($a12cb4e874af3139$var$DEBUG) {
                if (!(deps instanceof Array)) throw Error("'once' requires an array of dependancies (strings)");
                for (const d of deps)if (!namespace.has(d)) throw Error(`'${d}' must exist before 'once' can depend on it`);
                if (new Set(deps).size !== deps.length) throw Error("'once' has duplicate dependancies");
            }
            return Promise.all(deps.map(validate)); // make sure requirements met, valid objects returned
        },
        invalidate: invalidate,
        SUCCESS: $a12cb4e874af3139$export$638cc6e36b2a737a
    };
};
const $a12cb4e874af3139$var$globalNamespace = /*#__PURE__*/ $a12cb4e874af3139$export$9d8d4571f3cb93c8();
const { spec: $a12cb4e874af3139$export$a40e83dd9f9a97c8, once: $a12cb4e874af3139$export$d2de3aaeafa91619, invalidate: $a12cb4e874af3139$export$6d6d6ad02cee4c8f } = $a12cb4e874af3139$var$globalNamespace;
var $a12cb4e874af3139$export$2e2bcd8739ae039 = $a12cb4e874af3139$var$globalNamespace;


//# sourceMappingURL=main.js.map
