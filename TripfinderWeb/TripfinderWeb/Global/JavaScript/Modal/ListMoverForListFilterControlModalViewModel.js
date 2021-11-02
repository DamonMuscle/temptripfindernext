(function()
{
	createNamespace('TF').ListMoverForListFilterHelper = ListMoverForListFilterHelper;
	function ListMoverForListFilterHelper()
	{
		// This is intentional
	}

	ListMoverForListFilterHelper.processSelectedData = function(selectedData, filterField)
	{
		if (!selectedData || !Array.isArray(selectedData))
		{
			return selectedData;
		}

		return selectedData.map(function(item)
		{
			if (typeof filterField === 'string')
			{
				if (!filterField)
				{
					item = $.trim(item);
				}
				var tmp = filterField ? item[filterField] : item;
				item.FilterItem = typeof tmp === 'string' ? $.trim(tmp) : tmp;
			}
			else if (typeof filterField === 'function')
			{
				item.FilterItem = filterField(item);
			}
			return item;
		});
	};
})();

(function()
{
	createNamespace('TF.Modal').ListMoverForListFilterControlModalViewModel = ListMoverForListFilterControlModalViewModel;

	function ListMoverForListFilterControlModalViewModel(selectedData, options)
	{
		tf.modalManager.useShortCutKey = true;
		var title = options.FullDisplayFilterTypeName || "Filter " + options.DisplayFilterTypeName;
		const showRemoveColumnButton = options.GridType !== "School";
		var defaultOption = {
			title: title,
			description: `Select the ${options.DisplayFilterTypeName} that you would like to view.`,
			availableTitle: "Available",
			selectedTitle: "Selected",
			displayCheckbox: false,
			showRemoveColumnButton: showRemoveColumnButton,
			type: options.GridType
		};

		options = $.extend({}, defaultOption, options);

		this.filterField = options.filterField;

		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		this.ListMoverForListFilterControlViewModel = new TF.Control.ListMoverForListFilterControlViewModel(selectedData, options);
		this.data(this.ListMoverForListFilterControlViewModel);
		this.inheritChildrenShortCutKey = false;
	}

	ListMoverForListFilterControlModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ListMoverForListFilterControlModalViewModel.prototype.constructor = ListMoverForListFilterControlModalViewModel;

	ListMoverForListFilterControlModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.ListMoverForListFilterControlViewModel.apply().then(function(result)
		{
			result = TF.ListMoverForListFilterHelper.processSelectedData(result, self.filterField);
			result.sort(function(a, b)
			{
				return a.FilterItem.localeCompare(b.FilterItem);
			});
			self.positiveClose(result);
		});
	};

	ListMoverForListFilterControlModalViewModel.prototype.negativeClick = function()
	{
		this.ListMoverForListFilterControlViewModel.cancel().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
			else
			{
				this.negativeClose(false);
			}
		}.bind(this));
	};
})();
