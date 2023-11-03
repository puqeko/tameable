// Assuming bundlers will remove `if (DEBUG) ...` for production
const DEBUG = process.env.NODE_ENV !== 'production';

const INVALID = 'invalid';
const VALID = 'valid';
const VALIDATING = 'validating';
const INIT = 'uninitalised';
const ERROR = 'error';

/**
 * Get an API with an isolated namespace. In other words, keys in this namespace (internally, a map) are kept seperate from the global keys (a different map).
 * For example, use this in a library to prevent namespace collisions with those who use the library. Otherwise, perfer the default global namespace.
 */
export const isolatedNamespace = _ => {
  const namespace = new Map();

  const validate = async key => {
    const o = namespace.get(key);
    if (o.state === VALID) return o.obj;
    if (o.state === VALIDATING) return o.promise; // if this node is currently awaiting validation then await that promise instead of validating again
    if (DEBUG && o.state === ERROR) return Error(`'${key}' has a previous error. Check your error handeling. Are you calling 'once' repeatadly or forgetting to await?`);
    o.state = VALIDATING;
    o.promise = Promise.all(o.deps.map(validate))  // make sure requirements met
      .then(objs => o.fn(...objs));  // run function with requirements as arguments
    o.obj = await o.promise;
    o.promise = undefined;
    if (DEBUG && !o.obj) {
      o.state = ERROR;
      throw Error(`'${key}' failed to validate: spec returned falsely, did you forget to return something?`);
    }
    if (!o.obj || typeof o.obj === 'string') {
      o.state = ERROR;
      throw Error(`'${key}' failed to validate: ${o.obj || 'spec returned falsely'}`);
    }
    o.state = VALID;
    return o.obj;
  };

  const invalidate = key => {
    if (DEBUG && !namespace.has(key)) throw Error(`'${key}' cannot be invalidated, it does not exist`);

    const o = namespace.get(key);
    if (o.state !== VALID) return;
    o.state = INVALID;
    o.invalidateFn?.(o.obj);
    o.obj = undefined;  // remove reference to allow garbage collection
    o.children.forEach(invalidate);
  };

  return {
    /**
     * Describe how to construct an object, referenced by a key, perhaps depending on other speced objects
     * @param {{key: string, deps: Array<string>, invalidateFn: function(obj): void}} desc
     * @param {function(...): Promise<any>} fn
     */
    spec(desc, fn) {
      const {key, invalidateFn} = desc;
      const deps = desc.deps ?? [];
      if (DEBUG) {
        if (!key) throw Error('spec objects require a key');
        if (!(typeof key === 'string')) throw Error('key must be a string');
        if (namespace.has(key)) throw Error(`key '${key}' is taken`);
        for (const d of deps)
          if (!namespace.has(d)) throw Error(`'${d}' must exist before '${key}' can depend on it`);
        if ((new Set(deps)).size !== deps.length) throw Error(`'${key}' has duplicate dependancies`);
        if (typeof fn !== 'function') throw Error(`'${key}' must have a function that returns an object`);
      }

      for (const d of deps) namespace.get(d).children.push(key);
      namespace.set(key, {
        deps,  // always Array
        invalidateFn,  // might be undefined, called when invalidated for the first time
        fn,
        children: [],
        state: INIT,
        // obj: undefined,  // will have a value returned by fn when state === VALID
        // promise: undefined,  // if this node is currently awaiting validation then await this promise instead of validating again
      });
    },

    /**
     * Allow us to use spec'ed objects, knowing they will be in a valid state when we do
     * if the objects are not valid, they will be recomputed in dependancy order before they are used
     * for each dependancy key in deps, the function will be given a parameter contianing the corrisponding
     * managed object. If you only care about side effects, a use function isn't mandatory
     * @param {Array<string>} deps list of objects (by key) we need to have speced and valid
     * @return {Promise<Array<any>>} fn callback taking the corrisponding objects as parameters
     */
    async once(deps) {
      if (DEBUG) {
        if (!(deps instanceof Array)) throw Error('\'once\' requires an array of dependancies (strings)');
        for (const d of deps)
          if (!namespace.has(d)) throw Error(`'${d}' must exist before 'once' can depend on it`);
        if ((new Set(deps)).size !== deps.length) throw Error('\'once\' has duplicate dependancies');
      }

      return Promise.all(deps.map(validate));   // make sure requirements met, valid objects returned
    },

    /**
     * Mark an object invalid, to be reconstructed if it's needed again
     * all objects dependant on it are also invalidated
     * @param {string} key object to invalidate
     */
    invalidate,
  };
};

const globalNamespace = /*@__PURE__*/ isolatedNamespace();
export const {spec, once, invalidate} = globalNamespace;
export default globalNamespace;
