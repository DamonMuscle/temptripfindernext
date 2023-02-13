(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").NonEligibleZoneEventsManager = NonEligibleZoneEventsManager;

	function NonEligibleZoneEventsManager(viewModel)
	{
		TF.DataEntry.SchoolDataEntryNonEligibleEventsManager.call(this, viewModel);
	}

	NonEligibleZoneEventsManager.prototype = Object.create(TF.DataEntry.SchoolDataEntryNonEligibleEventsManager.prototype);
	NonEligibleZoneEventsManager.prototype.constructor = NonEligibleZoneEventsManager;

	NonEligibleZoneEventsManager.prototype.infoClick = function(item)
	{
		PubSub.publish("clear_ContextMenu_Operation");
		var self = this;
		self._viewModal.setMode("NonEligible", "Normal");
		self.viewModel.editModal.showEditModal(item && item.id ? [item] : this.dataModel.highlighted);
	};

	NonEligibleZoneEventsManager.prototype.settingClick = function()
	{
		tf.modalManager.showModal(new TF.DataEntry.SchoolDataEntryNonEligibleSettingsModalViewModel(this.dataModel, { isEditMode: false }));
	};

})();