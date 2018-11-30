(function()
{
	createNamespace('TF.Modal').EditFieldTripStatusModalViewModel = EditFieldTripStatusModalViewModel;

	function EditFieldTripStatusModalViewModel(fieldTripRecords, isCancel)
	{
		var self = this,
			tripSingular = tf.applicationTerm.getApplicationTermSingularByName("Trip"),
			tripPlural = tf.applicationTerm.getApplicationTermPluralByName("Trip");
		TF.Modal.BaseModalViewModel.call(self);
		self.contentTemplate('modal/editfieldtripstatuscontrol');
		self.buttonTemplate("modal/positivenegativeother");

		if (fieldTripRecords.length > 1)
		{
			self.title((isCancel ? "Cancel " : "Change Status of ") + fieldTripRecords.length + " " + tripPlural);
		}
		else
		{
			var name = fieldTripRecords[0].Name;
			self.title((isCancel ? "Cancel " + tripSingular + " " : "Change Status of ") + name);
		}

		self.obPositiveButtonLabel = ko.observable((isCancel ? ("Cancel " + (fieldTripRecords.length > 1 ? fieldTripRecords.length : "") + " " + (fieldTripRecords.length > 1 ? tripPlural : tripSingular)) : "Change"));
		self.obNegativeButtonLabel = ko.observable("Cancel");
		self.obOtherButtonLabel = ko.observable(isCancel ? "" : "Change without Commenting");

		self.editFieldTripStatusViewModel = new TF.Control.EditFieldTripStatusViewModel(fieldTripRecords, isCancel);
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
