(function()
{
	createNamespace("TF.Control").SearchSettingsViewModel = SearchSettingsViewModel;

	function SearchSettingsViewModel(options)
	{
		var self = this,
			allDataTypes = [
				{ name: "tripname", display: "Trip Name", selected: true, permission: true },
				{ name: "submitter", display: "Submitter", selected: true, permission: true },
				{ name: "tripdate", display: "Trip Date", selected: true, permission: true },
				{ name: "destination", display: "Destination", selected: true, permission: true },
				{ name: "school", display: "School", selected: true, permission: true },
				{ name: "department", display: "Department", selected: true, permission: true },
				{ name: "classification", display: "Classification", selected: true, permission: true },
				{ name: "billclassification", display: "Billing Classification", selected: true, permission: true }
			];

		self.itemHeight = 32;
		self.userPreferenceKey = "search.configurations";
		self.availableDataTypes = allDataTypes.filter(function(item) { return item.permission; });
		self.defaultConfigObject = {
			RecentSearchNumber: 5,
			DataTypeConfig: self.availableDataTypes
		};

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
		tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "SearchRecord"), {
			data: JSON.stringify(TF.productName)
		}).then(function()
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
		self.setConfigurations(false);
	};

	/**
	 * Set the configurations.
	 * @param {Boolean} isDefault Whether to set to default regardless of saved config.
	 */
	SearchSettingsViewModel.prototype.setConfigurations = function(isDefault)
	{
		var self = this,
			recentSearchNum = self.defaultConfigObject.RecentSearchNumber,
			savedConfigurations = tf.storageManager.get(self.userPreferenceKey);

		if (!isDefault && savedConfigurations)
		{
			recentSearchNum = savedConfigurations.RecentSearchNumber;
		}

		self.obRecentSearchNum(recentSearchNum);
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
				RecentSearchNumber: self.obRecentSearchNum(),
				DataTypeConfig: self.availableDataTypes
			};

		return configurations;
	};

	/**
	 * Save the search settings to user preference.
	 */
	SearchSettingsViewModel.prototype.save = function()
	{
		var self = this, data = self.exportConfiguration();

		tf.storageManager.save(self.userPreferenceKey, JSON.stringify(data));
		self.onSearchSettingsChangedEvent.notify();

		return true;
	};

	/**
	 * Compare two configuration objects.
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	SearchSettingsViewModel.prototype.compareTwoConfigurations = function(a, b)
	{
		var isEqual = (a.RecentSearchNumber === b.RecentSearchNumber);

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
	};
})();