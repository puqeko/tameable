/**
 * Simple & small functional framework for tameing interdependent code
 */
interface SpecDescription {
    /**
     * String by which to refer to a spec'ed object
     */
    key: string;
    /**
     * Array of keys to depend on
     */
    deps?: Array<string>;
    /**
     * Called when an object becomes invalid (eg call `.destroy()`)
     * @param obj Previously valid object that has been marked invalid.
     */
    invalidateFn?: (obj: object) => void;
}
type SuccessValue = object;
/**
 *
 * Return `SUCCESS` when we only care about the side effects of the `fn` parameter when calling spec.
 * That is, `fn` doesn't produce an object for use elsewhere. Although using `SUCCESS` is more explicit, it's not required.
 * A dummy object is used of the form `{success: true}`. Can check for `SUCCESS` with `Object.is(SUCCESS, obj)`.
 */
export const SUCCESS: SuccessValue;
/**
 * Simple & small functional framework for tameing interdependent code
 */
interface Tameable {
    /**
     * Describe how to construct an object, referenced by a key, perhaps depending on other speced objects
     * @param desc set the key, dependancies, and other optional properties
     * @param fn attempts to construct an object in a valid state and return that object or `SUCCESS`
     */
    spec(desc: SpecDescription, fn: (...objs: object[]) => Promise<object>): void;
    /**
     * Allow us to use spec'ed objects, knowing they will be in a valid state when we do
     * if the objects are not valid, they will be recomputed in dependancy order before they are used
     * for each dependancy key in deps, the function will be given a parameter contianing the corrisponding
     * managed object. If you only care about side effects, a use function isn't mandatory
     * @param deps array of keys to depend on
     */
    once(deps: Array<string>): Promise<Array<object>>;
    /**
     * Mark an object associated with `key` as invalid, to be reconstructed if it's needed again.
     * All objects dependant on it are also invalidated
     * @param key String by which to refer to a spec'ed object
     */
    invalidate(key: string): void;
    /**
     * Return `SUCCESS` when we only care about the side effects of `fn`, that is, it doesn't
     * produce an object for use elsewhere. Check for `SUCCESS` with `Object.is(SUCCESS, obj)`.
     * Although using `SUCCESS` is more explicit, it's not required.
     * A dummy object is used of the form `{success: true}`.
     */
    SUCCESS: SuccessValue;
}
/**
 * Get an API with an isolated namespace. In other words, keys in this namespace (internally, a map) are kept seperate from the global keys (a different map).
 * For example, use this in a library to prevent namespace collisions with those who use the library. Otherwise, perfer the default global namespace.
 */
export const isolatedNamespace: () => Tameable;
declare const globalNamespace: Tameable;
export const spec: (desc: SpecDescription, fn: (...objs: object[]) => Promise<object>) => void, once: (deps: Array<string>) => Promise<Array<object>>, invalidate: (key: string) => void;
export default globalNamespace;

//# sourceMappingURL=types.d.ts.map
