(function()
{
	createNamespace("TF.Modal").KendoListMoverControlModalViewModel = KendoListMoverControlModalViewModel;

	var _DataFiledName = 'DisplayName';
	var defaultOptions = {
		_DataFiledName: _DataFiledName,
		_GridConifg: {
			gridSchema: {
				model: {
					fields: {
						'FieldName': { type: "string" },
						'DisplayName': { type: "string" }
					}
				},
			},
			gridColumns: [
				{
					field: _DataFiledName,
					title: _DataFiledName
				}
			],
			height: 400,
			selectable: TF.isMobileDevice ? "row" : "multiple"
		}
	};
	defaultOptions._sortItems = function(a, b)
	{
		var x, y;
		if (typeof a[_DataFiledName] === 'string')
		{
			x = a[_DataFiledName] ? a[_DataFiledName].toLowerCase() : '';
			y = b[_DataFiledName] ? b[_DataFiledName].toLowerCase() : '';
		}
		else
		{
			x = a[_DataFiledName]
			y = b[_DataFiledName]
		}
		return (x == y ? 0 : (x > y ? 1 : -1));
	};
	defaultOptions._convertImportData = function(items)
	{
		return items.map(function(item)
		{
			return {
				DisplayName: item,
				FieldName: item,
			};
		});
	};
	defaultOptions._getUnSelectedItems = function(allItems, selectedItems)
	{
		var unSelectedItems = allItems.filter(function(item)
		{
			var matchResult = [];
			matchResult = selectedItems.filter(function(selectedItem)
			{
				return selectedItem === item;
			});
			return matchResult.length === 0;
		});
		return unSelectedItems;
	};
	defaultOptions._fillDisplayName = function(items)
	{
		return items.map(function(item)
		{
			if (!item[_DataFiledName])
			{
				item[_DataFiledName] = item.FieldName;
			}
			return item;
		});
	};
	defaultOptions._convertOutputData = function(items)
	{
		return items.map(function(item)
		{
			return item.DisplayName;
		});
	};
	defaultOptions._sortKendoGrid = function(kendoGrid, sortItemFun, skip)
	{
		if (!skip)
			kendoGrid.dataSource.sort({ field: _DataFiledName, dir: "asc" });

		kendoGrid.dataSource.data(kendoGrid.dataSource.data().sort(sortItemFun));
	};

	function KendoListMoverControlModalViewModel (allItems, selectedItems, options, requestOptions)
	{
		TF.Modal.BaseModalViewModel.call(this);
		this.sizeCss = "modal-dialog-lg";
		this.title(options.title);
		this.description = options.description;
		this.contentTemplate("modal/kendolistmovercontrol");
		this.buttonTemplate("modal/positivenegative");
		this.obPositiveButtonLabel("Apply");

		defaultOptions._GridConifg.gridColumns[0].title =
			options.EnumListFilterColumnName ||
			(options.gridColumnSource && (options.gridColumnSource[0].DisplayName || options.gridColumnSource[0].FieldName)) ||
			defaultOptions._GridConifg.gridColumns[0].title;
		options = $.extend(true, {}, defaultOptions, options);

		this.kendolistMoverControlViewModel = new TF.Control.KendoListMoverControlViewModel(allItems, selectedItems, options, this.shortCutKeyHashMapKeyName, requestOptions);
		this.data(this.kendolistMoverControlViewModel);
	}

	KendoListMoverControlModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);
	KendoListMoverControlModalViewModel.prototype.constructor = KendoListMoverControlModalViewModel;

	KendoListMoverControlModalViewModel.prototype.positiveClick = function(viewModel, e)
	{
		this.kendolistMoverControlViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};
})();
