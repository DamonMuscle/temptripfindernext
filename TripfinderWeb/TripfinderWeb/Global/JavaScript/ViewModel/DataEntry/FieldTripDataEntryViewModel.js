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
		this.obDepartureDateSaveValue = ko.observable();
		this.obDepartureTimeSaveValue = ko.observable();
		this.obReturnDateSaveValue = ko.observable();
		this.obReturnTimeSaveValue = ko.observable();
		this.obDuration = ko.observable();
		this.onAuditType = ko.observable();
		this.obTemplateSource = ko.observableArray();
		this.obSchoolDataModels = ko.observableArray();
		this.obAllSchoolDataModels = ko.observableArray();
		this.obDepartmentDataModels = ko.observableArray();
		this.currentDistrictDepartmentId = null;
		this.obActivityDataModels = ko.observableArray();
		this.obFieldTripSettings = ko.observable({});
		this.obStrictDest = ko.observable(false);
		this.fieldTripAccountList = [];
		this.obClassificationDataModels = ko.observableArray();
		this.obEquipmentDataModels = ko.observableArray();
		this.obDestinationDataModels = ko.observableArray();
		this.obFieldTripResourceGroupData = ko.observableArray();

		this.obInvoicingGridViewModel = ko.observable(null);
		this.obTotalCost = ko.observable(0);
		this.obShowTotalCost = ko.observable(false);
		$.extend(this, new TF.Helper.FieldTripResourcesHelper());
		this.obResourcesTotalComputer = ko.computed(this.resourcesTotalComputer, this);

		this.obResourcesGridViewModel = ko.observable(null);
		this.obInvoiceResourceId = ko.observable(1);
		this.obInvoiceGridDataSource = ko.observableArray();

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

		this.obSelectedSchool = ko.observable();
		this.obSelectedSchool.subscribe(this.setSelectValue("school", "obSelectedSchool", function(obj)
		{
			this.setAccountListBySchool(obj ? obj.SchoolCode : null);
			return obj ? obj.SchoolCode : "";
		}.bind(this)), this);
		this.obCurrentSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "school", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

		this.obSelectedDepartment = ko.observable();
		this.obSelectedDepartment.subscribe(this.setSelectValue("districtDepartmentId", "obSelectedDepartment", function(obj) { return obj ? obj.Id : null; }), this);
		this.obCurrentDepartmentName = ko.computed(this.setSelectTextComputer("obDepartmentDataModels", "districtDepartmentId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedActivity = ko.observable();
		this.obSelectedActivity.subscribe(this.setSelectValue("fieldTripActivityId", "obSelectedActivity", function(obj) { return obj ? obj.Id : null; }), this);
		this.obCurrentActivityName = ko.computed(this.setSelectTextComputer("obActivityDataModels", "fieldTripActivityId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedAccount = ko.observable();
		this.obCurrentAccountName = ko.observable("");
		this.obSelectedAccount.subscribe(function()
		{
			if (this.obSelectedAccount())
			{
				if (this.obSelectedAccount().Id < 0)
				{
					this.obCurrentAccountName("");
					if (this.obSelectedSchool())
					{
						this.obEntityDataModel().districtDepartmentId(null);
						this.obEntityDataModel().districtDepartmentName(null);
						this.obEntityDataModel().fieldTripActivityId(null);
						this.obEntityDataModel().fieldTripActivityName(null);
					}
				}
				else
				{
					this.obCurrentAccountName(this.obSelectedAccount().Department.Name + ' / ' + this.obSelectedAccount().FieldTripActivity.Name);
					this.obEntityDataModel().districtDepartmentId(this.obSelectedAccount().Department.Id);
					this.obEntityDataModel().districtDepartmentName(this.obSelectedAccount().Department.Name);
					this.obEntityDataModel().fieldTripActivityId(this.obSelectedAccount().FieldTripActivity.Id);
					this.obEntityDataModel().fieldTripActivityName(this.obSelectedAccount().FieldTripActivity.Name);
				}
			}

		}.bind(this));

		this.obSelectedClassification = ko.observable();
		this.obSelectedClassification.subscribe(this.setSelectValue("fieldTripClassificationId", "obSelectedClassification", function(obj) { return obj ? obj.Id : null; }), this);
		this.obCurrentClassificationName = ko.computed(this.setSelectTextComputer("obClassificationDataModels", "fieldTripClassificationId", function(obj) { return obj.Id; }, function(obj) { return obj.Name; }), this);

		this.obSelectedEquipment = ko.observable();
		this.obSelectedEquipment.subscribe(this.setSelectValue("fieldTripEquipmentId", "obSelectedEquipment", function(obj) { return obj ? obj.Id : null; }), this);
		this.obCurrentEquipmentName = ko.computed(this.setSelectTextComputer("obEquipmentDataModels", "fieldTripEquipmentId", function(obj) { return obj.Id; }, function(obj) { return obj.EquipmentName; }), this);

		this.obSelectedDestination = ko.observable();
		this.obSelectedDestination.subscribe(
			this.setSelectValue("destination", "obSelectedDestination", function(obj)
			{
				return obj ? obj.Name : 0;
			}), this);
		this.obCurrentDestinationName = ko.computed(function()
		{
			return this.obEntityDataModel().destination();
		}, this);
		this.obSelectedDestination.subscribe(function()
		{
			this._fieldsUpdateFromModal("destination", this.obSelectedDestination());
		}.bind(this));

		this.obSelectedDepartFromSchool = ko.observable();
		this.obSelectedDepartFromSchool.subscribe(this.setSelectValue("departFromSchool", "obSelectedDepartFromSchool", function(obj) { return obj ? obj.SchoolCode : ""; }), this);
		this.obCurrentDepartFromSchoolName = ko.computed(this.setSelectTextComputer("obSchoolDataModels", "departFromSchool", function(obj) { return obj.SchoolCode; }, function(obj) { return obj.Name; }), this);

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
				if (!!inputValue)
				{
					this.obEntityDataModel()[key]('');
				}
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
						self.obEntityDataModel().updateEntityBackup();
					});
			}
		}
		else
		{
			if (tf.permissions.documentRead && tf.permissions.documentAdd)
			{
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentClassifications"))
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

	FieldTripDataEntryViewModel.prototype.filterSchoolByPermission = function(schools)
	{
		var schoolsWithPermission = tf.authManager.authorizationInfo.authorizationTree.schools;
		return $.grep(schools, function(school)
		{
			return schoolsWithPermission.indexOf(school.SchoolCode) >= 0;
		});
	};

	FieldTripDataEntryViewModel.prototype.loadSupplement = function()
	{
		var self = this, fieldtripData,
			filterEmptyRecordsByFields = function(items, fields)
			{
				if (Array.isArray(items))
				{
					return items.filter(function(item)
					{
						for (var fi = 0; fi < fields.length; ++fi)
						{
							if (!$.trim(item[fields[fi]])) return false;
						}
						return true;
					});
				}

				return [];
			};

		var promises = [tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripTemplates")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "Schools")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DistrictDepartments")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripActivities")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripClassifications")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripEquipments")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripDestinations")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "FieldTripConfigs")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "RequiredFields")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "MailingCities")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "MailingPostalCodes")),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "FieldTripAccounts"))];
		return Promise.all(promises).then(function(result)
		{
			var fieldtripData = {};
			fieldtripData.FieldTripTemplate = filterEmptyRecordsByFields(result[0].Items, ["Name"]);
			fieldtripData.School = self.filterSchoolByPermission(filterEmptyRecordsByFields(result[1].Items, ["Name", "SchoolCode"]));
			fieldtripData.FieldTripDistrictDepartment = filterEmptyRecordsByFields(result[2].Items, ["Name"]);
			fieldtripData.FieldTripActivity = filterEmptyRecordsByFields(result[3].Items, ["Name"]);
			fieldtripData.FieldTripClassification = filterEmptyRecordsByFields(result[4].Items, ["Name"]);
			fieldtripData.FieldTripEquipment = filterEmptyRecordsByFields(result[5].Items, ["EquipmentName"]);
			fieldtripData.FieldTripDestination = filterEmptyRecordsByFields(result[6].Items, ["Name"]);
			fieldtripData.FieldTripConfigs = result[7].Items && result[7].Items.length > 0 ? result[7].Items[0] : {};
			fieldtripData.RequiredField = result[8].Items.filter(function(item) { return item.DataTypeID === 4 });
			fieldtripData.MailCity = result[9].Items;
			fieldtripData.MailZip = result[10].Items;
			fieldtripData.FieldTripAccount = result[11].Items;

			self.getTemplate(fieldtripData.FieldTripTemplate);
			if (tf.authManager.authorizationInfo.isAdmin)
			{
				self.obSchoolDataModels(fieldtripData.School);
			}
			else
			{
				self.obSchoolDataModels(Enumerable.From(fieldtripData.School).Where(function(school)
				{
					return tf.authManager.authorizationInfo.authorizationTree.schools.indexOf(school.SchoolCode) >= 0;
				}).ToArray());
			}
			self.obAllSchoolDataModels(fieldtripData.School);
			self.fieldTripDistrictDepartments = fieldtripData.FieldTripDistrictDepartment;
			self.obDepartmentDataModels($.grep(self.fieldTripDistrictDepartments, function(item, index)
			{
				return self.hasPermissionForDistrictDepartment(item.Id)
			}));
			self.obActivityDataModels(fieldtripData.FieldTripActivity);
			self.obClassificationDataModels(fieldtripData.FieldTripClassification);
			self.obEquipmentDataModels(fieldtripData.FieldTripEquipment);
			self.obDestinationDataModels(fieldtripData.FieldTripDestination);
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
			self.obFieldTripSettings(fieldtripData.FieldTripConfigs);
			self.obShowTotalCost(fieldtripData.FieldTripConfigs.ShowTripTotalCost);
			self.obStrictDest(fieldtripData.FieldTripConfigs.StrictDest);
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
		self.obDocumentGridDataSource().forEach(function(gridData)
		{
			gridData.NeedSave = null;
		});
	};
	FieldTripDataEntryViewModel.prototype.getTemplate = function(data, isNew)
	{
		var self = this;
		if (isNew)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtriptemplate"))
				.then(function(response)
				{
					response.Items = response.Items.sort(function(a, b)
					{
						if (a.Name.toUpperCase() === b.Name.toUpperCase())
						{
							return 0;
						}
						return a.Name.toUpperCase() > b.Name.toUpperCase() ? 1 : -1;
					});
					response.Items.unshift({ Name: "None", Id: 0 });
					this.obTemplateSource(response.Items);
				}.bind(this));
		} else
		{
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
		}
	};

	FieldTripDataEntryViewModel.prototype.hasPermissionForDistrictDepartment = function(id)
	{
		var departmentIdsWithPermission = tf.authManager.authorizationInfo.authorizationTree.districtDepartmentIds;

		if (tf.authManager.authorizationInfo.isAdmin || tf.authManager.authorizationInfo.isFieldTripAdmin)
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
				self.obCurrentAccountName("");
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
							selectIndex = accountList.length - 1;
						}
					}
				}
			});

			self.obAccount(accountList);

			if (selectIndex > -1)
			{
				this.obSelectedAccount(self.obAccount()[selectIndex]);
			}
			else if (!initialize)
			{
				self.obCurrentAccountName("");
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

				if (this.obEntityDataModel().departDate())
				{
					this.obEntityDataModel().departDate(moment(this.obEntityDataModel().departDate()).format("YYYY-MM-DD") + "T00:00:00.000");
				}

				if (this.obEntityDataModel().returnDate())
				{
					this.obEntityDataModel().returnDate(moment(this.obEntityDataModel().returnDate()).format("YYYY-MM-DD") + "T00:00:00.000");
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

					if (!this.obEntityDataModel().districtDepartmentName())
					{
						this.obEntityDataModel().districtDepartmentId(null);
						this.obEntityDataModel().apiIsDirty(false);
					}

					if (!this.obEntityDataModel().fieldTripActivityName())
					{
						this.obEntityDataModel().fieldTripActivityId(null);
						this.obEntityDataModel().apiIsDirty(false);
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

				this.obDepartureDateSaveValue(this.obEntityDataModel().departDate());
				this.obDepartureTimeSaveValue(this.obEntityDataModel().departTime());
				this.obReturnDateSaveValue(this.obEntityDataModel().returnDate());
				this.obReturnTimeSaveValue(this.obEntityDataModel().returnTime());

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
					item.Comments = item.Notes;
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
					if (this.obFieldTripSettings().StrictAcctCodes)
					{
						this.setAccountListBySchool(this.obEntityDataModel().school());

						var departmentName, activityName;
						$.each(this.obDepartmentDataModels(), function(index, item)
						{
							if (item.Id === this.obEntityDataModel().districtDepartmentId())
							{
								departmentName = item.Name;
								return false;
							}
						}.bind(this));
						$.each(this.obActivityDataModels(), function(index, item)
						{
							if (item.Id === this.obEntityDataModel().fieldTripActivityId())
							{
								activityName = item.Name;
								return false;
							}
						}.bind(this));

						this.obCurrentAccountName((departmentName || "[Any]") + ' / ' + (activityName || "[Any]"));
						this.setAccountListBySchool(this.obEntityDataModel().school());
					}
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
				}

				if (item.DriverId && item.Driver)
				{
					item.driverTotal = this.driverTotalCostComputer(item);
					item.DriverName = item.Driver.FirstName + " " + item.Driver.LastName;
				}

				if (item.AideId && item.Aide)
				{
					item.aideTotal = this.busAideCostComputer(item);
					item.AideName = item.Aide.FirstName + " " + item.Aide.LastName;
				}

			}.bind(this));
		}
		this.obResourcesGridViewModel(new TF.Control.GridControlViewModel("fieldtripresourcegroup", [], this.obEntityDataModel().id(), "resource", null, null, null, this.obFieldTripResourceGroupData(), "resource", true));
		if (!tf.authManager.authorizationInfo.isFieldTripAdmin)
		{
			this.obResourcesGridViewModel().obEditEnable(false);
			this.obResourcesGridViewModel().obCanAdd(false);
		}
	};

	FieldTripDataEntryViewModel.prototype.ReloadResources = function()
	{
		var obGridViewModel = this.obResourcesGridViewModel().obGridViewModel();
		if (!obGridViewModel || !obGridViewModel.searchGrid || !obGridViewModel.searchGrid.kendoGrid) return;

		var resSearchGrid = obGridViewModel.searchGrid, resKendoGrid = resSearchGrid.kendoGrid;
		if (!resKendoGrid) return;

		this.obFieldTripResourceGroupData().forEach(function(item)
		{
			if (item.Chaperone == "" && item.Chaperone2 == "" && item.Chaperone3 == "" && item.Chaperone4 == "")
			{
				item.Chaperone = "None";
			}

			if (item.VehicleId)
			{
				item.VehTotal = this.vehicleCostComputer(item);
			}

			if (item.DriverId)
			{
				item.driverTotal = this.driverTotalCostComputer(item);
			}

			if (item.AideId)
			{
				item.aideTotal = this.busAideCostComputer(item);
			}
		}.bind(this));

		var resourceSort = resKendoGrid.dataSource.sort(),
			resourceSource = new kendo.data.DataSource({
				data: this.obFieldTripResourceGroupData(),
				sort: resourceSort
			});
		resKendoGrid.setDataSource(resourceSource);
		resSearchGrid.rebuildGrid(resourceSort);

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
		entity.FieldTripDocuments = entity.FieldTripDocuments.filter(function(item)
		{
			return item.NeedSave;
		});
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
		tf.modalManager.showModal(new e.data.modal(null, this.obEntityDataModel().id(), this.obFieldTripResourceGroupData(),
			this.obEntityDataModel().id() > 0 ? this.obEntityDataModel() : null))
			.then(function(data)
			{
				if (data)
				{
					this.obResourceId(this.obResourceId() + 1);
					data.resourceId = this.obResourceId();

					this.obFieldTripResourceGroupData.push(data);
					this.ReloadResources();
				}
				this.checkGridsData();
			}.bind(this));
	};

	FieldTripDataEntryViewModel.prototype.editEvent = function(e)
	{
		var row = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.select();
		if (row.length)
		{
			var data = e.data.gridView().obGridViewModel().searchGrid.kendoGrid.dataItem(row);
			tf.modalManager.showModal(new e.data.modal(data, this.obEntityDataModel().id(), this.obFieldTripResourceGroupData(),
				this.obEntityDataModel().id() > 0 ? this.obEntityDataModel() : null))
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
					this.checkGridsData();
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
			this.checkGridsData();
		}
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
		if (this.obRequiredFields() && this.obRequiredFields().FieldTripAccountID && this.obRequiredFields().FieldTripAccountID.Required &&
			this.obInvoicingGridViewModel().obGridViewModel() && this.obInvoicingGridViewModel().obGridViewModel().searchGrid)
		{
			this.obInvoicingGridViewModel().obGridViewModel().searchGrid.onDataBoundEvent.subscribe(function()
			{
				$(el).find("th[data-kendo-field='AccountName'] .k-link").addClass("required");
			});
		}
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
	};

	FieldTripDataEntryViewModel.prototype.addInvoiceEvent = function(e)
	{
		var option = {
			entityId: this.obEntityDataModel().id(),
			entityType: "fieldtrip",
			strictAcctCodes: this.obFieldTripSettings().StrictAcctCodes,
			selectAccount: this.obSelectedAccount(),
			selectedSchool: this.obEntityDataModel().school(),
			requiredFields: this.obRequiredFields()
		};
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
				this.checkGridsData();
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

			var option = {
				entityId: this.obEntityDataModel().id(),
				entityType: "fieldtrip", data: data,
				strictAcctCodes: this.obFieldTripSettings().StrictAcctCodes,
				selectAccount: this.obSelectedAccount(),
				selectedSchool: this.obEntityDataModel().school(),
				requiredFields: this.obRequiredFields()
			};

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
					this.checkGridsData();
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

			this.checkGridsData();
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

	FieldTripDataEntryViewModel.prototype.isDocumentsSame = function()
	{
		var docs1 = this.obEntityDataModel()._entityBackup.FieldTripDocuments || [], docs2 = this.obDocumentKendoDataSource() || [];

		if (!tf.permissions.documentRead)
		{
			return true;
		}

		if (docs1.length !== docs2.length)
		{
			return false;
		}

		if (docs1.length === 0)
		{
			return true;
		}

		docs1 = sortArray(docs1, docs1[0].hasOwnProperty("Filename") ? "Filename" : "FileName");
		docs2 = sortArray(docs2, docs2[0].hasOwnProperty("Filename") ? "Filename" : "FileName");

		for (var i = 0; i < docs1.length; i++)
		{
			if ((docs1[i].Description || "") !== (docs2[i].Description || "") ||
				docs1[i].DocumentEntity.DocumentClassificationId !== docs2[i].DocumentEntity.DocumentClassificationId ||
				(docs1[i].FileName || docs1[i].Filename) !== (docs2[i].FileName || docs2[i].Filename) ||
				(docs1[i].FileSizeKb || docs1[i].DocumentEntity.FileSizeKb) !== (docs2[i].FileSizeKb || docs2[i].DocumentEntity.FileSizeKb))
			{
				return false;
			}
		}
		return true;
	};

	FieldTripDataEntryViewModel.prototype.isInvoicesSame = function()
	{
		var invoices1 = this.obEntityDataModel()._entityBackup.FieldTripInvoice || [], invoices2 = this.obInvoiceGridDataSource() || [];

		if (invoices1.length !== invoices2.length)
		{
			return false;
		}
		invoices1 = sortArray(invoices1, "Id", true);
		invoices2 = sortArray(invoices2, "Id", true);

		for (var i = 0; i < invoices1.length; i++)
		{
			var fields = ["FieldTripAccountId", "Amount", "InvoiceDate", "PaymentDate", "PurchaseOrder"];
			if (!this.areFieldsSame(invoices1[i], invoices2[i], fields))
			{
				return false;
			}
		}
		return true;
	};

	FieldTripDataEntryViewModel.prototype.areFieldsSame = function(entity1, entity2, fields)
	{
		for (var i = 0; i < fields.length; i++)
		{
			if (String(entity1[fields[i]]) !== String(entity2[fields[i]]))
			{
				return false;
			}
		}
		return true;
	};

	FieldTripDataEntryViewModel.prototype.isResourcesSame = function()
	{
		var resource1 = this.obEntityDataModel()._entityBackup.FieldTripResourceGroup || [], resource2 = this.obFieldTripResourceGroupData() || [];

		if (resource1.length !== resource2.length)
		{
			return false;
		}
		resource1 = Enumerable.From(resource1).OrderBy(function(c) { return c.AideId }).ThenBy(function(c) { return c.DriverId }).ThenBy(function(c) { return c.VehicleId }).ToArray();
		resource2 = Enumerable.From(resource2).OrderBy(function(c) { return c.AideId }).ThenBy(function(c) { return c.DriverId }).ThenBy(function(c) { return c.VehicleId }).ToArray();

		for (var i = 0; i < resource1.length; i++)
		{
			var fields = ["AideFixedCost", "AideHours", "AideId", "AideOthours", "AideOtrate", "AideRate", "Chaperone", "Chaperone2", "Chaperone3", "Chaperone4",
				"DriverExpMeals", "DriverExpMisc", "DriverExpParking", "DriverExpTolls", "DriverFixedCost", "DriverHours", "DriverId", "DriverOthours", "DriverOtrate", "DriverRate",
				"Endingodometer", "MileageRate", "Startingodometer", "VehFixedCost", "VehicleId"];
			if (!this.areFieldsSame(resource1[i], resource2[i], fields))
			{
				return false;
			}
		}
		return true;
	};

	FieldTripDataEntryViewModel.prototype.checkGridsData = function()
	{
		var backupEntity = $.extend({}, this.obEntityDataModel()._entityBackup),
			currentEntity = $.extend({}, this.obEntityDataModel().toData()), otherChanged;

		delete backupEntity.FieldTripDocuments;
		delete backupEntity.FieldTripInvoice;
		delete backupEntity.FieldTripResourceGroup;
		delete currentEntity.FieldTripDocuments;
		delete currentEntity.FieldTripInvoice;
		delete currentEntity.FieldTripResourceGroup;
		otherChanged = !this.obEntityDataModel().equals(backupEntity, currentEntity);
		this.obEntityDataModel().apiIsDirty(otherChanged || !this.isDocumentsSame() || !this.isInvoicesSame() || !this.isResourcesSame());
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

							obDocument.FileContent = "";
							obDocument.DocumentEntity.FileContent = "";
							obDocument.FileSizeKb = 0;
						}
						else
						{
							obDocument.LastUpdated = moment().format("MM/DD/YYYY");
							obDocument.LastUpdatedName = tf.authManager.authorizationInfo.authorizationTree.username;
							obDocument.FileSizeKb = byteLength(result.FileContent);
						}
						obDocument.Id = self.tempId - 1;
						self.tempId = self.tempId - 1;
						obDocument.NeedSave = true;
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

				self.checkGridsData();
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
									obDocument.NeedSave = true;
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
						this.checkGridsData();
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
						item.NeedSave = true;
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
			self.checkGridsData();
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
					if (this.obEntityDataModel().departTime())
					{
						this.$form.data("bootstrapValidator").updateStatus('departTime', 'NOT_VALIDATED');
						this.$form.data("bootstrapValidator").validateField("departTime");
					}
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
						if (this.obEntityDataModel().returnTime())
						{
							this.$form.data("bootstrapValidator").updateStatus('estimatedReturnTime', 'NOT_VALIDATED');
							this.$form.data("bootstrapValidator").validateField("estimatedReturnTime");
						}
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

					if (this.obEntityDataModel().returnTime())
					{
						this.$form.data("bootstrapValidator").updateStatus('estimatedReturnTime', 'NOT_VALIDATED');
						this.$form.data("bootstrapValidator").validateField("estimatedReturnTime");
					}
					if (returnDate.isSame(departDate, "day"))
					{
						this.clearDateTimeAlerts("date");

						if (this.obEntityDataModel().departTime())
						{
							this.$form.data("bootstrapValidator").updateStatus('departTime', 'NOT_VALIDATED');
							this.$form.data("bootstrapValidator").validateField("departTime");
						}

						if (this.obEntityDataModel().departDate())
						{
							this.$form.data("bootstrapValidator").updateStatus('departDate', 'NOT_VALIDATED');
							this.$form.data("bootstrapValidator").validateField("departDate");
						}
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

					var message = this.checkBlockTimes(m, this.obEntityDataModel().departDate());
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
						this.clearDateTimeAlerts("time");
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

					var message = this.checkBlockTimes(m, this.obEntityDataModel().returnDate());
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
						this.clearDateTimeAlerts("time");
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
		// FT-988 If in edit model, the departure date and return date didn't change, then didn't check the dead line.
		if (((this.obDepartureDateSaveValue() == null && this.obEntityDataModel().departDate() == null) ||
			(this.obDepartureDateSaveValue() !== null && this.obEntityDataModel().departDate() != null &&
				this.obDepartureDateSaveValue().substring(0, 10) === this.obEntityDataModel().departDate().substring(0, 10))))
		{
			return null;
		}

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

	FieldTripDataEntryViewModel.prototype.checkBlockTimes = function(time, date)
	{
		date = moment(date);
		if (!time || this.isHoliday(date) || date.weekday() === 6 || date.weekday() === 0)
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
					this.obEntityDataModel().destinationPhoneExt("");
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
					this.obEntityDataModel().destinationPhoneExt(data.PhoneExt);
				}
				break;
		}
	}

	FieldTripDataEntryViewModel.prototype.tryGoAway = function(pageName, yesNoStr)
	{
		var self = this;
		if (self.obEntityDataModel().apiIsDirty())
		{
			if (!yesNoStr)
			{
				yesNoStr = "You have unsaved changes. Would you like to save your changes prior to opening up " + pageName + "?";
			}
			return tf.promiseBootbox.yesNo(yesNoStr, "Unsaved Changes")
				.then(function(result)
				{
					if (result)
					{
						return Promise.resolve().then(function()
						{
							return self.trySave();
						}.bind(self));
					}
					else
					{
						return Promise.resolve(result === false);
					}
				}.bind(self));
		}
		else
		{
			return Promise.resolve(true);
		}
	};
})();