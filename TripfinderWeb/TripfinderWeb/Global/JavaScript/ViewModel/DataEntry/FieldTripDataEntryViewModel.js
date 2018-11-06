(function()
{
	var namespace = createNamespace("TF.DataEntry");

	namespace.FieldTripDataEntryViewModel = FieldTripDataEntryViewModel;

	function FieldTripDataEntryViewModel(ids, view)
	{
		$.extend(this, new TF.Helper.FieldTripResourcesHelper());

		this.pageLevelViewModel = new TF.PageLevel.FieldTripDataEntryPageLevelViewModel(this);
		namespace.BaseDataEntryViewModel.call(this, ids, view);

		this.fieldTripSettings = null;
		this.initializationFrontdesk = new TF.InitializationFrontdesk(1, this.initialize);
		this.dataModelType = TF.DataModel.FieldTripDataModel;
		this.fieldTripDistrictDepartments = [];
		this.pageType = "fieldtripde";
		this.obTitle(tf.applicationTerm.getApplicationTermSingularByName("Field Trip"));
		this.obgridTitle("FieldTrip");
		this.dataEntryTemplateName = "workspace/dataentry/fieldtrip/form";
		this.obRequiredFields = ko.observable(new TF.DataModel.FieldTripDataModel());
		this.obEntityDataModel(new TF.DataModel.FieldTripDataModel());
		this.obDepartureAndReturnDateTime = ko.observable();
		this.obDuration = ko.observable();
		this.onAuditType = ko.observable();
		this.obTemplateSource = ko.observableArray();
		this.obSchoolDataModels = ko.observableArray();
		this.obDepartmentDataModels = ko.observableArray();
		this.currentDistrictDepartmentId = null;
		this.obActivityDataModels = ko.observableArray();
		this.obFieldTripSettings = ko.observable({});
		this.obStrictDest = ko.observable(false);
		this.fieldTripAccountList = [];
		this.obClassificationDataModels = ko.observableArray();
		this.obEquipmentDataModels = ko.observableArray();
		this.obDestinationDataModels = ko.observableArray();
		this.obBillingClassificationDataModels = ko.observableArray();
		this.obFieldTripResourceGroupData = ko.observableArray();
		this.vehicleLoadFinished = false;
		this.driverLoadFinished = false;
		this.aideLoadFinished = false;

		this.obVehicleGridViewModel = ko.observable(null);
		this.obDriversGridViewModel = ko.observable(null);
		this.obBusAideGridViewModel = ko.observable(null);
		this.obVehicleGridSource = ko.observableArray(null);
		this.obDriversGridSource = ko.observableArray(null);
		this.obBusAideGridSource = ko.observableArray(null);
		this.obInvoicingGridViewModel = ko.observable(null);
		this.obTotalCost = ko.observable(0);
		this.obShowTotalCost = ko.observable(false);
		$.extend(this, new TF.Helper.FieldTripResourcesHelper());
		this.obResourcesTotalComputer = ko.computed(this.resourcesTotalComputer, this);

		this.obResourcesGridViewModel = ko.observable(null);
		this.obInvoiceResourceId = ko.observable(1);
		this.obInvoiceGridDataSource = ko.observableArray();

		this.baseDeletion = new TF.Executor.FieldtripDeletion();
		this.obNeedSaveTemplate(true);
		this.obNeedSaveAndClose(!TF.isPhoneDevice);
		this.obResourceId = ko.observable(0);

		//document
		this.obDocumentGridViewModel = ko.observable(null);
		this.obDocumentResourceId = ko.observable(1);
		this.obDocumentGridDataSource = ko.observableArray();
		this.obDocumentKendoDataSource = ko.observableArray();
		this.obPendingDocumentIdChange = ko.observable(null);
		this.obClassificationDataModels = ko.observableArray();
		this.obDocumentAdd = false;
		this.tempId = 0;
		//drop down list
		this.obSelectedTemplateSource = ko.observable();
		this.obTemplateName = ko.observable("None");
		this.obTemplateName.subscribe(this.templateClick, this);

		this.obMode.subscribe(function(value)
		{
			this.vehicleLoadFinished = false;
			this.driverLoadFinished = false;
			this.aideLoadFinished = false;
		}.bind(this));

		this.obSelectedSchool = ko.observable();
		this.obSelectedSchool.subscribe(this.setSelectValue("school", "obSelectedSchool", function(obj)
		{
			this.setAccountListBySchool(obj ? obj.SchoolCode : null);
			return obj ? obj.SchoolCode : "";
		}.bind(this)), this);
		this.obCurrentSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "school", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

		this.obSelectedDepartment = ko.observable();
		this.obSelectedDepartment.subscribe(this.setSelectValue("districtDepartmentId", "obSelectedDepartment", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentDepartmentName = ko.computed(this.setSelectTextComputer("obDepartmentDataModels", "districtDepartmentId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedActivity = ko.observable();
		this.obSelectedActivity.subscribe(this.setSelectValue("fieldTripActivityId", "obSelectedActivity", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentActivityName = ko.computed(this.setSelectTextComputer("obActivityDataModels", "fieldTripActivityId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedAccount = ko.observable();
		this.obCurrentAccountName = ko.observable("None");
		this.obSelectedAccount.subscribe(function()
		{
			if (this.obSelectedAccount().Id < 0)
			{
				this.obCurrentAccountName("None");
				this.obEntityDataModel().districtDepartmentId(null);
				this.obEntityDataModel().districtDepartmentName(null);
				this.obEntityDataModel().fieldTripActivityId(null);
				this.obEntityDataModel().fieldTripActivityName(null);
			}
			else
			{
				this.obCurrentAccountName(this.obSelectedAccount().Department.Name + ' / ' + this.obSelectedAccount().FieldTripActivity.Name);
				this.obEntityDataModel().districtDepartmentId(this.obSelectedAccount().Department.Id);
				this.obEntityDataModel().districtDepartmentName(this.obSelectedAccount().Department.Name);
				this.obEntityDataModel().fieldTripActivityId(this.obSelectedAccount().FieldTripActivity.Id);
				this.obEntityDataModel().fieldTripActivityName(this.obSelectedAccount().FieldTripActivity.Name);
			}
		}.bind(this));

		this.obSelectedClassification = ko.observable();
		this.obSelectedClassification.subscribe(this.setSelectValue("fieldTripClassificationId", "obSelectedClassification", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentClassificationName = ko.computed(this.setSelectTextComputer("obClassificationDataModels", "fieldTripClassificationId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedEquipment = ko.observable();
		this.obSelectedEquipment.subscribe(this.setSelectValue("fieldTripEquipmentId", "obSelectedEquipment", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obCurrentEquipmentName = ko.computed(this.setSelectTextComputer("obEquipmentDataModels", "fieldTripEquipmentId", function(obj) { return obj.Id; }, function(obj) { return obj.EquipmentName; }), this);

		this.obSelectedDestination = ko.observable();
		this.obSelectedDestination.subscribe(
			this.setSelectValue("destination", "obSelectedDestination", function(obj)
			{
				return obj ? obj.Name : 0;
			}), this);
		this.obCurrentDestinationName = ko.computed(this.setSelectTextComputer("obDestinationDataModels", "destination", function(obj) 
		{
			return obj.Name;
		}, function(obj) 
			{
				return obj.Name;
			}), this);
		this.obSelectedDestination.subscribe(function()
		{
			this._fieldsUpdateFromModal("destination", this.obSelectedDestination());
		}.bind(this));

		this.obSelectedDepartFromSchool = ko.observable();
		this.obSelectedDepartFromSchool.subscribe(this.setSelectValue("departFromSchool", "obSelectedDepartFromSchool", function(obj) { return obj ? obj.SchoolCode : ""; }), this);
		this.obCurrentDepartFromSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "departFromSchool", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

		this.obSelectedBillingClassification = ko.observable();
		this.obSelectedBillingClassification.subscribe(this.setSelectValue("billingClassificationId", "obSelectedBillingClassification", function(obj) { return obj ? obj.Id : 0; }), this);
		this.obSelectedBillingClassification.subscribe(function()
		{
			this._fieldsUpdateFromModal("billingClassification", this.obSelectedBillingClassification());
		}, this);
		this.obCurrentBillingClassificationName = ko.computed(this.setSelectTextComputer("obBillingClassificationDataModels", "billingClassificationId", function(obj) { return obj.Id; },
			function(obj) { return obj.Name; }), this);

		this.dataChangeReceive = this.dataChangeReceive.bind(this);
		PubSub.subscribe(topicCombine(pb.DATA_CHANGE, "school"), this.dataChangeReceive);

		this.obMailCityDataModels = ko.observableArray();
		this.obMailZipDataModels = ko.observableArray();
		this.obAccount = ko.observableArray();

		ko.computed(function()
		{
			if (this.obEntityDataModel().id() == 0 && this.obEntityDataModel().departDate())
			{
				this.obEntityDataModel().returnDate(this.obEntityDataModel().departDate());
			}
		}.bind(this));

		this.obDepartTimeDisable = ko.computed(function()
		{
			return !(this.obEntityDataModel().departDate());
		}.bind(this));
		this.obReturnTimeDisable = ko.computed(function()
		{
			return !(this.obEntityDataModel().returnDate());
		}.bind(this));

		this.resetEmpty = function(m, collection, key)
		{
			var inputValue = m.currentTarget.value;
			if (collection.indexOf(inputValue) == -1)
			{
				$(m.currentTarget).val('');
				this.obEntityDataModel()[key]('');
			}
		}.bind(this);

		this.schoolDisable = function() { return this.obCurrentSchoolName() == ''; };

		this.schoolCss = function() { return this.schoolDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.schoolOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obSchoolDataModels(), 'Name');
			this.resetEmpty(m, collection, 'school');
		}.bind(this);

		this.departmentDisable = function() { return this.obCurrentDepartmentName() == ''; };

		this.departmentCss = function() { return this.departmentDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.departmentOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obDepartmentDataModels(), 'Name');
			this.resetEmpty(m, collection, 'districtDepartmentId');
		}.bind(this);

		this.activityDisable = function() { return this.obCurrentActivityName() == ''; };

		this.activityCss = function() { return this.activityDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.activityOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obActivityDataModels(), 'Name');
			this.resetEmpty(m, collection, 'fieldTripActivityId');
		}.bind(this);

		this.classificationDisable = function() { return this.obCurrentClassificationName() == ''; };

		this.classificationCss = function() { return this.classificationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.classificationOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obClassificationDataModels(), 'Name');
			this.resetEmpty(m, collection, 'fieldTripClassificationId');
		}.bind(this);

		this.equipmentDisable = function() { return this.obCurrentEquipmentName() == ''; };

		this.equipmentCss = function() { return this.equipmentDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.equipmentOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obEquipmentDataModels(), 'EquipmentName');
			this.resetEmpty(m, collection, 'fieldTripEquipmentId');
		}.bind(this);

		this.destinationDisable = function() { return this.obCurrentDestinationName() == ''; };

		this.destinationCss = function() { return this.destinationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.cityDisable = function() { return this.obEntityDataModel().destinationCity() == ''; };

		this.cityCss = function() { return this.cityDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.zipCodeDisable = function() { return this.obEntityDataModel().destinationZip() == ''; };

		this.zipCodeCss = function() { return this.zipCodeDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.billingClassificationDisable = function() { return this.obCurrentBillingClassificationName() == ''; };

		this.billingClassificationCss = function() { return this.billingClassificationDisable() ? this.opacityCssSource.disable : this.opacityCssSource.enable; };

		this.billingClassificationOnBlur = function(e, m)
		{
			var collection = this.getCollection(this.obBillingClassificationDataModels(), 'Name');
			this.resetEmpty(m, collection, 'billingClassificationId');
		}.bind(this);

		this.stageCss = function() { return this.obEntityDataModel().id() ? this.opacityCssSource.enable : this.opacityCssSource.disable; };
	};

	FieldTripDataEntryViewModel.prototype = Object.create(namespace.BaseDataEntryViewModel.prototype);

	FieldTripDataEntryViewModel.prototype.constructor = FieldTripDataEntryViewModel;

	FieldTripDataEntryViewModel.prototype.dataChangeReceive = function(changeName)
	{
		this.loadSupplement();
	};

	FieldTripDataEntryViewModel.prototype.getEditable = function()
	{
		if (this.obMode() != "Edit") return true;
		return TF.FieldTripAuthHelper.checkFieldTripEditable(this.obEntityDataModel() ? this.obEntityDataModel()._entityBackup : null);
	};

	FieldTripDataEntryViewModel.prototype.loadDocument = function()
	{
		var self = this,
			document = this.obDocumentGridViewModel();
		if (document !== null && document !== undefined && document.obGridViewModel()
			&& document.obGridViewModel().searchGrid.kendoGrid.wrapper.data("kendoReorderable"))
		{
			document.dispose();
		}
		var filteredIds = [], documentRecources = [], documentFontEndRecources = [];
		if (this.obMode() === "Edit")
		{
			if (tf.permissions.documentRead)
			{
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documentclassification"))
					.then(function(data)
					{
						var resources = self.obEntityDataModel().fieldTripDocuments();
						var classificationDataModels = data.Items;
						if (self.obDocumentGridViewModel() !== null)
						{
							if (classificationDataModels != null && classificationDataModels.length > 0)
							{
								self.obDocumentGridViewModel().obCanAdd(true);
							}
							else
							{
								self.obDocumentGridViewModel().obCanAdd(false);
							}
						}
						if (resources)
						{
							resources.forEach(function(item)
							{
								if (item.DocumentEntity.DocumentClassificationId > 0)
								{
									item.DocumentClassificationId = item.DocumentEntity.DocumentClassificationId
								}
								var classificationDataModel = Enumerable.From(classificationDataModels).Where(function(c)
								{
									return c.Id === item.DocumentClassificationId;
								}.bind(self)).ToArray()[0];

								if (!classificationDataModel) return;

								var obDocumentData = ko.observable(new TF.DataModel.DocumentDataModel());
								var documentData = obDocumentData().toData();
								documentData.DocumentEntity = item.DocumentEntity;
								documentData.APIIsDirty = item.APIIsDirty;
								documentData.APIIsNew = item.APIIsNew;
								documentData.APIToDelete = item.APIToDelete;
								documentData.DocumentClassification = classificationDataModel.Name;
								documentData.Description = item.DocumentEntity.Description;
								documentData.DocumentClassificationId = item.DocumentEntity.DocumentClassificationId;
								documentData.DocumentRelationshipEntities = item.DocumentRelationshipEntities;
								documentData.Id = item.DocumentEntity.Id;
								documentData.Filename = item.DocumentEntity.Filename;
								documentData.FileContent = item.DocumentEntity.FileContent;
								documentData.FileSizeKb = item.DocumentEntity.FileSizeKb;
								documentData.LastUpdated = item.DocumentEntity.LastUpdated;
								documentData.LastUpdatedName = item.DocumentEntity.LastUpdatedName;
								documentData.resourceId = this.obDocumentResourceId();

								this.obDocumentResourceId(item.resourceId + 1);
								filteredIds.push(item.DocumentEntity.Id);
								documentRecources.push(documentData);
								documentFontEndRecources.push(documentData);
							}.bind(self));
						}
						self.obDocumentGridDataSource(documentRecources);
						self.obDocumentKendoDataSource(documentFontEndRecources);
						var documentGrid = new TF.Control.GridControlViewModel("documentmini", filteredIds, self.obEntityDataModel().id(), "fieldtripEntry");
						self.obDocumentGridViewModel(documentGrid);
						if (classificationDataModels != null && classificationDataModels.length > 0)
						{
							documentGrid.obCanAdd(true);
							self.obDocumentGridViewModel().obCanAdd(true);
						}
						else
						{
							documentGrid.obCanAdd(false);
							self.obDocumentGridViewModel().obCanAdd(false);
						}
					});
			}

		}
		else
		{
			if (tf.permissions.documentRead && tf.permissions.documentAdd)
			{
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "documentclassification"))
					.then(function(data)
					{
						var documentGrid = new TF.Control.GridControlViewModel("documentmini", filteredIds, self.obEntityDataModel().id(), "fieldtripEntry");

						var classificationDataModels = data.Items;
						if (classificationDataModels != null && classificationDataModels.length > 0)
						{
							documentGrid.obCanAdd(true);
						}
						else
						{
							documentGrid.obCanAdd(false);
						}
						self.obDocumentGridViewModel(documentGrid);
					});
			}

		}
	};

	FieldTripDataEntryViewModel.prototype.loadSupplement = function()
	{
		var self = this, fieldtripData;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtrip", "predata"))
			.then(function(data)
			{
				fieldtripData = data.Items[0];
				self.getTemplate(fieldtripData.FieldTripTemplate);
				self.obSchoolDataModels(fieldtripData.School);
				self.fieldTripDistrictDepartments = fieldtripData.FieldTripDistrictDepartment;
				self.obDepartmentDataModels($.grep(self.fieldTripDistrictDepartments, function(item, index)
				{
					return self.hasPermissionForDistrictDepartment(item.Id)
				}));
				self.obActivityDataModels(fieldtripData.FieldTripActivity);
				self.obClassificationDataModels(fieldtripData.FieldTripClassification);
				self.obEquipmentDataModels(fieldtripData.FieldTripEquipment);
				self.obDestinationDataModels(fieldtripData.FieldTripDestination);
				self.obBillingClassificationDataModels(fieldtripData.FieldTripBillingClassification);
				self.ConvertToJson(fieldtripData.RequiredField);
				self.obMailCityDataModels(fieldtripData.MailCity);
				self.obMailZipDataModels(fieldtripData.MailZip);

				$.each(fieldtripData.FieldTripAccount, function(index, account)
				{
					if (account.FieldTripActivityId)
					{
						$.each(fieldtripData.FieldTripActivity, function(index, activity)
						{
							if (account.FieldTripActivityId === activity.Id)
							{
								account.FieldTripActivity = activity;
								return false;
							}
						});
					}

					if (account.DepartmentId)
					{
						$.each(fieldtripData.FieldTripDistrictDepartment, function(index, department)
						{
							if (account.DepartmentId === department.Id)
							{
								account.Department = department;
								return false;
							}
						});
					}

					if (!account.FieldTripActivity)
					{
						account.FieldTripActivity = { Name: "[Any]", Id: null };
					}
					if (!account.Department)
					{
						account.Department = { Name: "[Any]", Id: null };
					}
				});
				self.fieldTripAccountList = fieldtripData.FieldTripAccount;
				self.setAccountListBySchool(null, true);
				self.obFieldTripSettings(fieldtripData.FieldTripSettings);
				self.obShowTotalCost(fieldtripData.FieldTripSettings.ShowTripTotalCost);
				self.obStrictDest(fieldtripData.FieldTripSettings.StrictDest);
				return true;
			});
	};

	FieldTripDataEntryViewModel.prototype.refreshDocumentMiniGrid = function(AttachedId, isNew)
	{
		var self = this;
		if (self.obDocumentAdd)
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "document", self.type, AttachedId, "documents"))
				.then(function(data)
				{
					var source = [];
					self.obDocumentGridDataSource().forEach(function(gridData)
					{
						data.Items.forEach(function(item, index)
						{
							if (gridData.Filename === item.Filename)
							{
								gridData.Id = item.Id;
								gridData.DocumentEntity.Id = item.Id;
								if (isNew)
								{
									var associations = {
										AttachedToId: AttachedId,
										AttachedToType: "fieldtrip"
									};
									gridData.DocumentRelationshipEntities[0] = associations;
								}
							}
						});
					});
					var source = self.obDocumentGridDataSource().filter(function(datasource)
					{
						return datasource.DocumentRelationshipEntities.length > 0;
					});
					self.obDocumentGridDataSource(source);
					self.obDocumentAdd = false;
				});
		} else
		{
			var source = self.obDocumentGridDataSource().filter(function(datasource)
			{
				return datasource.DocumentRelationshipEntities.length > 0;
			});
			self.obDocumentGridDataSource(source);
		}
	};
	FieldTripDataEntryViewModel.prototype.getTemplate = function(data)
	{
		var self = this;
		data = data.sort(function(a, b)
		{
			if (a.Name.toUpperCase() === b.Name.toUpperCase())
			{
				return 0;
			}
			return a.Name.toUpperCase() > b.Name.toUpperCase() ? 1 : -1;
		});
		data.unshift({ Name: "None", Id: 0 });
		self.obTemplateSource(data);
	};

	FieldTripDataEntryViewModel.prototype.hasPermissionForDistrictDepartment = function(id)
	{
		var departmentIdsWithPermission = tf.authManager.authorizationInfo.authorizationTree.districtDepartmentIds;

		if (tf.authManager.authorizationInfo.isFieldTripAdmin)
		{
			return true;
		}

		if (this.currentDistrictDepartmentId && id === this.currentDistrictDepartmentId)
		{
			return true;
		}

		return departmentIdsWithPermission.indexOf(id) >= 0;
	};

	FieldTripDataEntryViewModel.prototype.setAccountListBySchool = function(school, initialize)
	{
		var self = this, selectIndex = -1, accountList = [], departActivityNames = [], departActivityName;
		if (!school)
		{
			self.obAccount([{ Id: -1 }]);

			if (!initialize)
			{
				self.obCurrentAccountName("None");
			}
		}
		else
		{
			self.obAccount.removeAll();
			$.each(self.fieldTripAccountList, function(index, item)
			{
				if (item.School === school && (!item.Department || self.hasPermissionForDistrictDepartment(item.Department.Id)))
				{
					departActivityName = (item.Department ? item.Department.Name : "[Any]") + ' / ' + (item.FieldTripActivity ? item.FieldTripActivity.Name : "[Any]");

					if (departActivityNames.indexOf(departActivityName) < 0)
					{
						accountList.push(item);
						departActivityNames.push(departActivityName);
						if (self.obCurrentAccountName() === departActivityName)
						{
							selectIndex = index;
						}
					}
				}
			});
			accountList.unshift({ Id: -1 });
			self.obAccount(accountList);

			if (selectIndex > -1)
			{
				this.obSelectedAccount(self.obAccount()[selectIndex + 1]);
			}
			else if (!initialize)
			{
				self.obCurrentAccountName("None");
			}
		}
	};

	FieldTripDataEntryViewModel.prototype.load = function()
	{
		if (this.obIds() == null)
		{
			return;
		}

		if (this.obEntityDataModel().id() > 0)
		{
			ga('send', 'event', 'Action', 'Edit Trip');
		}

		return namespace.BaseDataEntryViewModel.prototype.load.call(this)
			.then(function()
			{
				if (!this.obEntityDataModel().estimatedReturnDateTime())
				{
					this.obEntityDataModel().returnDate(null);
					this.obEntityDataModel().returnTime(null);
				}

				if (this.obMode() === "Edit")
				{
					if (this.obFieldTripSettings().StrictAcctCodes)
					{
						this.obCurrentAccountName((this.obEntityDataModel().districtDepartmentName() || "[Any]") + ' / ' + (this.obEntityDataModel().fieldTripActivityName() || "[Any]"));
						this.setAccountListBySchool(this.obEntityDataModel().school());
					}

					if (this.obEntityDataModel().districtDepartmentId() && !this.hasPermissionForDistrictDepartment(this.obEntityDataModel().districtDepartmentId()))
					{
						$.each(this.fieldTripDistrictDepartments, function(index, item)
						{
							if (item.Id === this.obEntityDataModel().districtDepartmentId())
							{
								this.currentDistrictDepartmentId = item.Id;
								this.obDepartmentDataModels.push(item);
								return false;
							}
						}.bind(this));
					}

					if (this.obEntityDataModel().departDateTime() == "1900-01-01T00:00:00.000" ||
						this.obEntityDataModel().estimatedReturnDateTime() == "1900-01-01T00:00:00.000" ||
						this.obEntityDataModel().departDateTime() == null ||
						this.obEntityDataModel().estimatedReturnDateTime() == null)
					{
						this.obDepartureAndReturnDateTime("");
						this.obDuration("");
					}
					else if (moment(this.obEntityDataModel().departDateTime()).format("L") === moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L"))
					{
						this.obDepartureAndReturnDateTime(moment(this.obEntityDataModel().departDateTime()).format("L") + " " + moment(this.obEntityDataModel().departDateTime()).format("LT") + "-" + moment(this.obEntityDataModel().estimatedReturnDateTime()).format("LT"));
						this.obDuration(this.calculateDateTimeDiff("day"));
					}
					else
					{
						this.obDepartureAndReturnDateTime(moment(this.obEntityDataModel().departDateTime()).format("L LT") + "-" + moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L LT"));
						this.obDuration(this.calculateDateTimeDiff("day"));
					}

					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					this.obEntityDataModel().updateEntityBackup();
				}
				else
				{
					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					this.obEntityDataModel().updateEntityBackup();
				}

				this.loadInvoicing();
				this.loadResources();
				this.loadDocument();

				this.obEntityDataModel().apiIsDirty(false);
				//reset the shortCutKeys golbal used
				tf.shortCutKeys.resetUsingGolbal(5);

				if (!this.editable())
				{
					this.$form.find("input[name='name']").blur();
					this.pageLevelViewModel.obValidationErrorsSpecifed([{
						message: "You can not make changes to this  field trip.  This is due to security restrictions or the trip's current pending approval status.",
						field: $(document)
					}]);
					this.pageLevelViewModel.obErrorMessageDivIsShow(true);
				}
				else
				{
					this.$form.find("input[name='name']").focus();
				}

				return true;
			}.bind(this)).catch(function(response)
			{//no need to do anything.

			}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.feedingSchoolNameFormatter = function(schoolDataModel)
	{
		return schoolDataModel.name() + " (" + schoolDataModel.schoolCode() + ")";
	};

	FieldTripDataEntryViewModel.prototype.validationInitialize = function()
	{
		namespace.BaseDataEntryViewModel.prototype.validationInitialize.call(this);
	};

	FieldTripDataEntryViewModel.prototype.dispose = function()
	{
		var self = this;
		if (self.$form)
		{
			self.$form.off("focus.editable");
		}
		PubSub.unsubscribe(self.dataChangeReceive);
		if (self.obInvoicingGridViewModel() && self.obInvoicingGridViewModel().obGridViewModel()
			&& self.obInvoicingGridViewModel().obGridViewModel().searchGrid)
		{
			self.obInvoicingGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		if (self.obVehicleGridViewModel() && self.obVehicleGridViewModel().obGridViewModel()
			&& self.obVehicleGridViewModel().obGridViewModel().searchGrid)
		{
			self.obVehicleGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		if (self.obDriversGridViewModel() && self.obDriversGridViewModel().obGridViewModel()
			&& self.obDriversGridViewModel().obGridViewModel().searchGrid)
		{
			self.obDriversGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		if (self.obBusAideGridViewModel() && self.obBusAideGridViewModel().obGridViewModel()
			&& self.obBusAideGridViewModel().obGridViewModel().searchGrid)
		{
			self.obBusAideGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		if (self.obResourcesGridViewModel() && self.obResourcesGridViewModel().obGridViewModel()
			&& self.obResourcesGridViewModel().obGridViewModel().searchGrid)
		{
			self.obResourcesGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		if (self.obDocumentGridViewModel() && self.obDocumentGridViewModel().obGridViewModel()
			&& self.obDocumentGridViewModel().obGridViewModel().searchGrid)
		{
			self.obDocumentGridViewModel().obGridViewModel().searchGrid.dispose();
		}
		return namespace.BaseDataEntryViewModel.prototype.dispose.call(self);
	};

	FieldTripDataEntryViewModel.prototype.calculateDateTimeDiff = function(diffType)
	{
		var departDateTime = new Date(moment(this.obEntityDataModel().departDateTime()).format("L LT"));
		var estimatedReturnDateTime = new Date(moment(this.obEntityDataModel().estimatedReturnDateTime()).format("L LT"));
		var divNum = 1;
		var diff = 0;

		var daydivNum = 1000 * 3600 * 24;
		var hourdivNum = 1000 * 3600;
		var minutedivNum = 1000 * 60;

		var total = (estimatedReturnDateTime.getTime() - departDateTime.getTime());

		if (isNaN(total))
		{
			total = 0;
		}

		diff = parseFloat(total / daydivNum);
		var day = Math.floor(diff);

		total = total - day * daydivNum;
		diff = parseFloat(total / hourdivNum);
		var hour = Math.floor(diff);

		total = total - hour * hourdivNum;
		diff = parseFloat(total / minutedivNum);
		var minutes = Math.floor(diff);

		return day + " days, " + hour + " hours, and " + minutes + " mins";
	};

	FieldTripDataEntryViewModel.prototype.initialize = function()
	{
		return TF.DataEntry.BaseDataEntryViewModel.prototype.initialize.call(this).then(function()
		{
			this.$form.off("focus.editable");
			this.$form.on("focus.editable", "input, button, textarea, select", function(event)
			{
				if (!this.editable())
				{
					event.target.blur();
				}
			}.bind(this));
		}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.templateClick = function()
	{
		if (this.$form)
		{
			this.obTemplateSource().forEach(function(item)
			{
				if (item.Id == this.obSelectedTemplateSource().Id)
				{
					item.FieldTripStageId = 1;
					var dataModel = new TF.DataModel.FieldTripDataModel(item);
					var dirtyModel = new TF.DataModel.FieldTripDataModel();
					var templateDataModel = new TF.DataModel.FieldTripTemplatesDataModel(item);
					var dirtyFields = this.obEntityDataModel().getDirtyFields().concat();
					for (var i in dirtyFields)
					{
						dirtyModel[dirtyFields[i]](this.obEntityDataModel()[dirtyFields[i]]());
					}
					if (item.Id == 0)
					{
						dataModel.name("");
						dataModel.isCreatedFromTemplate(false);
					}
					else
					{
						dataModel.isCreatedFromTemplate(true);
					}
					dataModel.templateName(item.Name);
					dataModel.id(0);
					this.obEntityDataModel(dataModel);
					this.obEntityDataModel().name(templateDataModel.fieldTripName());
					this.obEntityDataModel().updateClone(this.obEntityDataModel());
					for (var i in dirtyFields)
					{
						this.obEntityDataModel()[dirtyFields[i]](dirtyModel[dirtyFields[i]]());
					}
					this.$form.data('bootstrapValidator').resetForm();

					// FT-711 Check destination name is correct or not
					var destinationNameInHtml = $(".destinationname").find("input").val();
					if (destinationNameInHtml != 'undefined' && destinationNameInHtml != null)
					{
						if (this.obEntityDataModel().destination() !== destinationNameInHtml)
						{
							$(".destinationname").find("input").val(this.obEntityDataModel().destination());
						}
					}
				}
			}.bind(this));
		}
	};

	FieldTripDataEntryViewModel.prototype.loadResources = function()
	{
		var vehicle = this.obVehicleGridViewModel();
		if (vehicle !== null && vehicle !== undefined)
		{
			vehicle.dispose();
		}

		this.vehicleLoadFinished = false;
		this.driverLoadFinished = false;
		this.aideLoadFinished = false;
		if (this.obMode() === "Edit")
		{
			var resources = this.obEntityDataModel().fieldTripResourceGroup();
			resources.forEach(function(item)
			{
				if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
				{
					item.Chaperone = "None";
				}
				this.obResourceId(this.obResourceId() + 1);
				item.resourceId = this.obResourceId();

			}.bind(this));
			this.obFieldTripResourceGroupData(resources);

			this.obVehicleGridSource([]);
			this.obDriversGridSource([]);
			this.obBusAideGridSource([]);
			this.obFieldTripResourceGroupData().forEach(function(item)
			{
				if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
				{
					item.Chaperone = "None";
				}

				if (item.VehicleId && item.Vehicle)
				{
					item.VehTotal = this.vehicleCostComputer(item);
					item.VehicleName = item.Vehicle.BusNum;
					this.obVehicleGridSource.push(item);
				}

				if (item.DriverId && item.Driver)
				{
					item.driverTotal = this.driverTotalCostComputer(item);
					item.DriverName = item.Driver.FirstName + " " + item.Driver.LastName;
					this.obDriversGridSource.push(item);
				}

				if (item.AideId && item.Aide)
				{
					item.aideTotal = this.busAideCostComputer(item);
					item.AideName = item.Aide.FirstName + " " + item.Aide.LastName;
					this.obBusAideGridSource.push(item);
				}

			}.bind(this));

			this.obResourcesGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "resource", null, null, null, this.obFieldTripResourceGroupData(), "resource", true));
			this.obVehicleGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "vehicle", null, null, null, this.obVehicleGridSource(), "vehicle", true));
			this.obDriversGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "driver", null, null, null, this.obDriversGridSource(), "driver", true));
			this.obBusAideGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "aide", null, null, null, this.obBusAideGridSource(), "aide", true));
		}
		else
		{
			this.obResourcesGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "resource", null, null, null, this.obFieldTripResourceGroupData(), "resource", true));
			this.obVehicleGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "vehicle", null, null, null, this.obVehicleGridSource(), "vehicle", true));
			this.obDriversGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "driver", null, null, null, this.obDriversGridSource(), "driver", true));
			this.obBusAideGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "aide", null, null, null, this.obBusAideGridSource(), "aide", true));
		}
	};

	FieldTripDataEntryViewModel.prototype.ReloadResources = function()
	{
		var obGridViewModel = this.obResourcesGridViewModel().obGridViewModel();
		if (!obGridViewModel || !obGridViewModel.searchGrid || !obGridViewModel.searchGrid.kendoGrid) return;

		var resSearchGrid = obGridViewModel.searchGrid, resKendoGrid = resSearchGrid.kendoGrid;
		if (!resKendoGrid) return;

		this.obVehicleGridSource([]);
		this.obDriversGridSource([]);
		this.obBusAideGridSource([]);

		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
			{
				item.Chaperone = "None";
			}

			if (item.VehicleId)
			{
				item.VehTotal = this.vehicleCostComputer(item);
				this.obVehicleGridSource.push(item);
			}

			if (item.DriverId)
			{
				item.driverTotal = this.driverTotalCostComputer(item);
				this.obDriversGridSource.push(item);
			}

			if (item.AideId)
			{
				item.aideTotal = this.busAideCostComputer(item);
				this.obBusAideGridSource.push(item);
			}

		}.bind(this));
		var resourceSort = resKendoGrid.dataSource.sort(),
			resourceSource = new kendo.data.DataSource({
				data: this.obFieldTripResourceGroupData(),
				sort: resourceSort
			});
		resKendoGrid.setDataSource(resourceSource);
		resSearchGrid.rebuildGrid(resourceSort);

		var self = this;
		var updateCore = function(grid)
		{
			var sort = grid.kendoGrid.dataSource.sort(),
				source = new kendo.data.DataSource({
					data: self.obVehicleGridSource(),
					sort: sort
				});
			grid.kendoGrid.setDataSource(source);
			grid.rebuildGrid(sort);
		};

		var safeUpdateCore = function(grid)
		{
			if (grid.kendoGrid)
			{
				updateCore(grid);
				return;
			}

			setTimeout(function()
			{
				if (grid && grid.kendoGrid)
				{
					updateCore(grid);
				}
			});
		};

		var safeUpdate = function(vm)
		{
			var gridVM = vm.obGridViewModel();
			if (gridVM)
			{
				safeUpdateCore(gridVM.searchGrid);
			}
		};

		safeUpdate(this.obVehicleGridViewModel());
		safeUpdate(this.obDriversGridViewModel());
		safeUpdate(this.obBusAideGridViewModel());

		tf.loadingIndicator.showImmediately();
	};

	FieldTripDataEntryViewModel.prototype.loadInvoicing = function()
	{
		var invoicing = this.obInvoicingGridViewModel();
		if (invoicing !== null && invoicing !== undefined)
		{
			invoicing.dispose();
		}
		if (this.obMode() === "Edit")
		{
			var resources = this.obEntityDataModel().fieldTripInvoice();
			resources.forEach(function(item)
			{
				item.resourceId = this.obInvoiceResourceId();
				this.obInvoiceResourceId(item.resourceId + 1);
			}.bind(this));

			this.obInvoiceGridDataSource(resources);

			var invoiceGrid = new TF.Control.GridControlViewModel("fieldtripinvoice", null, this.obEntityDataModel().id(), "fieldtripEntry", null, null, null, this.obInvoiceGridDataSource(), undefined, true);
			this.obInvoicingGridViewModel(invoiceGrid);
		}
		else
		{
			var invoiceGrid = new TF.Control.GridControlViewModel("fieldtripinvoice", null, this.obEntityDataModel().id(), "fieldtripEntry", null, null, null, this.obInvoiceGridDataSource(), undefined, true);
			this.obInvoicingGridViewModel(invoiceGrid);
		}

		var clearInvoiceGrid = function()
		{
			var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
				resourceSource = new kendo.data.DataSource({
					data: [],
					sort: resourceSort
				});
			this.obInvoiceGridDataSource([]);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
		}.bind(this);

		//Changing the School, Department or Activity removes Invoice information.
		this.obEntityDataModel().school.subscribe(clearInvoiceGrid);
		this.obEntityDataModel().districtDepartmentId.subscribe(clearInvoiceGrid);
		this.obEntityDataModel().fieldTripActivityId.subscribe(clearInvoiceGrid);
	};

	FieldTripDataEntryViewModel.prototype.addResourceClick = function(type)
	{
		tf.modalManager.showModal(new TF.Modal.FieldTripResourceModalViewModel(this.obEntityDataModel().id()))
			.then(function(data)
			{
				if (data)
				{
					this.obResourceId(this.obResourceId() + 1);
					data.resourceId = this.obResourceId();

					this.obFieldTripResourceGroupData.push(data);
					this.ReloadResources();
				}
			}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.ConvertToJson = function(items)
	{
		var json = {};
		items.forEach(function(data)
		{
			json[data.FieldName] = { Label: data.Label, Required: data.Required };
		}.bind(this));

		this.obRequiredFields(json);
	};

	FieldTripDataEntryViewModel.prototype.IsRequired = function(item)
	{
		return item ? { required: "required" } : {};
	};

	FieldTripDataEntryViewModel.prototype.initializeResources = function(el)
	{
		this.$form.find('.resources .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Assigned Resources"));
		this.$form.find('.resources .iconbutton.mapview').hide();
		this.$form.find('.resources .iconbutton.gridview').hide();
		this.$form.find('.resources .iconbutton.view').hide();
		this.$form.find('.resources .iconbutton.copytoclipboard').hide();
		this.$form.find('.resources .iconrow .divider:first').hide();

		this.$form.find('.resources .iconbutton.filter').off("click");
		this.$form.find('.resources .iconbutton.refresh').off("click");

		this.$form.find('.resources .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.resources .iconbutton.pencil').off("click").on("click", { gridView: this.obResourcesGridViewModel, modal: TF.Modal.FieldTripResourceModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.resources .iconbutton.delete').off("click").on("click", { gridView: this.obResourcesGridViewModel, modal: TF.Modal.FieldTripResourceModalViewModel }, this.deleteEvent.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.initializeVehicle = function(el)
	{
		this.vehicleLoadFinished = false;
		this.$form.find('.vehicle .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Vehicle"));
		this.$form.find('.vehicle .iconbutton.mapview').hide();
		this.$form.find('.vehicle .iconbutton.gridview').hide();
		this.$form.find('.vehicle .iconbutton.view').hide();
		this.$form.find('.vehicle .iconbutton.copytoclipboard').hide();
		this.$form.find('.vehicle .iconrow .divider:first').hide();

		this.$form.find('.vehicle .iconbutton.filter').off("click");
		this.$form.find('.vehicle .iconbutton.refresh').off("click");

		this.$form.find('.vehicle .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.vehicle .iconbutton.pencil').off("click").on("click", { gridView: this.obVehicleGridViewModel, modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.vehicle .iconbutton.delete').off("click").on("click", { gridView: this.obVehicleGridViewModel, modal: TF.Modal.FieldTripResourceVehicleModalViewModel }, this.deleteEvent.bind(this));
		this.vehicleLoadFinished = true;
		if (this.vehicleLoadFinished && this.driverLoadFinished && this.aideLoadFinished)
		{
			this.ReloadResources();
		}
	};

	FieldTripDataEntryViewModel.prototype.initializeDriver = function(el)
	{
		this.$form.find('.drivers .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Driver"));
		this.$form.find('.drivers .iconbutton.mapview').hide();
		this.$form.find('.drivers .iconbutton.gridview').hide();
		this.$form.find('.drivers .iconbutton.view').hide();
		this.$form.find('.drivers .iconbutton.copytoclipboard').hide();
		this.$form.find('.drivers .iconrow .divider:first').hide();

		this.$form.find('.drivers .iconbutton.filter').off("click");
		this.$form.find('.drivers .iconbutton.refresh').off("click");

		this.$form.find('.drivers .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.drivers .iconbutton.pencil').off("click").on("click", { gridView: this.obDriversGridViewModel, modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.drivers .iconbutton.delete').off("click").on("click", { gridView: this.obDriversGridViewModel, modal: TF.Modal.FieldTripResourceDriverModalViewModel }, this.deleteEvent.bind(this));
		this.driverLoadFinished = true;
		if (this.vehicleLoadFinished && this.driverLoadFinished && this.aideLoadFinished)
		{
			this.ReloadResources();
		}
	};

	FieldTripDataEntryViewModel.prototype.initializeAide = function(el)
	{
		this.$form.find('.busAides .view-grid-header').text(tf.applicationTerm.getApplicationTermPluralByName("Bus Aide"));
		this.$form.find('.busAides .iconbutton.mapview').hide();
		this.$form.find('.busAides .iconbutton.gridview').hide();
		this.$form.find('.busAides .iconbutton.view').hide();
		this.$form.find('.busAides .iconbutton.copytoclipboard').hide();
		this.$form.find('.busAides .iconrow .divider:first').hide();

		this.$form.find('.busAides .iconbutton.filter').off("click");
		this.$form.find('.busAides .iconbutton.refresh').off("click");

		this.$form.find('.busAides .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.addEvent.bind(this));
		this.$form.find('.busAides .iconbutton.pencil').off("click").on("click", { gridView: this.obBusAideGridViewModel, modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.editEvent.bind(this));
		this.$form.find('.busAides .iconbutton.delete').off("click").on("click", { gridView: this.obBusAideGridViewModel, modal: TF.Modal.FieldTripResourceAideModalViewModel }, this.deleteEvent.bind(this));
		this.aideLoadFinished = true;
		if (this.vehicleLoadFinished && this.driverLoadFinished && this.aideLoadFinished)
		{
			this.ReloadResources();
		}
	};

	FieldTripDataEntryViewModel.prototype.getSaveData = function(isTemplate)
	{
		if (!this.obEntityDataModel().departDate())
		{
			this.obEntityDataModel().departDateTime(null);
		}
		if (!this.obEntityDataModel().returnDate())
		{
			this.obEntityDataModel().estimatedReturnDateTime(null);
		}

		// FT-711 Check destination name is correct or not
		var destinationNameInHtml = $(".destinationname").find("input").val();
		if (destinationNameInHtml != 'undefined' && destinationNameInHtml != null)
		{
			if (this.obEntityDataModel().destination() !== destinationNameInHtml)
			{
				this.obEntityDataModel().destination(destinationNameInHtml);
			}
		}
		var entity = this.obEntityDataModel().toData();
		entity.APIIsNew = entity.Id ? false : true;
		entity.FieldTripResourceGroups = this.obFieldTripResourceGroupData();
		entity.FieldTripInvoice = this.obInvoiceGridDataSource();
		entity.FieldTripDocuments = this.obDocumentGridDataSource();
		if (entity.FieldTripDocuments.length > 0)
		{
			entity.FieldTripDocuments.forEach(function(item)
			{
				if (item.Id < 0)
				{
					item.Id = 0;
					item.DocumentEntity.Id = 0;
				}
			});
		}
		if (isTemplate)
		{
			entity.APIIsNew = true;
		}
		entity.FieldTripResourceGroups.map(function(item)
		{
			item.APIIsDirty = true;
			item.APIIsNew = true;
		});
		entity.FieldTripInvoice.map(function(item)
		{
			item.APIIsDirty = true;
			item.APIIsNew = true;
		});
		entity.FieldTripDocuments.map(function(item)
		{
			item.APIIsDirty = true;
			item.APIIsNew = true;
		});
		return entity;
	};

	FieldTripDataEntryViewModel.prototype.addEvent = function(e)
	{
		tf.modalManager.showModal(new e.data.modal(null, this.obEntityDataModel().id()))
			.then(function(data)
			{
				if (data)
				{
					this.obResourceId(this.obResourceId() + 1);
					data.resourceId = this.obResourceId();

					this.obFieldTripResourceGroupData.push(data);
					this.ReloadResources();
				}
			}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.editEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			tf.modalManager.showModal(new e.data.modal(data, this.obEntityDataModel().id()))
				.then(function(data)
				{
					if (data)
					{
						var source = [];
						this.obFieldTripResourceGroupData().forEach(function(item)
						{
							if (item.resourceId == data.resourceId)
							{
								source.push(data);
								return;
							}
							source.push(item);
						}.bind(this));

						this.obFieldTripResourceGroupData(source);
						this.ReloadResources();
					}
				}.bind(this));
		}
	};

	FieldTripDataEntryViewModel.prototype.deleteEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);

			var source = [];
			this.obFieldTripResourceGroupData().forEach(function(item)
			{
				if (item.resourceId == data.resourceId)
				{
					return;
				}
				source.push(item);
			}.bind(this));

			this.obFieldTripResourceGroupData(source);
			this.ReloadResources();
		}
	};

	FieldTripDataEntryViewModel.prototype.applyBillingClick = function(viewModel, e)
	{
		var curBilling = this.obBillingClassificationDataModels().filter(function(item)
		{
			return item.Id == this.obEntityDataModel().billingClassificationId();
		}.bind(this));

		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.VehFixedCost = curBilling[0].VehFixedCost ? curBilling[0].VehFixedCost : 0;
			item.MileageRate = curBilling[0].MileageRate ? curBilling[0].MileageRate : 0;

			item.DriverRate = curBilling[0].DriverRate ? curBilling[0].DriverRate : 0;
			item.DriverFixedCost = curBilling[0].DriverFixedCost ? curBilling[0].DriverFixedCost : 0;
			item.DriverOtrate = curBilling[0].DriverOtrate ? curBilling[0].DriverOtrate : 0;

			item.AideRate = curBilling[0].AideRate ? curBilling[0].AideRate : 0;
			item.AideFixedCost = curBilling[0].AideFixedCost ? curBilling[0].AideFixedCost : 0;
			item.AideOtrate = curBilling[0].AideOtrate ? curBilling[0].AideOtrate : 0;

		}.bind(this));

		this.ReloadResources();
		this.obFieldTripResourceGroupData.valueHasMutated();
	};

	FieldTripDataEntryViewModel.prototype.applyVehicleClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.VehFixedCost = this.obEntityDataModel().vehFixedCost();
			item.MileageRate = this.obEntityDataModel().mileageRate();
		}.bind(this));

		this.ReloadResources();
		this.obFieldTripResourceGroupData.valueHasMutated();
	};

	FieldTripDataEntryViewModel.prototype.applyDriverClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.DriverRate = this.obEntityDataModel().driverRate();
			item.DriverFixedCost = this.obEntityDataModel().driverFixedCost();
			item.DriverOtrate = this.obEntityDataModel().driverOtrate();

		}.bind(this));

		this.ReloadResources();
		this.obFieldTripResourceGroupData.valueHasMutated();
	};

	FieldTripDataEntryViewModel.prototype.applyAideClick = function(viewModel, e)
	{
		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			item.AideRate = this.obEntityDataModel().aideRate();
			item.AideFixedCost = this.obEntityDataModel().aideFixedCost();
			item.AideOtrate = this.obEntityDataModel().aideOtrate();

		}.bind(this));

		this.ReloadResources();
		this.obFieldTripResourceGroupData.valueHasMutated();
	};

	FieldTripDataEntryViewModel.prototype.viewResourceClick = function(viewModel, e)
	{
		tf.modalManager.showModal(new TF.Modal.FieldTripViewResourceModalViewModel(this.obFieldTripResourceGroupData, this.obEntityDataModel));
	};

	FieldTripDataEntryViewModel.prototype.initializeInvoice = function(el)
	{
		this.$form.find('.invoice .view-grid-header').text("Invoice Information");
		this.$form.find('.invoice .iconbutton.mapview').hide();
		this.$form.find('.invoice .iconbutton.gridview').hide();
		this.$form.find('.invoice .iconbutton.view').hide();
		this.$form.find('.invoice .iconbutton.copytoclipboard').hide();
		this.$form.find('.invoice .iconrow .divider:first').hide();

		this.$form.find('.invoice .iconbutton.filter').off("click");
		this.$form.find('.invoice .iconbutton.refresh').off("click");

		this.$form.find('.invoice .iconbutton.new').off("click").on("click", { modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.addInvoiceEvent.bind(this));
		this.$form.find('.invoice .iconbutton.pencil').off("click").on("click", { gridView: this.obInvoicingGridViewModel, modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.editInvoiceEvent.bind(this));
		this.$form.find('.invoice .iconbutton.delete').off("click").on("click", { gridView: this.obInvoicingGridViewModel, modal: TF.Modal.FieldTripInvoiceModalViewModel }, this.deleteInvoiceEvent.bind(this));
		this.obInvoicingGridViewModel().obGridViewModel()._viewfromDBClick = this.editInvoiceEvent.bind(this);
	};

	FieldTripDataEntryViewModel.prototype.initializeDocument = function()
	{
		var selectId = this.obEntityDataModel().id();
		if (selectId === 0 || TF.FieldTripAuthHelper.checkFieldTripEditable(this.obEntityDataModel()._entityBackup))
		{
			if (!tf.permissions.documentAdd)
			{
				this.$form.find('.document .iconbutton.new').hide();
				this.$form.find('.document .iconrow .divider:first').hide();
			}
			if (!tf.permissions.documentEdit)
			{
				this.$form.find('.document .iconbutton.pencil').hide();
			}
			if (!tf.permissions.documentDelete)
			{
				this.$form.find('.document .iconbutton.delete').hide();
			}
		}

		this.$form.find('.document .iconbutton.new').off("click").on("click", { modal: TF.Modal.DocumentModalViewModel }, this.addDocEvent.bind(this));
		this.$form.find('.document .iconbutton.pencil').off("click").on("click", { gridView: this.obDocumentGridViewModel, modal: TF.Modal.DocumentModalViewModel }, this.editDocEvent.bind(this));
		this.$form.find('.document .iconbutton.delete').off("click").on("click", { gridView: this.obDocumentGridViewModel, modal: TF.Modal.DocumentModalViewModel }, this.deleteDocEvent.bind(this));
		this.obDocumentGridViewModel().obGridViewModel()._viewfromDBClick = this.editDocEvent.bind(this);
	};

	FieldTripDataEntryViewModel.prototype.addInvoiceEvent = function(e)
	{
		var option = { entityId: this.obEntityDataModel().id(), entityType: "fieldtrip", strictAcctCodes: this.obFieldTripSettings().StrictAcctCodes, selectAccount: this.obSelectedAccount() };
		tf.modalManager.showModal(new e.data.modal(option))
			.then(function(data)
			{
				if (data)
				{
					data.resourceId = this.obInvoiceResourceId();
					this.obInvoiceResourceId(data.resourceId + 1);

					this.obInvoiceGridDataSource.push(data);
					var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
						resourceSource = new kendo.data.DataSource({
							data: this.obInvoiceGridDataSource(),
							sort: resourceSort
						});
					this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
					this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
				}
			}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.editInvoiceEvent = function(e)
	{
		var row = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			if (data.InvoiceDate)
			{
				data.InvoiceDate = moment(data.InvoiceDate).format("YYYY-MM-DDTHH:mm:ss.SSS");
			}
			if (data.PaymentDate)
			{
				data.PaymentDate = moment(data.PaymentDate).format("YYYY-MM-DDTHH:mm:ss.SSS");
			}
			var option = { entityId: this.obEntityDataModel().id(), entityType: "fieldtrip", data: data, strictAcctCodes: this.obFieldTripSettings().StrictAcctCodes, selectAccount: this.obSelectedAccount() };
			tf.modalManager.showModal(new TF.Modal.FieldTripInvoiceModalViewModel(option))
				.then(function(data)
				{
					if (data)
					{
						var source = [];
						this.obInvoiceGridDataSource().forEach(function(item)
						{
							if (item.resourceId == data.resourceId)
							{
								source.push(data);
								return;
							}
							source.push(item);
						}.bind(this));

						var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
							resourceSource = new kendo.data.DataSource({
								data: source,
								sort: resourceSort
							});
						this.obInvoiceGridDataSource(source);
						this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
						this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
					}
				}.bind(this));
		}
	};

	FieldTripDataEntryViewModel.prototype.deleteInvoiceEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);

			var source = [];
			this.obInvoiceGridDataSource().forEach(function(item)
			{
				if (item.resourceId == data.resourceId)
				{
					return;
				}
				source.push(item);
			}.bind(this));

			var resourceSort = this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
				resourceSource = new kendo.data.DataSource({
					data: source,
					sort: resourceSort
				});
			this.obInvoiceGridDataSource(source);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
		}
	};

	function byteLength(str)
	{
		var bytes = str.length;
		for (var i = str.length - 1; i >= 0; i--)
		{
			var code = str.charCodeAt(i);
			if (code > 0x7f && code <= 0x7ff) bytes++;
			else if (code > 0x7ff && code <= 0xffff) bytes += 2;
			if (code >= 0xDC00 && code <= 0xDFFF) i--;
		}
		return bytes / 1024;
	}

	FieldTripDataEntryViewModel.prototype.resetDocumentGridPageInfo = function(count, add)
	{
		var self = this, lightKendoGrid = self.obDocumentGridViewModel().obGridViewModel().searchGrid;
		if (!lightKendoGrid)
		{
			return;
		}
		lightKendoGrid.currentCount = (lightKendoGrid.currentCount || lightKendoGrid.result.FilteredRecordCount) + (add ? count : - count);
		lightKendoGrid.currentTotalCount = (lightKendoGrid.currentTotalCount || lightKendoGrid.result.TotalRecordCount) + (add ? count : - count);
		lightKendoGrid.$container.children(".k-pager-wrap").find(".pageInfo").html(lightKendoGrid.currentCount + " of " + lightKendoGrid.currentTotalCount);
	};

	FieldTripDataEntryViewModel.prototype.addDocEvent = function(e)
	{
		var self = this;
		return tf.modalManager.showModal(new e.data.modal({ parentType: "fieldtrip", parentId: self.obEntityDataModel().id(), documentId: null, documentData: null, documentEntities: self.obDocumentKendoDataSource() }))
			.then(function(result)
			{
				if (result)
				{
					result.resourceId = self.obDocumentResourceId();
					self.obDocumentResourceId(result.resourceId + 1);
					var obResults = result.data;

					obResults.DocumentEntities.forEach(function(result)
					{
						var obDocumentData = ko.observable(new TF.DataModel.DocumentDataModel(obResults));
						var obDocument = obDocumentData().toData();
						obDocument.DocumentEntity = result;
						obDocument.Filename = result.Filename;
						obDocument.FileContent = result.FileContent;
						if (result.FileContent === null || result.FileContent.length === 0)
						{

							obDocument.FileSizeKb = 0;
						}
						else
						{
							obDocument.FileSizeKb = byteLength(result.FileContent);
						}
						obDocument.Id = self.tempId - 1;
						self.tempId = self.tempId - 1;
						self.obDocumentGridDataSource().push(obDocument);
						self.obDocumentKendoDataSource().push(obDocument);
					});
					var resourceSort = self.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
						resourceSource = new kendo.data.DataSource({
							data: self.obDocumentKendoDataSource(),
							sort: resourceSort
						});
					self.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
					self.obDocumentGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
					self.resetDocumentGridPageInfo(obResults.DocumentEntities.length, true);
					self.obDocumentAdd = true;
				}
				self.obPendingDocumentIdChange();
			}.bind(self));
	};

	FieldTripDataEntryViewModel.prototype.editDocEvent = function(e)
	{
		var row = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.select(),
			self = this;
		if (row.length > 0)
		{
			var resourceSort = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
				resourceSource = new kendo.data.DataSource({
					data: self.obDocumentKendoDataSource(),
					sort: resourceSort
				});
			self.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
			self.obDocumentGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);

			var data = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			var option = { parentType: "fieldtrip", parentId: self.obEntityDataModel().id(), documentId: data.Id, documentData: data, documentEntities: self.obDocumentKendoDataSource() };
			tf.modalManager.showModal(new TF.Modal.DocumentModalViewModel(option))
				.then(function(data)
				{
					var documentData = data.data;
					if (documentData)
					{
						var source = [],
							kendoSource = [];
						this.obDocumentGridDataSource().forEach(function(item)
						{
							if (documentData.Id != 0)
							{
								if (item.Id == documentData.Id)
								{
									var obresult = ko.observable(new TF.DataModel.DocumentDataModel(documentData));
									var obDocument = obresult().toData();
									obDocument.DocumentEntity = documentData;
									source.push(obDocument);
									return;
								}
							}
							source.push(item);
						}.bind(this));

						this.obDocumentKendoDataSource().forEach(function(item)
						{
							if (documentData.Id != 0)
							{
								if (item.Id == documentData.Id)
								{
									var obresult = ko.observable(new TF.DataModel.DocumentDataModel(documentData));
									var obDocument = obresult().toData();
									obDocument.DocumentEntity = documentData;
									kendoSource.push(obDocument);
									return;
								}
							}
							kendoSource.push(item);
						}.bind(this));

						var resourceSort = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
							resourceSource = new kendo.data.DataSource({
								data: kendoSource,
								sort: resourceSort
							});
						this.obDocumentGridDataSource(source);
						this.obDocumentKendoDataSource(kendoSource);
						this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
						this.obDocumentGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
					}
				}.bind(this));
		}
	};

	FieldTripDataEntryViewModel.prototype.deleteDocEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select(),
			self = this;

		var resourceSort = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort(),
			resourceSource = new kendo.data.DataSource({
				data: this.obDocumentKendoDataSource(),
				sort: resourceSort
			});
		self.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
		self.obDocumentGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			var source = [], documentSource = [], relationShipSource = [];
			this.obDocumentKendoDataSource().forEach(function(item)
			{
				if (item.Id > 0)
				{
					if (item.Id == data.Id)
					{
						return;
					}
					item.APIIsNew = item.DocumentEntity.APIIsNew;
					item.APIIsDirty = item.DocumentEntity.APIIsDirty;
					item.APIToDelete = item.DocumentEntity.APIToDelete;
					source.push(item);

				} else
				{
					if (item.Id == data.Id)
					{
						return;
					}
					source.push(item);
				}
			}.bind(this));

			this.obDocumentGridDataSource().forEach(function(item)
			{
				if (item.Id > 0)
				{
					if (item.Id == data.Id)
					{
						item.DocumentRelationshipEntities.forEach(function(relationShipItem)
						{
							if (relationShipItem.AttachedToId == self.obEntityDataModel().id())
							{
								return;
							}
							relationShipSource.push(relationShipItem);
						});
						item.DocumentRelationshipEntities = relationShipSource;
						documentSource.push(item);
						return;
					}
					documentSource.push(item);
				} else
				{
					if (item.Id == data.Id)
					{
						return;
					}
					documentSource.push(item);
				}
			}.bind(this));

			resourceSort = this.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.dataSource.sort();
			resourceSource = new kendo.data.DataSource({
				data: source,
				sort: resourceSort
			});
			self.obDocumentGridDataSource(documentSource);
			self.obDocumentKendoDataSource(source);
			self.obDocumentGridViewModel().obGridViewModel().searchGrid.kendoGrid.setDataSource(resourceSource);
			self.obDocumentGridViewModel().obGridViewModel().searchGrid.rebuildGrid(resourceSort);
			self.resetDocumentGridPageInfo(1, false);
		}
	};

	FieldTripDataEntryViewModel.prototype.getSpecialValidatorFields = function(validatorFields)
	{

		if (this.obRequiredFields().Name && this.obRequiredFields().Name.Required)
		{//may name not required(this don't exist in prod, but need test)
			validatorFields.name.validators.notEmpty = { message: "required" };
		}

		validatorFields.departDate.validators.callback = {
			message: "must be <= Return Date",
			callback: function(value, validator)
			{
				var field = this.$form.find("#departDate input[name=departDate]");
				field.data("noName", false);
				if (value != "")
				{
					var message = this.checkDeadline(value);
					if (message)
					{
						field.data("noName", true);
						return { message: message, valid: false };
					}

					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						this.clearDateTimeAlerts("date");
						this.$form.find("#returnTime input[name=estimatedReturnTime]").trigger("blur");
						this.$form.find("#departTime input[name=departTime]").trigger("blur");
						return true;
					}
					else if (departDate.isAfter(returnDate))
					{//return time need greate than depart time
						this.clearDateTimeAlerts("time");
						this.pageLevelViewModel.activeLostfouseName = "departDate";
						return { message: 'must be <= return Date', valid: false };
					}
					//validate passed, clear all messages.
					this.clearDateTimeAlerts();
				}
				return true;
			}.bind(this)
		};

		validatorFields.estimatedReturnDate.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				if (value != "")
				{
					var returnDate = new moment(value);
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						this.clearDateTimeAlerts("date");
						this.$form.find("#departDate input[name=departDate]").trigger("blur");
						this.$form.find("#departTime input[name=departTime]").trigger("blur");
						this.$form.find("#returnTime input[name=estimatedReturnTime]").trigger("blur");
						return true;
					}
					else if (departDate.isAfter(returnDate))
					{//return time need greate than depart time
						this.clearDateTimeAlerts("time");
						this.pageLevelViewModel.activeLostfouseName = "returnDate";
						return { message: 'must be >= Depart Date', valid: false };
					}

					//validate passed, clear all messages.
					this.clearDateTimeAlerts();
				}
				return true;
			}.bind(this)
		};

		if (this.obRequiredFields().DepartDateTime)
		{
			if (this.obRequiredFields().DepartDateTime.Required)
			{
				validatorFields.departDate.validators.notEmpty = { message: "required" };
			}
			else
			{
				delete validatorFields.departTime.validators.notEmpty;
			}
		}

		validatorFields.departTime.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				var field = this.$form.find("#departTime input[name=departTime]");
				field.data("noName", false);
				if (value != "")
				{
					var m = new moment(value, 'h:m A', true);

					if (!m.isValid())
					{
						return { message: "invalid time", valid: false };
					}

					if (!this.obEntityDataModel().departDate())
					{//this might never use, because the date is required when input time
						return true;
					}

					var message = this.checkBlockTimes(m);
					if (message)
					{
						field.data("noName", true);
						return { message: "Depart Time " + message, valid: false };
					}

					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						var m = new moment(this.obEntityDataModel().departTime());
						m.year(2010);
						m.dayOfYear(1);

						var end = new moment(this.obEntityDataModel().returnTime());
						end.year(2010);
						end.dayOfYear(1);

						if (m.isValid() && end.isValid() && m.isAfter(end))
						{//return time need greate than depart time
							this.pageLevelViewModel.activeLostfouseName = "departTime";
							return { message: 'must be <= return Time', valid: false };
						}

						//validate passed, clear all messages.
						this.clearDateTimeAlerts();
					}
					else
					{//not same day, to compare the real date
						this.$form.find("#departDate input[name=departDate]").trigger("blur");
					}
				}

				return true;
			}.bind(this)
		};

		if (this.obRequiredFields().EstimatedReturnDateTime)
		{
			//no need to check EstimatedReturnTime because it is not required.
			if (this.obRequiredFields().EstimatedReturnDateTime.Required)
			{
				validatorFields.estimatedReturnDate.validators.notEmpty = { message: "required" };
			}
			else
			{
				delete validatorFields.estimatedReturnTime.validators.notEmpty;
			}
		}

		validatorFields.estimatedReturnTime.validators.callback = {
			message: "invalid time",
			callback: function(value, validator)
			{
				var field = this.$form.find("#returnTime input[name=estimatedReturnTime]");
				field.data("noName", false);
				if (value != "")
				{
					var m = new moment(value, 'h:m A', true);

					if (!m.isValid())
					{
						return { message: "invalid time", valid: false };
					}

					if (!this.obEntityDataModel().returnDate())
					{//this might never use, because the date is required when input time
						return true;
					}

					var message = this.checkBlockTimes(m);
					if (message)
					{
						field.data("noName", true);
						return { message: "Return Time " + message, valid: false };
					}

					var returnDate = new moment(this.obEntityDataModel().returnDate());
					var departDate = new moment(this.obEntityDataModel().departDate());
					if (!departDate.isValid() || !returnDate.isValid())
					{//not valid value, no need to compare
						return true;
					}

					if (returnDate.isSame(departDate, "day"))
					{
						var m = new moment(this.obEntityDataModel().departTime());
						m.year(2010);
						m.dayOfYear(1);

						var end = new moment(this.obEntityDataModel().returnTime());
						end.year(2010);
						end.dayOfYear(1);

						if (m.isValid() && end.isValid() && m.isAfter(end))
						{//return time need greate than depart time
							this.pageLevelViewModel.activeLostfouseName = "returnTime";
							return { message: 'must be >= Depart Time', valid: false };
						}

						//validate passed, clear all messages.
						this.clearDateTimeAlerts();
					}
					else
					{//not same day, to compare the real date
						this.$form.find("#returnDate input[name=estimatedReturnDate]").trigger("blur");
					}
				}

				return true;
			}.bind(this)
		};
		return validatorFields;
	};

	FieldTripDataEntryViewModel.prototype.isHoliday = function(date)
	{
		var result = false, self = this, settings = self.obFieldTripSettings(), holidays = settings.Holidays || [];
		$.each(holidays, function(index, holiday)
		{
			var holidayM = moment(new Date(holiday));
			if (holidayM.diff(date.startOf("day"), "days") === 0 && holidayM.diff(date, "months") === 0 && holidayM.diff(date, "years") === 0)
			{
				result = true;
				return false;
			}
		});
		return result;
	};

	FieldTripDataEntryViewModel.prototype.checkDeadline = function(departDate)
	{
		if (!departDate)
		{
			return null;
		}

		var self = this, settings = self.obFieldTripSettings(), nonWorkdays = [6, 0],
			deadlineDays = settings.ScheduleDaysInAdvance || 0, departDate = new moment(departDate),
			deadlineDate = new moment(), message;

		while (deadlineDays > 0)
		{
			if (nonWorkdays.indexOf(deadlineDate.day()) < 0 && !self.isHoliday(deadlineDate))
			{
				deadlineDays--;
			}
			deadlineDate = deadlineDate.add(1, 'day');
		}

		if (deadlineDate.diff(departDate, 'days') > 0)
		{
			message = "Depart Date must be on or after " + deadlineDate.format("M/D/YYYY");
		}
		else
		{
			if (self.isHoliday(departDate))
			{
				message = "Depart Date falls on a holiday. " + departDate.format("M/D/YYYY") + ".";
			}
		}

		return message;
	};

	FieldTripDataEntryViewModel.prototype.checkBlockTimes = function(time)
	{
		if (!time)
		{
			return null;
		}
		var self = this, settings = self.obFieldTripSettings(), blockOutTimes = settings.BlockOutTimes || [],
			timeM = time.year(2000).month(0).date(1), begin, end, message;

		if (blockOutTimes.length === 0)
		{
			return null;
		}

		$.each(blockOutTimes, function(index, blockOutTime)
		{
			begin = moment(blockOutTime.BeginTime).year(2000).month(0).date(1);
			end = moment(blockOutTime.EndTime).year(2000).month(0).date(1);
			if ((timeM.isSame(begin) || timeM.isAfter(begin)) && (timeM.isSame(end) || timeM.isBefore(end)))
			{
				message = " is invalid because of the blackout period of " + begin.format("hh:mm A") + " and " + end.format("hh:mm A") + ".";
				return false;
			}
		});

		return message;
	};

	FieldTripDataEntryViewModel.prototype.clearDateTimeAlerts = function(type)
	{
		var departDateValidator = this.$form.find("#departDate>small[data-bv-validator=callback]"),
			returnDateValidator = this.$form.find("#returnDate>small[data-bv-validator=callback]"),
			departTimeValidator = this.$form.find("#departTime>small[data-bv-validator=callback]"),
			returnTimeValidator = this.$form.find("#returnTime>small[data-bv-validator=callback]"),
			skipDepartDate = departDateValidator.text().indexOf("after") >= 0,
			skipDepartTime = departTimeValidator.text().indexOf("blackout") >= 0,
			skipReturnTime = returnTimeValidator.text().indexOf("blackout") >= 0;

		switch (type)
		{
			case "time":
				if (!skipDepartTime)
				{
					departTimeValidator.hide();
				}
				if (!skipReturnTime)
				{
					returnTimeValidator.hide();
				}
				if (this.pageLevelViewModel.activeLostfouseName.indexOf("Time") !== -1) { this.pageLevelViewModel.activeLostfouseName = ""; }
				break;
			case "date":
				if (!skipDepartDate)
				{
					departDateValidator.hide();
				}
				returnDateValidator.hide();
				if (this.pageLevelViewModel.activeLostfouseName.indexOf("Date") !== -1) { this.pageLevelViewModel.activeLostfouseName = ""; }
				break;
			default:
				if (!skipDepartDate)
				{
					departDateValidator.hide();
				}
				if (!skipDepartTime)
				{
					departTimeValidator.hide();
				}
				returnDateValidator.hide();
				if (!skipReturnTime)
				{
					returnTimeValidator.hide();
				}
				this.pageLevelViewModel.activeLostfouseName = "";
				break;
		}
	};

	FieldTripDataEntryViewModel.prototype.addLinkToDate = function(e)
	{
		$(this.$form.parents()[3]).find(".linktoDepartDate").on("click", function()
		{
			this.$form.find("#departDate input[name=departDate]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoReturnDate").on("click", function()
		{
			this.$form.find("#returnDate input[name=estimatedReturnDate]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoDepartTime").on("click", function()
		{
			this.$form.find("#departTime input[name=departTime]").focus();
		}.bind(this));

		$(this.$form.parents()[3]).find(".linktoReturnTime").on("click", function()
		{
			this.$form.find("#returnTime input[name=estimatedReturnTime]").focus();
		}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.GetSchoolId = function(school)
	{
		var filters = this.obSchoolDataModels().filter(function(item)
		{
			return item.SchoolCode == school;
		});

		return (filters[0] && filters[0].Id) ? filters[0].Id : null;
	};

	FieldTripDataEntryViewModel.prototype.addDataEntryListItem = function(parameters)
	{
		var modifyDataEntryListItemModalViewModel = new TF.Modal.ModifyDataEntryListItemModalViewModel(parameters[0], "fieldtripdestination");
		tf.modalManager.showModal(modifyDataEntryListItemModalViewModel)
			.then(function(data)
			{
				if (modifyDataEntryListItemModalViewModel.newDataList.length > 0)
				{
					for (var i in modifyDataEntryListItemModalViewModel.newDataList)
					{
						parameters[1].push(modifyDataEntryListItemModalViewModel.newDataList[i]);
					}
					if (parameters[2])
					{
						this.obEntityDataModel()[parameters[2]](modifyDataEntryListItemModalViewModel.newDataList[i].Item);
					}
				}
				if (!data)
				{
					return;
				}
				parameters[1].push(data);
				if (parameters[2])
				{
					this.obEntityDataModel()[parameters[2]](data.Item);
				}
			}.bind(this));
	}

	FieldTripDataEntryViewModel.prototype.EditDataEntryListItem = function(parameters)
	{
		var select = $.grep(parameters[1](), function(d) { return d.Item == parameters[3] });
		if (select.length > 0)
		{
			if (select[0].Id == 0)
			{//once select None
				return;
			}

			tf.modalManager.showModal(new TF.Modal.ModifyDataEntryListItemModalViewModel(parameters[0], "fieldtripdestination", select[0].Id))
				.then(function(data)
				{
					if (!data)
					{
						return;
					}
					var index = parameters[1].indexOf(select[0]);
					parameters[1].splice(index, 1);
					parameters[1].push(data);
					if (parameters[2])
					{
						this.obEntityDataModel()[parameters[2]](data.Item);
					}
				}.bind(this));
		}
	}

	FieldTripDataEntryViewModel.prototype._fieldsUpdateFromModal = function(type, data)
	{
		switch (type)
		{
			case "destination":
				if (data == null)
				{
					this.obEntityDataModel().destinationStreet("");
					this.obEntityDataModel().destinationCity("");
					this.obEntityDataModel().destinationState("");
					this.obEntityDataModel().destinationZip("");
					this.obEntityDataModel().destinationEmail("");
					this.obEntityDataModel().destinationNotes("");
					this.obEntityDataModel().destinationContact("");
					this.obEntityDataModel().destinationContactTitle("");
					this.obEntityDataModel().destinationContactTitle("");
					this.obEntityDataModel().destinationFax("");
					this.obEntityDataModel().destinationContactPhone("");
				}
				else
				{
					this.obEntityDataModel().destinationStreet(data.Street);
					this.obEntityDataModel().destinationCity(data.City);
					this.obEntityDataModel().destinationState(data.State);
					this.obEntityDataModel().destinationZip(data.Zip);
					this.obEntityDataModel().destinationEmail(data.Email);
					this.obEntityDataModel().destinationNotes(data.Notes);
					this.obEntityDataModel().destinationContact(data.Contact);
					this.obEntityDataModel().destinationContactTitle(data.ContactTitle);
					this.obEntityDataModel().destinationContactTitle(data.ContactTitle);
					this.obEntityDataModel().destinationFax(data.Fax);
					this.obEntityDataModel().destinationContactPhone(data.Phone);
				}
				break;
			case "billingClassification":
				if (data == null)
				{
					this.obEntityDataModel().aideFixedCost("");
					this.obEntityDataModel().aideOtrate("");
					this.obEntityDataModel().aideRate("");
					this.obEntityDataModel().driverFixedCost("");
					this.obEntityDataModel().driverOtrate("");
					this.obEntityDataModel().driverRate("");
					this.obEntityDataModel().fixedCost("");
					this.obEntityDataModel().mileageRate("");
					this.obEntityDataModel().minimumCost("");
					this.obEntityDataModel().vehFixedCost("");
				}
				else
				{
					this.obEntityDataModel().aideFixedCost(data.AideFixedCost);
					this.obEntityDataModel().aideOtrate(data.AideOTRate);
					this.obEntityDataModel().aideRate(data.AideRate);
					this.obEntityDataModel().driverFixedCost(data.DriverFixedCost);
					this.obEntityDataModel().driverOtrate(data.DriverOTRate);
					this.obEntityDataModel().driverRate(data.DriverRate);
					this.obEntityDataModel().fixedCost(data.FixedCost);
					this.obEntityDataModel().mileageRate(data.MileageRate);
					this.obEntityDataModel().minimumCost(data.MinimumCost);
					this.obEntityDataModel().vehFixedCost(data.VehFixedCost);
				}
				break;
		}
	}
})();