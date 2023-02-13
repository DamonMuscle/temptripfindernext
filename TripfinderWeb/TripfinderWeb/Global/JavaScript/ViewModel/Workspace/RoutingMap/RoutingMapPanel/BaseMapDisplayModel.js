(function()
{
	createNamespace("TF.RoutingMap").BaseMapDisplayModel = BaseMapDisplayModel;

	function BaseMapDisplayModel(viewModal)
	{
		this._viewModal = viewModal;
		this.lastSelectedItemId = 0;
		this.keyProperty = "id";
	}

	BaseMapDisplayModel.prototype.setObservableValue = function(data, dataSource)
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

	BaseMapDisplayModel.prototype.changeToObservable = function(data)
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

	BaseMapDisplayModel.prototype.compare = function(a, b, propertyA)
	{
		return TF.compareOnProperty(a, b, propertyA);
	};

	BaseMapDisplayModel.prototype.selectWithKeyClick = function(selectItem, e)
	{
		var self = this;
		if (e.ctrlKey && e.button == 0)
		{
			self.multipleSelect(selectItem);
		}
		else if (e.shiftKey && e.button == 0)
		{
			self.shiftSelect(selectItem);
		}
		else
		{
			self.singleSelect(selectItem);
		}
	};

	BaseMapDisplayModel.prototype.multipleSelect = function(newItem)
	{
		var self = this;
		var selectedItems = self.getHighlighted();
		var index = self.getIdIndex(selectedItems, newItem[self.keyProperty]);
		if (index === -1)
		{
			selectedItems.push(newItem);
		}
		else
		{
			selectedItems.splice(index, 1);
		}
		self.setHighlighted(self.getHighLightItemIds(selectedItems, this.getSelected()));
		self.lastSelectedItemId = newItem[self.keyProperty];
	};

	BaseMapDisplayModel.prototype.shiftSelect = function(newItem)
	{
		var self = this;
		var selectedItems = [];
		var allItems = self.getSelected();
		if (allItems && self.lastSelectedItemId !== 0)
		{
			var preIndex = self.getIdIndex(allItems, self.lastSelectedItemId);
			var currentIndex = self.getIdIndex(allItems, newItem[self.keyProperty]);
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
			selectedItems.push(newItem);
		}
		self.setHighlighted(self.getHighLightItemIds(selectedItems, this.getSelected()));
	};

	BaseMapDisplayModel.prototype.singleSelect = function(newItem)
	{
		var self = this;
		var selectedItems = self.getHighlighted();
		var index = self.getIdIndex(selectedItems, newItem[self.keyProperty]);
		if (index === -1)
		{
			selectedItems = [newItem];
		}
		else
		{
			if (selectedItems.length > 1)
			{
				selectedItems = [newItem];
			}
			else
			{
				selectedItems = [];
			}
		}
		self.setHighlighted(self.getHighLightItemIds(selectedItems, this.getSelected()));
		self.lastSelectedItemId = newItem[self.keyProperty];
	};

	BaseMapDisplayModel.prototype.getHighLightItemIds = function(selectedItems, selectedItemSource)
	{
		var self = this;
		return selectedItemSource.filter(function(item)
		{
			var isInSelectedSource = self.getIdIndex(selectedItems, item[self.keyProperty]) !== -1;
			return isInSelectedSource;
		}).map(function(item)
		{
			return item[self.keyProperty];
		});
	};

	BaseMapDisplayModel.prototype.getIdIndex = function(list, id)
	{
		var index = -1;
		for (var i = 0; i < list.length; i++)
		{
			if (list[i][this.keyProperty] === id)
			{
				index = i;
				break;
			}
		}
		return index;
	};

	BaseMapDisplayModel.prototype.setFooterDisplayText = function(name, totalCount, notShowSelectedOf)
	{
		var self = this,
			text = totalCount + " " + this.getSingularOrPluralTitle(name, totalCount),
			highlightedCount = self.getHighlighted().length;

		if (!notShowSelectedOf)
		{
			text = self.getSelected().length + " of " + text;
		}
		if (highlightedCount > 0)
		{
			text += " (" + highlightedCount + " Selected)";
		}
		self.obFooterDisplay(text);
	};

	BaseMapDisplayModel.prototype.getSingularOrPluralTitle = function(name, totalCount)
	{
		return TF.getSingularOrPluralTitle(name, totalCount);
	};

	BaseMapDisplayModel.prototype.dispose = function()
	{
		tfdispose(this);
	};

})();