(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").RailroadDisplay = RailroadDisplay;

	function RailroadDisplay(viewModel)
	{
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = self.viewModel.dataModel;
		self.eventsManager = self.viewModel.eventsManager;
		self.obData = ko.observableArray([]);
		self.obFooterDisplay = ko.observable("");
		self.lastSelectedItemId = 0;
		TF.RoutingMap.BaseMapDisplayModel.call(self, viewModel);
		self.viewModel.dataModel.onAllChangeEvent.subscribe(self.onAllChangeEvent.bind(this));
		self.viewModel.dataModel.highlightChangedEvent.subscribe(self.highlightChangedEvent.bind(this));
		self.viewModel.dataModel.selectedChangedEvent.subscribe(self.selectedChangedEvent.bind(this));
		self.viewModel.dataModel.lockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
	}

	RailroadDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	RailroadDisplay.prototype.constructor = RailroadDisplay;

	RailroadDisplay.prototype.onAllChangeEvent = function(e, data)
	{
		var self = this;
		if (data.edit)
		{
			data.edit.forEach(function(item)
			{
				var d = Enumerable.From(self.obData()).FirstOrDefault(null, function(c) { return c.id == item.id; });
				if (d)
				{
					d.obName(item.Name.trim().length == 0 ? "unnamed" : item.Name);
				}
			});
		}
		if (data.delete)
		{
			data.delete.forEach(function(item)
			{
				for (var i = 0; i < self.obData().length; i++)
				{
					if (self.obData()[i].id == item.id)
					{
						self.obData.splice(i, 1);
						return;
					}
				}
			});
		}
		this.setFooterDisplay();
	};

	RailroadDisplay.prototype.highlightChangedEvent = function(e, data)
	{
		var self = this;
		self.setFooterDisplay();
		var highlightData = {};
		data.forEach(function(item)
		{
			highlightData[item.id] = true;
		});
		self.obData().forEach(function(item)
		{
			item.isHighLightSelected(!!highlightData[item.id]);
		});
	};

	RailroadDisplay.prototype.selectedChangedEvent = function(e, data)
	{
		this.setFooterDisplay();
		this.obData([]);

		this.obData(data.map(function(d)
		{
			var item = $.extend({}, d);
			item.isHighLightSelected = ko.observable(false);
			item.obName = ko.observable($.trim(d.Name) || "unnamed");
			item.isLockedByOther = ko.observable(false);
			item.lockedByUser = ko.observable("");
			return item;
		}));
	};

	RailroadDisplay.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.obData().forEach(function(data)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.Id == data.id; });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			data.isLockedByOther(isLockedByOther);
			data.lockedByUser(lockedByUser);
		});
	};

	RailroadDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		self.dataModel.getCount().then(function(count)
		{
			self.setFooterDisplayText("Railroad Segments", count);
		});
	};

	RailroadDisplay.prototype.setHighlighted = function(data)
	{
		this.dataModel.setHighlighted(data);
	};

	RailroadDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	RailroadDisplay.prototype.getSelected = function()
	{
		return this.dataModel.selected;
	};

	RailroadDisplay.prototype.selectItemClick = function(selectItem, e)
	{
		this.selectWithKeyClick(selectItem, e);
	};
})();