(function()
{
	createNamespace('TF.Control').EditFieldTripStatusViewModel = EditFieldTripStatusViewModel;

	var allFieldTripStatusMap = {};
	allFieldTripStatusMap[TF.FieldTripStageEnum.level1RequestSubmitted] = { id: 1, name: "Level 1 - Request Submitted", isApprove: true };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level2RequestDeclined] = { id: 2, name: "Level 2 - Request Declined", isApprove: false };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level2RequestApproved] = { id: 3, name: "Level 2 - Request Approved", isApprove: true };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level3RequestDeclined] = { id: 4, name: "Level 3 - Request Declined", isApprove: false };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level3RequestApproved] = { id: 5, name: "Level 3 - Request Approved", isApprove: true };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level4RequestDeclined] = { id: 6, name: "Level 4 - Request Declined", isApprove: false };
	allFieldTripStatusMap[TF.FieldTripStageEnum.level4RequestApproved] = { id: 7, name: "Level 4 - Request Approved", isApprove: true };
	allFieldTripStatusMap[TF.FieldTripStageEnum.DeclinedByTransportation] = { id: 98, name: "Declined by Transportation", isApprove: false };
	allFieldTripStatusMap[TF.FieldTripStageEnum.TransportationApproved] = { id: 99, name: "Transportation Approved", isApprove: true };
	allFieldTripStatusMap[TF.FieldTripStageEnum.RequestCanceled] = { id: 100, name: "Canceled - Request Canceled", isApprove: false };
	allFieldTripStatusMap[TF.FieldTripStageEnum.RequestCompleted] = { id: 101, name: "Completed - Request Completed", isApprove: true };

	function EditFieldTripStatusViewModel(selectedRecords, isCancel)
	{
		var self = this;
		self.obComments = ko.observable("");
		self.placehoder = selectedRecords.length > 1 ? "Add comments to all " + tf.applicationTerm.getApplicationTermPluralByName("Trip") + "..." : "Add comments here...";
		self.$form = null;
		self.selectedRecords = selectedRecords;
		self.fieldTripIds = selectedRecords.map(function(item) { return item.Id; });
		self.isCancel = isCancel;
		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		self.fieldTripStatus = $.map(TF.FieldTripAuthHelper.getAccessableStageIds(), function(item)
		{
			return allFieldTripStatusMap[item];
		});

		//drop down list
		self.obFieldTripStatus = ko.observableArray(self.fieldTripStatus);
		self.obSelectedStatusId = ko.observable();
		self.obSelectedStatus = ko.observable();
		self.obSelectedStatus.subscribe(self.setStatusValue, self);
		self.obSelectedStatusText = ko.computed(self.setStatusTextComputer, self);

		if (self.selectedRecords.length > 0)
		{
			self.obSelectedStatusId(self.selectedRecords[0].FieldTripStageId || 1);
		}
		else
		{
			self.obSelectedStatusId(1);
		}

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	EditFieldTripStatusViewModel.prototype.setStatusValue = function()
	{
		var self = this;
		if (self.obSelectedStatus())
		{
			self.obSelectedStatusId(self.obSelectedStatus().id);
		}
	};

	EditFieldTripStatusViewModel.prototype.setStatusTextComputer = function()
	{
		var self = this;
		var item = Enumerable.From(self.obFieldTripStatus()).Where(function(c)
		{
			return c.id === self.obSelectedStatusId();
		}).ToArray()[0];
		return item ? item.name : "";
	};

	EditFieldTripStatusViewModel.prototype.init = function(viewModel, el)
	{
		var self = this, isValidating = false, validatorFields = {};
		self.$form = $(el);

		if (self.isCancel)
		{
			validatorFields.comments = {
				trigger: "blur change",
				validators:
				{
					notEmpty:
					{
						message: "required"
					}
				}
			};
		}

		$(el).bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			}).on('success.field.bv', function(e, data)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate(data.element);
					isValidating = false;
				}
			});
		self.pageLevelViewModel.load(this.$form.data("bootstrapValidator"));
	};

	EditFieldTripStatusViewModel.prototype.getStatusId = function()
	{
		return this.obSelectedStatusId();
	};

	EditFieldTripStatusViewModel.prototype.apply = function(noComments)
	{
		var self = this, cancelStatus = 100;
		return this.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (!result)
			{
				return false;
			}

			statusId = self.isCancel ? cancelStatus : self.getStatusId(), note = noComments ? "" : self.obComments();
			self.selectedRecords.forEach(function(item)
			{
				item.FieldTripStageId = statusId;
				item.FieldTripStageNotes = note;
				// I have no idea what is this field for. 
				// but if don't set it to true, API will 
				// not add new records into FieldTripHistory when stage not change.
				item.IsFieldTripStageNotesChange = true;
			});

			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "FieldTrips"),
				{
					data: self.selectedRecords
				})
				.then(function()
				{
					self.selectedRecords.forEach(function(item)
					{
						item.FieldTripStageId = statusId;
					});
					return true;
				});
		});
	};

	EditFieldTripStatusViewModel.prototype.applyWithoutComments = function()
	{
		return this.apply(true);
	};

	EditFieldTripStatusViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};
})();

