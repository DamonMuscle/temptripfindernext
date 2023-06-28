(function()
{
	createNamespace("TF.Control.FieldEditor").DropDownEditorMenuViewModel = DropDownEditorMenuViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function DropDownEditorMenuViewModel(source, selectedValue)
	{
		source.some(function(item)
		{
			if (item.value === selectedValue)
			{
				item.checked = true;
				return true;
			}
		});
		this.obSource = ko.observable(source);
		this.menuClick = this.menuClick.bind(this);
		this.itemSelected = new TF.Events.Event();
		this.afterMenuRender = new TF.Events.Event();
	}

	DropDownEditorMenuViewModel.prototype.menuClick = function(viewModel, e)
	{
		if (viewModel && viewModel.isTitle) return;
		this.itemSelected.notify(viewModel);
	};

	DropDownEditorMenuViewModel.prototype.afterRender = function(elements, viewModel)
	{
		const $el = $(elements[0]);
		$el.find(".title").off();
		$el.find("li").attr("tabindex", "-1");
		this.afterMenuRender.notify();
	};

	DropDownEditorMenuViewModel.prototype.dispose = function()
	{
		this.itemSelected.unsubscribeAll();
		this.afterMenuRender.unsubscribeAll();
	};
})();