(function()
{
	createNamespace("TF").KendoGridNavigator = KendoGridNavigator;

	function KendoGridNavigator(options)
	{
		TF.ShortcutExtender.call(this, options.grid.element, options.forceFocusable != null ? options.forceFocusable : true);
		this.grid = options.grid;
		this.tfGrid = options.tfGrid;
		this.pageSize = options.pageSize || 16;
		this.keyFieldName = options.keyFieldName || 'kendoUid';
		this.addShortcuts();
	}

	KendoGridNavigator.prototype = Object.create(TF.ShortcutExtender.prototype);

	KendoGridNavigator.prototype.constructor = KendoGridNavigator;

	KendoGridNavigator.prototype.addShortcuts = function()
	{
		var self = this, pageSize = 8, shortcuts = [{
			key: "up",
			action: function() { self.moveSelectedIndex(null, -1); }
		}, {
			key: "down",
			action: function() { self.moveSelectedIndex(null, 1); }
		}, {
			key: "pageup",
			action: function() { self.moveSelectedIndex(null, -pageSize); }
		}, {
			key: "pagedown",
			action: function() { self.moveSelectedIndex(null, pageSize); }
		}, {
			key: "ctrl+home",
			action: function() { self.moveSelectedIndex(0); }
		}, {
			key: "ctrl+end",
			action: function() { self.moveSelectedIndex(Number.MAX_VALUE); }
		}];

		shortcuts.forEach(function(k)
		{
			this.add(k.key, k.action);
		}.bind(this));
	};

	KendoGridNavigator.prototype.moveSelectedIndex = function(target, step)
	{
		target = target == null ? this.getSelectedIndex() : target;
		step = step || 0;
		this.setSelectedIndex(target + step);
		if (TF.isIE)
		{
			setTimeout(this.scrollToSelection.bind(this), 100);
			return;
		}

		this.scrollToSelection();
	};

	KendoGridNavigator.prototype.scrollToSelection = function()
	{
		var index = this.getSelectedIndex(),
			itemHeight = this.getItemHeight(),
			newScrollTop = index * itemHeight,
			content = this.grid.content,
			scrollableWrap = content.find('.k-virtual-scrollable-wrap'),
			viewPortHeight = scrollableWrap.length ? scrollableWrap[0].clientHeight : content[0].clientHeight,
			vScrollbarElement = content.find(".k-scrollbar-vertical"),
			vScrollbar = vScrollbarElement.length ? vScrollbarElement : content,
			maxScrollTop = (this.getItemsCount() * itemHeight - viewPortHeight),
			maxVScrollbarScrollTop = vScrollbar.prop("scrollHeight") - vScrollbar.height(),
			scrollTopRate = maxVScrollbarScrollTop / maxScrollTop,
			currentScrollTop = vScrollbar.scrollTop() / scrollTopRate;

		if (newScrollTop == currentScrollTop ||
			(newScrollTop > currentScrollTop && newScrollTop + itemHeight <= currentScrollTop + viewPortHeight))
		{
			return;
		}

		if (newScrollTop + itemHeight > currentScrollTop + viewPortHeight)
		{
			newScrollTop = newScrollTop - viewPortHeight + itemHeight;
		}

		vScrollbar.scrollTop(newScrollTop * scrollTopRate);
	};

	KendoGridNavigator.prototype.getItemsCount = function()
	{
		return this.grid.dataSource.total();
	};

	KendoGridNavigator.prototype.getItemHeight = function()
	{
		var $tr = this.element.find(".k-virtual-scrollable-wrap table tr");
		if (!$tr.length)
		{
			$tr = this.grid.content.find("tr");
		}

		if (!$tr.length)
		{
			return 0;
		}

		return $tr.outerHeight();
	};

	KendoGridNavigator.prototype.setSelectedIndex = function(value)
	{
		if (this.tfGrid)
		{
			this.tfGrid.setSelectedIndex(value);
			return;
		}

		var length = this.getItemsCount();
		if (!length) return;

		value = Math.max(Math.min(length - 1, value), 0);
		this.grid.clearSelection();
		this.grid.select(this.grid.content.find("tr:eq(" + value + ")"));
	};

	KendoGridNavigator.prototype.getSelectedIndex = function()
	{
		if (this.tfGrid)
		{
			return this.tfGrid.obSelectedIndex();
		}

		var first = this.grid.select()[0];
		if (!first) return -1;

		var dataItem = this.grid.dataItem(first);
		return this.grid.dataSource.indexOf(dataItem);
	};
})();