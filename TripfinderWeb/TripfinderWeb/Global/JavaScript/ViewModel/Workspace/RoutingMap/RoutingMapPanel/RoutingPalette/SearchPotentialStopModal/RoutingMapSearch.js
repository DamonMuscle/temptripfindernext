(function()
{
	createNamespace("TF.RoutingMap").RoutingMapSearch = RoutingMapSearch;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function RoutingMapSearch(mapInstance, options)
	{
		var self = this;
		self.map = mapInstance.map;
		self.mapInstance = mapInstance;
		self.$element = null;
		self.$searchBtn = null;
		self.$searchToolContainer = null;
		self.$searchText = null;
		self.obIsActive = ko.observable(true);
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
		self.obSearchKeywords = ko.computed(function()
		{
			var searchText = self.obInputTextHint().replace(/\\/g, "\\\\");

			return self.splitKeywords(searchText);
		}, self);

		self.maxHeight = 380;
		self.topDelta = 0;
		self.singleCardHeight = 61;
		self.sectionHeight = 38;
		self.resultHeaderHeight = 25;
		self.$virtualContainer = null;
		self.$virtualContent = null;
		self.currentItems = [];

		// Types
		self.allTypes = [
			{ text: "All Data Types", value: "all" },
			{ text: "Locations", value: "fieldtriplocation" },
			{ text: "Map Address", value: "mapAddress" },
			{ text: "Point of Interest", value: "poi" },
			// { text: "Field Trip Stops", value: "" },
		];

		self.obAllTypes = ko.observable(self.allTypes);
		self.obSelectType = ko.observable(self.allTypes[0]);

		// Geocode type
		self.GeocodeTpyes = [{ text: 'Address Point', value: 'addressPoint' }, { text: 'Map Street', value: 'mapStreet' }];
		self.obGeocodeTpyes = ko.observableArray(self.GeocodeTpyes);
		self.obGeocodeSelectType = ko.observable(self.obGeocodeTpyes()[0]);
		self.obGeocodeSelectTypeText = ko.computed(function()
		{
			return self.obGeocodeTpyes()[0].text;
		}, this);

		// Results
		self.cardStyle = {
			"fieldtriplocation": { title: "Locations", color: "#5B548F" },
			"tripstop": { title: "Field Trip Stops", color: "#C39" },
			"mapAddress": { title: "Map Address", color: "#ff0000" },
			"poi": { title: "Point of Interest", color: "#DA534F" },
		};
		self.obSuggestedResult = ko.observable([]);
		self.obAllResultsCount = ko.observable(0);
		self.obSingleResultCount = ko.observable(0);

		// Events
		self.openTypesMenuClick = self.openTypesMenuClick.bind(self);
		self.clearSearchClick = self.clearSearchClick.bind(self);
		self.selectTypeClick = self.selectTypeClick.bind(self);
		self.inputSearchText = self.inputSearchText.bind(self);
		self.viewAllClick = self.viewAllClick.bind(self);
		self.suggestedResultClick = self.suggestedResultClick.bind(self);
		self.suggestedResultAddClick = self.suggestedResultAddClick.bind(self);

		self.inputKeyDown = self.inputKeyDown.bind(self);
		self.mouseOnSection = self.mouseOnSection.bind(self);
		self.showAllClick = self.showAllClick.bind(self);
		self.createFromFileChangeEvent = self.createFromFileChangeEvent.bind(self);

		self.onNavComplete = new TF.Events.Event();

		self.searchBoxPlaceHolderText = ko.observable("Search");

		self.lastSearchText = null;

		self.options = $.extend({
			addButtonVisible: false,
			onChoseFromFileEvent: function() { },
			onAddButtonClick: function() { },
			isDisabled: false
		}, options);

		self.isDisabled = self.options.isDisabled;

		self.obAddButtonVisible = ko.observable(self.options.addButtonVisible);

		self.selectedItems = [];
	}

	/**
	 * Initialize.
	 * @param {object} current view model
	 * @param {dom} element
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.init = function(model, element)
	{
		var self = this;
		self.initElement(element);
		// self.initDropUploadFile();
	};

	/**
	 * Initialize the search elements.
	 * @param {type} element 
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.initElement = function(element)
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

		// because some time the element is hidden,so need a fix width to fix this problem.
		self.$virtualContent.width(Math.max((self.$element.width() - 41), 343));
		// fix section head on scroll
		self.$searchResult.on("scroll", function()
		{
			if (self.currentItems.length > 0 && self.currentItems[0].cards.length > 0)
			{
				self.setCurrentSearchItem();
				self.userInputChanged();
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
				var $section, cardsHeight, sectionHeight,
					cardsSupplementHeight = 10, startDistance = 10,
					scrollTop = self.$searchResult.scrollTop();
				for (var i = 0; i < sections.length; i++)
				{
					$section = $(sections[i]);
					cardsHeight = $(sections[i]).next().height() + cardsSupplementHeight;
					if (scrollTop > cardsHeight)
					{
						scrollTop -= cardsHeight;
						sectionHeight = $section.outerHeight();
						if (scrollTop > sectionHeight)
						{
							scrollTop -= sectionHeight;
						}
						else
						{
							if (scrollTop > startDistance && i !== sections.length - 1)
							{
								$(sections[i + 1]).addClass("fixed");
								$(sections[i + 1]).css({ top: sectionHeight - scrollTop });
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

		self.$element.on("click contextmenu", function(e)
		{
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
	};

	RoutingMapSearch.prototype.setSearchInputCursor = function()
	{
		var self = this;
		if (self.$searchText[0].selectionStart !== undefined &&
			self.$searchText[0].selectionStart === self.$searchText[0].selectionEnd)
		{
			self.$searchText[0].selectionStart = self.$searchText.val().length;
			self.$searchText[0].selectionEnd = self.$searchText.val().length;
		}
	};

	RoutingMapSearch.prototype.onSearchIconClick = function(model, e)
	{
		e.stopPropagation();
		var self = this;
		var text = self.$searchText.val().trim();
		if (text)
		{
			self.search(text);
			clearTimeout(self.clearFocusTimeout);
		}
	};

	/**
	 * Open Types menu.
	 * @param {object} model the knockout model.
	 * @param {object} e the dom element.
	 */
	RoutingMapSearch.prototype.openTypesMenuClick = function(model, e)
	{
		var self = this, menu = $(e.currentTarget).find(".dropdown-menu");

		if (self.searchTextFocused)
		{
			clearTimeout(self.clearFocusTimeout);
			self.setSearchInputCursor();
		}

		menu.show(10, function()
		{
			$(document).one("click", function(e)
			{
				if (e.target.closest(".search-control-row"))
				{
					return;
				}
				menu.hide();
			});
		});
	};

	/**
	 * The click event handler for clearSearch button.
	 * @param {object} model the knockout model.
	 * @param {event} e the dom element.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.clearSearchClick = function(model, e)
	{
		this.clearText();
		this.obAllResultsCount(0);
		// self.$searchText.blur();
		e.stopPropagation();
	};

	/**
	 * Clear the text when there is any, collapse the search when there is no text.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.clearText = function()
	{
		var self = this, currentText = self.$searchText.val().trim();
		if (currentText != "")
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
		this.setSelectedItems([]);
	};

	/**
	 * Change type for search.
	 * @param {object} model the knockout model.
	 * @param {object} e the dom element.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.selectTypeClick = function(model, e)
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
	RoutingMapSearch.prototype.switchDataType = function(selectedType)
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
	RoutingMapSearch.prototype.findDataTypeByValue = function(value)
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
	};

	/**
	 * Fired after inputing some characters.
	 * @param {object} model the knockout model.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.inputSearchText = function() 
	{
		var self = this,
			text = self.$searchText.val(),
			exp = /[^0-9a-zA-Z\.\,\:\-\+\@\[\]\*\'\&\/\#\(\)\_ ]/g;

		if (exp.test(text))
		{
			text = text.replace(exp, "");
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
				// search
				self.search(text);
			}, 500);
		}
	};

	/**
	 * In virtual scroll mode, set the result item according to scroll top of the search result div.
	 * @returns {promise} after image loaded.
	 */
	RoutingMapSearch.prototype.setCurrentSearchItem = function()
	{
		var self = this, scrollTop, begin, end, itemCountPerPage, cardsCount, newItems = [], marginTop;
		if (self.currentItems.length <= 0)
		{
			self.resetVirtualContainer();
			self.obSuggestedResult([]);
			return Promise.resolve();
		}

		cardsCount = self.currentItems[0].cards.length;
		if (cardsCount <= 0)
		{
			self.obSuggestedResult([]);
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
		newItems[0].cards.forEach(function(card)
		{
			card.selected = Enumerable.From(self.selectedItems).Any(function(c) { return c == card; });
		});
		self.obSuggestedResult(newItems);
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
	};

	/**
	 * Reset the status of Virtual Container
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.resetVirtualContainer = function()
	{
		var self = this;
		self.currentItems.length = 0;
		self.$virtualContainer.find(".result-head").show();
		self.$virtualContainer.css("height", "auto");
		self.$virtualContent.css("marginTop", 0);
	};

	/**
	 * Process the search text before search.
	 * @param {string} searchText The user input search text.
	 * @returns {string} The processed text. 
	 */
	RoutingMapSearch.prototype.processSearchText = function(searchText)
	{
		var commaSplitArray = searchText.split(","), spaceSplitArray, commaResultArray = [], spaceResultArray;
		$.each(commaSplitArray, function(index, item)
		{
			item = item.trim();
			spaceSplitArray = item.split(" ");
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
				commaResultArray.push(spaceResultArray.join(" "));
			}
		});

		return commaResultArray.join(",");
	};

	/**
	 * Search for result.
	 * @param {string} text Search text.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.search = function(text)
	{
		var self = this,
			searchText = text, type = self.obSelectType().value;

		this.setSelectedItems([]);
		if (self.compareToPendingSearchCondition(searchText, type))
		{
			return;
		}
		self.updatePendingSearchCondition(searchText, type);

		self.lastSearchText = text;

		self.obIsLoading(true);
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

			self.obIsLoading(false);
		});
	};

	/**
	 * Fired after key down.
	 * @param {object} e Key down argument.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.inputKeyDown = function(e)
	{
		var self = this,
			text = self.$searchText.val().trim();
		// dataType = self.obSelectType();

		switch (e.keyCode)
		{
			case $.ui.keyCode.ENTER:
				if (self.processSearchText(text) !== "")
				{
					self.search(text);
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

	RoutingMapSearch.prototype.getResultCountPerDataType = function()
	{
		return 3;
	};

	/**
	 * Gets search result
	 * @param {string} type the data type of search result
	 * @param {string} value the search text
	 * @returns {object} the search result
	 */
	RoutingMapSearch.prototype.getAllSuggestedResult = function(value, type)
	{
		var self = this, Deferred = $.Deferred(), allTypeTexts,
			processedText = self.processSearchText(value);
		function createResponseObj(value, type, result)
		{
			return {
				searchText: value,
				searchType: type,
				searchResult: result
			};
		}

		if (processedText === "")
		{
			Deferred.resolve(false);
		}
		else if (type != "all")
		{
			var curType;
			self.getSuggestedResultByType(type, processedText, 2000).then(function(result)
			{
				var allResultsCount = 0, singleResultCount = 0;
				var count = result ? result.count : 0;
				allResultsCount += count;
				singleResultCount = count;

				self.obAllResultsCount(allResultsCount);
				self.obSingleResultCount(singleResultCount);
				Deferred.resolve(createResponseObj(value, type, result ? [result] : []));
			}).catch(() =>
			{
				self.obAllResultsCount(0);
				self.obSingleResultCount(0);
				Deferred.resolve(createResponseObj(value, type, []));
			});
		}
		else
		{
			var count = self.getResultCountPerDataType();
			var PromiseAll = [];
			for (var i = 0, len = self.allTypes.length; i < len; i++)
			{
				curType = self.allTypes[i];
				if (curType.value !== "all")
				{
					PromiseAll.push(self.getSuggestedResultByType(curType.value, processedText, count));
				}
			}

			Promise.allSettled(PromiseAll).then(function(result)
			{
				var allResultsCount = 0,
					searchResult = $.grep(result, function(item)
					{
						if (item && item.status === "fulfilled" && item.value?.count)
						{
							allResultsCount += item.value.count;
							return item.value;
						}
					}).map(item => item.value);

				self.obAllResultsCount(allResultsCount);
				self.obSingleResultCount(allResultsCount);
				if (searchResult.length === 1)
				{
					self.getSuggestedResultByType(searchResult[0].type, processedText).then(function(result)
					{
						Deferred.resolve(createResponseObj(value, type, result ? [result] : []));
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
		}

		return Deferred;
	};

	/**
	 * Gets search result by type
	 * @param {string} type the data type of search result
	 * @param {string} value the search text
	 * @param {int} count the count of search result
	 * @returns {object} the search result
	 */
	RoutingMapSearch.prototype.getSuggestedResultByType = function(type, value, count)
	{
		// if (type == "addressPoint")
		// {
		// 	return this.getSuggestedResultByAddressPoint(type, value, count);
		// }

		if (type === "mapAddress")
		{
			return this.getSuggestedResultByMapAddress(type, value, count);
		}

		if (type === "poi")
		{
			return this.getSuggestedResultByPOIs(type, value, count);
		}

		// if (type == "poolStops")
		// {
		// 	return this.getSuggestedResultByPoolStops(type, value, count);
		// }

		// if (type == "tripstop")
		// {
		// 	return this.getSuggestedResultByTripStop(type, value, count);
		// }

		return this.getSuggestedResultByNormalType(type, value, count);
	};

	RoutingMapSearch.prototype.getSuggestedResultByNormalType = function(type, value, count)
	{
		var self = this;
		var param = {
			text: value
		}
		if (typeof count === "number")
		{
			param.count = count;
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(type), "simple"), { paramData: param }, { overlay: false })
			.then(function(data)
			{
				if (data.Items[0] && data.Items[0].SimpleEntities && data.Items[0].SimpleEntities.length > 0)
				{
					var style = self.cardStyle[type],
						entities = data.Items[0].SimpleEntities,
						cards = entities.filter(function(item)
						{
							return item.Xcoord;
						}).map(function(item)
						{
							var entity = {
								Id: item.Id,
								// TripId: item.TripId,
								title: item.Title,
								subtitle: item.SubTitle,
								type: type,
								whereQuery: data.Items[0].WhereQuery,
								address: item.Address || item.Title,
								XCoord: item.Xcoord,
								YCoord: item.Ycoord,
								Street: item.Street || item.Title,
								City: item.City,
								geometry: TF.xyToGeometry(location.x, location.y) // add geometry to init Point object in suggestedResultAddClick method
							};

							return entity;
						}),
						diff = entities.length - cards.length;

					return {
						type: type,
						title: style.title,
						color: style.color,
						count: data.TotalRecordCount - diff,
						cards: cards,
						whereQuery: data.Items[0].WhereQuery
					};
				}
			}).catch(function() { });
	};

	RoutingMapSearch.prototype.getSuggestedResultsCountByType = function(type, value)
	{
		var queryString = "?text=" + encodeURIComponent(value);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "search", tf.dataTypeHelper.getEndpoint(type), "simple", "ids", queryString)).then(function(Ids)
		{
			return Ids.length;
		});
	};

	/**
	 * show all records
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.viewAllClick = function(model)
	{
		var self = this;
		for (var i = 0; i < self.allTypes.length; i++)
		{
			if (self.allTypes[i].value == model.type)
			{
				self.obSelectType(self.allTypes[i]);
				break;
			}
		}
		self.search(self.lastSearchText);
	};

	RoutingMapSearch.prototype.suggestedResultAddClick = function(model)
	{
		var result = $.extend({}, model, {
			type: model.type,
			geometry: new tf.map.ArcGIS.Point(model.geometry.x, model.geometry.y, model.geometry.spatialReference)
		});
		this.options.onAddButtonClick(result);
	};

	/**
	 * The event handler when user clicks on any suggested result.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.suggestedResultClick = function(model, e)
	{
		if (this.options.addButtonVisible)
		{
			return;
		}
		var self = this;
		if (e.ctrlKey && e.button == 0)
		{
			var index = self.getIdIndex(self.selectedItems, model);
			if (index === -1)
			{
				self.selectedItems.push(model);
			}
			else
			{
				self.selectedItems.splice(index, 1);
			}
			self.setSelectedItems(self.selectedItems);
			self.lastSelectedItem = model;
		}
		else if (e.shiftKey && e.button == 0)
		{
			var selectedItems = [];
			var allItems = [];
			self.currentItems.forEach(function(item)
			{
				allItems = allItems.concat(item.cards);
			});
			if (allItems && self.lastSelectedItem)
			{
				var preIndex = self.getIdIndex(allItems, self.lastSelectedItem);
				var currentIndex = self.getIdIndex(allItems, model);
				if (preIndex < currentIndex)
				{
					selectedItems = allItems.slice(preIndex, currentIndex + 1);
				}
				else
				{
					selectedItems = allItems.slice(currentIndex, preIndex + 1);
				}
				this.setSelectedItems(selectedItems);
			}
			else
			{
				this.setSelectedItems([model]);
			}
		}
		else
		{
			this.setSelectedItems([model]);
			self.lastSelectedItem = model;
		}
	};

	RoutingMapSearch.prototype.getIdIndex = function(cards, card)
	{
		var index = -1;
		cards.forEach(function(entity, i)
		{
			if (entity == card)
			{
				index = i;
			}
		});
		return index;
	};

	RoutingMapSearch.prototype.setSelectedItems = function(selectedItems)
	{
		this.selectedItems = selectedItems;

		this.$element.find(".card").each(function(i, item)
		{
			$(item).removeClass("selected");
			var card = ko.dataFor(item);
			var selectedCard = selectedItems.filter(function(s)
			{
				return s == card;
			});
			if (selectedCard && selectedCard.length > 0)
			{
				$(item).addClass("selected");
			}
		});
	};

	/**
	 * To change the select type to 'all', then search.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.showAllClick = function()
	{
		var self = this,
			model = $.grep(self.allTypes, function(type) { return type.value === "all"; })[0];
		self.selectTypeClick(model);
	};

	RoutingMapSearch.prototype.createFromFileChangeEvent = function(viewModel, e)
	{
		this.onChoseFromFileEvent(e.target.files, { 'GeocodeType': this.obGeocodeSelectType().value });
		$(e.target).val("");
	};

	RoutingMapSearch.prototype.initDropUploadFile = function()
	{
		var self = this;
		var $dropContainer = this.$element.find(".drop-container");
		$dropContainer.on('drag dragstart dragend dragover dragenter dragleave drop', function(e)
		{
			e.preventDefault();
			e.stopPropagation();
		}).on('dragover dragenter', function()
		{
			$dropContainer.addClass('is-dragover');
		}).on('dragleave dragend drop', function()
		{
			$dropContainer.removeClass('is-dragover');
		}).on('drop', function(e)
		{
			self.onChoseFromFileEvent(e.originalEvent.dataTransfer.files);
		});
	};

	RoutingMapSearch.prototype.onChoseFromFileEvent = function(files, param)
	{
		var self = this;
		if (files.length > 0)
		{
			var file = files[0];
			self.options.onChoseFromFileEvent(file, param);
		}
	};

	/**
	 * Format the UserSearch entities.
	 * @param {type} entityList
	 * @returns {void}
	 */
	RoutingMapSearch.prototype.userSearchEntitiesFormation = function(entityList)
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
	RoutingMapSearch.prototype.userInputChanged = function()
	{
		var self = this;
		self.highlightKeywordsInResult();
		self.showSearchTextInElementContent();
	};

	/**
	 * Split the user input search text into keywords.
	 * @param {string} searchInputText The user input search text.
	 * @returns {object} The array that contains keywords. 
	 */
	RoutingMapSearch.prototype.splitKeywords = function(searchInputText)
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
				if (keyword)
				{
					result.push(item2);
				}
			});
		});

		return result;
	};

	/**
	 * Bolden the keyword with the title and subtitle.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.highlightKeywordsInResult = function()
	{
		var isCaseSensitive = false,
			keywords = this.obSearchKeywords(),
			$textList = $(".card-title, .card-subtitle");

		this.elementContentHelper.boldenKeywordsInText($textList, keywords, isCaseSensitive);
	};

	/**
	 * Make sure the bolden search text is shown (not in the truncated part).
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.showSearchTextInElementContent = function($cardArray)
	{
		var self = this,
			keywords = self.obSearchKeywords(),
			$cards = $cardArray ? $cardArray : self.$searchResult.find(".card"),
			$generalCards = $cards.filter(function(index, card)
			{
				return $(card).children(".photo").length <= 0;
			});

		function adjustTextWithKeywordForDisplay($baseCards)
		{
			if ($baseCards.length > 0)
			{
				var $cardLeft = $baseCards.find(".card-left"),
					$cardTitles = $cardLeft.find(".card-title"),
					$cardSubTitles = $cardLeft.find(".card-subtitle"),
					maxCardTitleWidth = $cardLeft.width();
				self.elementContentHelper.adjustTextWithKeywordForDisplay($cardSubTitles, keywords, maxCardTitleWidth);
				$cardTitles.each((i, e) =>
				{
					var $e = $(e);
					var schoolGradeWidth = $e.parent().find(".school-grade").width() + 5;
					var rightInfoWidth = $e.parent().find(".card-right-info").width();
					var extraWidth = schoolGradeWidth + rightInfoWidth;
					self.elementContentHelper.adjustTextWithKeywordForDisplay($e, keywords, maxCardTitleWidth - extraWidth);
				});
			}
		}

		adjustTextWithKeywordForDisplay($generalCards);
	};

	/**
	 * Update the saved pending search condition so only matched response would be applied.
	 * @param {string} text The search text.
	 * @param {string} type The data type.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.updatePendingSearchCondition = function(text, type)
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
	RoutingMapSearch.prototype.compareToPendingSearchCondition = function(text, type)
	{
		return (text === this.pendingSearch["searchText"] && type === this.pendingSearch["searchType"]);
	};

	/**
	 * Check if the scrollTop for search result should be set to 0.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.checkIfToResetScrollTop = function()
	{
		var self = this;

		if (self.requireScrollTopReset && self.$searchResult.is(":visible"))
		{
			self.$searchResult.scrollTop(0);
			self.requireScrollTopReset = false;
		}
	};

	/**
	 * The event handler when user hover on Section In Grid.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.mouseOnSection = function(model, e)
	{
		var $sectionTitle = $(e.currentTarget.children[0]), $viewInGrid = $(e.currentTarget.children[1].children[1]);
		if (e.handleObj.type === "mouseover")
		{
			$sectionTitle.addClass("hover");
			$viewInGrid.addClass("hover");
		}
		else
		{
			$sectionTitle.removeClass("hover");
			$viewInGrid.removeClass("hover");
		}
	};

	RoutingMapSearch.prototype.toSingleTitle = function(title)
	{
		if (title != "Map Address")
		{
			if (title[title.length - 1] == "s")
			{
				return title.substring(0, title.length - 1);
			}
		}
		return title;
	};

	RoutingMapSearch.prototype.getSuggestedResultByAddressPoint = function(type, value, count)
	{
		var self = this;
		var geoSearch = new TF.RoutingMap.RoutingPalette.GeoSearch(tf.map.ArcGIS, self.map, false);
		return geoSearch.suggestAddressPoint(value).then(function(data)
		{
			var style = self.cardStyle[type],
				allData = (data || []),
				entities = allData.slice(0, count),
				cards = entities.map(function(item)
				{
					var geometry = new tf.map.ArcGIS.Point({
						x: item.location.x,
						y: item.location.y,
						spatialReference: self.map.mapView.spatialReference
					});
					return {
						Id: 0,
						title: item.address,
						subtitle: "",
						type: type,
						whereQuery: "",
						imageSrc: undefined,
						address: item.address,
						x: item.location.x,
						y: item.location.y,
						geometry: geometry
					};
				});
			return {
				type: type,
				title: style.title,
				color: style.color,
				count: allData.length,
				cards: cards,
				whereQuery: ""
			};
		});
	};

	RoutingMapSearch.prototype.getSuggestedResultByMapAddress = async function(type, value, count)
	{
		const self = this;
		const style = self.cardStyle[type];
		const geocodeService = TF.GIS.Analysis.getInstance().geocodeService;
		const center = self._getMapCenterPoint();
		const data = await geocodeService.suggestAddressLocations(value, center);
		const { addresses, errorMessage } = data;
		if (errorMessage !== null)
		{
			return Promise.reject(errorMessage);
		}

		const allData = (addresses || []),
			entities = allData.slice(0, count),
			candidates = await Promise.all(entities.map(item=>geocodeService.findAddressCandidatesREST(item.text, item.magicKey)))
			cards = self._generateMapAddressCards(type, candidates).filter(item => item !== null);

		const result = {
			type: type,
			title: style.title,
			color: style.color,
			count: allData.length,
			cards: cards,
			whereQuery: ""
		};
		return Promise.resolve(result);
	};

	RoutingMapSearch.prototype._generateMapAddressCards = function(type, candidates)
	{
		return candidates.map(candidate => {
			const { location, score, attributes, errorMessage } = candidate;
			if (errorMessage !== null)
			{
				return null;
			}

			return {
				Id: 0,
				title: attributes.LongLabel,
				subtitle: "",
				type: type,
				whereQuery: "",
				imageSrc: undefined,
				address: attributes.ShortLabel,
				Street: attributes.ShortLabel,
				City: attributes.City,
				XCoord: location.x,
				YCoord: location.y,
				Addr_type: attributes.Addr_type,
				geometry: TF.xyToGeometry(location.x, location.y) // add geometry to init Point object in suggestedResultAddClick method
			};
		});
	}

	RoutingMapSearch.prototype.getSuggestedResultByPOIs = async function(type, value, count)
	{
		const self = this,
			style = self.cardStyle[type],
			mapCenterPoint = self._getMapCenterPoint(),
			fetchCount = TF.GIS.Analysis.PlaceServiceConfiguration.MaximumPlaceCount,
			radiusOfMeters = TF.GIS.Analysis.PlaceServiceConfiguration.MaximumRadiusDistance,
			categoryIds = null,
			searchExtent = null,
			placeService = TF.GIS.Analysis.getInstance().placeService;

		const { results } = await placeService.findPlaces(mapCenterPoint, value, categoryIds, radiusOfMeters, searchExtent, fetchCount).catch((result) =>
		{
			const { error, message } = result;
			if (message !== null)
			{
				return Promise.reject(error);
			}
		});

		const allData = results || [];
		const entities = allData.slice(0, count);
		const items = await Promise.all(entities.map(item=>placeService.fetchPOIDetails(item.placeId)));

		const computeSubTitle = (address) =>
		{
			let items = [];
			if (address.streetAddress)
			{
				items.push(address.streetAddress);
			}

			if (address.locality)
			{
				items.push(address.locality);
			}

			if (address.region)
			{
				items.push(address.region);
			}

			if (address.postcode)
			{
				items.push(address.postcode);
			}

			return items.join(", ");
		};

		const cards = entities.map(item =>
		{
			const details = items.find(o => o.results.placeId === item.placeId);
			const address = details.results.address;
			return {
				Id: 0,
				title: item.name,
				subtitle: computeSubTitle(address),
				type: type,
				address: item.name,
				Street: item.name,
				City: address.locality || null,
				XCoord: item.location.longitude,
				YCoord: item.location.latitude,
				Addr_type: null
			};
		});

		const result = {
			type: type,
			title: style.title,
			color: style.color,
			count: allData.length,
			cards: cards,
			whereQuery: ""
		};
		return Promise.resolve(result);
	}

	RoutingMapSearch.prototype._getMapCenterPoint = function()
	{
		return this.mapInstance.getCenter();
	}

	RoutingMapSearch.prototype.getSuggestedResultByTripStop = function(type, value, count)
	{
		return this.getSuggestedResultByNormalType(type, value, count).then(function(data)
		{
			if (!data || data.cards.length == 0)
			{
				return;
			}
			var routingFeatureData = new TF.RoutingMap.RoutingPalette.RoutingFeatureData({ viewModel: {} });
			var query = new tf.map.ArcGIS.Query();
			query.returnGeometry = true;
			query.outFields = ["*"];
			query.where = " DBID = " + tf.datasourceManager.databaseId + " and TripStopID in (" + data.cards.map(function(d) { return d.Id; }).join(",") + ")";
			return new Promise(function(resolve)
			{
				routingFeatureData.tripBoundaryFeatureData.getFeatureLayer().queryFeatures(query).then(function(featureSet)
				{
					var boundaries = featureSet.features;
					data.cards.forEach(function(d)
					{
						var boundary = Enumerable.From(boundaries).FirstOrDefault({}, function(c) { return c.attributes.TripStopID == d.Id && c.attributes.Trip_ID == d.TripId; });
						d.boundary = { geometry: boundary.geometry };
					});
					resolve(data);
				});
			});
		});
	};

	RoutingMapSearch.prototype.getSuggestedResultByPoolStops = function(type, value, count)
	{
		var self = this;
		var stopPoolFeatureData = new TF.RoutingMap.RoutingPalette.StopPoolFeatureData({});
		var escapedValue = value.replaceAll('\'', '\'\'');
		var query = new tf.map.ArcGIS.Query();
		query.returnGeometry = true;
		query.outFields = ["*"];
		query.where = "DBID=" + tf.datasourceManager.databaseId + " and (Street like '%" + escapedValue + "%' or City like '%" + escapedValue + "%' )";
		return new Promise(function(resolve, reject)
		{
			stopPoolFeatureData.stopFeatureData.getFeatureLayer().queryFeatures(query).then(function(featureSet)
			{
				var features = featureSet.features;
				if (features.length == 0)
				{
					resolve();
					return;
				}
				var stopIds = features.map(function(feature)
				{
					return feature.attributes.Stop_ID;
				});
				query.where = "DBID=" + tf.datasourceManager.databaseId + " and  Stop_ID in (" + stopIds.join(",") + ")";
				stopPoolFeatureData.boundaryFeatureData.getFeatureLayer().queryFeatures(query).then(function(boundaryFeatureSet)
				{
					var boundaries = boundaryFeatureSet.features.map(function(boundary)
					{
						return {
							OBJECTID: boundary.attributes.OBJECTID,
							StopId: boundary.attributes.Stop_ID,
							geometry: boundary.geometry
						};
					});
					var boundaryEnumerable = Enumerable.From(boundaries);

					var style = self.cardStyle[type],
						allData = (features || []),
						entities = allData.slice(0, count),
						cards = entities.map(function(item)
						{
							var address = item.attributes.Street + ", " + item.attributes.City;
							return {
								Id: item.attributes.OBJECTID,
								title: address,
								subtitle: "",
								type: type,
								whereQuery: "",
								imageSrc: undefined,
								address: address,
								x: item.geometry.x,
								y: item.geometry.y,
								geometry: item.geometry,
								boundary: boundaryEnumerable.FirstOrDefault({}, function(c) { return c.StopId == item.attributes.Stop_ID; })
							};
						});

					resolve({
						type: type,
						title: style.title,
						color: style.color,
						count: allData.length,
						cards: cards,
						whereQuery: ""
					});
				});
			}, function()
			{
				reject();
			});
		});
	};

	/**
	 * The dispose function.
	 * @returns {void} 
	 */
	RoutingMapSearch.prototype.dispose = function()
	{
	};

})();
