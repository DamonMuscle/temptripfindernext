(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MunicipalBoundaryDisplay = MunicipalBoundaryDisplay;

	function MunicipalBoundaryDisplay(municipalBoundariesViewModel, routeState, dataModel)
	{
		var self = this;
		TF.RoutingMap.EventBase.call(self, municipalBoundariesViewModel.eventsManager, dataModel);
		// self.obSelectedParcelsAndPoints = ko.observableArray([]);
		self.viewModel = municipalBoundariesViewModel;
		self.dataModel = dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.lastSelectedItemId = 0;
		self.lastSelectedItemType = '';
		self.obMunicipalBoundaryFooterDisplay = ko.observable("");
		self.obMunicipalBoundaries = ko.observableArray();
		self.dataModel.municipalBoundaryCollectionChangedEvent.subscribe(self.onMunicipalBoundaryCollectionChanged.bind(self));
		self.dataModel.municipalBoundaryPropertyChangedEvent.subscribe(self.onMunicipalBoundaryPropertyChanged.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.changeMunicipalBoundaryProperty.bind(self));
		self.dataModel.selectedChangedEvent.subscribe(self.municipalBoundarySelectedChanged.bind(self));
		self.dataModel.municipalBoundaryLockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
	}

	MunicipalBoundaryDisplay.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	MunicipalBoundaryDisplay.prototype.constructor = MunicipalBoundaryDisplay;

	MunicipalBoundaryDisplay.prototype.setMunicipalBoundaryFooterDisplay = function(gridType)
	{
		var self = this;
		var countInfo = self.getMunicipalBoundaryCountInfo();
		this.obMunicipalBoundaryFooterDisplay(this.getFooterDisplay(countInfo.municipalBoundary, "Municipal Boundary"));
	};

	/**
	* get count information 
	* @returns {Object} {parcel:{count,selected,highlighted},point:{count,selected,highlighted}}
	*/
	MunicipalBoundaryDisplay.prototype.getMunicipalBoundaryCountInfo = function()
	{
		var self = this;
		var countInfo = {
			municipalBoundary: {
				count: 0,
				selected: 0,
				highlighted: 0,
				totalStudents: 0,
				hilightedStudents: 0,
				selectedStudents: 0
			}
		}
		var allMunicipalBoundaries = self.dataModel.getMunicipalBoundaries();
		for (var i = 0; i < allMunicipalBoundaries.length; i++)
		{
			countInfo.municipalBoundary.count++;
			countInfo.municipalBoundary.totalStudents += allMunicipalBoundaries[i].totalStudents;
			if (allMunicipalBoundaries[i].isSelected)
			{
				countInfo.municipalBoundary.selected++;
				countInfo.municipalBoundary.selectedStudents += allMunicipalBoundaries[i].totalStudents;
			}
			if (allMunicipalBoundaries[i].isHighlighted)
			{
				countInfo.municipalBoundary.highlighted++;
				countInfo.municipalBoundary.hilightedStudents += allMunicipalBoundaries[i].totalStudents;
			}
		}
		return countInfo;
	}

	MunicipalBoundaryDisplay.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.obMunicipalBoundaries().forEach(function(selectedMunicipalBoundary)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.id == selectedMunicipalBoundary.id });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			selectedMunicipalBoundary.isLockedByOther = isLockedByOther;
			selectedMunicipalBoundary.obIsLockedByOther(isLockedByOther);
			selectedMunicipalBoundary.obLockedByUser(lockedByUser);
			var data = self.dataModel.getSelected();
			data.forEach(function(item)
			{
				if (item.id == selectedMunicipalBoundary.id)
				{
					item.isLockedByOther = isLockedByOther;
					item.lockedByUser = lockedByUser;
				}
			});
		});
	};

	MunicipalBoundaryDisplay.prototype.getFooterDisplay = function(countInfo, typeTitle)
	{
		if (countInfo.count > 0)
		{
			var highlightedText = "";
			if (countInfo.highlighted > 0)
			{
				highlightedText = String.format("({0} Selected)", countInfo.highlighted);
			}
			if (countInfo.count > 1 || countInfo.count == 0)
			{
				typeTitle = "Municipal Boundaries";
			}
			return String.format("{0} of {1} {2} {3} ", countInfo.selected, countInfo.count, typeTitle, highlightedText);
		}
		return "";
	};

	MunicipalBoundaryDisplay.prototype.setHighSelectedMunicipalBoundary = function(selectedBoundary)
	{
		var isHighlighted = selectedBoundary.isHighlighted;
		this.obMunicipalBoundaries().forEach(function(item)
		{
			item.isHighlighted = item.id == selectedBoundary.id;
		})
		this.setHighlightedToDataModel(TF.RoutingMap.BoundaryPalette.Type.MunicipalBoundary);
	}

	MunicipalBoundaryDisplay.prototype.setHighlightedToDataModel = function(type)
	{
		var highlighted = [];
		this.obMunicipalBoundaries().forEach(function(item)
		{
			if (item.isHighlighted)
			{
				highlighted.push(item);
			}
		});
		this.dataModel.setHighlighted(highlighted);

	}

	MunicipalBoundaryDisplay.prototype.compareMunicipalBoundary = function(a, b)
	{
		return TF.RoutingMap.MapEditingPalette.MunicipalBoundaryDataModel.compare(a, b, 'name');
	}

	MunicipalBoundaryDisplay.prototype.municipalBoundarySelectedChanged = function()
	{
		var self = this;
		self.obMunicipalBoundaries(self.dataModel.getMunicipalBoundaries().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item)
		}).sort(self.compareMunicipalBoundary.bind(self)));
		self.setMunicipalBoundaryFooterDisplay();
	}

	MunicipalBoundaryDisplay.prototype.changeMunicipalBoundaryProperty = function()
	{
		var self = this;
		var municipalBoundaries = self.dataModel.getMunicipalBoundaries();
		self.obMunicipalBoundaries().forEach(function(item)
		{
			var dataSource = Enumerable.From(municipalBoundaries).FirstOrDefault({}, function(c) { return c.id == item.id })
			self.setObservableValue(item, dataSource);
		})
		self.setMunicipalBoundaryFooterDisplay();
	}

	MunicipalBoundaryDisplay.prototype.changeToObservable = function(data)
	{
		for (var key in data)
		{
			if (!data.hasOwnProperty(key)) continue;
			if (data.hasOwnProperty("ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length))) continue;
			if (key.indexOf("ob") == 0)
			{
				continue;
			}
			data["ob" + key.substring(0, 1).toUpperCase() + key.substring(1, key.length)] = ko.observable(data[key]);
		}
		return $.extend(true, {}, data);
	}

	MunicipalBoundaryDisplay.prototype.setObservableValue = function(data, dataSource)
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
	}

	MunicipalBoundaryDisplay.prototype.onMunicipalBoundaryCollectionChanged = function()
	{
		var self = this;
		var municipalBoundaries = [];
		self.obMunicipalBoundaries([]);
		self.obMunicipalBoundaries(self.dataModel.getMunicipalBoundaries().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item)
		}).sort(self.compareMunicipalBoundary.bind(self)));
		self.setMunicipalBoundaryFooterDisplay();
	}

	MunicipalBoundaryDisplay.prototype.onMunicipalBoundaryPropertyChanged = function(e, data)
	{
		var self = this;
		var municipalBoundary = Enumerable.From(self.obMunicipalBoundaries()).FirstOrDefault({}, function(c) { return c.id == data.id })
		self.setObservableValue(municipalBoundary, data);
		self.obMunicipalBoundaries(self.obMunicipalBoundaries().sort(self.compareMunicipalBoundary.bind(self)));
		self.setMunicipalBoundaryFooterDisplay();
	}

	MunicipalBoundaryDisplay.prototype.getIdIndex = function(list, id)
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

	MunicipalBoundaryDisplay.prototype.selectMunicipalBoundaryClick = function(viewModal, e)
	{
		var self = this;
		if (e.ctrlKey && e.button == 0)
		{
			var selectedItems = self.dataModel.getMunicipalBoundaryHighlighted();
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
			var allItems = self.obMunicipalBoundaries();
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
			var selectedItems = self.dataModel.getMunicipalBoundaryHighlighted();
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