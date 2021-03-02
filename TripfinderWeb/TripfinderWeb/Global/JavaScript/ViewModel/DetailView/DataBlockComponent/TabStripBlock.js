(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").TabStripBlock = TabStripBlock;

	var CONFIRMATION_TITLE = "Confirmation Message",
		confirmMsg = "Are you sure you want to remove the Tab?";

	var DEFAULT_TABSTRIP_OPTION = {
		dataTextField: "Name",
		dataContentField: "Content",
		animation: false,
		preventScroll: true
	};

	var DEFAULT_NEW_TAB = {
		Name: "",
		Content: "<div class='grid-stack'></div>"
	};

	var MOCK_DATASOURCE = [{
		Name: "Tab1",
		Content: "<div class='grid-stack'></div>"
	}, {
		Name: "Tab2",
		Content: "<div class='grid-stack'></div>"
	}];

	function TabStripBlock(options, rootGridStack)
	{
		delete options.minHeight;

		var self = this,
			detailViewHelper = tf.helpers.detailViewHelper,
			tab = $("<div class='tab-strip-component'></div>");

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, rootGridStack.detailView);

		self.eventNameSpace = ".tabstrip-" + Date.now();

		self.titleHeight = 1;

		self.uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName();
		self.$el = $("<div class=\"tab-strip-stack-item grid-stack-item\">\
							<div class=\"grid-stack-item-content container-stack-item\">\
							</div>\
							<div class=\"group-mask\"></div>\
						</div>").addClass(self.uniqueClassName);
		self.$el.find(".grid-stack-item-content").append(tab);

		self.options = options;

		self.rootGridStack = rootGridStack;

		if (options.dataSource)
		{
			options.dataSource = options.dataSource.map(function(d)
			{
				return $.extend({}, d, {
					Name: d.Name,
					Content: MOCK_DATASOURCE[0].Content
				});
			});
		}

		self.dataSource = options.dataSource || MOCK_DATASOURCE;

		self.tabStrip = tab.kendoTabStrip($.extend({},
			DEFAULT_TABSTRIP_OPTION, {
			dataSource: self.dataSource,
			select: self.onSelect.bind(self),
			activate: self.onActivate.bind(self)
		})).data("kendoTabStrip");
		self.updateTabIcon();

		if (!self.isReadMode())
		{
			tab.addClass('edit-mode');
			self.$enableContainer = $("<div class='enable-edit'><div class='enable-tab'>Click to Edit Tab Area<span></span></div></div>");
			self.$enableContainer.insertAfter(tab);
			//For scrollable tab
			tab.append($("<span title='Add New Tab' class='k-link add-item scroll-add-icon'><span class='k-icon k-i-plus'></span></span>"));
		}
	}

	TabStripBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	TabStripBlock.prototype.initEvents = function()
	{
		var self = this;
		if (!self.isReadMode())
		{
			self.$el.find(".enable-edit").on("click", self.enableTabStatus.bind(self));
			self.tabStrip.tabGroup.on("click", "[data-type='remove']", self.removeTabEvent.bind(self))
				.on("click", "[data-type='add']", self.addNewTabEvent.bind(self));
			self.$el.find(".scroll-add-icon").on("click", self.addNewTabEvent.bind(self));
			self.rootGridStack.detailView.$element.find(".right-container.grid-stack-container")
				.on("click", ".tab-block-overlay-mask", self.disableTabStatus.bind(self));
			$(document).on("contextmenu" + self.eventNameSpace, "ul.k-tabstrip-items > li.k-item", function(e)
			{
				e.stopPropagation();

				var index = self.$el.find(".k-tabstrip-items li").index($(e.target).closest("li.k-item")),
					existingItems = self.tabStrip.dataSource.data().toJSON().map(function(i)
					{
						return i[DEFAULT_TABSTRIP_OPTION["dataTextField"]];
					}),
					selectedItemText = existingItems[index];
				if (index < 0)
				{
					return;
				}

				existingItems.splice(index, 1);

				var contextmenu = new TF.ContextMenu.TemplateContextMenu("workspace/detailview/EditTabStripTabName", {
					editTabName: function()
					{
						tf.modalManager.showModal(new TF.Modal.SingleInputModalViewModel({
							title: "Edit Tab Name",
							field: "Name",
							maxLength: 50,
							text: selectedItemText
						}))
							.then(function(tabName)
							{
								if (!!tabName)
								{
									self.updateTabName(index, tabName);
								}
							});
					},
					remove: function()
					{
						self.removeTab(index);
					},
					addBefore: function()
					{
						self.addNewTab(index);
					},
					addAfter: function()
					{
						self.addNewTab(index + 1);
					},
					isSingleTab: function()
					{
						return self.tabStrip.items().length <= 1;
					},
					moveLeft: function()
					{
						self.swapAdjacentTabs(index, index - 1);
					},
					moveRight: function()
					{
						self.swapAdjacentTabs(index, index + 1);
					},
					canMoveLeft: function()
					{
						return index > 0;
					},
					canMoveRight: function()
					{
						return index < self.tabStrip.items().length - 1;
					}
				}, function() { }),
					$visualTarget = $("<div/>").css({
						position: "absolute",
						left: window.screen.availWidth - e.clientX < 20 ? window.screen.availWidth - 20 : e.clientX,
						top: e.clientY
					}).appendTo("body");

				tf.contextMenuManager.showMenu($visualTarget, contextmenu);
			});

			$(document).on("contextmenu" + self.eventNameSpace, ".grid-stack-nested", function(e)
			{
				e.stopPropagation();
			});
		}

		self.$el.on("tabContentChanged", function()
		{
			self.resize();
		});
	};

	TabStripBlock.prototype.afterDomAttached = function()
	{
		var self = this;
		self.tabStrip.select(self.options.defaultIndex || 0);
		self.tabStrip._scrollable();
		self.initNestedGridStack();

		self.nestedGridStackBottomBlankHeight = self.nestedGridStacks.map(function(nestedGridStack)
		{
			return self.options.h - self.titleHeight - nestedGridStack.getOccupiedHeight();
		});
	};

	/**
	 * Resize tab and set min size at the same time.
	 */
	TabStripBlock.prototype.resize = function()
	{
		var self = this,
			actualHeight = self.getMinHeight(),
			actualWidth = self.getMinWidth();

		var nodecopy = self.$el.data("_gridstack_node");
		nodecopy.minHeight = actualHeight;
		nodecopy.minWidth = actualWidth;
		self.$el.data("_gridstack_node", nodecopy);

		var node = self.rootGridStack.grid.grid.nodes.find(function(node)
		{
			return node.el && node.el[0] == self.$el[0];
		});

		if (node)
		{
			node.minHeight = actualHeight;
			node.minWidth = actualWidth;
		}

		var height = Math.max(Number(self.$el.attr("data-gs-height")), actualHeight);

		self.rootGridStack.grid.grid.moveNode(node, node.x, node.y, node.width, height);
		self.tabStrip._scrollable();
	};

	TabStripBlock.prototype.initNestedGridStack = function()
	{
		var self = this;

		self.nestedGridStacks = [];
		self.tabStrip.element.find(".grid-stack").each(function(_, el)
		{
			var nestedGridStack = new TF.DetailView.LightGridStack($(el), {
				gridstackOptions: {
					cellHeight: self.rootGridStack.getCellHeight(),
					verticalMargin: 1
				},
				viewModel: self.rootGridStack.detailView
			});
			nestedGridStack.setStatic(true);
			self.nestedGridStacks.push(nestedGridStack);
		});

		self.dataSource.forEach(function(d, index)
		{
			if (d.items)
			{
				d.items.forEach(function(item, index)
				{
					item.mapToolOptions = self.options.mapToolOptions;
				});
			}
			self.nestedGridStacks[index].addStackBlocks({
				width: self.options.w,
				items: d.items
			});
		});
	};

	/**
	 * The max height of all nested grid stack panel is the min height of tab block
	 * And nested grid stack panel min height is 1.
	 */
	TabStripBlock.prototype.getMinHeight = function()
	{
		var self = this,
			height = Math.max.apply(null, self.nestedGridStacks.map(function(nestedGridStack)
			{
				return nestedGridStack.getOccupiedHeight();
			}));

		//Ensure tab panel min height is 1
		return Math.max(height, 1) + self.titleHeight;
	};

	/**
	 * The max width of all nested grid stack panel is the min width of tab block
	 */
	TabStripBlock.prototype.getMinWidth = function()
	{
		var self = this;
		return Math.max.apply(null, self.nestedGridStacks.map(function(nestedGridStack)
		{
			return nestedGridStack.getOccupiedWidth();
		}));
	};

	TabStripBlock.prototype.setTabDragStatus = function(status)
	{
		var disable = (status == 'disable')
		if (disable)
		{
			$('.tab.data-point-item.ui-draggable').addClass('no-drag')
			$('.tab.data-point-item.ui-draggable').attr('ondragstart', 'return false');
			$('.tab.data-point-item.ui-draggable').attr('title', 'Tab cannot be dragged int a tab ');
		} else
		{
			$('.tab.data-point-item.ui-draggable').removeClass('no-drag')
			$('.tab.data-point-item.ui-draggable').removeAttr('ondragstart');
			$('.tab.data-point-item.ui-draggable').attr('title', '');
		}
	};

	TabStripBlock.prototype.disableTabStatus = function(e)
	{
		if (e)
		{
			e.stopPropagation();
		}
		var self = this;
		self.setTabDragStatus('enable');
		self.$enableContainer.show();
		self.$el.closest(".right-container.grid-stack-container").find(".tab-strip-stack-item").removeClass("active");
		self.$el.closest(".doc").find(".data-point-container").removeClass("tab-enabled");
		self.$el.closest(".detail-view").find(".type-selector").removeClass("tab-enabled");
		self.rootGridStack.setStatic(false);
		self.nestedGridStacks.forEach(function(gridstack)
		{
			gridstack.setStatic(true);
		});
		self.$el.closest(".right-container.grid-stack-container").find(".tab-block-overlay-mask").remove();
		self.rootGridStack.detailView.dataPointPanel.detailViewColumnChanged();
	};

	TabStripBlock.prototype.enableTabStatus = function(e)
	{
		var self = this;
		self.setTabDragStatus('disable');
		self.$el.find(".ui-resizable-handle").css('display', 'none')
		$(e.currentTarget).closest(".right-container.grid-stack-container").append("<div class=\"tab-block-overlay-mask\"></div>");
		self.$enableContainer.hide();
		$(e.currentTarget).closest(".tab-strip-stack-item").addClass("active");
		self.$el.closest(".doc").find(".data-point-container").addClass("tab-enabled");
		self.$el.closest(".detail-view").find(".type-selector").addClass("tab-enabled");
		self.rootGridStack.setStatic(true);
		var stack = self.nestedGridStacks[self.getCurrentIndex()];
		if (stack)
		{
			stack.detailView.dataPointPanel.detailViewColumnChanged(null, stack.getCurrentWidth());
			stack.setStatic(false);
		}
	};

	TabStripBlock.prototype.removeTabEvent = function(e)
	{
		e.preventDefault();
		e.stopPropagation();
		var item = $(e.target).closest(".k-item");
		this.removeTab(item.index());
	};

	TabStripBlock.prototype.removeTab = function(index)
	{
		var self = this;
		tf.promiseBootbox.yesNo(confirmMsg, CONFIRMATION_TITLE)
			.then(function(result)
			{
				if (result)
				{
					var tabStrip = self.tabStrip,
						items = tabStrip.items(),
						isRemovingActiveTab = false;

					//Don't delete last tab.
					if (items.length > 1 && items[index] != null)
					{
						if ($(items[index]).hasClass('k-state-active'))
						{
							isRemovingActiveTab = true;
						}
						tabStrip.dataSource.remove(tabStrip.dataSource.data()[index]);
						if (isRemovingActiveTab)
						{
							tabStrip.select(index < 1 ? 0 : index - 1);
						}

						self.detailView.dataPointPanel.removeTab(self.nestedGridStacks[index].dataBlocks);
						self.nestedGridStacks[index].dispose();
						self.nestedGridStacks.splice(index, 1);
						tabStrip._scrollable();
					}
				}
			});
	};

	TabStripBlock.prototype.addNewTabEvent = function(e)
	{
		e.preventDefault();
		e.stopPropagation();
		this.addNewTab();
	};

	TabStripBlock.prototype.addNewTab = function(index)
	{
		var self = this,
			newTab = $.extend({}, DEFAULT_NEW_TAB),
			currentTabCount = self.tabStrip.dataSource.data().length,
			itemsLength = self.tabStrip.items().length;

		var newTabNameIndex = currentTabCount + 1;
		var newTabName = "Tab" + newTabNameIndex;
		while (self.tabStrip.dataSource.data().some(function(d)
		{
			return d.Name === newTabName;
		}))
		{
			newTabNameIndex++;
			newTabName = "Tab" + newTabNameIndex;
		};

		newTab[DEFAULT_TABSTRIP_OPTION["dataTextField"]] = newTabName;

		if (index == null || index === itemsLength)
		{
			self.tabStrip.dataSource.add(newTab);
			self.updateTabIcon(true);
		} else
		{
			self.tabStrip.dataSource.insert(index, newTab);
			self.updateTabIcon(true, index);
		}

		self.tabStrip.element.find(".grid-stack").each(function(index, el)
		{
			if (!$(el).data("gridstack"))
			{
				var nestedGridStack = new TF.DetailView.LightGridStack($(el), {
					gridstackOptions: {
						cellHeight: self.rootGridStack.getCellHeight(),
						verticalMargin: 1
					},
					viewModel: self.rootGridStack.detailView
				});
				nestedGridStack.setStatic(false);

				var tabWidth = Number($(el).closest(".tab-strip-stack-item").attr("data-gs-width"));
				nestedGridStack.setGridWidth(tabWidth);
				self.nestedGridStacks.splice(index, 0, nestedGridStack);
			}
		});

		self.tabStrip.select(index == null ? itemsLength : index);
	};

	TabStripBlock.prototype.updateTabName = function(index, name)
	{
		var self = this,
			currentIndex = self.getCurrentIndex(),
			index = (index === null || index === undefined) ? currentIndex : index;

		self.tabStrip.dataSource.data()[index][DEFAULT_TABSTRIP_OPTION["dataTextField"]] = name;
		self.tabStrip.element.find('ul>li').eq(index).find('.k-link').first().text(name)
		self.tabStrip.select(index);
		self.tabStrip._scrollable();
	};

	TabStripBlock.prototype.updateTabIcon = function(isSingleTab, index)
	{
		if (this.isReadMode())
		{
			return;
		}
		var tabsElements = this.$el.find('li[role="tab"]');
		if (isSingleTab)
		{
			if (index == null)
			{
				tabsElements = tabsElements.last();
			} else
			{
				tabsElements = tabsElements.eq(index);
			}
		}
		tabsElements.append('<span data-type="remove" title="Remove Tab" class="k-link remove-item"><span class="k-icon k-i-close"></span></span>');
		tabsElements.append('<span data-type="add" title="Add a New Tab" class="k-link add-item"><span class="k-icon k-i-plus"></span></span>');
		this.tabStrip._scrollable();
	};

	TabStripBlock.prototype.swapAdjacentTabs = function(sourceTabIndex, targetTabIndex)
	{
		var self = this,
			tabStrip = self.tabStrip,
			tabCount = tabStrip.items().length,
			leftTab, rightTab,
			swapItems = function(items, i, j)
			{
				var t = items[i];
				items[i] = items[j];
				items[j] = t;
			};

		if (targetTabIndex === sourceTabIndex)
		{
			return;
		}
		else if (targetTabIndex < sourceTabIndex)
		{
			if (targetTabIndex < 0) return;
		}
		else
		{
			if (targetTabIndex >= tabCount) return;
		}

		// Move left-side tab to the right of right-side tab
		leftTab = tabStrip.tabGroup.children().eq(Math.min(sourceTabIndex, targetTabIndex))
		rightTab = tabStrip.tabGroup.children().eq(Math.max(sourceTabIndex, targetTabIndex));
		tabStrip.insertAfter(leftTab, rightTab);

		// Update the items' order in "nestedGridStacks and dataSource colletion"	
		swapItems(tabStrip.dataSource.data(), sourceTabIndex, targetTabIndex);
		swapItems(self.nestedGridStacks, sourceTabIndex, targetTabIndex);

		// Mark original source Tab as selected
		tabStrip.select(targetTabIndex);
	};

	TabStripBlock.prototype.getCurrentIndex = function()
	{
		var tabs = this.$el.find(".tab-strip-component>.k-content");
		var current = tabs.filter('.k-state-active')[0];
		if (current)
		{
			return this.$el.find(".tab-strip-component>.k-content").index(current)
		}
		else
		{
			return 0
		}
	};

	TabStripBlock.prototype.onSelect = function(e)
	{
		var self = this,
			index = self.$el.find(".k-tabstrip-items li").index(e.item);

		if (!self.nestedGridStacks) return;

		if (!self.isReadMode())
		{
			self.nestedGridStacks.forEach(function(gridstack, i)
			{
				gridstack.setStatic(i !== index);
			});
		}
	};

	TabStripBlock.prototype.onActivate = function(e)
	{
		var self = this;

		if (!self.nestedGridStacks) return;

		tf.helpers.detailViewHelper.updateSectionHeaderTextInputWidth(undefined, self.nestedGridStacks[self.getCurrentIndex()].$wrapper);
		self.rootGridStack.detailView.manageLayout();
	};

	TabStripBlock.prototype.dispose = function()
	{
		var self = this;
		self.$el.find(".scroll-add-icon").off("click");
		self.$el.find(".enable-tab").off("click");
		self.tabStrip.tabGroup.off("click");
		self.rootGridStack.detailView.$element.find(".right-container.grid-stack-container").off("click", ".tab-block-overlay-mask");
		$(document).off(self.eventNameSpace);

		if (self.nestedGridStacks)
		{
			self.nestedGridStacks.forEach(function(gridstack, i)
			{
				gridstack.dispose();
			});
		}
	};
})();