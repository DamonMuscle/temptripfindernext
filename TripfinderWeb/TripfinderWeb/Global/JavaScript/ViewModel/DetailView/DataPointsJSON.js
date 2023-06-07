(function()
{
	var today = (new Date()).toDateString();

	window.dataPointsJSONVersion = '1.0.0';
	window.dataPointsJSON = {
		"altsite": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "After School Program",
					"editType": {
						"format": "String",
						"maxLength": 60
					}
				},
				{
					"field": "Public",
					"title": "Site Type",
					"type": "Boolean",
					"defaultValue": "Yes",
					"displayValue": "Public",
					"positiveLabel": "Public",
					"negativeLabel": "Private",
					"format": "Public",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "PrivateStudentNames",
					"title": "Site Ownership",
					"type": "String",
					"defaultValue": "",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "students?@fields=Id,FirstName,LastName")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["FirstName"] + " " + item["LastName"],
										'value': item["Id"]
									};
								});
							});
						},
						"getFixedData": function(recordEntity)
						{
							if (recordEntity && recordEntity.RequirementStudents)
							{
								return Enumerable.From(recordEntity.RequirementStudents).Select(function(item)
								{
									return {
										'text': item.FirstName + " " + item.LastName,
										'value': item.Id
									};
								}).ToArray();
							}
							return [];
						},
						"allowNullValue": true,
						"entityKey": "PrivateStudentIds",
						"relationshipKey": "PrivateStudent"
					}
				},
				{
					"field": "Comments",
					"title": "Note",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "Geocoded",
					"title": "Geocoded",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Geocoded",
					"positiveLabel": "Geocoded",
					"negativeLabel": "Ungeocoded"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St.",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State St.",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoCities
					}
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 25
					}
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoZipCodes
					}
				},
				{
					"field": "Address",
					"title": "Geo Address",
					"type": "address",
					"min-height": "3",
					"min-width": "2",
					"defaultValue": {
						street: { title: "GEOCODE ST", text: "440 State St." },
						zip: { title: "GEOCODE POSTAL CODE", text: "12305" },
						city: { title: "GEOCODE CITY/TOWN", text: "Schenectady" },
						confidence: { title: "GEOCONFIDENCE", text: "997" }
					},
					"innerFields": getGeoAddressInnerFields()
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"defaultValue": "Map",
					"min-height": "4"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"subUrl": "altsite",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"contact": {
			"Main": [
				{
					"field": "FirstName",
					"title": "First Name",
					"type": "String",
					"defaultValue": "John",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "LastName",
					"title": "Last Name",
					"type": "String",
					"defaultValue": "Brown",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "Title",
					"title": "Title",
					"type": "String",
					"defaultValue": "Guardian",
					"editType": {
						"format": "String",
						"maxLength": 100
					}
				},
				{
					"field": "Street1",
					"title": "Street 1",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "Street2",
					"title": "Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "City",
					"title": "City",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "String",
						"maxLength": 50
					}
				},
				{
					"field": "State",
					"title": "State",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "Zip",
					"title": "Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "ZipCode",
					}
				},
				{
					"field": "Phone",
					"title": "Phone",
					"type": "String",
					"format": "Phone",
					"defaultValue": "373-3609 x0000",
					"editType": {
						"format": "Phone"
					}
				},
				{
					"field": "Ext",
					"title": "Ext",
					"type": "String",
					"defaultValue": "800",
					"editType": {
						"format": "PhoneExt",
						"maxLength": 5
					}
				},
				{
					"field": "Email",
					"title": "Email",
					"type": "String",
					"defaultValue": "neral@romulanstarempire.gov",
					"editType": {
						"format": "Email",
						"maxLength": 200
					}
				},
				{
					"field": "Fax",
					"title": "Fax",
					"type": "String",
					"format": "Phone",
					"defaultValue": "373-3609 x0000",
					"editType": {
						"format": "Fax"
					}
				},
				{
					"field": "Mobile",
					"title": "Mobile",
					"type": "String",
					"format": "Phone",
					"defaultValue": "373-3609 x0000",
					"editType": {
						"format": "Phone",
						"maxLength": 30
					}
				},
				{
					"field": "Notes",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "ContactAssociationGrid",
					"title": "Contact Association Grid",
					"type": "grid",
					"url": "contactrelationships",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"contractor": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Joe's Charter Buses",
					"editType": {
						"format": "String",
						"maxLength": 100
					}
				},
				// {
				// 	"field": "ContactName",
				// 	"title": "Contact",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "John Smith"
				// },
				// {
				// 	"field": "ContactTitle",
				// 	"title": "Title",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "Owner"
				// },
				// {
				// 	"field": "ContactPhoneWithExt",
				// 	"title": "Phone/Ext",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x01"
				// },
				// {
				// 	"field": "ContactEmail",
				// 	"title": "Email",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "jsmith@transfinder.com"
				// },
				// {
				// 	"field": "ContactFaxWithExt",
				// 	"title": "Destination Fax",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x0000"
				// },
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St.",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			// "Miscellaneous": [
			// 	{
			// 		"field": "File",
			// 		"title": "Documents",
			// 		"type": "File",
			// 		"defaultValue": "File list/browser",
			// 		"min-height": "3"
			// 	}
			// ],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"district": {
			"Main": [
				{
					"field": "IdString",
					"title": "Code",
					"type": "String",
					"defaultValue": "TSD",
					"editType": {
						"format": "String",
						"maxLength": 4
					}
				},
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Transfinder School District",
					"editType": {
						"format": "String",
						"maxLength": 30
					}
				},
				// {
				// 	"field": "ContactName",
				// 	"title": "Contact",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "John Smith"
				// },
				// {
				// 	"field": "ContactTitle",
				// 	"title": "Title",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "Superintendant"
				// },
				// {
				// 	"field": "ContactEmail",
				// 	"title": "Email",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "name@email.com"
				// },
				// {
				// 	"field": "ContactPhoneWithExt",
				// 	"title": "Phone/Ext",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x0000"
				// },
				// {
				// 	"field": "ContactFaxWithExt",
				// 	"title": "Fax/Ext",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x0000"
				// },
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"Miscellaneous": [
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				}
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// }
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"document": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Transfinder School Bus Schedule",
					"editType": {
						"format": "String",
						"maxLength": 255
					}
				},
				{
					"field": "FileName",
					"title": "File Name",
					"type": "String",
					"defaultValue": "Transfinder School Bus Schedule.pdf"
				},
				{
					"field": "FileSizeKB",
					"title": "File Size (kb)",
					"type": "Number",
					"defaultValue": 1024
				},
				{
					"field": "FileType",
					"entityFieldName": "MimeType",
					"title": "File Type",
					"type": "String",
					"defaultValue": "text/plain"
				},
				{
					"field": "DocumentClassificationName",
					"title": "Document Classification",
					"type": "String",
					"defaultValue": "Vehicle Public",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentclassifications?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DocumentClassificationID",
						"acceptableValueReg": /^[1-9]+\d?$/

					}
				},
				{
					"field": "Description",
					"title": "Description",
					"type": "Note",
					"defaultValue": "Vehicle Calendar",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"Related Data Count": [{
				"field": "AltsiteRelationshipCount",
				"title": "Alternate Sites",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "ContractorRelationshipCount",
				"title": "Contractors",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "DistrictRelationshipCount",
				"title": "Districts",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "FieldTripRelationshipCount",
				"title": "Field Trips",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "GeoregionRelationshipCount",
				"title": "Geo Regions",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "SchoolRelationshipCount",
				"title": "Schools",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "StaffRelationshipCount",
				"title": "Staff",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "StudentRelationshipCount",
				"title": "Students",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "TripRelationshipCount",
				"title": "Trips",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "TripStopRelationshipCount",
				"title": "Trip Stops",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "VehicleRelationshipCount",
				"title": "Vehicles",
				"type": "Number",
				"defaultValue": 16
			},
			{
				"field": "FieldTripTemplateRelationshipCount",
				"title": "Field Trip Templates",
				"type": "Number",
				"defaultValue": 16
			}],
			"User Defined": [],
			"User Defined Group": [],
			"Attach": [
				{
					"field": "AttachDocument",
					"entityFieldName": "FileName",
					"title": "Attach Document",
					"type": "Attach",
					"defaultValue": "Attach document"
				}
			],
			"Grid": [
				{
					"field": "DocumentAssociationGrid",
					"title": "Document Association Grid",
					"type": "grid",
					"url": "documentrelationships",
					"min-height": "3"
				}
			]
		},
		"fieldtrip": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Music Department Trip",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "SchoolNameWithCode",
					"title": "School",
					"type": "String",
					"defaultValue": "Transfinder Elementary School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "School"
					}
				},
				{
					"field": "DistrictDepartmentName",
					"title": "Department",
					"type": "String",
					"defaultValue": "Transfinder School District",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "districtdepartments?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"allowEdit": function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'] },
						"entityKey": "DistrictDepartmentId",
					}
				},
				{
					"field": "FieldTripActivityName",
					"title": "Activity",
					"type": "String",
					"defaultValue": "Field Trip",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripactivities?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"],
									};
								});
							});
						},
						"allowNullValue": true,
						"allowEdit": function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'] },
						"entityKey": "FieldTripActivityId",
					}
				},
				{
					"field": "DeptActivity",
					"title": "Dept./Activity",
					"type": "String",
					"defaultValue": "Music",
					"editType": {
						"format": "DropDown",
						"getSource": function(_, entity)
						{
							if (!entity.School) { return Promise.resolve([]); }

							var filterStr = String.format("eq(School,{0})", entity.School),
								paramData = {
									"@fields": "Id,DepartmentName,FieldTripActivityName,DepartmentId,FieldTripActivityId",
									"@relationships": "Department,Activity",
									"@filter": filterStr
								};

							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"), {
								paramData: paramData
							})
								.then(function(result)
								{
									var table = {},
										data = result.Items.map(function(item)
										{
											var label = (item.DepartmentName === "None" && item.FieldTripActivityName === "None") ? "" :
												String.format("{0}/{1}", item.DepartmentName, item.FieldTripActivityName);

											return {
												'text': label,
												'value': label,
												'affectedFields': {
													'DistrictDepartmentName': {
														'text': item.DepartmentName,
														'value': item.DepartmentId,
													},
													'FieldTripActivityName': {
														'text': item.FieldTripActivityName,
														'value': item.FieldTripActivityId
													}
												}
											};
										});

									return data.filter(function(item)
									{
										if (!table[item.text])
										{
											table[item.text] = true;
											return true;
										}

										return false;
									});

								});
						},
						"allowNullValue": true,
						"allowEdit": function() { return tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'] },
						"entityKey": "DeptActivity",
					}
				},
				{
					"field": "FieldTripContact",
					"title": "Contact",
					"type": "String",
					"defaultValue": "John Smith",
					"editType": {
						"format": "String",
						"maxLength": 200
					}
				},
				{
					"field": "ContactPhone",
					"title": "Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609",
					"format": "Phone",
					"editType": {
						"format": "Phone",
						"maxLength": 30
					}
				},
				{
					"field": "ContactPhoneExt",
					"title": "Ext",
					"type": "String",
					"defaultValue": "x0000",
					"editType": {
						"format": "PhoneExt",
						"maxLength": 5
					}
				},
				{
					"field": "ContactEmail",
					"title": "Email",
					"type": "String",
					"defaultValue": "name@email.com",
					"editType": {
						"format": "Email",
						"maxLength": 100
					}
				},
				{
					"field": "NumberOfStudents",
					"title": "#Students",
					"type": "Number",
					"defaultValue": "8",
					"editType": {
						"format": "Integer",
						"naturalNumber": true,
						"maxLength": 8,
						"acceptableValueReg": /^(0|[1-9]\d{0,7})$/
					}
				},
				{
					"field": "NumberOfAdults",
					"title": "#Adults",
					"type": "Number",
					"defaultValue": "1",
					"editType": {
						"format": "Integer",
						"naturalNumber": true,
						"maxLength": 8,
						"acceptableValueReg": /^(0|[1-9]\d{0,7})$/
					}
				},
				{
					"field": "NumberOfWheelChairs",
					"title": "#Wheel Chairs",
					"type": "Number",
					"defaultValue": "0",
					"editType": {
						"format": "Integer",
						"naturalNumber": true,
						"maxLength": 8,
						"acceptableValueReg": /^(0|[1-9]\d{0,7})$/
					}
				},
				{
					"field": "NumberOfVehicles",
					"title": "#Vehicles",
					"type": "Number",
					"defaultValue": "1",
					"editType": {
						"format": "Integer",
						"naturalNumber": true,
						"maxLength": 8,
						"acceptableValueReg": /^(0|[1-9]\d{0,7})$/
					}
				},
				{
					"field": "EstimatedDistance",
					"title": "Estimated Distance",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 8
					}
				},
				{
					"field": "EstimatedHours",
					"title": "Estimated Hours",
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 8
					}
				},
				{
					"field": "EstimatedCost",
					"title": "Estimated Cost($)",
					"type": "Number",
					"format": "Money",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "PublicId",
					"title": "PublicId",
					"type": "String"
				},
				{
					"field": "TotalCost",
					"title": "TotalCost",
					"type": "Number"
				},
				{
					"field": "Requestor",
					"title": "Requestor",
					"type": "String"
				}
			],
			"Destination": [
				{
					"field": "DepartDateTime",
					"title": "Depart Date/Time",
					"type": "Date/Time",
					"defaultValue": today,
					"editType": {
						"format": "DateTime"
					}
				},
				{
					"field": "DepartTime",
					"title": "Depart Time",
					"type": "Time",
					"defaultValue": "12:00"
				},
				{
					"field": "EstimatedReturnDateTime",
					"title": "Return Date/Time",
					"type": "Date/Time",
					"defaultValue": today,
					"editType": {
						"format": "DateTime"
					}
				},
				{
					"field": "ReturnTime",
					"title": "Return Time",
					"type": "Time",
					"defaultValue": "18:00"
				},
				{
					"field": "DepartureSchoolNameWithCode",
					"title": "Departure",
					"type": "String",
					"defaultValue": "Transfinder Elementary School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DepartFromSchool"
					}
				},
				{
					"field": "DepartureNotes",
					"title": "Departure Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "Destination",
					"title": "Destination",
					"type": "String",
					"defaultValue": "Sound Museum",
					"editType": {
						"format": "DropDown",
						"maxLength": 200,
						"getSource": function()
						{
							return tf.fieldTripConfigsDataHelper.getAllConfigRecordsByType('des').then(function(items)
							{
								return items.map(function(item)
								{
									item['text'] = item['Name'];
									item['value'] = item['Name'];
									return item;
								});
							});
						},
						"textField": "Name",
						"valueField": "Name",
						"entityKey": "Destination",
						"allowInput": function()
						{
							return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'];
						},
					}
				},
				{
					"field": "DestinationStreet",
					"title": "Destination Street",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 200,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationCity",
					"title": "Destination City",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "String",
						"maxLength": 100,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationState",
					"title": "Destination State",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationZip",
					"title": "Destination Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "ZipCode",
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationContact",
					"title": "Destination Contact",
					"type": "String",
					"defaultValue": "Cornelia C. Contralto II",
					"editType": {
						"format": "String",
						"maxLength": 200,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationContactTitle",
					"title": "Destination Title",
					"type": "String",
					"defaultValue": "Professor",
					"editType": {
						"format": "String",
						"maxLength": 100,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationPhoneExt",
					"title": "Destination Ext",
					"type": "String",
					"defaultValue": "x0000",
					"editType": {
						"format": "PhoneExt",
						"maxLength": 5,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationContactPhone",
					"title": "Destination Phone",
					"type": "String",
					"defaultValue": "(800) 373-3609",
					"format": "Phone",
					"editType": {
						"format": "Phone",
						"maxLength": 30,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationFax",
					"title": "Destination Fax",
					"type": "String",
					"defaultValue": "(800) 373-3609",
					"format": "Fax",
					"editType": {
						"format": "Fax",
						"maxLength": 30,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationEmail",
					"title": "Destination Email",
					"type": "String",
					"defaultValue": "ccontralto@soundmuseum.net",
					"editType": {
						"format": "Email",
						"maxLength": 100,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DestinationNotes",
					"title": "Destination Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000,
						allowEdit: function() { return !tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictDest'] }
					}
				},
				{
					"field": "DirectionNotes",
					"title": "Directions",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"Billing": [
				{
					"field": "BillingNotes",
					"title": "Billing Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "InvoicingInformation",
					"title": "Invoicing Information",
					"type": "String",
					"defaultValue": "Account Name: Science / Amount: $2000 / PO: 402934 / Invoice Date: " + today + " / Payment Date " + today
				},
				{
					"field": "TotalAmount",
					"title": "Total amount",
					"type": "Number",
					"format": "Money",
					"defaultValue": "568.50"
				},
				{
					"field": "BillingClassificationName",
					"title": "Billing Classfication",
					"type": "String",
					"defaultValue": "BC Code",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.fieldTripConfigsDataHelper.getAllConfigRecordsByType('bc').then(function(result)
							{
								return result.map(function(item)
								{
									return _.extend(item, {
										'text': item["Classification"],
										'value': item["Id"]
									});
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "BillingClassificationId",
						"relationshipKey": "FieldTripResourceGroup"

					}
				},
				{
					"field": "FuelConsumptionRate",
					get title() { return `Rate/${tf.measurementUnitConverter.getShortUnits()}`; },
					"UnitOfMeasureSupported": true,
					"UnitOfMeasureReverse": true,
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "AideFixedCost",
					"title": "Aide Fixed Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "DriverFixedCost",
					"title": "Driver Fixed Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "VehFixedCost",
					"title": "Vehicle Fixed Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "DriverRate",
					"title": "Driver Rate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "DriverOtrate",
					"title": "Driver OTRate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "AideRate",
					"title": "Bus Aide Rate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "AideOtrate",
					"title": "Aide OTRate",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "VehicleCost",
					"title": "Vehicle Cost",
					"type": "Number",
					"badgeFiled": "VehicleId",
					"format": "Money",
					"defaultValue": "0.00"
				},
				{
					"field": "SubTotalCost",
					"title": "Sub Total",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00"
				},
				{
					"field": "DriverCost",
					"title": "Driver Cost",
					"type": "Number",
					"badgeFiled": "DriverId",
					"format": "Money",
					"defaultValue": "0.00"
				},
				{
					"field": "AideCost",
					"title": "Bus Aide Cost",
					"type": "Number",
					"badgeFiled": "AideId",
					"format": "Money",
					"defaultValue": "0.00"
				},
				{
					"field": "FixedCost",
					"title": "Fixed Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "MinimumCost",
					"title": "Minimum Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00"
				},
				{
					"field": "TotalCost",
					"title": "Total Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "0.00"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "FieldTripHistoryGrid",
					"title": "Field Trip History Grid",
					"type": "grid",
					"url": "fieldtriphistory",
					"min-height": "3"
				},
				{
					"field": "FieldTripResourceGrid",
					"title": "Field Trip Resource Grid",
					"type": "grid",
					"url": "fieldtripresource",
					"min-height": 3,
					"getDataSource": function(detailView)
					{
						var fieldEditorHelper = detailView.fieldEditorHelper;

						var editedFieldList = fieldEditorHelper.editFieldList['FieldTripResourceGroups'] && fieldEditorHelper.editFieldList['FieldTripResourceGroups'].value;
						var items = editedFieldList || detailView.recordEntity['FieldTripResourceGroups'];
						return {
							Items: items,
							TotalRecordCount: items.length,
						}
					}
				},
				{
					"field": "FieldTripVehicleGrid",
					"title": "Field Trip Vehicle Grid",
					"type": "grid",
					"url": "fieldtripvehicle",
					"min-height": 3
				},
				{
					"field": "FieldTripDriverGrid",
					"title": "Field Trip Driver Grid",
					"type": "grid",
					"url": "fieldtripdriver",
					"min-height": 3
				},
				{
					"field": "FieldTripAideGrid",
					"title": "Field Trip Aide Grid",
					"type": "grid",
					"url": "fieldtripaide",
					"min-height": 3
				},
				{
					"field": "FieldTripInvoiceGrid",
					"title": "Field Trip Invoice Grid",
					"type": "grid",
					"url": "fieldtripinvoice",
					"min-height": 3
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "CommunicationHistoryGrid",
					"title": "Communication History Grid",
					"type": "grid",
					"url": "communicationhistory",
					"min-height": "3",
					"min-width": 2
				}
			],
			"Miscellaneous": [
				{
					"field": "Notes",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "FieldTripEquipmentName",
					"title": "Equipment",
					"type": "String",
					"defaultValue": "",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripEquipments"))
								.then(function(result)
								{
									return result.Items.map(function(item)
									{
										return {
											'text': item["EquipmentName"],
											'value': item["Id"]
										};
									});
								});
						},
						"allowNullValue": true,
						"entityKey": "FieldTripEquipmentIds",
						"relationshipKey": "FieldTripEquipment"
					}
				},
				{
					"field": "FieldTripClassificationName",
					"title": "Classification",
					"type": "String",
					"defaultValue": "",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripClassifications"))
								.then(function(result)
								{
									return result.Items.map(function(item)
									{
										return {
											'text': item["Code"],
											'value': item["Id"]
										};
									});
								});
						},
						"allowNullValue": true,
						"entityKey": "FieldTripClassificationId"
					}
				}
			]
		},
		"georegion": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Romulan Neutral Zone",
					"editType": {
						"format": "String",
						"maxLength": 60
					}
				},
				{
					"field": "GeoRegionTypeName",
					"title": "Type",
					"type": "String",
					"defaultValue": "Buffer",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "georegiontypes?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "GeoRegionTypeId"
					}
				},
				{
					"field": "HotLink",
					"title": "Hotlink",
					"type": "String",
					"defaultValue": "http://www.startrek.com/database_article/neutral-zone",
					"editType": {
						"format": "String",
						"maxLength": 255
					}
				},
				{
					"field": "StudentCount",
					"title": "Students",
					"type": "Number",
					"defaultValue": "47"
				},
				{
					"field": "SchoolCount",
					"title": "Schools",
					"type": "Number",
					"defaultValue": "1"
				},
				{
					"field": "TripstopsCount",
					"title": "Stops",
					"type": "Number",
					"defaultValue": "12"
				},
				{
					"field": "AltsitesCount",
					"title": "Alt Sites",
					"type": "Number",
					"defaultValue": "2"
				},
				{
					"field": "Geocoded",
					"title": "Geocoded",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Geocoded",
					"positiveLabel": "Geocoded",
					"negativeLabel": "Ungeocoded"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoCities
					}
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 25,
						"allowNullValue": true
					}
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoZipCodes,
					}
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"min-height": "3"
				},
				{
					"field": "AltsiteGrid",
					"title": "Alternate Site Grid",
					"type": "grid",
					"url": "altsite",
					"min-height": "3"
				},
				{
					"field": "SchoolGrid",
					"title": "School Grid",
					"type": "grid",
					"url": "school",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"min-height": "3"
				},
				{
					"field": "TripStopGrid",
					"title": "Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"school": {
			"Main": [
				{
					"field": "SchoolCode",
					"title": "School Code",
					"type": "String",
					"defaultValue": "TES",
					"editType": {
						"format": "String",
						"maxLength": 5,
						'forCreateOnly': true
					}
				},
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "Transfinder Elementary School",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "DistrictName",
					"title": "District",
					"type": "String",
					"defaultValue": "Transfinder School District",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "districts?@fields=Id,DistrictNameWithId")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["DistrictNameWithId"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DistrictID"
					}
				},
				{
					"field": "GradeRange",
					"title": "Grades",
					"type": "String",
					"defaultValue": "1-5",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "grades?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "GradeIds",
						"relationshipKey": "Grade"
					}
				},
				{
					"field": "FeedSchoolName",
					"title": "Feeding To",
					"type": "String",
					"defaultValue": "Washington Middle School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "FeedSchl"
					}
				},
				{
					"field": "BeginTime",
					"title": "Begin Time",
					"type": "Time",
					"defaultValue": "08:10",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "EndTime",
					"title": "End Time",
					"type": "Time",
					"defaultValue": "15:31",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "ArrivalTime",
					"title": "Arrival Time",
					"type": "Time",
					"defaultValue": "07:30",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "DepartTime",
					"title": "Departure Time",
					"type": "Time",
					"defaultValue": "15:45",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "Tschl",
					"title": "Allow Transfers at this School",
					"type": "Boolean",
					"defaultValue": "Yes",
					"displayValue": "Transfers Allowed",
					"positiveLabel": "Transfers Allowed",
					"negativeLabel": "Transfers Not Allowed",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "Private",
					"title": "Private School",
					"type": "Boolean",
					"defaultValue": "Yes",
					"displayValue": "Private School",
					"positiveLabel": "Private School",
					"negativeLabel": "Public School",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				// {
				// 	"field": "ContactName",
				// 	"title": "Contact",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "John Smith"
				// },
				// {
				// 	"field": "ContactTitle",
				// 	"title": "Title",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "Head Teacher"
				// },
				// {
				// 	"field": "ContactPhone",
				// 	"title": "Phone",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x0000"
				// },
				// {
				// 	"field": "ContactFaxWithExt",
				// 	"title": "Fax/Ext",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "(800) 373-3609 x0000"
				// },
				// {
				// 	"field": "ContactEmail",
				// 	"title": "Email",
				// 	"tobedeleted": "1",
				// 	"type": "String",
				// 	"defaultValue": "name@email.com"
				// },
				{
					"field": "Capacity",
					"title": "Students Capacity",
					"type": "Number",
					"defaultValue": "600",
					"editType": {
						"format": "Integer",
						"maxLength": 5
					}
				},
				{
					"field": "StudentCount",
					"title": "Students Enrolled",
					"type": "Number",
					"defaultValue": "452"
				},
				{
					"field": "Geocoded",
					"title": "Geocoded",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Geocoded",
					"positiveLabel": "Geocoded",
					"negativeLabel": "Ungeocoded"
				}
			],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Suite 1",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoCities
					}
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoZipCodes,
					}
				},
				{
					"field": "Address",
					"title": "Geo Address",
					"type": "address",
					"min-height": "3",
					"min-width": "2",
					"defaultValue": {
						street: { title: "GEOCODE ST", text: "440 State St." },
						zip: { title: "GEOCODE POSTAL CODE", text: "12305" },
						city: { title: "GEOCODE CITY/TOWN", text: "Schenectady" },
						confidence: { title: "GEOCONFIDENCE", text: "997" }
					},
					"innerFields": getGeoAddressInnerFields()
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"min-height": "3"
				},
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"min-height": "3"
				},
				{
					"field": "StopGrid",
					"title": "Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"staff": {
			"Primary Information": [{
				"field": "StaffLocalId",
				"title": "Local ID",
				"type": "String",
				"defaultValue": "46290",
				"editType": {
					"format": "String",
					"maxLength": 50
				}
			},
			{
				"field": "ActiveFlag",
				"title": "Status",
				"type": "Boolean",
				"defaultValue": "True",
				"displayValue": "Active",
				"positiveLabel": "Active",
				"negativeLabel": "Inactive",
				"editType": {
					"format": "BooleanDropDown"
				}
			},
			{
				"field": "FirstName",
				"title": "First Name",
				"type": "String",
				"defaultValue": "John",
				"editType": {
					"format": "String",
					"maxLength": 50
				}
			},
			{
				"field": "LastName",
				"title": "Last Name",
				"type": "String",
				"defaultValue": "Smith",
				"editType": {
					"format": "String",
					"maxLength": 50
				}
			},
			{
				"field": "MiddleName",
				"title": "Middle Name",
				"type": "String",
				"defaultValue": "H",
				"editType": {
					"format": "String",
					"maxLength": 50
				}
			},
			{
				"field": "AllStaffTypes",
				"title": "Type",
				"type": "String",
				"defaultValue": "Driver",
				"editType": {
					"format": "ListMover",
					"getSource": function()
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "stafftypes?@fields=StaffTypeName,StaffTypeId")).then(function(result)
						{
							return result.Items.map(function(item)
							{
								return {
									'text': item["StaffTypeName"],
									'value': item["StaffTypeId"]
								};
							});
						});
					},
					"allowNullValue": false,
					"entityKey": "StaffTypeIds",
					"relationshipKey": "StaffType"
				}
			},
			{
				"field": "EmployeeId",
				"title": "Employee ID",
				"type": "String",
				"defaultValue": "46290",
				"editType": {
					"format": "String",
					"maxLength": 50
				}
			},
			{
				"field": "RecordPicture",
				"title": "Picture",
				"type": "RecordPicture",
				"defaultValue": false,
				"min-height": "2"
			}
			],
			"Main": [{
				"field": "LicenseNumber",
				"title": "License Number",
				"type": "String",
				"defaultValue": "S967238",
				"editType": {
					"format": "String",
					"maxLength": 20
				}
			},
			{
				"field": "LicenseState",
				"title": "License State",
				"type": "String",
				"defaultValue": "NY",
				"editType": {
					"format": "String",
					"maxLength": 2
				}
			},
			{
				"field": "LicenseClass",
				"title": "License Class",
				"type": "String",
				"defaultValue": "CDL",
				"editType": {
					"format": "String",
					"maxLength": 2
				}
			},
			{
				"field": "LicenseRestrictions",
				"title": "License Restrictions",
				"type": "String",
				"defaultValue": "P, Q",
				"editType": {
					"format": "String",
					"maxLength": 10
				}
			},
			{
				"field": "LicenseExpiration",
				"title": "License Expiration",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date"
				}
			},
			{
				"field": "LicenseEndorsements",
				"title": "License Endorsements",
				"type": "String",
				"defaultValue": "F, G, H, M, N, P, R, S, T, W, X",
				"editType": {
					"format": "String",
					"maxLength": 10
				}
			},
			{
				"field": "HireDate",
				"title": "Date of Hire",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date"
				}
			},
			{
				"field": "InactiveDate",
				"title": "Inactive Date",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date"
				}
			},
			{
				"field": "DateOfBirth",
				"title": "Birth Date",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date"
				}
			},
			{
				"field": "DisplayGender",
				"title": "Gender",
				"type": "String",
				"defaultValue": "Male",
				"editType": {
					"format": "DropDown",
					"getSource": fetchDefaultGenders,
					"allowNullValue": true,
					"entityKey": "GenderId",
					"relationshipKey": "Gender",
				}
			},
			{
				"field": "ContractorName",
				"title": "Contractor",
				"type": "String",
				"defaultValue": "Joe's Charter Buses",
				"editType": {
					"format": "DropDown",
					"getSource": function()
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "contractors?@fields=Id,Name")).then(function(result)
						{
							return result.Items.map(function(item)
							{
								return {
									'text': item["Name"],
									'value': item["Id"]
								};
							});
						});
					},
					"allowNullValue": true,
					"entityKey": "ContractorId"
				}
			},
			{
				"field": "Rate",
				"title": "Rate",
				"type": "Number",
				"format": "Money",
				"defaultValue": "15.00",
				"editType": {
					"format": "Money",
					"maxLength": 8
				}
			},
			{
				"field": "Otrate",
				"title": "OT Rate",
				"type": "Number",
				"format": "Money",
				"defaultValue": "22.50",
				"editType": {
					"format": "Money",
					"maxLength": 8
				}
			},
			{
				"field": "UserName",
				"title": "User",
				"type": "String",
				"defaultValue": "Smith, John",
				"editType": {
					"format": "DropDown",
					"getSource": function(recordId, entity)
					{
						var filter = "eq(Deactivated,false)" + (entity && entity.UserID ? "|eq(user," + entity.UserID + ")" : "");
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "users"), {
							paramData: {
								"@fields": "Id,FirstName,LastName",
								"@filter": filter
							}
						}).then(function(result)
						{
							return result.Items.map(function(item)
							{
								return {
									'text': (item["LastName"] ? item["LastName"] + (item["FirstName"] ? ", " : "") : "") + (item["FirstName"] ? item["FirstName"] : ""),
									'value': item["Id"]
								};
							});
						});
					},
					"allowNullValue": true,
					"entityKey": "UserID"
				}
			},
			{
				"field": "DistrictName",
				"title": "District",
				"type": "String",
				"defaultValue": "Springfield",
				"editType": {
					"format": "DropDown",
					"getSource": function()
					{
						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "districts?@fields=Id,DistrictNameWithId")).then(function(result)
						{
							return result.Items.map(function(item)
							{
								return {
									'text': item["DistrictNameWithId"],
									'value': item["Id"]
								};
							});
						});
					},
					"allowNullValue": true,
					"entityKey": "DistrictId"
				},
				"wayfinderAvailable": true
			}
			],
			"Contact Info": [{
				"field": "MailStreet1",
				"title": "Mailing Address Street 1",
				"type": "String",
				"defaultValue": "440 State Street",
				"editType": {
					"format": "String",
					"maxLength": 150
				}
			},
			{
				"field": "MailStreet2",
				"title": "Mailing Address Street 2",
				"type": "String",
				"defaultValue": "Suite 1",
				"editType": {
					"format": "String",
					"maxLength": 150
				}
			},
			{
				"field": "MailCity",
				"title": "Mailing Address City/Town",
				"type": "String",
				"defaultValue": "Schenectady",
				"editType": {
					"format": "DropDown",
					"getSource": fetchMailingCities,
					"allowNullValue": true,
					"entityKey": "MailCityId"
				}
			},
			{
				"field": "MailCounty",
				"title": "Mailing Address Map Set",
				"type": "String",
				"defaultValue": "Schenectady",
				"editType": {
					"format": "String",
					"maxLength": 25
				}
			},
			{
				"field": "MailState",
				"title": "Mailing Address State/Province",
				"type": "String",
				"defaultValue": "NY",
				"editType": {
					"format": "DropDown",
					"getSource": fetchMailingStates,
					"allowNullValue": true,
					"entityKey": "MailStateId"
				}
			},
			{
				"field": "MailZip",
				"title": "Mailing Address Postal Code",
				"type": "String",
				"defaultValue": "12305",
				"editType": {
					"format": "DropDown",
					"getSource": fetchMailingZipCodes,
					"allowNullValue": true,
					"entityKey": "MailZipId"
				}
			},
			{
				"field": "HomePhone",
				"title": "Home Phone",
				"type": "String",
				"format": "Phone",
				"defaultValue": "(800) 373-3609",
				"editType": {
					"format": "Phone"
				}
			},
			{
				"field": "WorkPhone",
				"title": "Work Phone",
				"type": "String",
				"format": "Phone",
				"defaultValue": "(800) 373-3609",
				"editType": {
					"format": "Phone"
				}
			},
			{
				"field": "CellPhone",
				"title": "Cell Phone",
				"type": "String",
				"format": "Phone",
				"defaultValue": "(800) 373-3609",
				"editType": {
					"format": "Phone"
				}
			},
			{
				"field": "Email",
				"title": "Email Address",
				"type": "String",
				"defaultValue": "name@email.com",
				"editType": {
					"format": "Email",
					"maxLength": 100
				}
			}
			],
			"Requirements": [{
				"field": "ApplicationField",
				"title": "Application",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "FingerPrint",
				"title": "Finger Print",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "SuperintendentApprov",
				"title": "Superintendent Approv.",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "NewHireOrient",
				"title": "New Hire Orient",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "Abstract",
				"title": "Abstract",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "Interview",
				"title": "Interview",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "DefensiveDriving",
				"title": "Defensive Driving",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "DrivingTestPractical",
				"title": "Driving Test (Practical)",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "DrivingTestWritten",
				"title": "Driving Test (Written)",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "MedicalExam",
				"title": "Medical Exam",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "PPTField",
				"title": "PPT",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "HepatitisB",
				"title": "Hepatitis B",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "Certification",
				"title": "Certification",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "BasicField",
				"title": "Basic",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "Advanced",
				"title": "Advanced",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "PreService",
				"title": "Pre-Service",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "HandicapPreService",
				"title": "Handicap Pre-Service",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "RefresherPart1",
				"title": "Refresher (Part 1)",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "RefresherPart2",
				"title": "Refresher (Part 2)",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			},
			{
				"field": "HandicapRef",
				"title": "Handicap Ref",
				"type": "Date",
				"defaultValue": today,
				"editType": {
					"format": "Date",
				}
			}
			],
			"Miscellaneous": [{
				"field": "Schedule",
				"title": "Schedule",
				"type": "Schedule",
				"min-height": "4"
			},
			{
				"field": "Comments",
				"title": "Notes",
				"type": "Note",
				"defaultValue": "Lorem ipsum dolor sit amet.",
				"editType": {
					"format": "Note",
					"maxLength": 2000
				}
			}
			],
			"User Defined": [],
			"User Defined Group": [],
			"State Report Fields": [],
			"Grid": [{
				"field": "ContactGrid",
				"title": "Contact Information",
				"type": "grid",
				"url": "contactinformation",
				"min-height": "3",
				"min-width": 2
			},
			{
				"field": "DocumentGrid",
				"title": "Documents Grid",
				"type": "grid",
				"url": "document",
				"min-height": "3",
				"min-width": 2
			},
			{
				"field": "CommunicationHistoryGrid",
				"title": "Communication History Grid",
				"type": "grid",
				"url": "communicationhistory",
				"min-height": "3",
				"min-width": 2
			}
			]
		},
		"student": {
			"Primary Information": [
				{
					"field": "LocalId",
					"title": "Local ID",
					"type": "String",
					"defaultValue": "48293",
					"editType": {
						"format": "String",
						"maxLength": 15
					}
				},
				{
					"field": "FirstName",
					"title": "First Name",
					"type": "String",
					"defaultValue": "Emily",
					"editType": {
						"format": "String",
						"maxLength": 15
					}
				},
				{
					"field": "LastName",
					"title": "Last Name",
					"type": "String",
					"defaultValue": "Wazowski",
					"editType": {
						"format": "String",
						"maxLength": 20
					}
				},
				{
					"field": "Mi",
					"title": "Middle Initial",
					"type": "String",
					"defaultValue": "H",
					"editType": {
						"format": "String",
						"maxLength": 1
					}
				},
				{
					"field": "Dob",
					"title": "Date of Birth",
					"type": "Date",
					"defaultValue": "2/23/04",
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "Grade",
					"title": "Grade",
					"type": "String",
					"defaultValue": "10",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "grades?@fields=Id,Code")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Code"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": false,
						"entityKey": "GradeId"
					}
				},
				{
					"field": "DisplayGender",
					"title": "Gender",
					"type": "String",
					"defaultValue": "Female",
					"editType": {
						"format": "DropDown",
						"getSource": fetchDefaultGenders,
						"allowNullValue": true,
						"entityKey": "Sex"
					}
				},
				{
					"field": "Cohort",
					"title": "Cohort",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 10
					}
				},
				{
					"field": "District",
					"title": "District",
					"type": "String",
					"defaultValue": "Springfield",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "districts?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DistrictId"
					}
				},
				{
					"field": "AttendanceSchoolName",
					"entityFieldName": "SchoolName",
					"title": "School of Attendance",
					"type": "String",
					"defaultValue": "Springfield Elementary School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"entityKey": "SchoolCode"
					}
				},
				{
					"field": "DistanceFromSchl",
					"title": "Distance (Attendance)",
					"type": "Geodistance",
					"UnitOfMeasureSupported": true,
					get defaultValue()
					{
						return `1.3 ${tf.measurementUnitConverter.getShortUnits()}`;
					}
				},
				{
					"field": "DistanceFromResidSch",
					"title": "Distance (Residence)",
					"type": "Geodistance",
					"UnitOfMeasureSupported": true,
					get defaultValue()
					{
						return `1.3 ${tf.measurementUnitConverter.getShortUnits()}`;
					}
				},
				{
					"field": "ResidenceSchoolName",
					"entityFieldName": "ResidSchoolName",
					"title": "School of Residence",
					"type": "String",
					"defaultValue": "Springfield Elementary School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCodeWithName"],
										'value': item["SchoolCode"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "ResidSchool"
					}
				},
				{
					"field": "LoadTime",
					"title": "Load Time",
					"type": "Number",
					"defaultValue": "30",
					"editType": {
						"format": "Integer",
						"maxLength": 8,
						"validators": {
							greaterThan: {
								message: 'Load Time should be greater than 0',
								inclusive: true,
								value: 0
							}
						}
					}
				},
				{
					"field": "RecordPicture",
					"title": "Picture",
					"type": "RecordPicture",
					"defaultValue": false,
					"min-height": "2"
				},
				{
					"field": "Geocoded",
					"title": "Geocoded",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Geocoded",
					"positiveLabel": "Geocoded",
					"negativeLabel": "Ungeocoded"
				}
			],
			"Eligibility": [
				{
					"field": "Transported",
					"title": "Eligible for Transport",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Eligible for Transport",
					"positiveLabel": "Eligible for Transport",
					"negativeLabel": "Not Eligible for Transport",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "AidEligible",
					"title": "Eligible for Aid",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Eligible for Aid",
					"positiveLabel": "Eligible for Aid",
					"negativeLabel": "Not Eligible for Aid",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "InActive",
					"title": "Inactive",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Active",
					"positiveLabel": "Inactive",
					"negativeLabel": "Active",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "AideReq",
					"title": "Bus Aide Required",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Bus Aide Required",
					"positiveLabel": "Bus Aide Required",
					"negativeLabel": "Bus Aid Not Required",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "Disabled",
					"title": "Disabled",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Disabled",
					"positiveLabel": "Disabled",
					"negativeLabel": "Not Disabled",
					"editType": {
						"format": "BooleanDropDown"
					}
				}
			],
			"Codes": [
				{
					"field": "EthnicCodes",
					"title": "Ethnic Codes",
					"type": "String",
					"defaultValue": "Y",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "ethnicCodes?@fields=Id,Code")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Code"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "EthnicCodeIds",
						"relationshipKey": "EthnicCode"
					}
				},
				{
					"field": "DisabilityCodes",
					"title": "Disability Codes",
					"type": "String",
					"defaultValue": "<none>",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "disabilityCodes?@fields=Id,Code")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Code"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DisabilityCodeIds",
						"relationshipKey": "DisabilityCode"
					}
				}
			],
			// "Transportation": [
			// 	{
			// 		"field": "PickUpAltsiteName",
			// 		"title": "Pick Up Site",
			// 		"type": "String",
			// 		"defaultValue": "Home",
			// 		"editType": {
			// 			"format": "DropDown",
			// 			"getSource": getAvailableSites,
			// 			"allowNullValue": false,
			// 			"entityKey": "DlyPuSite"
			// 		}
			// 	},
			// 	{
			// 		"field": "PickUpTransferSchoolNameWithCode",
			// 		"title": "Pick Up Transfer School",
			// 		"type": "String",
			// 		"defaultValue": "Transfinder Elementary School",
			// 		"editType": {
			// 			"format": "DropDown",
			// 			"getSource": function()
			// 			{
			// 				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?transfer=true&@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
			// 				{
			// 					return result.Items.map(function(item)
			// 					{
			// 						return {
			// 							'text': item["SchoolCodeWithName"],
			// 							'value': item["SchoolCode"]
			// 						};
			// 					});
			// 				});
			// 			},
			// 			"allowNullValue": true,
			// 			"entityKey": "DlyPuTschl"
			// 		}
			// 	},
			// 	{
			// 		"field": "DropOffAltsiteName",
			// 		"title": "Drop Off Site",
			// 		"type": "String",
			// 		"defaultValue": "Home",
			// 		"editType": {
			// 			"format": "DropDown",
			// 			"getSource": getAvailableSites,
			// 			"allowNullValue": false,
			// 			"entityKey": "DlyDoSite"
			// 		}
			// 	},
			// 	{
			// 		"field": "DropOffTransferSchoolNameWithCode",
			// 		"title": "Drop Off Transfer School",
			// 		"type": "String",
			// 		"defaultValue": "Transfinder Elementary School",
			// 		"editType": {
			// 			"format": "DropDown",
			// 			"getSource": function()
			// 			{
			// 				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?transfer=true&@fields=SchoolCodeWithName,SchoolCode")).then(function(result)
			// 				{
			// 					return result.Items.map(function(item)
			// 					{
			// 						return {
			// 							'text': item["SchoolCodeWithName"],
			// 							'value': item["SchoolCode"]
			// 						};
			// 					});
			// 				});
			// 			},
			// 			"allowNullValue": true,
			// 			"entityKey": "DlyDoTschl"
			// 		}
			// 	}
			// ],
			"Address": [
				{
					"field": "MailStreet1",
					"title": "Mailing Address Street 1",
					"type": "String",
					"defaultValue": "440 State St.",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailStreet2",
					"title": "Mailing Address Street 2",
					"type": "String",
					"defaultValue": "Basement",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "MailCity",
					"title": "Mailing Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingCities,
						"allowNullValue": true,
						"entityKey": "MailCityId"
					}
				},
				{
					"field": "MailState",
					"title": "Mailing Address State/Province",
					"type": "String",
					"defaultValue": "NY",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "MailZip",
					"title": "Mailing Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"getSource": fetchMailingZipCodes,
						"allowNullValue": true,
						"entityKey": "MailZipId"
					}
				},
				{
					"field": "GeoStreet",
					"title": "GeoCode Address Street",
					"type": "String",
					"defaultValue": "440 State St.",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "GeoCity",
					"title": "GeoCode Address City/Town",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoCities
					}
				},
				{
					"field": "GeoCounty",
					"title": "GeoCode Address Map Set",
					"type": "String",
					"editType": {
						"format": "String",
						"maxLength": 255
					}
				},
				{
					"field": "GeoZip",
					"title": "GeoCode Address Postal Code",
					"type": "String",
					"defaultValue": "12305",
					"editType": {
						"format": "DropDown",
						"allowNullValue": true,
						"getSource": fetchGeoZipCodes,
					}
				},
				{
					"field": "Address",
					"title": "Geo Address",
					"type": "address",
					"min-height": "3",
					"min-width": "2",
					"defaultValue": {
						street: { title: "GEOCODE ST", text: "440 State St." },
						zip: { title: "GEOCODE POSTAL CODE", text: "12305" },
						city: { title: "GEOCODE CITY/TOWN", text: "Schenectady" },
						confidence: { title: "GEOCONFIDENCE", text: "997" }
					},
					"innerFields": getGeoAddressInnerFields()
				}
			],
			"Miscellaneous": [
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Schedule",
					"title": "Schedule",
					"type": "Schedule",
					"min-height": "4"
				}
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// }
			],
			"Notes": [
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "AltsiteGrid",
					"title": "Alternate Site Grid",
					"type": "grid",
					"url": "altsite",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "TransportationRequirements",
					"title": "Transportation Requirements",
					"type": "multipleGrid",
					"min-height": "7",
					"min-width": 2
				},
				{
					"field": "StudentScheduleGrid",
					"title": "Schedule Grid",
					"type": "grid",
					"url": "studentschedule",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AMTripGrid",
					"title": "AM Trip Grid",
					"type": "grid",
					"url": "trip",
					"tripType": "am",
					"idField": "TripId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "PMTripGrid",
					"title": "PM Trip Grid",
					"type": "grid",
					"url": "trip",
					"tripType": "pm",
					"idField": "TripId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AMTransferTripGrid",
					"title": "AM Transfer Trip Grid",
					"type": "grid",
					"url": "trip",
					"tripType": "amtransfer",
					"idField": "TripId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "PMTransferTripGrid",
					"title": "PM Transfer Trip Grid",
					"type": "grid",
					"url": "trip",
					"tripType": "pmtransfer",
					"idField": "TripId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AllTripGrid",
					"title": "All Trip Grid",
					"type": "grid",
					"url": "trip",
					"tripType": "all",
					"idField": "TripId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AMTripStopGrid",
					"title": "AM Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"tripType": "am",
					"idField": "PUStopId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "PMTripStopGrid",
					"title": "PM Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"tripType": "pm",
					"idField": "DOStopId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AMTransferTripStopGrid",
					"title": "AM Transfer Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"tripType": "amtransfer",
					"idField": "PUStopId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "PMTransferTripStopGrid",
					"title": "PM Transfer Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"tripType": "pmtransfer",
					"idField": "DOStopId",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "AllTripStopGrid",
					"title": "All Trip Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"tripType": "all",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"trip": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "25 PM Bayside",
					"editType": {
						"format": "String"
					}
				},
				{
					"field": "Description",
					"title": "Description",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note"
					}
				},
				{
					"field": "TripAlias",
					"title": "Trip Alias",
					"type": "String",
					"defaultValue": "25 PM",
					"editType": {
						"format": "String"
					}
				},
				{
					"field": "VehicleName",
					"title": "Vehicle",
					"type": "String",
					"defaultValue": "42",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicles?@fields=Id,BusNum")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["BusNum"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "VehicleId"
					}
				},
				{
					"field": "DriverName",
					"title": "Driver",
					"type": "String",
					"defaultValue": "Ralph Norton",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?@fields=Id,FullName&staffTypeID=2")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["FullName"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "DriverId"
					}
				},
				{
					"field": "BusAideName",
					"title": "Bus Aide",
					"type": "String",
					"defaultValue": "Ed Kramden",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "staff?@fields=Id,FullName&staffTypeID=1")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["FullName"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "AideId"
					}
				},
				{
					"field": "Distance",
					"title": "Distance",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"format": "0.00",
					"defaultValue": "7.98",
					// "editType": {
					// 	"format": "Number"
					// }
				},
				{
					"field": "Cost",
					"title": "Cost",
					"type": "Number",
					"format": "Money",
					"defaultValue": "2.39",
					"editType": {
						"format": "Money"
					}
				},
				{
					"title": "Deadhead Distance",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"format": "0.00",
					"defaultValue": "1.3",
					"editType": {
						"format": "Number"
					}
				}
			],
			"Trip information": [
				{
					"field": "TotalStudents",
					"title": "Total Students Assigned",
					"type": "Number",
					"defaultValue": "52",
					"editType": {
						"format": "Integer"
					}
				},
				{
					"field": "EstTransport",
					"title": "Est Students Transported",
					"type": "Number"
				},
				{
					"field": "MaxOnBus",
					"title": "Max Students Assigned",
					"type": "Number",
					"editType": {
						"format": "Number"
					}
				},
				{
					"field": "StartTime",
					"title": "Start Time",
					"type": "Time",
					"defaultValue": "07:14",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "FinishTime",
					"title": "Finish Time",
					"type": "Time",
					"defaultValue": "08:30",
					"editType": {
						"format": "Time"
					}
				}
			],
			"Criteria": [
				{
					"field": "TripTypeName",
					"title": "Trip Type",
					"type": "String",
					"defaultValue": "To School",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return Promise.resolve([
								{ text: "To School", value: 0 },
								{ text: "From School", value: 1 },
							]);
						},
						"allowNullValue": true,
						"entityKey": "Session",
						"forCreateOnly": true
					}
				},
				{
					"field": "HomeSchl",
					"title": "Home To School",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Home To School",
					"positiveLabel": "Home To School",
					"negativeLabel": "No Home To School",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "HomeTrans",
					"title": "Home to Transfer",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Home to Transfer",
					"positiveLabel": "Home To Transfer",
					"negativeLabel": "No Home To Transfer",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "Shuttle",
					"title": "Transfer to School",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Transfer to School",
					"positiveLabel": "Transfer to School",
					"negativeLabel": "No Transfer to School",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "ActivityTrip",
					"title": "Activity Trip",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Activity Trip",
					"positiveLabel": "Activity Trip",
					"negativeLabel": "No Activity Trip",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "HasBusAide",
					"title": "Bus Aide on This Trip",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "No Bus Aide on This Trip",
					"positiveLabel": "Bus Aide on This Trip",
					"negativeLabel": "No Bus Aide on This Trip"
				},
				{
					"field": "NonDisabled",
					"title": "Non-Disabled Students",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Not Non-Disabled Students",
					"positiveLabel": "Non-Disabled Students",
					"negativeLabel": "Not Non-Disabled Students",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "Disabled",
					"title": "Disabled Students",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Not Disabled Students",
					"positiveLabel": "Disabled Students",
					"negativeLabel": "Not Disabled Students",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "Schools",
					"title": "School",
					"type": "String",
					"defaultValue": "Transfinder Elementary School",
					"editType": {
						"format": "ListMover",
						"forCreateOnly": true,
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools?@fields=Id,SchoolCode")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["SchoolCode"],
										'value': item["Id"]
									};
								});
							});
						},
						"validators": {
							LessThanOrEqualTo: {
								message: 'the length of items must less than or equal to 10',
								value: 10
							}
						},
						"entityKey": "SchoolIds"
					}
				},
				{
					"field": "FilterName",
					"title": "Additional Students Filter Name",
					"type": "String",
					"editType": {
						"format": "String"
					}
				},
				{
					"field": "FilterSpec",
					"title": "Additional Student Filter Specification",
					"type": "String",
					"editType": {
						"format": "String"
					}
				},
				{
					"field": "TravelScenarioName",
					"title": "Travel Scenario",
					"type": "String",
					"defaultValue": "Inclement Weather",
					"editType": {
						"format": "DropDown",
						"forCreateOnly": true,
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "travelscenarios?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "TravelScenarioId"
					}
				},
				{
					"field": "SchoolStopTime",
					"title": "School Stop Time",
					"type": "String"
				}
			],
			"Interface Settings": [
				{
					"field": "IShow",
					"title": "Visible",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Visible",
					"positiveLabel": "Visible",
					"negativeLabel": "Not Visible",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "IName",
					"title": "Display Name",
					"type": "String",
					"defaultValue": "25",
					"editType": {
						"format": "String"
					}
				},
				{
					"field": "Description",
					"title": "Description",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note"
					}
				},
				{
					"field": "GPSEnabledFlag",
					"title": "Busfinder Enabled",
					"type": "Boolean",
					"defaultValue": "True",
					"displayValue": "Busfinder Enabled",
					"positiveLabel": "Busfinder Enabled",
					"negativeLabel": "Busfinder Not Enabled",
					"editType": {
						"format": "BooleanDropDown"
					}
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note"
					}
				},
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				},
				{
					"field": "Student",
					"title": "Student"
				},
				{
					"field": "Calendar",
					"title": "Calendar",
					"type": "Calendar",
					"min-height": "4"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "AideGrid",
					"title": "Aides Grid",
					"type": "grid",
					"url": "staff",
					"subUrl": "aide",
					"min-height": "3"
				},
				{
					"field": "DriverGrid",
					"title": "Driver Grid",
					"type": "grid",
					"url": "staff",
					"subUrl": "driver",
					"min-height": "3"
				},
				{
					"field": "VehicleGrid",
					"title": "Vehicle Grid",
					"type": "grid",
					"url": "vehicle",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"min-height": "3"
				},
				{
					"field": "StopGrid",
					"title": "Stop Grid",
					"type": "grid",
					"url": "tripstop",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "CalendarEventsGrid",
					"title": "Calendar Events",
					"type": "grid",
					"url": "triphistory",
					"min-height": "3"
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"tripstop": {
			"Main": [
				{
					"field": "TripName",
					"title": "Trip Name",
					"type": "String",
					"defaultValue": "25 PM TES",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": false,
						"entityKey": "TripId",
						"forCreateOnly": true
					}
				},
				{
					"field": "Street",
					"title": "Street",
					"type": "String",
					"defaultValue": "31 Spooner Street",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				},
				{
					"field": "City",
					"title": "City",
					"type": "String",
					"defaultValue": "Schenectady",
					"editType": {
						"format": "String",
						"maxLength": 64
					}
				},
				{
					"field": "StopTime",
					"title": "Time",
					"type": "Time",
					"defaultValue": "16:02",
					"editType": {
						"format": "Time"
					}
				},
				{
					"field": "NumStuds",
					"title": "Students",
					"type": "Number",
					"defaultValue": "3"
				},
				{
					"field": "Sequence",
					"title": "Sequence",
					"type": "Number",
					"defaultValue": "12",
					"editType": {
						"format": "Number",
						"maxLength": 8,
						"forCreateOnly": true
					}
				},
				{
					"field": "TotalStopTime",
					"title": "Total Stop Time",
					"type": "Number",
					"defaultValue": "21",
					"format": "TimeSpan",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "Comment",
					"title": "Comments",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note",
						"maxLength": 2000
					}
				}
			],
			"Next Stop": [
				{
					"field": "NextStreet",
					"title": "Street",
					"type": "String",
					"defaultValue": "39 Spooner Street"
				},
				{
					"field": "NextTime",
					"title": "Time",
					"type": "Time",
					"defaultValue": "16:05"
				},
				{
					"field": "NextStudents",
					"title": "Students",
					"type": "Number",
					"defaultValue": "2"
				},
				{
					"field": "PreviousDistance",
					"title": "Distance",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"format": "0.00",
					"defaultValue": ".5"
				},
				{
					"field": "Duration",
					"title": "Duration",
					"type": "Time",
					"defaultValue": "00:00:15",
					"format": "TimeSpan"
				},
				{
					"field": "PreviousDrivingDirections",
					"title": "Driving Directions",
					"type": "String",
					"defaultValue": "Lorem ipsum dolor sit amet."
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Map",
					"title": "Map",
					"type": "Map",
					"min-height": "4"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "SchoolGrid",
					"title": "School Grid",
					"type": "grid",
					"url": "school",
					"min-height": "3"
				},
				{
					"field": "StudentGrid",
					"title": "Student Grid",
					"type": "grid",
					"url": "student",
					"min-height": "3"
				},
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"route": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"type": "String",
					"defaultValue": "42 Bus",
					"editType": {
						"format": "String",
						"maxLength": 150
					}
				}
			],
			"Miscellaneous": [{
				"field": "Notes",
				"title": "Notes",
				"type": "Note",
				"defaultValue": "Lorem ipsum dolor sit amet.",
				"editType": {
					"format": "Note",
					"maxLength": 2000
				},
			},
			{
				"field": "Map",
				"title": "Map",
				"type": "Map",
				"defaultValue": "Map",
				"min-height": "4"
			}],
			"User Defined": [],
			"User Defined Group": [],
			"State Report Fields": [],
			"Grid": [
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"vehicle": {
			"Main": [
				{
					"field": "VehicleName",
					"title": "Vehicle",
					"type": "String",
					"defaultValue": "592-A",
					"editType": {
						"format": "String",
						"maxLength": 60,
						"entityKey": "BusNum"
					}
				},
				{
					"field": "CategoryNames",
					"title": "Category",
					"type": "String",
					"defaultValue": "Passenger",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "categories?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "CategoryIds",
						"relationshipKey": "Category"
					}
				},
				{
					"field": "LongName",
					"title": "Name",
					"type": "String",
					"defaultValue": "592-A",
					"editType": {
						"format": "String",
						"maxLength": 60,
						"entityKey": "LongName"
					}
				},
				{
					"field": "Inactive",
					"title": "Inactive",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Active",
					"positiveLabel": "Inactive",
					"negativeLabel": "Active",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "AssetId",
					"title": "Asset ID",
					"type": "String",
					"defaultValue": "49273",
					"editType": {
						"format": "String",
						"maxLength": 20
					}
				},
				{
					"field": "Gpsid",
					"title": "GPS ID",
					"type": "String",
					"defaultValue": "FJRUW9234",
					"editType": {
						"format": "String",
						"maxLength": 100
					}
				},
				{
					"field": "Capacity",
					"title": "Capacity",
					"type": "Number",
					"defaultValue": "10",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "FuelConsumption",
					get title()
					{
						return `${tf.measurementUnitConverter.isImperial() ? "MPG" : "KM/L"}`;
					},
					"type": "Number",
					"defaultValue": "10",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					},
					UnitOfMeasureSupported: true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.MpgToKml;
					}
				},
				{
					"field": "Cost",
					get title() { return `Rate/${tf.measurementUnitConverter.getShortUnits()}`; },
					"UnitOfMeasureSupported": true,
					"UnitOfMeasureReverse": true,
					"type": "Number",
					"format": "Money",
					"defaultValue": ".30",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "WcCapacity",
					"title": "W/C Capacity",
					"type": "Number",
					"defaultValue": "1",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					}
				},
				{
					"field": "Length",
					"title": "Length",
					"type": "Number",
					get defaultValue()
					{
						return `20 ${tf.measurementUnitConverter.getRulerUnits()}`;
					},
					"editType": {
						"format": "Integer",
						"maxLength": 8
					},
					"UnitOfMeasureSupported": true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter;
					}
				},
				{
					"field": "Height",
					"title": "Height",
					"type": "Number",
					get defaultValue()
					{
						return `8 ${tf.measurementUnitConverter.getRulerUnits()}`;
					},
					"editType": {
						"format": "Integer",
						"maxLength": 8
					},
					"UnitOfMeasureSupported": true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter;
					}
				},
				{
					"field": "LicensePlate",
					"title": "License Plate",
					"type": "String",
					"defaultValue": "ECTO-1",
					"editType": {
						"format": "String",
						"maxLength": 20
					}
				},
				{
					"field": "MaxWeight",
					"title": "Max Weight",
					"type": "Number",
					"defaultValue": "3000",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					},
					"UnitOfMeasureSupported": true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.PoundToKilogram;
					}
				},
				{
					"field": "Width",
					"title": "Width",
					"type": "Number",
					"defaultValue": "6.68",
					"editType": {
						"format": "Integer",
						"maxLength": 8
					},
					UnitOfMeasureSupported: true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.FootToMeter;
					}
				},
				{
					"field": "Vin",
					"title": "VIN",
					"type": "String",
					"defaultValue": "FR8F62NDL923XAF54",
					"editType": {
						"format": "String",
						"maxLength": 60
					}
				},
				{
					"field": "EstLife",
					"title": "Est. Life",
					"type": "Number",
					"defaultValue": "4",
					"editType": {
						"format": "Number",
						"maxLength": 20
					}
				},
				{
					"field": "ContractorName",
					"title": "Contractor",
					"type": "String",
					"defaultValue": "Joe's Charter Buses",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "contractors?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "ContractorId"
					}
				},
				{
					"field": "FuelCapacity",
					get title()
					{
						return `Fuel Capacity(${tf.measurementUnitConverter.isImperial() ? "gal" : "l"})`;
					},
					"UnitOfMeasureSupported": true,
					get UnitTypeOfMeasureSupported()
					{
						return tf.measurementUnitConverter.MeasurementUnitTypeEnum.GallonToLiter;
					},
					"type": "Number",
					"defaultValue": "22",
					"editType": {
						"format": "Number",
						"maxLength": 10
					}
				},
				{
					"field": "PurchaseDate",
					"title": "Purchase Date",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "SalvageDate",
					"title": "Salvage Date",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "PurchasePrice",
					"title": "Purchase Price",
					"type": "Number",
					"format": "Money",
					"defaultValue": "4800",
					"editType": {
						"format": "Money",
						"maxLength": 8
					}
				},
				{
					"field": "SalvageValue",
					"title": "Salvage Value",
					"type": "Number",
					"format": "Money",
					"defaultValue": "2000",
					"editType": {
						"format": "Money",
						"maxLength": 20
					}
				},
				{
					"field": "PurchaseOdometer",
					"title": "Purchase Odometer",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"defaultValue": "100000",
					"editType": {
						"format": "Number",
						"maxLength": 20
					}
				},
				{
					"field": "SalvageOdometer",
					"title": "Salvage Odometer",
					"UnitOfMeasureSupported": true,
					"type": "Number",
					"defaultValue": "200000",
					"editType": {
						"format": "Number",
						"maxLength": 20
					}
				},
				{
					"field": "RegisNum",
					"title": "Registration Num",
					"type": "String",
					"defaultValue": "4293747242",
					"editType": {
						"format": "String",
						"maxLength": 20
					}
				},
				{
					"field": "RegisExp",
					"title": "Registration Expires",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "InsuranceNum",
					"title": "Insurance Num",
					"type": "String",
					"defaultValue": "1902839423947",
					"editType": {
						"format": "String",
						"maxLength": 20
					}
				},
				{
					"field": "InsuranceExp",
					"title": "Insurance Expires",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "StateInspection",
					"title": "State Inspection",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "InspectionExp",
					"title": "State Inspection Expires",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "EmmissInsp",
					"title": "Emissions Inspection",
					"type": "Date",
					"defaultValue": today,
					"editType": {
						"format": "Date"
					}
				},
				{
					"field": "RecordPicture",
					"title": "Picture",
					"type": "RecordPicture",
					"defaultValue": false,
					"min-height": "2"
				},
				{
					"field": "ComparativeAnalysis",
					"title": "Comparative Analysis",
					"type": "Boolean",
					"defaultValue": "False",
					"displayValue": "Disabled",
					"positiveLabel": "Enabled",
					"negativeLabel": "Disabled",
					"editType": {
						"format": "BooleanDropDown"
					}
				},
				{
					"field": "VendorName",
					"entityFieldName": "VendorName",
					"title": "Vendor",
					"type": "String",
					"editType": {
						"format": "DropDown",
						"maxLength": 200,
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfvendors?@fields=ID,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["ID"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "VendorId"
					},
				},
			],
			"Equipment": [
				{
					"field": "YearMade",
					"title": "Year Manufactured",
					"type": "Number",
					"defaultValue": "2018",
					"editType": {
						"format": "Integer",
						"maxLength": 4
					}
				},
				{
					"field": "Model",
					"title": "Model",
					"type": "String",
					"defaultValue": "Thomas",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclemodels?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "ModelId"
					}
				},
				{
					"field": "MakeChassis",
					"title": "Make of Chassis",
					"type": "String",
					"defaultValue": "Thomas",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclemakes?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "MakeChassisId"
					}
				},
				{
					"field": "MakeBody",
					"title": "Make of Body",
					"type": "String",
					"defaultValue": "Thomas",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclemakeofbodies?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "MakeBodyId"
					}
				},
				{
					"field": "BodyType",
					"title": "Body Type",
					"type": "String",
					"defaultValue": "Bus",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclebodytypes?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "BodyTypeId"
					}
				},
				{
					"field": "BrakeType",
					"title": "Brake Type",
					"type": "String",
					"defaultValue": "Drum",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclebraketypes?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "BrakeTypeId"
					}
				},
				{
					"field": "FuelType",
					"title": "Fuel Type",
					"type": "String",
					"defaultValue": "Diesel",
					"editType": {
						"format": "DropDown",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehiclefueltypes?@fields=Id,Name")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Name"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "FuelTypeId"
					}
				},
				{
					"field": "EquipmentCodes",
					"title": "Equipment",
					"type": "String",
					"defaultValue": "Musical Instruments",
					"editType": {
						"format": "ListMover",
						"getSource": function()
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "vehicleequips?@fields=Id,Code")).then(function(result)
							{
								return result.Items.map(function(item)
								{
									return {
										'text': item["Code"],
										'value': item["Id"]
									};
								});
							});
						},
						"allowNullValue": true,
						"entityKey": "EquipmentIds",
						"relationshipKey": "Equipment"
					}
				}
			],
			"Miscellaneous": [
				// {
				// 	"field": "Map",
				// 	"title": "Map",
				// 	"type": "Map",
				// 	"min-height": "4"
				// },
				// {
				// 	"field": "File",
				// 	"title": "Documents",
				// 	"type": "File",
				// 	"defaultValue": "File list/browser",
				// 	"min-height": "3"
				// },
				{
					"field": "Comments",
					"title": "Notes",
					"type": "Note",
					"defaultValue": "Lorem ipsum dolor sit amet.",
					"editType": {
						"format": "Note"
					}
				},
				{
					"field": "Schedule",
					"title": "Schedule",
					"type": "Schedule",
					"min-height": "4"
				}
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": [
				{
					"field": "TripGrid",
					"title": "Trip Grid",
					"type": "grid",
					"url": "trip",
					"min-height": "3"
				},
				{
					"field": "ContactGrid",
					"title": "Contact Information",
					"type": "grid",
					"url": "contact",
					"min-height": "3",
					"min-width": 2
				},
				{
					"field": "DocumentGrid",
					"title": "Documents Grid",
					"type": "grid",
					"url": "document",
					"min-height": "3",
					"min-width": 2
				}
			]
		},
		"fieldtriplocation": {
			"Main": [
				{
					"field": "Name",
					"title": "Name",
					"defaultValue": "",
					"unique": true,
					"type": "string",
					"width": '150px',
					"editType": {
						"format": "String",
						"maxLength": 255
					}
				},
				{
					"field": "City",
					"title": "City",
					"defaultValue": "",
					"type": "string",
					"width": '120px',
					"editType": {
						"format": "String",
						"maxLength": 255
					}					
				},
				{
					"field": "Street",
					"title": "Street",
					"defaultValue": "",
					"type": "string",
					"width": '200px',
					"editType": {
						"format": "String",
						"maxLength": 255
					}					
				},
				{
					"field": "State",
					"title": "State",
					"type": "string",
					"editType": {
						"format": "String",
						"maxLength": 2
					}
				},
				{
					"field": "Zip",
					"title": "Zip",
					"type": "Number",
					"editType": {
						"format": "Number",
						"maxLength": 5
					}
				},
				{
					"field": "Notes",
					"title": "Notes",
					"defaultValue": "",
					"type": "string",
					"width": '200px',
					"editType": {
						"format": "Note",
						"maxLength": 255
					}
				},
			],
			"User Defined": [],
			"User Defined Group": [],
			"Grid": []
		}
	};

	function getAvailableSites(studentId)
	{
		var url = !studentId ? pathCombine(tf.api.apiPrefix(), "alternatesites?includePublicSite=true&@fields=Id,Name")
			: pathCombine(tf.api.apiPrefix(), String.format("alternatesites?studentids={0}&includePublicSite=true&@fields=Id,Name", studentId));
		return tf.promiseAjax.get(url).then(function(result)
		{
			var sites = result.Items.map(function(item)
			{
				return {
					'text': item["Name"],
					'value': item["Id"]
				};
			});
			var privateSites = sites.filter(function(s)
			{
				return s.value <= 0;
			}),
				publicSites = sites.filter(function(s)
				{
					return s.value > 0;
				});

			privateSites.unshift({ text: "Private Sites", isTitle: true });
			if (publicSites.length > 0)
			{
				publicSites.unshift({ text: "Public Sites", isTitle: true });
			}

			return [{ text: "(None)", value: -1 }].concat(privateSites.concat(publicSites));
		});
	}

	function fetchGeoCities()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingcities?@fields=Id,Name"))
			.then(function(result)
			{
				return result.Items.map(function(item) { return { text: item.Name, value: item.Name }; })
			});
	};

	function fetchGeoZipCodes()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "arcgis", "postalcodes?@fields=Name"))
			.then(function(result)
			{
				return result.Items.map(function(item) { return { "text": item.Name, "value": item.Name }; })
			});
	};

	function fetchMailingZipCodes()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingpostalcodes?@fields=Id,Postal"))
			.then(function(result)
			{
				return result.Items.map(function(item) { return { text: item.Postal, value: item.Id }; })
			});
	};

	// different from fetch geo cities in value property.
	function fetchMailingCities()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingcities?@fields=Id,Name"))
			.then(function(result)
			{
				return result.Items.map(function(item) { return { text: item.Name, value: item.Id }; });;
			});
	};

	function fetchMailingStates()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "mailingstates?@sort=Name&@fields=Id,Name"))
			.then(result => result.Items.map(item => ({
				text: item.Name,
				value: item.Id
			})));
	}

	function fetchDefaultGenders()
	{
		return Promise.resolve([
			{ text: "Female", value: "F" },
			{ text: "Male", value: "M" },
		]);
	}

	function getGeoAddressInnerFields()
	{
		return [{
			title: "GEOCODE ST",
			field: "GeoStreet",
			class: "left-align one-half",
			row: 1
		}, {
			title: "GEOCODE POSTAL CODE",
			field: "GeoZip",
			class: "right-align one-half",
			row: 1,
		}, {
			title: "GEOCODE CITY/TOWN",
			field: "GeoCity",
			class: "left-align one-half",
			row: 2,
		}, {
			title: "GEOCONFIDENCE",
			field: "GeoConfidence",
			class: "right-align one-half",
			row: 2
		}];
	};
})();