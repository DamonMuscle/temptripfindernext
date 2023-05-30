(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.ContactDataModel = function(contactEntity)
	{
		namespace.BaseDataModel.call(this, contactEntity);
	}

	namespace.ContactDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ContactDataModel.prototype.constructor = namespace.ContactDataModel;

	namespace.ContactDataModel.prototype.mapping = [
		{ "from": "City", "default": "" },
		{ "from": "ContactType", "default": null },
		{ "from": "ContactTypeID", "default": null },
		{ "from": "DBID", "default": function() { return tf.datasourceManager.databaseId; } },
		{ "from": "DBINFO", "default": null },
		{ "from": "Email", "default": "" },
		{ "from": "Ext", "default": "" },
		{ "from": "Fax", "default": "" },
		{ "from": "Id", "default": 0 },
		{ "from": "Mobile", "default": "" },
		{ "from": "FirstName", "default": "" },
		{ "from": "LastName", "default": "" },
		{ "from": "Notes", "default": "" },
		{ "from": "Phone", "default": "" },
		{ "from": "RecordContacts", "default": null },
		{ "from": "State", "default": "" },
		{ "from": "Street1", "default": "" },
		{ "from": "Street2", "default": "" },
		{ "from": "Title", "default": "" },
		{ "from": "UserDefinedFields", "default": null },
		{ "from": "DocumentRelationships", "default": null },
		{ "from": "Zip", "default": "" }
	];
})();
