(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").ZipCodesDisplay = ZipCodesDisplay;

	function ZipCodesDisplay(zipCodesViewModel, routeState, dataModel)
	{
		var self = this;
		TF.RoutingMap.EventBase.call(self, zipCodesViewModel.eventsManager, dataModel);
		// self.obSelectedParcelsAndPoints = ko.observableArray([]);
		self.viewModel = zipCodesViewModel;
		self.dataModel = dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.lastSelectedItemId = 0;
		self.lastSelectedItemType = "";
		self.obZipCodeFooterDisplay = ko.observable("");
		self.obZipCodes = ko.observableArray();
		self.dataModel.zipCodeCollectionChangedEvent.subscribe(self.onZipCodeCollectionChanged.bind(self));
		self.dataModel.zipCodePropertyChangedEvent.subscribe(self.onZipCodePropertyChanged.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.changeZipCodeProperty.bind(self));
		self.dataModel.selectedChangedEvent.subscribe(self.zipCodeSelectedChanged.bind(self));
		self.dataModel.zipCodeLockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
	}

	ZipCodesDisplay.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	ZipCodesDisplay.prototype.constructor = ZipCodesDisplay;

	ZipCodesDisplay.prototype.setZipCodeFooterDisplay = function()
	{
		var self = this;
		var countInfo = self.getZipCodeCountInfo();
		this.obZipCodeFooterDisplay(this.getFooterDisplay(countInfo.zipCode, "Postal Code Boundary"));
	};

	/**
	* get count information 
	* @returns {Object} {parcel:{count,selected,highlighted},point:{count,selected,highlighted}}
	*/
	ZipCodesDisplay.prototype.getZipCodeCountInfo = function()
	{
		var self = this;
		var countInfo = {
			zipCode: {
				count: 0,
				selected: 0,
				highlighted: 0,
				totalStudents: 0,
				hilightedStudents: 0,
				selectedStudents: 0
			}
		};
		var allZipCodes = self.dataModel.getZipCodes();
		for (var i = 0; i < allZipCodes.length; i++)
		{
			countInfo.zipCode.count++;
			countInfo.zipCode.totalStudents += allZipCodes[i].totalStudents;
			if (allZipCodes[i].isSelected)
			{
				countInfo.zipCode.selected++;
				countInfo.zipCode.selectedStudents += allZipCodes[i].totalStudents;
			}
			if (allZipCodes[i].isHighlighted)
			{
				countInfo.zipCode.highlighted++;
				countInfo.zipCode.hilightedStudents += allZipCodes[i].totalStudents;
			}
		}
		return countInfo;
	};

	ZipCodesDisplay.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.obZipCodes().forEach(function(selectedZipCode)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.id == selectedZipCode.id; });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			selectedZipCode.isLockedByOther = isLockedByOther;
			selectedZipCode.obIsLockedByOther(isLockedByOther);
			selectedZipCode.obLockedByUser(lockedByUser);
			var data = self.dataModel.getSelected();
			data.forEach(function(item)
			{
				if (item.id == selectedZipCode.id)
				{
					item.isLockedByOther = isLockedByOther;
					item.lockedByUser = lockedByUser;
				}
			});
		});
	};

	ZipCodesDisplay.prototype.getFooterDisplay = function(countInfo, typeTitle)
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
				typeTitle = "Postal Code Boundaries";
			}
			return String.format("{0} of {1} {2} {3} ", countInfo.selected, countInfo.count, typeTitle, highlightedText);
		}
		return "";
	};

	ZipCodesDisplay.prototype.setHighSelectedZipCode = function(selectedBoundary)
	{
		this.obZipCodes().forEach(function(item)
		{
			item.isHighlighted = item.id == selectedBoundary.id;
		});
		this.setHighlightedToDataModel(TF.RoutingMap.BoundaryPalette.Type.ZipCode);
	};

	ZipCodesDisplay.prototype.setHighlightedToDataModel = function()
	{
		var highlighted = [];
		this.obZipCodes().forEach(function(item)
		{
			if (item.isHighlighted)
			{
				highlighted.push(item);
			}
		});
		this.dataModel.setHighlighted(highlighted);

	};

	ZipCodesDisplay.prototype.compareZipCode = function(a, b)
	{
		return TF.RoutingMap.MapEditingPalette.ZipCodeDataModel.compare(a, b, "zip");
	};

	ZipCodesDisplay.prototype.zipCodeSelectedChanged = function()
	{
		var self = this;
		self.obZipCodes(self.dataModel.getZipCodes().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item);
		}).sort(self.compareZipCode.bind(self)));
		self.setZipCodeFooterDisplay();
	};

	ZipCodesDisplay.prototype.changeZipCodeProperty = function()
	{
		var self = this;
		var zipCodes = self.dataModel.getZipCodes();
		self.obZipCodes().forEach(function(item)
		{
			var dataSource = Enumerable.From(zipCodes).FirstOrDefault({}, function(c) { return c.id == item.id; });
			self.setObservableValue(item, dataSource);
		});
		self.setZipCodeFooterDisplay();
	};

	ZipCodesDisplay.prototype.changeToObservable = function(data)
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
	};

	ZipCodesDisplay.prototype.setObservableValue = function(data, dataSource)
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

	ZipCodesDisplay.prototype.onZipCodeCollectionChanged = function()
	{
		var self = this;
		self.obZipCodes([]);
		self.obZipCodes(self.dataModel.getZipCodes().filter(function(item)
		{
			if (item.isSelected)
			{
				return item;
			}
		}).map(function(item)
		{
			return self.changeToObservable(item);
		}).sort(self.compareZipCode.bind(self)));
		self.setZipCodeFooterDisplay();
	};

	ZipCodesDisplay.prototype.onZipCodePropertyChanged = function(e, data)
	{
		var self = this;
		var zipCode = Enumerable.From(self.obZipCodes()).FirstOrDefault({}, function(c) { return c.id == data.id; });
		self.setObservableValue(zipCode, data);
		self.obZipCodes(self.obZipCodes().sort(self.compareZipCode.bind(self)));
		self.setZipCodeFooterDisplay();
	};

	ZipCodesDisplay.prototype.getIdIndex = function(list, id)
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

	ZipCodesDisplay.prototype.selectZipCodeClick = function(viewModal, e)
	{
		var self = this, selectedItems, index;
		if (e.ctrlKey && e.button == 0)
		{
			selectedItems = self.dataModel.getZipCodeHighlighted();
			index = self.getIdIndex(selectedItems, viewModal.id);
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
			selectedItems = [];
			var allItems = self.obZipCodes();
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
			selectedItems = self.dataModel.getZipCodeHighlighted();
			index = self.getIdIndex(selectedItems, viewModal.id);
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