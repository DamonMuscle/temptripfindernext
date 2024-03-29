(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").MapBlock = MapBlock;

	function MapBlock(options, gridstack)
	{
		var self = this,
			gridType = gridstack.detailView.gridType,
			detailView = gridstack.detailView;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		self.options = options;

		var editModeClass = self.isReadMode() ? "" : "temp-edit",
			detailViewHelper = tf.helpers.detailViewHelper;

		self.uniqueClassName = (options.uniqueClassName || detailViewHelper.generateUniqueClassName()) + detailView.routeState;
		self.$el = $(String.format("\
			<div>\
				<div class='grid-stack-item-content no-padding'>\
					<div class='map-item {0}'>\
						<div class='map' data-bind='template: { name: mapManager.templateUrl, data: mapManager }' style='max-height: 2000px; height: 100%; width: 100%; background: #e1e1e1'>\
						</div>\
					</div>\
				</div>\
			</div>", editModeClass)).addClass(self.uniqueClassName);

		let recordEntity = detailView.recordEntity;
		if (detailView.newCopyContext)
		{
			recordEntity = detailView.newCopyContext.baseEntity;
		}

		var opts = {
			type: gridType,
			mainData: recordEntity,
			routeState: detailView.routeState,
			disable: !self.isReadMode(),
			detailView: detailView,
			thematicInfo: { id: options.thematicId, name: options.thematicName },
			legendStatus: {
				isLegendOpen: options.isLegendOpen,
				legendNameChecked: options.legendNameChecked,
				legendDescriptionChecked: options.legendDescriptionChecked
			},
			showErrorMessage: function(message)
			{
				detailView.pageLevelViewModel.popupErrorMessage(message);
			},
			showMessage: function(message)
			{
				detailView.pageLevelViewModel.popupSuccessMessage(message);
			}
		};
		if (options && options.mapToolOptions)
		{
			opts.mapToolOptions = options.mapToolOptions;
		}

		opts.mapBlockInstance = self;
		var mapManager;
		if (self.isReadMode() && TF.DetailView.BaseCustomGridStackViewModel.MapManagers[gridType])
		{
			mapManager = new TF.DetailView.BaseCustomGridStackViewModel.MapManagers[gridType](opts);
		}
		else
		{
			mapManager = new TF.DataEntry.BaseDataEntryMap(opts);
		}

		self.mapManager = mapManager;

		ko.applyBindings({ mapManager: mapManager }, self.$el[0]);
	};

	MapBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	MapBlock.prototype.dispose = function()
	{
		this.$el && ko.cleanNode(this.$el.find(".map-item>.map")[0]);
		this.mapManager && this.mapManager.dispose();
		tfdispose(this);
	};

	MapBlock.prototype.restoreFullScreen = function()
	{
		this.mapManager && this.mapManager.restore && this.mapManager.restore();
	};
})();