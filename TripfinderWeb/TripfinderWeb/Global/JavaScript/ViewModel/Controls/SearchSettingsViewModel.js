(function()
{
	createNamespace("TF.Control").SearchSettingsViewModel = SearchSettingsViewModel;

	function SearchSettingsViewModel(options)
	{
		var self = this,
			allDataTypes = [
				{ name: "tripname", display: "Trip Name", selected: true, permission: true },
				{ name: "vehicle", display: "Vehicle", selected: true, permission: true },
				{ name: "submitter", display: "Submitter", selected: true, permission: true },
				{ name: "tripdate", display: "Trip Date", selected: true, permission: true },
				{ name: "driver", display: "Driver", selected: true, permission: true },
				{ name: "destination", display: "Destination", selected: true, permission: true },
				{ name: "school", display: "School", selected: true, permission: true },
				{ name: "department", display: "Department", selected: true, permission: true },
				{ name: "classification", display: "Classification", selected: true, permission: true },
				{ name: "billingclassification", display: "Billing Classification", selected: true, permission: true }
			];

		self.itemHeight = 32;
		self.userPreferenceKey = "search.configurations";
		self.availableDataTypes = allDataTypes.filter(function(item) { return item.permission; });
		self.defaultConfigObject = {
			ResultPerDataType: 3,
			ShowImageIcon: true,
			RecentSearchNumber: 5,
			DataTypeConfig: self.availableDataTypes
		};

		self.obResultNumPerDataType = ko.observable();
		self.obShowImageIcon = ko.observable();
		self.obRecentSearchNum = ko.observable();
		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
		self.onClearRecentSearchEvent = options.onClearRecentSearchEvent;
		self.onSearchSettingsChangedEvent = options.onSearchSettingsChangedEvent;
	}

	/**
	 * Request to clear this user search record.
	 * @returns {void} 
	 */
	SearchSettingsViewModel.prototype.clearUserSearch = function()
	{
		var self = this;
		tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "SearchRecord", "delete")).then(function()
		{
			self.onClearRecentSearchEvent.notify();
			self.pageLevelViewModel.popupSuccessMessage("Recent Searches successfully cleared.");
		});
	};

	/**
	 * Initialization.
	 * @param {Object} model 
	 * @param {DOM} element 
	 */
	SearchSettingsViewModel.prototype.init = function(model, element)
	{
		var self = this, $element = $(element);

		self.$element = $element;
		self.$listContent = $element.find(".data-type-list-container .list-content");

		self.setConfigurations(false);
	};

	/**
	 * Set the configurations.
	 * @param {Boolean} isDefault Whether to set to default regardless of saved config.
	 */
	SearchSettingsViewModel.prototype.setConfigurations = function(isDefault)
	{
		var self = this,
			resultNumPerDataType = self.defaultConfigObject.ResultPerDataType,
			showImageIcon = self.defaultConfigObject.ShowImageIcon,
			recentSearchNum = self.defaultConfigObject.RecentSearchNumber,
			availableDataTypes = self.defaultConfigObject.DataTypeConfig,
			savedConfigurations = tf.storageManager.get(self.userPreferenceKey);

		if (!isDefault && savedConfigurations)
		{
			resultNumPerDataType = savedConfigurations.ResultPerDataType;
			showImageIcon = savedConfigurations.ShowImageIcon;
			recentSearchNum = savedConfigurations.RecentSearchNumber;

			availableDataTypes = self.applySavedDataTypeConfigs(availableDataTypes, savedConfigurations.DataTypeConfig);
		}

		self.obResultNumPerDataType(resultNumPerDataType);
		self.obShowImageIcon(showImageIcon);
		self.obRecentSearchNum(recentSearchNum);

		self.$listContent.find(">div.list-item").draggable("destroy");
		self.$listContent.empty();
		self.initDataTypeList(availableDataTypes);
	};

	/**
	 * Apply saved config to specified original one.
	 * @param {Array} original 
	 * @param {Array} saved
	 * @return {Array}
	 */
	SearchSettingsViewModel.prototype.applySavedDataTypeConfigs = function(original, saved)
	{
		var newDataTypeConfigs = [],
			originalMapping = {};
		$.each(original, function(index, item)
		{
			originalMapping[item.name] = item;
		});

		$.each(saved, function(index, item)
		{
			var match = originalMapping[item.name];
			if (match)
			{
				newDataTypeConfigs.push({ name: match.name, display: match.display, selected: item.selected });
				delete originalMapping[item.name];
			}
		});

		for (var key in originalMapping)
		{
			newDataTypeConfigs.push(originalMapping[key]);
		}

		return newDataTypeConfigs;
	};

	/**
	 * Initialize data type list.
	 * @return {void}
	 */
	SearchSettingsViewModel.prototype.initDataTypeList = function(availableDataTypes)
	{
		var self = this, height = 0;
		$.each(availableDataTypes, function(index, data)
		{
			var $item = $("<div></div>", { class: "list-item", name: data.name }),
				$itemDragIcon = $("<div></div>", { class: "item-drag-icon" }),
				$itemName = $("<div></div>", { class: "item-name", text: data.display }),
				$itemCheckbox = $("<div class=\"control-checkbox\"><label class=\"container\"><input type=\"checkbox\"><span class=\"checkmark\"></span></label></div>");

			$item.css({ "top": height, "height": self.itemHeight });
			$itemCheckbox.find("input").prop("checked", data.selected);

			$item.append($itemDragIcon, $itemName, $itemCheckbox);
			self.$listContent.append($item);

			// init draggable
			$item.draggable({
				containment: "parent",
				start: self.onListItemDragStart.bind(self),
				stop: self.onListItemDragStop.bind(self),
				drag: self.onListItemDragging.bind(self),
				helper: function()
				{
					var $helper = $item.clone();
					$helper.removeClass("list-item").addClass("list-item-helper");
					return $helper;
				}
			});

			height += $item.outerHeight();
		});

		self.$listContent.css("height", height);
	};

	/**
	 * When the drag starts.
	 * @param {Event} evt 
	 * @param {Object} helper 
	 */
	SearchSettingsViewModel.prototype.onListItemDragStart = function(evt, helper)
	{
		var self = this, $item = $(evt.target).closest(".list-item");

		$item.addClass("onDrag");
		self.$listContent.addClass("onDrag");
		self.onDragItemIndex = self.$listContent.find(">.list-item").index($item[0]);
	};

	/**
	 * When the drag stops.
	 * @param {Event} evt 
	 * @param {Object} helper 
	 */
	SearchSettingsViewModel.prototype.onListItemDragStop = function(evt, helper)
	{
		var self = this;

		self.$listContent.removeClass("onDrag");
		self.$listContent.find(".list-item.onDrag").removeClass("onDrag");
	};

	/**
	 * When the drag is on going.
	 * @param {Event} evt 
	 * @param {Object} helper 
	 */
	SearchSettingsViewModel.prototype.onListItemDragging = function(evt, helper)
	{
		var self = this,
			$item = self.$listContent.find(">.list-item.onDrag"),
			$helper = helper.helper,
			destinationIndex = self.determineListItemIndex($helper);

		if (destinationIndex !== self.onDragItemIndex)
		{
			self.moveListItemToTargetIndex($item, self.onDragItemIndex, destinationIndex);
			self.onDragItemIndex = destinationIndex;
		}

		if (destinationIndex === 0)
		{
			$helper.removeClass("up").addClass("down");
		}
		else if (destinationIndex === self.$listContent.find(">.list-item").length - 1)
		{
			$helper.removeClass("down").addClass("up");
		}
		else
		{
			$helper.removeClass("down up");
		}
	};

	/**
	 * Determine the sequence index for the list item.
	 * @param {JQuery} $item  
	 * @return {Number}
	 */
	SearchSettingsViewModel.prototype.determineListItemIndex = function($item)
	{
		var self = this,
			itemOffsetTop = $item.offset().top,
			containerOffsetTop = self.$listContent.offset().top;

		return Math.floor((itemOffsetTop - containerOffsetTop) / self.itemHeight + 0.5);
	};

	/**
	 * Swap two neighborhood list items. Using knockout splice for observableArray so the dom won't be redrawn.
	 * @param {Number} index 
	 * @param {Boolean} isUp 
	 */
	SearchSettingsViewModel.prototype.swapListItem = function(index, isUp)
	{
		var self = this,
			$itemList = self.$listContent.find(">.list-item"),
			targetIndex = index + (isUp ? -1 : 1),
			itemCount = $itemList;

		if (targetIndex >= itemCount || targetIndex < 0) { return; }

		var $item = $($itemList.get(index)),
			$target = $($itemList.get(targetIndex));

		$item.css("top", targetIndex * self.itemHeight);
		$target.css("top", index * self.itemHeight);

		if (isUp)
		{
			$target.before($item);
		}
		else
		{
			$target.after($item);
		}
	};

	/**
	 * Move the item to target sequence index.
	 * @param {JQuery} $element  
	 * @param {Number} curIndex 
	 * @param {Number} targetIndex 
	 */
	SearchSettingsViewModel.prototype.moveListItemToTargetIndex = function($element, curIndex, targetIndex)
	{
		var self = this,
			towardsTop = curIndex > targetIndex,
			increment = towardsTop ? -1 : 1;
		while (targetIndex !== curIndex)
		{
			self.swapListItem(curIndex, towardsTop);
			curIndex += increment;
		}
	};

	/**
	 * Export the search configurations.
	 * @return {String}
	 */
	SearchSettingsViewModel.prototype.exportConfiguration = function()
	{
		var self = this, $item,
			configurations = {
				ResultPerDataType: self.obResultNumPerDataType(),
				ShowImageIcon: self.obShowImageIcon(),
				RecentSearchNumber: self.obRecentSearchNum(),
				DataTypeConfig: []
			};

		$.each(self.$listContent.find(">div.list-item"), function(index, item)
		{
			$item = $(item);
			configurations.DataTypeConfig.push({
				name: $item.attr("name"),
				selected: $item.find("input[type=checkbox]").prop("checked")
			});
		});

		return configurations;
	};

	/**
	 * Save the search settings to user preference.
	 */
	SearchSettingsViewModel.prototype.save = function()
	{
		var self = this, isValid = false,
			data = self.exportConfiguration();

		$.each(data.DataTypeConfig, function(index, item)
		{
			if (item.selected)
			{
				isValid = true;
				return false;
			}
		});

		if (isValid)
		{
			tf.storageManager.save(self.userPreferenceKey, JSON.stringify(data));
			self.onSearchSettingsChangedEvent.notify();
		}
		else
		{
			self.pageLevelViewModel.clearError();
			self.pageLevelViewModel.popupErrorMessage("Please enable one or more data types.");
		}

		return isValid;
	};

	/**
	 * Compare two configuration objects.
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	SearchSettingsViewModel.prototype.compareTwoConfigurations = function(a, b)
	{
		var isEqual = (a.ResultPerDataType === b.ResultPerDataType
			&& a.ShowImageIcon === b.ShowImageIcon
			&& a.RecentSearchNumber === b.RecentSearchNumber);

		if (isEqual)
		{
			if (a.DataTypeConfig.length !== b.DataTypeConfig.length)
			{
				isEqual = false;
			}
			else
			{
				$.each(a.DataTypeConfig, function(index, item)
				{
					var compare = b.DataTypeConfig[index];
					if (item.name !== compare.name || item.selected !== compare.selected)
					{
						isEqual = false;
						return false;
					}
				});
			}
		}

		return isEqual;
	};

	/**
	 * Dispose.
	 */
	SearchSettingsViewModel.prototype.dispose = function()
	{
		var self = this;
		self.pageLevelViewModel.dispose();
		self.$listContent.find(">div.list-item").draggable("destroy");
	};
})();