/**
 * Simple & small functional framework for tameing interdependent code
 */

interface SpecDescription {
  /**
   * String by which to refer to a spec'ed object
   */
  key: string,
  /**
   * Array of keys to depend on
   */
  deps?: Array<string>,
  /**
   * Called when an object becomes invalid (eg call `.destroy()`)
   * @param obj Previously valid object that has been marked invalid.
   */
  invalidateFn?: (obj: object) => void
};

type SuccessValue = object;
/**
 * 
 * Return `SUCCESS` when we only care about the side effects of the `fn` parameter when calling spec.
 * That is, `fn` doesn't produce an object for use elsewhere. Although using `SUCCESS` is more explicit, it's not required.
 * A dummy object is used of the form `{success: true}`. Can check for `SUCCESS` with `Object.is(SUCCESS, obj)`.
 */
export const SUCCESS: SuccessValue = {success: true};  // there can only be one

/**
 * Simple & small functional framework for tameing interdependent code
 */
interface Tameable {
  /**
   * Describe how to construct an object, referenced by a key, perhaps depending on other speced objects
   * @param desc set the key, dependancies, and other optional properties
   * @param fn attempts to construct an object in a valid state and return that object or `SUCCESS`
   */
  spec(desc: SpecDescription, fn: (...objs:object[]) => Promise<object>): void,

  /**
   * Allow us to use spec'ed objects, knowing they will be in a valid state when we do
   * if the objects are not valid, they will be recomputed in dependancy order before they are used
   * for each dependancy key in deps, the function will be given a parameter contianing the corrisponding
   * managed object. If you only care about side effects, a use function isn't mandatory
   * @param deps array of keys to depend on
   */
  once(deps: Array<string>): Promise<Array<object>>,

  /**
   * Mark an object associated with `key` as invalid, to be reconstructed if it's needed again.
   * All objects dependant on it are also invalidated
   * @param key String by which to refer to a spec'ed object
   */
  invalidate(key: string): void,

  /**
   * Return `SUCCESS` when we only care about the side effects of `fn`, that is, it doesn't
   * produce an object for use elsewhere. Check for `SUCCESS` with `Object.is(SUCCESS, obj)`.
   * Although using `SUCCESS` is more explicit, it's not required.
   * A dummy object is used of the form `{success: true}`.
   */
  SUCCESS: SuccessValue,
};

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
export const isolatedNamespace = (): Tameable => {
  const namespace = new Map();

  const validate = async (key: string): Promise<object> => {
    const o = namespace.get(key);
    if (o.state === VALID) return o.obj;
    if (o.state === VALIDATING) return o.promise; // if this node is currently awaiting validation then await that promise instead of validating again
    if (DEBUG && o.state === ERROR) throw Error(`'${key}' has a previous error. Check your error handeling. Are you calling 'once' repeatadly or forgetting to await?`);
    o.state = VALIDATING;
    o.promise = Promise.all(o.deps.map(validate))  // make sure requirements met
      .then(objs => o.fn(...objs));  // run function with requirements as arguments 
    o.obj = await o.promise;
    o.promise = undefined;
    if (o.obj === null || typeof o.obj !== 'object') {  // must be non-null object to be valid
      o.state = ERROR;
      if (DEBUG && o.obj === undefined)  // provide more helpful message if nothing returned by fn
        throw Error(`Did you forget to return an object for '${key}'? Use \`tame.SUCCESS\` if returning nothing is intended`);
      throw Error(`'${key}' failed to validate: expected non-null object, got '${o.obj}'`);
    }
    o.state = VALID;
    return o.obj;
  };

  const invalidate = (key: string): void => {
    if (DEBUG && !namespace.has(key)) throw Error(`'${key}' cannot be invalidated, it does not exist`);

    const o = namespace.get(key);
    if (o.state !== VALID) return;
    o.state = INVALID;
    o.invalidateFn?.(o.obj);
    o.obj = undefined;  // remove reference to allow garbage collection
    o.children.forEach(invalidate);
  };

  return {
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

    async once(deps) {
      if (DEBUG) {
        if (!(deps instanceof Array)) throw Error('\'once\' requires an array of dependancies (strings)');
        for (const d of deps)
          if (!namespace.has(d)) throw Error(`'${d}' must exist before 'once' can depend on it`);
        if ((new Set(deps)).size !== deps.length) throw Error('\'once\' has duplicate dependancies');
      }

      return Promise.all(deps.map(validate));   // make sure requirements met, valid objects returned
    },

    invalidate,

    SUCCESS,
  };
};

const globalNamespace = /*#__PURE__*/ isolatedNamespace();
export const {spec, once, invalidate} = globalNamespace;
export default globalNamespace;
