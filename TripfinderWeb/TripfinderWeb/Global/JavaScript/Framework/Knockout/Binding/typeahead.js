/**
*How to use
*add a div to wrap a input like this:
*<div data-bind="typeahead:{source:costs,format:format,mustMatch:false,selectedValue:selectedcost}">
*	<!-- ko customInput:{type:"Decimal",value:tripDataModel().cost,attributes:{class:"form-control",name:"cost"}} --><!-- /ko -->
*</div>
*@param {source} like ['a','b','c']  or [{value:'a',name:'n1'},{value:'b',name:'n2'},{value:'c',name:'n3'}]
*@param {format} like  function(obj){return obj.value;}
*@param {mustMatch} if set to ture : the input must match the source,if not match the input value will be empty
*@param {selectedValue} the selected value will assign this param
*/
(function()
{

	$.fn.typeahead.Constructor.prototype.mouseenter = function(e)
	{//hook the base li mouse enter function
		this.mousedover = true;
		this.$menu.find('.active').removeClass('active');
		$(e.currentTarget).addClass('active');
	};

	$.fn.typeahead.Constructor.prototype.mouseleave = function(e)
	{//hook the base li mouse leave function, to use ul mouse leave instead
	};

	ko.bindingHandlers.typeahead = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var bindingValue = ko.unwrap(valueAccessor()),
				$element = $(element),
				input,
				option = ko.bindingHandlers.typeahead.getOption(bindingValue);

			$element.addClass('bootstrap-typeahead-wrap').delegate('input:text', 'focus.kotypeahead', function()
			{
				input = $(this);
				ko.bindingHandlers.typeahead.bindTypeahead($element, option, true, bindingContext);
			});

			if (option.drowDownShow)
			{
				$element.closest('.input-group').find('.caret:eq(0)').parent().on('click.kotypeahead', function()
				{
					if (!input)
					{
						input = $element.children(':enabled');
						ko.bindingHandlers.typeahead.bindTypeahead($element, option, true, bindingContext);
					}
					if (option.customizeCheck && option.customizeCheck($element) == false)
					{
						return;
					}
					if (input.data("typeahead"))
					{
						if (input.data("typeahead").shown)
						{
							input.trigger('focus').typeahead('hide');
						}
						else
						{
							input.trigger('focus').typeahead('lookup', '');
							var clearKeyTimeout, typeahead = input.data("typeahead"), dataSource = [], scrollContainer = typeahead.$menu,
								jumpToItem = function(keyString)
								{
									var found = false, index, singleHeight = scrollContainer.children().height();
									for (index = 0; index < dataSource.length; index++)
									{
										if (!!dataSource[index] && dataSource[index].toLowerCase().indexOf(keyString.toLowerCase()) === 0)
										{
											found = true;
											break;
										}
									}
									if (found)
									{
										scrollContainer.find("li.active").removeClass("active");
										scrollContainer.find("li").eq(index).addClass("active");
										scrollContainer.scrollTop(singleHeight * index);
									}
								};

							$.each(typeahead.source, function(index, item)
							{
								if (item.displayName !== "")
								{
									dataSource.push(null);
								}
								dataSource = dataSource.concat(item.source);
							});

							if (input.prop("readonly"))
							{
								input.off(".input").on("keypress.input", function(e)
								{
									var keywords, keyString = "",
										// all the valid chars
										validChars = [123, 124, 125, 126, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 58, 59, 60, 61, 62, 63, 64, 91, 92, 93, 94, 95, 96];

									if ((65 <= e.which && e.which <= 90) || (97 <= e.which && e.which <= 122) || $.inArray(e.which, validChars) >= 0)
									{
										if (clearKeyTimeout)
										{
											clearTimeout(clearKeyTimeout);
										}
										keywords = scrollContainer.data("keys") || [];
										keywords.push(e.which);
										keywords.map(function(key)
										{
											keyString += String.fromCharCode(key);
										});
										jumpToItem(keyString);
									}

									scrollContainer.data("keys", keywords);
									clearKeyTimeout = setTimeout(function()
									{
										scrollContainer.data("keys", null);
									}, 1000);
								});

								// Open the dropdown, it should scroll to selected item.
								setTimeout(function()
								{
									jumpToItem(input.val());
								}, 100);
							}
							else
							{
								input.off(".input").on("input.input", function(e)
								{
									var text = input.val(), found = false,
										scrollContainer = typeahead.$menu;

									jumpToItem(text);
								});
							}
						}
					}
				})
					.on('mouseenter.kotypeahead', function()
					{
						if (!input)
						{
							input = $element.children(':enabled');
							ko.bindingHandlers.typeahead.bindTypeahead($element, option, true, bindingContext);
						}
						if (option.customizeCheck && option.customizeCheck($element) == false)
						{
							return;
						}
						if (input.data("typeahead"))
						{
							input.data("typeahead").mousedover = true;
						}
					})
					.on('mouseleave.kotypeahead', function()
					{
						if (!input)
						{
							input = $element.children(':enabled');
							ko.bindingHandlers.typeahead.bindTypeahead($element, option, true, bindingContext);
						}
						if (option.customizeCheck && option.customizeCheck($element) == false)
						{
							return;
						}
						if (input.data("typeahead"))
						{//input may disable, so no need mousedover
							input.data("typeahead").mousedover = false;
						}
					});
			}

			ko.utils.domNodeDisposal.addDisposeCallback(element, function()
			{
				$(element).removeData('typeahead-info').removeData('typehead-source').children("input").typeahead("destroy");
				$element.closest('.input-group').find('.caret:eq(0)').parent().off('click.kotypeahead');
			});
		},
		update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
		{
			var $element = $(element),
				typeaheadInfo = $element.data('typeahead-info'),
				bindingValue = ko.unwrap(valueAccessor()),
				source = ko.unwrap(bindingValue.source),
				option = ko.bindingHandlers.typeahead.getOption(bindingValue);
			if (!typeaheadInfo || !typeaheadInfo.input)
			{
				if ($element.children('input:text').length > 0)
				{
					ko.bindingHandlers.typeahead.bindTypeahead($element, ko.bindingHandlers.typeahead.getOption(bindingValue), false, bindingContext);
				}
				return;
			}
			if (!source || source.length == 0 || (!source[0].source && !source[0].displayName))
			{
				source = [{ displayName: '', source: source }];
			}

			//bind data source
			var sourceArray = [];
			for (var i in source)
			{
				source[i].source.map(function(d) { sourceArray.push(d); });
			}
			$element.data("typeheadDataSourceArray", sourceArray);

			$element.data('typehead-source', source);
			typeaheadInfo.input.typeahead('setSource', $.map(source, function(item)
			{
				return { displayName: item.displayName, source: option.notSort ? $.map(item.source, typeaheadInfo.format) : (option.sortWithOutFirstValue ? $.map(item.source.slice(0, 1), typeaheadInfo.format).concat($.map(item.source.slice(1, item.source.length), typeaheadInfo.format).sort().sort(function(a, b) { return a.toLowerCase() > b.toLowerCase() ? 1 : -1; })) : $.map(item.source, typeaheadInfo.format).sort().sort(function(a, b) { return a.toLowerCase() > b.toLowerCase() ? 1 : -1; })) }
			}));
		}.bind(this),
		getOption: function(bindingValue)
		{
			var options = {
				source: ko.unwrap(bindingValue.source),
				mustMatch: bindingValue.mustMatch ? bindingValue.mustMatch : false,
				drowDownShow: bindingValue.drowDownShow ? bindingValue.drowDownShow : false,
				selectedValue: bindingValue.selectedValue,
				notSort: bindingValue.notSort,
				sortWithOutFirstValue: bindingValue.sortWithOutFirstValue,
				customizeCheck: bindingValue.customizeCheck,
				isSelect: bindingValue.isSelect,
				showEmpty: bindingValue.showEmpty,
				optionDefault: bindingValue.optionDefault,
				template: bindingValue.template,
				format: (function(oranginFormat)
				{
					if ($.isFunction(oranginFormat))
					{
						return function(obj)
						{
							return oranginFormat(obj) ? oranginFormat(obj).toString() : '';
						};
					} else
					{
						return function(obj) { return obj.toString(); };
					}
				})(bindingValue.format)
			};

			if (bindingValue.class)
			{
				options.menu = "<ul class='typeahead dropdown-menu " + bindingValue.class + "' role='listbox'></ul>";
			}

			return options;
		},
		formatSourceToGroupSource: function(source)
		{
			if (!source || source.length == 0 || (!source[0].source && !source[0].displayName))
			{
				source = [{ displayName: '', source: source }];
			}
			return source;
		},
		formatDataToTypeaheadSource: function(source, format, notSort, sortWithOutFirstValue)
		{
			return $.map(source, function(item)
			{
				return { displayName: item.displayName, source: notSort ? $.map(item.source, format) : (sortWithOutFirstValue ? $.map(item.source.slice(0, 1), format).concat($.map(item.source.slice(1, item.source.length), format).sort().sort(function(a, b) { return a.toLowerCase() > b.toLowerCase() ? 1 : -1; })) : $.map(item.source, format).sort().sort(function(a, b) { return a.toLowerCase() > b.toLowerCase() ? 1 : -1; })) }
			});
		},
		bindTypeahead: function($element, option, autoFocus, bindingContext)
		{
			var input = $element.children();
			$element.data('typeahead-info', {
				input: input,
				format: option.format
			});
			if (input.data('typeahead'))
			{
				$element.undelegate('input:text', 'focus.kotypeahead');
				return;
			}
			option.source = this.formatSourceToGroupSource(option.source);
			$element.data('typehead-source', option.source);

			//update value when customer change value by type
			if (!option.isSelect)
			{
				input.on('blur', function(e)
				{
					if (!option.selectedValue)
					{
						return;
					}
					var selected = $.trim(input.val()), selectedNotTrim = input.val(), find = false;
					$.each($element.data('typehead-source'), function(i, groupSource)
					{
						$.each(groupSource.source, function(j, item)
						{
							var tmp = option.format(item);

							if (tmp === selected || tmp === selectedNotTrim)
							{
								option.selectedValue(item);
								find = true;
								return false;
							}
						});
					});

					if ((selected === '' || (find === false && option.mustMatch)) && selectedNotTrim === '')
					{
						option.selectedValue(null);
					}
				});
			}

			input.typeahead({
				source: this.formatDataToTypeaheadSource(option.source, option.format, option.notSort, option.sortWithOutFirstValue),
				mustMatch: option.mustMatch,
				minLength: 0,
				items: 'all',
				appendTo: "body",
				optionDefault: option.optionDefault,
				menu: option.menu,
				render: function(items, groupName)
				{
					var self = this;
					var activeFound = false;
					var isEmpty = items.length === 0;
					items = $(items).map(function(i, item)
					{
						var text = self.displayText(item), isDisable;
						if (text.indexOf("[disable]") >= 0)
						{
							text = text.substring("[disable]".length);
							isDisable = true;
						}
						i = $(self.options.item).data('value', item);
						if (isDisable)
						{
							i.addClass("disable");
						}
						i.find('a').html(self.highlighter(text));
						if (text == self.$element.val())
						{
							i.addClass('active selected');
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
						{
							i.data('groupName', groupName);
						}
						if (option.template)
						{
							i.html(option.template(item))
						}
						return i[0];
					});

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
				updater: function(selected, element)
				{
					if ($.isFunction(option.selectedValue))
					{
						var groupName;
						$.each($element.data('typehead-source'), function(i, groupSource)
						{
							$.each(groupSource.source, function(j, item)
							{
								if (element)
									groupName = element.data("groupName");
								if (option.format(item) === selected && (groupName ? item.groupName === groupName : true))
								{
									option.selectedValue(item);
									return false;
								}
							});
						});
					}
					return selected;
				},
				showEmpty: option.showEmpty != false ? '<div class="text-center text-danger">No results match your search</div>' : ''
			});

			//bind data source
			var sourceArray = [];
			for (var i in option.source)
			{
				sourceArray = sourceArray.concat(option.source[i].source);
			}
			$element.data("typeheadDataSourceArray", sourceArray);
			ko.bindingHandlers.typeahead.bindInputLostFouse($element, option, bindingContext);

			if (autoFocus)
			{
				input.trigger('focus');
			}

			// set the tab index on input type is select with the select typeahead
			var inputTabindex = input.attr("tabindex");
			if (Number(inputTabindex) >= 0)
			{
				input.attr("tabindex", inputTabindex);
				$element.parent().find(".input-group-btn button").attr("tabindex", inputTabindex);
			}
		},
		bindInputLostFouse: function($element, option, bindingContext)
		{
			//bind input blur
			var isInPopup = false;
			$element.delegate('input', 'blur.kotypeahead', function(e)
			{
				if (!isInPopup)
				{
					var selectData = $.grep($element.data("typeheadDataSourceArray"), function(n)
					{
						return option.format(n) === e.currentTarget.value;
					})[0];
					var matched = $element.html().match(/value:([^,]*)/);
					var $data = bindingContext.$data;
					if (matched.length === 2)
					{
						var str = matched[1];
						if (str.indexOf(".") >= 0)
						{
							str.split(".").forEach(function(s)
							{
								if (s.indexOf("()") >= 0)
								{
									$data = $data[s.match(/\w+/)[0]]();
								}
								else if (s.indexOf("$parents") >= 0)
								{
									$data = bindingContext.$parents[Number(s.substring(9, s.length - 1))];
								}
								else if (s.indexOf("$parent") >= 0)
								{
									$data = bindingContext.$parent;
								}
								else
								{
									$data = $data[s];
								}
							});
						}
						else
						{
							$data = $data[str];
						}
					}
					var value = !selectData ? (option.mustMatch ? "" : e.currentTarget.value) : option.format(selectData);

					if (option.optionDefault && value === option.optionDefault)
					{
						value = "";
					}
					if ($data && !ko.isComputed($data))
					{
						$data(value);
					} else
					{
						e.currentTarget.value = value;
					}
				}
			});

			$element.delegate(".typeahead li", "mouseenter.kotypeahead", function(e)
			{//useless, may need delete
				isInPopup = true;
			})
				.delegate(".typeahead li", "mouseleave.kotypeahead", function(e)
				{//useless, may need delete
					isInPopup = false;
				});

			var input = $element.children();

			var typeaheadInput = input.data('typeahead');
			if (typeaheadInput && typeaheadInput.$menu)
			{
				typeaheadInput.$menu.on("mouseenter", function(e)
				{// mouse in the div(may has scroll bar)
					this.mousedover = true;
				}.bind(typeaheadInput));

				typeaheadInput.$menu.on("mouseleave", function(e)
				{//mouse out the div (may has scroll bar)
					this.mousedover = false;
					if (!this.focused && this.shown) this.hide();
				}.bind(typeaheadInput));
			}
		}
	};
})();
