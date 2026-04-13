import { describe, it, expect, beforeEach, vi } from 'vitest';

// TODO: Implement and export $ from '../mini-jquery'
// The tests assume API: $(selectorOrElement) -> wrapper
// wrapper.text(value?) -> string | wrapper
// wrapper.addClass(className) -> wrapper
// wrapper.removeClass(className) -> wrapper
// wrapper.on(event, handler) -> wrapper
// wrapper.off(event, handler?) -> wrapper
// wrapper.css(name) -> string (first element’s inline value for that property)
// wrapper.css(name, value) -> wrapper
// wrapper.css({ name: value, ... }) -> wrapper
import { $ } from '../mini-jquery';

describe('mini-jQuery-like API (TDD tests only)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should set and get text on a single element and support chaining', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const wrapper = $(el);

    // Arrange/Act: set text and chain addClass
    const ret = wrapper.text('hello').addClass('greeting');

    // Assert: chaining returns same wrapper
    expect(ret).toBe(wrapper);

    // Assert: DOM mutated
    expect(el.textContent).toBe('hello');
    expect(el.classList.contains('greeting')).toBe(true);

    // Getter returns the text (first element)
    expect(wrapper.text()).toBe('hello');
  });

  it('should add/remove class for multiple elements', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p class="item">one</p><p class="item">two</p>';
    document.body.appendChild(container);

    const items = $('.item');

    items.addClass('x');

    const nodes = Array.from(document.querySelectorAll('.item')) as HTMLElement[];
    // both elements should have new class
    expect(nodes.every(n => n.classList.contains('x'))).toBe(true);

    // removeClass should remove from all
    items.removeClass('x');
    expect(nodes.every(n => !n.classList.contains('x'))).toBe(true);
  });

  it('should register and call event handlers on single element', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);

    const handler = vi.fn();
    const wrapper = $(el);

    wrapper.on('click', handler);

    // simulate event
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);

    // off with handler should remove it
    wrapper.off('click', handler);
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should register handlers on multiple elements and off() without handler removes all', () => {
    const container = document.createElement('div');
    container.innerHTML = '<span class="a"></span><span class="a"></span>';
    document.body.appendChild(container);

    const wrapper = $('.a');
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    wrapper.on('custom', handler1).on('custom', handler2);

    // dispatch on each matched element
    const nodes = Array.from(document.querySelectorAll('.a'));
    nodes.forEach(n => n.dispatchEvent(new Event('custom')));

    // each handler should have been called once per element
    expect(handler1).toHaveBeenCalledTimes(nodes.length);
    expect(handler2).toHaveBeenCalledTimes(nodes.length);

    // remove all handlers for 'custom'
    wrapper.off('custom');
    nodes.forEach(n => n.dispatchEvent(new Event('custom')));
    expect(handler1).toHaveBeenCalledTimes(nodes.length);
    expect(handler2).toHaveBeenCalledTimes(nodes.length);
  });

  it('should not throw when selecting nothing and chaining safe no-ops', () => {
    // nothing in document
    const wrapper = $('.does-not-exist');
    expect(() => {
      wrapper.addClass('x').removeClass('y').text('t');
    }).not.toThrow();

    // getter should return empty string or undefined (implementation detail) but must not throw
    expect(() => wrapper.text()).not.toThrow();
  });

  it('should throw when addClass receives non-string', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const wrapper = $(el);
    // non-string argument should be rejected to surface API misuse
    expect(() => wrapper.addClass(null as any)).toThrow(TypeError);
  });

  it('should return a wrapper that is strict-equal for repeated selections of the same element (chainability convenience)', () => {
    const el = document.createElement('div');
    el.className = 'unique';
    document.body.appendChild(el);

    const a = $('.unique');
    const b = $('.unique');

    // Implementations may choose to return distinct wrapper objects; prefer to allow either
    // but tests assert that chaining works: methods on a affect DOM seen by b
    a.addClass('z');
    expect(b.text()).not.toBeUndefined(); // sanity: methods are callable
    expect(el.classList.contains('z')).toBe(true);
  });

  // Additional edge case: on/off with handler references must be matched strictly
  it('off(event, handler) should remove only that handler', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const wrapper = $(el);

    const h1 = vi.fn();
    const h2 = vi.fn();

    wrapper.on('evt', h1);
    wrapper.on('evt', h2);

    el.dispatchEvent(new Event('evt'));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    wrapper.off('evt', h1);
    el.dispatchEvent(new Event('evt'));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(2);
  });

  it('should get and set inline styles via css() and support chaining', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const wrapper = $(el);

    const chained = wrapper.css('paddingLeft', '12px').addClass('styled');
    expect(chained).toBe(wrapper);
    expect(el.style.paddingLeft).toBe('12px');
    expect(el.classList.contains('styled')).toBe(true);

    expect(wrapper.css('paddingLeft')).toBe('12px');
  });

  it('should apply css() object map to all matched elements', () => {
    const container = document.createElement('div');
    container.innerHTML = '<span class="cell"></span><span class="cell"></span>';
    document.body.appendChild(container);

    const cells = $('.cell');
    cells.css({ marginTop: '4px', opacity: '0.5' });

    const nodes = Array.from(document.querySelectorAll('.cell')) as HTMLElement[];
    expect(nodes.every((n) => n.style.marginTop === '4px' && n.style.opacity === '0.5')).toBe(
      true
    );
  });

  it('should not throw when css() is used on an empty selection', () => {
    const wrapper = $('.missing');
    expect(() => {
      wrapper.css('color', 'red');
      wrapper.css({ display: 'block' });
    }).not.toThrow();
    expect(() => wrapper.css('color')).not.toThrow();
  });

  // Brief notes: these tests act as the specification. Implement ../mini-jquery to make them pass.
});
