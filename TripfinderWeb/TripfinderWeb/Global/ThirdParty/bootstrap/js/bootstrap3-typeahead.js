/* =============================================================
 * bootstrap3-typeahead.js v3.1.0
 * https://github.com/bassjobsen/Bootstrap-3-Typeahead
 * =============================================================
 * Original written by @mdo and @fat
 * =============================================================
 * Copyright 2014 Bass Jobsen @bassjobsen
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


(function(root, factory)
{

	'use strict';

	// CommonJS module is defined
	if (typeof module !== 'undefined' && module.exports)
	{
		module.exports = factory(require('jquery'));
	}
	// AMD module is defined
	else if (typeof define === 'function' && define.amd)
	{
		define(['jquery'], function($)
		{
			return factory($);
		});
	} else
	{
		factory(root.jQuery);
	}

}(this, function($)
{

	'use strict';
	// jshint laxcomma: true


	/* TYPEAHEAD PUBLIC CLASS DEFINITION
	 * ================================= */

	var SCROLL = "scroll.typehead",
		RESIZE = "resize.typehead",
		MOUSE = "mousedown.typehead",
		WINDOW = $(window);

	var Typeahead = function(element, options)
	{
		this.$element = $(element);
		this.options = $.extend({}, $.fn.typeahead.defaults, options);
		this.matcher = this.options.matcher || this.matcher;
		this.sorter = this.options.sorter || this.sorter;
		this.select = this.options.select || this.select;
		this.autoSelect = typeof this.options.autoSelect == 'boolean' ? this.options.autoSelect : true;
		this.highlighter = this.options.highlighter || this.highlighter;
		this.render = this.options.render || this.render;
		this.updater = this.options.updater || this.updater;
		this.displayText = this.options.displayText || this.displayText;
		this.source = this.options.source;
		this.groupSource = this.options.groupSource;
		this.delay = this.options.delay;
		this.$menu = $(this.options.menu);
		this.$appendTo = this.options.appendTo ? $(this.options.appendTo) : null;
		this.shown = false;
		this.listen();
		this.showHintOnFocus = typeof this.options.showHintOnFocus == 'boolean' ? this.options.showHintOnFocus : false;
		this.afterSelect = this.options.afterSelect;
		this.showEmpty = this.options.showEmpty ? this.options.showEmpty : false;
		this.addItem = false;
	};

	Typeahead.prototype = {

		constructor: Typeahead,

		select: function()
		{
			var val = this.$menu.find('.active').data('value');
			if (!val)
			{
				return this.hide();
			}
			this.$element.data('active', val);
			if (this.autoSelect || val)
			{
				var newVal = this.updater(val, this.$menu.find('.active'));
				this.$element
					.val(this.displayText(newVal) || newVal)
					.change();
				this.afterSelect(newVal);
			}
			return this.hide();
		},

		updater: function(item)
		{
			return item;
		},

		setSource: function(source)
		{
			this.source = source;
		},

		show: function()
		{
			var $modalBody = this.$element.closest(".modal-body");
			if ($modalBody.length)
			{
				$modalBody.bind('mousewheel touchmove', lockScroll);
			}

			var wrap = this.$element.closest(".input-group").length > 0 ? this.$element.closest(".input-group") : this.$element;
			var bodyWidth = $('body').width();
			var pos = $.extend({}, this.$element.offset(), {
				height: this.$element[0].offsetHeight,
				width: wrap[0].offsetWidth
			}), scrollHeight;

			scrollHeight = typeof this.options.scrollHeight == 'function' ?
				this.options.scrollHeight.call() :
				this.options.scrollHeight;

			(this.$appendTo ? this.$menu.appendTo(this.$appendTo) : this.$menu.insertAfter(this.$element))
				.css({
					top: pos.top + pos.height + scrollHeight,
					left: pos.left,
					width: this._calcWidth()
				})
				.show();

			if (this.$menu.outerWidth() > pos.width)
			{
				if (pos.left + this.$menu.outerWidth() > bodyWidth)
				{
					this.$menu.css({
						left: pos.left - this.$menu.outerWidth() + wrap.outerWidth()
					})
				}
			}
			this.shown = true;

			this._toggleScroll(false);
			this._toggleScroll(true);

			return this;
		},

		_calcWidth: function()
		{
			var parentWidth = this.$element.closest(".input-group").length > 0 ? this.$element.closest(".input-group").outerWidth() : this.$element.outerWidth();
			this.$menu.css({
				'width': 'auto',
				'max-height': 200000
			});
			this.$menu.css('max-height', 210);
			if (!TF.isPhoneDevice)
			{
				var menuWidth = this.$menu.outerWidth() + (this.$menu.height() > 200 ? 20 : 0);
				if (menuWidth > parentWidth)
				{
					return menuWidth - parentWidth > 200 ? (parentWidth + 200) : menuWidth;
				}
			}
			return parentWidth;
		},

		hide: function()
		{
			var $modalBody = this.$element.closest(".modal-body");
			if ($modalBody.length)
			{
				$modalBody.unbind('mousewheel touchmove', lockScroll);
			}

			this.$menu.hide();
			this.shown = false;

			this._toggleScroll(false);
			return this;
		},

		lookup: function(query)
		{
			var items;
			if (typeof (query) != 'undefined' && query !== null)
			{
				this.query = query;
			} else
			{
				this.query = this.$element.val() || '';
			}

			if (this.query.length < this.options.minLength)
			{
				return this.shown ? this.hide() : this;
			}

			var worker = $.proxy(function()
			{

				if ($.isFunction(this.source)) this.source(this.query, $.proxy(this.process, this));
				else if (this.source)
				{
					this.process(this.source);
				}
			}, this);

			clearTimeout(this.lookupWorker);
			this.lookupWorker = setTimeout(worker, this.delay);
		},

		process: function(source)
		{
			var that = this,
				matched = false,
				availableSourceLength = 0,
				newSource;

			this.$menu.empty();

			source.forEach(function(item)
			{
				if (item.source.length > 0)
				{
					availableSourceLength++;
					newSource = [{ displayName: '', source: item.source }];
				}
			});

			//only one source group is available,then combind together
			if (availableSourceLength === 1)
			{
				source = newSource
			}

			source.forEach(function(item)
			{
				var items = item.source;
				items = $.grep(items, function(item)
				{
					return that.matcher(item);
				});

				items = this.sorter(items);

				if (!items.length && !this.options.addItem && !this.showEmpty)
				{
					return this.shown ? this.hide() : this;
				}

				if (items.length > 0)
				{
					this.$element.data('active', items[0]);
					matched = true;
				}

				// Add item
				if (this.options.addItem)
				{
					items.push(this.options.addItem);
				}

				if (this.options.items == 'all')
				{
					return this.render(items, item.displayName).show();
				} else
				{
					return this.render(items.slice(0, this.options.items), item.displayName).show();
				}
			}.bind(this));
			if (matched == false)
			{
				this.$element.data('active', null);
				if (this.options.mustMatch)
				{
					this.$element.val('');
				}
			}
		},

		matcher: function(item)
		{
			var it = this.displayText(item);
			return ~it.toLowerCase().indexOf(this.query.toLowerCase());
		},

		sorter: function(items)
		{
			var beginswith = []
				, caseSensitive = []
				, caseInsensitive = []
				, item;

			while ((item = items.shift()) != null)
			{
				var it = this.displayText(item);
				if (!it.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item);
				else if (~it.indexOf(this.query)) caseSensitive.push(item);
				else caseInsensitive.push(item);
			}

			return beginswith.concat(caseSensitive, caseInsensitive);
		},

		highlighter: function(item)
		{
			var html = $('<div></div>');
			var query = this.query;
			var i = item.toLowerCase().indexOf(query.toLowerCase());
			var len, leftPart, middlePart, rightPart, strong;
			len = query.length;
			if (len === 0)
			{
				return html.text(item).html();
			}
			while (i > -1)
			{
				leftPart = item.substr(0, i);
				middlePart = item.substr(i, len);
				rightPart = item.substr(i + len);
				strong = $('<strong></strong>').text(middlePart);
				html
					.append(document.createTextNode(leftPart))
					.append(strong);
				item = rightPart;
				i = item.toLowerCase().indexOf(query.toLowerCase());
			}
			return html.append(document.createTextNode(item)).html();
		},

		render: function(items, groupName)
		{
			var that = this;
			var self = this;
			var activeFound = false;
			var isEmpty = items.length === 0;
			items = $(items).map(function(i, item)
			{
				var text = self.displayText(item);
				i = $(that.options.item).data('value', item);
				i.find('a').html(that.highlighter(text));
				if (text == self.$element.val())
				{
					i.addClass('active');
					self.$element.data('active', item);
					activeFound = true;
				}
				if (self.options.optionDefault && text === self.options.optionDefault)
				{
					i.addClass('active');
					self.$element.data('active', item);
					activeFound = true;
				}
				if (groupName)
					i.data('groupName', groupName);
				return i[0];
			});

			// if (this.autoSelect && !activeFound) {
			// 	items.first().addClass('active');
			// 	this.$element.data('active', items.first().data('value'));
			// }
			if (groupName)
			{
				this.$menu.append('<li class="group"><strong>' + groupName + '</strong></li>');
			}
			this.$menu.append(items);
			if (this.showEmpty && isEmpty)
			{
				this.$menu.append(this.showEmpty);
			}
			return this;
		},

		displayText: function(item)
		{
			return item.name || item;
		},

		next: function(event)
		{
			var active = this.$menu.find('.active').removeClass('active')
				, next = active.nextAll('li:not(.group,.disable)').eq(0);

			if (!next.length)
			{
				next = $(this.$menu.find('li:not(.disable)')[0]);
			}

			next.addClass('active');
			this.scrollDown(next);
		},

		scrollDown: function(element)
		{
			var requireHeight = element.height() * (element.index() + 1), currentHeight = this.$menu.height() + this.$menu.scrollTop();
			if (requireHeight >= currentHeight)
			{
				this.$menu.scrollTop(requireHeight - this.$menu.height());
			}
		},

		prev: function(event)
		{
			var active = this.$menu.find('.active').removeClass('active')
				, prev = active.prevAll('li:not(.group,.disable)').eq(0);

			if (!prev.length)
			{
				prev = this.$menu.find('li:not(.disable)').last();
			}

			prev.addClass('active');
			this.scrollUp(prev);
		},
		scrollUp: function(element)
		{
			var requireHeight = element.height() * element.index(), currentHeight = this.$menu.height(), scrollHeight = this.$menu.scrollTop();
			if (requireHeight <= scrollHeight)
			{
				this.$menu.scrollTop(scrollHeight - element.height());
			}
		},

		listen: function()
		{
			this.$element
				.on('focus', $.proxy(this.focus, this))
				.on('blur', $.proxy(this.blur, this))
				.on('keypress', $.proxy(this.keypress, this))
				.on('keyup', $.proxy(this.keyup, this));

			if (this.eventSupported('keydown'))
			{
				this.$element.on('keydown', $.proxy(this.keydown, this));
			}

			this.$menu
				.on('click', 'a', $.proxy(this.click, this))
				.on('mouseenter', 'li', $.proxy(this.mouseenter, this))
				.on('mouseleave', 'li', $.proxy(this.mouseleave, this))
				.on('mousedown', 'li', $.proxy(this.mouseleave, this));
		},

		destroy: function()
		{
			this.$element.data('typeahead', null);
			this.$element.data('active', null);
			this.$element
				.off('focus')
				.off('blur')
				.off('keypress')
				.off('keyup');

			if (this.eventSupported('keydown'))
			{
				this.$element.off('keydown');
			}

			this.$menu.remove();
		},

		eventSupported: function(eventName)
		{
			var isSupported = eventName in this.$element;
			if (!isSupported)
			{
				this.$element.setAttribute(eventName, 'return;');
				isSupported = typeof this.$element[eventName] === 'function';
			}
			return isSupported;
		},

		move: function(e)
		{
			if (!this.shown) return;

			switch (e.keyCode)
			{
				case 9: // tab
				case 13: // enter
				case 27: // escape
					e.preventDefault();
					break;

				case 38: // up arrow
					// with the shiftKey (this is actually the left parenthesis)
					if (e.shiftKey) return;
					e.preventDefault();
					this.prev();
					break;

				case 40: // down arrow
					// with the shiftKey (this is actually the right parenthesis)
					if (e.shiftKey) return;
					e.preventDefault();
					this.next();
					break;
			}

			e.stopPropagation();
		},

		keydown: function(e)
		{
			this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 9, 13, 27]);
			if (!this.shown && e.keyCode == 40)
			{
				this.lookup();
			} else
			{
				this.move(e);
			}
		},

		keypress: function(e)
		{
			if (this.suppressKeyPressRepeat) return;
			this.move(e);
		},

		keyup: function(e)
		{
			switch (e.keyCode)
			{
				case 40: // down arrow
				case 38: // up arrow
				case 16: // shift
				case 17: // ctrl
					break;

				case 18: // alt
					return;
				case 9: // tab
				case 13: // enter
					if (!this.shown) return;
					this.select();
					break;

				case 27: // escape
					if (!this.shown) return;
					this.hide();
					break;
				default:
					if ($(this).prop("readonly"))
					{
						this.lookup();
					}
			}

			e.stopPropagation();
			e.preventDefault();
		},

		focus: function(e)
		{
			if (!this.focused)
			{
				this.focused = true;
				if (this.options.showHintOnFocus)
				{
					this.lookup();
				}
			}
		},

		blur: function(e)
		{
			this.focused = false;
			if (!this.mousedover && this.shown) this.hide();
		},

		click: function(e)
		{
			e.stopPropagation();
			e.preventDefault();
			this.select();
			this.focused = true;
			this.$element.focus();
		},

		mouseenter: function(e)
		{
			this.mousedover = true;
			this.$menu.find('.active').removeClass('active');
			$(e.currentTarget).addClass('active');
		},

		mouseleave: function(e)
		{
			this.mousedover = false;
			if (!this.focused && this.shown) this.hide();
		},

		_resizeProxy: function(e)
		{
			var scrollTop = $(e.currentTarget).data("scrollTop");
			this.$menu.css({ top: this.$menu.offset().top + 1 + scrollTop - e.currentTarget.scrollTop });
			$(e.currentTarget).data("scrollTop", e.currentTarget.scrollTop);
		},

		_toggleScroll: function(toggle)
		{
			var method = toggle ? "on" : "off";
			var scrollableParents = this._scrollableParents();
			if (method === "on")
			{
				scrollableParents.map(function(i, item)
				{
					$(item).data("scrollTop", item.scrollTop)
				});
				scrollableParents[method](SCROLL, this._resizeProxy.bind(this));
				scrollableParents[method](MOUSE, function()
				{
					if (!this.mousedover && this.shown)
						this.hide.bind(this)
				}.bind(this));
				WINDOW[method](SCROLL, this._resizeProxy.bind(this));
				WINDOW[method](RESIZE, this.hide.bind(this));
			}
			else
			{
				scrollableParents[method](SCROLL);
				scrollableParents[method](MOUSE);
				WINDOW[method](SCROLL);
				WINDOW[method](RESIZE);
			}
		},

		_scrollableParents: function()
		{
			var that = this;
			return that.$element
				.parentsUntil("body")
				.filter(function(index, element)
				{
					return that._isScrollable(element);
				});
		},

		_isScrollable: function(element)
		{
			var overflow = $(element).css("overflow");
			return overflow == "auto" || overflow == "scroll";
		}
	};


	/* TYPEAHEAD PLUGIN DEFINITION
	 * =========================== */

	var old = $.fn.typeahead;

	$.fn.typeahead = function(option)
	{
		var arg = arguments;
		if (typeof option == 'string' && option == 'getActive')
		{
			return this.data('active');
		}
		return this.each(function()
		{
			var $this = $(this)
				, data = $this.data('typeahead')
				, options = typeof option == 'object' && option;
			if (!data) $this.data('typeahead', (data = new Typeahead(this, options)));
			if (typeof option == 'string')
			{
				if (arg.length > 1)
				{
					data[option].apply(data, Array.prototype.slice.call(arg, 1));
				} else
				{
					data[option]();
				}
			}
		});
	};

	$.fn.typeahead.defaults = {
		source: []
		, items: 8
		, menu: '<ul class="typeahead dropdown-menu" role="listbox"></ul>'
		, item: '<li><a href="#" role="option"></a></li>'
		, minLength: 1
		, scrollHeight: 0
		, autoSelect: true
		, afterSelect: $.noop
		, addItem: false
		, delay: 0
		, mustMatch: false
	};

	$.fn.typeahead.Constructor = Typeahead;


	/* TYPEAHEAD NO CONFLICT
	 * =================== */

	$.fn.typeahead.noConflict = function()
	{
		$.fn.typeahead = old;
		return this;
	};


	/* TYPEAHEAD DATA-API
	 * ================== */

	$(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function(e)
	{
		var $this = $(this);
		if ($this.data('typeahead')) return;
		$this.typeahead($this.data());
	});

	function lockScroll(e)
	{
		e.preventDefault();
	}
}));