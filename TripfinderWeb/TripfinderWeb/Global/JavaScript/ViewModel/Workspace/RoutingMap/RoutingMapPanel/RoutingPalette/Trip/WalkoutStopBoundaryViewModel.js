(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").WalkoutStopBoundaryViewModel = WalkoutStopBoundaryViewModel;

	function WalkoutStopBoundaryViewModel(stop, viewModel)
	{
		TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.call(this, viewModel.viewModel, "");
		this.dataModel = viewModel.dataModel;
		this.tripStop = stop;
		this.updateWalkoutZone = this.updateWalkoutZone.bind(this);
		this.walkoutZone = null;
		this.symbol = new TF.Map.Symbol();
	}

	WalkoutStopBoundaryViewModel.prototype = Object.create(TF.RoutingMap.RoutingPalette.BaseTripStopEditModal.prototype);
	WalkoutStopBoundaryViewModel.prototype.constructor = WalkoutStopBoundaryViewModel;

	WalkoutStopBoundaryViewModel.prototype.init = function(model, el)
	{
		this.element = el;
		this.walkoutDistance(this.tripStop.walkoutDistance || this.walkoutDistance());
		this.walkoutBuffer(this.tripStop.walkoutBuffer || this.walkoutBuffer());
		this.obSelectedDistanceUnit(this.tripStop.distanceUnit || this.obSelectedDistanceUnit());
		this.obSelectedBufferUnit(this.tripStop.bufferUnit || this.obSelectedBufferUnit());

		this.obSelectedDistanceUnit.subscribe(this.updateWalkoutZone);
		this.walkoutType.subscribe(this.updateWalkoutZone);
		this.walkoutDistance.subscribe(this.updateWalkoutZone);
		this.walkoutBuffer.subscribe(this.updateWalkoutZone);
		this.obSelectedBufferUnit.subscribe(this.updateWalkoutZone);
		this.updateWalkoutZone();

		this.data = [this.tripStop];
		this.initValidation();
	};

	WalkoutStopBoundaryViewModel.prototype.getDataModel = function()
	{
		return this.dataModel.tripStopDataModel.getDataModel();
	};

	WalkoutStopBoundaryViewModel.prototype.updateWalkoutZone = function()
	{
		var self = this;
		tf.loadingIndicator.show();
		return self.validate().then(function(valid)
		{
			if (!valid)
			{
				tf.loadingIndicator.tryHide();
				return false;
			}
			return self.walkoutPromise().then(function(result)
			{
				tf.loadingIndicator.tryHide();
				if (!self.isCancel)
				{
					result.walkoutZone.symbol = self.symbol.drawPolygonSymbol();

					self.viewModel.drawTool._tempWalkoutRedrawLayer.removeAll();
					self.viewModel.drawTool._tempWalkoutRedrawLayer.add(result.walkoutZone);
					self.walkoutZone = result.walkoutZone;
				}
			});
		})
	};

	WalkoutStopBoundaryViewModel.prototype.walkoutPromise = function()
	{
		return this.dataModel.viewModel.drawTool.stopTool.generateWalkoutZone(
			this.tripStop,
			this.walkoutDistance(),
			this.obSelectedDistanceUnit(),
			this.walkoutBuffer(),
			this.obSelectedBufferUnit(),
			this.walkoutType(),
			null,
			true);
	};

	WalkoutStopBoundaryViewModel.prototype.validate = function()
	{
		var self = this;
		if ($(self.element).data("bootstrapValidator"))
		{
			return $(self.element).data("bootstrapValidator").validate().then(function(valid)
			{
				return Promise.resolve(valid);
			})
		} else
		{
			return Promise.resolve(true);
		}
	}

	WalkoutStopBoundaryViewModel.prototype.apply = function()
	{
		var self = this;
		tf.loadingIndicator.show();
		return self.validate().then(function(valid)
		{
			if (!valid)
			{
				tf.loadingIndicator.tryHide();
				return false;
			}

			self.isCancel = true;
			return self.walkoutPromise().then(function(result)
			{
				tf.loadingIndicator.tryHide();
				self.bindWalkOutData();
				return result.walkoutZone;
			});
		});
	};

	WalkoutStopBoundaryViewModel.prototype.cancel = function()
	{
		this.isCancel = true;
		return Promise.resolve(true);
	};

})();