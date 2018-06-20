(function()
{
	createNamespace('TF.Modal').ListMoverSelectRecipientControlModalViewModel = ListMoverSelectRecipientControlModalViewModel;

	function ListMoverSelectRecipientControlModalViewModel(selectedData)
	{
		var options = {
			title: "Select Recipients ",
			description: "You may select one or more of the Routefinder Pro user accounts. Only users that have an email may be selected.",
			availableTitle: "Available",
			selectedTitle: "Selected",
			type: "user",
			filterCheckboxText: "Show Enabled",
			getUrl: function()
			{
				return pathCombine(tf.api.apiPrefix(), "search", "user");
			},
			filterSetField: "AccountEnabled"
		};
		TF.Modal.KendoListMoverWithSearchControlModalViewModel.call(this, selectedData, options);
		//this.contentTemplate('modal/ListMoverSelectRecipientControl');
		this.ListMoverSelectRecipientControlViewModel = new TF.Control.ListMoverSelectRecipientControlViewModel(selectedData, options);
		this.data(this.ListMoverSelectRecipientControlViewModel);
		this.inheritChildrenShortCutKey = false;
	}

	ListMoverSelectRecipientControlModalViewModel.prototype = Object.create(TF.Modal.KendoListMoverWithSearchControlModalViewModel.prototype);
	ListMoverSelectRecipientControlModalViewModel.prototype.constructor = ListMoverSelectRecipientControlModalViewModel;

	ListMoverSelectRecipientControlModalViewModel.prototype.positiveClick = function()
	{
		this.ListMoverSelectRecipientControlViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	ListMoverSelectRecipientControlModalViewModel.prototype.negativeClick = function()
	{
		this.ListMoverSelectRecipientControlViewModel.cancel().then(function(result)
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
