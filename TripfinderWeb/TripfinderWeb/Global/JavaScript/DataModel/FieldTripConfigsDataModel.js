(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	var arr = [];

	namespace.FieldTripConfigsDataModel = function(gridDefinition, recordEntity)
	{
		var self = this;

		arr.length = 0;
		gridDefinition.forEach(function(def)
		{
			if (def.unique)
			{
				self.uniqueField = def;
			}
			arr.push({
				from: def.mappingField || def.field,
				default: def.defaultValue || null
			});
		});
		namespace.BaseDataModel.call(this, recordEntity);
	}

	namespace.FieldTripConfigsDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.FieldTripConfigsDataModel.prototype.constructor = namespace.FieldTripConfigsDataModel;

	namespace.FieldTripConfigsDataModel.prototype.mapping = arr;

})();