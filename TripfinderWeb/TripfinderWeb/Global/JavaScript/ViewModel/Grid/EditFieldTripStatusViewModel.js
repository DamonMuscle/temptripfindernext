(function()
{
	createNamespace('TF.Control').EditFieldTripStatusViewModel = EditFieldTripStatusViewModel;

	function EditFieldTripStatusViewModel(selectedRecords, isApprove, isCancel)
	{
		var self = this;
		self.obComments = ko.observable("");
		self.placehoder = selectedRecords.length > 1 ? "Add comments to all " + tf.applicationTerm.getApplicationTermPluralByName("Trip") + "..." : "Add comments here...";
		self.$form = null;
		self.selectedRecords = selectedRecords;
		self.fieldTripIds = selectedRecords.map(function(item) { return item.Id; });
		self.isApprove = isApprove;
		self.isCancel = isCancel;
		self.isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");

		self.fieldTripStatus = [
			{ id: 1, name: "Level 1 - Request Submitted", isApprove: true },
			{ id: 2, name: "Level 2 - Request Declined", isApprove: false },
			{ id: 3, name: "Level 2 - Request Approved", isApprove: true },
			{ id: 4, name: "Level 3 - Request Declined", isApprove: false },
			{ id: 5, name: "Level 3 - Request Approved", isApprove: true },
			{ id: 6, name: "Level 4 - Request Declined", isApprove: false },
			{ id: 7, name: "Level 4 - Request Approved", isApprove: true },
			{ id: 98, name: "Declined by Transportation", isApprove: false },
			{ id: 99, name: "Transportation Approved", isApprove: true },
			{ id: 100, name: "Canceled - Request Canceled", isApprove: false },
			{ id: 101, name: "Completed - Request Completed", isApprove: true },
		];

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

		if (!self.isApprove || self.isCancel)
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
		// status of field trip
		// id		name
		// 1		Level 1 - Request Submitted
		// 2		Level 2 - Request Declined
		// 3		Level 2 - Request Approved
		// 4		Level 3 - Request Declined
		// 5		Level 3 - Request Approved
		// 6		Level 4 - Request Declined
		// 7		Level 4 - Request Approved
		// 98		Declined by Transportation
		// 99		Transportation Approved
		// 100	Canceled - Request Canceled
		// 101	Completed - Request Completed
		var self = this, statusId = -1, authInfo = tf.authManager.authorizationInfo;
		if (self.isAdmin)
		{
			statusId = self.obSelectedStatusId();
		}
		else if (authInfo.isAuthorizedFor("level4Administrator", "edit"))
		{
			statusId = self.isApprove ? 7 : 6;
		}
		else if (authInfo.isAuthorizedFor("level3Administrator", "edit"))
		{
			statusId = self.isApprove ? 5 : 4;
		}
		else if (authInfo.isAuthorizedFor("level2Administrator", "edit"))
		{
			statusId = self.isApprove ? 3 : 2;
		}
		else if (authInfo.isAuthorizedFor("level1Requestor", "edit"))
		{
			statusId = 1;
		}
		return statusId;
	};

	EditFieldTripStatusViewModel.prototype.apply = function(noComments)
	{
		var self = this, cancelStatus = 100, statusId = self.isCancel ? cancelStatus : self.getStatusId();
		return self.pageLevelViewModel.saveValidate().then(function(result)
		{
			if (result)
			{
				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtrip", "statuses"),
					{ data: { Ids: self.fieldTripIds, StatusId: statusId, Note: noComments ? "" : self.obComments(), ProductName: "tripfinder" } })
					.then(function()
					{
						return true;
					}.bind(this));
			}
			else
			{
				return false;
			}
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

