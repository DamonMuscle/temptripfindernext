(function()
{
	createNamespace('TF.Modal').ListMoverSelectRecipientControlModalViewModel = ListMoverSelectRecipientControlModalViewModel;

	function ListMoverSelectRecipientControlModalViewModel(selectedData, options)
	{
		var defaults = {
			title: "Select Recipients ",
			description: "You may select one or more of the Routefinder Plus user accounts. Only users that have an email may be selected.",
			availableTitle: "Available",
			selectedTitle: "Selected",
			type: "user",
			displayCheckbox: false,
			disableFilter: true,
			getUrl: function()
			{
				if (options && (options.type == "contact" || options.type == "staff"))
				{
					return tf.dataTypeHelper.getSearchUrl(tf.datasourceManager.databaseId, options.type);
				}
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), "search", "users");
			},
			filterSetField: "AccountEnabled"
		};
		this.options = options = $.extend(true, defaults, options);
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		var viewModel = new TF.Control.ListMoverSelectRecipientControlViewModel(selectedData, options);
		viewModel.obDisplayCheckbox(false);
		this.data(viewModel);
	}

	ListMoverSelectRecipientControlModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ListMoverSelectRecipientControlModalViewModel.prototype.constructor = ListMoverSelectRecipientControlModalViewModel;

	ListMoverSelectRecipientControlModalViewModel.prototype.positiveClick = function()
	{
		this.data().apply().then(function(result)
		{
			var promise = [];
			if (this.options.checkResult)
			{
				promise.push(this.options.checkResult(result));
			}
			return Promise.all(promise).then(function(checkResult)
			{
				if (checkResult && checkResult.length > 0 && checkResult[0] === false)
				{
					return;
				}
				if (result)
				{
					this.positiveClose(result);
				}
			}.bind(this));
		}.bind(this));
	};

	ListMoverSelectRecipientControlModalViewModel.prototype.negativeClick = function()
	{
		this.data().cancel().then(function(result)
		{
			if (result)
			{
				this.negativeClose();
			}
		}.bind(this));
	};
})();
