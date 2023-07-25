(function()
{
	createNamespace("TF.UserDefinedField").GeofenceDisplay = GeofenceDisplay;

	function GeofenceDisplay(viewModel)
	{
		var self = this;
		TF.RoutingMap.BaseMapDisplayModel.call(this, viewModel);
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self.obGeofences = ko.observableArray([]);
		self.obFooterDisplay = ko.observable("");
		self.dataModel.onAllChangeEvent.subscribe(self.onAllChange.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.highlightChanged.bind(self));
		self.visibleClick = self.visibleClick.bind(self);
	}

	GeofenceDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	GeofenceDisplay.prototype.constructor = GeofenceDisplay;

	GeofenceDisplay.prototype.highlightChanged = function()
	{
		var self = this;
		self.obGeofences().forEach(function(item)
		{
			if (self.dataModel.isHighlighted(item.id))
			{
				item.isHighlighted = true;
				item.obIsHighlighted(true);
			}
			else
			{
				item.isHighlighted = false;
				item.obIsHighlighted(false);
			}
		});
		self.setFooterDisplay();
	};

	GeofenceDisplay.prototype.propertyChanged = function(editNonEligibleZones)
	{
		var self = this;
		self.obGeofences().forEach(function(item)
		{
			var dataSource = Enumerable.From(editNonEligibleZones).FirstOrDefault({}, function(c) { return c.id == item.id; });
			self.setObservableValue(item, dataSource);
		});
		self.setFooterDisplay();
	};

	GeofenceDisplay.prototype.onAllChange = function(e, param)
	{
		var self = this;

		if (param.add.length > 0)
		{
			var nonEligibleZones = $.extend(true, [], param.add);
			var array = Enumerable.From(nonEligibleZones).Select(function(c)
			{
				c.isHighlighted = false;
				c.display = true;
				return self.changeToObservable(c);
			}).ToArray();
			self.obGeofences(self.obGeofences().concat(array));
		}
		if (param.delete.length > 0)
		{
			self.obGeofences(self.obGeofences().filter(function(d)
			{
				return Enumerable.From(param.delete).FirstOrDefault(null, function(item) { return item.id == d.id; }) == null;
			}));
		}
		if (param.edit.length > 0)
		{
			self.propertyChanged(param.edit);
			//self.obGeofences(self.dataModel.sortSelected(self.obGeofences()));
		}
		self.setFooterDisplay();
	};

	GeofenceDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		self.setFooterDisplayText("Geofence", self.obGeofences().length, true);
	};

	GeofenceDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	GeofenceDisplay.prototype.getSelected = function()
	{
		return this.obGeofences();
	};

	GeofenceDisplay.prototype.setHighlighted = function(selectedItems)
	{
		this.dataModel.setHighlighted(selectedItems);
	};

	GeofenceDisplay.prototype.selectClick = function(viewModal, e)
	{
		var self = this;
		self.selectWithKeyClick(viewModal, e);
	};

	GeofenceDisplay.prototype.visibleClick = function(model, event)
	{
		event.stopPropagation();
		var visible = !model.obDisplay();
		this.dataModel.changeVisible(model.id, visible);
	};
})();