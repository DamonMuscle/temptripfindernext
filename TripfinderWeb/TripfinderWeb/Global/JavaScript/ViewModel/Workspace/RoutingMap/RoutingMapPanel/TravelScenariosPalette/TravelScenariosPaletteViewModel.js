(function()
{
	createNamespace("TF.RoutingMap").TravelScenariosPaletteViewModel = TravelScenariosPaletteViewModel;
	function TravelScenariosPaletteViewModel(viewModal, isOpen, routeState)
	{
		TF.RoutingMap.BasePaletteViewModel.call(this, viewModal, isOpen, routeState);
		this.type = "travelScenario";
		this.title = "Travel Scenarios";
		this.isOpen = !!isOpen;
		this.templateName = "workspace/RoutingMap/RoutingMapPanel/TravelScenariosPalette/TravelScenariosPalette";
		this.$element = null;
		this.isEyeVisible(true);
		this.isShowMode(true);
		this.eyeTitle("Travel Scenarios");
		this.mode = "Normal";
		this.travelScenariosViewModel = new TF.RoutingMap.TravelScenariosPalette.TravelScenariosViewModel(this, true, routeState);
		this.travelRegionsViewModel = new TF.RoutingMap.TravelScenariosPalette.TravelRegionsViewModel(this, true, routeState);

		this.mapCanvasPage.onMapLoad.subscribe(this._onMapLoad.bind(this));
	}

	TravelScenariosPaletteViewModel.prototype = Object.create(TF.RoutingMap.BasePaletteViewModel.prototype);
	TravelScenariosPaletteViewModel.prototype.constructor = TravelScenariosPaletteViewModel;

	TravelScenariosPaletteViewModel.prototype.init = function(viewModal, e)
	{
		this.$element = $(e);
	};

	TravelScenariosPaletteViewModel.prototype._onMapLoad = function()
	{
		this.obShow() && this.addShowCount();
		this.travelRegionsViewModel.init();
		this.travelScenariosViewModel.init();
	};

	TravelScenariosPaletteViewModel.prototype.show = function()
	{
		this.addShowCount();
		this.travelRegionsViewModel.show();
		this.travelScenariosViewModel.show();
		return Promise.resolve(true);
	};

	TravelScenariosPaletteViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var isShowMode = !this.isShowMode();
		this.travelRegionsViewModel.isShowMode(isShowMode);
		this.isShowMode(isShowMode);
	};

	TravelScenariosPaletteViewModel.prototype.showChange = function()
	{
		this.isShowMode(this.travelRegionsViewModel.isShowMode());
	};

	TravelScenariosPaletteViewModel.prototype.unSaveCheck = function(openingName, isRevert)
	{
		var viewModels = [{
			unSaveCheck: this.travelRegionsViewModel.unSaveCheck.bind(this.travelRegionsViewModel),
			save: this.travelRegionsViewModel.dataModel.saveTravelRegion.bind(this.travelRegionsViewModel.dataModel),
			revert: this.travelRegionsViewModel.dataModel.revertTravelRegionAfterUnSaveChange.bind(this.travelRegionsViewModel.dataModel),
			close: this.travelRegionsViewModel.close.bind(this.travelRegionsViewModel),
			lockConfirm: true
		}, {
			unSaveCheck: this.travelScenariosViewModel.unSaveCheck.bind(this.travelScenariosViewModel),
			save: this.travelScenariosViewModel.save.bind(this.travelScenariosViewModel),
			revert: this.travelScenariosViewModel.revert.bind(this.travelScenariosViewModel),
			close: this.travelScenariosViewModel.close.bind(this.travelScenariosViewModel),
			lockConfirm: true
		}];
		return this._multiViewUnSaveCheck(openingName, viewModels, isRevert);
	};

	TravelScenariosPaletteViewModel.prototype.checkWithLockConfirm = function()
	{
		return this.mapCanvasPage.mapEditingPaletteViewModel.checkRelateStreetScenarioChanged().then((ans) =>
		{
			if (ans)
			{
				return this._checkLock();
			}
			return ans;
		});
	};

	// TODO, it still update for RW-14828
	TravelScenariosPaletteViewModel.prototype._checkLock = function()
	{
		let self = this;
		return self.travelScenariosViewModel.IsLock().then(lockedByInfo =>
		{
			if (lockedByInfo)
			{
				return tf.promiseBootbox.yesNo((lockedByInfo.UserId != tf.authManager.authorizationInfo.authorizationTree.userId ? lockedByInfo.UserName + " is" : "you are") + " approving travelScenarios and services are occupied. You will lost unsaved changes, are you sure you want to change travelScenario?", "Unsaved Changes")
					.then(function(result)
					{
						if (result == null)
						{
							return null;
						}

						if (result)
						{
							return false;
						} else if (result == false)
						{
							return null;
						}
						return result === true ? null : result === false ? null : false;
					});
			}
			else
			{
				return Promise.resolve(true);
			}
		});
	};

	TravelScenariosPaletteViewModel.prototype.close = function()
	{
		this.minusShowCount();
		this.travelScenariosViewModel.close();
		this.travelRegionsViewModel.close();
		return Promise.resolve(true);
	};

	TravelScenariosPaletteViewModel.prototype.dispose = function()
	{
		this.travelScenariosViewModel.dispose();
		this.travelRegionsViewModel.dispose();
	};
})();