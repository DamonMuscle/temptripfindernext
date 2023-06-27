(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TripLabelSetting = TripLabelSetting;
	function TripLabelSetting(viewModel, routeState, title, map, showLabel, panelType, layerId)
	{
		var self = this;
		self.map = map;
		self.layerId = layerId;
		self.routeState = routeState;
		self.viewModel = viewModel;
		self.title = title;
		self.obShowLabel = ko.observable(!!(showLabel != undefined ? showLabel : false));
		self.obShowLabel.subscribe(self.onShowLabelChanged.bind(self));
		self.obShowLabelAttributeDisplay = ko.observable("");
		self.labelDisplay = new TF.RoutingMap.LabelDisplay(this.routeState, title, map, panelType, layerId, this.getLabelFields(), this.sourceModify.bind(this), "point");
		self.setShowLabelAttributeDisplay();
		self.refreshMapLayerLabels();
	}

	TripLabelSetting.prototype.getLabelFields = function()
	{
		return [{
			name: "Stop Location",
			check: true,
			exampleValue: '440 State Street',
			fieldName: 'Street'
		},
		{
			name: "Stop Time",
			check: false,
			exampleValue: '6:45 AM',
			fieldName: 'StopTime',
			getText: function(data)
			{
				return moment(data.StopTime, "HH:mm:ss").format('h:mm A');
			}
		},
		{
			name: "Stop Comment",
			check: false,
			exampleValue: 'Your comment here',
			fieldName: 'Comment',
			getText: function(data)
			{
				return data.Comment || "N/A";
			}
		},
		{
			name: "Trip Name",
			check: false,
			exampleValue: 'ABC 10 AM',
			fieldName: 'TripName',
			getText: function(data)
			{
				return data.TripName;
			}
		}];
	};

	TripLabelSetting.prototype.setLabelOptions = function()
	{
		var self = this;
		this.labelDisplay.showOptionsDialog().then(function(options)
		{
			if (options)
			{
				self.setShowLabelAttributeDisplay();
			}
		});
	};

	TripLabelSetting.prototype.setShowLabelAttributeDisplay = function()
	{
		var displayText = "";
		if (this.obShowLabel())
		{
			displayText = this.labelDisplay.getAttributeDisplay();
		}
		this.obShowLabelAttributeDisplay(displayText);
	};

	TripLabelSetting.prototype.onShowLabelChanged = function()
	{
		var self = this;
		self.setShowLabelAttributeDisplay();
	};

	TripLabelSetting.prototype.sourceModify = function(source)
	{
		var tripNames = {};
		this.viewModel.dataModel.trips.forEach(function(trip)
		{
			tripNames[trip.id] = trip.Name;
		});
		return source.filter(function(graphic)
		{
			return graphic.visible && graphic.attributes.type == "tripStop";
		}).map(function(graphic)
		{
			graphic.attributes.dataModel.TripName = tripNames[graphic.attributes.dataModel.TripId];
			return graphic;
		});
	};

	TripLabelSetting.prototype.refreshMapLayerLabels = function()
	{
		var self = this;
		if (!self.map)
		{
			return;
		}

		if (self.obShowLabel())
		{
			self.labelDisplay.show();
		} else
		{
			self.labelDisplay.hide();
		}
	};

})();