(function()
{
	createNamespace('TF.Control').EditFieldTripTemplateRecordViewModel = EditFieldTripTemplateRecordViewModel;

	function EditFieldTripTemplateRecordViewModel(configType, recordEntity)
	{
		let self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.call(self, configType, recordEntity);
		let entity = recordEntity || {};

		self.isStrictDestination = tf.fieldTripConfigsDataHelper.fieldTripConfigs.StrictDest;
		self.isStrictAccountCodes = tf.fieldTripConfigsDataHelper.fieldTripConfigs.StrictAcctCodes;

		self.entity = entity;

		self.obTemplateName = ko.observable(entity.Name);
		self.obInactive = ko.observable(Boolean(entity.TemplateStatus));
		//#region Main

		self.obFieldTripName = ko.observable(entity.FieldTripName);
		self.obSchoolList = ko.observableArray();
		self.obSelectedSchool = ko.observable();
		self.obSelectedSchoolText = ko.computed(function()
		{
			return (self.obSelectedSchool() || {}).value;
		});

		self.obDepartmentList = ko.observableArray();
		self.obSelectedDepartment = ko.observable();
		self.obSelectedDepartmentText = ko.computed(function()
		{
			return (self.obSelectedDepartment() || {}).value;
		});

		self.obActivityList = ko.observableArray();
		self.obSelectedActivity = ko.observable();
		self.obSelectedActivityText = ko.computed(function()
		{
			return (self.obSelectedActivity() || {}).value;
		});

		self.obFieldTripContact = ko.observable(entity.FieldTripContact);
		self.obContactPhone = ko.observable(entity.ContactPhone);
		self.obContactPhoneExt = ko.observable(entity.ContactPhoneExt);
		self.obContactEmail = ko.observable(entity.ContactEmail);

		self.obEquipmentList = ko.observableArray();
		self.obSelectedEquipment = ko.observable();
		self.obSelectedEquipmentText = ko.computed(function()
		{
			return (self.obSelectedEquipment() || {}).value;
		});

		self.obClassificationList = ko.observableArray();
		self.obSelectedClassification = ko.observable();
		self.obSelectedClassificationText = ko.computed(function()
		{
			return (self.obSelectedClassification() || {}).value;
		});

		self.obNumofStudents = ko.observable(entity.NumberOfStudents);
		self.obNumofAdults = ko.observable(entity.NumberOfAdults);
		self.obNumofWheelChairs = ko.observable(entity.NumberOfWheelChairs);
		self.obNumofVehicles = ko.observable(entity.NumberOfVehicles);
		self.obEstimatedDistance = ko.observable(tf.measurementUnitConverter.convert({
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			value: entity.EstimatedDistance,
		}));
		self.obEstimatedCost = ko.observable(entity.EstimatedCost);
		self.obEstimatedHours = ko.observable(entity.EstimatedHours);

		self.obFieldTripAccounts = ko.observableArray([]);
		self.obSelectedAccount = ko.observable();
		self.obSelectedAccountText = ko.computed(function()
		{
			return (self.obSelectedAccount() || {}).value;
		});
		//#endregion

		//#region Destination

		self.obDepartureList = ko.observableArray();
		self.obSelectedDeparture = ko.observable();
		self.obSelectedDepartureText = ko.computed(function()
		{
			return (self.obSelectedDeparture() || {}).value;
		});

		self.obDepartureNote = ko.observable(entity.DepartureNotes);

		self.obDestinationList = ko.observableArray();
		self.obSelectedDestination = ko.observable();
		self.obSelectedDestinationText = ko.computed(function()
		{
			return (self.obSelectedDestination() || {}).value;
		});

		self.obDestinationStreet = ko.observable(entity.DestinationStreet);
		self.obDestinationCityList = ko.observableArray();
		self.obDestinationCity = ko.observable(entity.DestinationCity);
		self.obDestinationState = ko.observable(entity.DestinationState);
		self.obDestinationZip = ko.observable(entity.DestinationZip);
		self.obDestinationZipList = ko.observableArray();
		self.obDestinationContact = ko.observable(entity.DestinationContact);
		self.obDestinationTitle = ko.observable(entity.DestinationContactTitle);
		self.obDestinationPhone = ko.observable(entity.DestinationContactPhone);
		self.obDestinationPhoneExt = ko.observable(entity.DestinationPhoneExt);
		self.obDestinationFax = ko.observable(entity.DestinationFax);
		self.obDestinationEmail = ko.observable(entity.DestinationEmail);
		self.obDestinationNote = ko.observable(entity.DestinationNotes);
		self.obDirections = ko.observable(entity.DirectionNotes);

		//#endregion

		//#region Billing

		self.obBillingClassificationList = ko.observableArray();
		self.obSelectedBillingClassification = ko.observable();
		self.obSelectedBillingClassificationText = ko.computed(function()
		{
			return (self.obSelectedBillingClassification() || {}).value;
		});

		self.obFuelConsumptionRate = ko.observable(tf.measurementUnitConverter.convert({
			originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			value: entity.FuelConsumptionRate,
			isReverse: true,
		}),);
		self.obAideFixedCost = ko.observable(entity.AideFixedCost);
		self.obTripFixedCost = ko.observable(entity.FixedCost);
		self.obDriverFixedCost = ko.observable(entity.DriverFixedCost);
		self.obVehFixedCost = ko.observable(entity.VehFixedCost);
		self.obMinimumCost = ko.observable(entity.MinimumCost);
		self.obDriverRate = ko.observable(entity.DriverRate);
		self.obDriverOTRate = ko.observable(entity.DriverOTRate);
		self.obAideRate = ko.observable(entity.AideRate);
		self.obAideOTRate = ko.observable(entity.AideOTRate);
		self.obBillingNotes = ko.observable(entity.BillingNotes);

		self.obInvoiceCount = ko.observable();

		self.obSelectedInvoices = ko.observableArray([]);

		self.obDeletingInvoices = ko.observableArray([]);

		self.obUpdateingInvoices = ko.observableArray([]);

		//#endregion

		self.obNotes = ko.observable(entity.Notes);

		//#region Documents

		self.obDocumentCount = ko.observable();

		self.obSelectedDocuments = ko.observableArray([]);

		self.obDeletingDocuments = ko.observableArray([]);

		self.obUpdatingDocuments = ko.observableArray([]);

		//#endregion
	}

	EditFieldTripTemplateRecordViewModel.prototype = Object.create(TF.Control.EditFieldTripConfigRecordViewModelBase.prototype);

	EditFieldTripTemplateRecordViewModel.prototype.constructor = EditFieldTripTemplateRecordViewModel;

	EditFieldTripTemplateRecordViewModel.prototype.init = function(viewModel, el)
	{
		var self = this;
		TF.Control.EditFieldTripConfigRecordViewModelBase.prototype.init.call(self, viewModel, el);

		self.obSelectedSchool.subscribe(function(data)
		{
			self.handleDepartmentActivityCombinations((data || {}).key);
		});

		self.initializeValidator();

		self.$element.find(".tab .tab-header > div").on("click", function(e)
		{
			if (!$(e.currentTarget).hasClass("active"))
			{
				$(e.currentTarget).siblings().removeClass("active");
				$(e.currentTarget).addClass("active");
				let index = $(e.currentTarget).parent(".tab-header").find(">div").index($(e.currentTarget));
				self.$element.find(".tab .tab-panel > div").hide();
				self.$element.find(".tab .tab-panel > div").eq(index).show();
			}
		});

		self.documentClassificationPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentClassifications")).then(r => (r && r.Items || []).map(({ Id, Name }) => ({ key: Id, value: Name })));

		Promise.all([
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schools"), { paramData: { "@fields": "Name,SchoolCode" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DistrictDepartments"), { paramData: { "@fields": "Name,Id" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripActivities"), { paramData: { "@fields": "Name,Id" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripClassifications"), { paramData: { "@fields": "Code,Id" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripEquipments"), { paramData: { "@fields": "EquipmentName,Id" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripBillingClassifications")),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripDestinations")),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "MailingCities"), { paramData: { "@fields": "Id,Name" } }),
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "MailingPostalCodes"), { paramData: { "@fields": "Id,Postal" } }),
			self.isEdit ? tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documents"), {
				paramData: {
					"@relationships": "FieldTripTemplate,DocumentClassification,LastUpdatedName,DocumentRelationship",
					"@fields": "Id,FileName,DocumentClassificationName,Attached,FileSizeKB,LastUpdated,LastUpdatedName",
					attachedToTypeID: self.getDataTypeIdOfFieldTripTemplate(),
					attachedToID: self.entity.Id
				}
			}) : Promise.resolve({ Items: [] }),
			self.isEdit ? tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripInvoiceTemplates"), {
				paramData: {
					"@relationships": "FieldTripAccount",
					"@filter": `eq(FieldTripTemplateId,${self.entity.Id})`
				}
			}) : Promise.resolve({ Items: [] }),
			self.isStrictAccountCodes ? tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"), {
				paramData: {
					"@relationships": "Activity,Department",
				}
			}) : Promise.resolve({ Items: [] })
		]).then(values => values.map(v => v.Items)).then(function(
			[schools, districtDepartments, activities, classifications, equipments, billingClassifications, destinations, cities, postalCodes, documents, invocies, fieldTripAccounts])
		{
			self.fieldTripAccounts = fieldTripAccounts;

			self.obSchoolList(schools.map(({ Name, SchoolCode }) => ({ key: SchoolCode, value: Name })));
			self.obSelectedSchool(self.obSchoolList().find(x => x.key === self.entity.School));

			self.obDepartmentList(districtDepartments.map(({ Name, Id }) => ({ key: Id, value: Name })));
			self.obSelectedDepartment(self.obDepartmentList().find(x => x.key === self.entity.DistrictDepartmentId));

			self.obActivityList(activities.map(({ Name, Id }) => ({ key: Id, value: Name })));
			self.obSelectedActivity(self.obActivityList().find(x => x.key === self.entity.FieldTripActivityId));

			self.obEquipmentList(equipments.map(({ EquipmentName, Id }) => ({ key: Id, value: EquipmentName })));
			self.obSelectedEquipment(self.obEquipmentList().find(x => x.key === self.entity.FieldTripEquipmentId));

			self.obClassificationList(classifications.map(({ Code, Id }) => ({ key: Id, value: Code })));
			self.obSelectedClassification(self.obClassificationList().find(x => x.key === self.entity.FieldTripClassificationId));

			self.obDepartureList(schools.map(({ Name, SchoolCode }) => ({ key: SchoolCode, value: Name })));
			self.obSelectedDeparture(self.obDepartureList().find(x => x.key === self.entity.DepartFromSchool));

			self.obDestinationList(destinations.map(({ Name, Id, ...others }) => ({ key: Id, value: Name, ...others })));
			self.obSelectedDestination(self.obDestinationList().find(x => x.key === self.entity.FieldTripDestinationId));
			self.editedDestinationCollection = {};
			self.obSelectedDestination.subscribe(function(v)
			{
				if (v)
				{
					self.editedDestinationCollection[v.key] = {
						Street: self.obDestinationStreet(),
						City: self.obDestinationCity(),
						State: self.obDestinationState(),
						Zip: self.obDestinationZip(),
						Contact: self.obDestinationContact(),
						ContactTitle: self.obDestinationTitle(),
						Phone: self.obDestinationPhone(),
						PhoneExt: self.obDestinationPhoneExt(),
						Fax: self.obDestinationFax(),
						Email: self.obDestinationEmail(),
						Notes: self.obDestinationNote(),
					};
				}
			}, null, "beforeChange");
			self.obSelectedDestination.subscribe(function(v)
			{
				if (v)
				{
					v = self.editedDestinationCollection[v.key] || v;
					self.obDestinationStreet(v.Street);
					self.obDestinationCity(v.City);
					self.obDestinationState(v.State);
					self.obDestinationZip(v.Zip);
					self.obDestinationContact(v.Contact);
					self.obDestinationTitle(v.ContactTitle);
					self.obDestinationPhone(v.Phone);
					self.obDestinationPhoneExt(v.PhoneExt);
					self.obDestinationFax(v.Fax);
					self.obDestinationEmail(v.Email);
					self.obDestinationNote(v.Notes);
				}
			});
			self.obSelectedDestination.extend({ rateLimit: 200 });

			self.obDestinationCityList(cities.map(({ Name, Id }) => ({ key: Id, value: Name })));
			self.obDestinationZipList(postalCodes.map(({ Postal, Id }) => ({ key: Id, value: Postal })));

			self.obBillingClassificationList(billingClassifications.map(({ Classification, Id, ...others }) =>
			{
				others.FuelConsumptionRate && (others.FuelConsumptionRate = tf.measurementUnitConverter.convert({
					originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
					targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
					value: others.FuelConsumptionRate,
					isReverse: true,
				}));
				return { key: Id, value: Classification, ...others };
			}));
			self.obSelectedBillingClassification(self.obBillingClassificationList().find(x => x.key === self.entity.BillingClassificationId));
			self.editedBillingClassificationCollection = {};
			self.obSelectedBillingClassification.subscribe(function(v)
			{
				if (v)
				{
					self.editedBillingClassificationCollection[v.key] = {
						FuelConsumptionRate: self.obFuelConsumptionRate(),
						AideFixedCost: self.obAideFixedCost(),
						FixedCost: self.obTripFixedCost(),
						DriverFixedCost: self.obDriverFixedCost(),
						VehFixedCost: self.obVehFixedCost(),
						MinimumCost: self.obMinimumCost(),
						DriverRate: self.obDriverRate(),
						DriverOTRate: self.obDriverOTRate(),
						AideRate: self.obAideRate(),
						AideOTRate: self.obAideOTRate(),
					};
				}
			}, null, "beforeChange");
			self.obSelectedBillingClassification.subscribe(function(v)
			{
				if (v)
				{
					v = self.editedBillingClassificationCollection[v.key] || v;
					self.obFuelConsumptionRate(v.FuelConsumptionRate);
					self.obAideFixedCost(v.AideFixedCost);
					self.obTripFixedCost(v.FixedCost);
					self.obDriverFixedCost(v.DriverFixedCost);
					self.obVehFixedCost(v.VehFixedCost);
					self.obMinimumCost(v.MinimumCost);
					self.obDriverRate(v.DriverRate);
					self.obDriverOTRate(v.DriverOTRate);
					self.obAideRate(v.AideRate);
					self.obAideOTRate(v.AideOTRate);
				}
			});
			self.obSelectedBillingClassification.extend({ rateLimit: 200 });

			if ([0, 1].includes(self.entity.InvoiceAmountType))
			{
				self.$element.find(`[name="amountbasis"][value=${self.entity.InvoiceAmountType}]`).prop("checked", true);
			}

			self.obDocumentCount(documents.length);

			self.$element.find(".document .kendo-grid.grid-container").kendoGrid({
				columns: [
					{ field: "FileName", title: `File Name`, width: "200px" },
					{ field: "Description", title: "Description", width: "150px" },
					{ field: "DocumentClassificationName", title: "Classification", width: "150px" },
					{ field: "Attached", title: "Attached", width: "100px" },
					{ field: "FileSizeKB", title: "Size(KB)", width: "100px" },
					{ field: "LastUpdated", title: "Last Updated", width: "250px" },
					{ field: "LastUpdatedName", title: "Last Updated By", width: "150px" },
				],
				height: 400,
				dataSource: documents.map(x => ({ ...x, Attached: 1, LastUpdated: moment(x.LastUpdated).format("MM/DD/YYYY") })),
				scrollable: true,
				sortable: false,
				selectable: "multiple",
				change: function(e)
				{
					var selectedRows = this.select();
					self.obSelectedDocuments(Array.from(selectedRows).map(row => this.dataItem(row)))
				}
			});

			self.obInvoiceCount(invocies.length);
			self.$element.find(".billing .kendo-grid.grid-container").kendoGrid({
				columns: [
					{ field: "AccountName", title: `Account Name`, width: "60%" },
					{
						field: "Amount", title: "Amount", width: "40%", template: '#= kendo.toString(kendo.parseFloat(Amount), "n") #'
					},
				],
				height: 300,
				dataSource: invocies,
				scrollable: true,
				sortable: false,
				selectable: "multiple",
				change: function(e)
				{
					var selectedRows = this.select();
					self.obSelectedInvoices(Array.from(selectedRows).map(row => this.dataItem(row)))
				}
			});
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.handleDepartmentActivityCombinations = function(schoolCode)
	{
		let self = this;

		if (!schoolCode)
		{
			self.obFieldTripAccounts([]);
			self.obSelectedAccount(null);
		}
		else
		{
			let accounts = self.fieldTripAccounts.filter(({ School, DepartmentId }) => schoolCode === School && !DepartmentId);

			let groups = _.groupBy(accounts, function(account)
			{
				return `${account.School}_____****_____${account.DepartmentId || -1}_____$$$_____${account.FieldTripActivityId || -1}`;
			});

			self.obFieldTripAccounts(Object.values(groups).reduce(function(acc, [{ Id, DepartmentId, DepartmentName, FieldTripActivityId, FieldTripActivityName }])
			{
				return acc.concat({ key: Id, value: `${DepartmentId ? DepartmentName : "[Any]"} / ${FieldTripActivityId ? FieldTripActivityName : "[Any]"}`, DepartmentId, FieldTripActivityId })
			}, []));

			let selectedAccount = self.obFieldTripAccounts().find(function({ DepartmentId, FieldTripActivityId })
			{
				return DepartmentId && FieldTripActivityId && self.entity.FieldTripDepartment && self.entity.FieldTripDepartment.Id === DepartmentId && self.entity.FieldTripActivityId === FieldTripActivityId;
			});

			if (selectedAccount)
			{
				self.obSelectedAccount(selectedAccount);
			}
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.getDataTypeIdOfFieldTripTemplate = function()
	{
		return tf.dataTypeHelper._getObjectByType("fieldtriptemplate").id;
	};

	EditFieldTripTemplateRecordViewModel.prototype.initializeValidator = function()
	{
		let validatorFields = {}, self = this, isValidating = false,
			updateValidationMessage = function($field)
			{
				if (!isValidating)
				{
					isValidating = true;
					self.pageLevelViewModel.saveValidate($field);
					isValidating = false;
				}
			};

		self.$element.find("input[data-tf-input-type=Email]").each(function(n, field)
		{
			var name = $(field).attr("name");
			if (validatorFields[name] && validatorFields[name].validators)
			{
				validatorFields[name].validators.emailAddress = {
					message: " invalid email"
				};
			}
			else
			{
				validatorFields[name] = {
					trigger: "blur change",
					validators: {
						emailAddress: {
							message: " invalid email"
						}
					}
				};
			}
		});

		validatorFields["Name"] = {
			trigger: "change",
			validators: {
				callback: {
					callback: function(value)
					{
						if (!(value || "").trim())
						{
							return Promise.resolve({ valid: false, message: "required" });
						}

						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripTemplates"), { paramData: { "@fields": "Id,Name" } }).then(function(response)
						{
							let existingItems = response.Items.filter(x => x.Id !== self.entity.Id);

							let isInvalid = existingItems.some(function(item) { return item.Name === value.trim() });

							return { valid: !isInvalid, message: "already exists" };
						});
					}
				}
			}
		};

		return self.$element.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('error.validator.bv', function(e, data)
		{
			data.element
				.data('bv.messages')
				.find('.help-block[data-bv-for="' + data.field + '"]').hide()
				.filter('[data-bv-validator="' + data.validator + '"]').show();
		}).on('success.field.bv', function(e, data)
		{
			updateValidationMessage(data.element);
			var $parent = data.element.closest('.form-group');
			$parent.removeClass('has-success');
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.onAddInvoice = function()
	{
		let self = this;
		tf.modalManager.showModal(new TF.Control.EditFieldTripTemplateInvoiceModalViewModel()).then(function(invoices)
		{
			if (!!invoices)
			{
				let invoiceGrid = self.$element.find(".billing .kendo-grid.grid-container").data("kendoGrid");

				let latestDatasource = (invoiceGrid._data || []).concat(invoices);
				invoiceGrid.setDataSource(latestDatasource);
				self.obInvoiceCount(latestDatasource.length);
			}
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.onEditInvoice = function(viewmodel, e)
	{
		let self = this;
		if ($(e.currentTarget).hasClass("enable"))
		{
			var tobeEditedItem = self.obSelectedInvoices()[0];
			tf.modalManager.showModal(new TF.Control.EditFieldTripTemplateInvoiceModalViewModel(tobeEditedItem)).then(function(editedItem)
			{
				if (editedItem)
				{
					tobeEditedItem.set("AccountName", editedItem.AccountName);
					tobeEditedItem.set("Amount", editedItem.Amount);
					tobeEditedItem.set("FieldTripAccountId", editedItem.FieldTripAccountId);

					self.obSelectedInvoices([]);
					self.obUpdateingInvoices([...new Set(self.obUpdateingInvoices().concat(tobeEditedItem))]);
				}
			});
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.onDeleteInvoice = function(viewmodel, e)
	{
		let self = this;
		if ($(e.currentTarget).hasClass("enable"))
		{
			let invoiceGrid = self.$element.find(".billing .kendo-grid.grid-container").data("kendoGrid");
			let latestDatasource = (invoiceGrid._data || []).filter(x => !self.obSelectedInvoices().includes(x));
			self.obInvoiceCount(latestDatasource.length);
			invoiceGrid.setDataSource(latestDatasource);

			self.obDeletingInvoices(self.obDeletingInvoices().concat(self.obSelectedInvoices().filter(x => !!x.Id)));
			self.obSelectedInvoices([]);
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.onAddDocument = function(viewmodel, e)
	{
		let self = this,
			documentGrid = self.$element.find(".document .kendo-grid.grid-container").data("kendoGrid");

		function getCurrentUserName(user)
		{
			if (!user.FirstName) return user.LastName;

			if (!user.LastName) return user.FirstName;

			return `${user.FirstName}, ${user.LastName}`;
		}

		self.documentClassificationPromise.then(documentClassifications =>
		{
			tf.modalManager.showModal(new TF.Control.EditFieldTripTemplateDocumentModalViewModel(undefined, documentClassifications)).then(function(documents)
			{
				if (documents && documents.length > 0)
				{
					let latestDatasource = (documentGrid._data || []).concat(documents.map(({ name, size, description, classification, Attached, ...others }) =>
					({
						FileName: name,
						FileSizeKB: (size / 1024).toFixed(2),
						DocumentClassificationName: classification.value,
						Description: description,
						LastUpdated: moment().format("MM/DD/YYYY"),
						LastUpdatedName: getCurrentUserName(tf.userEntity),
						Attached: Attached || 0,
						classification,
						...others
					})));
					documentGrid.setDataSource(latestDatasource);
					self.obDocumentCount(latestDatasource.length);

					self.obSelectedDocuments([]);
				}
			});
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.onEditDocument = function(viewmodel, e)
	{
		let self = this;
		if ($(e.currentTarget).hasClass("enable"))
		{
			self.documentClassificationPromise.then(documentClassifications =>
			{
				var tobeEditedItem = self.obSelectedDocuments()[0];
				tf.modalManager.showModal(new TF.Control.EditFieldTripTemplateDocumentModalViewModel(tobeEditedItem, documentClassifications)).then(function(editedItem)
				{
					if (editedItem)
					{
						tobeEditedItem.set("classification", editedItem.classification);
						tobeEditedItem.set("DocumentClassificationName", editedItem.classification.value);
						tobeEditedItem.set("Description", editedItem.description);

						self.obSelectedDocuments([]);
						self.obUpdatingDocuments([...new Set(self.obUpdatingDocuments().concat(tobeEditedItem))]);
					}
				});
			});
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.onDeleteDocument = function(viewmodel, e)
	{
		let self = this;
		if ($(e.currentTarget).hasClass("enable"))
		{
			let documentGrid = self.$element.find(".document .kendo-grid.grid-container").data("kendoGrid");
			let latestDatasource = (documentGrid._data || []).filter(x => !self.obSelectedDocuments().includes(x));
			self.obDocumentCount(latestDatasource.length);
			documentGrid.setDataSource(latestDatasource);

			self.obDeletingDocuments(self.obDeletingDocuments().concat(self.obSelectedDocuments().filter(x => x.Attached)));
			self.obSelectedDocuments([]);
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.getFileNameWithoutExtension = function(fullName)
	{
		var pattern = /\.{1}[a-z]{1,}$/;
		if (pattern.exec(fullName) !== null)
		{
			return (fullName.slice(0, pattern.exec(fullName).index));
		}
		else
		{
			return fullName;
		}
	};

	EditFieldTripTemplateRecordViewModel.prototype.getRecordEntity = function()
	{
		var self = this;

		var invoiceAmountType = self.$element.find(`[name="amountbasis"]:checked`).attr("value");

		return {
			Id: self.entity.Id,
			DBID: self.entity.DBID || tf.datasourceManager.databaseId,
			Name: self.obTemplateName().trim(),
			TemplateStatus: Number(self.obInactive()),
			// main
			FieldTripName: self.obFieldTripName(),
			School: self.obSelectedSchool() && self.obSelectedSchool().key,
			DistrictDepartmentId: self.isStrictAccountCodes ? self.obSelectedAccount() && self.obSelectedAccount().DepartmentId : self.obSelectedDepartment() && self.obSelectedDepartment().key,
			FieldTripActivityId: self.isStrictAccountCodes ? self.obSelectedAccount() && self.obSelectedAccount().FieldTripActivityId : self.obSelectedActivity() && self.obSelectedActivity().key,

			FieldTripContact: self.obFieldTripContact(),
			ContactPhone: self.obContactPhone(),
			ContactPhoneExt: self.obContactPhoneExt(),
			ContactEmail: self.obContactEmail(),
			FieldTripEquipmentId: self.obSelectedEquipment() && self.obSelectedEquipment().key,
			FieldTripClassificationId: self.obSelectedClassification() && self.obSelectedClassification().key,
			NumberOfStudents: self.obNumofStudents(),
			NumberOfAdults: self.obNumofAdults(),
			NumberOfVehicles: self.obNumofVehicles(),
			NumberOfWheelChairs: self.obNumofWheelChairs(),
			EstimatedDistance: tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				value: self.obEstimatedDistance(),
			}),
			EstimatedHours: self.obEstimatedHours(),
			EstimatedCost: self.obEstimatedCost(),

			//destination
			DepartFromSchool: self.obSelectedDeparture() && self.obSelectedDeparture().key,
			DepartureNotes: self.obDepartureNote(),

			FieldTripDestinationId: self.obSelectedDestination() && self.obSelectedDestination().key,
			Destination: self.obSelectedDestination() && self.obSelectedDestination().value,
			DestinationStreet: self.obDestinationStreet(),
			DestinationCity: self.obDestinationCity(),
			DestinationState: self.obDestinationState(),
			DestinationZip: self.obDestinationZip(),

			DestinationContact: self.obDestinationContact(),
			DestinationContactTitle: self.obDestinationTitle(),
			DestinationContactPhone: self.obDestinationPhone(),
			DestinationPhoneExt: self.obDestinationPhoneExt(),
			DestinationFax: self.obDestinationFax(),
			DestinationEmail: self.obDestinationEmail(),
			DestinationNotes: self.obDestinationNote(),
			DirectionNotes: self.obDirections(),

			//#endregion

			//billing
			BillingClassificationId: self.obSelectedBillingClassification() && self.obSelectedBillingClassification().key,
			FuelConsumptionRate: tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				value: self.obFuelConsumptionRate(),
				isReverse: true,
			}),
			AideFixedCost: self.obAideFixedCost(),
			FixedCost: self.obTripFixedCost(),
			DriverFixedCost: self.obDriverFixedCost(),
			VehFixedCost: self.obVehFixedCost(),
			MinimumCost: self.obMinimumCost(),
			DriverRate: self.obDriverRate(),
			DriverOTRate: self.obDriverOTRate(),
			AideRate: self.obAideRate(),
			AideOTRate: self.obAideOTRate(),
			BillingNotes: self.obBillingNotes(),
			InvoiceAmountType: invoiceAmountType ? Number(invoiceAmountType) : null,

			//notes
			Notes: self.obNotes()
		};
	};

	EditFieldTripTemplateRecordViewModel.prototype.save = function()
	{
		var self = this;

		return self.pageLevelViewModel.saveValidate()
			.then(function(result)
			{
				var configType = self.configType,
					isNew = self.obRecordId() === -1;

				return Promise.resolve(self.getRecordEntity()).then(function(recordEntity)
				{
					if (result && recordEntity)
					{
						var saveActionPromise = (isNew ? tf.fieldTripConfigsDataHelper.addNewConfigRecordByType(configType, recordEntity) : tf.fieldTripConfigsDataHelper.updateConfigRecordByType(configType, recordEntity));
						return saveActionPromise;
					}

					return null;
				});
			}).then(function(fieldtriptemplate)
			{
				if (!fieldtriptemplate) return false;

				return Promise.all([
					self.attachDocument(fieldtriptemplate),
					self.detachDocument(fieldtriptemplate),
					self.updateDocument(),
					self.addInvoice(fieldtriptemplate),
					self.deleteInvoice(),
					self.updateInvoice()
				]).then(() => true);
			});
	};

	EditFieldTripTemplateRecordViewModel.prototype.updateDocument = function()
	{
		let self = this;

		// new added documents will be handled in attachDocument flow
		let tobeUpdated = self.obUpdatingDocuments().filter(x => !!x.Attached);

		if (!tobeUpdated.length) return Promise.resolve();

		return Promise.all(tobeUpdated.map(x =>
		{
			return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), "Documents"), {
				paramData: {
					Id: x.Id
				},
				data: [
					{ "op": "replace", "path": "/Description", "value": x.Description },
					{ "op": "replace", "path": "/DocumentClassificationID", "value": x.classification.key }
				]
			});
		}));
	};

	EditFieldTripTemplateRecordViewModel.prototype.attachDocument = function(fieldtriptemplate)
	{
		let self = this;
		let documentGrid = self.$element.find(".document .kendo-grid.grid-container").data("kendoGrid"),
			documents = documentGrid._data.filter(x => !x.Attached);

		if (!documents.length) return Promise.resolve();

		return Promise.all(documents.map(document =>
		{
			let helper = new TF.UploadHelper({
				maxFileByteSize: TF.DetailView.UploadDocumentHelper.maxFileByteSize,
				acceptFileExtensions: TF.DetailView.UploadDocumentHelper.acceptFileExtensions,
			});

			var $fileSelector = helper.createFileSelector("document-file-selector");
			helper.init($fileSelector);

			helper.selectFile(document.originalFile);
			return helper.upload().then(value => ({ tempFileName: value, ...document }));
		})).then(function(values)
		{
			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint("document")), {
				data: values.map(d =>
				{
					return {
						MimeType: d.originalFile.type,
						FileName: d.originalFile.name,
						FileSizeKB: (d.originalFile.size / 1024).toFixed(2),
						Description: d.Description,
						TempFileName: d.tempFileName,
						Name: self.getFileNameWithoutExtension(d.originalFile.name),
						DocumentClassificationID: d.classification.key
					}
				})
			}).then(function(response)
			{
				let documentIds = response && response.Items && response.Items.map(x => x.Id) || [];

				return tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentRelationships"), {
					data: documentIds.map(function(id)
					{
						return {
							DocumentID: id,
							DBID: fieldtriptemplate.DBID,
							AttachedToType: self.getDataTypeIdOfFieldTripTemplate(),
							AttachedToID: fieldtriptemplate.Id
						}
					})
				})
			});
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.detachDocument = function(fieldtriptemplate)
	{
		let self = this;

		let documentRelationshipIds = self.obDeletingDocuments().map(x => (x.DocumentRelationships.filter(y => y.AttachedToID === fieldtriptemplate.Id)[0] || {}).DocumentRelationshipID).filter(Boolean);

		if (!documentRelationshipIds.length) return Promise.resolve();

		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentRelationships"), {
			data: [... new Set(documentRelationshipIds)]
		});
	};

	EditFieldTripTemplateRecordViewModel.prototype.addInvoice = function(fieldtriptemplate)
	{
		let self = this,
			invoiceGrid = self.$element.find(".billing .kendo-grid.grid-container").data("kendoGrid"),
			newInvoices = invoiceGrid._data.filter(x => !x.Id);

		if (!newInvoices.length) return Promise.resolve();

		return Promise.all(newInvoices.map(({ FieldTripAccountId, Amount }) => tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "fieldtripinvoicetemplates"), {
			data: [{
				FieldTripTemplateId: fieldtriptemplate.Id,
				FieldTripAccountId,
				Amount
			}]
		})));
	};

	EditFieldTripTemplateRecordViewModel.prototype.updateInvoice = function()
	{
		let self = this;

		// new added invoice will be handled in addInvoice flow
		let tobeUpdated = self.obUpdateingInvoices().filter(x => !!x.Id);

		if (!tobeUpdated.length) return Promise.resolve();

		return Promise.all(tobeUpdated.map(x =>
		{
			return tf.promiseAjax.patch(pathCombine(tf.api.apiPrefix(), "fieldtripinvoicetemplates"), {
				paramData: {
					Id: x.Id
				},
				data: [
					{ "op": "replace", "path": "/FieldTripAccountId", "value": x.FieldTripAccountId },
					{ "op": "replace", "path": "/Amount", "value": x.Amount }
				]
			});
		}));
	};

	EditFieldTripTemplateRecordViewModel.prototype.deleteInvoice = function()
	{
		let self = this,
			ids = self.obDeletingInvoices().map(({ Id }) => Id);

		if (!ids.length) return Promise.resolve();

		return tf.promiseAjax.delete(pathCombine(tf.api.apiPrefix(), "FieldTripInvoiceTemplates"), {
			paramData: {
				"@filter": `in(Id, ${ids.join()})`
			}
		});
	};
})();