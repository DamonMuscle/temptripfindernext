(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.FieldTripLocationDataModel = function(locationEntity)
	{
		namespace.BaseDataModel.call(this, locationEntity);
		this.equipments = ko.observable("");
	}

	namespace.FieldTripLocationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripLocationDataModel.prototype.constructor = namespace.FieldTripLocationDataModel;
    
	namespace.FieldTripLocationDataModel.prototype.mapping = [
        { "from": "Id", "default": 0 },
        { "from": "Name", "default": "" },
		{ "from": "Street", "default": "" },
		{ "from": "City", "default": "" },
		{ "from": "State", "default": "" },
		{ "from": "Zip", "default": "" },
		{ "from": "Notes", "default": "" },
		{ "from": "DBID", "default": function() { return tf.datasourceManager.databaseId; } },
	];

})();