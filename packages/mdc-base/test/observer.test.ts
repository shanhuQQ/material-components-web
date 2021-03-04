/**
 * @license
 * Copyright 2021 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import 'jasmine';

import {mdcObserver as mdcObserverIE, observeProperty as observePropertyIE, setObserversEnabled as setObserversEnabledIE} from '../observer';
import {mdcObserver as mdcObserverProxy, observeProperty as observePropertyProxy, setObserversEnabled as setObserversEnabledProxy} from '../observer-proxy';

createObserverTests(mdcObserverIE, observePropertyIE, setObserversEnabledIE);

if (typeof Proxy === 'function') {
  createObserverTests(
      mdcObserverProxy, observePropertyProxy, setObserversEnabledProxy,
      'Proxy ');
}

function createObserverTests(
    mdcObserver: typeof mdcObserverIE,
    observeProperty: typeof observePropertyIE,
    setObserversEnabled: typeof setObserversEnabledIE, testPrefix = '') {
  describe(`${testPrefix}mdcObserver()`, () => {
    it('should return MDCObserver class to extend from', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      expect(instance.observe).toEqual(jasmine.any(Function));
      expect(instance.unobserve).toEqual(jasmine.any(Function));
    });

    it('should extend from provided base class', () => {
      class SuperClass {}
      const baseClass = mdcObserver(SuperClass);
      const instance = new baseClass();
      expect(instance).toBeInstanceOf(SuperClass);
    });

    it('#observe() should listen to multiple properties', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      const state = {foo: 'value', bar: 0};
      const observerFoo = jasmine.createSpy('observerFoo');
      const observerBar = jasmine.createSpy('observerBar');
      instance.observe(state, {
        foo: observerFoo,
        bar: observerBar,
      });

      state.foo = 'newValue';
      state.bar = 1;
      expect(observerFoo).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerBar).toHaveBeenCalledOnceWith(1, 0);
    });

    it('#observe() should call Observers with instance as `this`', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      const state = {foo: 'value'};
      let observerThis: unknown;
      const observer =
          jasmine.createSpy('observer').and.callFake(function(this: unknown) {
            observerThis = this;
          });

      instance.observe(state, {
        foo: observer,
      });

      state.foo = 'newValue';
      expect(observer).toHaveBeenCalled();
      expect(observerThis).toBe(instance, 'observer `this` should be instance');
    });

    it('#observe() cleanup function stops observing all properties', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      const state = {foo: 'value', bar: 0};
      const observerFooOne = jasmine.createSpy('observerFooOne');
      const observerFooTwo = jasmine.createSpy('observerFooTwo');
      const observerBar = jasmine.createSpy('observerBar');
      const unobserveFooOneAndBar =
          instance.observe(state, {foo: observerFooOne, bar: observerBar});

      instance.observe(state, {foo: observerFooTwo});

      state.foo = 'newValue';
      state.bar = 1;
      expect(observerFooOne).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerFooTwo).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerBar).toHaveBeenCalledOnceWith(1, 0);
      observerFooOne.calls.reset();
      observerFooTwo.calls.reset();
      observerBar.calls.reset();
      unobserveFooOneAndBar();
      state.foo = 'anotherValue';
      state.bar = 2;
      expect(observerFooOne).not.toHaveBeenCalled();
      expect(observerBar).not.toHaveBeenCalled();
      expect(observerFooTwo)
          .toHaveBeenCalledOnceWith('anotherValue', 'newValue');
    });

    it('#unobserve() stops observing all properties', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      const state = {foo: 'value', bar: 0};
      const observerFooOne = jasmine.createSpy('observerFooOne');
      const observerFooTwo = jasmine.createSpy('observerFooTwo');
      const observerBar = jasmine.createSpy('observerBar');
      instance.observe(state, {foo: observerFooOne, bar: observerBar});
      instance.observe(state, {foo: observerFooTwo});
      state.foo = 'newValue';
      state.bar = 1;
      expect(observerFooOne).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerFooTwo).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerBar).toHaveBeenCalledOnceWith(1, 0);
      observerFooOne.calls.reset();
      observerFooTwo.calls.reset();
      observerBar.calls.reset();
      instance.unobserve();
      state.foo = 'anotherValue';
      state.bar = 2;
      expect(observerFooOne).not.toHaveBeenCalled();
      expect(observerFooTwo).not.toHaveBeenCalled();
      expect(observerBar).not.toHaveBeenCalled();
    });

    it('#setObserversEnabled() disables/enables all Observers', () => {
      const baseClass = mdcObserver();
      const instance = new baseClass();
      const state = {foo: 'value', bar: 0};
      const observerFooOne = jasmine.createSpy('observerFooOne');
      const observerFooTwo = jasmine.createSpy('observerFooTwo');
      const observerBar = jasmine.createSpy('observerBar');
      instance.observe(state, {foo: observerFooOne, bar: observerBar});
      instance.observe(state, {foo: observerFooTwo});
      state.foo = 'newValue';
      state.bar = 1;
      expect(observerFooOne).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerFooTwo).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerBar).toHaveBeenCalledOnceWith(1, 0);
      observerFooOne.calls.reset();
      observerFooTwo.calls.reset();
      observerBar.calls.reset();
      instance.setObserversEnabled(state, false);
      state.foo = 'anotherValue';
      state.bar = 2;
      expect(observerFooOne).not.toHaveBeenCalled();
      expect(observerFooTwo).not.toHaveBeenCalled();
      expect(observerBar).not.toHaveBeenCalled();
      instance.setObserversEnabled(state, true);
      state.foo = 'thirdValue';
      state.bar = 3;
      expect(observerFooOne)
          .toHaveBeenCalledOnceWith('thirdValue', 'anotherValue');
      expect(observerFooTwo)
          .toHaveBeenCalledOnceWith('thirdValue', 'anotherValue');
      expect(observerBar).toHaveBeenCalledOnceWith(3, 2);
    });
  });

  describe(`${testPrefix}observeProperty()`, () => {
    it('should call Observer when property value changes', () => {
      const state = {foo: 'value'};
      const observer = jasmine.createSpy('observer');
      observeProperty(state, 'foo', observer);
      // observer should not be called before property changes
      expect(observer).not.toHaveBeenCalled();
      state.foo = 'newValue';
      expect(observer).toHaveBeenCalledOnceWith('newValue', 'value');
      observer.calls.reset();
      state.foo = 'newValue';
      // observer should not be called if property is set to a value that
      // does not change
      expect(observer).not.toHaveBeenCalled();
    });

    it('should stop observing when returned function is called', () => {
      const state = {foo: 'value'};
      const observer = jasmine.createSpy('observer');
      const unobserve = observeProperty(state, 'foo', observer);
      state.foo = 'newValue';
      expect(observer).toHaveBeenCalledTimes(1);
      unobserve();
      state.foo = 'anotherValue';
      // observer should not be called again after cleaning up
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple Observers on the same property', () => {
      const state = {foo: 'value'};
      const observerOne = jasmine.createSpy('observerOne');
      const observerTwo = jasmine.createSpy('observerTwo');
      const unobserveOne = observeProperty(state, 'foo', observerOne);
      observeProperty(state, 'foo', observerTwo);
      state.foo = 'newValue';
      expect(observerOne).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerTwo).toHaveBeenCalledOnceWith('newValue', 'value');
      unobserveOne();
      state.foo = 'anotherValue';
      // First observer should stop listening
      expect(observerOne).toHaveBeenCalledTimes(1);
      // Second observer should continue listening
      expect(observerTwo).toHaveBeenCalledTimes(2);
      expect(observerTwo).toHaveBeenCalledWith('anotherValue', 'newValue');
    });
  });

  describe(`${testPrefix}setObserversEnabled()`, () => {
    it('should disable or enable all observers for a target', () => {
      const state = {foo: 'value', bar: 0};
      const observerFooOne = jasmine.createSpy('observerFooOne');
      const observerFooTwo = jasmine.createSpy('observerFooTwo');
      const observerBar = jasmine.createSpy('observerBar');
      observeProperty(state, 'foo', observerFooOne);
      observeProperty(state, 'foo', observerFooTwo);
      observeProperty(state, 'bar', observerBar);
      state.foo = 'newValue';
      state.bar = 1;
      expect(observerFooOne).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerFooTwo).toHaveBeenCalledOnceWith('newValue', 'value');
      expect(observerBar).toHaveBeenCalledOnceWith(1, 0);
      observerFooOne.calls.reset();
      observerFooTwo.calls.reset();
      observerBar.calls.reset();
      setObserversEnabled(state, false);
      state.foo = 'anotherValue';
      state.bar = 2;
      expect(observerFooOne).not.toHaveBeenCalled();
      expect(observerFooTwo).not.toHaveBeenCalled();
      expect(observerBar).not.toHaveBeenCalled();
      setObserversEnabled(state, true);
      state.foo = 'thirdValue';
      state.bar = 3;
      expect(observerFooOne)
          .toHaveBeenCalledOnceWith('thirdValue', 'anotherValue');
      expect(observerFooTwo)
          .toHaveBeenCalledOnceWith('thirdValue', 'anotherValue');
      expect(observerBar).toHaveBeenCalledOnceWith(3, 2);
    });
  });
}
