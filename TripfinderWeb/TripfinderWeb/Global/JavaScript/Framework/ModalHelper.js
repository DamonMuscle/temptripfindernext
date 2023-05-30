(function()
{
	createNamespace("TF").ModalHelper = ModalHelper;

	function ModalHelper()
	{
		this.obBootboxs = ko.observableArray([]);
		this.obKendoModals = ko.observableArray([]);

		this.obZIndexChangeCss = ko.computed(function()
		{
			if (this.obKendoModals().length > 0 || this.obBootboxs().length > 0 || tf.modalManager.obBaseModalViewModels().length > 0)
				return "z-index-change";
			else
				return "";
		}, this);

		this.Mappings = {
			school: "School",
			student: "Student",
			trip: "Trip",
			vehicle: "Vehicle",
			georegion: "Geo Region",
			altsite: "Alternate Site",
			tripstop: "Trip Stop",
			district: "District",
			contractor: "Contractor",
			fieldtrip: "Field Trip",
			document: "Document",
			staff: "Staff",
			busfinderhistorical: "GPS Events",
			driver: "Staff",
			aide: "Staff",
			contact: "Contact",
			route: "Route",
		};
	}

	ModalHelper.prototype.constructor = ModalHelper;

	ModalHelper.prototype.pushBootbox = function(bootbox)
	{
		this.obBootboxs.push(bootbox);
	}

	ModalHelper.prototype.popBootbox = function()
	{
		if (this.obBootboxs().length > 0)
			this.obBootboxs.pop();
	}

	ModalHelper.prototype.removeBootbox = function(bootbox)
	{
		if (this.obBootboxs().length > 0)
			this.obBootboxs.remove(bootbox);
	}

	ModalHelper.prototype.pushKendoModal = function(kendoModal)
	{
		this.obKendoModals.push(bootbox);
	}

	ModalHelper.prototype.popKendoModal = function()
	{
		if (this.obKendoModals().length > 0)
			this.obKendoModals.pop();
	}

})();
