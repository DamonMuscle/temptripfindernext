(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingSettingViewModel = RoutingSettingViewModel;

	function RoutingSettingViewModel(dataModel, routeState)
	{
		this.dataModel = dataModel;
		this.routeState = routeState;
		this.obMoveDuplicateNodes = ko.observable(false);
		this.obRemoveOverlapping = ko.observable(false);
		this.obSmartSequence = ko.observable(false);
		this.obFillPattern = ko.observable("Semi");
		this.obUTurnPolicy = ko.observable(this.UTurnPolicy.Allowed);
		this.ObImpedanceAttr = ko.observable("Time");
		this.obPathThickness = ko.observable(5);
		this.obBoundaryThickness = ko.observable(5);
		this.obBoundaryLineStyle = ko.observable("solid");
		this.obShowAssignedStudents = ko.observable(true);
		this.obShowAssignedStudentsCount = ko.observable(false);
		this.obGeoLink = ko.observable(false);
		this.obAutoRefresh = ko.observable(false);
		this.labelSetting = dataModel.viewModel.viewModel.tripStopLabelSetting;
		this.obCountLabelColor = ko.observable("#FFCC33");
		this.obArrowPosition = ko.observable();
		this.obAvgSpeed = ko.observable();
		this.obSpeedType = ko.observable();
		this.isImperialUnit = tf.measurementUnitConverter.isImperial();
	}

	RoutingSettingViewModel.prototype.init = function()
	{
		var self = this;
		this.dataModel.getSetting().then(function(setting)
		{
			self.setValue(setting);
		});
		this.avgSpeedNotEmpty();
	};

	RoutingSettingViewModel.prototype.setValue = function(setting)
	{
		var self = this;
		self.obAutoRefresh(setting.autoRefresh);
		self.obMoveDuplicateNodes(setting.moveDuplicateNodes);
		self.obRemoveOverlapping(setting.removeOverlapping);
		self.obSmartSequence(setting.smartSequence);
		self.obFillPattern(setting.fillPattern);
		self.obUTurnPolicy(setting.uTurnPolicy);
		self.ObImpedanceAttr(setting.impedanceAttribute);
		self.obPathThickness(setting.pathThickness);
		self.obBoundaryThickness(setting.boundaryThickness);
		self.obBoundaryLineStyle(setting.boundaryLineStyle);
		self.obShowAssignedStudents(setting.showAssignedStudents);
		self.obShowAssignedStudentsCount(setting.showAssignedStudentsCount);
		self.obCountLabelColor(setting.studentCountLabelColor);
		self.obArrowPosition(setting.arrowPosition);
		self.obGeoLink(setting.geoLink);
		// convert imperial unit for displaying
		if (self.isImperialUnit) {
			 self.obAvgSpeed(tf.measurementUnitConverter.convert({
				value: setting.avgSpeed,
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial
			}));
		}
		else
		{
			self.obAvgSpeed(setting.avgSpeed);
		}
		self.obSpeedType(setting.speedType);
		// self.labelSetting.obShowLabel(setting.showLabel);
	};

	RoutingSettingViewModel.prototype.avgSpeedNotEmpty = function()
	{
		var oldSpeedValue;
		this.obAvgSpeed.subscribe((oldValue) =>
		{
			if (oldValue)
			{
				oldSpeedValue = oldValue;
			}
		}, null, "beforeChange");

		this.obAvgSpeed.subscribe((newValue) =>
		{
			if (!newValue)
			{
				this.obAvgSpeed(oldSpeedValue);
			}
		});
	};

	RoutingSettingViewModel.prototype.UTurnPolicy = {
		Allowed: 0,
		AllowedOnlyatDeadEnds: 1,
		AllowedOnlyatIntersectionsandDeadEnds: 2,
		NotAllowed: 3
	};

	RoutingSettingViewModel.prototype.apply = function()
	{
		var self = this;
		var storages = this.dataModel.getStorage();
		self.saveKey(storages.autoRefresh.key, self.obAutoRefresh().toString());
		self.saveKey(storages.moveDuplicateNodes.key, self.obMoveDuplicateNodes().toString());
		self.saveKey(storages.removeOverlapping.key, self.obRemoveOverlapping().toString());
		self.saveKey(storages.smartSequence.key, self.obSmartSequence().toString());
		self.saveKey(storages.fillPattern.key, self.obFillPattern().toString());
		self.saveKey(storages.uTurnPolicy.key, self.obUTurnPolicy().toString());
		self.saveKey(storages.impedanceAttribute.key, self.ObImpedanceAttr().toString());
		self.saveKey(storages.pathThickness.key, self.obPathThickness().toString());
		self.saveKey(storages.boundaryThickness.key, self.obBoundaryThickness().toString());
		self.saveKey(storages.boundaryLineStyle.key, self.obBoundaryLineStyle().toString());
		self.saveKey(storages.showAssignedStudents.key, self.obShowAssignedStudents().toString());
		self.saveKey(storages.arrowPosition.key, self.obArrowPosition().toString());
		self.saveKey(storages.showAssignedStudentsCount.key, self.obShowAssignedStudentsCount().toString());
		self.saveKey(storages.studentCountLabelColor.key, self.obCountLabelColor().toString());
		// self.saveKey(storages.showLabel.key, self.labelSetting.obShowLabel().toString());
		self.saveKey(storages.geoLink.key, self.obGeoLink().toString());
		if (self.isImperialUnit)
		{
			self.saveKey(storages.avgSpeed.key, tf.measurementUnitConverter.convert({
				value: parseFloat(self.obAvgSpeed()),
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric
			}));
		}
		else
		{
			self.saveKey(storages.avgSpeed.key, self.obAvgSpeed().toString());
		}
		self.saveKey(storages.speedType.key, self.obSpeedType().toString());
		self.dataModel.onSettingChangeEvent.notify();
		self.labelSetting.refreshMapLayerLabels(self.labelSetting.newOptions);
		return Promise.resolve(true);
	};

	RoutingSettingViewModel.prototype.saveKey = function(key, value)
	{
		tf.storageManager.save(key, value);
	};

	RoutingSettingViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

	RoutingSettingViewModel.prototype.default = function()
	{
		var storages = this.dataModel.getStorage();
		var setting = {};
		for (var key in storages)
		{
			var defaults = storages[key].default;
			setting[key] = defaults;
		}
		this.setValue(setting);
	};
})();