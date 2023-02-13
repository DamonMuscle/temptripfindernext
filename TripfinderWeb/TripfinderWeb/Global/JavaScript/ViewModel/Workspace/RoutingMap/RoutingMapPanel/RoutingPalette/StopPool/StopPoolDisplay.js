(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").StopPoolDisplay = StopPoolDisplay;

	function StopPoolDisplay(viewModel)
	{
		TF.RoutingMap.BaseMapDisplayModel.call(this, viewModel);
		var self = this;
		self.viewModel = viewModel;
		self.dataModel = viewModel.dataModel;
		self.obStopPools = ko.observableArray([]);
		self.obFooterDisplay = ko.observable("");
		self.obStopPoolName = ko.observable("");
		self.obStopPoolColor = ko.observable("");
		self.obStopPoolFillPattern = ko.observable("");
		self.lastSelectedItemId = 0;
		self.lastSelectedItemType = "";
		TF.RoutingMap.BaseMapDisplayModel.call(self, viewModel);
		self.dataModel.onAllChangeEvent.subscribe(self.onAllChange.bind(self));
		self.dataModel.highlightChangedEvent.subscribe(self.highlightChanged.bind(self));
		self.viewModel.dataModel.lockData.onLockedChangeEvent.subscribe(self.onLockedChange.bind(self));
		self.dataModel.settingChangeEvent.subscribe(self.onSettingChangeEvent.bind(this));
		self.dataModel.selectedCategorySettingChangedEvent.subscribe(self.onSelectedCategorySettingChange.bind(self));
	}

	StopPoolDisplay.prototype = Object.create(TF.RoutingMap.BaseMapDisplayModel.prototype);
	StopPoolDisplay.prototype.constructor = StopPoolDisplay;

	StopPoolDisplay.prototype.highlightChanged = function()
	{
		var self = this;
		self.obStopPools().forEach(function(item)
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

	StopPoolDisplay.prototype.onLockedChange = function(e, lockInfo)
	{
		var self = this;
		var otherLockEnumerable = Enumerable.From(lockInfo.lockedByOtherList);
		self.obStopPools().forEach(function(data)
		{
			var lockedInfo = otherLockEnumerable.FirstOrDefault(null, function(x) { return x.Id == data.id; });
			var isLockedByOther = !!lockedInfo;
			var lockedByUser = TF.RoutingMap.LockData.displayLockedUser(lockedInfo);
			data.obIsLockedByOther(isLockedByOther);
			data.obLockedByUser(lockedByUser);
		});
	};

	StopPoolDisplay.prototype.propertyChanged = function(editStopPools)
	{
		var self = this;
		self.obStopPools().forEach(function(item)
		{
			var dataSource = Enumerable.From(editStopPools).FirstOrDefault(null, function(c) { return c.id == item.id; });
			if (dataSource)
			{
				self.setStudentCountDisplay(dataSource);
				self.setObservableValue(item, dataSource);
			}
		});
		self.setFooterDisplay();
	};

	StopPoolDisplay.prototype.onAllChange = function(e, param)
	{
		var self = this;
		self.selectedCategory = self.dataModel.selectedCategory();
		if (self.selectedCategory == null)
		{
			self.obStopPools([]);
			self.obFooterDisplay("");
			self.obStopPoolName("");
			self.obStopPoolColor("");
			self.obStopPoolFillPattern("");
		} else
		{
			self.obStopPoolName(self.selectedCategory.Name);
			self.obStopPoolColor(self.selectedCategory.Color);
			self.getFillPattern().then(function(fillPattern)
			{
				self.obStopPoolFillPattern(fillPattern);
			});

			if (param.add.length > 0)
			{
				var stopPools = $.extend(true, [], param.add);
				var stopPoolArray = Enumerable.From(stopPools).Select(function(c)
				{
					c.isHighlighted = false;
					c.isLockedByOther = !!c.isLockedByOther;
					c.lockedByUser = c.lockedByUser || "";
					self.setStudentCountDisplay(c);
					c.StudentCountDisplay = c.StudentCountDisplay || "";
					return self.changeToObservable(c);
				}).ToArray();
				self.obStopPools(self.dataModel.sortSelected(self.obStopPools().concat(stopPoolArray)));
			}
			if (param.delete.length > 0)
			{
				self.obStopPools(self.dataModel.sortSelected(self.obStopPools().filter(function(stopPool)
				{
					return Enumerable.From(param.delete).FirstOrDefault(null, function(item) { return item.id == stopPool.id; }) == null;
				})));
			}
			if (param.edit.length > 0)
			{
				self.propertyChanged(param.edit);
				self.obStopPools(self.dataModel.sortSelected(self.obStopPools()));
			}
		}
		self.setFooterDisplay();
	};

	StopPoolDisplay.prototype.setStudentCountDisplay = function(data)
	{
		var students = data.Students || [];
		data.StudentCountDisplay = students.length + TF.getSingularOrPluralTitle(" Students", students.length);
	};

	StopPoolDisplay.prototype.getFillPattern = function()
	{
		var opacity = 0;
		return this.dataModel.getSetting().then(function(settings)
		{
			switch (settings.fillPattern)
			{
				case "None":
					opacity = 0;
					break;
				case "Semi":
					opacity = 0.3;
					break;
				case "Solid":
					opacity = 1;
					break;
			}
			return Promise.resolve(opacity);
		});
	};

	StopPoolDisplay.prototype.onSettingChangeEvent = function()
	{
		var self = this;
		self.getFillPattern().then(function(fillPattern)
		{
			self.obStopPoolFillPattern(fillPattern);
		});
	};

	StopPoolDisplay.prototype.onSelectedCategorySettingChange = function(e, data)
	{
		var self = this;
		if (data)
		{
			self.obStopPoolName(data.Name || "");
			self.obStopPoolColor(data.Color || "");
		}
	};

	StopPoolDisplay.prototype.setFooterDisplay = function()
	{
		var self = this;
		self.setFooterDisplayText("Pool Stop", self.obStopPools().length, true);
	};

	StopPoolDisplay.prototype.getHighlighted = function()
	{
		return this.dataModel.highlighted;
	};

	StopPoolDisplay.prototype.getSelected = function()
	{
		return this.obStopPools();
	};

	StopPoolDisplay.prototype.setHighlighted = function(selectedItems)
	{
		this.dataModel.setHighlighted(selectedItems);
	};

	StopPoolDisplay.prototype.selectStopPoolClick = function(viewModal, e)
	{
		var self = this;
		self.selectWithKeyClick(viewModal, e);
	};
})();