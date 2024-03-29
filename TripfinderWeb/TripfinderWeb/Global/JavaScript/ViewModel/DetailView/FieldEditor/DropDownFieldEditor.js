(function()
{
	createNamespace("TF.DetailView.FieldEditor").DropDownFieldEditor = DropDownFieldEditor;

	const DEFAULT_NULL_AVATAR = "(None)";
	const DEFAULT_NULL_VALUE = -999;//means DBNull

	function DropDownFieldEditor(type)
	{
		var self = this;

		TF.DetailView.FieldEditor.NonInputFieldEditor.call(self, type);
		self.obStopped = ko.observable(false);
		self.obIsFetchingData = ko.observable(false);

		self.virtualScrollContext = null;
		self._selectedIndex = null;
		self._selectedItem = null;
		self.maxItemsCount = 500;
		self.quickSearchHelper = new TF.Helper.QuickSearchHelper(".menu-label", ["(none)"], self._findAllElements.bind(self), self.select.bind(self), self);
	};

	DropDownFieldEditor.prototype = Object.create(TF.DetailView.FieldEditor.NonInputFieldEditor.prototype);

	DropDownFieldEditor.prototype.constructor = DropDownFieldEditor;

	DropDownFieldEditor.prototype._initElement = function(options)
	{
		this._$element = $("<div></div>");
		this._$element.css({
			"position": "absolute",
			"height": "1px",
			"width": "1px",
			"outline": "none"
		});
		this._$parent.append(this._$element);
		this._$element.focus();

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._initElement.call(this, options);
	};


	DropDownFieldEditor.prototype._findElement = function(index)
	{
		if (this.virtualScrollContext)
		{
			var $menu = this._contextMenu.$menuContainer.find(".dropdown-editor-menu");

			var firstIndex = $menu.find("li:not('.title'):nth(0)").attr("item-index");
			var maxCount = parseInt(this.virtualScrollContext.$element.height() / this.virtualScrollContext.singleHeight)

			if (Math.abs(index - firstIndex) + 1 > maxCount)
			{
				var matchedItem = this.virtualScrollContext.source[index];
				this.virtualScrollContext.resultListBox.scrollToItem(matchedItem);

				$menu.focus();
			}

			return $menu.find("li:not('.title')[item-index=" + index + ']');
		}
		else
		{
			var $menu = this._contextMenu.$menuContainer.find(".dropdown-editor-menu");

			return $menu.find("li:not('.title'):nth(" + index + ")");
		}
	};

	DropDownFieldEditor.prototype._findAllElements = function()
	{
		if (!this._contextMenu) return;

		var $menu = this._contextMenu.$menuContainer.find(".dropdown-editor-menu");

		return $menu.find("li:not('.title')");
	};

	DropDownFieldEditor.prototype.select = function(index)
	{

		if (this._selectedIndex)
		{
			this._findElement(this._selectedIndex).removeClass("document-hover");
		}

		this._selectedIndex = index;

		var $currentItem = this._findElement(index);

		$currentItem.focus();
		$currentItem.addClass("document-hover");
	};

	DropDownFieldEditor.prototype.nextActiveItem = function(up)
	{
		if (this._contextMenu == null) return;

		var self = this,
			length = 0;

		if (self.virtualScrollContext)
		{
			length = self.virtualScrollContext.source.length;
		}
		else
		{
			length = self._findAllElements().length;
		}

		if (self._selectedIndex == null)
		{
			self.select(up ? (length - 1) : 0);
		}
		else
		{
			var newIndex = self._selectedIndex + (up ? -1 : 1);
			if (newIndex >= length)
			{
				newIndex = 0;
			}
			else if (newIndex < 0)
			{
				newIndex = length - 1;
			}
			self.select(newIndex);
		}
	};

	DropDownFieldEditor.prototype._bindEvents = function()
	{
		var self = this;
		self._bindMouseEnterEvent();
	};

	/**
	 * Update drop down menu position and size.
	 *
	 */
	DropDownFieldEditor.prototype._updateDropDownPosition = function()
	{
		var self = this,
			$menu = self._contextMenu.$menuContainer,
			$content = self.getContentElement(),
			screenHeight = $(window).height(),
			containerWidth = Math.ceil(self._$parent.outerWidth());

		$menu.css("width", containerWidth);
		if ($content.length > 0)
		{
			$menu.css("left", self._$parent.offset().left - $content.offset().left + 1);
		}

		var bottomAvailableSpace = screenHeight - $content.offset().top - self._contextMenu.handleHeight,
			topAvailableSpace = $content.offset().top, menuHeight = $menu.outerHeight();

		if (menuHeight < bottomAvailableSpace)
		{
			$menu.css("top", self._contextMenu.handleHeight);
		}
		else if (menuHeight < topAvailableSpace)
		{
			$menu.css("top", -$menu.outerHeight());
		}
		else
		{
			if (topAvailableSpace > bottomAvailableSpace)
			{
				$menu.find("ul").css("max-height", topAvailableSpace - 20);
				$menu.css("top", -$menu.outerHeight());
			}
			else
			{
				$menu.find("ul").css("max-height", bottomAvailableSpace - 20);
				$menu.css("top", self._contextMenu.handleHeight);
			}
		}
	};

	DropDownFieldEditor.prototype._bindMouseEnterEvent = function()
	{
		$('.menu-label').on('mouseenter' + this._eventNamespace, function(e)
		{
			var $this = $(this);  // this - HTMLDivElement
			if (this.offsetWidth < this.scrollWidth && !$this.attr('title'))
			{
				$this.attr('title', $this.text());
			}
		});
	};

	DropDownFieldEditor.prototype._showDropDown = function()
	{
		var self = this, options = self.options;

		self.obIsFetchingData(true);
		self._getDataSource(options.recordId).then(function(dropDownSource)
		{
			self.obIsFetchingData(false);
			if (self.obStopped()) return;

			dropDownSource = dropDownSource.map(item =>
			{
				if (!(item instanceof Object))
				{
					return {
						text: item,
						value: item
					};
				}

				return item;
			});

			if (self.options.title == "Route Name")
			{
				self.dropDownSource = dropDownSource;
			} else
			{
				self.dropDownSource = self._sortByAlphaOrderWithTitles(dropDownSource);
			}

			var allowNullValue = options ? options.allowNullValue : false;

			if (allowNullValue)
			{
				self.dropDownSource.unshift({
					'text': options.nullAvatar || DEFAULT_NULL_AVATAR,
					'value': DEFAULT_NULL_VALUE
				});
			}

			var selectedValue = self._isKeyValid(options.defaultValue) ? options.defaultValue : DEFAULT_NULL_VALUE;
			if (self._selectedItem)
			{
				selectedValue = self._selectedItem.value;
			}

			self._createDropDown(self.dropDownSource, selectedValue);
		});

		if (TF.isMobileDevice && $(".grid-stack-container").length)
		{
			$(".grid-stack-container").on('touchmove' + self._eventNamespace, function(e)
			{
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
		}
	};

	DropDownFieldEditor.prototype._createDropDown = function(source, selectedValue)
	{
		var self = this, dropDownMenuViewModel;
		// If there are more than maxItemsCount(default 500) items, use virtual scrolling list box.
		if (source.length > self.maxItemsCount)
		{
			dropDownMenuViewModel = new TF.Control.FieldEditor.VirtualScollingEditorMenuViewModel(source, selectedValue);


			self._contextMenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/detailview/fieldeditor/VirtualScrollingEditorMenu",
				dropDownMenuViewModel
			);

			self.virtualScrollContext = dropDownMenuViewModel;
		}
		else
		{
			dropDownMenuViewModel = new TF.Control.FieldEditor.DropDownEditorMenuViewModel(source, selectedValue);

			self._contextMenu = new TF.ContextMenu.TemplateContextMenu(
				"workspace/detailview/fieldeditor/dropdowneditormenu",
				dropDownMenuViewModel
			);
		}

		dropDownMenuViewModel.itemSelected.subscribe(function(e, selectedItem)
		{
			if (selectedItem != null)
			{
				self._selectedItem = selectedItem;
				self.setValue(selectedItem.value === -999 ? "" : selectedItem.text);
				self.save(selectedItem);
			}
		});

		dropDownMenuViewModel.afterMenuRender.subscribe(function()
		{
			self._updateDropDownPosition();
			var $menu = self._contextMenu.$menuContainer.find(".dropdown-editor-menu");
			$menu.attr('tabindex', 0);
			$menu.focus();
			self._contextMenu.$container.off('mouseout');  // Do not hide menu when mouse out.
			self._bindEvents();

			$menu.find("li.menu-item-checked").focus();
			self._$menu = $menu;
			dropDownMenuViewModel.scrollToSelected && dropDownMenuViewModel.scrollToSelected();

			var $content = self.getContentElement();
			$menu.off(`keydown${self._eventNamespace}`).on(`keydown${self._eventNamespace}`, function(e)
			{
				if ($content.css('display') === 'none')
				{
					return;
				};
				var keyCode = e.keyCode || e.which;

				if (self._contextMenu && keyCode !== $.ui.keyCode.UP && keyCode !== $.ui.keyCode.DOWN)
				{
					self.quickSearchHelper.quickSearch(e);
				}

				switch (keyCode)
				{
					case $.ui.keyCode.ESCAPE:
						self.closeWidget();
						break;
					case $.ui.keyCode.UP:
						self.nextActiveItem(true);
						e.preventDefault();
						e.stopPropagation();
						break;
					case $.ui.keyCode.DOWN:
						self.nextActiveItem(false);
						e.preventDefault();
						e.stopPropagation();
						break;
					case $.ui.keyCode.ENTER:
						if (self._selectedIndex != null)
						{
							self._findElement(self._selectedIndex).trigger("click");
						}
						else
						{
							self.toggleDropDown();
						}
						e.stopPropagation();
						break;
				}
			});
		});

		tf.contextMenuManager.showMenu(self.getContentElement(), self._contextMenu);
	};

	DropDownFieldEditor.prototype.toggleDropDown = function()
	{
		if (this._contextMenu)
		{
			this.closeDropDown();
			return;
		}

		this._showDropDown();
	};

	DropDownFieldEditor.prototype.editStart = function($parent, options)
	{
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.editStart.call(this, $parent, options);

		var self = this,
			$content = self.getContentElement();

		if (!$content) return;

		if ($content.css('display') !== 'none')
		{
			self.options = options;
			self.options.previousValue = $content.text();

			if (options.showWidget)
			{
				self._showDropDown();
			}

		}
	};

	DropDownFieldEditor.prototype.bindEvents = function()
	{
		var self = this,
			$content = self.getContentElement();

		$(document).off(`click${self._eventNamespace}`).on(`click${self._eventNamespace}`, function(e)
		{
			if ($content.css('display') === 'none')
			{
				return;
			};

			// if dropdown list items already shown, it won't trigger dispose
			if (!self._$menu || self._$menu.has($(e.target)).length === 0)
			{
				self.editStop();
			}
		});

		self._$parent.off(`click${self._eventNamespace}`).on(`click${self._eventNamespace}`, function(e)
		{
			if ($content.css('display') === 'none')
			{
				return;
			};
			e.stopPropagation();
			self.toggleDropDown();
		});

		$(window).on("resize" + self._eventNamespace, function()
		{
			if ($content.css('display') === 'none')
			{
				return;
			};
			self.closeWidget();
		});

		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.bindEvents.call(self);
	}

	DropDownFieldEditor.prototype._getDataSource = function(recordId)
	{
		var data = this.getContainerElement().data(),
			editType = data.editType,
			entity = $.extend({}, this.options.recordEntity),
			modifications = this.options.editFieldList;

		for (var key in modifications)
		{
			entity[key] = modifications[key].value;
		}

		return editType.getSource(recordId, entity);
	};

	DropDownFieldEditor.prototype._updateParentContent = function(text)
	{
		var self = this,
			$content = self.getContentElement();

		if (text !== null)
		{
			$content.text(text);
		}
	};

	DropDownFieldEditor.prototype.hide = function()
	{
		var self = this;
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.hide.call(self);

		self.closeWidget();
		self._$menu = null;
	};

	DropDownFieldEditor.prototype.doSave = function(selectedItem)
	{
		var self = this;

		self._updateParentContent(selectedItem.text);
		if (selectedItem.value === DEFAULT_NULL_VALUE)
		{
			self.apply(null);
		}
		else
		{
			self.apply(selectedItem.value, selectedItem.text);
		}

		self.closeDropDown();
	};

	DropDownFieldEditor.prototype.save = function(selectedItem)
	{
		var self = this;
		if (self.obIsFetchingData())
		{
			self.obStopped(true);
		}
		else
		{
			self.doSave(selectedItem);
		}
	};

	DropDownFieldEditor.prototype.editStop = function()
	{
		var self = this;
		self.obStopped(true);
		self.hide();
		self.editStopped.notify();
		self.dispose();
		return Promise.resolve();
	};

	DropDownFieldEditor.prototype.closeWidget = function()
	{
		if (this._contextMenu)
		{
			this._contextMenu.$menuContainer.trigger("contextMenuClose");
			if (TF.isMobileDevice && $(".grid-stack-container").length)
			{
				$(".grid-stack-container").off('touchmove' + this._eventNamespace);
			}
		}
	};

	/**
	 * Check if the key is empty.
	 *
	 * @param {any} key
	 * @returns
	 */
	DropDownFieldEditor.prototype._isKeyValid = function(key)
	{
		return (
			(key !== undefined || key !== null)
			&& ((typeof key === "string" && !!key.trim())
				|| (typeof key === "boolean")
				|| (typeof key === "number"))
		);
	};

	DropDownFieldEditor.prototype._sortByAlphaOrderWithTitles = function(source)
	{
		var groups = [], currentGroup = [];

		source.forEach(function(item)
		{
			if (item.isTitle)
			{
				if (currentGroup.length > 0)
				{
					groups.push(currentGroup);
				}

				currentGroup = [];
			}

			currentGroup.push(item);
		});

		groups.push(currentGroup);

		if (groups.length > 1)
		{
			var sortedSource = [];
			groups.forEach(function(group)
			{
				sortedSource.push(group[0]);//title item
				sortedSource = sortedSource.concat(Array.sortBy(group.slice(1), "text"));
			});

			return sortedSource;
		}
		else
		{
			return Array.sortBy(source, "text");
		}
	};

	DropDownFieldEditor.prototype.closeDropDown = function()
	{
		var self = this;
		if (self._contextMenu != null)
		{
			self._contextMenu.$menuContainer.trigger("contextMenuClose");
			self._contextMenu.dispose();
			self._contextMenu = null;
		}
		self._selectedIndex = null;
		tf.dropdownExpanded = false;
	};

	DropDownFieldEditor.prototype._getAppliedResult = function(data, value, text)
	{
		var self = this,
			result = TF.DetailView.FieldEditor.NonInputFieldEditor.prototype._getAppliedResult.call(self, data, value, text);

		result.selectPickListOptionIDs = (value === null || value === undefined) ? [] : [value];
		result.selectedItem = self._selectedItem;
		return result;
	};

	/**
	 * Dispose this editor.
	 *
	 */
	DropDownFieldEditor.prototype.dispose = function()
	{
		TF.DetailView.FieldEditor.NonInputFieldEditor.prototype.dispose.call(this);

		this.quickSearchHelper.dispose();
		$(window).off(this._eventNamespace);
		$(document).off(this._eventNamespace);
		this._$parent.off(this._eventNamespace);
		if (TF.isMobileDevice)
		{
			$(".grid-stack-container").off('touchmove' + this._eventNamespace);
		}
	};
})();