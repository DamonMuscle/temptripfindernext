(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MyStreetsDisplay = MyStreetsDisplay;

	function MyStreetsDisplay(viewModel)
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
		self.viewModel.dataModel.streetsLockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
	}

	MyStreetsDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	MyStreetsDisplay.prototype.constructor = MyStreetsDisplay;

	MyStreetsDisplay.prototype.onAllChangeEvent = function(e, data)
	{
		var self = this;
		if (data.edit)
		{
			data.edit.forEach(function(item)
			{
				var entity = Enumerable.From(self.obData()).FirstOrDefault(null, function(c) { return c.id == item.id; });
				if (entity)
				{
					entity.obfromleft(item.Fromleft);
					entity.obtoleft(item.Toleft);
					entity.obtoright(item.Toright);
					entity.obfromright(item.Fromright);
					entity.obstreet(item.Street);
					entity.oblock(item.Lock);
					entity.Street = item.Street;
					entity.Fromleft = item.Fromleft;
					entity.Toleft = item.Toleft;
					entity.Toright = item.Toright;
					entity.Fromright = item.Fromright;
				}
			});
			var allItems = self.obData();
			self.dataModel.sortItems(allItems);
			self.obData([]);
			self.obData(allItems);
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

	MyStreetsDisplay.prototype.highlightChangedEvent = function(e, data)
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

	MyStreetsDisplay.prototype.selectedChangedEvent = function(e, data)
	{
		this.setFooterDisplay();
		this.obData([]);
		this.obData(data.map(function(d)
		{
			var item = $.extend({}, d);
			item.isHighLightSelected = ko.observable(false);
			item.obfromleft = ko.observable(d.Fromleft);
			item.obtoleft = ko.observable(d.Toleft);
			item.obtoright = ko.observable(d.Toright);
			item.obfromright = ko.observable(d.Fromright);
			item.obstreet = ko.observable(d.Street);
			item.oblock = ko.observable(d.Lock);
			item.isLockedByOther = ko.observable(false);
			item.lockedByUser = ko.observable("");
			return item;
		}));
	};

	MyStreetsDisplay.prototype.onLockedChange = function(e, lockInfo)
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

	MyStreetsDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		self.dataModel.getCount().then(function(count)
		{
			self.setFooterDisplayText("Street Segments", count);
		});
	};

	MyStreetsDisplay.prototype.setHighlighted = function(data)
	{
		this.dataModel.setHighlighted(data);
	};

	MyStreetsDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	MyStreetsDisplay.prototype.getSelected = function()
	{
		return this.dataModel.selected;
	};

	MyStreetsDisplay.prototype.selectItemClick = function(selectItem, e)
	{
		this.selectWithKeyClick(selectItem, e);
	};
})();