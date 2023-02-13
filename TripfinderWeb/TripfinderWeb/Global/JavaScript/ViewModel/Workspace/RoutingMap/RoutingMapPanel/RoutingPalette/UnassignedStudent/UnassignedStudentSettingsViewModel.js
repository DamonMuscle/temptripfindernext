(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").UnassignedStudentSettingsViewModel = UnassignedStudentSettingsViewModel;

	function UnassignedStudentSettingsViewModel(dataModel)
	{
		var self = this;
		self.dataModel = dataModel;
		self.obAutoRefresh = ko.observable(false);
		self.obNotAutoAssign = ko.observable(true);
		self.obNeedUpdate = ko.observable(false);
		self.obMoChecked = ko.observable(false);
		self.obTuChecked = ko.observable(false);
		self.obWeChecked = ko.observable(false);
		self.obThChecked = ko.observable(false);
		self.obFrChecked = ko.observable(false);
		self.obSaChecked = ko.observable(false);
		self.obSuChecked = ko.observable(false);
		self.obMonToFriChecked = ko.observable(false);

		self._lockWeekDayChange = false;

		self.obAttendingUnAssigned = ko.observable(true);
		self.obAttendingScheduled = ko.observable(false);
		self.obNotAttendingUnAssigned = ko.observable(false);
		self.obNotAttendingScheduled = ko.observable(false);

		self.startDate = ko.observable('');
		self.endDate = ko.observable('');

		self.obAttendingUnAssignedSymbol = ko.observable({});
		self.obAttendingScheduledSymbol = ko.observable({});
		self.obNotAttendingUnassignedSymbol = ko.observable({});
		self.obNotAttendingScheduledSymbol = ko.observable({});
		self.obShowLegend = ko.observable(true);
		self.dataModel.viewModel.isSymbolsChanged = false;

		self.obAttendingUnassignedFilter = ko.observable();
		self.obNotAttendingUnassignedFilter = ko.observable();
		self.obAttendingScheduledFilter = ko.observable();
		self.obNotAttendingScheduledFilter = ko.observable();

		self.obEntityDataModel = ko.observable(dataModel);
	}

	UnassignedStudentSettingsViewModel.prototype.init = function(model, element)
	{
		var self = this;
		self.element = element;

		setTimeout(function()
		{
			self.validationInitialize();
		}, 20);

		self.dataModel.getSetting().then(function(setting)
		{
			self.obAutoRefresh(setting.autoRefresh);
			self.obNotAutoAssign(setting.notAutoAssign);

			var dayCheckList = setting.daysCheckList,
				attendingSchoolCheckList = setting.attendingSchoolCheckList,
				notAttendingSchoolCheckList = setting.notAttendingSchoolCheckList,
				dateRange = setting.dateRange;

			self.obMoChecked(dayCheckList[0]);
			self.obTuChecked(dayCheckList[1]);
			self.obWeChecked(dayCheckList[2]);
			self.obThChecked(dayCheckList[3]);
			self.obFrChecked(dayCheckList[4]);
			self.obSaChecked(dayCheckList[5]);
			self.obSuChecked(dayCheckList[6]);
			self.obMonToFriChecked(dayCheckList[0] && dayCheckList[1] && dayCheckList[2] && dayCheckList[3] && dayCheckList[4]);

			self.obAttendingUnAssigned(attendingSchoolCheckList[0]);
			self.obAttendingScheduled(attendingSchoolCheckList[1]);
			self.obNotAttendingUnAssigned(notAttendingSchoolCheckList[0]);
			self.obNotAttendingScheduled(notAttendingSchoolCheckList[1]);

			self.obAttendingUnAssignedSymbol(setting.attendingUnassignedSymbol);
			self.obAttendingScheduledSymbol(setting.attendingScheduledSymbol);
			self.obNotAttendingUnassignedSymbol(setting.notAttendingUnassignedSymbol);
			self.obNotAttendingScheduledSymbol(setting.notAttendingScheduledSymbol);
			self.obShowLegend(setting.showLegend);

			self.initSymbols();

			self.startDate(dateRange[0]);
			self.endDate(dateRange[1]);

			if (setting.attendingUnassignedFilter && setting.attendingUnassignedFilter)
			{
				self.obAttendingUnassignedFilter(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, {
					WhereClause: setting.attendingUnassignedFilter,
					Name: setting.attendingUnassignedFilterName,
				}));
			}
			if (setting.notAttendingUnassignedFilter && setting.notAttendingUnassignedFilter)
			{
				self.obNotAttendingUnassignedFilter(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, {
					WhereClause: setting.notAttendingUnassignedFilter,
					Name: setting.notAttendingUnassignedFilterName
				}));
			}
			if (setting.attendingScheduledFilter && setting.attendingScheduledFilter)
			{
				self.obAttendingScheduledFilter(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, {
					WhereClause: setting.attendingScheduledFilter,
					Name: setting.attendingScheduledFilterName
				}));
			}
			if (setting.notAttendingScheduledFilter && setting.notAttendingScheduledFilter)
			{
				self.obNotAttendingScheduledFilter(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, {
					WhereClause: setting.notAttendingScheduledFilter,
					Name: setting.notAttendingScheduledFilterName
				}));
			}

			self.obMoChecked.subscribe(self.setWeekdayGroup, self);
			self.obTuChecked.subscribe(self.setWeekdayGroup, self);
			self.obWeChecked.subscribe(self.setWeekdayGroup, self);
			self.obThChecked.subscribe(self.setWeekdayGroup, self);
			self.obFrChecked.subscribe(self.setWeekdayGroup, self);
			self.obMonToFriChecked.subscribe(self.setWeekdayInGroup, self);
		});
	};

	UnassignedStudentSettingsViewModel.prototype.validationInitialize = function()
	{
		var self = this;
		self.validator = $(this.element).bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: {
				endDate: {
					trigger: "blur change",
					validators: {
						callback: {
							message: "",
							callback: function(value)
							{
								if (value != "")
								{
									clearDateTimeAlerts();
									if (self.startDate())
									{
										var startDate = new moment(self.startDate());
										var endDate = new moment(value);
										if (endDate.isBefore(startDate))
										{
											return {
												message: 'Start Date must be <= End Date',
												valid: false
											};
										}
										return true;
									}
								}
								return true;
							}
						}
					}
				},
				startDate: {
					trigger: "blur change",
					validators: {
						callback: {
							message: "",
							callback: function(value)
							{
								if (value != "")
								{
									clearDateTimeAlerts();
									if (self.endDate())
									{
										var endDate = new moment(self.endDate());
										var startDate = new moment(value);
										if (endDate.isBefore(startDate))
										{
											return {
												message: 'Start Date must be <= End Date',
												valid: false
											};
										}
										return true;
									}
								}
								return true;
							}
						}
					}
				}
			}
		}).on('error.validator.bv', function(e, data)
		{
			data.element
				.data('bv.messages')
				.find('.help-block[data-bv-for="' + data.field + '"]').hide()
				.filter('[data-bv-validator="' + data.validator + '"]').show();
		}).on('success.field.bv', function(e, data)
		{
			var $parent = data.element.closest('.form-group');
			$parent.removeClass('has-success');
		}).data("bootstrapValidator");
		function clearDateTimeAlerts()
		{
			$(this.element).find("[name=startDate]").closest('.form-group').find("small[data-bv-validator=callback]").hide();
			$(this.element).find("[name=endDate]").closest('.form-group').find("small[data-bv-validator=callback]").hide();
		}
	};

	UnassignedStudentSettingsViewModel.prototype.apply = function()
	{
		var self = this;
		return this.validator.validate().then(function(valid)
		{
			if (valid)
			{
				var storages = self.dataModel.getStorage();
				self.saveKey(storages.autoRefresh.key, self.obAutoRefresh().toString());
				self.saveKey(storages.notAutoAssign.key, self.obNotAutoAssign().toString());

				self.saveKey(storages.attendingUnassignedSymbol.key, JSON.stringify(self.obAttendingUnAssignedSymbol()));
				self.saveKey(storages.attendingScheduledSymbol.key, JSON.stringify(self.obAttendingScheduledSymbol()));
				self.saveKey(storages.notAttendingUnassignedSymbol.key, JSON.stringify(self.obNotAttendingUnassignedSymbol()));
				self.saveKey(storages.notAttendingScheduledSymbol.key, JSON.stringify(self.obNotAttendingScheduledSymbol()));
				self.saveKey(storages.showLegend.key, self.obShowLegend().toString());

				var dayCheckList = [
					self.obMoChecked(),
					self.obTuChecked(),
					self.obWeChecked(),
					self.obThChecked(),
					self.obFrChecked(),
					self.obSaChecked(),
					self.obSuChecked()
				];
				self.saveKey(storages.daysCheckList.key, dayCheckList);

				var attendingSchoolCheckList = [self.obAttendingUnAssigned(), self.obAttendingScheduled()],
					notAttendingSchoolCheckList = [self.obNotAttendingUnAssigned(), self.obNotAttendingScheduled()];
				self.saveKey(storages.attendingSchoolCheckList.key, attendingSchoolCheckList);
				self.saveKey(storages.notAttendingSchoolCheckList.key, notAttendingSchoolCheckList);

				var dateRange = [self.startDate(), self.endDate()];
				self.saveKey(storages.dateRange.key, dateRange);

				self.saveKey(storages.attendingUnassignedFilter.key, !self.obAttendingUnassignedFilter() ? "" : self.obAttendingUnassignedFilter().whereClause());
				self.saveKey(storages.attendingScheduledFilter.key, !self.obAttendingScheduledFilter() ? "" : self.obAttendingScheduledFilter().whereClause());
				self.saveKey(storages.notAttendingUnassignedFilter.key, !self.obNotAttendingUnassignedFilter() ? "" : self.obNotAttendingUnassignedFilter().whereClause());
				self.saveKey(storages.notAttendingScheduledFilter.key, !self.obNotAttendingScheduledFilter() ? "" : self.obNotAttendingScheduledFilter().whereClause());
				self.saveKey(storages.attendingUnassignedFilterName.key, !self.obAttendingUnassignedFilter() ? "" : self.obAttendingUnassignedFilter().name());
				self.saveKey(storages.attendingScheduledFilterName.key, !self.obAttendingScheduledFilter() ? "" : self.obAttendingScheduledFilter().name());
				self.saveKey(storages.notAttendingUnassignedFilterName.key, !self.obNotAttendingUnassignedFilter() ? "" : self.obNotAttendingUnassignedFilter().name());
				self.saveKey(storages.notAttendingScheduledFilterName.key, !self.obNotAttendingScheduledFilter() ? "" : self.obNotAttendingScheduledFilter().name());

				self.dataModel.currentSettings = self.dataModel.getStorageSetting();
				self.dataModel.settingChangeEvent.notify();
			}
			return valid;
		});
	};

	UnassignedStudentSettingsViewModel.prototype.saveKey = function(key, value, isLocal)
	{
		if (isLocal)
		{
			if (!this.dataModel.settings)
			{
				this.dataModel.settings = {};
			}
			this.dataModel.settings[key] = value;
		} else
		{
			tf.storageManager.save(key, value);
		}
	};

	UnassignedStudentSettingsViewModel.prototype.cancel = function()
	{
		return Promise.resolve(true);
	};

	UnassignedStudentSettingsViewModel.prototype.setWeekdayGroup = function()
	{
		var self = this;
		if (self._lockWeekDayChange === false)
		{
			self._lockWeekDayChange = true;
			if (self.obMoChecked() && self.obTuChecked() && self.obWeChecked() && self.obThChecked() && self.obFrChecked())
			{
				self.obMonToFriChecked(true);
			}
			else
			{
				self.obMonToFriChecked(false);
			}
			self._lockWeekDayChange = false;
		}
	};

	UnassignedStudentSettingsViewModel.prototype.setWeekdayInGroup = function()
	{
		var self = this;
		if (self._lockWeekDayChange === false)
		{
			self._lockWeekDayChange = true;
			if (self.obMonToFriChecked())
			{
				self.obMoChecked(true);
				self.obTuChecked(true);
				self.obWeChecked(true);
				self.obThChecked(true);
				self.obFrChecked(true);
			}
			else
			{
				self.obMoChecked(false);
				self.obTuChecked(false);
				self.obWeChecked(false);
				self.obThChecked(false);
				self.obFrChecked(false);
			}
			self._lockWeekDayChange = false;
		}
	};

	UnassignedStudentSettingsViewModel.prototype.initSymbols = function()
	{
		var self = this,
			$attendingUnassigned = $(this.element).find(".attendingUnassigned"),
			$notAttendingUnassigned = $(this.element).find(".notAttendingUnassigned"),
			$attendingScheduled = $(this.element).find(".attendingScheduled"),
			$notAttendingScheduled = $(this.element).find(".notAttendingScheduled");

		self.initSymbolContainer($attendingUnassigned, self.obAttendingUnAssignedSymbol(), "Attending Unassigned Student");
		self.initSymbolContainer($attendingScheduled, self.obAttendingScheduledSymbol(), "Attending Scheduled Student");
		self.initSymbolContainer($notAttendingUnassigned, self.obNotAttendingUnassignedSymbol(), "Not Attending Unassigned Student");
		self.initSymbolContainer($notAttendingScheduled, self.obNotAttendingScheduledSymbol(), "Not Attending Scheduled Student");
	};

	UnassignedStudentSettingsViewModel.prototype.initSymbolContainer = function(container, displaySetting, label)
	{
		var self = this, symbolString = self.GetSymbolString(displaySetting);
		container.append("<div class='display-container'>" + symbolString + "</div>");
		var displayContainer = container.find(".display-container")
		displayContainer.on("click", self.displayClicked.bind(self));
		displayContainer.data("label", label);
		displayContainer.data("displaySetting", displaySetting)
	};

	UnassignedStudentSettingsViewModel.prototype.displayClicked = function(e)
	{
		var self = this, $container = $(e.target).closest(".display-container"), label = $container.data("label"), displaySetting = $container.data("displaySetting");
		var displayDetail = {
			symbol: displaySetting.symbol,
			size: displaySetting.size,
			color: displaySetting.color,
			name: label,
			borderishow: displaySetting.borderishow,
			bordersize: displaySetting.bordersize,
			bordercolor: displaySetting.bordercolor

		};
		tf.modalManager.showModal(new TF.Modal.AdjustValueDisplayModalViewModel(displayDetail)).then(function(result)
		{
			if (result)
			{
				self.updateDisplayContainer($container, result);
				self.saveDisplay($container.data("label"), result)
				if (result.changed)
				{
					self.dataModel.viewModel.isSymbolsChanged = true;
				}
			}
		});
	};
	UnassignedStudentSettingsViewModel.prototype.saveDisplay = function(label, setting)
	{
		var self = this;
		switch (label)
		{
			case "Attending Unassigned Student":
				self.obAttendingUnAssignedSymbol(setting);
				break;
			case "Attending Scheduled Student":
				self.obAttendingScheduledSymbol(setting);
				break;
			case "Not Attending Unassigned Student":
				self.obNotAttendingUnassignedSymbol(setting);
				break;
			case "Not Attending Scheduled Student":
				self.obNotAttendingScheduledSymbol(setting);
				break;
			default:
				break;
		}
	};

	UnassignedStudentSettingsViewModel.prototype.updateDisplayContainer = function($container, setting)
	{
		var self = this, symbolString;

		if (setting)
		{
			$container.empty();
			symbolString = self.GetSymbolString(setting);
			$container.append(symbolString);
			$container.data("displaySetting", setting);
		}
	};

	UnassignedStudentSettingsViewModel.prototype.GetSymbolString = function(setting)
	{
		var borderColor, borderSize, maxdisplaySize = 24;
		if (setting.borderishow)
		{
			borderColor = setting.bordercolor;
			borderSize = setting.bordersize;
		}
		var symbolString = TF.Helper.AdjustValueSymbolHelper.getSVGSymbolString(setting.symbol, setting.color, setting.size, borderColor, borderSize, maxdisplaySize);
		symbolString = symbolString.replace("<svg", "<svg class='display'");
		return symbolString;
	}

})();