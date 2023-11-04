/**
 * Simple & small functional framework for tameing interdependent code
 */ const $d114aaa1712d452c$export$638cc6e36b2a737a = {
    success: true
}; // there can only be one
// Assuming bundlers will remove `if (DEBUG) ...` for production
const $d114aaa1712d452c$var$DEBUG = process.env.NODE_ENV !== "production";
const $d114aaa1712d452c$var$INVALID = "invalid";
const $d114aaa1712d452c$var$VALID = "valid";
const $d114aaa1712d452c$var$VALIDATING = "validating";
const $d114aaa1712d452c$var$INIT = "uninitalised";
const $d114aaa1712d452c$var$ERROR = "error";
const $d114aaa1712d452c$export$9d8d4571f3cb93c8 = ()=>{
    const namespace = new Map();
    const validate = async (key)=>{
        const o = namespace.get(key);
        if (o.state === $d114aaa1712d452c$var$VALID) return o.obj;
        if (o.state === $d114aaa1712d452c$var$VALIDATING) return o.promise; // if this node is currently awaiting validation then await that promise instead of validating again
        if ($d114aaa1712d452c$var$DEBUG && o.state === $d114aaa1712d452c$var$ERROR) throw Error(`'${key}' has a previous error\nCheck your error handeling. Are you calling 'once' repeatadly and forgetting to await?`);
        o.state = $d114aaa1712d452c$var$VALIDATING;
        o.promise = Promise.all(o.deps.map(validate)) // make sure requirements met
        .then((objs)=>o.fn(...objs)); // run function with requirements as arguments 
        o.obj = await o.promise;
        o.promise = undefined;
        if (o.obj === null || typeof o.obj !== "object") {
            o.state = $d114aaa1712d452c$var$ERROR;
            if ($d114aaa1712d452c$var$DEBUG && o.obj === undefined) throw Error(`did you forget to return an object for '${key}'?\nuse \`tame.SUCCESS\` if returning nothing is intended`);
            throw Error(`'${key}' failed to validate: expected non-null object, got '${o.obj}'`);
        }
        o.state = $d114aaa1712d452c$var$VALID;
        return o.obj;
    };
    const invalidate = (key)=>{
        var _o_invalidateFn;
        if ($d114aaa1712d452c$var$DEBUG && !namespace.has(key)) throw Error(`'${key}' cannot be invalidated, it does not exist`);
        const o = namespace.get(key);
        if (o.state !== $d114aaa1712d452c$var$VALID) return;
        o.state = $d114aaa1712d452c$var$INVALID;
        (_o_invalidateFn = o.invalidateFn) === null || _o_invalidateFn === void 0 ? void 0 : _o_invalidateFn.call(o, o.obj);
        o.obj = undefined; // remove reference to allow garbage collection
        o.children.forEach(invalidate);
    };
    return {
        spec (desc, fn) {
            const { key: key, invalidateFn: invalidateFn } = desc;
            var _desc_deps;
            const deps = (_desc_deps = desc.deps) !== null && _desc_deps !== void 0 ? _desc_deps : [];
            if ($d114aaa1712d452c$var$DEBUG) {
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
                state: $d114aaa1712d452c$var$INIT
            });
        },
        async once (deps) {
            if ($d114aaa1712d452c$var$DEBUG) {
                if (!(deps instanceof Array)) throw Error("'once' requires an array of dependancies (strings)");
                for (const d of deps)if (!namespace.has(d)) throw Error(`'${d}' must exist before 'once' can depend on it`);
                if (new Set(deps).size !== deps.length) throw Error("'once' has duplicate dependancies");
            }
            return Promise.all(deps.map(validate)); // make sure requirements met, valid objects returned
        },
        invalidate: invalidate,
        SUCCESS: $d114aaa1712d452c$export$638cc6e36b2a737a
    };
};
const $d114aaa1712d452c$var$globalNamespace = /*#__PURE__*/ $d114aaa1712d452c$export$9d8d4571f3cb93c8();
const { spec: $d114aaa1712d452c$export$a40e83dd9f9a97c8, once: $d114aaa1712d452c$export$d2de3aaeafa91619, invalidate: $d114aaa1712d452c$export$6d6d6ad02cee4c8f } = $d114aaa1712d452c$var$globalNamespace;
var $d114aaa1712d452c$export$2e2bcd8739ae039 = $d114aaa1712d452c$var$globalNamespace;


export {$d114aaa1712d452c$export$638cc6e36b2a737a as SUCCESS, $d114aaa1712d452c$export$9d8d4571f3cb93c8 as isolatedNamespace, $d114aaa1712d452c$export$a40e83dd9f9a97c8 as spec, $d114aaa1712d452c$export$d2de3aaeafa91619 as once, $d114aaa1712d452c$export$6d6d6ad02cee4c8f as invalidate, $d114aaa1712d452c$export$2e2bcd8739ae039 as default};
//# sourceMappingURL=module.js.map
