(function()
{
	createNamespace("TF").VirtualScrollListBox = VirtualScrollListBox;

	/**
	 * Constructor.
	 * @param {object} options Object that contains the initialization data.
	 * @returns {void} 
	 */
	function VirtualScrollListBox(options)
	{
		var self = this;
		self.options = options;
		self.panel = null;
		self.scrollingPanel = null;
		self.container = null;
		self.singleHeight = 0;
		self.itemCountPerPage = 0;
		self.selectedIndexes = [];
		self.listContainer = null;
		self.selectedItems = [];
		self.init();
	};

	/**
	 * Initialize.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.init = function()
	{
		var self = this;
		if (!self.options || !self.options.dataSource || !self.options.container)
		{
			return;
		}

		self.singleHeight = self.options.singleHeight;
		self.listContainer = $(self.options.container);
		self.panel = $("<div class='virtual-panel'></div>");
		self.scrollingPanel = $("<div class='scrolling-panel'></div>");
		self.container = $("<div class='virtual-container'></div>");
		self.listContainer.append(self.panel);
		self.scrollingPanel.append(self.container);
		self.panel.append(self.scrollingPanel);
		self.panel.css({ "max-height": self.options.maxHeight ? (self.options.maxHeight + "px") : '100%' });

		self.generateItems();
		self.initVirtualContainer();
		self.bindEvent();
	};

	VirtualScrollListBox.prototype.isFullHeight = function()
	{
		return this.panel.css("max-height") === "100%";
	}

	/**
	 * Generate Items for current position of scroll panel.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.generateItems = function()
	{
		var self = this, maxHeight = self.options.maxHeight || self.listContainer.outerHeight(),
			scrollTop = self.isFullHeight() ? self.listContainer.scrollTop() : self.panel.scrollTop(), begin = 0, end;

		if (!!self.singleHeight || scrollTop !== 0)
		{
			begin = Math.floor(scrollTop / self.singleHeight);
			if (begin < 0)
			{
				begin = 0;
			}
		}

		if (self.itemCountPerPage)
		{
			end = begin + self.itemCountPerPage + 1;
			if (end > self.options.dataSource.length)
			{
				end = self.options.dataSource.length;
			}
		}
		else
		{
			end = begin + 1;
		}

		if (self.container.find("li:not('.title'):nth(0)").attr("item-index") == begin.toString() && self.container.find("li:not('.title'):nth(-1)").attr("item-index") == (end - 1).toString())
		{
			return;
		}

		self.container.empty();
		for (var i = begin; i < end; i++)
		{
			var item = self.options.dataSource[i];
			if (self.options.template)
			{
				var itemTemplate = self.options.template(item);
				$(itemTemplate).attr("item-index", i);
				self.container.append($(itemTemplate));

				if (!!self.options.selectable)
				{
					$(itemTemplate).on("click", function(e)
					{
						self.itemClick(e, this);
					});
				}
			}

			if (i === begin && (!self.singleHeight || !self.itemCountPerPage))
			{
				let height = $(itemTemplate).outerHeight();
				if (height)
				{
					self.singleHeight = $(itemTemplate).outerHeight();
				}
				if (self.options.itemCountPerPage)
				{
					self.itemCountPerPage = self.options.itemCountPerPage;
				}
				else
				{
					self.itemCountPerPage = Math.ceil(maxHeight / self.singleHeight);
				}
				end = begin + self.itemCountPerPage + 1;
				if (end > self.options.dataSource.length)
				{
					end = self.options.dataSource.length;
				}
			}
		}
		self.changeStyleForSelectedItems();
		self.container.css("marginTop", begin === 0 ? 0 : begin * self.singleHeight);
	};

	/**
	 * Initialize the virtual scroll container.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.initVirtualContainer = function()
	{
		var self = this;
		if (self.singleHeight)
		{
			self.scrollingPanel.height(self.singleHeight * self.options.dataSource.length);
			self.container.css("marginTop", 0);
		}
	};

	/**
	 * Bind events for VirtualScrollListBox 
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.bindEvent = function()
	{
		let container = this.isFullHeight() ? this.listContainer : this.panel;
		container.on("scroll", this.scrollPanel.bind(this));
	};

	/**
	 * Fired after an item is clicked.
	 * @param {any} e Event argument
	 * @param {dom} item The dom which is clicking at.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.itemClick = function(e, item)
	{
		var self = this, $item = $(item), currentSelectedIndex = parseInt($item.attr("item-index")),
			lastSelectedIndex = self.selectedIndexes[self.selectedIndexes.length - 1];
		if (self.options.selectable.toLowerCase() === "single")
		{
			self.container.find(".selected").removeClass("selected");
			$item.addClass("selected");
			self.selectedItems.push(self.options.dataSource[currentSelectedIndex]);
		}
		else if (self.options.selectable.toLowerCase() === "multiple")
		{
			if (self.selectedIndexes.length === 0)
			{
				self.container.find(".selected").removeClass("selected");
				$item.addClass("selected");
				self.selectedIndexes.push(currentSelectedIndex);
			}
			else
			{
				if (e.ctrlKey)
				{
					$item.addClass("selected");
					self.selectedIndexes.push(currentSelectedIndex);
				}
				else if (e.shiftKey)
				{
					var begin, end;
					begin = Math.min(currentSelectedIndex, lastSelectedIndex);
					end = Math.max(currentSelectedIndex, lastSelectedIndex);
					for (var i = begin; i <= end; i++)
					{
						if (self.selectedIndexes.indexOf(i) < 0)
						{
							self.selectedIndexes.push(i);
						}
					}
					self.changeStyleForSelectedItems();
				}
				else
				{
					self.selectedIndexes.length = 0;
					self.container.find(".selected").removeClass("selected");
					$item.addClass("selected");
					self.selectedIndexes.push(currentSelectedIndex);
				}
			}

			self.selectedItems.length = 0;
			for (var i = 0; i < self.selectedIndexes.length; i++)
			{
				self.selectedItems.push(self.options.dataSource[self.selectedIndexes[i]]);
			}
		}

		//invoke selectionChanged event.
		if (self.options.selectionChanged)
		{
			self.options.selectionChanged(self.selectedItems);
		}
	};

	/**
	 * Give styles to selected items.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.changeStyleForSelectedItems = function()
	{
		var self = this, items = self.container.children(), $item, currentSelectedIndex;
		$.each(items, function(index, item)
		{
			$item = $(item);
			currentSelectedIndex = parseInt($item.attr("item-index"));
			if (self.selectedIndexes.indexOf(currentSelectedIndex) >= 0)
			{
				$item.addClass("selected");
			}
		})
	};

	/**
	 * Set data source to VirtualScrollListBox.
	 * @param {array} dataSource
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.setDataSource = function(dataSource)
	{
		var self = this;
		self.options.dataSource = dataSource;
		self.selectedIndexes = [];
		self.selectedItems = [];
		self.generateItems();

		if (self.singleHeight)
		{
			self.scrollingPanel.height(self.singleHeight * self.options.dataSource.length);
		}
	};

	/**
	 * Set the max height of VirtualScrollListBox
	 * @param {number} maxHeight The max height of VirtualScrollListBox
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.setMaxHeight = function(maxHeight)
	{
		var self = this;

		self.options.maxHeight = maxHeight;
		self.panel.css({ "max-height": maxHeight });
		self.itemCountPerPage = 0;
		self.generateItems();
	};

	/**
	 * Fired when panel is scrolling.
	 * @returns {void} 
	 */
	VirtualScrollListBox.prototype.scrollPanel = function()
	{
		this.generateItems();
	};

	VirtualScrollListBox.prototype.scrollToItem = function(item)
	{
		if (!item || !this.options.dataSource)
		{
			return;
		}

		let container = this.isFullHeight() ? this.listContainer : this.panel;
		let index = this.options.dataSource.findIndex(i => i === item);
		let itemCount = container.outerHeight() / this.singleHeight;
		// put item in the middle of the scroll bar.
		index = index - itemCount / 2;
		container.scrollTop(index * this.singleHeight);
		this.generateItems();
	};

	/**
	 * 
	 * @returns {type} 
	 */
	VirtualScrollListBox.prototype.dispose = function()
	{
		var self = this;
		self.container.remove();
		self.scrollingPanel.remove();
		self.panel.remove();

		tfdispose(self);
	};
})();