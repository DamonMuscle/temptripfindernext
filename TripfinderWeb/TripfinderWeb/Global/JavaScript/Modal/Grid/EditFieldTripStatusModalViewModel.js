(function()
{
	createNamespace('TF.Modal').EditFieldTripStatusModalViewModel = EditFieldTripStatusModalViewModel;

	function EditFieldTripStatusModalViewModel(fieldTripRecords, isApprove, name, isCancel)
	{
		var self = this, isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		TF.Modal.BaseModalViewModel.call(self);
		self.contentTemplate('modal/editfieldtripstatuscontrol');
		self.buttonTemplate("modal/positivenegativeother");

		if (fieldTripRecords.length > 1)
		{
			self.title((isCancel ? "Cancel " : (isAdmin ? "Change Status of " : (isApprove ? "Approve " : "Decline "))) + fieldTripRecords.length + " Trips");
		}
		else
		{
			self.title((isCancel ? "Cancel Trip " : (isAdmin ? "Change Status of Trip " : (isApprove ? "Approve " : "Decline "))) + "[ " + name + " ]");
		}

		self.obPositiveButtonLabel = ko.observable((isCancel ? "Cancel " : (isAdmin ? "Change " : (isApprove ? "Approve " : "Decline "))) + (fieldTripRecords.length > 1 ? fieldTripRecords.length : "") + " Trip" + (fieldTripRecords.length > 1 ? "s" : ""));
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
			}
		});
	};

	EditFieldTripStatusModalViewModel.prototype.dispose = function()
	{
		this.editFieldTripStatusViewModel.dispose();
	};
})();
