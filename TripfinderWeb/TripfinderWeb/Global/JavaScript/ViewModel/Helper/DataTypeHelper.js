(function()
{
	const MSG_TYPE_NOT_SUPPORT = "Association type is not correct or supported.";
	createNamespace("TF.Helper").DataTypeHelper = DataTypeHelper;

	var _DATA_TYPE_ATTRIBUTES = {
		altsite: {
			endpoint: "alternatesites",
			name: "Alternate Site",
			idParamName: "alternateSiteId",
			gridDefinition: "altsiteGridDefinition",
			isMajorType: true,
			authorization: "alternateSite",
			hasDBID: true,
			enableDetailView: true
		},
		georegion: {
			endpoint: "georegions",
			name: "Geo Region",
			idParamName: "georegionId",
			gridDefinition: "georegionGridDefinition",
			isMajorType: true,
			authorization: "georegion",
			hasDBID: true,
			enableDetailView: true
		},
		georegiontype: {
			endpoint: "georegiontypes",
			name: "Geo Region Type"
		},
		vehiclebodytype: {
			endpoint: "vehiclebodytypes",
			name: "Vehicle Body Type"
		},
		vehiclebraketype: {
			endpoint: "vehiclebraketypes",
			name: "Vehicle Brake Type"
		},
		vehiclecategory: {
			endpoint: "vehiclecategories",
			name: "Vehicle Category"
		},
		vehicleequipment: {
			endpoint: "vehicleEquips",
			name: "Vehicle Equipment"
		},
		vehiclefueltype: {
			endpoint: "vehiclefueltypes",
			name: "Vehicle Fuel Type"
		},
		vehiclemodel: {
			endpoint: "vehiclemodels",
			name: "Vehicle Model"
		},
		vehiclemake: {
			endpoint: "vehiclemakes",
			name: "Vehicle Make"
		},
		vehiclemakeofbody: {
			endpoint: "vehiclemakeofbodies",
			name: "Vehicle Make Body"
		},
		category: {
			endpoint: "categories",
			name: "Category"
		},
		student: {
			endpoint: "students",
			name: "Student",
			idParamName: "studentId",
			gridDefinition: "studentGridDefinition",
			isMajorType: true,
			authorization: "student",
			entityUpdateConfirmBlackList: ["Comments", "RecordPicture"],
			hasDBID: true,
			enableDetailView: true
		},
		vehicle: {
			endpoint: "vehicles",
			name: "Vehicle",
			idParamName: "vehicleId",
			includes: ["vehicles"],
			gridDefinition: "vehicleGridDefinition",
			isMajorType: true,
			authorization: "vehicle",
			entityUpdateConfirmBlackList: ["RecordPicture"],
			hasDBID: true,
			enableDetailView: true
		},
		staff: {
			endpoint: "staff",
			name: "Staff",
			idParamName: "staffId",
			includes: ["aide", "driver", "aides", "drivers"],
			gridDefinition: "staffGridDefinition",
			isMajorType: true,
			authorization: "staff",
			entityUpdateConfirmBlackList: ["RecordPicture"],
			hasDBID: true,
			enableDetailView: true
		},
		fieldtrip: {
			endpoint: "fieldtrips",
			name: "Field Trip",
			idParamName: "fieldTripId",
			gridDefinition: "fieldTripGridDefinition",
			entityUpdateConfirmBlackList: ["DepartDateTime", "Destination", "FieldTripDestinationId"],
			isMajorType: true,
			authorization: "fieldtrip",
			hasDBID: true,
			enableDetailView: true
		},
		school: {
			endpoint: "schools",
			name: "School",
			idParamName: "schoolId",
			gridDefinition: "schoolGridDefinition",
			isMajorType: true,
			authorization: "school",
			hasDBID: true,
			enableDetailView: true
		},
		contractor: {
			endpoint: "contractors",
			name: "Contractor",
			idParamName: "contractorId",
			gridDefinition: "contractorGridDefinition",
			isMajorType: true,
			authorization: "contractor",
			hasDBID: true,
			enableDetailView: true
		},
		district: {
			endpoint: "districts",
			name: "District",
			idParamName: "districtId",
			gridDefinition: "districtGridDefinition",
			isMajorType: true,
			authorization: "district",
			hasDBID: true,
			enableDetailView: true
		},
		tripstop: {
			endpoint: "tripstops",
			name: "Trip Stop",
			idParamName: "tripStopId",
			gridDefinition: "tripStopGridDefinition",
			isMajorType: true,
			authorization: "trip",
			hasDBID: true,
			enableDetailView: true
		},
		trip: {
			endpoint: "trips",
			name: "Trip",
			idParamName: "tripId",
			gridDefinition: "tripGridDefinition",
			isMajorType: true,
			authorization: "trip",
			hasDBID: true,
			enableDetailView: true
		},
		gpsevent: {
			endpoint: "vehicleevents",
			idParamName: 'Id',
			name: "GPS Event",
			gridDefinition: "gpsEventGridDefinition",//"GPSEventsGridDefinition",
			isMajorType: true,
			hasDBID: false,
			enableUDF: false
		},
		contact: {
			endpoint: "contacts",
			name: "Contact",
			idParamName: "contactID",
			gridDefinition: "contactGridDefinition",
			isMajorType: true,
			entityUpdateConfirmBlackList: ["RecordPicture"],
			hasDBID: false,
			enableDetailView: true
		},
		document: {
			endpoint: "documents",
			name: 'Document',
			idParamName: 'documentId',
			gridDefinition: "documentGridDefinition",
			isMajorType: true,
			authorization: "document",
			hasDBID: true,
			enableDetailView: true
		},
		recordcontact: {
			endpoint: "recordcontacts",
			idParamName: 'Id',
			name: "Record Contacts",
			gridDefinition: "recordContactGridDefinition",
			isMajorType: false,
			hasDBID: true
		},
		documentclassification: {
			endpoint: 'documentclassifications',
			name: 'Document Classifications',
			idParamName: 'DocumentClassificationID',
			isMajorType: false,
			hasDBID: false
		},
		fieldtripresource: {
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
		fieldtriptemplate: {
			endpoint: "fieldtriptemplates",
			isMajorType: false,
			hasDBID: true
		},
		fieldtriphistory: {
			endpoint: "fieldtriphistories",
			isMajorType: false,
			hasDBID: true
		},
		resourceschedule: {
			endpoint: "resourceschedules",
			isMajorType: false,
			hasDBID: true
		},
		userdefinedfield: {
			endpoint: "userdefinedfields",
			isMajorType: false,
			hasDBID: false
		},
		report: {
			endpoint: "exagoreports",
			name: "Report",
			isMajorType: false,
			hasDBID: false
		},
		scheduledreport: {
			endpoint: "scheduledreports",
			name: "Scheduled Report",
			isMajorType: false,
			hasDBID: false
		},
		reportlibrary: {
			endpoint: "ReportLibraries",
			name: "ReportLibrary",
			isMajorType: false,
			hasDBID: false
		},
		reminder: {
			endpoint: "reminders",
			name: "Reminder",
			idParamName: "reminderID",
			gridDefinition: "reminderGridDefinition",
			isMajorType: false,
			hasDBID: true
		},
		triphistory: {
			endpoint: "triphistories",
			isMajorType: false,
			hasDBID: false
		},
		mergedocument: {
			endpoint: "mergedocuments",
			name: "Merge Document"
		},
		studentschedule: {
			endpoint: "studentschedules",
		},
		//TODO: remove once dashboard api done.
		dashboard: {
			name: "Dashboard",
			isMajorType: true,
			isTemporary: true,
			hasDBID: false
		},
		disabilitycode: {
			endpoint: "disabilitycodes",
			name: "Disability Code",
			hasDBID: true,
		},
		ethniccode: {
			endpoint: "ethniccodes",
			name: "Ethnic Code",
			hasDBID: true
		},
		city: {
			endpoint: "cities",
			name: "City",
			hasDBID: true,
		},
		mailingcity: {
			endpoint: "mailingcities",
			name: "Mailing City",
			hasDBID: false,
		},
		mailingpostalcode: {
			endpoint: "mailingpostalcodes",
			name: "Mailing Postal Code",
			hasDBID: false,
		},
		tripalias: {
			endpoint: "tripalias",
			name: "Trip Alias",
			hasDBID: true,
		},
		mapnez: {
			endpoint: "mapnezs",
			name: "Non-Eligible Zone",
			hasDBID: true,
		},
		specialequipment: {
			endpoint: "specialequipments",
			name: "Special Equipment",
			hasDBID: true,
		},
		mailingstate: {
			endpoint: "mailingstates",
			name: "Mailing State",
			hasDBID: true,
		},
		route: {
			endpoint: "routes",
			name: "Route",
			idParamName: "routeId",
			gridDefinition: "routeGridDefinition",
			gridReportType: "trip",
			isMajorType: true,
			authorization: "trip",
			hasDBID: true,
			enableDetailView: true,
			validUDFListData: true
		},
		form: {
			endpoint: "formResults",
			idParamName: 'ID',
			name: "Forms",
			gridDefinition: "formGridDefinition",
			isMajorType: true,
			hasDBID: true,
			enableUDF: false
		},
		dashboards: {
			endpoint: "dashboards",
			name: 'Dashboard',
			idParamName: 'ID',
			gridDefinition: "customizedDashboardGridDefinition",
			isMajorType: false,
			hasDBID: false,
			enableDetailView: false
		},
		other: {
			name: "Other"
		}
	};

	var _DATA_TYPES = [];
	var _RPT_DATA_SCHEMAS = []; // Store ReportDataSchema list

	const _noObjectIdDataTypes = ["contact", "scheduledreport", "dashboards"];

	function DataTypeHelper()
	{
		//constructor
	}

	/**
	 * Get data type id from DB and init _DATA_TYPES.
	 *
	 * @returns
	 */
	DataTypeHelper.prototype.init = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), 'datatypes'))
			.then(_formatDataTypeData)
			.then(function()  // Initialize ReportDataSchema list
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ReportDataSchemas"))
					.then(_formatReportSchemaData)
					.catch(function(err)
					{
						console.log("Error when initializing ReportDataSchema list.");
						_RPT_DATA_SCHEMAS.length = 0;
					});
			});
	};

	function _formatDataTypeData(response)
	{
		if (response && Array.isArray(response.Items))
		{
			var nameIdTable = {};

			response.Items.forEach(function(item)
			{
				if (item.Type)
				{
					const dataTypeKey = _getDataTypeKey(item.Type)
					nameIdTable[dataTypeKey] = item.ID;
				}
			});

			Object.keys(_DATA_TYPE_ATTRIBUTES).forEach(function(attrKey)
			{
				var attr = _DATA_TYPE_ATTRIBUTES[attrKey];
				if (attr.name)
				{
					const dataTypeKey = _getDataTypeKey(attr.name);
					attr.id = nameIdTable[dataTypeKey];
				}
			});
		}

		for (var key in _DATA_TYPE_ATTRIBUTES)
		{
			var obj = _DATA_TYPE_ATTRIBUTES[key];
			const isSpecialDataType = (obj.name && obj.isMajorType) || obj.name === "Dashboard" || obj.name === "Other";
			if (isSpecialDataType)
			{
				_DATA_TYPES.push({
					key: key,
					name: obj.name,
					id: obj.id
				});
			}
		}

		_DATA_TYPES = Array.sortBy(_DATA_TYPES, "name");
	}

	function _getDataTypeKey(dataTypeName)
	{
		return dataTypeName.toLowerCase() === "dashboard" ? "dashboards" : dataTypeName.toLowerCase();
	}

	function _formatReportSchemaData(response)
	{
		if (response && response.Items && response.Items.length)
		{
			var dataTypeIdMap = {};
			_DATA_TYPES.forEach(function(dataType)
			{
				dataTypeIdMap[dataType.id] = dataType.name;
			});

			response.Items.filter(function(dataSchema)
			{
				return dataSchema && dataSchema.Enabled === true;
			}).forEach(function(dataSchema)
			{
				_RPT_DATA_SCHEMAS.push({
					Id: dataSchema.ID,
					Name: dataSchema.DisplayName,
					DataTypeId: dataSchema.DataTypeId,
					DataTypeName: dataTypeIdMap[dataSchema.DataTypeId],
					SchemaInfo: dataSchema.DataSchema,
				});
			});
		}
	}

	/**
	 * Get the best matched object with type.
	 * Currently, many places are using different names for data type, this function is to give a little bit flexibility.
	 * However, this is only a temporary solution. Should be removed once we have data type names standardised.
	 * @param {string} str2
	 * @return {object}
	 */
	DataTypeHelper.prototype._getObjectByType = function(type)
	{
		var self = this, match = null;
		type = (type || "").toLowerCase();
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
				if (temp.includes && temp.includes.filter(
					function(value) { return self._fuzzyMatch(value, type) }).length > 0)
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
	}

	/**
	 * Get endpoint node text for data type.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getEndpoint = function(type)
	{
		var obj = null;
		switch (type)
		{
			case "aide":
			case "driver":
				type = "staff";
				break;
			case "fieldtripvehicle":
			case "fieldtripdriver":
			case "fieldtripaide":
				type = "fieldtripresource";
				break;
			default:
				break;
		}

		obj = this._getObjectByType(type);
		return obj ? obj.endpoint : type;
	};

	/**
	 * Get formal name for data type.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getFormalDataTypeName = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.name : type;
	};

	/**
	 * Get parameter name for id in a request.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getIdParamName = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.idParamName : type;
	};

	/**
	 * Get parameter name for ids in a request.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getIdsParamName = function(type)
	{
		var obj = this._getObjectByType(type);
		return (obj ? obj.idParamName : type) + "s";
	};

	/**
	 * Get confirmation black list by data type.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getEntityUpdateConfirmBlackList = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.entityUpdateConfirmBlackList : [];
	};

	DataTypeHelper.getValidDataTypes = function(isValidDataTypeFun)
	{
		var collection = [];
		for (var key in _DATA_TYPE_ATTRIBUTES)
		{
			var obj = _DATA_TYPE_ATTRIBUTES[key];
			if (isValidDataTypeFun(obj, key))
			{
				collection.push({
					key: key,
					name: obj.name,
					label: tf.applicationTerm.getApplicationTermPluralByName(obj.name),
					id: obj.id,
					authorization: obj.authorization,
					enableDetailView: obj.enableDetailView,
					enableUDF: obj.enableUDF !== false
				});
			}
		}

		collection = Array.sortBy(collection, "name")
		return collection;
	}

	/**
	 * Get available data type objects.
	 *
	 * @returns
	 */
	DataTypeHelper.prototype.getAvailableDataTypes = function()
	{
		function isAvailableDataTypeFun(dataTypeAttribute)
		{
			return dataTypeAttribute.name && dataTypeAttribute.isMajorType && !dataTypeAttribute.isTemporary
		}

		return TF.Helper.DataTypeHelper.getValidDataTypes(isAvailableDataTypeFun);
	};

	/**
	 * Get UDF available data type objects.
	 *
	 * @returns
	 */
	DataTypeHelper.prototype.getUDFAvailableDataTypes = function()
	{
		function isUDFAvailableDataTypeFun(dataTypeAttribute, dataTypeKey)
		{
			return (dataTypeKey === "report") ||
				(dataTypeAttribute.name && dataTypeAttribute.isMajorType && !dataTypeAttribute.isTemporary);
		}

		return TF.Helper.DataTypeHelper.getValidDataTypes(isUDFAvailableDataTypeFun);
	};

	DataTypeHelper.prototype.getAvailableDocumentAssociationGridDataTypes = function()
	{
		return this.getAvailableAssociationGridDataTypes(["document", "gpsevent", "form"]);
	};

	DataTypeHelper.prototype.getAvailableContactAssociationGridDataTypes = function()
	{
		// document doesn't have contact.
		return this.getAvailableAssociationGridDataTypes(["contact", "document", "gpsevent", "form"]);
	};

	DataTypeHelper.prototype.getAvailableAssociationGridDataTypes = function(excludeDataTypes)
	{
		return this.getAvailableDataTypes()
			.filter(function(dataType)
			{
				return tf.authManager.isAuthorizedForDataType(dataType.key, "read") && excludeDataTypes.indexOf(dataType.key) < 0;
			});
	};

	DataTypeHelper.prototype.getAvailableDataTypesForUDFManagement = function()
	{
		var dataTypesForUDFAdmin = this.getAvailableDataTypes().filter(x => x.enableUDF),
			reportDataTypeKey = "report",
			reportDataType = $.extend({}, _DATA_TYPE_ATTRIBUTES[reportDataTypeKey]);

		dataTypesForUDFAdmin.push({
			key: reportDataTypeKey,
			name: reportDataType.name,
			label: tf.applicationTerm.getApplicationTermPluralByName(reportDataType.name),
			id: reportDataType.id,
			authorization: reportDataType.authorization,
			enableDetailView: reportDataType.enableDetailView
		});

		return dataTypesForUDFAdmin;
	};

	DataTypeHelper.prototype.getKeyById = function(id)
	{
		var types = _DATA_TYPES.filter(function(type)
		{
			return type.id === id;
		});
		if (types.length === 1)
		{
			return types[0].key;
		}
		return null;
	};

	DataTypeHelper.prototype.getNameById = function(id)
	{
		var types = _DATA_TYPES.filter(function(type)
		{
			return type.id === id;
		});
		if (types.length === 1)
		{
			return types[0].name;
		}
		return null;
	};

	DataTypeHelper.prototype.getIdByName = function(name)
	{
		var matched = _DATA_TYPES.find(function(type)
		{
			return (type.name || "").toLowerCase() === (name || "").toLowerCase();
		});
		return matched && matched.id || null;
	};

	/**
	 * Get  id in a request.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getId = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj && obj.id !== undefined ? obj.id : 0;
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
		if (!name)
		{
			return undefined;
		}
		const matched = _.flatMap(_DATA_TYPE_ATTRIBUTES).filter(item => (item.name || "").toLowerCase() === name.toLowerCase());
		if (matched.length !== 1)
		{
			return undefined;
		}
		return matched[0].name;
	};

	DataTypeHelper.prototype.getEndpointByName = function(name)
	{
		if (!name)
		{
			return undefined;
		}
		var matched = _.flatMap(_DATA_TYPE_ATTRIBUTES).filter(function(item)
		{
			return (item.name || "").toLowerCase() === name.toLowerCase();
		});

		if (matched.length !== 1)
		{
			return undefined;
		}
		return matched[0].endpoint;
	};

	DataTypeHelper.prototype.getDataModelByGridType = function(gridType)
	{
		var dataModel = null;
		switch (gridType)
		{
			case "altsite":
				dataModel = new TF.DataModel.AltsiteDataModel();
				break;
			case "contact":
				dataModel = new TF.DataModel.ContactDataModel();
				break;
			case "contractor":
				dataModel = new TF.DataModel.ContractorDataModel();
				break;
			case "district":
				dataModel = new TF.DataModel.DistrictDataModel();
				break;
			case "fieldtrip":
				dataModel = new TF.DataModel.FieldTripDataModel();
				dataModel.fieldTripStageId(tf.helpers.fieldTripAuthHelper.getHighestEditRightApprovalSecuredItemId());
				break;
			case "georegion":
				dataModel = new TF.DataModel.GeoregionDataModel();
				break;
			case "school":
				dataModel = new TF.DataModel.SchoolDataModel();
				break;
			case "staff":
				dataModel = new TF.DataModel.StaffDataModel();
				break;
			case "student":
				dataModel = new TF.DataModel.StudentDataModel();
				break;
			case "trip":
				dataModel = new TF.DataModel.TripDataModel();
				break;
			case "tripstop":
				dataModel = new TF.DataModel.TripStopDataModel();
				break;
			case "vehicle":
				dataModel = new TF.DataModel.VehicleDataModel();
				break;
			case "document":
				dataModel = new TF.DataModel.DocumentDataModel();
				break;
			case "report":
				dataModel = new TF.DataModel.ReportDataModel();
				break;
			case "dashboard":
				dataModel = new TF.DataModel.CustomizedDashboardDataModel();
				break;
		}

		return dataModel;
	};

	/**
	 * Get grid definition by type.
	 *
	 * @param {String} type
	 * @returns
	 */
	DataTypeHelper.prototype.getGridDefinition = function(type)
	{
		var obj = this._getObjectByType(type);

		if (obj && obj.gridDefinition)
		{
			return tf[obj.gridDefinition].gridDefinition();
		}

		return null;
	};

	/**
	 * Get count of the data records associated with the contact.
	 *
	 * @returns
	 */
	DataTypeHelper.prototype.getAssociationTotalCount = function(type)
	{
		var self = this, dataTypes = [];

		switch (type)
		{
			case "document":
				dataTypes = self.getAvailableDocumentAssociationGridDataTypes();
				break;
			case "contact":
				dataTypes = self.getAvailableContactAssociationGridDataTypes();
				break;
		}

		var promises = self.getAllRequestUrls(dataTypes)
			.map(function(url)
			{
				return tf.promiseAjax.get(url).then(response =>
				{
					return response;
				}, error =>
				{
					return { Items: [] };
				});
			});

		return Promise.all(promises).then(function(responses)
		{
			var totalCount = 0;
			for (var i = 0, count = responses.length; i < count; i++)
			{
				var response = responses[i];
				totalCount += response.Items.length;
			}

			return totalCount;
		});
	};

	DataTypeHelper.prototype.deleteRecordByIds = function(dataType, ids)
	{
		const obj = this._getObjectByType(dataType),
			prefix = obj.hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(),
			baseUrl = pathCombine(prefix, obj.endpoint),
			primaryKeyField = _noObjectIdDataTypes.includes(dataType.toLowerCase()) ? "Id" : "ObjectId";

		return Promise.all(
			tf.urlHelper.chunk(ids, 500).map(idsChunk =>
				tf.promiseAjax.get(baseUrl, {
					paramData: {
						"@filter": `in (id, ${idsChunk.join(",")})`,
						"@fields": primaryKeyField
					}
				}).then(res => res.Items.map(item => item[primaryKeyField]) || [])
			))
			.then(resArr => resArr.reduce((pre, cur) => pre.concat(cur), []))
			.then(_ids => tf.promiseAjax.delete(baseUrl, { data: _ids }));
	};

	/**
	 * Get all contact associations required in parameter.
	 *
	 * @param {Array} dataTypes
	 * @returns
	 */
	DataTypeHelper.prototype.getAllRequestUrls = function(dataTypes)
	{
		return dataTypes.map(function(item)
		{
			var endpoint = tf.dataTypeHelper.getEndpoint(item.key);
			var selectColumns = "?@fields=Id";
			if (item.key === "contact" || item.key === "recordcontact")
			{
				selectColumns = "?@fields=Id&DBID=" + tf.api.datasourceManager.databaseId;
				return pathCombine(tf.api.apiPrefixWithoutDatabase(), endpoint) + selectColumns;
			}
			return pathCombine(tf.api.apiPrefix(), endpoint) + selectColumns;
		});
	};

	DataTypeHelper.prototype.createAssociationEntity = function(recordType, recordId, associationType, associationId)
	{
		var databaseId = tf.datasourceManager.databaseId,
			dataTypeId = tf.dataTypeHelper.getId(recordType);
		switch (associationType)
		{
			case "document":
				return {
					DocumentRelationshipID: 0,
					DBID: databaseId,
					DocumentID: associationId,
					AttachedToID: recordId,
					AttachedToType: dataTypeId
				};
			case "contact":
				return {
					DataTypeID: dataTypeId,
					DBID: databaseId,
					ContactID: associationId,
					RecordID: recordId
				};
			default:
				console.error(MSG_TYPE_NOT_SUPPORT);
				return undefined;
		}
	};

	DataTypeHelper.prototype.getAssociationEndpoint = function(type)
	{
		switch (type)
		{
			case "document":
				return "DocumentRelationships";
			case "contact":
				return "RecordContacts";
			default:
				console.error(MSG_TYPE_NOT_SUPPORT);
				return undefined;
		}
	};

	DataTypeHelper.prototype.getGridNameByDataType = function(type)
	{
		switch (type)
		{
			case "document":
				return "DocumentGrid";
			case "contact":
				return "ContactGrid";
			case "contactassociation":
				return "ContactAssociationGrid";
			case "documentassociation":
				return "DocumentAssociationGrid";
			case "studentschedule":
				return "StudentScheduleGrid";
			case "UDGrid":
				return "UDGridId";
			default:
				console.error(MSG_TYPE_NOT_SUPPORT);
				return undefined;
		}
	};

	DataTypeHelper.prototype.getRecordByIdsAndColumns = function(dbid, dataType, ids, columns, sortFields)
	{
		const generateSortItem = name => ({ Name: name, isAscending: "asc", Direction: "Ascending" });
		const prefix = dbid == null ? tf.api.apiPrefix() : `${tf.api.apiPrefixWithoutDatabase()}/${dbid}`;
		const endpoint = this.getEndpoint(dataType);

		sortFields = (Array.isArray(sortFields) && sortFields.length > 0) ? sortFields : ["Id"];

		return tf.promiseAjax.post(pathCombine(prefix, "search", endpoint), {
			data: {
				fields: columns,
				filterClause: "",
				filterSet: null,
				idFilter: { IncludeOnly: ids, ExcludeAny: [] },
				sortItems: sortFields.map(generateSortItem)
			}
		}).then((response) => response.Items);
	};

	DataTypeHelper.prototype.getSingleRecordByIdAndColumns = function(dataType, id, columns)
	{
		var endpoint = this.getEndpoint(dataType),
			mainUrl = tf.api.apiPrefix();

		if (dataType === "contact")
		{
			mainUrl = tf.api.apiPrefixWithoutDatabase();
		}
		return tf.promiseAjax.get(pathCombine(mainUrl, endpoint), {
			paramData: {
				Id: id,
				"@fields": columns
			}
		}).then(function(response)
		{
			return response.Items;
		});
	};


	/**
	 * Get default columns to be displayed on grid for specified data type.
	 *
	 * @param {string} dataType
	 * @returns
	 */
	DataTypeHelper.prototype.getDefaultColumnsByDataType = function(dataType)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "griddefaults?gridName=" + dataType))
			.then(function(apiResponse)
			{
				var columns = apiResponse.Items[0].Columns.split(",");

				return tf.dataTypeHelper.getGridDefinition(dataType).Columns.filter(function(defColumn)
				{
					return columns.indexOf(defColumn.FieldName) >= 0;
				});
			}.bind(this));
	};

	DataTypeHelper.prototype.getBasicColumnsByDataType = function(gridType)
	{
		var columns = [];

		switch (gridType)
		{
			case "altsite":
			case "document":
			case "contractor":
			case "district":
			case "fieldtrip":
			case "fieldtriptemplate":
			case "georegion":
			case "school":
			case "trip":
				columns = [{
					FieldName: "Name",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Name'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}];
				break;
			case "contact":
			case "staff":
				columns = [{
					DBName: "first_name",
					FieldName: "FirstName",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('First Name'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}, {
					DBName: "last_name",
					FieldName: "LastName",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Last Name'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}];
				break;
			case "student":
				columns = [{
					DBName: "first_name",
					FieldName: "FirstName",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('First Name'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}, {
					FieldName: "Mi",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Middle Initial'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}, {
					DBName: "last_name",
					FieldName: "LastName",
					DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Last Name'),
					Width: "150px",
					type: "string",
					isSortItem: true
				}];
				break;
			case "tripstop":
				columns = [{
					FieldName: "Street",
					DisplayName: "Street",
					Width: '330px',
					type: "string",
					isSortItem: true
				}];
				break;
			case "vehicle":
				columns = [{
					FieldName: "BusNum",
					DisplayName: "Vehicle",
					DBName: "Bus_Num",
					Width: '150px',
					type: "string",
					isSortItem: true
				}];
				break;
			default:
				break;
		}

		return columns;
	};

	DataTypeHelper.prototype.getEntityName = function(dataType, entity)
	{
		var name = '';
		if (entity)
		{
			switch (dataType)
			{
				case "staff":
				case "student":
				case "contact":
					var firstName = entity.FirstName || '',
						lastName = entity.LastName || '';
					name = (`${firstName} ${lastName}`).trim();
					break;
				case "tripstop":
					name = entity.Street;
					break;
				case "vehicle":
					name = entity.BusNum || entity.LongName;
					break;
				default:
					name = entity.Name;
					break;
			}
		}

		return name;
	};

	DataTypeHelper.prototype.getAllReportDataSchemas = function()
	{
		return _RPT_DATA_SCHEMAS;
	};

	DataTypeHelper.prototype.getReportDataSchemaById = function(schemaId)
	{
		var schemas = _RPT_DATA_SCHEMAS.filter(function(schema)
		{
			return schema.Id === schemaId;
		});
		if (schemas.length === 1)
		{
			return schemas[0];
		}

		return null;
	};

	DataTypeHelper.prototype.getReportDataSchemaByName = function(dataTypeName, schemaName)
	{
		var schemas = _RPT_DATA_SCHEMAS.filter(function(schema)
		{
			return schema.DataTypeName === dataTypeName && schema.Name === schemaName;
		});
		if (schemas.length === 1)
		{
			return schemas[0];
		}

		return null;
	};

	DataTypeHelper.prototype.getApiPrefix = function(dataType, dbid)
	{
		var obj = this._getObjectByType(dataType),
			prefix = obj.hasDBID ? tf.api.apiPrefix(null, dbid) : tf.api.apiPrefixWithoutDatabase();

		return pathCombine(prefix, obj.endpoint);
	};

	DataTypeHelper.prototype.getSearchApiPrefix = function(dataTypeName, dbid)
	{
		var dataTypeId = this.getIdByName(dataTypeName),
			dataTypeKey = this.getKeyById(dataTypeId),
			obj = this._getObjectByType(dataTypeKey),
			prefix = obj.hasDBID ? tf.api.apiPrefix(null, dbid) : tf.api.apiPrefixWithoutDatabase();

		return pathCombine(prefix, "search", obj.endpoint);
	};

	DataTypeHelper.prototype.getExportFileEndpoint = function(dataType)
	{
		if (!dataType)
		{
			return undefined;
		}
		dataType = this._getObjectByType(dataType);
		if (!dataType || !dataType.id)
		{
			return undefined;
		}
		var dataTypeKey = this.getKeyById(dataType.id);
		if (dataTypeKey === 'altsite')
		{
			dataTypeKey = "alternatesite"
		}

		return pathCombine("search", dataTypeKey + 'exportfiles');
	};

	DataTypeHelper.prototype.getFormCheckFilterDataTypes = function()
	{
		return [{ ID: 1, Type: "Alternate Site" }
			, { ID: 19, Type: "Contact" }
			, { ID: 2, Type: "Contractor" }
			, { ID: 3, Type: "District" }
			, { ID: 4, Type: "Field Trip" }
			, { ID: 5, Type: "Geo Region" }
			, { ID: 31, Type: "Route" }
			, { ID: 7, Type: "School" }
			, { ID: 8, Type: "Staff" }
			, { ID: 9, Type: "Student" }
			, { ID: 10, Type: "Trip" }
			, { ID: 13, Type: "Trip Stop" }
			, { ID: 11, Type: "Vehicle" }];
	};

	DataTypeHelper.prototype.saveTripResources = function(trips)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "TripResources"), {
			data: trips.map(trip =>
			{
				return {
					DBID: tf.datasourceManager.databaseId,
					StartDate: trip.StartDate == null ? moment().format("YYYY-MM-DDT00:00:00") : trip.StartDate,
					EndDate: "9999-12-31T00:00:00", // all future
					Monday: trip.Monday,
					Tuesday: trip.Tuesday,
					Wednesday: trip.Wednesday,
					Thursday: trip.Thursday,
					Friday: trip.Friday,
					Saturday: trip.Saturday,
					Sunday: trip.Sunday,
					StartTime: convertToMoment(trip.StartTime).locale("en-us").format("HH:mm:ss"),
					EndTime: convertToMoment(trip.FinishTime).locale("en-us").format("HH:mm:ss"),
					DriverId: trip.DriverId,
					VehicleId: trip.VehicleId,
					AideId: trip.AideId,
					TripId: trip.Id == null ? trip.id : trip.Id,// different caller give different id.
				};
			})
		});
	};

	DataTypeHelper.prototype.getFormDataType = function(dataType)
	{
		switch ((dataType || '').toLowerCase())
		{
			case 'altsite':
			case 'alternatesite':
				return "Alternate Site";
			case 'contact':
				return "Contact";
			case 'contractor':
				return "Contractor";
			case 'district':
				return "District";
			case 'fieldtrip':
				return "Field Trip";
			case 'vehicle':
				return "Vehicle";
			case 'school':
				return "School";
			case 'trip':
				return "Trip";
			case 'georegion':
				return "Geo Region";
			case 'student':
				return "Student";
			case 'staff':
				return "Staff";
			case 'tripstop':
				return "Trip Stop";
		}

		return '';
	};
})();
