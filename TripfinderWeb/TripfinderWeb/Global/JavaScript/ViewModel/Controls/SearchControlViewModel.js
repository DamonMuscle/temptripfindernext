(function()
{
	createNamespace("TF.Control").SearchControlViewModel = SearchControlViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function SearchControlViewModel()
	{
		var self = this;

		self.$element = null;
		self.$searchBtn = null;
		self.$searchToolContainer = null;
		self.$searchText = null;
		self.obIsActive = ko.observable(false);
		self.obInputTextHint = ko.observable("");
		self.obIsLoading = ko.observable(false);
		self.searchTextFocused = false;
		self.clearFocusTimeout = null;
		self.deferSearchTimeout = null;
		self.obHasSearchBeenConducted = ko.observable(false);
		self.elementContentHelper = new TF.Helper.ElementContentHelper();
		self.isMouseDownInSearchZone = false;
		self.requireScrollTopReset = false;
		self.pendingSearch = { searchText: "", dataType: "" };
		self.searchResult = [];
		self.allResultsCount = 0;
		self.obSearchKeywords = ko.computed(function()
		{
			var searchText = self.obInputTextHint().replace(/\\/g, "\\\\");

			return self.splitKeywords(searchText);
		}, self);

		self.maxHeight = 0;
		self.topDelta = 0;
		self.singleCardHeight = 56;
		self.sectionHeight = 38;
		self.resultHeaderHeight = 25;
		self.$virtualContainer = null;
		self.$virtualContent = null;
		self.currentItems = [];

		//Types
		self.defaultAllTypes = [
			{ text: "All Columns", value: "all", permission: true },
			{ text: "Trip Name", value: "tripname", permission: true },
			{ text: "Submitter", value: "submitter", permission: true },
			{ text: "Trip Date", value: "tripdate", permission: true },
			{ text: "Destination", value: "destination", permission: true },
			{ text: "School", value: "school", permission: true },
			{ text: "Department", value: "department", permission: true },
			{ text: "Classification", value: "classification", permission: true },
			{ text: "Billing Classification", value: "billingclassification", permission: true }
		];
		self.allTypes = null;
		self.updateAllDataTypes();
		self.obAllTypes = ko.observable(self.allTypes);
		self.obSelectType = ko.observable(self.allTypes[0]);

		//Results
		self.cardStyle = {
			"tripname": { title: "Trip Name", color: "#5B548F", field: "Name" },
			"submitter": { title: "Submitter", color: "#666", field: "UserName" },
			"tripdate": { title: "Trip Date", color: "#FFB229", field: "DepartDateTime" },
			"destination": { title: "Destination", color: "#DA534F", field: "Destination" },
			"school": { title: "School", color: "#ED7D31", field: "SchoolName" },
			"department": { title: "Department", color: "#1CB09A", field: "Department" },
			"classification": { title: "Classification", color: "#C36", field: "ClassificationName" },
			"billingclassification": { title: "Billing Classification", color: "#C39", field: "BillingClass" },
		};
		self.obSuggestedResult = ko.observable([]);
		self.recentSearches = ["Recent Search 1", "Recent Search 2", "Recent Search 3"];
		self.obRecentSearches = ko.observableArray(self.recentSearches);
		self.obAllResultsCount = ko.observable(0);
		self.obSingleResultCount = ko.observable(0);
		self.obChangeDataSourceShow = ko.observable(false);
		self.obNotShowRecentSearch = ko.observable(self.getRecentSearchesCount() === 0);

		//Events
		self.toggleSearchControl = self.toggleSearchControl.bind(self);
		self.openTypesMenuClick = self.openTypesMenuClick.bind(self);
		self.clearSearchClick = self.clearSearchClick.bind(self);
		self.selectTypeClick = self.selectTypeClick.bind(self);
		self.inputSearchText = self.inputSearchText.bind(self);
		self.viewInGridClick = self.viewInGridClick.bind(self);
		self.suggestedResultClick = self.suggestedResultClick.bind(self);
		self.recentSearchRecordClick = self.recentSearchRecordClick.bind(self);
		self.inputKeyDown = self.inputKeyDown.bind(self);
		self.mouseOnSection = self.mouseOnSection.bind(self);
		self.showAllClick = self.showAllClick.bind(self);

		self.onSearchButtonClickEvent = new TF.Events.Event();
		self.onSearchStatusToggle = new TF.Events.Event();
		self.onNavComplete = new TF.Events.Event();
		self.onClearRecentSearchEvent = new TF.Events.Event();
		self.onClearRecentSearchEvent.subscribe(function()
		{
			self.obRecentSearches([]);
		});
		self.onSearchSettingsChangedEvent = new TF.Events.Event();
		self.onSearchSettingsChangedEvent.subscribe(self.searchSettingsChanged.bind(self));

		self.maxFontSizeForSearchText = 16;
		self.minFontSizeForSearchText = 14;
		self.searchBoxPlaceHoderText = ko.observable("");
		self.searchBoxPlaceHolder = ko.observable("");
		self.searchBoxPlaceHolder.subscribe(self.searchBoxPlaceHolderChanged.bind(self));

		self.obIsActive.subscribe(function(data)
		{
			self.onSearchStatusToggle.notify(data);
		});

		self.lastSearchText = null;
	}

	SearchControlViewModel.prototype = Object.create(TF.Control.SearchControlViewModel.prototype);
	SearchControlViewModel.prototype.constructor = SearchControlViewModel;

	/**
	 * Initialize.
	 * @param {object} current view model
	 * @param {dom} element
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.initElement(element);
		self.updateRecentSearches();
	}

	/**
	 * Initialize the search elements.
	 * @param {type} element 
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.initElement = function(element)
	{
		var self = this;
		self.$element = $(element);
		self.$searchBtn = self.$element.find(".search-btn");
		self.$searchHeader = self.$element.find(".search-header");
		self.$searchText = self.$searchHeader.find(".search-text");
		self.$searchControlRow = self.$element.find(".search-control-row");
		self.$searchTypeSelector = self.$searchControlRow.find(".type-selector");
		self.$searchTypesMenu = self.$searchTypeSelector.find(".dropdown-menu");
		self.$searchContent = self.$element.find(".search-content");
		self.$searchResult = self.$searchContent.find(".search-result");

		self.$virtualContainer = self.$searchResult.find(".virtual-container");
		self.$virtualContent = self.$searchResult.find(".virtual-content");

		self.searchBoxPlaceHolder("Search Trips...");
		tf.pageManager.onCurrentDatabaseNameChanged.subscribe(function()
		{
			self.searchBoxPlaceHolder("Search Trips...");
		});

		if (TF.isPhoneDevice)
		{
			self.$searchText.addClass("mobile");
		}
		self.$searchResult.on("scroll", function()
		{
			if (self.currentItems.length > 0 && self.currentItems[0].cards.length > 0)
			{
				var scrollHeight = self.$searchResult[0].scrollHeight, height = self.$searchResult.height(), scrollTop =
					self.$searchResult.scrollTop();
				if (scrollHeight > (height + scrollTop))
				{
					self.setCurrentSearchItem();
					self.userInputChanged();
				}
			}
			var sections = self.$searchResult.find(".section");
			if (sections.length === 1)
			{
				if (!sections.hasClass("fixed"))
				{
					sections.addClass("fixed");
				}
			}
			else if (sections.length > 1)
			{
				sections.removeClass("fixed");
				sections.css({ top: 0 });
				var $section, cardsHeight, sectionheight,
					cardsSupplementHeight = 10, startDistance = 10,
					scrollTop = self.$searchResult.scrollTop();
				for (var i = 0; i < sections.length; i++)
				{
					$section = $(sections[i]);
					cardsHeight = $(sections[i]).next().height() + cardsSupplementHeight;
					if (scrollTop > cardsHeight)
					{
						scrollTop -= cardsHeight;
						sectionheight = $section.outerHeight();
						if (scrollTop > sectionheight)
						{
							scrollTop -= sectionheight;
						}
						else
						{
							if (scrollTop > startDistance && i !== sections.length - 1)
							{
								$(sections[i + 1]).addClass("fixed");
								$(sections[i + 1]).css({ top: sectionheight - scrollTop });
								$section.css({ top: startDistance - scrollTop });
							}
							$section.addClass("fixed");
							break;
						}
					}
					else
					{
						$section.addClass("fixed");
						break;
					}
				}
			}
		});

		$("body").on("mousedown", function(e)
		{
			if (self.keepSearchActive || !self.isNavPanelExpand())
			{
				return;
			}
			var $target = $(e.target);
			if (self.$searchTypeSelector.find(e.target).length === 0)
			{
				self.$searchTypesMenu.hide();
			}

			if ($target.closest(".navigation-quick-search.active").length <= 0
				&& $target.closest(".toggle-button").length <= 0
				&& !$target.hasClass("search-text"))
			{
				self.isMouseDownInSearchZone = false;
				if (self.$searchText.val().trim() === "" && self.obIsActive())
				{
					self.toggleSearchControl();
				}
				else
				{
					self.$searchText.blur();
				}
			}
			else
			{
				self.isMouseDownInSearchZone = true;
			}
		});

		$("body").on("mouseup", function(e)
		{
			self.isMouseDownInSearchZone = false;
		});

		$(window).on("resize", function()
		{
			if (self.currentItems.length > 0 && self.currentItems[0].cards.length > 0)
			{
				self.maxHeight = parseInt(self.$searchResult.css("maxHeight")) - parseInt(self.$searchResult.css("paddingTop")) - parseInt(self.$searchResult.css("paddingBottom"));
				self.setCurrentSearchItem();
				self.userInputChanged();
			}
		})

		self.$element.on("click contextmenu", function(e)
		{
			if (!self.isNavPanelExpand()) { return; }

			var $e = $(e.target);
			if ($e.closest(".type-selector").length <= 0)
			{
				if ($e.closest(".search-btn").length <= 0 &&
					($e.closest(".clear-btn").length <= 0 || self.$searchText.val().trim() !== "") &&
					($e.closest(".navigation-menu").length <= 0))
				{
					self.$searchText.focus();
				}
				if ($(e.target).closest(".search-text").length <= 0)
				{
					self.setSearchInputCursor();
				}
				self.searchTextFocused = true;
			}
			else
			{
				self.$searchText.blur();
				self.searchTextFocused = false;
			}

			clearTimeout(self.clearFocusTimeout);
		});

		self.$searchText.on("focus", function(e)
		{
			self.searchTextFocused = true;
			if ($(e.target).closest(".navigation-quick-search.focus").length <= 0)
			{
				self.$element.addClass("active");
				self.obIsActive(true);
			}
			self.checkIfToResetScrollTop();
			self.userInputChanged();
		});

		self.$searchText.on("blur", function(evt)
		{
			if (self.keepSearchActive)
			{
				return;
			}
			if (!self.isMouseDownInSearchZone && !self.loseFocusOnWindow)
			{
				self.clearFocusTimeout = setTimeout(function()
				{
					if (self.obIsActive() && self.$searchControlRow.css("display") === "none")
					{
						self.toggleSearchControl();
					}
					self.searchTextFocused = false;

					self.loseFocusOnWindow = true;
					self.$searchText.blur();
					self.loseFocusOnWindow = false;
				}, 200);
			}
			evt.stopPropagation();
		});
		self.$searchText.on("keydown", self.inputKeyDown.bind(self));
		self.$searchText.on("input", self.inputSearchText.bind(self));
	}

	SearchControlViewModel.prototype.isNavPanelExpand = function()
	{
		return $(".navigation-menu").hasClass("expand");
	};

	SearchControlViewModel.prototype.setSearchInputCursor = function()
	{
		var self = this;
		if (self.$searchText[0].selectionStart !== undefined &&
			self.$searchText[0].selectionStart === self.$searchText[0].selectionEnd)
		{
			self.$searchText[0].selectionStart = self.$searchText.val().length;
			self.$searchText[0].selectionEnd = self.$searchText.val().length;
		}
	}

	SearchControlViewModel.prototype.onSearchIconClick = function(model, e)
	{
		e.stopPropagation();

		var self = this;
		self.onSearchButtonClickEvent.notify(e);

		clearTimeout(self.clearFocusTimeout);
	};

	SearchControlViewModel.prototype.getRecentSearchesCount = function()
	{
		var self = this, searchSettings = tf.storageManager.get("search.configurations");

		if (!searchSettings || !searchSettings.hasOwnProperty('RecentSearchNumber') || searchSettings.RecentSearchNumber == null)
		{
			return 5;
		}

		return searchSettings.RecentSearchNumber;
	}

	/**
	 * Update the recent search history.
	 * @returns {type} 
	 */
	SearchControlViewModel.prototype.updateRecentSearches = function()
	{
		var self = this;

		return self.getUserRecentSearches().then(function(response)
		{
			if (response)
			{
				self.obRecentSearches(response.slice(0, self.getRecentSearchesCount()));
			}
			return Promise.resolve();
		});
	};

	/**
	 * Show/Hide the search toolbar.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.toggleSearchControl = function(e)
	{
		var self = this;

		if (!self.obIsActive())
		{
			self.obIsActive(true);
			self.expandSearch();
		}
		else
		{
			self.collapseSearch();
		}
	};

	/**
	 * Expand the Search widget.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.expandSearch = function()
	{
		var self = this;
		self.$element.addClass("active");

		// Set the width and then remove it to solve a chrome display issue.
		// Without it, the icon's position would have a slight movement when search is activated.
		self.$element.css("width", "64px");
		self.$searchText.focus();
		self.$element.css("width", "");

		self.setSearchInputCursor();
		self.checkIfToResetScrollTop();
	};

	/**
	 * Collapse the Search widget.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.collapseSearch = function()
	{
		var self = this;
		self.$element.removeClass("active");
		self.obIsActive(false);
	};

	/**
	 * Open Types menu.
	 * @param {object} model the knockout model.
	 * @param {object} e the dom element.
	 */
	SearchControlViewModel.prototype.openTypesMenuClick = function(model, e)
	{
		var self = this, menu = $(e.currentTarget).find(".dropdown-menu");

		if (self.searchTextFocused)
		{
			clearTimeout(self.clearFocusTimeout);
			self.setSearchInputCursor();
		}

		menu.show();
	};

	/**
	 * The click event handler for clearSearch button.
	 * @param {object} model the knockout model.
	 * @param {event} e the dom element.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.clearSearchClick = function(model, e)
	{
		this.clearText();
		e.stopPropagation();
	};

	/**
	 * Clear the text when there is any, collapse the search when there is no text.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.clearText = function()
	{
		var self = this, currentText = self.$searchText.val().trim();
		if (currentText === "")
		{
			self.collapseSearch();
		}
		else
		{
			self.obIsLoading(false);
			clearTimeout(self.deferSearchTimeout);
			self.$searchText.val("");
			self.obHasSearchBeenConducted(false);
			self.obSuggestedResult([]);
			self.resetVirtualContainer();
			self.$searchText.focus();
			self.setSearchInputCursor();
			clearTimeout(self.clearFocusTimeout);
		}
	};

	/**
	 * Change type for search.
	 * @param {object} model the knockout model.
	 * @param {object} e the dom element.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.selectTypeClick = function(model, e)
	{
		var self = this,
			text = self.$searchText.val().trim(),
			typeChanged = self.obSelectType().value !== model.value;

		self.switchDataType(model);
		self.$searchTypesMenu.hide();
		if (typeChanged && text !== "")
		{
			self.search(text);
		}

		if (self.searchTextFocused)
		{
			clearTimeout(self.clearFocusTimeout);
		}
		self.$searchText.focus();
		self.setSearchInputCursor();

		if (e)
		{
			e.stopPropagation();
		}
	};

	/**
	 * Switch to specified data type and change the sequence in the dropdown menu.
	 * @param {object} selectedType The datat type that the user selects.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.switchDataType = function(selectedType)
	{
		var self = this,
			types = $.grep(self.allTypes, function(type)
			{
				return type.value !== selectedType.value;
			});

		types.unshift(selectedType);
		self.obSelectType(selectedType);
		self.obAllTypes(types);
	};

	/**
	 * Find the data type by its value.
	 * @param {string} value The data type value.
	 * @returns {object} value The data type that matches the value. 
	 */
	SearchControlViewModel.prototype.findDataTypeByValue = function(value)
	{
		var idx, selectedType, typeList = this.obAllTypes();

		for (idx = 0; idx < typeList.length; idx++)
		{
			selectedType = typeList[idx];
			if (selectedType.value === value)
			{
				return selectedType;
			}
		}
	}

	SearchControlViewModel.prototype.searchBoxPlaceHolderChanged = function()
	{
		var self = this, placeholder, width;
		if (!self.$searchText || self.$searchText.length <= 0)
		{
			return;
		}
		placeholder = self.searchBoxPlaceHolder(), width = self.$searchText.width();
		if (placeholder && width > 0)
		{
			placeholder = self.calcSearchBoxPlaceHolderText(
				placeholder, self.maxFontSizeForSearchText, self.minFontSizeForSearchText, self.$searchText.width());
		}
		self.searchBoxPlaceHoderText(placeholder);
	}

	/**
	 * Calculate searchbox placeholder text and manually add ellipsis.
	 * @param {any} text
	 * @param {any} maxFontSize
	 * @param {any} minFontSize
	 * @param {any} maxWidth
	 */
	SearchControlViewModel.prototype.calcSearchBoxPlaceHolderText = function(text, maxFontSize, minFontSize, maxWidth)
	{
		var self = this, $tempDiv = $("<div>"), fontSize = maxFontSize,
			css = {
				fontFamily: "SourceSansPro-Regular",
				fontSize: "16px",
				display: "inline"
			},
			textResult = text,
			textTruncated;
		$("body").append($tempDiv);
		$tempDiv.text(text);
		$tempDiv.css(css);
		textTruncated = $tempDiv.outerWidth() >= maxWidth;

		while (textTruncated && fontSize > minFontSize)
		{
			fontSize--;
			$tempDiv.css("font-size", fontSize);
			textTruncated = $tempDiv.outerWidth() >= maxWidth;
		}

		self.placeholderFontSize = fontSize;
		self.$searchText.removeClass("font14").removeClass("font15").removeClass("font16")
			.addClass("font" + self.placeholderFontSize);

		if (self.$searchText.val().length <= 0)
		{
			while (textTruncated && textResult.length > 0)
			{
				textResult = textResult.slice(0, -4) + '...';
				$tempDiv.text(textResult);
				textTruncated = $tempDiv.outerWidth() >= maxWidth;
			}

			self.$searchText.css("fontSize", self.placeholderFontSize);
		}

		$tempDiv.remove();

		return textResult;
	}

	/**
	 * Fired after inputing some characters.
	 * @param {object} model the knockout model.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.inputSearchText = function() 
	{
		var self = this,
			text = self.$searchText.val(),
			type = self.obSelectType().value,
			exp = /[^0-9a-zA-Z\.\,\:\-\+\@\[\]\*\'\&\/\#\(\)\_ ]/g,
			css = "", fontSize;

		if (exp.test(text))
		{
			text = text.replace(exp, "")
			self.$searchText.val(text);
			if (self.obInputTextHint() === text)
			{
				return;
			}
		}

		if (self.placeholderFontSize)
		{
			self.$searchText.css("fontSize", text.length === 0 ? self.placeholderFontSize : "");
		}

		if (self.deferSearchTimeout)
		{
			clearTimeout(self.deferSearchTimeout);
		}

		text = text.trim();
		if (text.length <= 2)
		{
			self.obIsLoading(false);
			self.obHasSearchBeenConducted(false);
			self.obSuggestedResult([]);
			self.resetVirtualContainer();
		}
		else
		{
			self.deferSearchTimeout = setTimeout(function()
			{
				//search
				self.search(text);
			}, 500);
		}
	};

	/**
	 * In virtual scroll mode, set the result item according to scroll top of the search result div.
	 * @returns {promise} after image loaded.
	 */
	SearchControlViewModel.prototype.setCurrentSearchItem = function()
	{
		var self = this, scrollTop, begin, end, itemCountPerPage, cardsCount, newItems = [], marginTop;
		if (self.currentItems.length <= 0)
		{
			self.resetVirtualContainer();
			self.obSuggestedResult([]);
			return Promise.resolve();
		}
		else if (!self.currentItems[0].cards || self.currentItems[0].cards.length <= 0)
		{
			return Promise.resolve();
		}

		self.topDelta = self.resultHeaderHeight + self.sectionHeight;
		self.$virtualContainer.height(cardsCount * self.singleCardHeight + self.topDelta);
		scrollTop = self.$searchResult.scrollTop();
		begin = Math.floor((scrollTop - self.topDelta) / self.singleCardHeight);
		begin = begin > 0 ? begin : 0;

		if (!self.maxHeight)
		{
			self.maxHeight = parseInt(self.$searchResult.css("maxHeight")) - parseInt(self.$searchResult.css("paddingTop")) - parseInt(self.$searchResult.css("paddingBottom"));
		}
		itemCountPerPage = Math.ceil((self.maxHeight - self.topDelta) / self.singleCardHeight);
		end = begin + itemCountPerPage + 1;
		if (end > cardsCount)
		{
			end = cardsCount;
		}

		if (end - begin < itemCountPerPage && begin != 0)
		{
			begin = end - itemCountPerPage;
			if (begin < 0)
			{
				begin = 0;
			}
		}

		newItems = $.extend(true, [], self.currentItems);
		newItems[0].cards = self.currentItems[0].cards.slice(begin, end);
		self.obSuggestedResult(newItems);
		self.includesPhoto(newItems);
		if (begin >= 1)
		{
			self.$virtualContainer.find(".result-head").hide();
			marginTop = begin * self.singleCardHeight;
		}
		else
		{
			self.$virtualContainer.find(".result-head").show();
			marginTop = 0;
		}
		self.$virtualContent.css("marginTop", marginTop);
	}

	SearchControlViewModel.prototype.checkIfIncludesPhoto = function()
	{
		var self = this, searchSettings = tf.storageManager.get("search.configurations");

		if (!searchSettings || !searchSettings.hasOwnProperty('ShowImageIcon') || searchSettings.ShowImageIcon == null)
		{
			return true;
		}

		return searchSettings.ShowImageIcon;
	}

	SearchControlViewModel.prototype.includesPhoto = function(items)
	{
		var self = this, dataType;

		if (!self.checkIfIncludesPhoto())
		{
			return;
		}

		items.forEach(function(item)
		{
			dataType = item.type;
			if (dataType !== "student" && dataType !== "staff" && dataType !== "vehicle")
			{
				return;
			}
			if (!(item && item.cards && Array.isArray(item.cards)))
			{
				return;
			}
			item.cards.forEach(function(card)
			{
				if (card.imageSrc !== undefined)
				{
					return;
				}
				self.photoHelper.getImage(dataType, card.Id, "noimage", undefined, true).then(function(response)
				{
					if (response)
					{
						this.imageSrc = "url(data:image/jpeg;base64," + response + ")";
						var $card = self.$searchResult.find("[data-index=" + this.Id + "]");
						if ($card.length > 0)
						{
							$card.prepend("<div class='photo' style='background-image: " + this.imageSrc + "'></div>");
							self.autoAdjustFontSize($card);
							self.showSearchTextInElementContent($card);
						}
					}
					else
					{
						this.imageSrc = null;
					}
				}.bind(card));
			});
		});
	};

	/**
	 * Reset the status of Virtual Container
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.resetVirtualContainer = function()
	{
		var self = this;
		self.currentItems.length = 0;
		self.$virtualContainer.find(".result-head").show();
		self.$virtualContainer.css("height", "auto");
		self.$virtualContent.css("marginTop", 0);
	}

	/**
	 * Process the search text before search.
	 * @param {string} searchText The user input search text.
	 * @returns {string} The processed text. 
	 */
	SearchControlViewModel.prototype.processSearchText = function(searchText)
	{
		var commaSplitArray = searchText.split(','), spaceSplitArray, commaResultArray = [], spaceResultArray;
		$.each(commaSplitArray, function(index, item)
		{
			item = item.trim();
			spaceSplitArray = item.split(' ');
			spaceResultArray = [];
			$.each(spaceSplitArray, function(index2, item2)
			{
				item2 = item2.trim();
				if (item2.length > 0)
				{
					spaceResultArray.push(item2);
				}
			});
			if (spaceResultArray.length > 0)
			{
				commaResultArray.push(spaceResultArray.join(' '));
			}
		});

		return commaResultArray.join(',');
	};

	SearchControlViewModel.prototype.searchSettingsChanged = function()
	{
		var self = this, lastSelectedType = self.obSelectType(), currentSearchText = self.$searchText.val().trim(),
			suggestedResult = self.obSuggestedResult();

		self.updateAllDataTypes();
		self.obAllTypes(self.allTypes);

		self.updateRecentSearches();
		self.obNotShowRecentSearch(self.getRecentSearchesCount() === 0);

		if ($.grep(self.allTypes, function(type) { return type.value === lastSelectedType.value; }).length === 0)
		{
			self.obSelectType(self.allTypes[0]);
		}
		else
		{
			self.switchDataType(lastSelectedType);
		}

		// apply new search settings only if user already searched something.
		if (suggestedResult && suggestedResult.length === 0) return;
		if (self.lastSearchText == null || self.lastSearchText.length === 0 || self.lastSearchText != currentSearchText) return;

		self.search(self.lastSearchText);
	};

	/**
	 * Search for result.
	 * @param {string} text Search text.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.search = function(text)
	{
		var self = this,
			searchText = text, type = self.obSelectType().value;

		if (self.compareToPendingSearchCondition(searchText, type)) { return; }
		self.updatePendingSearchCondition(searchText, type);

		self.lastSearchText = text;

		self.obIsLoading(true);
		ga('send', 'event', 'Action', 'Search', searchText);
		self.getAllSuggestedResult(searchText, type).then(function(response)
		{
			self.updatePendingSearchCondition("", "");

			if (response)
			{
				var result = response.searchResult,
					searchText = response.searchText,
					searchType = response.searchType;

				// If the search condition of this response does not match current condition. skip it.
				if (!(searchText === self.$searchText.val().trim() && searchType === self.obSelectType().value)) { return; }

				self.obInputTextHint(searchText);
				self.obHasSearchBeenConducted(true);

				if (searchType === "all" && result.length !== 1)
				{
					self.resetVirtualContainer();
					self.obSuggestedResult(result);
					self.includesPhoto(result);
				}
				else
				{
					self.currentItems = result;
					self.setCurrentSearchItem();
				}

				if (self.$searchContent.css("display") === "none")
				{
					self.requireScrollTopReset = true;
				}
				else
				{
					self.$searchResult.scrollTop(0);
				}

				self.userInputChanged();
			}

			self.updateRecentSearches();
			self.obIsLoading(false);
		});
	}

	/**
	 * Fired after key down.
	 * @param {object} e Key down argument.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.inputKeyDown = function(e)
	{
		var self = this,
			text = self.$searchText.val().trim(),
			dataType = self.obSelectType();

		switch (e.keyCode)
		{
			case $.ui.keyCode.ENTER:
				if (self.processSearchText(text) !== "")
				{
					self.search(text);
					self.saveUserSearch(dataType, text);
				}
				break;
			case $.ui.keyCode.ESCAPE:
				e.preventDefault();
				e.stopPropagation();
				self.clearText();
				break;
			default:
				break;
		}
	};

	SearchControlViewModel.prototype.getResultCountPerDataType = function()
	{
		var self = this, searchSettings = tf.storageManager.get("search.configurations");

		if (!searchSettings || !searchSettings.hasOwnProperty('ResultPerDataType') || searchSettings.ResultPerDataType == null)
		{
			return 3;
		}

		return searchSettings.ResultPerDataType;
	}

	SearchControlViewModel.prototype.updateAllDataTypes = function()
	{
		var self = this, searchSettings = tf.storageManager.get("search.configurations"), getTypeText;

		if (!searchSettings || !searchSettings.hasOwnProperty('DataTypeConfig') || searchSettings.DataTypeConfig == null)
		{
			self.allTypes = self.defaultAllTypes;
			return;
		}

		getTypeText = function(name)
		{
			switch (name)
			{
				case 'tripname':
					return 'Trip Name';
				case 'vehicle':
					return 'Vehicle';
				case 'submitter':
					return 'Submitter';
				case 'tripdate':
					return 'Trip Date';
				case 'driver':
					return 'Driver';
				case 'destination':
					return 'Destination';
				case 'school':
					return 'School';
				case 'department':
					return 'Department';
				case 'classification':
					return 'Classification';
				case 'billingclassification':
					return 'Billing Classification';
			}
			return '';
		};
		self.allTypes = [];
		self.allTypes.push({ text: "All Columns", value: "all", permission: true });
		$.each(searchSettings.DataTypeConfig, function(index, item)
		{
			if (item.selected)
			{
				self.allTypes.push({
					text: getTypeText(item.name),
					value: item.name,
					permission: true
				});
			}
		});
	}

	/**
	 * Gets search result
	 * @param {string} type the data type of search result
	 * @param {string} value the search text
	 * @returns {object} the search result
	 */
	SearchControlViewModel.prototype.getAllSuggestedResult = function(value, type)
	{
		var self = this, Deferred = $.Deferred(), allTypeTexts,
			processedText = self.processSearchText(value),
			createResponseObj = function(value, type, result)
			{
				return {
					searchText: value,
					searchType: type,
					searchResult: result
				};
			};

		self.obChangeDataSourceShow(false);
		if (processedText === "")
		{
			Deferred.resolve(false);
		}
		else if (type !== "all")
		{
			var PromiseAll = [], curType;
			PromiseAll.push(self.getSuggestedResultByType(type, processedText, Number.MAX_SAFE_INTEGER));
			PromiseAll.push(tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "bycolumns"), {
				paramData: {
					column: "all",
					text: encodeURIComponent(processedText)
				}
			}, { overlay: false }));
			Promise.all(PromiseAll).then(function(result)
			{
				var singleResult = result[0], allResults = result[1].Items[0];

				var primise = Promise.resolve();
				if (singleResult.length <= 0)
				{
					primise = self.checkAllDBs();
				}
				primise.then(function()
				{
					self.obAllResultsCount(allResults.SimpleEntities.length);
					if (singleResult.length > 0)
					{
						self.obSingleResultCount(singleResult[0].cards.length);
					}
					Deferred.resolve(createResponseObj(value, type, singleResult[0] ? [singleResult[0]] : []));
				});
			});
		}
		else
		{
			var count = self.getResultCountPerDataType();
			self.getSuggestedResultByType(type, processedText, count).then(function(result)
			{
				var allResultsCount = self.allResultsCount,
					searchResult = result;
				var primise = Promise.resolve();
				if (searchResult.length === 0)
				{
					primise = self.checkAllDBs();
				}
				primise.then(function()
				{
					self.obAllResultsCount(allResultsCount);
					self.obSingleResultCount(allResultsCount)
					if (searchResult.length === 1)
					{
						self.getSuggestedResultByType(searchResult[0].type, processedText, Number.MAX_SAFE_INTEGER).then(function(result)
						{
							Deferred.resolve(createResponseObj(value, type, result ? result : []));
						});
					}
					else
					{
						allTypeTexts = self.allTypes.map(function(item) { return item.value; });
						searchResult = searchResult.sort(function(a, b)
						{
							return allTypeTexts.indexOf(a.type) - allTypeTexts.indexOf(b.type);
						});
						Deferred.resolve(createResponseObj(value, type, searchResult));
					}
				});
			});
		}

		return Deferred;
	};

	/**
	 * If the length of dbs greater than one, the change data source link will be shown.
	 * @returns {promise} after check if it has more than one db.
	 */
	SearchControlViewModel.prototype.checkAllDBs = function()
	{
		var self = this;
		return tf.datasourceManager.validateAllDBs().then(function(result)
		{
			if (result && result.Items && result.Items[0] && result.Items[0].AnyDBPass && result.Items[0].DBlength > 1)
			{
				self.obChangeDataSourceShow(true);
			}
		});
	};

	/**
	 * Gets search result by type
	 * @param {string} type the data type of search result
	 * @param {string} value the search text
	 * @param {int} count the count of search result
	 * @returns {object} the search result
	 */
	SearchControlViewModel.prototype.getSuggestedResultByType = function(type, value, count)
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "bycolumns"), {
			paramData: {
				column: self.cardStyle[type] ? self.cardStyle[type].field : type,
				text: encodeURIComponent(value)
			}
		}, { overlay: false })
			.then(function(data)
			{
				var result = [];
				if (data.Items[0] && data.Items[0].SimpleEntities && data.Items[0].SimpleEntities.length > 0)
				{
					self.allResultsCount = data.Items[0].SimpleEntities.length;
					result = self.getTypeEntities(data.Items[0], type, count);
				}
				return result;
			});
	};

	SearchControlViewModel.prototype.getTypeEntities = function(entities, type, count)
	{
		var self = this, result = [], columnResult;

		for (var key in self.cardStyle)
		{
			columnResult = { type: key, title: self.cardStyle[key].title, color: self.cardStyle[key].color, whereQuery: entities.WhereQuery, cards: [], count: 0, ids: [] };

			for (var i = 0; i < entities.SimpleEntities.length; i++)
			{
				if (entities.SimpleEntities[i].ColumnsMapping[key] && (type === "all" || type === key))
				{
					if (columnResult.cards.length < count)
					{
						columnResult.cards.push({
							Id: entities.SimpleEntities[i].Id,
							title: entities.SimpleEntities[i].Title,
							subtitle: entities.SimpleEntities[i].ColumnsMapping[key],
							type: key,
							whereQuery: entities.WhereQuery,
							imageSrc: undefined
						});
					}
					columnResult.count++;
					columnResult.ids.push(entities.SimpleEntities[i].Id);
				}
			}
			if (columnResult.cards.length > 0)
			{
				result.push(columnResult);
			}
		}
		return result;
	}

	SearchControlViewModel.prototype.getSuggestedResultsCountByType = function(type, value)
	{
		var self = this;
		var queryString = "?text=" + encodeURIComponent(value);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "search", "fieldtrip", "simple", "ids", queryString)).then(function(Ids)
		{
			return Ids.length;
		});
	};

	/**
	 * The event handler when user clicks on View In Grid.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.viewInGridClick = function(model, e)
	{
		var self = this,
			dataType = self.obSelectType(),
			searchText = self.$searchText.val().trim(),
			options = {
				fromSearch: true,
				searchFilter: model.whereQuery,
				filteredIds: model.ids
			};

		if (TF.isPhoneDevice)
		{
			$(".navigation-container.mobile").empty();
			$(".navigation-container").removeClass("mobile");
		}
		self.goToGrid(options);
		self.updateRecentSearches();
		self.onNavComplete.notify();
	};

	/**
	 * The event handler when user clicks on any suggested result.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.suggestedResultClick = function(model, e)
	{
		//TO DO
	};

	/**
	 * Go to grid URL
	 * @param {string} type The data type for this search.
	 * @param {object} options The options for grid.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.goToGrid = function(options)
	{
		var self = this;
		tf.loadingIndicator.showImmediately();
		self.collapseSearch();
		tf.pageManager.openNewPage("fieldtrips", options);
		self.$searchText.blur();
		tf.loadingIndicator.tryHide();
	};

	/**
	 * To change the select type to 'all', then search.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.showAllClick = function()
	{
		var self = this,
			model = $.grep(self.allTypes, function(type) { return type.value === "all"; })[0];
		self.selectTypeClick(model);
	};

	/**
	 * To change the select type to 'all', then search.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.openDataSourceModal = function()
	{
		var self = this;
		self.keepSearchActive = true;
		tf.showSelectDataSourceModel(tf.pageManager.currentDatabaseName()).then(function()
		{
			self.keepSearchActive = false;
		});
	};

	/**
	 * Get the type display label by the type value.
	 * @param {string} value The type value.
	 * @returns {void} The type display label.
	 */
	SearchControlViewModel.prototype.recentSearchSubtitleFormat = function(value)
	{
		var self = this;
		for (var i = 0; i < self.allTypes.length; i++)
		{
			if (self.allTypes[i].value === value)
			{
				return self.allTypes[i].text;
			}
		}
		return "";
	};

	/**
	 * The event handler when user clicks on any recent search record.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.recentSearchRecordClick = function(searchRecord)
	{
		var self = this,
			selectedDataType = self.findDataTypeByValue(searchRecord.type),
			searchText = searchRecord.text;

		if (!selectedDataType.permission)
		{
			selectedDataType = self.findDataTypeByValue("all");
		}

		self.switchDataType(selectedDataType);
		self.$searchText.val(searchText);
		self.$searchText.focus();
		self.setSearchInputCursor();
		clearTimeout(self.deferSearchTimeout);
		clearTimeout(self.clearFocusTimeout);
		self.searchTextFocused = true;
		self.search(searchText);
	};

	/**
	 * Request to save this user search record.
	 * @param {type} dataType The data type for this search.
	 * @param {type} searchText The text user input for the search.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.saveUserSearch = function(dataType, searchText)
	{
		var self = this,
			dataTypeValue = dataType.value,
			searchText = searchText.trim();

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "SearchRecord", "save"), {
			paramData: {
				dataType: dataTypeValue,
				searchText: searchText,
				productInfo: TF.productName
			}
		}, { overlay: false });
	};

	/**
	 * Request for the recent searches of current user.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.getUserRecentSearches = function()
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "SearchRecord", "searchByCurrentUser"), {
			paramData: {
				productInfo: TF.productName
			}
		}, { overlay: false })
			.then(function(response)
			{
				if (!response) { return; }

				var results = self.userSearchEntitiesFormation(response.Items);

				return Promise.resolve(results);
			});
	};

	/**
	 * Format the UserSearch entities.
	 * @param {type} entityList
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.userSearchEntitiesFormation = function(entityList)
	{
		if (!Array.isArray(entityList)) { return []; }

		return entityList.map(function(entity)
		{
			return {
				text: entity.SearchText,
				type: entity.DataType
			};
		});
	};

	/**
	 * Triggered when user's input has been changed.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.userInputChanged = function()
	{
		var self = this;
		self.highlightKeywordsInResult();
		self.autoAdjustFontSize();
		self.showSearchTextInElementContent();
	};

	/**
	 * Split the user input search text into keywords.
	 * @param {string} searchInputText The user input search text.
	 * @returns {object} The array that contains keywords. 
	 */
	SearchControlViewModel.prototype.splitKeywords = function(searchInputText)
	{
		var keyword, result = [],
			candidateList = searchInputText.split(","),
			subCandidateList;

		$.each(candidateList, function(index, item)
		{
			item = item.trim();
			subCandidateList = item.split(" ");

			$.each(subCandidateList, function(index2, item2)
			{
				keyword = item2.trim();
				if (!!keyword)
				{
					result.push(item2);
				}
			});

			if (subCandidateList.length > 1)
			{
				result.push(item);
			}
		});

		return result;
	};

	/**
	 * Bolden the keyword with the title and subtitle.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.highlightKeywordsInResult = function()
	{
		var isCaseSensitive = false,
			keywords = this.obSearchKeywords(),
			$textList = $(".card-title, .card-subtitle");

		this.elementContentHelper.boldenKeywordsInText($textList, keywords, isCaseSensitive);
	};

	/**
	 * Adjust the font-size to fix its element's width.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.autoAdjustFontSize = function($cards)
	{
		var self = this,
			maxFontSizeForCardTitle = 15,
			minFontSizeForCardTitle = 13,
			$cards = $cards ? $cards : self.$searchResult.find(".card"),
			$generalCards = $cards.filter(function(index, card)
			{
				return $(card).children(".photo").length <= 0;
			}),
			$photoCards = $cards.filter(function(index, card)
			{
				return $(card).children(".photo").length > 0;
			});

		function reduceFontSizeUntil($baseCards)
		{
			if ($baseCards.length > 0)
			{
				var $cardLeft = $baseCards.find(".card-left"),
					$cardTitles = $cardLeft.find(".card-title"),
					maxCardTitleWidth = parseInt($cardLeft.css("max-width"));

				// For title in the data card.
				self.elementContentHelper.reduceFontSizeUntil($cardTitles, maxFontSizeForCardTitle, minFontSizeForCardTitle, maxCardTitleWidth);
			}
		}
		reduceFontSizeUntil($generalCards);
		reduceFontSizeUntil($photoCards);
		// For result header.
		self.autoAdjustResultHeaderFontSize();
	};

	/**
	 * Make sure the bolden search text is shown (not in the truncated part).
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.showSearchTextInElementContent = function($cards)
	{
		var self = this,
			keywords = self.obSearchKeywords(),
			$cards = $cards ? $cards : self.$searchResult.find(".card"),
			$generalCards = $cards.filter(function(index, card)
			{
				return $(card).children(".photo").length <= 0;
			}),
			$photoCards = $cards.filter(function(index, card)
			{
				return $(card).children(".photo").length > 0;
			});

		function adjustTextWithKeywordForDisplay($baseCards)
		{
			if ($baseCards.length > 0)
			{
				var $cardLeft = $baseCards.find(".card-left"),
					$cardTitles = $cardLeft.find(".card-title, .card-subtitle"),
					maxCardTitleWidth = parseInt($cardLeft.css("max-width"));
				self.elementContentHelper.adjustTextWithKeywordForDisplay($cardTitles, keywords, maxCardTitleWidth);
			}
		}
		adjustTextWithKeywordForDisplay($generalCards);
		adjustTextWithKeywordForDisplay($photoCards);
	};

	/**
	 * Update the saved pending search condition so only matched response would be applied.
	 * @param {string} text The search text.
	 * @param {string} type The data type.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.updatePendingSearchCondition = function(text, type)
	{
		this.pendingSearch["searchText"] = text;
		this.pendingSearch["searchType"] = type;
	};

	/**
	 * Whether the text and type are identical with the pending search condition.
	 * @param {string} text The search text.
	 * @param {string} type The data type.
	 * @returns {bool} Whether the given information matches current search condition. 
	 */
	SearchControlViewModel.prototype.compareToPendingSearchCondition = function(text, type)
	{
		return (text === this.pendingSearch["searchText"] && type === this.pendingSearch["searchType"]);
	};

	/**
	 * Check if the scrollTop for search result should be set to 0.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.checkIfToResetScrollTop = function()
	{
		var self = this;

		if (self.requireScrollTopReset && self.$searchResult.is(":visible"))
		{
			self.$searchResult.scrollTop(0);
			self.requireScrollTopReset = false;
		}
	};

	/**
	 * Auto adjust the font-size for the result header.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.autoAdjustResultHeaderFontSize = function()
	{
		var self = this, maxWidth,
			maxFontSize = 15, minFontSize = 12,
			fontSize = maxFontSize,
			$resultHeader = self.$searchResult.find(".result-head"),
			$headerLabel = $resultHeader.find(".head-label"),
			$searchText = $resultHeader.find(".search-text"),
			totalWidth = $resultHeader.width();

		$searchText.css({ "display": "inline", "width": "auto", "padding-left": 0, "padding-right": 0 });

		do
		{
			$resultHeader.css("font-size", fontSize);
			maxWidth = totalWidth - $headerLabel.width() - 2;

		} while ($searchText.width() >= maxWidth && --fontSize > minFontSize)

		// Set style back to original.
		$searchText.css({ "display": "", "width": "", "padding-left": "", "padding-right": "" });
		$searchText.css("width", maxWidth);
	};

	/**
	 * The event handler when user hover on Section In Grid.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.mouseOnSection = function(model, e)
	{
		var self = this, $sectionTitle = $(e.currentTarget.children[0]), $viewInGrid = $(e.currentTarget.children[1].children[1]);
		if (e.handleObj.type === "mouseover")
		{
			$sectionTitle.addClass('hover');
			$viewInGrid.addClass('hover');
		}
		else
		{
			$sectionTitle.removeClass('hover');
			$viewInGrid.removeClass('hover');
		}
	};

	/**
	 * Open Search settings modal.
	 * @param {Object} model 
	 * @param {Event} e 
	 */
	SearchControlViewModel.prototype.openSearchSettingsModal = function(model, e)
	{
		var self = this,
			manageModal = new TF.Modal.SearchSettingsModalViewModel({
				onClearRecentSearchEvent: self.onClearRecentSearchEvent,
				onSearchSettingsChangedEvent: self.onSearchSettingsChangedEvent
			});

		self.keepSearchActive = true;
		tf.modalManager.showModal(manageModal).then(function(result)
		{
			self.keepSearchActive = false;
			self.$searchText.focus();
		});
	};

	/**
	 * The dispose function.
	 * @returns {void} 
	 */
	SearchControlViewModel.prototype.dispose = function()
	{
		var self = this;
		self.onSearchButtonClickEvent.unsubscribeAll();
		self.onSearchStatusToggle.unsubscribeAll();
		self.onClearRecentSearchEvent.unsubscribeAll();
		self.onSearchSettingsChangedEvent.unsubscribeAll();
	};

})();
