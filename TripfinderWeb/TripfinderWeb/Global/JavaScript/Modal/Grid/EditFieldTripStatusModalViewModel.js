(function()
{
	createNamespace('TF.Modal').EditFieldTripStatusModalViewModel = EditFieldTripStatusModalViewModel;

	function EditFieldTripStatusModalViewModel(fieldTripRecords, isApprove, name)
	{
		var self = this, isAdmin = tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isAuthorizedFor("transportationAdministrator", "edit");
		TF.Modal.BaseModalViewModel.call(self);
		self.contentTemplate('modal/editfieldtripstatuscontrol');
		self.buttonTemplate("modal/positivenegativeother");

		if (fieldTripRecords.length > 1)
		{
			self.title((isAdmin ? "Change status of " : (isApprove ? "Approve " : "Decline ")) + fieldTripRecords.length + " Trips");
		}
		else
		{
			self.title((isAdmin ? "Change status of Trip " : (isApprove ? "Approve " : "Decline ")) + "[ " + name + " ]");
		}

		self.obPositiveButtonLabel = ko.observable((isAdmin ? "Change" : (isApprove ? "Approve " : "Decline ")) + (fieldTripRecords.length > 1 ? fieldTripRecords.length : "") + " Trip" + (fieldTripRecords.length > 1 ? "s" : ""));
		self.obNegativeButtonLabel = ko.observable("Cancel");
		if (isAdmin)
		{
			self.obOtherButtonLabel = ko.observable("Change without Commenting");
		}
		else
		{
			self.obOtherButtonLabel = ko.observable(isApprove ? "Approve without Commenting" : "");
		}
		self.editFieldTripStatusViewModel = new TF.Control.EditFieldTripStatusViewModel(fieldTripRecords, isApprove);
		self.data(self.editFieldTripStatusViewModel);
		self.sizeCss = "modal-dialog-sm fieldtrip-status";
	}

	EditFieldTripStatusModalViewModel.prototype = Object.create(TF.Modal.BaseModalViewModel.prototype);

	EditFieldTripStatusModalViewModel.prototype.constructor = EditFieldTripStatusModalViewModel;

	EditFieldTripStatusModalViewModel.prototype.otherClick = function()
	{
		this.editFieldTripStatusViewModel.apply().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	EditFieldTripStatusModalViewModel.prototype.positiveClick = function()
	{
		this.editFieldTripStatusViewModel.applyWithComments().then(function(result)
		{
			if (result)
			{
				this.positiveClose(result);
			}
		}.bind(this));
	};

	EditFieldTripStatusModalViewModel.prototype.dispose = function()
	{
		this.editFieldTripStatusViewModel.dispose();
	};
})();
