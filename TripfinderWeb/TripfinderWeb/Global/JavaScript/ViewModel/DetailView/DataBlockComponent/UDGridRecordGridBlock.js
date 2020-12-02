(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").UDGridRecordGridBlock = UDGridRecordGridBlock;

	function UDGridRecordGridBlock(options, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.$element = null;
		self.uniqueClassName = null;
		self.pubSubSubscriptions = [];

		self.$detailView = detailView.$element;
		self.options = options;
		self.gridConfigs = self.options.gridConfigs;
		self.extraGridConfigs = self._getExtraGridConfigurations(detailView._getLayoutObjInCache().width);

		self.initElement(options);

		self.isBlockReadOnly.subscribe(val =>
		{
			if (val)
			{
				// disable user to edit rows in grid
				self.grid.wrapper.on('mousedown.readonlyBlock', (e) =>
				{
					e.preventDefault();
					e.stopPropagation();
				}).on('mouseover.readonlyBlock', (e) =>
				{
					self.$el.find(".on-demand-container").hide();
				}).on('contextmenu.readonlyBlock', (e) =>
				{
					e.preventDefault();
					e.stopPropagation();
				});
				self.$el.find(".grid-top-right-button").addClass("disabled");
				self.grid.hideColumn("Action");
			} else
			{
				self.grid.wrapper.off('.readonlyBlock');
				self.$el.find(".grid-top-right-button").removeClass("disabled");
				self.grid.showColumn("Action");
			}
		});
	};

	UDGridRecordGridBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	UDGridRecordGridBlock.prototype.initElement = function(options)
	{
		var self = this,
			uniqueClassName = options.uniqueClassName || tf.helpers.detailViewHelper.generateUniqueClassName(),
			title = options.title,
			extraGridConfigs = self.extraGridConfigs,
			$element = $("<div>", { class: uniqueClassName }),
			$gridStackItem = $("<div>", { class: "grid-stack-item-content custom-grid", "data-block-field-name": options.field }),
			$itemTitleInput = $("<input>", { class: "item-title", type: "text", value: title }),
			$itemTitleDiv = $("<div>", { class: "item-title", text: title }),
			$itemContent = $("<div>", { class: "item-content grid" }),
			$kendoGrid = $("<div>", { class: "kendo-grid" });

		if (extraGridConfigs)
		{
			if (extraGridConfigs.minWidth)
			{
				options.minWidth = extraGridConfigs.minWidth;
			}

			// If this grid has top right button
			if (extraGridConfigs.topRightButton)
			{
				$itemTitleDiv.append($(extraGridConfigs.topRightButton));
			}

			if (extraGridConfigs.titleStyles)
			{
				$itemTitleDiv.css(extraGridConfigs.titleStyles);
			}
		}

		$itemContent.append($kendoGrid);
		$gridStackItem.append($itemTitleInput, $itemTitleDiv, $itemContent);
		$element.append($gridStackItem);

		self.$el = $element;
		self.uniqueClassName = uniqueClassName;
	};

	UDGridRecordGridBlock.prototype.initEvents = function()
	{
		let $btn = this.$el.find(".grid-top-right-button");

		// Check if permission check could pass.
		if (!this.extraGridConfigs || this.extraGridConfigs.permission)
		{
			$btn.on("click.detailView", () => { this.onTopRightButtonClick() });
		}
	};

	UDGridRecordGridBlock.prototype.onTopRightButtonClick = function()
	{
		if (typeof this.gridConfigs.topRightButtonClick == "function")
		{
			this.gridConfigs.topRightButtonClick();
		}
	};

	UDGridRecordGridBlock.prototype.onRecordDoubleClick = function(recordId)
	{
		if (typeof this.gridConfigs.recordDoubleClick == "function")
		{
			this.gridConfigs.recordDoubleClick(recordId);
		}
	};

	UDGridRecordGridBlock.prototype.onDataBound = function(e)
	{
		if (typeof this.gridConfigs.dataBound == "function")
		{
			this.gridConfigs.dataBound(e);
		}
	};

	/**
	 * Get special grid configurations.
	 *
	 * @param {string} gridName
	 * @returns
	 */
	UDGridRecordGridBlock.prototype._getExtraGridConfigurations = function(layoutColumnCount)
	{
		let result = {},
			config = this.gridConfigs.extraButtonConfigs;

		if (config)
		{
			var $btn = $("<div/>", { class: "grid-top-right-button " + config.btnClass, text: config.btnLabel }),
				hasPermission = (typeof config.checkPermission === "function" ? config.checkPermission() : true);

			result = {
				"minWidth": Math.min(layoutColumnCount, 2),
				"titleStyles": {
					"margin-bottom": "15px",
					"top": "15px",
					"position": "relative"
				},
				"topRightButton": (hasPermission && !this.isReadOnly()) ? $btn : $btn.addClass("disabled"),
				"permission": hasPermission
			};
		}

		return result;
	};

	/**
	 * Bind contact related events to detail mini grid.
	 *
	 * @param {String} miniGridType
	 * @param {Object} kendoGrid
	 * @returns
	 */
	UDGridRecordGridBlock.prototype._bindMiniGridEvent = function($grid)
	{
		$grid.off("dblclick").on("dblclick", ".k-grid-content table tr", (e) =>
		{
			let $target = $(e.currentTarget),
				$tr = $target.closest("tr"),
				$grid = $tr.closest(".kendo-grid"),
				kendoGrid = $grid.data("kendoGrid"),
				recordId = kendoGrid.dataItem($tr).Id;

			this.onRecordDoubleClick(recordId);
		});
	};

	UDGridRecordGridBlock.prototype.afterDomAttached = function()
	{
		this.initDetailGrid();
	};

	UDGridRecordGridBlock.prototype.initDetailGrid = function()
	{
		let self = this,
			columns = self.gridConfigs.columns,
			hasPermission = self.gridConfigs.checkReadDataPermission();

		/**
		 * show/hide columns functionality needs the data
		 */
		self.$el.data("columns", columns);

		let defaultGridOptions = {
			dataBound: e =>
			{
				let kendoGrid = e.sender,
					$gridElement = kendoGrid.element;
				self._bindMiniGridEvent($gridElement);
				self.onDataBound(e);
				self.noHeightWhenEmpty(kendoGrid);
				let data = kendoGrid.dataSource.data();
				tf.helpers.kendoGridHelper.updateGridFooter($gridElement, data.length, data.length);
			}
		};

		let options = {
			columns: columns,
			dataSource: self.gridConfigs.getDataSource,
			sort: self.options.sort,
			gridOptions: $.extend(defaultGridOptions, hasPermission ? {} : {
				noRecords: {
					template: "You don't have permission to view data."
				}
			})
		};

		self.originalGridOptions = options;

		var grid = tf.helpers.kendoGridHelper.createSimpleGrid(self.$el, options);
		self.grid = grid;
		grid.options.totalCountHidden = options.totalCountHidden;

		function refreshGrid()
		{
			tf.helpers.kendoGridHelper.setGridDataSource(grid, gridConfigs.getDataSource, grid.options);
		}
	};

	/**
	* when noHeightWhenEmpty setting is true, change the grid body height to zero when no record to display
	*/
	UDGridRecordGridBlock.prototype.noHeightWhenEmpty = function(kendoGrid)
	{
		var self = this;
		if (!self.options.noHeightWhenEmpty)
		{
			return;
		}
		var kendoGridElement = kendoGrid.element,
			gridContent = kendoGridElement.find(".k-grid-content"),
			border = "1px solid #eee";
		kendoGridElement.css("border", "none");
		gridContent.css({ "border-left": border, "border-right": border });
		var maxHeight = kendoGridElement.height() - 67;
		if (kendoGrid.dataSource.data().length == 0)
		{
			gridContent.height(0);
		} else
		{
			var height = kendoGrid.dataSource.data().length * 34;
			if (gridContent.find(".k-virtual-scrollable-wrap").width() < gridContent.find("table").width())
			{
				height += 18;
			}
			gridContent.height(Math.min(maxHeight, height));
		}
	};

	UDGridRecordGridBlock.prototype.dispose = function()
	{
		if (this.pubSubSubscriptions)
		{
			this.pubSubSubscriptions.forEach((item) =>
			{
				PubSub.unsubscribe(item);
			});

			this.pubSubSubscriptions = [];
		}

		let kendoGrid = this.$el.find(".kendo-grid").data("kendoGrid");
		if (kendoGrid)
		{
			kendoGrid.destroy();
		}
	};
})();