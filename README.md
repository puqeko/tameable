# Tameable.js

Three functions for managing objects which depend on other objects to be in a valid state.

 - We specify a key, and how to construct its object, with `spec`.
 - We request to use objects by their keys with `once`.
 - We invalidate an object by it's key with `invalidate`.
 
This ensure we minimise repeat work, only doing it when an object we need is not valid.
Depending on how a dependancy tree is designed, work can be deffered in different ways. My specific usecase was with the WebGPU API in which pipelines and buffers have to be reconstructed when certain parameters change, such as screen size or rendering mode.

Tameable attempts to be small and low overhead.

# Examples

## Example 1 - Side-effects
```js
import tame from 'tame'
tame.spec({key: 'shout once'}, async () => {
  console.log("Scream, and shout, and let it all out!");
  return tame.SUCCESS;
});

tame.once(['shout once']);
tame.once(['shout once']);
tame.once(['shout once']);
```
Note:
- Every spec function must return a non-null object (or a promise to one).
- We provide tame.SUCCESS if there is a situation where no objects need to be returned.
  ie we use the spec for it's side effects. It's a bit clearer than returning an empty object.

## Example 2 - Render on demand
 ```js
import tame from 'tameable'

// setup
tame.spec({key: 'renderObjects', deps: [...]}, async (...) => {
  // ...
  return renderObjects;
});
tame.spec(
  {
    key: 'render',
    deps: ['renderObjects']
  },
  async renderObjects => {
    // ..
    return tame.SUCCESS;
  }
);

// once(['renderObjects']);  // optionally preload, otherwise loaded on first frame

// render loop
async function frame() {
   await tame.once(['render'])  // only render if we need to
   requestAnimationFrame(frame);
}

// events
// render will be reconstructed on next call to `once`
event.on('something-happened', _ => invalidate('render')); 
// render and renderObjects will be reconstructed on next call to `once`
event.on('something-else-happened', _ => invalidate('renderObjects'));
```

Note:
- In this example, the 'render' spec function is called only once (unless an event is triggered)
  Hence, the `once` call only checks that the frame is up to date in most frames.
- If something does change the render is reconstructed, but only the dependancies which are invalid.
- If `once` was called without `await`` then any errors thrown will be uncaught and likley lead to console spam.

## Example 3 - Wrapping callbacks
```js
import tame from 'tame'
tame.spec({key: 'dom'}, async () => {
  if(document.readyState === 'loading') {
    // wrap 'DOMContentLoaded' callback with a promise
    return new Promise(resolve =>
      document.addEventListener('DOMContentLoaded', _ => resolve(document)));
  }
  return document;
});

// wait for dom to load
tame.once(['dom'])
  .then(_ => console.log('DOM loaded!'));
```
Note:
- This example shows a spec that waits for the DOM to be loaded. All dependants on `dom` will also wait.
- Circular dependencies are illegal.
- A spec function must return a non-null object, hence the use of `document` as a return value.
  If a promise is returned, it will be awaited and its return value will be the non-null object returned.

# Mental model

- Each `key` is associated with an object which can be `valid`, `validating`, `invalid`, or `initial`.
- Each `key` has an associated function `fn` which returns a non-null javascript object.

When `spec`` is called,
- The list of dependencies, `fn`, and other info is stored under the `key`
- No work is done here

When once is called,
- For each `key` that is a dependency,
  - Lookup the `key`
  - If the object under the `key` is `valid`, return it
  - Otherwise, go to the first step for this object's dependencies
  - Then construct the object itself
  - If the constructed object is a non-null object, return it
  - Otherwise, throw an error

When invalidate is called,
- If the object under this `key` is `valid`
  - mark it as `invalid`
  - call `invalidateFn` if it exists
  - invalidate all objects that depend on this one
- Otherwise, do nothing
- No work is done here

## About `invalidate`
- When an object is invalidated, so are all its children (dependants).
- Use `invalidate` in callbacks.
- If you find yourself using `invalidate` in a spec function but not a callback, maybe it
  should be in the dependancy list instead?
- Calling `invalidate` on an object that is `validating` or `initial` will do nothing, since
  these objects will be, or are being, reconstructed anyway.

# Debug mode
Unless the library is bundled for production, extra checks will be performed and errors omitted for common mistakes such as forgetting to return a value from `fn` or creating a dependency on a key which doesn't yet exist (thus preventing circular dependencies). This features assumes a bundler and minifier will replace `process.env.NODE_ENV !== 'production'` with `true` and unreachable code will be optimised away, which it should. As such, errors in production code are less likley to be helpful. An error is only thrown in production if an objects `fn` returns a non-null object.

# Future features to consider
 - Tree analysis
 - Tooling
 - Promise.any / Promise.allSettled support, ie use whatever dependancy path first completes (usecases?)