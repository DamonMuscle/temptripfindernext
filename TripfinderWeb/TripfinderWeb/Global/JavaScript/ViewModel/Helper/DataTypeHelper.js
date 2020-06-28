(function()
{
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
		fieldtriptemplate: {
			endpoint: "fieldtriptemplates",
			isMajorType: false,
			hasDBID: true
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
		// gpsevent: {
		// 	endpoint: "vehicleevents",
		// 	idParamName: 'Id',
		// 	name: "GPS Event",
		// 	gridDefinition: "gpsEventGridDefinition",//"GPSEventsGridDefinition",
		// 	isMajorType: true,
		// 	hasDBID: false
		// },
		contact: {
			endpoint: "contacts",
			name: "Contact",
			idParamName: "contactID",
			gridDefinition: "contactGridDefinition",
			isMajorType: true,
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
			hasDBID: true,
		},
		mailingpostalcode: {
			endpoint: "mailingpostalcodes",
			name: "Mailing Postal Code",
			hasDBID: true,
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
		}
	};

	var _DATA_TYPES = [];
	var _RPT_DATA_SCHEMAs = []; // Store ReportDataSchema list

	function DataTypeHelper()
	{

	};

	/**
	 * Get data type id from DB and init _DATA_TYPES.
	 *
	 * @returns
	 */
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
						if (item.Type)
						{
							nameIdTable[item.Type.toLowerCase()] = item.ID;
						}
					});

					Object.keys(_DATA_TYPE_ATTRIBUTES).forEach(function(key)
					{
						var attr = _DATA_TYPE_ATTRIBUTES[key];
						if (attr.name)
						{
							attr.id = nameIdTable[attr.name.toLowerCase()];
						}
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

				_DATA_TYPES = Array.sortBy(_DATA_TYPES, "name");

			})
			.then(function()  // Initialize ReportDataSchema list
			{
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "ReportDataSchemas"))
					.then(function(response)
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
								_RPT_DATA_SCHEMAs.push({
									Id: dataSchema.ID,
									Name: dataSchema.DisplayName,
									DataTypeId: dataSchema.DataTypeId,
									DataTypeName: dataTypeIdMap[dataSchema.DataTypeId],
									SchemaInfo: dataSchema.DataSchema,
								});
							});
						}
					})
					.catch(function(err)
					{
						console.log("Error when initializing ReportDataSchema list.");
						_RPT_DATA_SCHEMAs.length = 0;
					});
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
		//return Math.abs(str2.length - str1.length) < 3 && (str1.indexOf(str2) > -1 || str2.indexOf(str1) > -1);
	};

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

	/**
	 * Get available data type objects.
	 *
	 * @returns
	 */
	DataTypeHelper.prototype.getAvailableDataTypes = function()
	{
		var collection = [];
		for (var key in _DATA_TYPE_ATTRIBUTES)
		{
			var obj = _DATA_TYPE_ATTRIBUTES[key];
			if (obj.name && obj.isMajorType && !obj.isTemporary)
			{
				collection.push({
					key: key,
					name: obj.name,
					label: tf.applicationTerm.getApplicationTermPluralByName(obj.name),
					id: obj.id,
					authorization: obj.authorization,
					enableDetailView: obj.enableDetailView
				});
			}
		}

		collection = Array.sortBy(collection, "name")
		return collection;
	};

	DataTypeHelper.prototype.getAvailableDocumentAssociationGridDataTypes = function()
	{
		return this.getAvailableAssociationGridDataTypes(["document", "gpsevent"]);
	};

	DataTypeHelper.prototype.getAvailableContactAssociationGridDataTypes = function()
	{
		// document doesn't have contact.
		return this.getAvailableAssociationGridDataTypes(["contact", "document", "gpsevent"]);
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
		var dataTypesForUDFAdmin = this.getAvailableDataTypes(),
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
		var types = _DATA_TYPES.filter(function(type) { return type.id === id; });
		if (types.length === 1)
		{
			return types[0].key;
		}
		return null;
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

	/**
	 * Get  id in a request.
	 *
	 * @param {string} type
	 * @returns
	 */
	DataTypeHelper.prototype.getId = function(type)
	{
		var obj = this._getObjectByType(type);
		return obj ? obj.id : 0;
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

	DataTypeHelper.prototype.getEndpointByName = function(name)
	{
		if (!name) return;

		var matched = _.flatMap(_DATA_TYPE_ATTRIBUTES).filter(function(item)
		{
			return (item.name || "").toLowerCase() === name.toLowerCase();
		});

		if (matched.length !== 1) return;
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
				return tf.promiseAjax.get(url)
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
		var obj = this._getObjectByType(dataType),
			prefix = obj.hasDBID ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase(),
			baseUrl = pathCombine(prefix, obj.endpoint);

		let primaryKeyField;
		if (dataType == 'contact')
		{
			primaryKeyField = 'Id';
		} else
		{
			primaryKeyField = 'ObjectId';
		}
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
			.then(ids => tf.promiseAjax.delete(baseUrl, { data: ids }));
	}

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
			var endpoint = tf.DataTypeHelper.getEndpoint(item.key);
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
			dataTypeId = tf.DataTypeHelper.getId(recordType);
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
					ContactTypeID: 1,
					RecordID: recordId
				};
			default:
				console.error("Association type is not correct or supported.");
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
				console.error("Association type is not correct or supported.");
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
			default:
				console.error("Association type is not correct or supported.");
		}
	};

	DataTypeHelper.prototype.getRecordByIdsAndColumns = function(dataType, ids, columns, dbid)
	{
		var endpoint = this.getEndpoint(dataType);
		return tf.promiseAjax.post(pathCombine(dbid == null ? tf.api.apiPrefix() : tf.api.apiPrefixWithoutDatabase() + "/" + dbid, "search", endpoint), {
			data: {
				fields: columns,
				filterClause: "",
				filterSet: null,
				idFilter: { IncludeOnly: ids, ExcludeAny: [] },
				sortItems: [{ Name: "Id", isAscending: "asc", Direction: "Ascending" }]
			}
		}).then(function(response)
		{
			return response.Items;
		});
	};

	DataTypeHelper.prototype.getSingleRecordByIdAndColumns = function(dataType, id, columns)
	{
		var endpoint = this.getEndpoint(dataType),
			mainUrl = tf.api.apiPrefix();

		if (dataType == "contact")
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

				return tf.DataTypeHelper.getGridDefinition(dataType).Columns.filter(function(defColumn)
				{
					return columns.indexOf(defColumn.FieldName) >= 0;
				});
			}.bind(this)).catch(function() { });
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
				columns = [
					{
						FieldName: "Name",
						DisplayName: tf.applicationTerm.getApplicationTermSingularByName('Name'),
						Width: "150px",
						type: "string",
						isSortItem: true
					}];
				break;
			case "contact":
			case "staff":
				columns = [
					{
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
				columns = [
					{
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
				columns = [
					{
						FieldName: "Street",
						DisplayName: "Street",
						Width: '330px',
						type: "string",
						isSortItem: true
					}];
				break;
			case "vehicle":
				columns = [
					{
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
					name = (firstName + " " + lastName).trim();
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
		return _RPT_DATA_SCHEMAs;
	};

	DataTypeHelper.prototype.getReportDataSchemaById = function(schemaId)
	{
		var schemas = _RPT_DATA_SCHEMAs.filter(function(schema) { return schema.Id === schemaId; });
		if (schemas.length === 1)
		{
			return schemas[0];
		}

		return null;
	};

	DataTypeHelper.prototype.getReportDataSchemaByName = function(dataTypeName, schemaName)
	{
		var schemas = _RPT_DATA_SCHEMAs.filter(function(schema) { return schema.DataTypeName === dataTypeName && schema.Name === schemaName; });
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
		if (!dataType) return "";
		var dataType = this._getObjectByType(dataType);
		if (!dataType || !dataType.id) return "";
		var dataTypeKey = this.getKeyById(dataType.id);
		if (dataTypeKey == 'altsite')
		{
			dataTypeKey = "alternatesite"
		}

		return pathCombine("search", dataTypeKey + 'exportfiles');
	};

	DataTypeHelper.prototype.saveTripCalendarRecords = function(trips)
	{
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "TripCalendarRecords"), {
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
					StartTime: moment(new Date(trip.StartTime)).locale("en-us").format("HH:mm:ss"),
					EndTime: moment(new Date(trip.FinishTime)).locale("en-us").format("HH:mm:ss"),
					DriverId: trip.DriverId,
					VehicleId: trip.VehicleId,
					AideId: trip.AideId,
					TripId: trip.Id == null ? trip.id : trip.Id,// different caller give different id.
				};
			})
		});
	};
})();