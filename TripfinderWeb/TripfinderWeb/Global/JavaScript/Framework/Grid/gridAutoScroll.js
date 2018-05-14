(function($)
{
	createNamespace("TF.KendoGrid").AutoScroll = AutoScroll;

	var defaults = {
		delayTime: 40
	};

	function AutoScroll(grid, options)
	{
		this.options = $.extend(true,
		{}, defaults, options);
		this.grid = grid;
		this.onScrollAtBottom = new TF.Events.Event();
		this.delayTimer = null;
	}

	AutoScroll.prototype.startAutoScroll = function()
	{
		var scrollElement = this.grid.$container.find(".k-scrollbar-vertical").length>0 ? this.grid.$container.find(".k-scrollbar-vertical") : this.grid.$container.find("div.k-grid-content");
		scrollElement.scrollTop(0);
		this.grid.obIsScrollAtBottom(false);
		this.autoMoveScroll();
		this._disableFilterControl();
	};

	AutoScroll.prototype.autoMoveScroll = function()
	{
		var self = this,
			delay = 1000;
		clearTimeout(self.delayTimer);
		(function scrollDown()
		{
			clearTimeout(self.delayTimer);
			self.delayTimer = setTimeout(function()
			{
				var scrollElement = self.grid.$container.find(".k-scrollbar-vertical").length>0 ? self.grid.$container.find(".k-scrollbar-vertical") : self.grid.$container.find("div.k-grid-content");

				delay = self.options.delayTime;
				var oldScrollTop = scrollElement.scrollTop();
				scrollElement.scrollTop(oldScrollTop + 1);
				if (scrollElement[0].scrollHeight > scrollElement.height() && (oldScrollTop < scrollElement.scrollTop() || self.grid.obIsScrollAtBottom() === false))
				{
					scrollDown();
				}
				else
				{
					self.onScrollAtBottom.notify(true);
				}
			}, delay);
		})();
	};

	AutoScroll.prototype.stopAutoScroll = function()
	{
		clearTimeout(this.delayTimer);
		this._enableFilterControl();
	};


	AutoScroll.prototype.scrollTop = function()
	{
		this.grid.$container.find("div.k-grid-content").scrollTop(0);
		this.grid.obIsScrollAtBottom(false);
	};

	AutoScroll.prototype.dispose = function()
	{
		clearTimeout(this.delayTimer);
		this.onScrollAtBottom.unsubscribeAll();
		this.grid = null;
		this.options = null;
	};

	AutoScroll.prototype._disableFilterControl = function()
	{
		this.grid.$container.find(".k-grid-header-locked tr:eq(1),.k-grid-header-wrap tr:eq(1)").hide();
		this.grid.$container.find(".k-grid-content,.k-grid-content-locked").height(this.grid.$container.parent().height() - 66);
	};

	AutoScroll.prototype._enableFilterControl = function()
	{
		this.grid.rebuildGrid();
	};
})(jQuery);
