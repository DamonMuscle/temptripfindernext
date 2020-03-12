(function()
{
	createNamespace("TF").DataTypeHelper = DataTypeHelper;

	var _DATA_TYPE_ATTRIBUTES = {
		fieldtrip: {
			endpoint: "fieldtrips",
			exportEndpoint: "FieldTripExportFiles",
			name: "Field Trip",
			idParamName: "fieldTripId",
			gridDefinition: "fieldTripGridDefinition",
			isMajorType: true,
			authorization: "fieldtrip",
			hasDBID: true,
			enableDetailView: true
		},
		fieldtripresourcegroup: {
			endpoint: "fieldtripresourcegroups",
			idParamName: "fieldtripresourcegroupId",
			includes: ["fieldtripvehicle", "fieldtripdriver", "fieldtripaide"],
			isMajorType: false,
			hasDBID: true
		},
		fieldtripinvoice: {
			endpoint: "fieldtripinvoices",
			isMajorType: false,
			hasDBID: true
		},
		fieldtriphistory: {
			endpoint: "fieldtriphistories",
			isMajorType: false,
			hasDBID: true
		},
		school: {
			endpoint: "schools",
			isMajorType: false,
			hasDBID: true
		}
	};

	function DataTypeHelper()
	{

	};

	var _DATA_TYPES = [];

	DataTypeHelper.prototype.init = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'datatypes'))
			.then(function(response)
			{
				if (response && Array.isArray(response.Items))
				{
					var nameIdTable = {};
					response.Items.forEach(function(item)
					{
						nameIdTable[item.Type] = item.ID;
					});

					Object.keys(_DATA_TYPE_ATTRIBUTES).forEach(function(key)
					{
						var attr = _DATA_TYPE_ATTRIBUTES[key];
						attr.id = nameIdTable[attr.name];
					});
				}

				for (var key in _DATA_TYPE_ATTRIBUTES)
				{
					var obj = _DATA_TYPE_ATTRIBUTES[key];
					if (obj.name && obj.isMajorType)
					{
						_DATA_TYPES.push({
							key: key,
							name: obj.name,
							id: obj.id
						});
					}
				}
			});
	};

	/**
 * Get the best matched object with type.
 * Currently, many places are using different names for data type, this function is to give a little bit flexibility.
 * However, this is only a temporary solution. Should be removed once we have data type names standardised.
 * 
 * @param {string} str2
 * @return {object}
 */
	DataTypeHelper.prototype._getObjectByType = function(type)
	{
		var self = this, match = null, type = (type || "").toLowerCase();
		if (_DATA_TYPE_ATTRIBUTES.hasOwnProperty(type))
		{
			match = _DATA_TYPE_ATTRIBUTES[type];
		}
		else
		{
			var key, temp;
			for (key in _DATA_TYPE_ATTRIBUTES)
			{
				temp = _DATA_TYPE_ATTRIBUTES[key];
				if (self._fuzzyMatch(key, type))
				{
					match = temp;
					break;
				}

				// matched in includes list has lower priority, so it would not break the loop
				if (temp.includes && temp.includes.filter(function(value) { return self._fuzzyMatch(value, type) }).length > 0)
				{
					match = temp
				}
			}
		}

		return match;
	};

	/**
 * Define how fuzzy is the matching. 
 *
 * @param {string} str1
 * @param {string} str2
 * @returns {boolean}
 */
	DataTypeHelper.prototype._fuzzyMatch = function(str1, str2)
	{
		return str1 === str2;
	};

	/**
	 * Get endpoint node text for data type.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getEndpoint = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.endpoint : type;
	};

	/**
	 * Get id in a request.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getId = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.id : 0;
	};

	/**
	 * Get export endpoint node text for data type.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getExportEndpoint = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.exportEndpoint : type;
	};


	DataTypeHelper.prototype.getNameById = function(id)
	{
		var types = _DATA_TYPES.filter(function(type) { return type.id === id; });
		if (types.length === 1)
		{
			return types[0].name;
		}
		return null;
	};

	DataTypeHelper.prototype.getIdByName = function(name)
	{
		var types = _DATA_TYPES.filter(function(type) { return type.name === name });
		if (types.length === 1)
		{
			return types[0].id;
		}

		return null;
	};

	DataTypeHelper.prototype.getNameByType = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.name : "";
	};

	/**
	 * for new exported files due to table field changed of backend.
	 */
	DataTypeHelper.prototype.getNamebyLowerCaseName = function(name)
	{
		if (!name) return;

		var matched = _.flatMap(_DATA_TYPE_ATTRIBUTES).filter(function(item) { return (item.name || "").toLowerCase() == name.toLowerCase(); });

		if (matched.length != 1) return;

		return matched[0].name;
	};

	tf.DataTypeHelper = new TF.DataTypeHelper();
})();