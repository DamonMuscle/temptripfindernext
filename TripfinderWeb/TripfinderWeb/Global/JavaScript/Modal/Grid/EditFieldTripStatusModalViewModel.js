(function()
{
	createNamespace('TF.Modal').EditFieldTripStatusModalViewModel = EditFieldTripStatusModalViewModel;

	function EditFieldTripStatusModalViewModel(fieldTripRecords, isApprove, name, isCancel)
	{
		var self = this, isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit"),
			tripSingular = tf.applicationTerm.getApplicationTermSingularByName("Trip"), tripPlural = tf.applicationTerm.getApplicationTermPluralByName("Trip");
		TF.Modal.BaseModalViewModel.call(self);
		self.contentTemplate('modal/editfieldtripstatuscontrol');
		self.buttonTemplate("modal/positivenegativeother");

		if (fieldTripRecords.length > 1)
		{
			self.title((isCancel ? "Cancel " : (isAdmin ? "Change Status of " : (isApprove ? "Approve " : "Decline "))) + fieldTripRecords.length + " " + tripPlural);
		}
		else
		{
			self.title((isCancel ? "Cancel " + tripSingular + " " : (isAdmin ? "Change Status of " + tripSingular + " " : (isApprove ? "Approve " : "Decline "))) + "[ " + name + " ]");
		}
		if (isAdmin)
		{
			self.obPositiveButtonLabel = ko.observable((isCancel ? ("Cancel " + (fieldTripRecords.length > 1 ? fieldTripRecords.length : "") + " " + (fieldTripRecords.length > 1 ? tripPlural : tripSingular)) : "Change"));
		} else
		{
			self.obPositiveButtonLabel = ko.observable((isCancel ? "Cancel " : ((isApprove ? "Approve " : "Decline "))) + (fieldTripRecords.length > 1 ? fieldTripRecords.length : "") + " " + (fieldTripRecords.length > 1 ? tripPlural : tripSingular));

		}
		self.obNegativeButtonLabel = ko.observable("Cancel");

		if (isCancel)
		{
			self.obOtherButtonLabel = ko.observable("");
		}
		else if (isAdmin)
		{
			self.obOtherButtonLabel = ko.observable("Change without Commenting");
		}
		else
		{
			self.obOtherButtonLabel = ko.observable(isApprove ? "Approve without Commenting" : "");
		}
		self.editFieldTripStatusViewModel = new TF.Control.EditFieldTripStatusViewModel(fieldTripRecords, isApprove, isCancel);
		self.data(self.editFieldTripStatusViewModel);
		self.sizeCss = "modal-dialog-sm fieldtrip-status";
	}

	EditFieldTripStatusModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	EditFieldTripStatusModalViewModel.prototype.constructor = EditFieldTripStatusModalViewModel;

	EditFieldTripStatusModalViewModel.prototype.otherClick = function()
	{
		var self = this;
		self.editFieldTripStatusViewModel.applyWithoutComments().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
			}
		});
	};

	EditFieldTripStatusModalViewModel.prototype.positiveClick = function()
	{
		var self = this;
		self.editFieldTripStatusViewModel.apply().then(function(result)
		{
			if (result)
			{
				self.positiveClose(result);
				if ($(".kendoscheduler").length > 0 && $(".kendoscheduler").getKendoScheduler())
				{
					$(".kendoscheduler").getKendoScheduler().refresh();
				}
			}
		});
	};

	EditFieldTripStatusModalViewModel.prototype.dispose = function()
	{
		this.editFieldTripStatusViewModel.dispose();
	};
})();
