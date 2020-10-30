(function()
{
	createNamespace("TF").NavigationMenu = NavigationMenu;

	function NavigationMenu ()
	{
		var self = this;
		self.$navigationMenu = null;
		if (tf.permissions && !tf.permissions.isSupport)
		{
			self.searchControlTemplate = new TF.Control.SearchControlViewModel();
		}

		self.pageCategoryHeight = 54;
		self.pageItemHeight = 42;
		self.collapseWidth = 60;
		self.expandWidth = 300;
		self.moreToolbarExpandWidth = 200;
		self.fullMenuWidth = 310;
		self.defaultToggleNavAnimationDuration = 350;
		self.defaultOpenMenuAnimationDuration = 250;

		self.availableApplications = tf.pageManager?tf.pageManager.availableApplications:"";

		self.isMacintosh = isMacintosh();
		self.NavigationMenuExpandStatueKey = TF.productName + ".navigationmenu.expandstatus";
		self.obIsExpand = ko.observable();
		self.isOnAnimation = false;
		self.isBeginWithCollapse = false;
		self.obSupportedApplications = ko.observableArray([]);
		self.obReportPages = ko.observableArray([]);
		self.obSettingPages = ko.observableArray([]);
		self.obDashboardLoRes = ko.observable(false);
		self.obShowMessageCenter = ko.observable(false);

		self.bindWithKnockout();
		self.tooltip = new TF.Helper.TFTooltip();
		self.obIsRefreshing = ko.observable(false);
		self.obIsRefreshAvailable = ko.observable(true);

		self.logoItemClick = self.logoItemClick.bind(self);
		self.onSwitchAppClick = self.onSwitchAppClick.bind(self);
		tf.pageManager?tf.pageManager.changedPageEvent.subscribe(self.setActiveState.bind(self)):"";
	}

	/**
	 * Bind data with html elements using knockout.
	 * @return {void}
	 */
	NavigationMenu.prototype.bindWithKnockout = function()
	{
		tf.loadingIndicator.show();

		var self = this,
			$container = $(".navigation-container");
		self.$container = $container;
	};

	/**
	 * Init, called when knockout binding is done.
	 * @return {void}
	 */
	NavigationMenu.prototype.init = function()
	{
		var self = this,
			$nav = self.$container.find(".navigation-menu");

		self.$navigationMenu = $nav;
		self.$navigationHeader = $nav.find(".navigation-header");

		self.initApplicationSwitcher().then(function(result)
		{
			self.appSwitcherEnabled = result;
			if (!result)
			{
				$nav.find(".navigation-header .item-logo").addClass("disabled");
			}

			self.bindRelatedEvents();
			self.initNavigationMenuState();
			self.initTooltip();
		});

		if (window.opener && window.name.indexOf("new-detailWindow") >= 0)
		{
			$(".navigation-container").addClass("hide");
		}
		tf.loadingIndicator.tryHide();
	};

	/**
	 * Initialize the navigation menu state.
 	* @return {void}
 	*/
	NavigationMenu.prototype.initNavigationMenuState = function()
	{
		var self = this,
			typeList = ["fieldtrips", "myrequests", "approvals", "settings"],
			isExpand = tf.storageManager.get(self.NavigationMenuExpandStatueKey);

		if (TF.isPhoneDevice)
		{
			isExpand = "True";
		}
		if (isExpand && isExpand === "True") { self.toggleNavigationMenu(true); }

		$.each(typeList, function(index, item)
		{
			self.updateMenuContent(item);
		});
	};

	/**
	 * The event handler after page item in the menu is rendered.
	 * @param {jQuery} $el   
	 * @param {Object} data 
	 * @return {void}
	 */
	NavigationMenu.prototype.afterPageMenuOptionUIRender = function($el, data)
	{
		var self = this;
		if (data.isOpen)
		{
			self.setActiveStateByPageType(data.pageType);
		}
	};

	/**
	 * Bind events.
	 * @return {void}
	 */
	NavigationMenu.prototype.bindRelatedEvents = function()
	{
		var self = this,
			menuItems = self.appSwitcherEnabled
				? self.$navigationMenu.find(".navigation-item, .item-logo")
				: self.$navigationMenu.find(".navigation-item");

		menuItems.on("mouseenter", self.onNavigationItemToggleHoverStatus.bind(self, true));
		menuItems.on("mouseleave", self.onNavigationItemToggleHoverStatus.bind(self, false));
		tf.shortCutKeys.bind(["esc"], self.closeOpenedNavigationItemMenu.bind(self, false));
		$(document).on("click.navigation-menu", self.closeOpenedNavigationItemMenu.bind(self, false));

		if (self.searchControlTemplate)
		{
			self.searchControlTemplate.onSearchStatusToggle.subscribe(self.onQuickSearchStatusChange.bind(self));
			self.searchControlTemplate.onSearchButtonClickEvent.subscribe(self.onQuickSearchIconClick.bind(self));
			self.searchControlTemplate.onNavComplete.subscribe(function()
			{
				if (self.isBeginWithCollapse)
				{
					self.toggleNavigationMenu(false, self.defaultToggleNavAnimationDuration);
					self.isBeginWithCollapse = false;
				}
			});
		}
	};

	/**
	 * Event handler when quick search icon is clicked.
	 * @param {Event} evt 
	 */
	NavigationMenu.prototype.onQuickSearchButtonClick = function(evt)
	{
		var self = this;
		if (!self.obIsExpand())
		{
			self.toggleNavigationMenu(true, self.defaultToggleNavAnimationDuration);
		}
	};

	/**
	 * Toggle the hover status.
	 * @param {boolean} onHover 
	 * @param {Event} evt 
	 * @return {void}
	 */
	NavigationMenu.prototype.onNavigationItemToggleHoverStatus = function(onHover, evt)
	{
		var self = this, hoverWidth,
			widthBuffer = 1,
			$item = $(evt.target).closest(".navigation-item, .item-logo");

		if (!onHover)
		{
			$item.removeClass("hoverState", onHover);
		}
		else if (!self.isOnAnimation && self.$navigationMenu.find(".menu-opened").length === 0 && evt.type === "mouseenter")
		{
			$item.addClass("hoverState", onHover);
		}
		else
		{ return; }

		if (!self.obIsExpand() && !$item.hasClass("on-animation"))
		{
			if (onHover)
			{
				self.updateMenuContent($item.attr("pageType"), true);

				if (!$item.hasClass("menu-opened"))
				{
					hoverWidth = $item.find(".item-icon").outerWidth() + $item.find(".item-label").outerWidth() + widthBuffer;
					$item.css("width", hoverWidth);
				}
			}
			else if (!$item.is($(evt.toElement).closest(".navigation-item")))
			{
				$item.css("width", "");
			}
		}
	};

	/**
	 * Close currently opened navigation page menu
	 * @param {boolean} noAnimation
	 * @return {Deferred}
	 */
	NavigationMenu.prototype.closeOpenedNavigationItemMenu = function(noAnimation, isCollapse)
	{
		var self = this,
			duration = noAnimation ? 0 : self.defaultOpenMenuAnimationDuration,
			$openedElement = $(".menu-opened");

		if ($openedElement.hasClass("navigation-toolbar"))
		{
			return self.toggleMoreToolbarButtonsDisplay(false, duration);
		}
		else if ($openedElement.hasClass("navigation-item"))
		{
			return self.togglePageMenuDisplay($openedElement, false, duration);
		}
		else if ($openedElement.hasClass("item-logo"))
		{
			return self.toggleAppSwitcherMenu(false, isCollapse);
		}
	};

	/**
	 * The event handler for toggle navigation menu button click.
	 * @param {Event} evt
	 * @return {void}
	 */
	NavigationMenu.prototype.toggleMenuBtnClick = function(data, evt)
	{
		evt.stopPropagation();

		var self = this,
			currentStatus = self.obIsExpand();

		self.toggleNavigationMenu(!currentStatus, self.defaultToggleNavAnimationDuration);
	};

	/**
	 * Toggle the expand/collapse status of the navigation menu.
	 * @param {boolean} status Whether it is to expand or collapse
	 * @return {void}
	 */
	NavigationMenu.prototype.toggleNavigationMenu = function(status, duration)
	{
		var self = this,
			duration = duration || 0;

		if (!status)
		{
			self.closeOpenedNavigationItemMenu(false, true);
		}

		self.easeToggleNavigationAnimation(status, duration);

		if (!tf.permissions.isSupport)
		{
			tf.storageManager.save(self.NavigationMenuExpandStatueKey, status)
				.catch(function(error)
				{
					// Catch the error so it would not appear in console.
				});
		}
	};

	/**
	 * Toggle the status on "more" button
	 * @param {boolean} status 
	 */
	NavigationMenu.prototype.toggleMoreIcon = function(status)
	{
		var self = this;
		var $moreBtn = $('.navigation-menu .more');

		if (self.obIsRefreshing())
		{
			$moreBtn.addClass('switch-more-icon');
		}
		else
		{
			$moreBtn.removeClass('switch-more-icon');
		}
	}

	/**
	 * Toggle the navigation menu expand/collapse status with animation.
	 * @param {boolean} flag Whether it is to expand or collapse
	 * @param {boolean} duration The animation duration
	 * @return {void}
	 */
	NavigationMenu.prototype.easeToggleNavigationAnimation = function(flag, duration)
	{
		var self = this, prevWidth, targetWidth, refreshObj,
			fadeDuration = duration / 2,
			$navMenu = self.$navigationMenu,
			$navItems = $navMenu.find(".navigation-item:not(.menu-opened)"),
			$caret = $navMenu.find(".navigation-header .left-caret"),
			$toolbar = $navMenu.find(".navigation-toolbar"),
			$quickSearch = $navMenu.find(".navigation-quick-search"),
			$spinner = $navMenu.find(".quick-search-spinner"),
			$navContent = $navMenu.find(".navigation-content"),
			isQuickSearchActive = self.isQuicKSearchActive(),
			// If the menu is already opened, do not fade out the label
			$fadeOutElements = $navMenu.find(".search-header .search-text, .search-header .clear-btn"),
			$moreBtn = $toolbar.find(".more"),
			$gridMap = $("#pageContent"),
			totalWidth = $(document).width(),
			isToolbarOpened = $toolbar.hasClass("menu-opened"),
			removeInlineOpacityFunc = function()
			{

				$fadeOutElements.css("opacity", "");
				$navItems.css("opacity", "");
			};

		if (isQuickSearchActive)
		{
			$navMenu.addClass("on-quick-search");
			$fadeOutElements = $fadeOutElements.add(".type-selector, .search-content");
		}
		else
		{
			$fadeOutElements = $fadeOutElements.add(".navigation-item:not(.menu-opened) .item-label");
		}

		if (flag)
		{
			prevWidth = self.collapseWidth;
			targetWidth = self.expandWidth;

			$fadeOutElements.css("opacity", 0);
			// No animation for toolbar if it is already opened.
			// This used css "transition".
			$caret.css("transform", "rotate(0deg)");
			// If the quick search is active, the icons should be hidden.
			$navContent.css("display", "block");
			$quickSearch.css("height", 54);
			$navItems.css({ opacity: 1 }).stop().animate({ opacity: isQuickSearchActive ? 0 : 1 }, { duration: fadeDuration, queue: false, done: removeInlineOpacityFunc });
			$spinner.css("left", "2px");
			$moreBtn.css("opacity", 0).stop().animate({ opacity: 0 }, {
				duration: fadeDuration, queue: false, done: function()
				{
					$navContent.css("display", "");
					$quickSearch.css("height", "");
					$fadeOutElements.stop().animate({ opacity: 1 }, { duration: fadeDuration, queue: false });

					if (isQuickSearchActive && self.searchControlTemplate)
					{
						self.searchControlTemplate.$searchText.focus();
					}
				}
			});
		}
		else
		{
			prevWidth = self.expandWidth;
			targetWidth = self.collapseWidth;

			if (isQuickSearchActive)
			{
				$navItems.css("opacity", 0);
			}

			$caret.css("transform", "rotate(180deg)");
			$fadeOutElements.css("opacity", 0).stop().animate({ opacity: 0 }, { duration: fadeDuration, queue: false });
			$moreBtn.css("opacity", 0).stop().animate({ opacity: 1 }, {
				duration: fadeDuration, queue: false, done: function()
				{
					if (isQuickSearchActive)
					{
						$navItems.stop().animate({ opacity: 1 }, { duration: fadeDuration, queue: false });
					}
					$moreBtn.stop().animate({ opacity: 1 }, { duration: fadeDuration, queue: false, done: removeInlineOpacityFunc });
				}
			});
			$spinner.css("left", "22px");
		}

		// Set initial inline styles so the class styles would not take effect until the end of animation.
		if (!TF.isPhoneDevice)
		{
			$gridMap.css("width", totalWidth - prevWidth);
			$navMenu.css("width", prevWidth);
			$navItems.css({ overflow: "hidden", width: "100%" });
			self.obIsExpand(flag);
			refreshObj = self.updatePageContentWidth();
			self.isOnAnimation = true;
			$navMenu.addClass("on-animation");
			$gridMap.stop().animate({ width: totalWidth - targetWidth }, {
				duration: duration, queue: false, step: function()
				{
				}
			});
			$navMenu.stop().animate({ width: targetWidth }, {
				duration: duration, queue: false, done: function()
				{
					// Use calc to avoid display issue when there is vertical scroll in gridMap, remove if this is not happending.
					if (refreshObj.currentInterval)
					{
						clearInterval(refreshObj.currentInterval);
					}
					if (refreshObj.function)
					{
						refreshObj.function();
					}
					self.isOnAnimation = false;
					$navMenu.removeClass("on-animation");
					$navMenu.css({ overflow: "", width: "" });
					$navItems.css({ overflow: "", width: "" });
					$gridMap.css("width", "calc(100% - " + targetWidth + "px)");
					$toolbar.removeClass("menu-opened");
					if (self.obIsExpand() && self.searchControlTemplate)
					{
						self.searchControlTemplate.searchBoxPlaceHolderChanged();
					}
				}
			});
		} else
		{
			$navMenu.css("width", "100%");
			$navItems.css({ overflow: "hidden", width: "100%" });
			$(".navigation-container").addClass("mobile");
			var type = tf.storageManager.get(TF.productName.toLowerCase() + ".page") || "fieldtrips";
			self.setActiveStateByPageType(type);
			self.obIsExpand(flag);
		}

	};

	/**
	 * Update the map view/grid view's width after click the expand button.
	 * @returns {Object} 
	 */
	NavigationMenu.prototype.updatePageContentWidth = function()
	{
		var self = this, refreshObj = {}, updateRefreshObj, templateName,
			leftPanelWidth = $(".left-panel:not(.hide)").width(), $container,
			rightPanelWidth, borderWidth = 2, currentPanelWidth, lockedHeaderWidth, paddingRight, width;
		if (!leftPanelWidth)
		{
			leftPanelWidth = $(".resize-wrap").width();
		}

		updateRefreshObj = function()
		{
			refreshObj.function = function()
			{
				if (tf.pageManager.resizablePage)
				{
					tf.pageManager.resizablePage.reLayoutPage();
				}
			};
			refreshObj.currentInterval = setInterval(function()
			{
				refreshObj.function();
			}, 50);
		};
		updateRefreshObj();
		return refreshObj;
	}

	/**
	 * Update the menu content with user permissons.
	 * @param {string} type The page type
	 * @return {void}
	 */
	NavigationMenu.prototype.updateMenuContent = function(type, hover)
	{
		var self = this, pageList, categoryName,
			$item = self.$navigationMenu.find(".navigation-item." + type);

		if (!hover)
		{
			switch (type)
			{
				case "settings":
					tf.pageManager.loadDataSourceName().then(function()
					{
						pageList = tf.pageManager.obAdministrationPagesMenu();
						self.obSettingPages(pageList);
						categoryName = pageList.length === 1 ? pageList[0].text : (type.charAt(0).toUpperCase() + type.slice(1));
						$item.find(".item-label").text(categoryName);
					});
					break;
				default:
					break;
			}
		}
	};

	/**
	 * The event handler for navigation page category click.
	 * Open the menu for specified page type, if there is only one available page, open it directly.
	 * @param {string} type The page type
	 * @param {Object} data Bound data
	 * @param {Event} evt The event object
	 * @return {void}
	 */
	NavigationMenu.prototype.navigationPageCategoryClick = function(type, data, evt)
	{
		if ((evt.ctrlKey || evt.metaKey) && type !== "settings")
		{
			var redirectWindow = window.open('', '_blank');
			redirectWindow.blur();
		}
		evt.stopPropagation();
		var self = this,
			$item = self.$navigationMenu.find(".navigation-item." + type),
			$itemMenu = $item.find(".item-menu"),
			$pageList = $itemMenu.find("li"),
			alreadyOpened = $item.hasClass("menu-opened");

		if (type === "messages")
		{
			ga('send', 'event', 'Area', 'Message');
			if (TF.isPhoneDevice)
			{
				self.closeNavigation();
			}
			tf.pageManager.showMessageModal();
			return;
		}

		if ((evt.ctrlKey || evt.metaKey) && type !== "settings")
		{
			redirectWindow.location = "#/?pagetype=" + type, "new-pageWindow_" + $.now();
			return;
		}

		//skip the method if user click the link to the same page.
		if (($(evt.target).closest(".navigation-item,.toolbar-button").hasClass("active")) && type !== "settings")
		{
			return;
		}
		if ($pageList.length === 1 && type === "settings")
		{
			if ($pageList[0].title === "Change Password")
			{
				tf.PasswordChangeModalViewModel(tf.pageManager.currentDatabaseName());
			}
			else
			{
				tf.showSelectDataSourceModel(tf.pageManager.currentDatabaseName());
			}
			self.closeOpenedNavigationItemMenu(false);

			if (TF.isPhoneDevice)
			{
				self.closeNavigation();
			}
			return;
		}
		if ($pageList.length === 0)
		{
			if (!self.closeOpenedNavigationItemMenu(false))
			{
				tf.pageManager.openNewPage(type);
			}

			if (TF.isPhoneDevice)
			{
				self.closeNavigation();
			}
		} else if (alreadyOpened)
		{
			self.togglePageMenuDisplay($item, false, self.defaultOpenMenuAnimationDuration);
			$item.addClass("hoverState");
		} else
		{
			if (!self.closeOpenedNavigationItemMenu(false))
			{
				self.togglePageMenuDisplay($item, true, self.defaultOpenMenuAnimationDuration);
			}
		}

		switch (type)
		{
			case "approvals":
				ga('send', 'event', 'Area', 'My Pending Approvals');
				break;
			case "fieldtrips":
				ga('send', 'event', 'Area', 'Field Trips');
				break;
			case "myrequests":
				ga('send', 'event', 'Area', 'My Submitted Requests');
				break;
			case "reports":
				ga('send', 'event', 'Area', 'Reports');
				break;
			case "settings":
				ga('send', 'event', 'Area', 'Settings');
			default:
				break;
		}
	};

	/**
	 * Toggle the display status of page menu.
	 * @param {JQuery} $item  
	 * @param {boolean} flag 
	 * @param {number} duration
	 * @return {Deferred}
	 */
	NavigationMenu.prototype.togglePageMenuDisplay = function($item, flag, duration)
	{
		var self = this, animationDeferred = $.Deferred(),
			$itemMenu = $item.find(".item-menu"),
			isOpened = $item.hasClass("menu-opened"),
			pageCount = $itemMenu.find("ul:first-child>li").length;

		var contentHeight = $(".navigation-toolbar").offset().top - $item.offset().top;

		var duration = duration || 0,
			menuHeight = pageCount * self.pageItemHeight + self.pageCategoryHeight, targetWidth,
			initWidth = self.obIsExpand() ?
				self.expandWidth :
				$item.find(".item-icon").outerWidth() + $item.find(".item-label").outerWidth();
		if ($itemMenu.width() == 620) 
		{
			targetWidth = 620;

		} else
		{
			targetWidth = 310;
		}


		if (flag && !isOpened)
		{
			//If the item text is greater than 310, get the width.
			$itemMenu.css({ width: "" });
			$item.addClass("menu-opened");
			targetWidth = targetWidth > $itemMenu.width() ? targetWidth : $itemMenu.width();
			$item.removeClass("menu-opened");

			$itemMenu.css({ width: initWidth, height: self.pageCategoryHeight, display: "block" });
			self.isOnAnimation = true;
			$item.addClass("onAnimation");
			$item.addClass("menu-opened");
			$itemMenu.stop().animate({ width: targetWidth, height: menuHeight }, {
				duration: duration, queue: false, done: function()
				{
					self.isOnAnimation = false;
					$item.removeClass("onAnimation");
					animationDeferred.resolve();
				}
			});
		}
		else if (!flag && isOpened)
		{
			//If the item text is greater than 310, get the width.
			targetWidth = targetWidth > $itemMenu.width() ? targetWidth : $itemMenu.width();

			$itemMenu.css({ width: targetWidth, height: menuHeight });
			self.isOnAnimation = true;
			$item.addClass("onAnimation");
			$item.removeClass("menu-opened");
			$itemMenu.stop().animate({ width: initWidth, height: self.pageCategoryHeight }, {
				duration: duration, queue: false, done: function()
				{
					self.isOnAnimation = false;
					$item.removeClass("onAnimation");
					$itemMenu.css({ width: "", height: "", display: "" });
					animationDeferred.resolve();
				}
			});
		}
		else
		{
			animationDeferred.resolve();
		}

		return animationDeferred;
	};

	/**
	 * Click event for showMore button.
	 * @param {Object} data
	 * @param {Event} evt
	 * @return {void}
	 */
	NavigationMenu.prototype.showMoreButtonClick = function(data, evt)
	{
		evt.stopPropagation();

		var self = this;

		if (!self.closeOpenedNavigationItemMenu(false))
		{
			self.toggleMoreToolbarButtonsDisplay(true, self.defaultOpenMenuAnimationDuration);
		}
	};

	/**
	 * Toggle the display status of the toolbar at bottom.
	 * @param {boolean} flag 
	 * @param {number} duration
	 * @return {Deferred} 
	 */
	NavigationMenu.prototype.toggleMoreToolbarButtonsDisplay = function(flag, duration)
	{
		var self = this, animationDeferred = $.Deferred(),
			duration = duration || 0,
			$toolbar = self.$navigationMenu.find(".navigation-toolbar"),
			isOpened = $toolbar.hasClass("menu-opened");

		if (self.obIsExpand()) { return; }
		if (flag && !isOpened)
		{
			$toolbar.css("width", self.collapseWidth);
			self.isOnAnimation = true;
			$toolbar.addClass("onAnimation");
			$toolbar.addClass("menu-opened");
			$toolbar.stop().animate({ width: self.moreToolbarExpandWidth }, {
				duration: duration, queue: false, done: function()
				{
					self.isOnAnimation = false;
					$toolbar.removeClass("onAnimation");
					$toolbar.css("width", "");
					animationDeferred.resolve();
				}
			});
		}
		else if (!flag && isOpened)
		{
			$toolbar.css("width", self.moreToolbarExpandWidth)
			self.isOnAnimation = true;
			$toolbar.addClass("onAnimation");
			$toolbar.removeClass("menu-opened");
			$toolbar.stop().animate({ width: self.collapseWidth }, {
				duration: duration, queue: false, done: function()
				{
					self.isOnAnimation = false;
					$toolbar.removeClass("onAnimation");
					$toolbar.css("width", "");
					animationDeferred.resolve();
				}
			});
		}
		else
		{
			animationDeferred.resolve();
		}

		return animationDeferred;
	};

	/**
	 * When the page button is clicked.
	 * @param {Object} data 
	 * @param {Event} evt 
	 * @return {void}
	 */
	NavigationMenu.prototype.openPageButtonClick = function(pageType, data, evt)
	{
		if (evt.ctrlKey || evt.metaKey)
		{
			var redirectWindow = window.open('', '_blank');
			redirectWindow.blur();
		}
		evt.stopPropagation();

		var self = this;
		if (pageType === "dataSource")
		{
			tf.showSelectDataSourceModel(tf.pageManager.currentDatabaseName());
			self.closeOpenedNavigationItemMenu(false);

			if (TF.isPhoneDevice)
			{
				self.closeNavigation();
			}
		}
		else if (pageType === "settingsConfig")
		{
			if (evt.ctrlKey || evt.metaKey)
			{
				redirectWindow.location = "#/?pagetype=settingsConfig", redirectWindow.name = "new-pageWindow_" + $.now();
			}
			else if (!($(evt.target).closest(".item-menu li").hasClass("active")))
			{
				self.setActiveStateByPageType(pageType);
				var pList = [self.closeOpenedNavigationItemMenu(false)];
				Promise.all(pList).then(function()
				{
					if (TF.isPhoneDevice)
					{
						self.closeNavigation();
					}
					tf.pageManager.openNewPage(pageType);
				});
			}
		}
		else if (pageType === "changePassword")
		{
			tf.PasswordChangeModalViewModel(tf.pageManager.currentDatabaseName());
			self.closeOpenedNavigationItemMenu(false);

			if (TF.isPhoneDevice)
			{
				self.closeNavigation();
			}
		}
	};

	NavigationMenu.prototype.openDataSourceButtonClick = function()
	{
		var self = this;
		tf.showSelectDataSourceModel(tf.pageManager.currentDatabaseName());
		self.closeOpenedNavigationItemMenu(false);

		if (TF.isPhoneDevice)
		{
			self.closeNavigation();
		}
	};

	NavigationMenu.prototype.setActiveState = function(e, type)
	{
		var self = this;
		self.setActiveStateByPageType(type);
	};

	/**
	 * Set active state by page id.
	 * @param {number} pageId 
	 * @return {void}
	 */
	NavigationMenu.prototype.setActiveStateByPageType = function(type)
	{
		if (TF.isPhoneDevice && type === "settingsConfig")
		{
			type = "settings";
		}

		var self = this,
			pageType = type.replace("Scheduler", ""),
			$pageItem = $(".item-menu li[pageType='" + pageType + "']"),
			$categoryItem = $pageItem.length > 0 ? $pageItem.closest(".navigation-item") : $(".navigation-item[pageType='" + pageType + "']");

		if (self.$navigationMenu)
		{
			self.$navigationMenu.find(".navigation-item, .item-menu li").removeClass("active");
		}
		$pageItem.addClass("active");
		$categoryItem.addClass("active");
	};

	/**
	 * Initialize the tooltip.
	 * @return {void}
	 */
	NavigationMenu.prototype.initTooltip = function()
	{
		var self = this;
		if (TF.isPhoneDevice) { return; }
		$('.navigation-menu .toolbar-button').each(function(index, element)
		{
			var options = {};
			if ($(element).hasClass('more'))
			{
				return;
			}
			else if ($(element).hasClass('logout'))
			{
				options.title = 'Log Out';
			} else if ($(element).hasClass('datasource'))
			{
				options.title = 'Data Source';
			}
			self.tooltip.init($(element), options);
		});
	};

	/**
	 * Destroy the tooltip.
	 * @return {void}
	 */
	NavigationMenu.prototype.destroyTooltip = function()
	{
		this.tooltip.destroy($('.toolbar-button'));
	};

	/**
	 * https://github.com/twbs/bootstrap/issues/16230
	 * https://github.com/twbs/bootstrap/issues/16376
	 * 
	 * Do not remove setTimeout
	 */
	NavigationMenu.prototype.reinitTooltip = function()
	{
		this.destroyTooltip();
		setTimeout(function()
		{
			this.initTooltip();
		}.bind(this), 500);
	};

	/**
	 * When quick search icon is clicked.
	 * @param {Event} evt
	 * @return {void}
	 */
	NavigationMenu.prototype.onQuickSearchIconClick = function(evt, data)
	{
		var self = this,
			isActive = self.isQuicKSearchActive();

		self.isBeginWithCollapse = !self.obIsExpand();
		if (isActive && !self.obIsExpand())
		{
			self.toggleNavigationMenu(true, self.defaultToggleNavAnimationDuration);
		}
		else if (self.searchControlTemplate)
		{
			self.searchControlTemplate.toggleSearchControl(data);
		}
	};

	/**
	 * When quick search status has been changed.
	 * @param {Event} evt
	 * @param {boolean} status
	 * @return {void}
	 */
	NavigationMenu.prototype.onQuickSearchStatusChange = function(evt, status)
	{
		var self = this,
			isActive = self.isQuicKSearchActive();

		if (self.obIsExpand())
		{
			self.toggleQuickSearchDisplay(status, self.defaultOpenMenuAnimationDuration);
			if (self.isBeginWithCollapse)
			{
				self.toggleNavigationMenu(false, self.defaultToggleNavAnimationDuration);
				self.isBeginWithCollapse = false;
			}
		}
		else
		{
			self.toggleNavigationMenu(true, self.defaultToggleNavAnimationDuration);
		}
	};

	/**
	 * Check if quick search is currently active.
	 * @return {boolean} 
	 */
	NavigationMenu.prototype.isQuicKSearchActive = function()
	{
		var self = this;
		return self.searchControlTemplate && self.searchControlTemplate.obIsActive();
	};

	/**
	 * Toggle the display status of Quick Search.
	 * @param {boolean} flag The target display status
	 * @param {number} duration The animation duration
	 * @return {void}
	 */
	NavigationMenu.prototype.toggleQuickSearchDisplay = function(flag, duration)
	{
		var self = this, fadeDuration = duration / 2,
			$navMenu = self.$navigationMenu,
			$quickSearch = $navMenu.find(".navigation-quick-search"),
			$quickSearchElements = $quickSearch.find(".type-selector, .search-content"),
			$otherElements = $navMenu.find(".navigation-content, .navigation-toolbar"),
			fadeInElements = flag ? $quickSearchElements : $otherElements,
			fadeOutElements = flag ? $otherElements : $quickSearchElements,
			isActive = $navMenu.hasClass("on-quick-search");

		if (isActive == flag) { return; }

		$quickSearch.css("height", $quickSearch.height());
		fadeInElements.css({ display: "none", opacity: 0 });
		fadeOutElements.css({ display: "block", opacity: 1 });
		$navMenu.toggleClass("on-quick-search", flag);
		fadeOutElements.stop().animate({ opacity: 0 }, {
			duration: fadeDuration, queue: false, done: function()
			{
				$quickSearch.css("height", "");
				fadeOutElements.css({ display: "", opacity: "" });
				fadeInElements.css("display", "block").stop().animate({ opacity: 1 }, {
					duration: fadeDuration, queue: false, done: function()
					{
						fadeInElements.css({ display: "", opacity: "" });
					}
				});
			}
		});
	};

	/**
	 * The close navigation page for mobile.
	 * @return {void}
	 */
	NavigationMenu.prototype.closeNavigation = function()
	{
		$(".navigation-container.mobile").empty();
		$(".navigation-container").removeClass("mobile");
	};

	/**
	 * Initialize application switcher.
	 * @return {void}
	 */
	NavigationMenu.prototype.initApplicationSwitcher = function(needGenerateApplication)
	{
		var self = this;
		if (tf.permissions.isSupport)
		{
			return Promise.resolve(false);
		}

		var promise = tf.authManager.supportedProducts
			? Promise.resolve()
			: tf.authManager.getPurchasedProducts();

		self.$logoItem = self.$navigationMenu.find(".navigation-header .item-logo")
		self.$appSwitcherMenu = self.$navigationMenu.find(".navigation-header .item-menu");

		return promise.then(function()
		{
			var applications = [];
			$.each(tf.authManager.supportedProducts, function(_, item)
			{
				var productName = item.toLowerCase();
				if (self.availableApplications.hasOwnProperty(productName)
					&& self.availableApplications[productName].permission)
				{
					applications.push(productName);
				}
			});

			if (applications.length === 0)
			{
				return false;
			}

			self.obSupportedApplications(applications);

			self = null;

			return true;
		});
	};

	/**
	 * Event handler when the logo is clicked.
	 * @param {Object} data
	 * @param {Event} event
	 * @return {void}
	 */
	NavigationMenu.prototype.logoItemClick = function(data, event)
	{
		var self = this;
		event.stopPropagation();
		self.obSupportedApplications(tf.pageManager.applicationSwitcherList);
		if (tf.permissions.isSupport || self.obSupportedApplications().length === 0) { return; }

		self.appSwitcherEnabled = self.obSupportedApplications().length !== 0;
		if (!self.appSwitcherEnabled)
		{
			$nav.find(".navigation-header .item-logo").addClass("disabled");
		}

		var isMenuOpened = self.$logoItem.hasClass("menu-opened");

		if (!self.closeOpenedNavigationItemMenu() && !isMenuOpened)
		{
			self.toggleAppSwitcherMenu(true);
		}
	};

	/**
	 * Toggle application switcher's display status.
	 * @param {Boolean} flag
	 * @return {void}
	 */
	NavigationMenu.prototype.toggleAppSwitcherMenu = function(flag, isCollapse)
	{
		var self = this, bkgColor, targetWidth, targetHeight, opacity,
			animationDuration = 300,
			lineHeight = 54,
			promise = $.Deferred(),
			$container = self.$navigationHeader.find(".item-logo"),
			isCollapse = typeof (isCollapse) === "boolean" ? isCollapse : !self.obIsExpand();

		if (flag)
		{
			bkgColor = "#4a4a4a";
			targetHeight = lineHeight * (self.obSupportedApplications().length + 1);
			targetWidth = 238;
			opacity = 1;
		}
		else
		{
			bkgColor = "#262626";
			targetWidth = isCollapse ? 59 : 238;
			targetHeight = 54;
			opacity = 0;
		}

		$container.css({ "height": targetHeight, "background-color": bkgColor, "width": targetWidth });
		$container.addClass("on-animation");
		$container.find(".item-menu ul li").css("opacity", opacity);

		if (isCollapse)
		{
			$container.find(".logo").css("opacity", opacity);
			self.$navigationHeader.css({ "width": "238px" });
			self.$navigationHeader.find(".toggle-button, .app-switcher").css("display", flag ? "none" : "block");
		}

		setTimeout(function()
		{
			$container.removeClass("on-animation");
			$container.toggleClass("menu-opened", flag);
			$container.find(".logo").css("opacity", "");
			$container.css({ "background-color": "", "width": "" });
			self.$navigationHeader.find(".toggle-button, .app-switcher").css("display", "");
			self.$navigationHeader.css({ "width": "", "overflow": "" });
			promise.resolve(true);

		}, animationDuration);

		return promise;
	}

	/**
	 * The click event handler when other product's logo is clicked.
	 * @param {Boolean} newTab 
	 * @param {String} data 
	 * @param {Event} evt 
	 */
	NavigationMenu.prototype.onSwitchAppClick = function(newTab, data, evt)
	{
		var self = this;
		evt.stopPropagation();
		evt.preventDefault();

		var routeName = self.availableApplications[data].route,
			routeTitle = self.availableApplications[data].title,
			requireNewTab = (newTab || (self.isMacintosh ? evt.metaKey : evt.ctrlKey));
		if (requireNewTab)
		{
			var redirectWindow = window.open('', '_blank');
			redirectWindow.location.href = "loading.html";
			setTimeout(function()
			{
				var doc = redirectWindow.document;
				var head = doc.head;
				var link = doc.createElement("link");
				link.type = "image/x-icon";
				link.rel = "shortcut icon";
				link.href = "Global/img/app-switcher/" + routeName + ".ico";
				if (head)
				{
					head.appendChild(link);
				}
				redirectWindow.document.title = routeName;
			});
			redirectWindow.blur();
		}
		var prod = tf.pageManager.applicationURLMappingList.filter(function(prod)
		{
			return prod.Name.toLowerCase() == routeName.toLowerCase()
		}),
			url;

		if (prod.length > 0 && prod[0].Uri)
		{
			url = prod[0].Uri;

			var promise = null;
			if (routeName.toLowerCase() === "stopfinderadmin")
			{
				promise = tf.promiseAjax.post(pathCombine(tf.api.server("v1.08"), tf.authManager.clientKey, "auth/authentication/sso/stopfinder"))
					.then(function(response)
					{
						var token = response.token;
						var refreshToken = response.refreshToken;
						tf.entStorageManager.save("stopfinderToken", token);
						tf.entStorageManager.save("refreshToken", refreshToken);
						return true;
					}.bind(this));
			}
			else
			{
				if (routeName == "Fleetfinder" && url.indexOf("admin.html") < 0)
				{
					url += url.charAt(url.length - 1) == "/" ? "admin.html" : "/admin.html";
				}
				promise = Promise.resolve();
			}

			promise.then(function()
			{
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.onload = function(e)
				{
					if (this.response.indexOf('<title>' + routeTitle + '</title>') > 0)
					{
						requireNewTab ? redirectWindow.location = url : window.location = url;
					}
					else
					{
						requireNewTab ? redirectWindow.location.href = routeName + "notexisting.html" :
							window.location.href = routeName + "notexisting.html";
					}
				};
				xhr.onerror = function(e)
				{
					requireNewTab ? redirectWindow.location.href = routeName + "notexisting.html" :
						window.location.href = routeName + "notexisting.html";
				}
				xhr.send();
			}).catch(function()
			{
				requireNewTab ? redirectWindow.location.href = routeName + "notexisting.html" :
					window.location.href = routeName + "notexisting.html";
			});
		}
		else
		{
			requireNewTab ? redirectWindow.location.href = routeName + "notexisting.html" :
				window.location.href = routeName + "notexisting.html";
		}
		ga('send', 'event', 'Action', 'App Switcher', data[0].toUpperCase() + data.slice(1));

		self.toggleAppSwitcherMenu(false);

	};

	/**
	 * The dispose function.
	 * @return {void}
	 */
	NavigationMenu.prototype.dispose = function()
	{
		var self = this,
			menuItems = self.$navigationMenu.find(".navigation-item, .item-logo");

		self.$navigationMenu = null;
		self.$logoItem = null;
		self.$appSwitcherMenu = null;

		menuItems.off("mouseenter");
		menuItems.off("mouseleave");
		tf.shortCutKeys.unbind(["esc"]);
		$(document).off("click.navigation-menu");
	};

})();