(function()
{
	createNamespace("TF.Control.FieldEditor").VirtualScollingEditorMenuViewModel = VirtualScollingEditorMenuViewModel;

	/**
	 * Constructor
	 * @returns {void} 
	 */
	function VirtualScollingEditorMenuViewModel(source, selectedValue)
	{
		source.some(function(item)
		{
			if (item.value === selectedValue)
			{
				item.checked = true;
				return true;
			}
		});
		this.resultListBox = null;
		this.source = source;
		this.maxHeight = 600;
		this.singleHeight = 24;
		this.itemCountPerPage = 50;
		this.itemSelected = new TF.Events.Event();
		this.afterMenuRender = new TF.Events.Event();
	}

	VirtualScollingEditorMenuViewModel.prototype.init = function(model, element)
	{
		this.$element = $(element);
		let $container = this.$element.find("ul");
		this.resultListBox = new TF.VirtualScrollListBox({
			dataSource: this.source,
			container: $container[0],
			singleHeight: this.singleHeight,
			itemCountPerPage: this.itemCountPerPage,
			selectable: "single",
			template: function(item)
			{
				let $item = $("<li class='menu-item " + (item.isTitle ? item.isTitle : "") + "'>");
				if (item.checked)
				{
					$item.addClass("menu-item-checked");
				}
				let $itemContent = $("<div class='menu-label' >" + item.text + "</div>");
				$item.append($itemContent);
				return $item[0];
			},
			selectionChanged: items =>
			{
				this.itemSelected.notify(items && items[0]);
			}
		});
	};

	VirtualScollingEditorMenuViewModel.prototype.scrollToSelected = function()
	{
		this.resultListBox.scrollToItem(this.source.filter(f => f.checked)[0]);
	};

	VirtualScollingEditorMenuViewModel.prototype.afterRender = function()
	{
		this.$element.find(".title").off();
		this.$element.find("li").attr("tabindex", "-1");
		this.afterMenuRender.notify();
	};

	VirtualScollingEditorMenuViewModel.prototype.dispose = function()
	{
		this.itemSelected.unsubscribeAll();
		this.afterMenuRender.unsubscribeAll();
	};
})();