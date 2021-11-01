(function()
{
	createNamespace("TF.Map").BaseMapTool = BaseMapTool;

	const DIVSTRING = "<div></div>";
	const TOOLICON = ".tool-icon";
	const MAPTOOLLABELFIX = ".map-tool-label-fix";
	const FONTWEIGHT = "font-weight";

	function BaseMapTool($container, options)
	{
		var self = this;
		self.$container = $container;
		self.rootMenuItem = null;
		self.toolbarItems = null;
		self.isReadMode = options.isReadMode;
		self.isDetailView = options.isDetailView;
		self.isLandscape = options.isLandscape;

		options.mapToolOptions = options.mapToolOptions || {};
		self.afterMapToolActive = options.mapToolOptions.afterMapToolActive ||
			function()
			{
				// This is intentional
			};
		self.afterMapToolInactive = options.mapToolOptions.afterMapToolInactive ||
			function()
			{
				// This is intentional
			};

		self.toolkitBtnClickEventEnable = false;
		self.toolkitBtnClickEvent = new TF.Events.Event();
		self.init();
	}
	/**
	 * Intialization.
	 * @return {void}
	 */
	BaseMapTool.prototype.init = function()
	{
		var self = this;
		self.GetMenuItems();
		self.GetLocationMarkerToolbarItems();
		var menuItem = self.rootMenuItem;
		var firstLevelMenuItems = menuItem.children;
		self.BuildFirstLevelMenuItems(firstLevelMenuItems);
		self.BuildLocationMarkerToolbar(self.toolbarItems);
		self.onWindowResize = function()
		{
			self.hideSubMenu();
			var item = null;
			self.rootMenuItem.children.some(function(child)
			{
				if (child.isActive)
				{
					item = child;
					return true;
				}
			});
			if (item)
			{
				self.openSubMenu.call(self, item);
			}
		};
		$(window).bind('resize', self.onWindowResize);
		if (self.$offMapTool)
		{
			self.$offMapTool.on('click', self.hideSubMenu.bind(self));
		}
	};

	BaseMapTool.prototype.GetMenuItems = function()
	{
		// This is intentional
	};

	BaseMapTool.prototype.GetLocationMarkerToolbarItems = function()
	{
		// This is intentional
	};

	BaseMapTool.prototype.BuildLocationMarkerToolbar = function(items)
	{
		if (!items)
		{
			return;
		}

		var self = this,
			$mapToolBar = $("<ul></ul>", { class: "map-tool-bar" });
		if (TF.isMobileDevice)
		{
			$mapToolBar.addClass("is-mobile");
			$mapToolBar.css({ right: '70px', top: '24px' });
		}
		else
		{
			$mapToolBar.css({ right: '80px', top: '24px' });
		}

		self.$mapToolBar = $mapToolBar;

		for (const item of items)
		{
			const $newToolbarItem = $("<li></li>", { class: "map-tool-bar-item", title: item.title });
			$newToolbarItem.addClass("toolbar-item-" + item.title.toLowerCase());
			if (item.icon)
			{
				$newToolbarItem.addClass(item.icon);
			}
			$newToolbarItem.click(item.onclick.bind(item));
			$mapToolBar.append($newToolbarItem);
		}

		self.$container.append($mapToolBar);
	}

	BaseMapTool.prototype.BuildFirstLevelMenuItems = function(items)
	{
		var self = this,
			$mapTool = $(DIVSTRING, { class: "on-map-tool" }),
			$offMapTool = $(DIVSTRING, { class: "off-map-tool tool-menu" }),
			$toolkitButton = $(DIVSTRING, { class: "map-tool-btn tool-icon animate" }),
			$maskBackground = $(DIVSTRING, { class: "map-tool-background animate" }),
			$mapToolContainer = $(DIVSTRING, { class: "map-tool-container" }),
			$mapToolLabel = $(DIVSTRING, { class: "map-tool-label map-tool-label-fix animate" }),
			$appliedGeoSearchIcon = $(DIVSTRING, { class: "map-applied-geo-search tool-icon animate" });

		$toolkitButton.click(self.toolkitBtnClick.bind(self));
		$maskBackground.click(self.toolkitBtnClick.bind(self));
		$mapToolLabel.click(self.toolkitBtnClick.bind(self));
		$mapToolContainer.append($mapToolLabel);

		if (!(this.isDetailView && !this.isReadMode) && this.rootMenuItem.children.length > 0)
		{
			$offMapTool.append($maskBackground, $toolkitButton, $mapToolContainer, $appliedGeoSearchIcon);
		}

		$toolkitButton.css('top', '15px');
		$offMapTool.css('display', 'block');
		$mapToolContainer.css('right', '15px');
		$mapToolContainer.css('top', '15px');
		$appliedGeoSearchIcon.css('right', '75px');
		$appliedGeoSearchIcon.css('top', '15px');
		$appliedGeoSearchIcon.css('display', 'none');

		self.$container.append($mapTool);
		self.$container.append($offMapTool);

		self.$mapTool = $mapTool;
		self.$offMapTool = $offMapTool;
		self.$toolkitButton = $toolkitButton;
		self.$maskBackground = $maskBackground;
		self.$mapToolContainer = $mapToolContainer;
		self.$mapToolLabel = $mapToolLabel;
		self.$appliedGeoSearchIcon = $appliedGeoSearchIcon;
		// build ball
		items.map(function(item)
		{
			item.onclick = item.onclick.createInterceptor(self.openSubMenu.bind(self)).bind(this, item);
			self.addTool(item.icon, item.header, item.onclick, item);
		});
	};

	/**
	 * Append a new tool.
	 * @param {string} name The tool name
	 * @param {string} label The tool label to be displayed
	 * @param {Function} clickFunc The function to be triggered when the icon is clicked
	 * @return {void}
	 */
	BaseMapTool.prototype.addTool = function(name, label, clickFunc, item, Sequence)
	{
		var self = this, sequence = Sequence ? Sequence : self.$mapToolContainer.find(TOOLICON).length + 1,
			$toolBtn = $("<div></div>", { class: "tool-icon animate", title: label }),
			$label = $("<label></label>", { text: label });

		if (self.isLandscape)
		{
			$toolBtn.attr("title", label);
		}

		$toolBtn.addClass(name);
		$toolBtn.addClass("sequence-" + sequence);
		$toolBtn.click(clickFunc.bind(self));
		self.$mapToolContainer.append($toolBtn);
		$label.click(clickFunc.bind(self));
		if (Sequence)
		{
			self.$mapToolLabel.find('label').eq(sequence - 2).after($label);
		}
		else
		{
			self.$mapToolLabel.append($label);
		}
		item.target = $toolBtn;
	};

	BaseMapTool.prototype.insertTool = function(name, label, clickFunc, item, insertAtSequence)
	{
		var self = this, count = self.$mapToolContainer.find(TOOLICON).length;
		for (var i = 0; i < count; i++)
		{
			if (i >= insertAtSequence - 1)
			{
				$(self.$mapToolContainer.children()[i + 1]).removeClass(`sequence-${(i + 1)}`);
				$(self.$mapToolContainer.children()[i + 1]).addClass(`sequence-${(i + 2)}`);
			}

		}
		self.addTool(name, label, clickFunc, item, insertAtSequence);
	};

	BaseMapTool.prototype.removeTool = function(sequence)
	{
		var self = this, count = self.$mapToolContainer.find(TOOLICON).length;
		for (var i = 1; i <= count; i++)
		{
			if ($(self.$mapToolContainer.children()[i]).hasClass("sequence-" + sequence))
			{
				$(self.$mapToolContainer.children()[i]).remove();
			}
			if (i >= sequence)
			{
				$(self.$mapToolContainer.children()[i]).removeClass(`sequence-${(i + 1)}`);
				$(self.$mapToolContainer.children()[i]).addClass("sequence-" + i);
			}
		}
		$(self.$mapToolLabel.children()[sequence - 1]).remove();

	}

	/**
	 * Toggle the display status of the map toolkit.
	 * @param {bool} status The display status of the map toolkit.
	 * @return {void}
	 */
	BaseMapTool.prototype.toggleMapToolDisplayStatus = function(status)
	{
		var self = this;
		status = (status !== undefined) ? status : !self.$offMapTool.hasClass("active");
		var positionChangeElements = self.$offMapTool.find(".map-tool-container").add(self.$toolkitButton);
		if (status)
		{
			// append to doc to avoid overflow hidden when map is too small in detail view
			// use setTimeout to enable animation
			var docContainer = self.$mapTool.closest(".doc");
			if (docContainer.length === 0)
			{
				docContainer = $("body").find(".tabstrip-userdefinedfields").closest(".doc");
			}
			var offset = self.$mapTool.offset(),
				//docContainer = $("body").find(".tabstrip-userdefinedfields"),
				docContainerOffset = docContainer.offset(),
				top = offset.top - docContainerOffset.top + 15,
				right = docContainer.width() - (offset.left - docContainerOffset.left) - self.$mapTool.width() + 15;

			self.$offMapTool.appendTo(docContainer);
			positionChangeElements.css({
				top: top,
				right: right
			});
			setTimeout(function()
			{
				self.$offMapTool.find(MAPTOOLLABELFIX).css('display', 'block');
				self.$offMapTool.addClass("active");
				self.afterMapToolActive();
			});
		}
		else
		{
			// revert the position back
			self.$offMapTool.insertAfter(self.$mapTool);
			positionChangeElements.css({
				top: 15,
				right: 15
			});
			setTimeout(function()
			{
				self.$offMapTool.removeClass("active");
				self.afterMapToolInactive();
				self.unLandscape();
			});
		}
		self.$mapToolContainer.find(TOOLICON).each((index, item) =>
		{
			if ($(item).hasClass('disable') && self.$mapToolLabel.find('label'))
			{
				$(self.$mapToolLabel.find('label')[index]).css('cursor', 'default');
			}
		})
	};

	/**
	 * The click event handler for map toolkit button.
	 * @param {Event} e The click event.
	 * @return {void}
	 */
	BaseMapTool.prototype.toolkitBtnClick = function(e)
	{
		var self = this;
		self.$toolkitButton.css("transition", "");
		if (self.toolkitBtnClickEventEnable)
		{
			if (tf.isViewfinder && isMobileDevice())
			{
				self.cancelMobileGeoSearch();
			}
			self.toolkitBtnClickEvent.notify(function()
			{
				self.toggleMapToolDisplayStatus();
			});
		}
		else
		{
			self.toggleMapToolDisplayStatus();
		}
	};

	BaseMapTool.prototype.landscape = function()
	{
		var self = this;
		if (self.isLandscape)
		{
			self.$mapToolContainer.addClass("landscape");
		}
	}

	BaseMapTool.prototype.unLandscape = function()
	{
		var self = this;
		if (self.isLandscape)
		{
			self.$mapToolContainer.removeClass("landscape");
		}
	}

	BaseMapTool.prototype.cancelMobileGeoSearch = function()
	{
		var self = this;
		if (self.geoSearchTool)
		{
			self.$appliedGeoSearchIcon.hide();
			self.geoSearchTool.cancelDrawTool();
		}
	}

	BaseMapTool.prototype.onBuildSubMenuItems = function(item) { /* Add or remove items into this item to customize menu items*/ };

	BaseMapTool.prototype.openSubMenu = function(item, e)
	{
		if (item.config.closable)
		{
			this.toolkitBtnClick();
			return;
		}
		if (item.isActive)
		{
			this.hideSubMenu();
			PubSub.publish("MapToolClicked", item);
			return;
		}
		if ($(e.target).text() !== '' && $(e.target).closest('div').siblings(`.${$(e.target).text().toLowerCase()}`).hasClass('disable'))
		{
			return;
		}
		this.hideSubMenu();
		if (e)
		{
			e.stopPropagation();
		}
		this.rootMenuItem.children.map(function(child)
		{
			child.isActive = false;
		});
		item.isActive = true;
		this.onBuildSubMenuItems(item);
		this.BuildSubMenuItems(item);
		this.SubMenuClick(item);
		PubSub.publish("MapToolClicked", item);
	};

	BaseMapTool.prototype.SubMenuClick = function(item)
	{
		this.$offMapTool.find(TOOLICON).addClass('deactive-icon');
		this.$offMapTool.find(MAPTOOLLABELFIX).css('display', 'none');
		item.target.addClass('active');
	};

	BaseMapTool.prototype.BuildSubMenuItems = function(menuItem)
	{
		var self = this;
		var items = menuItem.children;
		if (!items || items.length === 0)
		{
			return;
		}

		// build sub menu
		items.map(function(item)
		{
			if (item.onclick)
			{
				item.onclick = item.config.click.createInterceptor(self.clickFirstSubMenu.bind(self)).bind(self, item);
			}
			else
			{
				item.onclick = self.clickFirstSubMenu.bind(self, item);
			}

			item.toggleStatus.subscribe(function(value)
			{
				self.changeCheckDivStatus(item, value);
			});
		});
		var subMenu = self.showMenuInternal(menuItem);
		self.$offMapTool.append(subMenu);
		var $caret = $('<div class="caret"></div>');
		self.$offMapTool.append($caret);
		self.setCaretPosition(menuItem, $caret);
		self.setFirstSubMenuPosition(subMenu, $caret);
	};

	BaseMapTool.prototype.clickFirstSubMenu = function(menuItem)
	{
		if (menuItem.config.closable)
		{
			this.toolkitBtnClick();
			this.hideSubMenu();
		}
	};

	BaseMapTool.prototype.changeCheckDivStatus = function(menuItem, toggleStatus)
	{
		var checkDiv = menuItem.html.find('.check');
		var textDiv = menuItem.html.find('.text');
		if (toggleStatus)
		{
			checkDiv.css('display', 'block');
			textDiv.css(FONTWEIGHT, 'bold');
		}
		else
		{
			checkDiv.css('display', 'none');
			textDiv.css(FONTWEIGHT, 'normal');
		}
	};

	BaseMapTool.prototype.hideSubMenu = function(e)
	{
		var self = this;
		var mapTools = self.$offMapTool.find('.routing-sub-item');
		if (mapTools && mapTools.length > 0)
		{
			self.$offMapTool.find('.caret').remove();
			mapTools.map(function(index, mapTool)
			{
				if ($(mapTool).hasClass('thematic-menu'))
				{
					$(mapTool).removeClass('active');
				}
				else
				{
					$(mapTool).remove();
				}
			});
			self.$offMapTool.find(MAPTOOLLABELFIX).css('display', 'block');
			self.$offMapTool.addClass("active");
		}

		self.$offMapTool.find(TOOLICON).removeClass('deactive-icon').removeClass('active');
		self.rootMenuItem.children.some(function(child)
		{
			child.isActive = false;
		});
	};

	BaseMapTool.prototype.showMenuInternal = function(menuItem)
	{
		var self = this;
		var outterDiv = $('<div class="mapToolSubMenu routing-sub-item"></div>');
		outterDiv.on('click', function(e)
		{
			e.stopPropagation();
		});
		var outterUl = $('<ul/>');
		outterDiv.append(outterUl);
		for (var i = 0; i < menuItem.children.length; i++)
		{
			var child = menuItem.children[i];
			if (child.isDevider)
			{
				var devider = $('<li class="menu-divider"><div class="rule"></div></li>');
				outterUl.append(devider);
				continue;
			}
			var listItem = $('<li></li>');
			var textDiv = $(
				`<div class="text">
				<span class="menu-item-title ${child.isDisable ? "disable" : ""}" title="${child.header}" >${child.header}</span>
				</div>`
			);

			var checkDiv = $('<div class="check"></div>');
			if (child.isToggled)
			{
				if (child.toggleStatus())
				{
					checkDiv.css('display', 'block');
					textDiv.css(FONTWEIGHT, 'bold');
				}
				else
				{
					checkDiv.css('display', 'none');
					textDiv.css(FONTWEIGHT, 'normal');
				}
			}
			listItem.append(textDiv);
			listItem.append(checkDiv);
			listItem.click(child.onclick.bind(self));

			if (child.children.length > 0)
			{
				var arrowItem = $('<span class="k-icon k-i-arrow-e"></span>');
				listItem.append(arrowItem);
			}
			child.html = listItem;
			outterUl.append(listItem);
		}
		return outterDiv;
	};

	BaseMapTool.prototype.setFirstSubMenuPosition = function(contextMenu, caret)
	{
		var menuPosition = {};

		var width = contextMenu.outerWidth();
		var height = contextMenu.outerHeight();

		var top = parseInt(caret.css('top')) - height * 0.3 + 8;
		// as we don't knonw why constant number 55 be used here, it will occured wrong postion on user form question, so skip it in on form map question
		if (this.routingMapDocumentViewModel && !this.routingMapDocumentViewModel.isForm)
		{
			top = top < 55 ? 55 : top
		}
		else
		{
			/* in formfinder, the map tool menu mask layer just cover the map question self not whole page, set constant top to 5 to make sure the menu in map area.*/
			if (height * 0.3 >= parseInt(caret.css('top')))
			{
				top = 5;
			}
		}
		contextMenu.css({
			position: "absolute",
			left: parseInt(caret.css('left')) + caret.outerWidth() / 2 - width + 5 - parseInt(contextMenu.css('margin-left')),
			top: top,
			color: "black"
		});

		return menuPosition;
	};

	BaseMapTool.prototype.setCaretPosition = function(item, caret)
	{
		var width = caret.outerWidth();
		var height = caret.outerHeight();
		var itemOffset = item.target.offset();
		var containerOffset = this.$offMapTool.offset();

		var top = itemOffset.top - containerOffset.top;
		var left = itemOffset.left - containerOffset.left;

		caret.css({
			position: "absolute",
			left: left - width - 20,
			top: top - height / 2 + item.target.height() / 2 + 1
		});
	};

	BaseMapTool.prototype.setContextMenuPosition = function(event, contextMenu)
	{
		var mousePosition = {}, menuPosition = {}, menuDimension = {};
		menuDimension.x = contextMenu.outerWidth();
		menuDimension.y = contextMenu.outerHeight();
		mousePosition.x = event.pageX;
		mousePosition.y = event.pageY;

		if (mousePosition.x + menuDimension.x > $(window).width() + $(window).scrollLeft())
		{
			menuPosition.x = mousePosition.x - menuDimension.x;
		} else
		{
			menuPosition.x = mousePosition.x;
		}

		if (mousePosition.y + menuDimension.y > $(window).height() + $(window).scrollTop())
		{
			menuPosition.y = mousePosition.y - menuDimension.y;
		} else
		{
			menuPosition.y = mousePosition.y;
		}

		contextMenu.css({
			position: "fixed",
			left: menuPosition.x,
			top: menuPosition.y
		});

		return menuPosition;
	};

	BaseMapTool.prototype.menuItemMouseOver = function(menuItem, e)
	{
		// This is intentional
	};

	BaseMapTool.prototype.menuItemMouseLeave = function(menuItem, e)
	{
		// This is intentional
	};

	BaseMapTool.prototype.dispose = function()
	{
		$(window).unbind("resize", this.onWindowResize);
	};

})();
