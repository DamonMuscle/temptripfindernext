(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.FieldTripDataModel = function(fieldTripEntity)
	{
		this._dirtyFields = ko.observableArray();
		this._clone = {}, this._cloneIsUpdate = false;

		namespace.BaseDataModel.call(this, fieldTripEntity);
	}

	namespace.FieldTripDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripDataModel.prototype.constructor = namespace.FieldTripDataModel;

	namespace.FieldTripDataModel.prototype.mapping = [
		{ from: "Id", default: 0 },
		{ from: "AideFixedCost", default: null },
		{ from: "AideRate", default: null },
		{ from: "AideOtrate", default: null },
		{ from: "BillingClassificationId", default: null },
		{ from: "BillingClassificationName", default: "" },
		{ from: "BillingNotes", default: "" },
		{ from: "Comments", default: "" },
		{ from: "ContactPhone", default: "" },
		{ from: "ContactPhoneExt", default: "" },
		{ from: "ContactEmail", default: "" },
		{ from: "DepartFromSchool", default: "" },
		{ from: "DepartDate", default: null },
		{ from: "DepartTime", default: null },
		{ from: "DepartDateTime", default: null },
		{ from: "DepartureNotes", default: "" },
		{ from: "DistrictDepartmentId", default: null },
		{ from: "DistrictDepartmentName", default: "" },
		{ from: "DirectionNotes", default: "" },
		{ from: "Destination", default: "" },
		{ from: "DestinationStreet", default: "" },
		{ from: "DestinationCity", default: function() { return tf.setting.userProfile.Mailcity; } },
		{ from: "DestinationState", default: function() { return tf.setting.userProfile.MailState; } },
		{ from: "DestinationZip", default: function() { return tf.setting.userProfile.Mailzip; } },
		{ from: "DestinationNotes", default: "" },
		{ from: "DestinationContactTitle", default: "" },
		{ from: "DestinationContact", default: "" },
		{ from: "DestinationContactPhone", default: function() { return tf.setting.userProfile.AreaCode; } },
		{ from: "DestinationPhoneExt", default: "" },
		{ from: "DestinationFax", default: "" },
		{ from: "DestinationEmail", default: "" },
		{ from: "DriverFixedCost", default: null },
		{ from: "DriverRate", default: null },
		{ from: "DriverOtrate", default: null },
		{ from: "ReturnDate", default: null },
		{ from: "ReturnTime", default: null },
		{ from: "EstimatedReturnDateTime", default: null },
		{ from: "EstimatedMiles", default: null },
		{ from: "EstimatedHours", default: null },
		{ from: "EstimatedCost", default: null },
		{ from: "FieldTripStageId", default: null },
		{ from: "FieldTripStageName", default: "" },
		{ from: "FieldTripClassificationId", default: null },
		{ from: "FieldTripClassificationName", default: "" },
		{ from: "FieldTripActivityId", default: null },
		{ from: "FieldTripActivityName", default: "" },
		{ from: "FieldTripAccountId", default: null },
		{ from: "FieldTripEquipmentId", default: null },
		{ from: "FieldTripEquipmentName", default: "" },
		{ from: "FieldTripDestinationId", default: null },
		{ from: "FieldTripContact", default: "" },
		{ from: "FieldTripInvoice", default: null },
		{ from: "FieldTripDocuments", default: null },
		{ from: "FieldTripResourceGroup", default: null },
		{ from: "FixedCost", default: null },
		{ from: "GUID", default: "" },
		{ from: "InvoiceDate", default: null },
		{ from: "MileageRate", default: null },
		{ from: "MinimumCost", default: null },
		{ from: "Name", default: "" },
		{ from: "NumberOfStudents", default: null },
		{ from: "NumberOfAdults", default: null },
		{ from: "NumberOfVehicles", default: null },
		{ from: "NumberOfWheelChairs", default: null },
		{ from: "PublicID", default: "" },
		{ from: "PublicNotes", default: "" },
		{ from: "PurchaseOrder", default: "" },
		{ from: "PaymentDate", default: null },
		{ from: "School", default: "" },
		{ from: "ShowPublic", default: null },
		{ from: "VehFixedCost", default: null },
		{ from: "LastUpdated", default: "1970-01-01T00:00:00" },
		{ from: "LastUpdatedId", default: 0 },
		{ from: "LastUpdatedName", default: "" },
		{ from: "LastUpdatedType", default: 0 },
		{ from: "UserChar1", default: "" },
		{ from: "UserChar2", default: "" },
		{ from: "UserChar3", default: "" },
		{ from: "UserChar4", default: "" },
		{ from: "UserDate1", default: null },
		{ from: "UserDate2", default: null },
		{ from: "UserDate3", default: null },
		{ from: "UserDate4", default: null },
		{ from: "UserDate5", default: null },
		{ from: "UserDate6", default: null },
		{ from: "UserDate7", default: null },
		{ from: "UserDate8", default: null },
		{ from: "UserNum1", default: 0 },
		{ from: "UserNum2", default: 0 },
		{ from: "UserNum3", default: 0 },
		{ from: "UserNum4", default: 0 },
		{ from: "FieldTripStageNotes", default: "" },
		{ from: "IsFieldTripStageNotesChange", default: null },
		{ from: "IsCreatedFromTemplate", default: false },
		{ from: "TemplateName", default: "" }
	];

	namespace.FieldTripDataModel.prototype.createObservable = function(key, value)
	{
		this._clone[key] = new ko.observable(value);

		return namespace.BaseDataModel.prototype.createObservable.call(this, key, value);
	};

	namespace.FieldTripDataModel.prototype.createObservableArray = function(key, value)
	{
		this._clone[key] = new ko.observableArray(value);

		return namespace.BaseDataModel.prototype.createObservableArray.call(this, key, value);
	};

	namespace.FieldTripDataModel.prototype.updateClone = function(entity)
	{
		for (var i in this._clone)
		{
			this._clone[i] = new ko.observable(entity[i]());
		}
		this._cloneIsUpdate = true;
	}

	namespace.FieldTripDataModel.prototype.getDirtyFields = function()
	{
		return this._dirtyFields();
	}

	namespace.FieldTripDataModel.prototype._changeTracker = function()
	{
		var modified = this[0]._modified;
		modified.remove(this[1]);
		modified.push(this[1]);
		if (this[1] != 'apiIsDirty' && this[0].hasOwnProperty("apiIsDirty"))
		{
			var tmp = !this[0].equals(this[0]._entityBackup, this[0].toData());

			this[0].apiIsDirty(tmp);
		}

		if (this[1] != 'apiIsDirty' && this._cloneIsUpdate)
		{
			if (this[0][this[1]]() != this[0]._clone[this[1]]() && this[0]._dirtyFields.indexOf(this[1]) == -1)
			{
				this[0]._dirtyFields.push(this[1]);
			}
			else if (this[0]._checkDefault(this[0][this[1]](), this[0]._clone[this[1]]()) && this[0]._dirtyFields.indexOf(this[1]) != -1)
			{
				this[0]._dirtyFields.remove(this[1]);
			}
		}
	};

	namespace.FieldTripDataModel.prototype._checkDefault = function(left, right)
	{
		if (left == right || (left == undefined && right == "") || (right == undefined && left == ""))
		{
			return true;
		}
		return false;
	}

})();
