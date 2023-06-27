(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NonEligibleZoneEditModal = NonEligibleZoneEditModal;

	function NonEligibleZoneEditModal(viewModel)
	{
		TF.RoutingMap.BaseEditModal.call(this, {
			routingMapDocumentViewModel: viewModel._viewModal,
			template: "workspace/RoutingMap/RoutingMapPanel/RoutingPalette/NonEligibleZoneEditModal"
		});
		this.obDataModel = this.createObservableDataModel(this.getDataModel());
		this.viewModel = viewModel;
		this.dataModel = viewModel.dataModel;
		this.isReadOnly = ko.observable(true);
		this.dataModel.highlightChangedEvent.subscribe(this.onHighLightChangedEvent.bind(this));
	}

	NonEligibleZoneEditModal.prototype = Object.create(TF.RoutingMap.BaseEditModal.prototype);
	NonEligibleZoneEditModal.prototype.constructor = NonEligibleZoneEditModal;

	NonEligibleZoneEditModal.prototype.init = function()
	{
		return Promise.resolve();
	};

	NonEligibleZoneEditModal.prototype.getDataModel = function()
	{
		var mapping = (new TF.DataModel.SchoolNonEligibleDataModel()).getMapping();
		var data = {};
		for (var i = 0; i < mapping.length; i++)
		{
			var item = mapping[i];
			data[item.from] = item.default;
		}
		return data;
	};

	/**
	* this is the enter to open edit boundary modal
	*/
	NonEligibleZoneEditModal.prototype.showEditModal = function(editData)
	{
		var self = this;

		self.obOverlayVisible(false);
		var dataPromise;
		if (editData)
		{
			dataPromise = Promise.resolve(editData);
		} else
		{
			dataPromise = self.getAllHighlight();
		}
		dataPromise.then(function(data)
		{
			if (!data || data.length === 0)
			{
				return Promise.resolve();
			}
			self.initing = true;
			self.normalizeData(data);
			self.init().then(function()
			{
				self.initTitle(false);
				self.show();
				self.showCurrentData();
				self.initing = false;
			});
		});
	};

	NonEligibleZoneEditModal.prototype.getAllHighlight = function()
	{
		return Promise.resolve(this.dataModel.highlighted);
	};

	NonEligibleZoneEditModal.prototype.unSaveCheck = function()
	{
		return Promise.resolve();
	};

	NonEligibleZoneEditModal.prototype.showCurrentData = function()
	{
		var self = this;
		var data = this.data[this.obCurrentPage()];
		if (!data)
		{
			return;
		}
		for (var key in self.obDataModel)
		{
			if (ko.isObservable(self.obDataModel[key]))
			{
				self.obDataModel[key](data[key]);
			}
		}
		self.obShowPaging(self.data.length > 1);
	};

	NonEligibleZoneEditModal.prototype.initTitle = function(isNew)
	{
		var mode = isNew ? "New" : "Edit";
		this.mode(mode.toLowerCase());
		if (this.data.length > 1)
		{
			this.obTitle(" Non Eligible Zones (" + this.data.length + ")");
		} else
		{
			this.obTitle(" Non Eligible Zone");
		}
	};

	NonEligibleZoneEditModal.prototype.applyClick = function(modal, e)
	{
		this.cancelClick(modal, e);
	};

	NonEligibleZoneEditModal.prototype.cancelClick = function(modal, e)
	{
		e.stopPropagation();
		var self = this;
		self.hide();
		self.resolve();
	};

	NonEligibleZoneEditModal.prototype.focusGeometry = function()
	{
		this.viewModel.drawTool.glowAndVisibleGeometries([this.data[this.obCurrentPage()].geometry]);
	};

	NonEligibleZoneEditModal.prototype.draggable = function()
	{
		TF.RoutingMap.BaseEditModal.prototype.draggable.call(this, ".resizable-doc");
	};

})();