(function()
{
	createNamespace("TF.ViewieControl").ResizeablePanel = ResizeablePanel;

	function ResizeablePanel(options)
	{
		var self = this;
		self.isMobileDevice = isMobileDevice();
	}

	ResizeablePanel.prototype._setGridPanelWidth = function(currentPanelWidth)
	{
		var self = this;
		self._refreshPanel();
	};

	//change grid width when drag change width
	ResizeablePanel.prototype._refreshPanel = function()
	{
		var $container = $(".kendo-grid.kendo-grid-container.k-grid.k-widget");
		var currentPanelWidth = $container.parent().width(),
			lockedHeaderWidth = $container.find('.k-grid-header-locked').width(),
			paddingRight = parseInt($container.find(".k-grid-content").css("padding-right")),
			width = currentPanelWidth - lockedHeaderWidth - paddingRight - 2;
		$container.find(".k-auto-scrollable,.k-grid-content").width(width);
	};

	ResizeablePanel.prototype.dispose = function()
	{

	};
})();
