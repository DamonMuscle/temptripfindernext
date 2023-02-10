(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").LandmarkDisplay = LandmarkDisplay;

	var svgPath = {
		point: {
			path: "M368,112c-11,1.4-24.9,3.5-39.7,3.5c-23.1,0-44-5.7-65.2-10.2c-21.5-4.6-43.7-9.3-67.2-9.3c-46.9,0-62.8,10.1-64.4,11.2   l-3.4,2.4v2.6v161.7V416h16V272.7c6-2.5,21.8-6.9,51.9-6.9c21.8,0,42.2,8.3,63.9,13c22,4.7,44.8,9.6,69.5,9.6   c14.7,0,27.7-2,38.7-3.3c6-0.7,11.3-1.4,16-2.2V126v-16.5C379.4,110.4,374,111.2,368,112z",
			size: 512,
			color: "rgb(0,0,255)",
			type: "point"
		},
		polygon: {
			path: "M6,26H26V18.25L12.62,6.69,6,12.87Z",
			size: 34,
			color: "rgb(255, 168, 80)",
			type: "polygon"
		},
		polyline: {
			path: "m27.33936,5.33936c-1.10547,0 -2,0.89453 -2,2c0,0.41406 0.12891,0.80469 0.34375,1.125l-1.9375,2.90625c-0.12891,-0.02734 -0.26953,-0.03125 -0.40625,-0.03125c-0.60156,0 -1.13281,0.26953 -1.5,0.6875l-5.5,-1.84375c-0.07812,-1.03125 -0.94922,-1.84375 -2,-1.84375c-1.10547,0 -2,0.89453 -2,2c0,1.10547 0.89453,2 2,2c0.05469,0 0.10547,0.00391 0.15625,0l3.375,6.6875c-0.08984,0.10156 -0.17969,0.19531 -0.25,0.3125l-4.34375,-0.53125c-0.23047,-0.84766 -1.01562,-1.46875 -1.9375,-1.46875c-1.10547,0 -2,0.89453 -2,2c0,0.50391 0.19141,0.96094 0.5,1.3125l-2.34375,4.6875c-0.05078,-0.00391 -0.10156,0 -0.15625,0c-1.10547,0 -2,0.89453 -2,2c0,1.10547 0.89453,2 2,2c1.10547,0 2,-0.89453 2,-2c0,-0.51172 -0.21484,-0.95703 -0.53125,-1.3125l2.34375,-4.6875c0.0625,0.00391 0.125,0 0.1875,0c0.75391,0 1.41016,-0.41406 1.75,-1.03125l4.3125,0.5625c0.23047,0.84766 1.01563,1.46875 1.9375,1.46875c1.10547,0 2,-0.89453 2,-2c0,-1.10547 -0.89453,-2 -2,-2c-0.05469,0 -0.10547,-0.00391 -0.15625,0l-3.34375,-6.6875l5.5,1.8125c0.06641,1.04688 0.9375,1.875 2,1.875c1.10547,0 2,-0.89453 2,-2c0,-0.41406 -0.12891,-0.80469 -0.34375,-1.125l1.9375,-2.90625c0.12891,0.02734 0.26953,0.03125 0.40625,0.03125c1.10547,0 2,-0.89453 2,-2c0,-1.10547 -0.89453,-2 -2,-2z ",
			size: 34,
			color: "rgb(0,0,0)",
			type: "polyline"
		}
	};

	function LandmarkDisplay(viewModel)
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

	LandmarkDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	LandmarkDisplay.prototype.constructor = LandmarkDisplay;

	LandmarkDisplay.prototype.onAllChangeEvent = function(e, data)
	{
		var self = this;
		if (data.edit)
		{
			data.edit.forEach(function(item)
			{
				var d = Enumerable.From(self.obData()).FirstOrDefault(null, function(c) { return c.id == item.id; });
				if (d)
				{
					d.obName(self.getName(item));
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

	LandmarkDisplay.prototype.highlightChangedEvent = function(e, data)
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

	LandmarkDisplay.prototype.selectedChangedEvent = function(e, data)
	{
		var self = this;
		this.setFooterDisplay();
		this.obData([]);

		this.obData(data.map(function(d)
		{
			var item = $.extend({}, d);
			item.isHighLightSelected = ko.observable(false);
			item.obName = ko.observable(self.getName(d));
			item.isLockedByOther = ko.observable(false);
			item.lockedByUser = ko.observable("");
			item.svg = ko.observable(svgPath[d.geometry.type]);
			return item;
		}));
	};

	LandmarkDisplay.prototype.getName = function(data)
	{
		return data.Name || "unnamed";
	};

	LandmarkDisplay.prototype.onLockedChange = function(e, lockInfo)
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

	LandmarkDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		self.dataModel.getCount().then(function(count)
		{
			self.setFooterDisplayText("Landmarks", count);
		});
	};

	LandmarkDisplay.prototype.setHighlighted = function(data)
	{
		this.dataModel.setHighlighted(data);
	};

	LandmarkDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	LandmarkDisplay.prototype.getSelected = function()
	{
		return this.dataModel.selected;
	};

	LandmarkDisplay.prototype.selectItemClick = function(selectItem, e)
	{
		this.selectWithKeyClick(selectItem, e);
	};

})();