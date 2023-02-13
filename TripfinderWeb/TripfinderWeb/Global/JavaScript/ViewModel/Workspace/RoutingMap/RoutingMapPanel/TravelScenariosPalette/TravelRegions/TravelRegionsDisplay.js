(function()
{
	createNamespace("TF.RoutingMap.TravelScenariosPalette").TravelRegionsDisplay = TravelRegionsDisplay;

	function TravelRegionsDisplay(travelRegionsViewModel, dataModel)
	{
		var self = this;
		TF.RoutingMap.EventBase.call(self, travelRegionsViewModel.eventsManager, dataModel);
		// self.obSelectedParcelsAndPoints = ko.observableArray([]);
		self.viewModel = travelRegionsViewModel;
		self.dataModel = dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.lastSelectedItemId = 0;
		self.lastSelectedItemType = "";
		self.obTravelRegionFooterDisplay = ko.observable("");
		self.obTravelRegions = ko.observableArray();
		self.dataModel.travelRegionCollectionChangedEvent.subscribe(self.onTravelRegionCollectionChanged.bind(self));
		self.dataModel.travelRegionPropertyChangedEvent.subscribe(self.onTravelRegionPropertyChanged.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.changeTravelRegionProperty.bind(self));
		self.dataModel.selectedChangedEvent.subscribe(self.travelRegionSelectedChanged.bind(self));
		self.dataModel.travelRegionLockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
	}

	TravelRegionsDisplay.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	TravelRegionsDisplay.prototype.constructor = TravelRegionsDisplay;

	TravelRegionsDisplay.prototype.setTravelRegionFooterDisplay = function(gridType)
	{
		var self = this;
		var countInfo = self.getTravelRegionCountInfo();
		this.obTravelRegionFooterDisplay(this.getFooterDisplay(countInfo.travelRegion, "Travel Region"));
	};

	/**
	* get count information 
	* @returns {Object} {parcel:{count,selected,highlighted},point:{count,selected,highlighted}}
	*/
	TravelRegionsDisplay.prototype.getTravelRegionCountInfo = function()
	{
		var self = this;
		var countInfo = {
			travelRegion: {
				count: 0,
				selected: 0,
				highlighted: 0,
				totalStudents: 0,
				hilightedStudents: 0,
				selectedStudents: 0
			}
		};
		var allTravelRegions = self.dataModel.getTravelRegions();
		for (var i = 0; i < allTravelRegions.length; i++)
		{
			countInfo.travelRegion.count++;
			countInfo.travelRegion.totalStudents += allTravelRegions[i].totalStudents;
			if (allTravelRegions[i].isSelected)
			{
				countInfo.travelRegion.selected++;
				countInfo.travelRegion.selectedStudents += allTravelRegions[i].totalStudents;
			}
			if (allTravelRegions[i].isHighlighted)
			{
				countInfo.travelRegion.highlighted++;
				countInfo.travelRegion.hilightedStudents += allTravelRegions[i].totalStudents;
			}
		}
		return countInfo;
	};

	TravelRegionsDisplay.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.obTravelRegions().forEach(function(selectedTravel)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.id == selectedTravel.id; });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			selectedTravel.isLockedByOther = isLockedByOther;
			selectedTravel.obIsLockedByOther(isLockedByOther);
			selectedTravel.obLockedByUser(lockedByUser);
			var data = self.dataModel.getSelected();
			data.map(function(item)
			{
				if (item.id == selectedTravel.id)
				{
					item.isLockedByOther = isLockedByOther;
					item.lockedByUser = lockedByUser;
				}
			});
		});
	};

	TravelRegionsDisplay.prototype.getFooterDisplay = function(countInfo, typeTitle)
	{
		var highlightedText = "";
		if (countInfo.highlighted > 0)
		{
			highlightedText = String.format("({0} Selected)", countInfo.highlighted);
		}
		if (countInfo.count > 1 || countInfo.count == 0)
		{
			typeTitle = "Travel Regions";
		}
		return String.format("{0} of {1} {2} {3} ", countInfo.selected, countInfo.count, typeTitle, highlightedText);
	};

	TravelRegionsDisplay.prototype.setHighSelectedTravel = function(selectedBoundary)
	{
		this.obTravelRegions().forEach(function(item)
		{
			item.isHighlighted = item.id == selectedBoundary.id;
		});
		this.setHighlightedToDataModel(TF.RoutingMap.BoundaryPalette.Type.TravelRegion);
	};

	TravelRegionsDisplay.prototype.setHighlightedToDataModel = function()
	{
		var highlighted = [];
		this.obTravelRegions().forEach(function(item)
		{
			if (item.isHighlighted)
			{
				highlighted.push(item);
			}
		});
		this.dataModel.setHighlighted(highlighted);

	};

	TravelRegionsDisplay.prototype.compareTravelRegion = function(a, b)
	{
		return TF.RoutingMap.TravelScenariosPalette.TravelRegionsDataModel.compare(a, b, "name");
	};

	TravelRegionsDisplay.prototype.travelRegionSelectedChanged = function()
	{
		var self = this;
		self.obTravelRegions(self.dataModel.getTravelRegions().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item);
		}).sort(self.compareTravelRegion.bind(self)));
		self.setTravelRegionFooterDisplay();
	};

	TravelRegionsDisplay.prototype.changeTravelRegionProperty = function()
	{
		var self = this;
		var travelRegions = self.dataModel.getTravelRegions();
		self.obTravelRegions().forEach(function(item)
		{
			var dataSource = Enumerable.From(travelRegions).FirstOrDefault({}, function(c) { return c.id == item.id; });
			self.setObservableValue(item, dataSource);
		});
		self.setTravelRegionFooterDisplay();
	};

	TravelRegionsDisplay.prototype.changeToObservable = function(data)
	{
		for (var key in data)
		{
			if (!data.hasOwnProperty(key)) continue;
			if (data.hasOwnProperty("ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length))) continue;
			if (key.indexOf("ob") == 0)
			{
				continue;
			}
			if (key == "name")
			{
				data["obName"] = ko.observable(data[key] || "unnamed");
				continue;
			}
			data["ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length)] = ko.observable(data[key]);
		}
		return $.extend(true, {}, data);
	};

	TravelRegionsDisplay.prototype.setObservableValue = function(data, dataSource)
	{
		$.extend(data, dataSource);
		for (var key in data)
		{
			var obKey = "ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length);
			if (!data.hasOwnProperty(key) || !$.isFunction(data[obKey]))
			{
				continue;
			}
			data[obKey](data[key]);
		}
	};

	TravelRegionsDisplay.prototype.onTravelRegionCollectionChanged = function()
	{
		var self = this;
		self.obTravelRegions([]);
		self.obTravelRegions(self.dataModel.getTravelRegions().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item);
		}).sort(self.compareTravelRegion.bind(self)));
		self.setTravelRegionFooterDisplay();
	};

	TravelRegionsDisplay.prototype.onTravelRegionPropertyChanged = function(e, data)
	{
		var self = this;
		var travelRegion = Enumerable.From(self.obTravelRegions()).FirstOrDefault({}, function(c) { return c.id == data.id; });
		self.setObservableValue(travelRegion, data);
		self.obTravelRegions(self.obTravelRegions().sort(self.compareTravelRegion.bind(self)));
		self.setTravelRegionFooterDisplay();
	};

	TravelRegionsDisplay.prototype.getIdIndex = function(list, id)
	{
		var index = -1;
		for (var i = 0; i < list.length; i++)
		{
			if (list[i].id === id)
			{
				index = i;
				break;
			}
		}
		return index;
	};

	TravelRegionsDisplay.prototype.selectTravelClick = function(viewModal, e)
	{
		var self = this;
		if (e.ctrlKey && e.button == 0)
		{
			var selectedItems = self.dataModel.getTravelHighlighted();
			var index = self.getIdIndex(selectedItems, viewModal.id);
			if (index === -1)
			{
				selectedItems.push(viewModal);
			}
			else
			{
				selectedItems.splice(index, 1);
			}
			self.dataModel.setHighlighted(selectedItems);
			self.lastSelectedItemId = viewModal.id;
		}
		else if (e.shiftKey && e.button == 0)
		{
			var selectedItems = [];
			var allItems = self.obTravelRegions();
			if (allItems && self.lastSelectedItemId !== 0)
			{
				var preIndex = self.getIdIndex(allItems, self.lastSelectedItemId);
				var currentIndex = self.getIdIndex(allItems, viewModal.id);
				if (preIndex != -1 && currentIndex != -1)
				{
					if (preIndex < currentIndex)
					{
						selectedItems = allItems.slice(preIndex, currentIndex + 1);
					}
					else
					{
						selectedItems = allItems.slice(currentIndex, preIndex + 1);
					}
				}
				else
				{
					return;
				}
			}
			else
			{
				selectedItems.push(viewModal);
			}
			self.dataModel.setHighlighted(selectedItems);
		}
		else
		{
			var selectedItems = self.dataModel.getTravelHighlighted();
			var index = self.getIdIndex(selectedItems, viewModal.id);
			if (index === -1)
			{
				selectedItems = [viewModal];
			}
			else
			{
				if (selectedItems.length > 1)
				{
					selectedItems = [viewModal];
				}
				else
				{
					selectedItems = [];
				}
			}
			self.dataModel.setHighlighted(selectedItems);
			self.lastSelectedItemId = viewModal.id;
		}

	};
})();