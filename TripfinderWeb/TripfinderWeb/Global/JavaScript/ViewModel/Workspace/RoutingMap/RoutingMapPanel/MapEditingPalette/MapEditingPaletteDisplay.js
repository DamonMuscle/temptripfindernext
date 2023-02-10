(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MapEditingPaletteDisplay = MapEditingPaletteDisplay;

	function MapEditingPaletteDisplay(mapEditingPaletteViewModel, routeState, dataModel)
	{
		var self = this;
		TF.RoutingMap.EventBase.call(self, mapEditingPaletteViewModel.eventsManager, dataModel);
		self.viewModel = mapEditingPaletteViewModel;
		self.dataModel = dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.lastSelectedItemId = 0;
		self.lastSelectedItemType = '';
		self.obSelectedTravelScenarios = ko.observableArray();
		self.obSelectedTravelRegions = ko.observableArray();
		self.obSelectedStreets = ko.observableArray();
		self.obSelectedRailroads = ko.observableArray();
		self.obSelectedLandmarks = ko.observableArray();
		self.obSelectedMunicipalBoundaries = ko.observableArray();
		self.obSelectedPostalCodeBoundaries = ko.observableArray();
		self.obSelectedWater = ko.observableArray();
		self.obTravelRegionsFooterDisplay = ko.observable("");
	}

	MapEditingPaletteDisplay.prototype = Object.create(TF.RoutingMap.EventBase.prototype);
	MapEditingPaletteDisplay.prototype.constructor = MapEditingPaletteDisplay;

	MapEditingPaletteDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		var countInfo = self.getCountInfo();
		this.obSelectedTravelRegions(this._getFooterDisplay(countInfo.parcel, "Travel Regions"));
	};

	/**
	* get count information 
	* @returns {Object} {parcel:{count,selected,highlighted},point:{count,selected,highlighted}}
	*/
	MapEditingPaletteDisplay.prototype.getCountInfo = function(type)
	{
		var self = this;
		var countInfo = {
			count: 0,
			selected: 0,
			highlighted: 0,
			totalStudents: 0
		};
		// get data from data model
		var allBoudaries = [];
		for (var i = 0; i < allBoudaries.length; i++)
		{
			countInfo.count++;
			if (allBoudaries[i].isSelected)
			{
				countInfo.selected++;
			}
			if (allBoudaries[i].isHighlighted)
			{
				countInfo.highlighted++;
			}
		}
		return countInfo;
	};

	MapEditingPaletteDisplay.prototype.travelRegionSelectedChanged = function()
	{
		var self = this;
		self.setFooterDisplay();
		self.obSelectedTravelRegions(self.convertToObSelected());
	};

	MapEditingPaletteDisplay.prototype.travelRegionHighlightChanged = function()
	{
		var self = this;
		self.setFooterDisplay();
		self.obSelectedTravelRegions().forEach(function(data)
		{
			// data.isHighLightSelected(self.dataModel.isHighlighted(data.id));
		});
	};

	MapEditingPaletteDisplay.prototype.getFooterDisplay = function(countInfo, typeTitle)
	{
		if (countInfo.count > 0)
		{
			var highlightedText = "";
			if (countInfo.highlighted > 0)
			{
				highlightedText = String.format("({0} Selected)", countInfo.highlighted);
			}
			if (typeTitle === "Travel Scenario")
			{
				if (countInfo.count > 1 || countInfo.count == 0)
				{
					typeTitle = "Travel Scenarios";
				}
				return String.format("{0} {1} {2} ", countInfo.count, typeTitle, highlightedText);
			}
			else if (typeTitle === "Travel Region")
			{
				if (countInfo.count > 1 || countInfo.count == 0)
				{
					typeTitle = "Travel Regions";
				}
				return String.format("{0} of {1} {2} {3} ", countInfo.selected, countInfo.count, typeTitle, highlightedText);
			}
		}
		return "";
	};

	MapEditingPaletteDisplay.prototype.convertToObSelected = function(data)
	{
		var item = $.extend({}, data);
		TF.convertToObservable(item, ['id']);
		return item;
	};

	MapEditingPaletteDisplay.prototype.selectBoundaryClick = function(viewModal, e)
	{
	};

	MapEditingPaletteDisplay.prototype.getIdIndex = function(list, id)
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
})();