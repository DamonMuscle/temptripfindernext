(function()
{
	createNamespace('TF.Control').EditFieldTripAccountRecordViewModel = EditFieldTripAccountRecordViewModel;

	function EditFieldTripAccountRecordViewModel(configType, recordEntity)
	{
		var self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);

		self.dataHelper = tf.fieldTripConfigsDataHelper;

		self.normalizeDate();
		self.initDropDownList();
		self.initSchool();
		self.initDepartment();
		self.initFieldTripActivity();
		self.initDateControls();
	}
	EditFieldTripAccountRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripAccountRecordViewModel.prototype.constructor = EditFieldTripAccountRecordViewModel;

	EditFieldTripAccountRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this,
			entity = $.extend({}, self.obEntityDataModel().toData(), { Id: self.obRecordId() }),
			fromDate = moment($("input[name='activeFromDate']").val()),
			toDate = moment($("input[name='activeToDate']").val());

		entity.ActiveFromDate = fromDate.isValid() ? fromDate.format("YYYY-MM-DDT00:00:00") : null;
		entity.ActiveToDate = toDate.isValid() ? toDate.format("YYYY-MM-DDT00:00:00") : null;

		return entity;
	}
	EditFieldTripAccountRecordViewModel.prototype.updateValidatorFields = function(validatorFields)
	{
		validatorFields.activeToDate = {
			trigger: "change blur",
			validators: {
				callback: {
					message: "Invalid Date",
					callback: function(value)
					{
						var date = new moment(value);
						return !value || date.isValid();
					}
				}
			}
		}

		validatorFields.activeFromDate = {
			trigger: "change blur",
			validators: {
				callback: {
					message: "Invalid Date",
					callback: function(value)
					{
						var date = new moment(value);
						return !value || date.isValid();
					}
				}
			}
		}
	}

	EditFieldTripAccountRecordViewModel.prototype.initDropDownList = function()
	{
		var self = this;
		self.obFieldTripActivity = ko.observableArray();
		self.obSchool = ko.observableArray();
		self.obDepartment = ko.observableArray();
		//drop down list
		self.obSelectedSchool = ko.observable();
		self.obSelectedSchool.subscribe(
			TF.Helper.DropDownMenuHelper.setSelectValue(
				self,
				"school",
				"obSelectedSchool",
				function(obj) { return obj ? obj.School : ""; })
			, self);
		self.obSelectedSchoolText = ko.observable();

		self.obSelectedDepartment = ko.observable();
		self.obSelectedDepartment.subscribe(
			TF.Helper.DropDownMenuHelper.setSelectValue(
				self,
				"departmentId",
				"obSelectedDepartment",
				function(obj) { return obj ? obj.Id : 0; })
			, self);
		self.obSelectedDepartmentText = ko.observable();

		self.obSelectedActivity = ko.observable();
		self.obSelectedActivity.subscribe(
			TF.Helper.DropDownMenuHelper.setSelectValue(
				self,
				"fieldTripActivityId",
				"obSelectedActivity",
				function(obj) { return obj ? obj.Id : 0; })
			, self);
		self.obSelectedActivityText = ko.observable();
	}

	EditFieldTripAccountRecordViewModel.prototype.initSchool = function()
	{
		var self = this;
		tf.ajax.post(pathCombine(tf.api.apiPrefix(), 'search', 'schools'), {
			data: {
				fields: ['Name', 'School']
			}
		}).then(function(result)
		{
			var schoolCode = self.obEntityDataModel().school();

			self.obSchool([{ Name: null, School: null }].concat(result.Items));

			if (schoolCode !== null)
			{
				var schools = result.Items.filter(function(a)
				{
					return a.School == schoolCode;
				});
				if (schools && schools.length == 1)
				{
					self.obSelectedSchool(schools[0]);
					self.obSelectedSchoolText(schools[0].Name + '(' + schools[0].School + ')');
					return;
				}
			}

			//In pro, if the related school has been deleted, the school will show None
			self.obSelectedSchool({ Name: null, School: null });
			self.obSelectedSchoolText('None');
		})
	}

	EditFieldTripAccountRecordViewModel.prototype.initDepartment = function()
	{
		var self = this;
		return self.dataHelper.getAllConfigRecordsByType('dep')
			.then(function(result)
			{
				var departmentId = self.obEntityDataModel().departmentId();

				self.obDepartment([{ Id: null, Name: 'Any' }].concat(result));//RW-18234 change "None" to "Any"
				if (departmentId !== null)
				{
					var department = result.find(function(a)
					{
						return a.Id == departmentId;
					});
					if (department)
					{
						self.obSelectedDepartment(department);
						self.obSelectedDepartmentText(department.Name);
					}
				} else
				{
					//In pro, if the related district department has been deleted, the department will show None
					self.obSelectedDepartment({ Id: null, Name: 'Any' });//RW-18234 change "None" to "Any"
					self.obSelectedDepartmentText('Any');//RW-18234 change "None" to "Any"
				}
			});
	}

	EditFieldTripAccountRecordViewModel.prototype.initFieldTripActivity = function()
	{
		var self = this;
		return self.dataHelper.getAllConfigRecordsByType('act')
			.then(function(result)
			{
				var activityId = self.obEntityDataModel().fieldTripActivityId();
				self.obFieldTripActivity([{ Id: null, Name: 'Any' }].concat(result));//RW-18234 change "None" to "Any"

				if (activityId !== null)
				{
					var activity = result.filter(function(a)
					{
						return a.Id == activityId;
					});
					if (activity && activity.length == 1)
					{
						self.obSelectedActivity(activity[0]);
						self.obSelectedActivityText(activity[0].Name);
					}
				} else
				{
					//In pro, if the related activity has been deleted, the activity will show None
					self.obSelectedActivity({ Id: null, Name: 'Any' });//RW-18234 change "None" to "Any"
					self.obSelectedActivityText('Any');//RW-18234 change "None" to "Any"
				}
			});
	}

	/**
	 * Once activeFromDate change, the activeToDate will copy, as a result, the validation of activeToDate will trigger.
	 *  */
	EditFieldTripAccountRecordViewModel.prototype.initDateControls = function()
	{
		var self = this;
		self.obEntityDataModel().activeFromDate
			.subscribe(function(value)
			{
				if (!value || value == 'Invalid date')
				{
					self.obEntityDataModel().activeFromDate(null);
				}
				else
				{
					var newDateValue = moment(value).format("MM/DD/YYYY");

					self.obEntityDataModel().activeFromDate(newDateValue);
					if (!self.validateFromToDate(newDateValue, null))
					{
						self.obEntityDataModel().activeToDate(newDateValue);
					}
				}
			});

		self.obEntityDataModel().activeToDate
			.subscribe(function(value)
			{
				if (!value || value == 'Invalid date')
				{
					self.obEntityDataModel().activeToDate(null);
				}
				else
				{
					var newDateValue = moment(value).format("MM/DD/YYYY");

					self.obEntityDataModel().activeToDate(newDateValue);
					if (!self.validateFromToDate(null, newDateValue))
					{
						self.obEntityDataModel().activeFromDate(newDateValue);
					}
				}
			});
	}

	EditFieldTripAccountRecordViewModel.prototype.validateFromToDate = function(startDate, endDate)
	{
		var self = this,
			startDate = startDate || self.obEntityDataModel().activeFromDate(),
			endDate = endDate || self.obEntityDataModel().activeToDate();

		if (!startDate || !endDate) return true;

		return moment(endDate).isAfter(moment(startDate));
	};

	EditFieldTripAccountRecordViewModel.prototype.normalizeDate = function()
	{
		var self = this,
			startDate = self.obEntityDataModel().activeFromDate(),
			endDate = self.obEntityDataModel().activeToDate();
		self.obEntityDataModel().activeFromDate(normalizeDateString(startDate));
		self.obEntityDataModel().activeToDate(normalizeDateString(endDate));
	}

	function normalizeDateString(dateStr)
	{
		var date = new moment(dateStr);
		if (date && date.isValid())
		{
			return date.format("YYYY-MM-DD") + "T00:00:00";
		} else
		{
			return null;
		}
	}
})()

