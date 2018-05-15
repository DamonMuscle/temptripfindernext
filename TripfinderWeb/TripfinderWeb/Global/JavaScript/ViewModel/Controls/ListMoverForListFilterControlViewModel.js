(function()
{
	createNamespace('TF.Control').ListMoverForListFilterControlViewModel = ListMoverForListFilterControlViewModel;
	function ListMoverForListFilterControlViewModel(selectedData, options)
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.call(this, selectedData, options);
		this.optionSetLeftGridRequestURL = options.setLeftGridRequestURL;
		this.optionSetLeftGridRequestOption = options.setLeftGridRequestOption;
		this.optionSetRightGridRequestOption = options.setRightGridRequestOption;
	}

	ListMoverForListFilterControlViewModel.prototype = Object.create(TF.Control.KendoListMoverWithSearchControlViewModel.prototype);
	ListMoverForListFilterControlViewModel.prototype.constructor = ListMoverForListFilterControlViewModel;

	ListMoverForListFilterControlViewModel.prototype.columnSources = TF.ListFilterDefinition.ColumnSource;

	ListMoverForListFilterControlViewModel.prototype.initGridScrollBar = function(container)
	{
		//need check soon.
		var $gridContent = container.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
		{
			$gridContent.find("colgroup col:last").css({
				width: 137
			});
		}
		else
		{
			$gridContent.find("colgroup col:last").css({
				width: 120
			});
		}
	};

	ListMoverForListFilterControlViewModel.prototype.apply = function()
	{
		TF.Control.KendoListMoverWithSearchControlViewModel.prototype.apply.call(this);
		return new Promise(function(resolve, reject)
		{
			resolve(this.selectedData);
		}.bind(this));
	};

	ListMoverForListFilterControlViewModel.prototype.cancel = function()
	{
		return new Promise(function(resolve, reject)
		{
			resolve(false);
		}.bind(this));
	};

	ListMoverForListFilterControlViewModel.prototype.setLeftGridRequestURL = function(url)
	{
		if (!this.optionSetLeftGridRequestURL)
			return url = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setLeftGridRequestURL.call(this, url);

		return this.optionSetLeftGridRequestURL(this.obShowEnabled(), this.options.type);
	};

	ListMoverForListFilterControlViewModel.prototype.setLeftRequestOption = function(requestOptions)
	{
		if (!this.optionSetLeftGridRequestOption)
			return requestOptions = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setLeftRequestOption.call(this, requestOptions);

		return this.optionSetLeftGridRequestOption(requestOptions, this.obShowEnabled());
	};

	ListMoverForListFilterControlViewModel.prototype.setRightRequestOption = function(requestOptions)
	{
		if (!this.optionSetRightGridRequestOption)
			return requestOptions = TF.Control.KendoListMoverWithSearchControlViewModel.prototype.setRightRequestOption.call(this, requestOptions);

		return this.optionSetRightGridRequestOption(requestOptions);
	};
})();