(function()
{
	createNamespace("TF.RoutingMap.MapEditingPalette").MunicipalBoundarySettingsViewModel = MunicipalBoundarySettingsViewModel;

	function MunicipalBoundarySettingsViewModel(municipalBoundaryViewModel, type)
	{
		this.municipalBoundaryViewModel = municipalBoundaryViewModel;
		this.dataModel = municipalBoundaryViewModel.dataModel;
		this.obAutoRefresh = ko.observable(false);
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.defaults = {
			autoRefresh: false,
			moveDuplicateNode: false,
			removeOverlapMunicipalBoundary: false
		}
	};

	MunicipalBoundarySettingsViewModel.prototype.init = function(viewModel, e)
	{
		var self = this;
		self.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obMoveDuplicateNodes(setting.moveDuplicateNode);
			self.obRemoveOverlapping(setting.removeOverlapping);
		})
	};

	MunicipalBoundarySettingsViewModel.prototype.getSetting = function(viewModel, e)
	{
		return this.dataModel.getMunicipalBoundarySetting();
	};

	MunicipalBoundarySettingsViewModel.prototype.getStorageKey = function(viewModel, e)
	{
		return this.dataModel.getMunicipalBoundaryStorageKey();
	};

	MunicipalBoundarySettingsViewModel.prototype.apply = function()
	{
		var self = this;
		var storageKey = self.getStorageKey();

		//set the last change of auto refresh
		tf.storageManager.save(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		tf.storageManager.save(storageKey.moveDuplicateNodeStorageKey, self.obMoveDuplicateNodes().toString());
		tf.storageManager.save(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.autoRefreshStorageKey, self.obAutoRefresh().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.moveDuplicateNodeStorageKey, self.obMoveDuplicateNodes().toString());
		// tf.storageManager.saveOnCurrentDocument(storageKey.removeOverlappingStorageKey, self.obRemoveOverlapping().toString());

		//PubSub.publish(topicCombine(pb.DATA_CHANGE, "municipalboundarysetting", pb.EDIT));
		self.dataModel.onSettingChangeEvent.notify();
		return Promise.resolve(true);
	};

	MunicipalBoundarySettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

})();