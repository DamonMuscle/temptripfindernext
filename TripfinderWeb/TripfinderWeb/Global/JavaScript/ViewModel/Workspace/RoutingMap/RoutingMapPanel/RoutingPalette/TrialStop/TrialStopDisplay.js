(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").TrialStopDisplay = TrialStopDisplay;

	function TrialStopDisplay(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		TF.RoutingMap.BaseMapDisplayModel.call(this, viewModel);
		self.obTrialStops = ko.observableArray([]);
		self.obFooterDisplay = ko.observable("");
		self.dataModel.onAllChangeEvent.subscribe(self.onAllChange.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.highlightChanged.bind(self));
		self.setFooterDisplay();
	}

	TrialStopDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	TrialStopDisplay.prototype.constructor = TrialStopDisplay;

	TrialStopDisplay.prototype.highlightChanged = function(e, data)
	{
		var self = this;
		var highlightData = {};
		data.forEach(function(item)
		{
			highlightData[item.id] = true;
		});
		self.obTrialStops().forEach(function(item)
		{
			item.obIsHighlighted(!!highlightData[item.id]);
		});
		self.setFooterDisplay();
	};

	TrialStopDisplay.prototype.setValueToItem = function(trialStop, newValue)
	{
		trialStop.obStreet(newValue.Street);
		trialStop.obDistance(newValue.Distance + " " + newValue.DistanceUnit);
		trialStop.obStudentCount(newValue.studentCount + TF.getSingularOrPluralTitle(" Students", newValue.studentCount));
	};

	TrialStopDisplay.prototype.convertData = function(source)
	{
		var trialStop = $.extend({}, source);
		trialStop.obIsHighlighted = ko.observable(this.dataModel.highlighted.indexOf(source) >= 0);
		trialStop.obStreet = ko.observable();
		trialStop.obDistance = ko.observable();
		trialStop.obStudentCount = ko.observable();
		this.setValueToItem(trialStop, source);
		return trialStop;
	};

	TrialStopDisplay.prototype.onAllChange = function(e, data)
	{
		var self = this;
		if (data.add.length > 0)
		{
			this.obTrialStops(this.dataModel.sortSelected(this.dataModel.all.map(function(d)
			{
				return self.convertData(d);
			})));
		}
		if (data.edit)
		{
			data.edit.forEach(function(item)
			{
				var trialStop = Enumerable.From(self.obTrialStops()).FirstOrDefault(null, function(c) { return c.id == item.id; });
				if (trialStop)
				{
					self.setValueToItem(trialStop, item);
				}
			});
		}
		if (data.delete.length > 0)
		{
			self.obTrialStops(self.obTrialStops().filter(function(stop)
			{
				return !Enumerable.From(data.delete).Any(function(item) { return item.id == stop.id; });
			}));
		}
		this.setFooterDisplay();
	};

	TrialStopDisplay.prototype.clear = function()
	{
		this.obTrialStops([]);
		this.setFooterDisplay();
	};

	TrialStopDisplay.prototype.setHighlighted = function(data)
	{
		this.dataModel.setHighlighted(data);
	};

	TrialStopDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	TrialStopDisplay.prototype.getSelected = function()
	{
		return this.obTrialStops();
	};

	TrialStopDisplay.prototype.selectItemClick = function(selectItem, e)
	{
		this.selectWithKeyClick(selectItem, e);
	};

	TrialStopDisplay.prototype.setFooterDisplay = function()
	{
		var self = this,
			count = self.dataModel.all.length;
		self.setFooterDisplayText("Trial Stop", count, true);
	};

})();