(function()
{
	const SPECIFY_RECORD_TYPE_ALL = 1;
	const SPECIFY_RECORD_TYPE_FILTER = 2;
	const SPECIFY_RECORD_TYPE_MY_RECORD = 3;
	const SPECIFY_RECORD_TYPE_SPECIFIC = 4;
	const DEFAULT_THANK_YOU_MESSAGE = 'Thank you! Your response was submitted.';
	const thankYouMessageSelector = 'input[name=thankYouMessage]';
	const CSS_OVERFLOW_Y = "overflow-y";
	const SYSTEM_FIELD_TYPE_ID = 13

	const ADMIN_ROLE_KEY = -1;
	const PUBLIC_ROLE_KEY = 0;
	const DEFAULT_PRIVATE_ROLES_KEYS = [ADMIN_ROLE_KEY];
	const DEFAULT_PUBLIC_ROLES_KEYS = [ADMIN_ROLE_KEY, PUBLIC_ROLE_KEY];
	const ADMIN_ROLE_ITEM = { text: "Administrator", value: ADMIN_ROLE_KEY };
	const PUBLIC_ROLE_ITEM = { text: "Public", value: PUBLIC_ROLE_KEY };

	createNamespace("TF.UserDefinedField").EditUserDefinedFieldGroupViewModel = EditUserDefinedFieldGroupViewModel;

	let _PRIMARY_GRID_COLUMNS = [
		{
			field: "ID",
			title: "UserDefinedFieldId",
			width: "50px",
			hidden: true,
			onlyForFilter: true
		},
		{
			title: "",
			width: "45px",
			template: function(item)
			{
				return "<div class='item-drag-icon'></div>";
			}
		},
		{
			field: "Name",
			title: "Name",
			width: "400px",
			template: function(item)
			{
				return TF.DetailView.UserDefinedGridHelper.formatHtmlContent(item.Name);
			}
		},
		{
			field: "TypeName",
			title: "Type",
			width: "200px"
		}
	];

	let _obGridSelectedUids = ko.observableArray(),
		_selectedColGrid = null,
		_tmpUDGridFields = [],
		_tmpUDGridSections = [],
		_KendoUid = "kendoUid";

	let UDFGroupBackgroundDefaultColor = '#4a4a4a';

	const AttachmentTypeId = 14;
	const SignatureTypeId = 15;

	// RW-19037
	const optionTypeDict = {
		Attachment: {
			TypeName: "Attachment",
			TypeId: AttachmentTypeId,
			Type: AttachmentTypeId,
			Required: false,
			Index: 999998,
		},
	}

	function EditUserDefinedFieldGroupViewModel(options)
	{
		let self = this;
		self.options = options;
		self.dataType = options.dataType;

		const dataTypeDisplayLabel = tf.dataTypeHelper.getFormDataType(self.dataType) || options.newCopyContext.selectedDataType.Type;
		self.obSpecifyRecordsLabel = ko.observable(`Specify ${dataTypeDisplayLabel} Records`);
		if (!options.dataType && options.newCopyContext && options.newCopyContext.selectedDataType)
		{
			self.dataType = options.dataType = tf.dataTypeHelper.getKeyById(options.newCopyContext.selectedDataType.ID);
		}
		options.dataType = self.dataType;
		if (options.newCopyContext && options.newCopyContext.isCopy && options.dataEntity)
		{
			options.dataEntity.isCopy = true;
			options.dataEntity.Name = options.newCopyContext.copyName;
		}
		self.obCurrentUdfCount = ko.observable(0);
		self.isEdit = options.dataEntity && !options.dataEntity.isCopy;
		self.isCopy = options.dataEntity && options.dataEntity.isCopy;
		self.obTitle = ko.observable('Add Form');
		self.dataEntity = options.dataEntity || {};
		self.initialDataEntity = JSON.parse(JSON.stringify(self.dataEntity));
		self.obDisableShowOneSection = ko.observable(true);
		self.obDisplayOneSection = ko.observable(self.dataEntity ? self.dataEntity.DisplayOneSection : false);
		self.obDisableDisplayOneSection = ko.observable(false);
		self.obUDGridSectionCount = ko.observable(0);
		if (!self.dataEntity.UDGridFields)
		{
			self.dataEntity.UDGridFields = []
			_tmpUDGridFields = JSON.parse(JSON.stringify(self.dataEntity.UDGridFields));
		}
		// handle section and field relationship when import
		if (options.isImport)
		{
			self.handleSectionFieldRelationshipWhenImport(options.dataEntity);
		}

		if (self.dataEntity && self.dataEntity.UDGridFields && self.dataEntity.UDGridFields.length > 0 && self.dataEntity.UDGridSections && self.dataEntity.UDGridSections.length > 0)
		{
			self.handleSections();
			self.obDisableShowOneSection(false || self.options.detailViewIsReadOnly);
		}

		if (self.isCopy)
		{
			TF.DetailView.UserDefinedGridHelper.removeIdentityInfo(self.dataEntity);
			TF.DetailView.UserDefinedGridHelper.removeIdentityInfo(options.dataEntity);
		}

		self.$form = null;

		if (!self.dataEntity.UDGridSections)
		{
			self.dataEntity.UDGridSections = []
		}

		_tmpUDGridSections = [];
		if (options.dataEntity && options.dataEntity.UDGridSections && options.dataEntity.UDGridSections.length > 0)
		{
			_tmpUDGridSections = JSON.parse(JSON.stringify(options.dataEntity.UDGridSections));
		}

		_tmpUDGridFields = [];
		if (options.dataEntity && options.dataEntity.UDGridFields && options.dataEntity.UDGridFields.length > 0)
		{
			_tmpUDGridFields = JSON.parse(JSON.stringify(self.dataEntity.UDGridFields));
		}

		self.sortUDGridFieldsByIndex();
		self.sortUDGridSectionsByIndex();
		self.isSystemDefined = options.isSystemDefined;
		self.isUDFGroup = options.isUDFGroup;
		self.TYPES = [
		];

		self.obDefaultValueTemplate = ko.observable(null);
		self.obDefaultValue = ko.observable(null);
		self.obDefaultValueSource = ko.observable(null);
		self.obName = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.Name : null);
		self.obDescription = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.Description : null);
		self.obExternalID = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.ExternalID : null);
		self.obEnableIPAddress = ko.observable(false);
		self.obPublic = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.Public : false);
		self.obOneResponsePerRecipient = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.OneResponsePerRecipient : false);
		self.obNotShowInFormfinder = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.NotShowInFormfinder : false);
		self.obAllowViewForm = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.AllowViewForm : false);
		self.obAllowViewAllSubmittedForms = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.AllowViewAllSubmittedForms : false);
		self.obAllowSubmitNewForm = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.AllowSubmitNewForm : false);

		self.obExpiredDate = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.ExpiredOn : null);
		self.obExpiredTime = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.ExpiredOn : null);
		self.obIPAddressEnable = ko.observable(true);
		self.obIPAddressBoundary = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.IPAddressBoundary : null);
		self.obExpiredOnChecked = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.HasExpiredOn : false);
		self.obActiveOnChecked = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.HasActiveOn : false);
		self.obGeofenceBoundaries = ko.observable(self.isEdit || self.isCopy ? JSON.parse(self.dataEntity.GeofenceBoundaries) : null);
		self.obExpiredOnDate = ko.observable(null);
		self.obExpiredOnTime = ko.observable(null);
		self.obActiveOnDate = ko.observable(null);
		self.obActiveOnTime = ko.observable(null);
		self.obURL = ko.observable('');
		self.canAdd = ko.observable(tf.authManager.hasFormsGridAccess('add'));
		self.canEdit = ko.observable(tf.authManager.hasFormsGridAccess('edit'));
		self.canAssignRole = ko.observable(tf.authManager.hasFormsGridAccess('save'));
		self.obDisableOneResponsePerRecipient = ko.observable(true);
		self.obDisablePublic = ko.observable(false || self.options.detailViewIsReadOnly);
		self.obDisableSubmitNewForm = ko.observable(false);

		self.checkUDGridSections();
		if ((self.isEdit || self.isCopy) && self.dataEntity.ExpiredOn)
		{
			const expiredOn = utcToClientTimeZone(self.dataEntity.ExpiredOn);
			self.obExpiredOnDate(expiredOn.format("MM/DD/YYYY"));
			self.obExpiredOnTime(expiredOn.format("h:mm A"));
		}

		if ((self.isEdit || self.isCopy) && self.dataEntity.ActiveOn)
		{
			const activeOn = utcToClientTimeZone(self.dataEntity.ActiveOn);
			self.obActiveOnDate(activeOn.format("MM/DD/YYYY"));
			self.obActiveOnTime(activeOn.format("h:mm A"));
		}

		self.kendoGridHelper = tf.helpers.kendoGridHelper;
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		if (options.dataEntity && options.dataEntity.Id && self.dataEntity.IPAddressBoundary)
		{
			self.existFormSubmission(options.dataEntity.Id).then(exists =>
			{
				self.obIPAddressEnable(!exists);
			});
		}

		self.allDataources = tf.datasourceManager.datasources.map(function(x) { return { value: x.DBID, text: x.Name } });
		self.allDataources.sort(function(a, b)
		{
			return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1;
		});
		self.selectedIds = Array.from((self.dataEntity || {}).UDGridDataSources || []).map(function(i) { return i.DBID; });

		if (self.selectedIds.length === 0 && !self.isEdit)
		{
			self.selectedIds.push(parseInt(localStorage.getItem("datasourceId")));
		}
		let selectedList = self.allDataources.filter(function(item) { return self.selectedIds.includes(item.value); });
		self.obSelectedDataSources = ko.observableArray(selectedList);
		self.obSelectedDataSources.subscribe(self._selectedDataSourcesChanged, self);
		self.displayDsText = self.displayDsText.bind(self);
		self.onCloseListMover = new TF.Events.Event();
		self.onEditorModelInitComplete = new TF.Events.Event();

		self.obQuestionValidationText = ko.observable("");
		self.obShowQuestionValidationText = ko.computed(function()
		{
			return self.obQuestionValidationText() && self.obQuestionValidationText().length > 0;
		}, this);

		// addition option
		let gridOptions = {};
		if (self.dataEntity.GridOptions)
		{
			gridOptions = JSON.parse(self.dataEntity.GridOptions);
		}
		self.obIsLocationRequired = ko.observable(!!gridOptions.IsLocationRequired);
		self.initIsLocationRequired = !!gridOptions.IsLocationRequired;
		self.DocumentFieldIndex = gridOptions.DocumentFieldIndex != null ? gridOptions.DocumentFieldIndex : -1;
		self.obBackgroundColor = ko.observable(TF.Color.toLongColorFromHTMLColor(gridOptions.BackgroundColor || UDFGroupBackgroundDefaultColor));
		self.obCurrentImageUrl = ko.observable(gridOptions.CurrentImageUrl);
		self.obImageFitMode = ko.observable(gridOptions.ImageFitMode);

		//field grid section
		self.commandGridColumns = [
			{
				command: [
					{
						name: "copyandnew",
						template: "<a class=\"k-button k-button-icontext k-grid-copyandnew\" title=\"Copy\"><span class=\"k-icon k-edit\"></span>Copy</a>",
						click: self.onCopyAndNewGroupFieldBtnClick.bind(self)
					},
					{
						name: "edit",
						template: "<a class=\"k-button k-button-icontext k-grid-edit\" title=\"Edit\"><span class=\"k-icon k-edit\"></span>Edit</a>",
						click: self.onEditGroupFieldBtnClick.bind(self)
					},
					{
						name: "delete",
						template: "<a class=\"k-button k-button-icontext k-grid-delete\" title=\"Delete\"><span class=\" \"></span>delete</a>",
						click: self.onDeleteGroupFieldBtnClick.bind(self)
					}],
				title: "Action",
				width: "120px",
				attributes: {
					"class": "text-center"
				}
			}
		];

		//field tree list section
		self.commandTreeListColumns = [
			{
				command: [
					{
						name: "copyandnewSection",
						text: "copySection",
						className: "k-grid-copyandnew",
						click: self.onCopyAndNewGroupSectionBtnClick.bind(self)
					},
					{
						name: "editSection",
						text: "editSection",
						className: "k-grid-edit",
						click: self.onEditGroupSectionBtnClick.bind(self)
					},
					{
						name: "deleteSection",
						text: "deleteSection",
						className: "k-grid-delete",
						click: self.onDeleteGroupSectionBtnClick.bind(self)
					}],
				title: "Action",
				width: "120px",
				attributes: {
					"class": "text-center"
				}
			}
		];

		self.gridcontainer = null;
		self.gridcontainer = null;
		self.kendoGrid = null;
		self.kendoTreeList = null;

		self.udfHelper = new TF.DetailView.UserDefinedFieldHelper();

		self.obGridSelected = ko.computed(function()
		{
			return _obGridSelectedUids() && _obGridSelectedUids().length > 0;
		}, this);

		self._initSpecifyFilterContainer(options.dataType, gridOptions.SpecifyRecordOptions, gridOptions.IsMyRecordsFilterRequired);
		self.subscribeObservableVariables();

		self.obDisplayThankYouMessage = ko.observable(self.dataEntity.ThankYouMessage || DEFAULT_THANK_YOU_MESSAGE);
		self.obActiveOnDate.subscribe(function()
		{
			if (self.obActiveOnChecked() && !self.obActiveOnTime())
			{
				self.obActiveOnTime("12:00 AM");
				self.$element.find("input[name='activeTime']").blur();
			}
		});
		self.obExpiredOnDate.subscribe(function()
		{
			if (self.obExpiredOnChecked() && !self.obExpiredOnTime())
			{
				self.obExpiredOnTime("11:59 PM");
				self.$element.find("input[name='cutoffTime']").blur();
			}
		});

		self.obDisableUrlAndQR = ko.computed(() =>
		{
			return (this.obPublic() && this.obOneResponsePerRecipient() && self.obSpecifyRecordTypeId() !== SPECIFY_RECORD_TYPE_MY_RECORD) ||
				(tf.authManager && tf.authManager.supportedProducts &&
					!(tf.authManager.supportedProducts.find(i => i.Name.toLowerCase() === 'formfinder')));
		}, this);

		self.obDisplayPublicMyRecordMessage = ko.computed(() =>
		{
			return self.obPublic() && self.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_MY_RECORD;
		}, this);

		tf.authManager.updateAuthInfos().then(function()
		{
			self.changePermissions();
			self.onEditorModelInitComplete.notify();
		});

		if (!self.isEdit || self.obOneResponsePerRecipient())
		{
			self.obDisableOneResponsePerRecipient(false || self.options.detailViewIsReadOnly);
		}
		else
		{
			TF.DetailView.UserDefinedGridHelper.IsUDGridWithSubmission(self.dataEntity.ID).then(function(exist)
			{
				self.obDisableOneResponsePerRecipient(exist || self.options.detailViewIsReadOnly);
			});
		}

		if (self.isEdit && self.obOneResponsePerRecipient())
		{
			TF.DetailView.UserDefinedGridHelper.IsUDGridWithSubmission(self.dataEntity.ID).then(function(exist)
			{
				let disabled = exist || self.options.detailViewIsReadOnly;
				self.obDisablePublic(disabled);
			});
		}

		this.obDisableSubmitNewForm(this.obOneResponsePerRecipient() || self.options.detailViewIsReadOnly);
	}

	EditUserDefinedFieldGroupViewModel.prototype.updatePublicUrlAndQRImage = function()
	{
		const qrInvalidMessage = this.getQRInvalidMessage();
		if (qrInvalidMessage)
		{
			// clear url and qrcode
			this.obURL('');
			this.$element.find(".invalid-qr").html(qrInvalidMessage).show();
			this.$element.find(".valid-qr").empty();
		}
		else
		{
			this.getPublicUrlAndUpdateQRImage();
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.getQRInvalidMessage = function()
	{
		if (this.obSelectedDataSources().findIndex(d => d.value === tf.datasourceManager.databaseId) < 0)
		{
			return "QR Code not available until current data source added";
		}
		else if (this.obPublic() && this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_MY_RECORD)
		{
			return "QR Code is not available when a Public form is Recipient Associated Records";
		}
		else if (this.obPublic() && this.obOneResponsePerRecipient())
		{
			return "QR Code not available when a Public form is One Response Per Recipient";
		}
		else if (this.obNotShowInFormfinder() === true)
		{
			return "QR Code is not available when \"Do Not Show in Formfinder\" has been selected";
		}
		else if (!this.dataEntity.ID)
		{
			return "QR Code not available until saved";
		}

		return "";
	}

	EditUserDefinedFieldGroupViewModel.prototype.getPublicUrlAndUpdateQRImage = function()
	{
		const self = this;
		if (self.dataEntity.ID)
		{
			TF.DetailView.UserDefinedGridHelper.getFormURLbyId(self.dataEntity.ID, self.obPublic())
				.then((publicURL) =>
				{
					self.obURL(publicURL);
					self.$element.find(".valid-qr").empty();
					TF.URLHelper.generateQRImage(self.$element.find(".valid-qr"), publicURL);
					self.$element.find(".invalid-qr").hide();
				});
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype._resetMyRecordFlag = function(gridOptions)
	{
		// Clear Dirty Data: When the form is public, IsMyRecordsFilterRequired should be false
		if (this.obPublic())
		{
			if (gridOptions.IsMyRecordsFilterRequired)
			{
				gridOptions.IsMyRecordsFilterRequired = false;
			}

			if (gridOptions.SpecifyRecordOptions && gridOptions.SpecifyRecordOptions.TypeId === SPECIFY_RECORD_TYPE_MY_RECORD)
			{
				gridOptions.SpecifyRecordOptions.TypeId = SPECIFY_RECORD_TYPE_ALL;
			}
		}

		return gridOptions;
	}

	EditUserDefinedFieldGroupViewModel.prototype._getSpecifyRecordTypeItems = function(dataType, isPublic)
	{
		var ret = [];
		ret.push({ id: SPECIFY_RECORD_TYPE_ALL, name: "All Records" });
		if (tf.permissions.filtersRead)
		{
			ret.push({ id: SPECIFY_RECORD_TYPE_FILTER, name: "Filter" });

			if (isPublic || TF.DetailView.UserDefinedGridHelper.WITH_MY_RECORD_FILTER_GRID_TYPES.indexOf(dataType) >= 0)
			{
				// My Records Setting
				const myRecordsLabel = this._getMyRecordLabel(dataType, isPublic);
				ret.push({ id: SPECIFY_RECORD_TYPE_MY_RECORD, name: myRecordsLabel });
			}
		}
		ret.push({ id: SPECIFY_RECORD_TYPE_SPECIFIC, name: "Specific Records" });

		return ret;
	}

	EditUserDefinedFieldGroupViewModel.prototype._updateSpecifyRecordType = function()
	{
		const typeId = this.obPublic() ? this.obSpecifyRecordTypeId() : SPECIFY_RECORD_TYPE_ALL;
		const specifyRecordTypeItems = this._getSpecifyRecordTypeItems(this.dataType, this.obPublic());
		this.obSpecifyRecordTypeItems(specifyRecordTypeItems);
		const specifyRecordTypeData = this.getDefaultSpecifyRecordOption(typeId);
		this.obSpecifyRecordType(specifyRecordTypeData);
	};

	EditUserDefinedFieldGroupViewModel.prototype._initSpecifyRecordType = function(dataType, specifyRecordOptions)
	{
		const specifyRecordTypeItems = this._getSpecifyRecordTypeItems(dataType, this.obPublic());
		this.obSpecifyRecordTypeItems = ko.observableArray(specifyRecordTypeItems);

		const specifyRecordTypeData = this.getDefaultSpecifyRecordOption(specifyRecordOptions.TypeId);
		this.obSpecifyRecordType = ko.observable(specifyRecordTypeData);

		this.obSpecifyRecordTypeText = ko.computed(function()
		{
			return this.obSpecifyRecordType() ? this.obSpecifyRecordType().name : " "
		}, this);

		this.obSpecifyRecordTypeId = ko.computed(() =>
		{
			return this.obSpecifyRecordType() && this.obSpecifyRecordType().id;
		}, this);
	}

	EditUserDefinedFieldGroupViewModel.prototype._initFilter = function()
	{
		this.obFilterItems = ko.observableArray();
		this.obFilter = ko.observable();

		this.obFilterSpec = ko.computed(function()
		{
			return this.obFilter() ? this.obFilter().whereClause() : ""
		}, this);

		this.obFilterText = ko.computed(function()
		{
			return this.obFilter() ? this.obFilter().name() : ""
		}, this);

		this.obFilterText.subscribe(() =>
		{
			this._cleanSelectedSpecificRecord();

			removeBootstrapValidationError();
		}, this);

		this.obDisabledFilterName = ko.computed(function()
		{
			return this.obSpecifyRecordTypeId() !== SPECIFY_RECORD_TYPE_FILTER;
		}.bind(this));

		this.obFilterNameStringForValidation = ko.computed(function()
		{
			if (this.obDisabledFilterName())
			{
				return "1";
			}
			else
			{
				return this.obFilterText();
			}
		}.bind(this));
	}

	EditUserDefinedFieldGroupViewModel.prototype._initSelectedRecords = function()
	{
		this.obSelectedSpecificRecord = ko.observableArray();
		this.specificRecordFormatter = this.specificRecordFormatter.bind(this);

		this.obVisibleSpecificRecord = ko.computed(function()
		{
			return this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_SPECIFIC;
		}.bind(this));

		this.obDisabledSpecificRecord = ko.computed(function()
		{
			return this.options.detailViewIsReadOnly || this.obSpecifyRecordTypeId() !== SPECIFY_RECORD_TYPE_SPECIFIC ||
				(this.obSelectedDataSources() && this.obSelectedDataSources().length > 1);
		}.bind(this));

		this.obSpecificRecordStringForValidation = ko.computed(function()
		{
			if (this.obDisabledSpecificRecord() || this.obSelectedSpecificRecord().length > 0)
			{
				return "1";
			}
			else
			{
				return "";
			}
		}.bind(this));


		// this.obShowIncludeInActiveRecords = ko.computed(function()
		// {
		// 	return this.dataType === "student";
		// }.bind(this));
		// ------------------------------------------------------------------

		this.obSpecificRecordIds = ko.observableArray();

		this.obSpecificRecordDBID = ko.observable();

		this.recordContactListmoverDefaultOptions = {
			title: "Select Records ",
			description: "You may select one or more specific records to create the document for. At least one record must be selected.",
			availableTitle: 'Available',
			selectedTitle: 'Selected',
			mustSelect: true,
			gridOptions:
			{
				forceFitColumns: true,
				enableColumnReorder: true
			}
		};
	}

	EditUserDefinedFieldGroupViewModel.prototype._initSpecifyFilterContainer = function(dataType, specifyRecordOptions, gridOptionIsMyRecordsFilterRequired)
	{
		specifyRecordOptions = TF.DetailView.UserDefinedGridHelper.initSpecifyRecordOption(dataType, specifyRecordOptions, gridOptionIsMyRecordsFilterRequired);

		this.dataType = dataType;

		if (specifyRecordOptions.FilterId && !tf.permissions.filtersRead)
		{
			tf.promiseBootbox.alert("Specify Record Filter is forbidden and 'All Records' is to be the default record type now.");
		}

		// Specify Record Type Items Setting
		this._initSpecifyRecordType(dataType, specifyRecordOptions);

		// Fiter Settings
		this._initFilter(specifyRecordOptions);

		// Specify Record List Setting
		this._initSelectedRecords(specifyRecordOptions);

		// Other Handle
		this.obSpecifyRecordTypeId.subscribe(this.specificRecordTypeChange, this);

		// Load Data
		// Load Type
		if (specifyRecordOptions.TypeId)
		{
			const specifyRecordTypeData = this.getDefaultSpecifyRecordOption(specifyRecordOptions.TypeId);
			this.obSpecifyRecordType(specifyRecordTypeData);
		}

		// Load Fliter
		if (specifyRecordOptions.TypeId === SPECIFY_RECORD_TYPE_FILTER)
		{
			// Todo: remove setTimeout which is used to set filter when obSpecifyRecordTypeChange finished
			setTimeout(() =>
			{
				this.bindFilterDropdown().then(() =>
				{
					var filterItems = this.obFilterItems().filter((item) =>
					{
						return item.id() === specifyRecordOptions.FilterId;
					});

					var filter = null;
					if (filterItems.length)
					{
						filter = filterItems[0];
					}
					else
					{
						filter = this.obFilterItems()[0];
					}

					this.obFilter(filter);
				});
			}, 0);
		}

		// Load Specific Records
		if (specifyRecordOptions.TypeId === SPECIFY_RECORD_TYPE_SPECIFIC &&
			specifyRecordOptions.SpecificRecordIds && specifyRecordOptions.SpecificRecordIds.length)
		{
			this.initSpecificRecord(specifyRecordOptions.SpecificRecordIds);
		}

		// Public Event
		this.obPublic.subscribe(() =>
		{
			this._updateSpecifyRecordType();
			this.updatePublicUrlAndQRImage();
		});

		this.obOneResponsePerRecipient.subscribe(() =>
		{
			this.updatePublicUrlAndQRImage();
			this.obDisableSubmitNewForm(this.obOneResponsePerRecipient());
			if (this.obOneResponsePerRecipient())
			{
				// Deselect the Allow Submit New Form Checkbox if One ResponsePerRecipient is checked.
				this.obAllowSubmitNewForm(false);
			}
		});

		this.obNotShowInFormfinder.subscribe(() =>
		{
			this.updatePublicUrlAndQRImage();
		});

		this.specificRecordWithSingleDataSourceStringForValidation = ko.computed(() =>
		{
			if (this.obSelectedDataSources().length > 1 &&
				this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_SPECIFIC)
			{
				return "";
			}
			else
			{
				return "1";
			}
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.updateFormRolesWithAssignRoleChange = function()
	{
		const self = this;
		if (!self.canAssignRole())
		{
			self.typeRoles.enable(false);
			self.typeRoles.value(self.getDefaultTypeRolesKeys());
			self.typeRoles.disableDefaultRolesButton();
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.updateFormRolesWithPublicChange = function(init)
	{
		const isFormPublicChanged = !init;

		const self = this;
		if (!self.typeRoles || !self.kendoTreeList)
		{
			self.typeRoles = self.$element.find("#typeRoles").data("kendoMultiSelect");
			self.kendoTreeList = self.$element.find(".grid-wrapper").find(".kendo-treelist").data("kendoTreeList");
		}

		self.typeRoles.enable(!self.options.detailViewIsReadOnly);

		if (isFormPublicChanged)
		{
			self.typeRoles.resetDataSourceDefaultRoles();
			self.typeRoles.value([]);
		}

		if (!self.typeRoles.value().length)
		{
			self.typeRoles.value(self.getDefaultTypeRolesKeys());
		}

		if (isFormPublicChanged)
		{
			let udGridTreeItems = self.kendoTreeList.dataSource.data(),
				sections = udGridTreeItems.filter(s => s.isSection);
			if (sections.length > 0)
			{
				sections.forEach(section =>
				{
					section.RoleSections = [];
					section.IsPublic = self.obPublic();
				});
			}
		}

		self.typeRoles.disableDefaultRolesButton();
		self.checkRoleAccessSelectedCheckboxes();
		self.updateFormRolesWithAssignRoleChange();
	}

	EditUserDefinedFieldGroupViewModel.prototype.checkUDGridSections = function()
	{
		const self = this;
		const sections = self.kendoTreeList ? self.kendoTreeList.dataSource.data().filter(d => d.isSection) : self.dataEntity.UDGridSections;
		if (sections && sections.length > 0)
		{
			self.obUDGridSectionCount(sections.length);
			self.obDisableDisplayOneSection(false);
		}
		else
		{
			self.obUDGridSectionCount(0);
			self.obDisableDisplayOneSection(true);
			self.obDisplayOneSection(false);
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.getDefaultSpecifyRecordOption = function(id)
	{
		const specifyRecordOptionId = id || SPECIFY_RECORD_TYPE_ALL;
		return this.obSpecifyRecordTypeItems().filter(r => r.id === specifyRecordOptionId)[0] || this.obSpecifyRecordTypeItems()[0];
	}

	EditUserDefinedFieldGroupViewModel.prototype.initSpecificRecord = function(SpecificRecordIds)
	{
		this._setupSpecificRecordIds(SpecificRecordIds, true);
	};

	EditUserDefinedFieldGroupViewModel.prototype._getSpecificRecordDBID = function()
	{
		return this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_SPECIFIC ?
			this.obSelectedDataSources()[0].value :
			undefined;
	}

	EditUserDefinedFieldGroupViewModel.prototype._selectedDataSourcesChanged = function()
	{
		if (!this.obSelectedDataSources || !this.obSpecificRecordDBID)
		{
			return;
		}

		if (this.obSelectedDataSources().length > 1)
		{
			this._cleanSelectedSpecificRecord();

			if (this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_SPECIFIC)
			{
				this.obSpecifyRecordType(this.obSpecifyRecordTypeItems()[0]);
				this.obSpecificRecordDBID(this._getSpecificRecordDBID());
			}
		}
		else if (this.obSelectedDataSources()[0] !== this.obSpecificRecordDBID())
		{
			this._cleanSelectedSpecificRecord();
		}

		this.updatePublicUrlAndQRImage();
	};

	EditUserDefinedFieldGroupViewModel.prototype._cleanSelectedSpecificRecord = function()
	{
		if (!this.obSelectedSpecificRecord || !this.obSpecificRecordIds)
		{
			return;
		}

		this.obSelectedSpecificRecord([]);
		this.obSpecificRecordIds([]);
	}

	EditUserDefinedFieldGroupViewModel.prototype._setupSpecificRecordIds = function(selectedRecord, isIds)
	{
		if (selectedRecord && $.isArray(selectedRecord))
		{
			if (selectedRecord.length === 0)
			{
				this._cleanSelectedSpecificRecord();
				return;
			}

			var validator;
			if (this.$element)
			{
				validator = this.$element.data("bootstrapValidator");
			}

			if (isIds)
			{
				const dbid = this._getSpecificRecordDBID();
				//student need paging, because it is too big.
				var apiBatches = [],
					baseUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), dbid, tf.dataTypeHelper.getEndpoint(this.dataType)),
					splittedListGroups = TF.Helper.ApiSplitter.split(baseUrl, selectedRecord);

				splittedListGroups.forEach(function(list)
				{
					var p = tf.promiseAjax.get(baseUrl, {
						paramData: { "@filter": `in(Id,${list.join(",")})` }
					});
					apiBatches.push(p);
				});
				Promise.all(apiBatches)
					.then(function(data)
					{
						var items = [];
						data.forEach(function(response)
						{
							items = items.concat(response.Items);
						});
						this.obSelectedSpecificRecord(items);
						this.obSpecificRecordIds(selectedRecord);
						this.obSpecificRecordDBID(this._getSpecificRecordDBID());

						if (validator)
						{
							validator.validate();
						}
					}.bind(this));
			}
			else
			{
				this.obSelectedSpecificRecord(selectedRecord);
				this.obSpecificRecordIds(selectedRecord.map(function(item)
				{
					return item.Id;
				}));
				this.obSpecificRecordDBID(this._getSpecificRecordDBID());

				if (validator)
				{
					validator.validate();
				}
			}
		}

	};

	EditUserDefinedFieldGroupViewModel.prototype.specificRecordFormatter = function(specificRecordDataModel)
	{
		var name;
		switch (this.dataType)
		{
			case "student":
				name = specificRecordDataModel.FullName || this._getFullName(specificRecordDataModel);
				break;
			case "staff":
				name = specificRecordDataModel.FullName || this._getFullNameWitnMiddleName(specificRecordDataModel);
				break;
			case "vehicle":
				name = specificRecordDataModel.BusNum;
				break;
			case "district":
				name = specificRecordDataModel.District || specificRecordDataModel.IdString;
				break;
			case "busfinderDriver":
				name = specificRecordDataModel.DriverName;
				break;
			case "busfinderVehicle":
				name = specificRecordDataModel.ExternalName;
				break;
			case "contact":
				name = this._getFullName(specificRecordDataModel);
				break;
			case "tripstop":
				name = specificRecordDataModel.Street;
				break;
			default:
				name = specificRecordDataModel.Name;
				break;
		}
		return name;
	};

	EditUserDefinedFieldGroupViewModel.prototype._getFullName = function(nameEntity)
	{
		var tmpNameEntity = [];
		if (nameEntity.LastName)
		{
			tmpNameEntity.push(nameEntity.LastName);
		}

		if (nameEntity.FirstName)
		{
			tmpNameEntity.push(nameEntity.FirstName);
		}

		return tmpNameEntity.join(', ');
	};

	EditUserDefinedFieldGroupViewModel.prototype.specificRecordTypeChange = function()
	{
		const self = this;
		if (this.obSpecifyRecordTypeId() !== SPECIFY_RECORD_TYPE_FILTER)
		{
			this.obFilter(null);
		}

		if (this.obSpecifyRecordTypeId() !== SPECIFY_RECORD_TYPE_SPECIFIC)
		{
			this._cleanSelectedSpecificRecord();
		}

		if (this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_FILTER)
		{
			this.bindFilterDropdown().then(() =>
			{
				this.obFilter(this.obFilterItems()[0]);
			});
		}

		setTimeout(function()
		{
			self.$element.find(".group-udf-tab").scrollTop(9999);
		}, 50);

		removeBootstrapValidationError();
		self.updatePublicUrlAndQRImage();
	};

	function removeBootstrapValidationError()
	{
		$("small[data-bv-result='INVALID']").attr("data-bv-result", "NOT_VALIDATED").css("display", "none");
	}

	EditUserDefinedFieldGroupViewModel.prototype.bindFilterDropdown = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"),
			{
				paramData: {
					"@filter": String.format("(isnull(dbid,))&eq(datatypeId,{0})", tf.dataTypeHelper.getId(this.dataType)),
				}
			})
			.then(function(data)
			{
				var filterList = data.Items.filter(function(ele)
				{
					return ele.IsValid != null && ele.IsValid !== false;
				});

				filterList.sort((l, r) =>
				{
					const lName = (l.Name || '').toLowerCase();
					const rName = (r.Name || '').toLowerCase();

					if (lName < rName)
					{
						return -1;
					}
					if (lName > rName)
					{
						return 1;
					}
					return 0;
				});

				if (filterList.length == 0)
				{
					filterList.unshift(
						{
							Name: " ",
							Id: undefined
						});
				}
				this.obFilterItems(TF.DataModel.BaseDataModel.create(TF.DataModel.GridFilterDataModel, filterList));
			}.bind(this));
	};

	EditUserDefinedFieldGroupViewModel.prototype.selectRecordClick = function()
	{
		var type = this.dataType;
		// student need paging, only return ids
		var onlyIds = (type === "student");
		if (type != undefined && type != "")
		{
			tf.modalManager.showModal(
				new TF.Modal.ListMoverSelectRecordControlModalViewModel(
					this.obSelectedSpecificRecord(),
					$.extend(
						{},
						this.recordContactListmoverDefaultOptions,
						{
							type: type,
							dataSource: this._getSpecificRecordDBID(),
							showRemoveColumnButton: true,
							allowApplyZeroRecord: true,
							onlyReturnId: onlyIds
						})
				)
			).then(function(result) { this._setupSpecificRecordIds(result, onlyIds) }.bind(this));
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.refreshCurrentUdfCount = function()
	{
		const self = this;
		if (self.kendoTreeList && self.kendoTreeList.dataSource && self.kendoTreeList.dataSource.data())
		{
			_tmpUDGridFields = self.kendoTreeList.dataSource.data().filter(data => !data.isSection);
		}

		self.obCurrentUdfCount(_tmpUDGridFields.length);

		self.checkUDGridSections();
	};

	EditUserDefinedFieldGroupViewModel.prototype.subscribeObservableVariables = function()
	{
		const self = this;
		self.obPublic.subscribe(function(newValue)
		{
			if (!newValue)
			{
				self.obExpiredOnChecked(false);
				self.obActiveOnChecked(false);
			}

			self.updateFormRolesWithPublicChange();

			setTimeout(function()
			{
				self._updateValidation();
			}, 0);

		});

		self.obExpiredOnChecked.subscribe(function(newValue)
		{
			setTimeout(function()
			{
				self._updateValidation();
			}, 0);
		});

		self.obActiveOnChecked.subscribe(function(newValue)
		{
			setTimeout(function()
			{
				self._updateValidation();
			}, 0);
		});

		self.obEnableIPAddress.subscribe(function(newValue)
		{
			setTimeout(function()
			{
				self._updateValidation();
			}, 0);

			if (newValue === true)
			{
				self.$element.find("textarea[name='IPAddressBoundary']")[0].disabled = false;
			}
			else
			{
				self.$element.find("textarea[name='IPAddressBoundary']")[0].disabled = true;
			}
		});

		self.obExpiredOnUtc = ko.computed(function()
		{
			const expiredOnDate = self.obExpiredOnDate() || "";
			const expiredOnTime = self.obExpiredOnTime() || "";
			if (expiredOnDate.trim() === "" || expiredOnTime.trim() === "")
			{
				return null;
			}

			let expiredOnTimeMoment = moment(self.obExpiredOnTime());
			if (!expiredOnTimeMoment.isValid())
			{
				expiredOnTimeMoment = new moment(self.obExpiredOnTime(), "h:mm A", true);
			}

			const dateTimeCombined = moment(self.obExpiredOnDate()).format("MM/DD/YYYY") + " " + expiredOnTimeMoment.format("h:mm A");
			return clientTimeZoneToUtc(toISOStringWithoutTimeZone(moment(dateTimeCombined))).format("MM/DD/YYYY h:mm A");
		});

		self.obActiveOnUtc = ko.computed(function()
		{
			const activeOnDate = self.obActiveOnDate() || "";
			const activeOnTime = self.obActiveOnTime() || "";
			if (activeOnDate.trim() === "" || activeOnTime.trim() === "")
			{
				return null;
			}

			let activeOnTimeMoment = moment(self.obActiveOnTime());
			if (!activeOnTimeMoment.isValid())
			{
				activeOnTimeMoment = new moment(self.obActiveOnTime(), "h:mm A", true);
			}

			const dateTimeCombined = moment(self.obActiveOnDate()).format("MM/DD/YYYY") + " " + activeOnTimeMoment.format("h:mm A");
			return clientTimeZoneToUtc(toISOStringWithoutTimeZone(moment(dateTimeCombined))).format("MM/DD/YYYY h:mm A");
		});

		self.obCutoffExpired = ko.computed(function()
		{
			return Date.parse(moment(self.obExpiredOnUtc()).format("MM/DD/YYYY h:mm A")) <= Date.parse(moment(Date.now()).utc().format("MM/DD/YYYY h:mm A"));
		});

		self.obCutoffExpiredWithForm = ko.computed(function()
		{
			return self.obExpiredOnChecked() && self.obCutoffExpired();
		});

		self.obCutoffExpiredWithPublic = ko.computed(function()
		{
			return self.obCutoffExpiredWithForm() && self.obPublic()
		});

		self.obDisableCopyButton = ko.computed(function()
		{
			return self.obCutoffExpiredWithForm() || self.obURL() === '';
		});

		self.obExpiredDateTimeControlDisabled = ko.computed(function()
		{
			return !self.obExpiredOnChecked();
		});

		self.obActiveDateTimeControlDisabled = ko.computed(function()
		{
			return !self.obActiveOnChecked();
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.editPhotoClick = function()
	{
		tf.modalManager.showModal(
			new TF.Modal.EditImageModalViewModel(
				this.dataType,
				Math.floor(Math.random() * Math.floor(1024)),
				"FormBackgroundImage",
				0,
				this.obCurrentImageUrl(),
				{ imageFitMode: this.obImageFitMode() })
		)
			.then(function(data)
			{
				if (!data)
				{
					return;
				}

				data = data || {};
				let { imageUrl, imageFitMode } = data;
				if (typeof (imageUrl) === "string")
				{
					this.obCurrentImageUrl(imageUrl);
				}
				else if (!imageUrl)
				{
					this.obCurrentImageUrl(null);
				}

				this.obImageFitMode(imageFitMode);
				this.resizeImageInContainer();
			}.bind(this));
	};

	EditUserDefinedFieldGroupViewModel.prototype.init = function(vm, el)
	{
		var self = this;
		self.$element = $(el);
		if (self.editor)
		{
			self.editor.$element = self.$element;
		}

		self._initializing = true;
		self.$tabstrip = self.$element.find(".tabstrip-group-udf:first");
		self.$tabstrip.kendoTabStrip({
			animation: {
				open: {
					effects: false
				}
			},
			activate: function(e)
			{
			}
		});
		self.kendoTabStrip = self.$tabstrip.data("kendoTabStrip");
		let activeTabIndex = tf.storageManager.get(`FormsGridActiveRecord${self.recordId}TabIndex`, true);
		if (activeTabIndex)
		{
			self.kendoTabStrip.select(activeTabIndex);
		}
		self.cutoffBlock = self.$element.find(".cutoff-setting");
		const disableCutOff = !self.obPublic() || !self.obExpiredOnChecked();
		if (disableCutOff)
		{
			self.cutoffBlock.addClass("disable");
		} else
		{
			self.cutoffBlock.removeClass("disable");
		}

		//init grid
		self.$element = $(el);
		self.$gridWrapper = self.$element.find(".grid-wrapper");
		self.gridcontainer = self.$element.find(".grid-container");

		// self.initGrid(self.$gridWrapper);
		self.initTreeList(self.$gridWrapper);
		self.refreshCurrentUdfCount();
		setTimeout(function()
		{
			self._updateValidation();
			self.resizeImageInContainer();
			self.$element.find("textarea[name='name']").focus();
		}, 0);
		self._initializing = false;

		let $exnternalIdInput = self.$element.find(".external-id-input");
		TF.DetailView.UserDefinedFieldHelper.bindValidateOnExternalIDInput($exnternalIdInput);

		if (self.obGeofenceBoundaries())
		{
			self.countGeofences(self.obGeofenceBoundaries());
		}
		if (self.obIPAddressBoundary())
		{
			self.countIPRange(self.obIPAddressBoundary());
		}

		self.initRolesAccessControl()
			.then(() =>
			{
				if (self.isEdit)
				{
					self.originalEntity = self.getEntityImage(true);
				}
				self.typeRoles.disableDefaultRolesButton();
				self.updateFormRolesWithPublicChange(true);
			})
			.catch(error =>
			{
				console.log(error);
			})
			.finally(() =>
			{
				self.initialized = true;
			});

		self.updatePublicUrlAndQRImage();
		self._initThankYouMessageEditor();
		$(window).resize(function(e)
		{
			self.resizeKendoTreeList();
		});
		self.resizeKendoTreeList();
	};

	EditUserDefinedFieldGroupViewModel.prototype.initRolesAccessControl = function()
	{
		var self = this;
		let _cachedRawTypeRolesData = [];

		function isIgnoredRole(roleId)
		{
			return [ADMIN_ROLE_KEY, PUBLIC_ROLE_KEY].indexOf(roleId) >= 0;
		}

		let _$typeRoles = self.$element.find("#typeRoles");

		var typeRolesData = self.getDefaultTypeRolesData();

		function disableDefaultRolesButton()
		{
			_$typeRoles.parent().find("ul>li.k-button").filter((_, e) => $(e).text() === 'Administrator').addClass("k-state-disabled");
			_$typeRoles.parent().find("ul>li.k-button").filter((_, e) => $(e).text() === 'Public').addClass("k-state-disabled");
		}

		_$typeRoles.kendoMultiSelect({
			dataTextField: "text",
			dataValueField: "value",
			itemTemplate: '<input type="checkbox" style="margin-right: 5px"/> #= text #',
			downArrow: true,
			autoClose: false,
			dataSource: typeRolesData,
			value: self.getDefaultTypeRolesData(),
			select: function(e)
			{
				e.preventDefault();
				//to prevent list to auto scroll
				var offset = this.list.offset().top - this.ul.offset().top + 1;
				var dataItem = e.dataItem;
				if (isIgnoredRole(dataItem.value))
				{
					return;
				}
				const roles = self.typeRoles.value();
				roles.push(dataItem.value);
				self.typeRoles.value(roles);
				this.list.find(".k-list-scroller").scrollTop(offset);
				disableDefaultRolesButton();
				self.checkRoleAccessSelectedCheckboxes();
			},
			deselect: function(e)
			{
				e.preventDefault();
				//to prevent list to auto scroll
				var offset = this.list.offset().top - this.ul.offset().top + 1;
				var dataItem = e.dataItem;
				if (isIgnoredRole(dataItem.value))
				{
					return;
				}
				this.list.find(".k-list-scroller").scrollTop(offset);
				var roles = self.typeRoles.value();
				roles = roles.filter(x => x !== dataItem.value);
				self.typeRoles.value(roles);

				disableDefaultRolesButton();
				self.checkRoleAccessSelectedCheckboxes();
			},
			close: function()
			{
				self.typeRoles.isOpen = false;
			},
			dataBound: function()
			{
				//RW-35992 Checkbox Status incorrect after filter and dataBound
				self.typeRoles && self.checkRoleAccessSelectedCheckboxes();
			}
		});

		self.$typeRoles = _$typeRoles;
		self.typeRoles = _$typeRoles.data("kendoMultiSelect");
		self.typeRoles.enable(!self.options.detailViewIsReadOnly);
		self.typeRoles.disableDefaultRolesButton = disableDefaultRolesButton;
		self.typeRoles.cacheRawTypeRolesData = function(rawDataSource)
		{
			_cachedRawTypeRolesData = rawDataSource;
		}
		self.typeRoles.resetDataSourceDefaultRoles = function()
		{
			_cachedRawTypeRolesData = _cachedRawTypeRolesData.filter(x => x.value > 0);
			_cachedRawTypeRolesData = self.getDefaultTypeRolesData().concat(_cachedRawTypeRolesData);

			const rolesDataSource = new kendo.data.DataSource({
				data: _cachedRawTypeRolesData
			});
			self.typeRoles.setDataSource(rolesDataSource);
		}

		const $dropdownIcon = $(`<span class="dropdown-icon"><span class="k-icon k-i-arrow-60-down"></span></span>`);
		$dropdownIcon.off("click.MultiSelectDropdownControl").on("click.MultiSelectDropdownControl", () =>
		{
			if (!self.typeRoles)
			{
				return;
			}
			if (self.typeRoles.isOpen)
			{
				self.typeRoles.isOpen = false;
				self.typeRoles.close();
			} else
			{
				self.typeRoles.isOpen = true;
				self.typeRoles.open();
			}
		});
		self.typeRoles.wrapper.find("div.k-multiselect-wrap").append($dropdownIcon);

		self.typeRoles.wrapper.off("click.openDropdown").on("click.openDropdown", function(e)
		{
			self.typeRoles && self.typeRoles.open();
		});
		return self.setRolesDataSource(self.typeRoles, typeRolesData, self.dataType)
			.then(() =>
			{
				const defaultTypeRoleKeys = self.getDefaultTypeRolesKeys();
				const selectedValues = defaultTypeRoleKeys.concat(self.dataEntity.RoleForms ? self.dataEntity.RoleForms.map(x => x.RoleID) : []);
				self.typeRoles.value(selectedValues);
				if (typeRolesData.filter(x => x.value >= 0).length
					=== self.typeRoles.value().filter(x => x >= 0).length)
				{
					self.typeRoles.value(typeRolesData.map(x => x.value));
				}
				self.checkRoleAccessSelectedCheckboxes();
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.checkRoleAccessSelectedCheckboxes = function()
	{
		var self = this;
		var elements = self.typeRoles.ul.find("li");

		elements.each(index =>
		{
			const $element = $(elements[index]);
			const element = $element[0];
			const input = $element.children("input");

			$element.css("background-color", "transparent");
			input.prop("checked", $element.hasClass("k-state-selected"));

			//always disable administrator
			if (index == 0 && element && element.innerText.trim() == "Administrator")
			{
				input.prop("disabled", true);
			}
			//always disable public
			if (index == 1 && element && element.innerText.trim() == "Public")
			{
				input.prop("disabled", true);
			}
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.setRolesDataSource = function(typeRolesControl, typeRolesData, dataType)
	{
		return tf.authManager.getAllRolesData()
			.then(rolesData =>
			{
				for (const role of rolesData)
				{
					typeRolesData.push({ text: role.Name, value: role.RoleID });
				}

				typeRolesControl.cacheRawTypeRolesData(typeRolesData);
				const rolesDataSource = new kendo.data.DataSource({
					data: typeRolesData
				});
				typeRolesControl.setDataSource(rolesDataSource);
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.getDefaultTypeRolesKeys = function()
	{
		return this.obPublic() ? DEFAULT_PUBLIC_ROLES_KEYS : DEFAULT_PRIVATE_ROLES_KEYS;
	}

	EditUserDefinedFieldGroupViewModel.prototype.getDefaultTypeRolesData = function()
	{
		return this.obPublic() ? [ADMIN_ROLE_ITEM, PUBLIC_ROLE_ITEM] : [ADMIN_ROLE_ITEM];
	}

	EditUserDefinedFieldGroupViewModel.prototype.getEntityImage = function(isInit)
	{
		var self = this;
		var delayedResult;
		if (!self.initialized)
		{
			var getImageTimeout = setTimeout(() =>
			{
				if (self.initialized)
				{
					clearTimeout(getImageTimeout);
				} else
				{
					delayedResult = this.getEntityImage(isInit);
				}
			}, 500);
		}

		if (delayedResult)
		{
			return delayedResult;
		}

		const gridOptions = self.getGridOptions();
		const thankYouMessage = isInit ? (self.dataEntity.ThankYouMessage || '') : self._getSavedThankYouMessage();
		let roleForms = self.getTypeRoles(isInit) || [];
		const funcSortRolesByIDs = (leftRole, rightRole) =>
		{
			if (!leftRole || !rightRole)
			{
				return 0;
			}

			if (leftRole.RoleID > rightRole.RoleID)
			{
				return 1;
			}

			if (leftRole.RoleID < rightRole.RoleID)
			{
				return -1;
			}

			return 0;
		};
		roleForms = roleForms.sort(funcSortRolesByIDs);

		return {
			Name: self.obName() && self.obName().trim(),
			Description: self.obDescription(),
			RoleForms: roleForms,
			BackgroundColor: self.obBackgroundColor(),
			RequireLocation: self.obIsLocationRequired(),
			ExternalID: self.obExternalID(),
			Public: self.obPublic(),
			OneResponsePerRecipient: self.obOneResponsePerRecipient(),
			NotShowInFormfinder: self.obNotShowInFormfinder(),
			DisplayOneSection: self.obDisplayOneSection(),
			ExpireOnChecked: self.obExpiredOnChecked(),
			HasExpiredOn: self.obExpiredOnChecked(),
			ExpiredOn: self.obExpiredOnUtc(),
			ActiveOnChecked: self.obActiveOnChecked(),
			HasActiveOn: self.obActiveOnChecked(),
			ActiveOn: self.obActiveOnUtc(),
			GridOptions: gridOptions,
			IPAddressBoundary: self.obIPAddressBoundary(),
			GeofenceBoundaries: !!self.obGeofenceBoundaries() ? JSON.stringify(self.obGeofenceBoundaries()) : null,
			DataSourceIds: self.obSelectedDataSources(),
			TreeListData: _.cloneDeep(self.kendoTreeList.dataSource.data()),
			ThankYouMessage: thankYouMessage,
			AllowViewForm: self.obAllowViewForm(),
			AllowViewAllSubmittedForms: self.obAllowViewAllSubmittedForms(),
			AllowSubmitNewForm: self.obAllowSubmitNewForm()
		};
	}

	EditUserDefinedFieldGroupViewModel.prototype.initDynamicValidators = function()
	{
		let self = this;
		self.dynamicValidatorFields = {};
		self.dynamicValidatorFields.expiredDate = {
			trigger: "blur change",
			container: self.$element.find("input[name='expiredDate']").closest("div.form-group"),
			validators: {
				notEmpty: {
					message: 'required'
				}
			}
		};

		self.dynamicValidatorFields.expiredTime = {
			trigger: "blur change",
			container: self.$element.find("input[name='expiredTime']").closest("div.form-group"),
			validators: {
				notEmpty: {
					message: 'required'
				}
			}
		};

	}

	EditUserDefinedFieldGroupViewModel.prototype._updateValidation = function()
	{
		var self = this,
			validatorFields = {};

		validatorFields.name = {
			trigger: "none",
			container: self.$element.find("textarea[name='name']").closest("div"),
			validators:
			{
				notEmpty: {
					message: 'Name is required'
				},
				stringLength: {
					message: 'Please enter less than 50 characters',
					max: 50
				},
				noUnsafeHtmlTagsAndHtmlEscapes: {
					message: `Please remove special character(s) from Form Name above`
				},
				callback:
				{
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						value = value.trim();
						if (value === "")
						{
							return true;
						}

						if (self.dataEntity && self.dataEntity.ExistedNames)
						{
							if (self.dataEntity.ExistedNames.some(x => x.toLowerCase() === value.toLowerCase()))
							{
								return false;
							}
						}

						// check entity name unique.
						var entity = tf.dataTypeHelper.getDataModelByGridType(self.dataType).toData(),
							entityKeys = Object.keys(entity), lowerValue = value.toLowerCase();
						if (entityKeys.some(function(key) { return key.toLowerCase() === lowerValue; }))
						{
							return false;
						}

						// check grid definition name unique.
						var gridDefinitionColumns = self.kendoGridHelper.getGridColumnsFromDefinitionByType(self.dataType);
						let nameExisted = gridDefinitionColumns.some(function(column)
						{
							let name = column.FieldName || column.DisplayName;
							return name.toLowerCase() === lowerValue;
						})
						if (nameExisted)
						{
							return false;
						}

						return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids"), {
							paramData: { dataTypeId: tf.dataTypeHelper.getId(self.dataType), "@fields": "Id,Name" },
							async: false
						}, { overlay: false }).then(function(result)
						{
							result.Items = result.Items.filter(udg => tf.exagoBIHelper.removeUnsupportChars(udg.Name, false) == value);

							if (result.Items.length === 0)
							{
								return true;
							}

							if (self.dataEntity != null && result.Items.length === 1 && result.Items[0].ID === self.dataEntity.ID)
							{
								return true;
							}

							return false;
						});
					}
				}
			}
		};

		validatorFields.thankYouMessage = {
			trigger: "none",
			container: self.$element.find("input[name='thankYouMessage']").closest("div"),
			validators:
			{
				notEmpty: {
					message: 'Custom Thank You Message is required'
				},
				notAllBlankHtml: {
					message: 'Message should not contain only blank characters'
				}
			}
		}

		validatorFields.specificRecordWithSingleDataSource = {
			trigger: "none",
			validators: {
				notEmpty: {
					message: `Specific Records does not support multiple data sources.`
				}
			}
		}

		validatorFields.filterName = {
			trigger: "none",
			validators: {
				notEmpty: {
					message: "Filter is required"
				}
			}
		}

		validatorFields.specificRecords = {
			trigger: "none",
			validators: {
				notEmpty: {
					message: "At least one record must be selected"
				}
			}
		}

		validatorFields.dataSource = {
			trigger: "none",
			container: self.$element.find("input[name='dataSource']").closest("div"),
			validators:
			{
				callback:
				{
					message: "One or more data sources are required",
					callback: function(value, validator, $field)
					{
						return self.selectedIds.length !== 0;
					}
				}
			}
		}

		if (self.obActiveOnChecked())
		{
			validatorFields.activeDate = {
				trigger: "blur change",
				container: self.$element.find("input[name='activeDate']").closest("div.date-time"),
				validators: {
					notEmpty: {
						message: 'Date is required'
					},
					callback: {
						message: "Date is invalid",
						callback: function(value, validator, $field)
						{
							if (value.trim() === "")
							{
								return true;
							}

							const dt = moment(value);
							return dt.isValid();
						}
					}
				}
			};

			validatorFields.activeTime = {
				trigger: "blur change",
				container: self.$element.find("input[name='activeTime']").closest("div.date-time"),
				validators: {
					notEmpty: {
						message: 'Time is required'
					},
					callback: {
						callback: function(value, validator, $field)
						{
							if (value === "")
							{
								return true;
							}

							const dt = new moment(value, 'h:mm A', true);
							if (!dt.isValid())
							{
								self.$element.find("input[name='activeTime']").val("");
								validator.revalidateField("activeTime")
							}

							return true;
						}
					}
				}
			};
		}

		if (self.obExpiredOnChecked())
		{
			validatorFields.cutoffDate = {
				trigger: "blur change",
				container: self.$element.find("input[name='cutoffDate']").closest("div.date-time"),
				validators: {
					notEmpty: {
						message: 'Date is required'
					},
					callback: {
						message: "Date is invalid",
						callback: function(value, validator, $field)
						{
							if (value.trim() === "")
							{
								return true;
							}

							const dt = moment(value);
							return dt.isValid();
						}
					}
				}
			};

			validatorFields.cutoffTime = {
				trigger: "blur change",
				container: self.$element.find("input[name='cutoffTime']").closest("div.date-time"),
				validators: {
					notEmpty: {
						message: 'Time is required'
					},
					callback: {
						callback: function(value, validator, $field)
						{
							if (value === "")
							{
								return true;
							}

							const dt = new moment(value, 'h:mm A', true);
							if (!dt.isValid())
							{
								self.$element.find("input[name='cutoffTime']").val("");
								validator.revalidateField("cutoffTime")
							}

							return true;
						}
					}
				}
			};
		}

		var bootstrapValidator = self.$element.data('bootstrapValidator');

		if (bootstrapValidator != undefined)
		{
			bootstrapValidator.destroy();
		}

		self.$element.bootstrapValidator(
			{
				excluded: ['.disabled'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype._getMyRecordLabel = function(dataType, isPublic)
	{
		if (isPublic)
		{
			return "Recipient Associated Records";
		}
		return dataType === "staff" ? "My Record Only" : "My Records Only";
	}

	EditUserDefinedFieldGroupViewModel.prototype.apply = function()
	{
		var self = this, validator = this.$element.data("bootstrapValidator");

		if (self.obExpiredOnChecked() && self.obActiveOnChecked() && self.obActiveOnUtc() && self.obExpiredOnUtc())
		{
			const isDateRangeValid = moment(self.obActiveOnUtc(), 'MM/DD/YYYY h:mm A') < moment(self.obExpiredOnUtc(), 'MM/DD/YYYY h:mm A');
			if (!isDateRangeValid)
			{
				self.kendoTabStrip.select(0); //0: General Tab
				tf.promiseBootbox.alert("End On cannot be before Start On.");
				return Promise.resolve(false);
			}
		}

		return self.checkOneResponsePerRecipient().then(function(valid)
		{
			return valid ? self.checkPublicAndRoles() : false;
		}).then(function(valid)
		{
			return valid ? self.checkValidation(validator) : false;
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkOneResponsePerRecipient = function()
	{
		const self = this,
			needCheckOneResponseChangeToTrue = self.isEdit && !self.dataEntity.OneResponsePerRecipient && self.obOneResponsePerRecipient(),
			needCheckOneResponseChangeToFalse = self.isEdit && self.dataEntity.OneResponsePerRecipient && !self.obOneResponsePerRecipient();
		if (needCheckOneResponseChangeToTrue)
		{
			return TF.DetailView.UserDefinedGridHelper.IsUDGridWithSubmission(self.dataEntity.ID).then(function(exist)
			{
				if (exist)
				{
					tf.promiseBootbox.alert("Submissions have been received for this form. Cannot check 'One Response Per Recipient'.", "Error");
					return false;
				}
				return true;
			});

		} else if (needCheckOneResponseChangeToFalse)
		{
			return TF.DetailView.UserDefinedGridHelper.IsUDGridWithSubmission(self.dataEntity.ID).then(function(exist)
			{
				if (exist)
				{
					return tf.promiseBootbox.yesNo({
						message: `You are unselecting One Response Per Recipient. There are already form responses so you will not be able to reselect this again. Are you sure you want to save?`,
						title: "Confirmation Message",
						closeButton: true
					}).then(function(result)
					{
						return result;
					})
				}
				return true;
			});
		} else
		{
			return Promise.resolve(true);
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkPublicAndRoles = function()
	{
		const self = this;
		if (self.obPublic())
		{
			if (self.isEdit)
			{
				// check updated form
				return self.getFormResults().then(ids =>
				{
					if (ids.length > 0 && !(self.isEdit && self.obPublic()))
					{
						tf.promiseBootbox.alert("This form cannot be made Public. There are existing submissions for this form.");
						return false;
					}
					return true;
				});
			}
			return Promise.resolve(true);
		}
		else
		{
			return tf.authManager.getAllRolesData()
				.then(rolesData =>
				{
					const validRoleIDs = rolesData.map(x => x.RoleID);
					const containInvalidRoleIDs = self.getTypeRoles().map(x => x.RoleID).some(x => !validRoleIDs.includes(x));
					return !containInvalidRoleIDs;
				})
				.then(allValidRoles =>
				{
					if (!allValidRoles)
					{
						tf.promiseBootbox.alert("There are some invalid roles selected. Please reopen this form to update the role options.");
						return false;
					}
					return true;
				});
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkValidation = function(validator)
	{
		const self = this;
		return validator.validate().then(function(valid)
		{
			const isUdgFieldsValid = self.checkUDGridFields();
			if (!valid || !isUdgFieldsValid)
			{
				self.checkAndSwitchTab(valid, isUdgFieldsValid);
				return false;
			}
			return self.isEdit ? self.edit() : self.add();
		}.bind(this));
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkAndSwitchTab = function(valid, isUdgFieldsValid)
	{
		var self = this;
		if (self.kendoTabStrip.value().trim() === 'Questions')
		{
			if (!valid && self.checkUDGridFields())
			{
				const validator = self.$element.data('bootstrapValidator');
				const fromGeneralTab = validator.$invalidFields.closest("div.group-udf-tab").size() > 0;
				if (fromGeneralTab)
				{
					self.kendoTabStrip.select(0); //0: General Tab
				} else // from thank your tab
				{
					self.kendoTabStrip.select(2); //0: Thank you Tab
				}
			}
		}
		else // General Tab or Thank you Tab
		{
			if (valid)
			{
				self.kendoTabStrip.select(1); //1: Questions Tab
			}
			else
			{
				const validator = self.$element.data('bootstrapValidator');
				const fromGeneralTab = validator.$invalidFields.closest("div.group-udf-tab").size() > 0;
				if (fromGeneralTab)
				{
					self.kendoTabStrip.select(0); //0: General Tab
				} else // from thank your tab
				{
					self.kendoTabStrip.select(2); //2: Thank you Tab
				}
			}
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.markUnsupportQuestions = function()
	{
		let self = this, rows = self.kendoGrid.element.find(".k-master-row");
		rows.each(function(i, row)
		{
			let typeColumn = $(row).find("td")[2];
			if (PrivateTypes.indexOf($(typeColumn).text()) >= 0)
			{
				if (self.obPublic())
				{
					$(row).attr('style', 'border: solid 1px #ff3e3e !important');
				} else
				{
					$(row).css('border', '');
				}
			}
		});

	};

	EditUserDefinedFieldGroupViewModel.prototype.isDirty = function()
	{
		var self = this;
		let tmpLeftImage = JSON.parse(JSON.stringify(self.getEntityImage()));
		tf.udgHelper.clearPublicRoleForm(tmpLeftImage);
		const leftImageStr = JSON.stringify(tmpLeftImage);

		const rightImageStr = JSON.stringify(self.originalEntity);
		var isSame = leftImageStr == rightImageStr;
		return !isSame;
	};

	EditUserDefinedFieldGroupViewModel.prototype.cancel = function()
	{
		var self = this;
		document.activeElement.blur();
		return Promise.resolve(!self.isDirty());
	};

	EditUserDefinedFieldGroupViewModel.prototype.getDataTypeId = function()
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "dataTypes"))
			.then(function(result)
			{
				return result.Items.filter(function(item)
				{
					var fullName = tf.dataTypeHelper.getDisplayNameByDataType(self.dataType);
					if (!fullName) return false;
					return item.Type.toLowerCase() === fullName.toLowerCase();
				})[0].ID;
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.saveDataSources = function(udGridId)
	{
		var self = this,
			p = Promise.resolve(),
			originalSelectedIds = self.dataEntity.isCopy ? [] : Array.from((self.dataEntity || {}).UDFDataSources || []).map(function(i) { return i.DBID; });

		if (!_.isEqual(originalSelectedIds, self.selectedIds))
		{
			if (!self.selectedIds.length)
			{
				p = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "UDGridDataSources"), {
					paramData: {
						UDGridID: udGridId
					}
				});
			}
			else
			{
				p = tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "UDGridDataSources"), {
					data: self.selectedIds.map(function(item)
					{
						return {
							UDGridID: udGridId, DBID: item
						};
					})
				});
			}
		}

		return p;
	};

	EditUserDefinedFieldGroupViewModel.prototype.toggleUrlAndQRCode = function(hide)
	{
		const self = this, urlAndQR = self.$element.find(".url-qr");
		if (urlAndQR)
		{
			hide ? urlAndQR.hide() : urlAndQR.show();
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.add = function()
	{
		var self = this;

		return tf.authManager.updateAuthInfos()
			.then(function()
			{
				self.changePermissions();
				var hasRolesChanged = self.hasRoleFormsChanged();
				//check data type permission
				if (!tf.authManager.isAuthorizedForDataType(self.dataType, "read"))
				{
					tf.promiseBootbox.alert("You do not have permission to Support Data, please contact Administration.", "Warning");
					return Promise.reject(false);
				}
				if (!self.canAdd() || (!self.canAssignRole() && !self.dataEntity.Public && hasRolesChanged))
				{
					tf.promiseBootbox.alert("User no longer has access to this form.", "Error");
					return Promise.reject(false);
				}
				return self.getDataTypeId()
			})
			.then(function(DataTypeId)
			{
				let udGridTreeItems = self.kendoTreeList.dataSource.data();
				self.resetUDGridTreeItemsIndex(udGridTreeItems)

				var GridOptions = self.getGridOptions();

				var udfEntity = {
					Name: self.obName() && self.obName().trim(),
					Description: self.obDescription(),
					RoleForms: self.getTypeRoles(),
					ExternalID: self.obExternalID(),
					Public: self.obPublic(),
					OneResponsePerRecipient: self.obOneResponsePerRecipient(),
					NotShowInFormfinder: self.obNotShowInFormfinder(),
					HasExpiredOn: self.obExpiredOnChecked(),
					ExpiredOn: self.obExpiredOnUtc(),
					HasActiveOn: self.obActiveOnChecked(),
					ActiveOn: self.obActiveOnUtc(),
					DataTypeId: DataTypeId,
					Guid: null,
					GridOptions: GridOptions,
					SystemDefined: false,
					Required: false,
					IPAddressBoundary: self.obIPAddressBoundary(),
					UDGridFields: [],
					UDGridSections: [],
					DisplayOneSection: self.obDisplayOneSection(),
					GeofenceBoundaries: !!self.obGeofenceBoundaries() ? JSON.stringify(self.obGeofenceBoundaries()) : null,
					ThankYouMessage: self._getSavedThankYouMessage(),
					AllowViewForm: self.obAllowViewForm(),
					AllowViewAllSubmittedForms: self.obAllowViewAllSubmittedForms(),
					AllowSubmitNewForm: self.obAllowSubmitNewForm()
				};

				const resultDataItems = self.generateSectionAndFields(udGridTreeItems, DataTypeId);
				if (self.hasSection())
				{
					udfEntity.UDGridSections = resultDataItems;
				}
				else
				{
					udfEntity.UDGridFields = resultDataItems;
				}

				tf.udgHelper.clearPublicRoleForm(udfEntity);
				return udfEntity;
			})
			.then((udfEntity) =>
			{
				return TF.DetailView.UserDefinedGridHelper.saveUserdefinedfield(udfEntity)
					.then(function(response)
					{
						self.dataEntity = response.Items[0];
						var udfId = response && response.Items && response.Items[0] && response.Items[0].ID;
						return self.saveDataSources(udfId);
					}).then(function()
					{
						tf.udgHelper.onUdgChangedCallback(self.dataEntity.DataTypeId); // Trigger udgChangedEvent
						return self.dataEntity;
					});
			})
			.catch(() =>
			{
				return null;
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.hasSection = function()
	{
		const self = this, sections = self.kendoTreeList.dataSource.data().filter(s => s.isSection);
		return sections.length > 0;
	};

	EditUserDefinedFieldGroupViewModel.prototype.generateSectionAndFields = function(udGridTreeItems, DataTypeId)
	{
		const self = this, sections = udGridTreeItems.filter(s => s.isSection), isCopy = self.isCopy;

		// to save the type name to the right value if it's System Field. (removes "(Read Only)" part)
		const _systemFieldReadOnlyRemoval = function(typeName)
		{
			return typeName.startsWith('System Field') > -1 ? typeName.replace('(Read Only)', '').trim() : typeName;
		}
		const _handleSystemFieldTypeName = function(dataEntity)
		{
			let fieldOptions = JSON.parse(dataEntity.FieldOptions);
			fieldOptions.TypeName = _systemFieldReadOnlyRemoval(fieldOptions.TypeName);
			dataEntity.FieldOptions = JSON.stringify(fieldOptions);
			dataEntity.TypeName = _systemFieldReadOnlyRemoval(dataEntity.TypeName);
		}

		let returnDataItems = [];
		if (sections.length > 0)
		{
			sections.forEach(section =>
			{
				const sectionItem = {
					Name: section.Name,
					Sequence: section.Sequence,
					RoleSections: section.RoleSections,
					Id: isCopy ? 0 : section.Id,
					UDGridId: isCopy ? 0 : section.UDGridId,
					IsPublic: section.IsPublic,
					UDGridFields: []
				}
				self.handleSectionDataWhenAddOrEdit(sectionItem, section);
				if (section.hasChildren)
				{
					childrens = udGridTreeItems.filter(s => !s.isSection && s.parentId === section.Sequence);
					childrens.forEach(field =>
					{
						_handleSystemFieldTypeName(field);
						const fieldItem = {
							ID: isCopy ? 0 : field.ID,
							DataTypeId: DataTypeId,
							Description: field.Description,
							DisplayName: field.Name,
							FieldOptions: field.FieldOptions,
							Index: field.Index,
							Name: field.Name,
							Required: field.Required,
							Type: field.Type,
							TypeName: field.TypeName,
							UDGridSectionId: isCopy ? 0 : sectionItem.Id,
							UDGridId: isCopy ? 0 : field.UDGridId
						}
						self.handleFieldDataWhenAddOrEdit(fieldItem, field);
						sectionItem.UDGridFields.push(fieldItem);
					})
				}
				returnDataItems.push(sectionItem);
			});
		}
		else
		{
			udGridTreeItems.forEach(field =>
			{
				_handleSystemFieldTypeName(field);
				const fieldItem = {
					ID: isCopy ? 0 : field.ID,
					DataTypeId: DataTypeId,
					Description: field.Description,
					DisplayName: field.DisplayName,
					FieldOptions: field.FieldOptions,
					Index: field.Index,
					Name: field.Name,
					Required: field.Required,
					Type: field.Type,
					TypeName: field.TypeName,
					UDGridSectionId: null,
					UDGridId: isCopy ? 0 : field.UDGridId
				}
				self.handleFieldDataWhenAddOrEdit(fieldItem, field);
				returnDataItems.push(fieldItem);
			});
		}
		return returnDataItems;
	};

	EditUserDefinedFieldGroupViewModel.prototype.handleSectionDataWhenAddOrEdit = function(sectionItem, section)
	{
		const self = this;
		if (!self.isCopy)
		{
			if (section.UDGridId && section.UDGridId !== 0)
			{
				sectionItem.UDGridId = section.UDGridId;
			}
			else
			{
				if (self.dataEntity.ID)
				{
					sectionItem.UDGridId = self.dataEntity.ID;
				}
			}
		}
		if (section.CreatedBy)
		{
			sectionItem.CreatedBy = section.CreatedBy;
		}
		if (section.CreatedOn)
		{
			sectionItem.CreatedOn = section.CreatedOn;
		}
		if (section.LastUpdatedBy)
		{
			sectionItem.LastUpdatedBy = section.LastUpdatedBy;
		}
		if (section.LastUpdatedOn)
		{
			sectionItem.LastUpdatedOn = section.LastUpdatedOn;
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.handleFieldDataWhenAddOrEdit = function(fieldItem, field)
	{
		const self = this;
		if (!!self.isCopy)
		{
			if (field.UDGridId && field.UDGridId !== 0)
			{
				fieldItem.UDGridId = field.UDGridId;
			}
			else
			{
				if (self.dataEntity.ID)
				{
					fieldItem.UDGridId = self.dataEntity.ID;
				}
			}
		}

		if (field.Guid)
		{
			fieldItem.Guid = field.Guid;
		}
		if (field.AttributeFlag)
		{
			fieldItem.AttributeFlag = field.AttributeFlag;
		}
		if (field.CreatedOn)
		{
			fieldItem.CreatedOn = field.CreatedOn;
		}
		if (field.LastUpdatedOn)
		{
			fieldItem.LastUpdatedOn = field.LastUpdatedOn;
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.getFormResults = function()
	{
		let self = this;
		return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "formResults"),
			{
				paramData:
				{
					getCount: false
				},
				data:
				{
					fields: ["Id"],
					filterSet: {
						FilterItems: [{ FieldName: "UDGridID", Operator: "EqualTo", TypeHint: "String", Value: self.dataEntity.ID }],
						FilterSets: [],
						LogicalOperator: "and"
					}
				}
			}).then(response =>
			{
				return response.Items;
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype._getSavedThankYouMessage = function()
	{
		return this.obDisplayThankYouMessage() === DEFAULT_THANK_YOU_MESSAGE ? '' : this.obDisplayThankYouMessage();
	}

	EditUserDefinedFieldGroupViewModel.prototype.edit = function()
	{
		var self = this;
		let udGridTreeItems = self.kendoTreeList.dataSource.data();
		self.resetUDGridTreeItemsIndex(udGridTreeItems);

		// to constraint if the user without form access would not have the ability to edit forms that were not public.
		// join check if User no longer has access to this form.
		const isFormOriginallyPublic = self.dataEntity.Public;

		var GridOptions = self.getGridOptions();
		self.dataEntity.DisplayName = self.obName().trim();
		self.dataEntity.Name = self.obName().trim();
		self.dataEntity.Description = self.obDescription();
		self.dataEntity.ExternalID = self.obExternalID();
		self.dataEntity.Public = self.obPublic();
		self.dataEntity.OneResponsePerRecipient = self.obOneResponsePerRecipient();
		self.dataEntity.NotShowInFormfinder = self.obNotShowInFormfinder();
		self.dataEntity.HasExpiredOn = self.obExpiredOnChecked();
		self.dataEntity.ExpiredOn = self.obExpiredOnUtc();
		self.dataEntity.HasActiveOn = self.obActiveOnChecked();
		self.dataEntity.ActiveOn = self.obActiveOnUtc();
		self.dataEntity.UDGridFields = [];
		self.dataEntity.UDGridSections = [];
		self.dataEntity.RoleForms = self.getTypeRoles();
		self.dataEntity.IPAddressBoundary = self.obIPAddressBoundary();
		self.dataEntity.DisplayOneSection = self.obDisplayOneSection();
		self.dataEntity.GeofenceBoundaries = !!self.obGeofenceBoundaries() ? JSON.stringify(self.obGeofenceBoundaries()) : null;
		self.dataEntity.GridOptions = GridOptions;
		self.dataEntity.ThankYouMessage = self._getSavedThankYouMessage();
		self.dataEntity.AllowViewForm = self.obAllowViewForm();
		self.dataEntity.AllowViewAllSubmittedForms = self.obAllowViewAllSubmittedForms();
		self.dataEntity.AllowSubmitNewForm = self.obAllowSubmitNewForm();

		const resultDataItems = self.generateSectionAndFields(udGridTreeItems, self.dataEntity.DataTypeId);
		if (self.hasSection())
		{
			self.dataEntity.UDGridSections = resultDataItems;
		}
		else
		{
			self.dataEntity.UDGridFields = resultDataItems;
		}

		return tf.authManager.updateAuthInfos()
			.then(function()
			{
				self.changePermissions();
				var hasRolesChanged = self.hasRoleFormsChanged() || self.hasRoleSectionsChanged(self.dataEntity.UDGridSections);
				var hasRoleAssigned = tf.udgHelper.filterAssignedForms([self.dataEntity]).length === 1;
				if (!self.canEdit() ||
					(!hasRoleAssigned && !isFormOriginallyPublic) ||
					(!self.canAssignRole() && hasRolesChanged && !isFormOriginallyPublic))
				{
					tf.promiseBootbox.alert("User no longer has access to this form.", "Error");
					return Promise.reject(false);
				}
				return self.saveDataSources(self.dataEntity.ID);
			})
			.then(function()
			{
				tf.udgHelper.clearPublicRoleForm(self.dataEntity);
				return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgrids", self.dataEntity.ID), {
					paramData: { "@Relationships": "UDGridSections,UDGridFields,UDGridDataSources,UDGridSurveys,RoleForms" },
					data: self.dataEntity
				}).then(function(response)
				{
					tf.udgHelper.onUdgChangedCallback(self.dataEntity.DataTypeId); // Trigger udgChangedEvent 
					self.refreshGridFormQuestions({ text: self.dataEntity.Name, value: self.dataEntity.ID });
					return response.Items[0];
				});
			})
			.catch(() =>
			{
				return null;
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.refreshGridFormQuestions = function(formGrid)
	{
		let tabNodes = tf.documentManagerViewModel.allDocuments();
		let controlPanel = tabNodes.find(function(item)
		{
			if (!item.DocumentData?.data?.gridType) return false;
			const { documentType, data: { gridType, gridData } } = item.DocumentData;
			return documentType === 'Grid' &&
				gridType === 'form' &&
				gridData?.text === formGrid.text &&
				gridData?.value === formGrid.value;
		});
		if (!controlPanel) return;
		controlPanel.reloadFormRefreshColumn(controlPanel);
	}

	EditUserDefinedFieldGroupViewModel.prototype.getTypeRoles = function(isInit)
	{
		var self = this;
		const formId = self.dataEntity.ID;
		if (isInit)
		{
			const roleForms = self.dataEntity.RoleForms;
			return roleForms ? _.uniqBy(roleForms.map(x => ({ FormID: formId, RoleID: x.RoleID })), x => x.RoleID) : [];
		}
		else
		{
			if (!self.canAssignRole())
			{
				return self.initialDataEntity.RoleForms ? _.uniqBy(self.initialDataEntity.RoleForms.map(x => ({ FormID: formId, RoleID: x.RoleID })), x => x.RoleID) : [];
			}
			else
			{
				return _.uniqBy(self.typeRoles.value().filter(x => x >= 0).map(x => ({ FormID: formId, RoleID: x })), x => x.RoleID);
			}
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.getGridOptions = function()
	{
		var self = this;
		self.resizeImageInContainer();

		const buildSpecifyRecordsOptions = () =>
		{
			return {
				TypeId: self.obSpecifyRecordTypeId(),
				FilterId: (self.obFilter && self.obFilter() && self.obFilter().id && self.obFilter().id()) ?
					self.obFilter().id() : null,
				SpecificRecordIds: self.obSpecificRecordIds ? self.obSpecificRecordIds() : [],
			}
		}

		const specifyRecordOptions = buildSpecifyRecordsOptions();
		const isMyRecordsFilterRequired = (self.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_MY_RECORD);

		return JSON.stringify({
			IsLocationRequired: self.obIsLocationRequired(),
			BackgroundColor: TF.Color.toHTMLColorFromLongColor(self.obBackgroundColor()),
			CurrentImageUrl: self.obCurrentImageUrl(),
			ImageFitMode: self.obImageFitMode(),
			IsMyRecordsFilterRequired: isMyRecordsFilterRequired,
			SpecifyRecordOptions: specifyRecordOptions
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.displayDsText = function(item)
	{
		return item.text;
	}

	EditUserDefinedFieldGroupViewModel.prototype.selectDatasource = function()
	{
		var self = this;
		if (self.options.detailViewIsReadOnly) return;
		var options = {
			resizable: true,
			modalWidth: 850,
			gridHeight: 400,
			title: "Data Source",
			availableSource: self.allDataources.filter(function(item) { return !self.selectedIds.includes(item.value); }),///? availableSource : self.obDataList(),
			selectedSource: self.allDataources.filter(function(item) { return self.selectedIds.includes(item.value); }) //? selectedSource : [],
		};
		tf.modalManager.showModal(new TF.DetailView.ListMoverFieldEditorModalViewModel(options)).then(function(result)
		{
			if (Array.isArray(result))
			{
				self.obSelectedDataSources(result.map(function(item)
				{
					return _.find(self.allDataources, { "value": item })
				}))
				self.selectedIds = result;
			}
		})
	}


	/**
	 * Initialize a user defined field tree list.
	 *
	 * @param {JQuery} $grid
	 */
	EditUserDefinedFieldGroupViewModel.prototype.initTreeList = function($container)
	{
		const self = this, treeListColumns = self.getTreeListColumns();
		self.$container = $container;
		var $treeList = $container.find(".kendo-treelist");
		if (self.kendoTreeList)
		{
			self.kendoTreeList.destroy();
		}
		self.refreshCurrentUdfCount();
		const datasource = self.getTreeListDataSource();

		const kendoTreeList = new TF.TreeList.KendoTreeList($treeList, {
			rowTemplate: kendo.template($("#sectiontemplate").html()),
			altRowTemplate: kendo.template($("#sectionalttemplate").html()),
			dataSource: datasource,
			columns: treeListColumns,
			canChangeLevel: false,
			columnResize: function(e)
			{
				const contentTable = self.$element.find(".k-grid-content table");
				const headerTable = self.$element.find(".k-grid-header table");
				const headerTableWidth = headerTable.width();
				const treeEleWidth = self.$element.find(".kendo-treelist").width();
				const headerActionCol = $(headerTable.find("col")[4]);
				const contentActionCol = $(contentTable.find("col")[4]);

				// set the action column width
				if (treeEleWidth > headerTableWidth)
				{
					//const realWidth = treeEleWidth > headerTableWidth ? treeEleWidth : headerTableWidth
					let otherColumnWidth = 0;
					for (let i = 0; i < 4; i++)
					{
						otherColumnWidth += $(contentTable.find("col")[i]).width();
					}
					const actionColWidth = treeEleWidth - otherColumnWidth;
					headerActionCol.width(actionColWidth);
					contentActionCol.width(actionColWidth);
					contentTable.width(treeEleWidth);
					headerTable.width(treeEleWidth);
				}
			},
			scrollable: true,
			selectable: "single",
			resizable: true,
			dragstart: function(e)
			{
				if (self.options.detailViewIsReadOnly)
				{
					e.preventDefault();
					return false;
				}
			},
			drop: function(e)
			{
				self.checkDuplicateFieldsOnDrop(e);
			},
			checkDuplicatesCallback: function(sourceItem, targetItem)
			{
				return self.checkDuplicateFieldsOnDrag(sourceItem, targetItem);
			},
			dataBound: function()
			{
				var grid = this,
					el = grid.element;

				if (el == null)
				{
					return;
				}
				else
				{
					var gridHeight = el.outerHeight();
					var gridHeaderHeight = el.find("table:eq(0)").outerHeight();
					var gridBodyHeight = el.find("table:eq(1)").outerHeight();

					const kHeader = el.find(".k-grid-header");
					const kContent = el.find(".k-grid-content");
					if (gridHeight < gridHeaderHeight + gridBodyHeight)
					{ // show the scrollbar
						kHeader.css('padding', '');
						kHeader.css('padding-right', '17px');
						kContent.css(CSS_OVERFLOW_Y, 'auto');
					}
					else
					{ // hide the scrollbar
						kHeader.css('padding-right', '0px');
						kContent.css(CSS_OVERFLOW_Y, 'auto');
					}
				}

				el.find("tbody tr[role='row']").each(function()
				{
					var model = grid.dataItem(this);

					if (model.Name === "Document Attachment" && model.TypeName == "Document" && model.Type == -1)
					{
						$(this).addClass("system-defined-field");
					}
					else
					{
						$(this).addClass("general-field");
					}
				});
			}
		});

		self.kendoTreeList = $treeList.data("kendoTreeList");

		self.kendoTreeList.element.on("click", ".k-grid-copyandnew", function(e)
		{
			self.onCopyAndNewGroupSectionBtnClick(e);
		});
		self.kendoTreeList.element.on("click", ".k-grid-edit", function(e)
		{
			self.onEditGroupSectionBtnClick(e);
		});
		self.kendoTreeList.element.on("click", ".k-grid-delete", function(e)
		{
			self.onDeleteGroupSectionBtnClick(e);
		});

		self.kendoTreeList.element.off("dblclick").on("dblclick", ".k-grid-content .general-field", function(e)
		{
			self.onEditGroupFieldBtnClick(e);
		});
	};

	// change tabs height when window resize
	EditUserDefinedFieldGroupViewModel.prototype.resizeKendoTreeList = function()
	{
		var self = this;
		var windowHeight = self.options.isDetailView ? self.$element.closest(".right-doc").height() : $(window).height();
		if (!windowHeight || windowHeight <= 0)
		{
			return;
		}

		var validationTextHeight = self.$element.find(".question-validation-text").height();
		if (validationTextHeight > 0)
		{
			// if validation text is invisible, the combination of header's margin-bottom (10px) and treelist's margin-top (20px) is 20px
			// if validation text is visible, should add header's margin-bottom (10px)
			validationTextHeight += 10;
		}
		var tabPaddingSpace = 198; // tab padding and tabstrip height
		var treeListPaddingSpace = 140; //space for padding and "show one section at a time" checkbox
		var tabHeight = windowHeight - tabPaddingSpace;
		var kendoTreeListHeight = tabHeight - treeListPaddingSpace - validationTextHeight;

		$(".modal-body").css('overflow-y', 'hidden'); // disable modal scroll during resizing
		if (self.options.isDetailView)
		{
			self.$element.find(".tabstrip-group-udf .questions-tab, .tabstrip-group-udf .group-udf-tab, .tabstrip-group-udf .thank-you-tab").height(tabHeight); // change udf tab height
		} else
		{
			$(".modal-dialog .tabstrip-group-udf .questions-tab, .modal-dialog .tabstrip-group-udf .group-udf-tab, .modal-dialog .tabstrip-group-udf .thank-you-tab").height(tabHeight); // change udf tab height
		}

		self.kendoTreeList.setOptions({ height: kendoTreeListHeight });
	}

	EditUserDefinedFieldGroupViewModel.prototype.getTreeListColumns = function()
	{
		const self = this, treeListColumnsDefinition = tf.udGridTreeListDefinition.treeListDefinition();

		let treeListColumns = treeListColumnsDefinition.Columns.filter(function(item)
		{
			return !item.hidden;
		});
		if (self.options.detailViewIsReadOnly)
		{
			treeListColumns.shift();  // remove the drag and drop column
			return treeListColumns;
		}
		treeListColumns = treeListColumns.concat(self.commandTreeListColumns.slice());
		return treeListColumns;
	};

	EditUserDefinedFieldGroupViewModel.prototype.getTreeListDataSource = function()
	{
		const self = this;
		const _handleSystemFieldTypeNames = function(field)
		{
			field.TypeName = field.TypeName === "System Field" ?
				field.TypeName + " (Read Only)" :
				field.TypeName;
		}
		let treeListData = [];
		if (_tmpUDGridSections.length > 0)
		{
			_tmpUDGridSections.forEach((tmpSection) =>
			{
				tmpSection.isSection = true;
				tmpSection.parentId = null;
				tmpSection.isReadOnly = self.options.detailViewIsReadOnly;
				treeListData.push(tmpSection);
				if (tmpSection.UDGridFields && tmpSection.UDGridFields.length > 0)
				{
					tmpSection.UDGridFields.sort(function(a, b)
					{
						return a.Index - b.Index;
					}).forEach((tmpField) =>
					{
						if (tmpField.UDGridSectionId === tmpSection.Id)
						{
							tmpField.parentId = tmpSection.Sequence;
							tmpField.Sequence = 0;
							tmpField.isSection = false;
							tmpField.isReadOnly = self.options.detailViewIsReadOnly;
							_handleSystemFieldTypeNames(tmpField);
							treeListData.push(tmpField);
						}
					});
				}
			});
		}
		else
		{
			_tmpUDGridFields.sort(function(a, b)
			{
				return a.Index - b.Index;
			}).forEach((tmpField) =>
			{
				tmpField.parentId = null;
				tmpField.Sequence = 0;
				tmpField.isSection = false;
				tmpField.isReadOnly = self.options.detailViewIsReadOnly;
				_handleSystemFieldTypeNames(tmpField);
				treeListData.push(tmpField);
			});
		}

		return new kendo.data.TreeListDataSource({
			data: treeListData,
			schema: {
				model: {
					id: "Sequence",
					expanded: true
				}
			}
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.addGroupSectionBtnClick = function()
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedSectionModalViewModel({
				isPublic: self.obPublic(),
				isUDFGroup: true,
				isNew: true,
				dataEntity: {
					IsPublic: self.obPublic(),
					Name: '',
					isCopy: false,
					AllRole: self.typeRoles.dataSource.options,
					HasRole: self.typeRoles.value(),
					RoleSections: [],
					ExistedNames: self.kendoTreeList.dataSource.data().filter(tl => tl.isSection).map(tl => tl.Name)
				}
			}))
			.then(function(response)
			{
				if (response)
				{
					self.addNewSectionInTreeList({
						Name: response.Name,
						Id: 0,
						RoleSections: response.HasRole ? response.HasRole.map(x => ({ SectionID: 0, RoleID: x })) : [],
						UDGridId: self.dataEntity.ID,
						IsPublic: response.IsPublic
					});
				}
				self.checkUDGridSections();
			});
	};

	/**
	 * Initialize a user defined field grid.
	 *
	 * @param {JQuery} $grid
	 * @param {string} type
	 */
	EditUserDefinedFieldGroupViewModel.prototype.initGrid = function($container)
	{
		var self = this,
			gridColumns = self.getGridColumnsByType();

		this.$container = $container;

		var $grid = $container.find(".kendo-grid");
		if (self.kendoGrid)
		{
			self.kendoGrid.destroy();
		}
		self.refreshCurrentUdfCount();

		self.kendoGrid = $grid.kendoGrid({
			dataSource: {
				data: _tmpUDGridFields,
			},
			scrollable: true,
			selectable: "single",
			resizable: true,
			columns: gridColumns,
			columnResize: function(e)
			{
				var $contentTable = $(".k-grid-content table", e.sender.element);
				if ($contentTable.width() < $contentTable.parent().width())
				{
					$contentTable.width("100%");
					$("div>table:first-child", e.sender.element).width("100%");
				}
			},
			dataBound: function()
			{
				var grid = this,
					el = grid.element;

				if (el == null)
				{
					return;
				}

				el.find("tbody tr[role='row']").each(function()
				{
					var model = grid.dataItem(this);

					if (model.Name === "Document Attachment" && model.TypeName == "Document" && model.Type == -1)
					{
						$(this).addClass("system-defined-field");
					}
					else
					{
						$(this).addClass("general-field");
					}
				});
			}
		}).data("kendoGrid");

		self.kendoGrid.element.off("dblclick").on("dblclick", ".k-grid-content .general-field", function(e)
		{
			self.onEditGroupFieldBtnClick(e);
		});

		_selectedColGrid = self.kendoGrid;

		self.bindGridDraggable();
		self.bindGridDropTarget();

		self.createKendoDropTargetEvent();

		self.initGridScrollBar(self.gridcontainer);

	};

	EditUserDefinedFieldGroupViewModel.prototype.initGridScrollBar = function(container)
	{
		var $gridContent = container.find(".k-grid-content");
		$gridContent.css({
			"overflow-y": "auto"
		});

		if ($gridContent[0].clientHeight === $gridContent[0].scrollHeight)
		{
			$gridContent.parent().find(".k-grid-header").css({ "padding-right": 0 });
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.refreshGridFoot = function(grid)
	{
		var self = this,
			el = grid.element;

		el.find("tbody tr[role='row']").each(function()
		{
			if (grid.element == null)
			{
				return;
			}
			var model = grid.dataItem(this);

			if (model.Name === "Document Attachment" && model.TypeName == "Document" && model.Type == -1)
			{
				$(this).addClass("system-defined-field");
			}
			else
			{
				$(this).addClass("general-field");
			}
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.fetchGridData = function(type)
	{
		let self = this;
		return tf.UDFDefinition.RetrieveByType(type).then(function(response)
		{
			return (response.Items || []).map(function(item)
			{

				item.IsShow = item.SystemDefined ? "Always" : (self.udfHelper.isShowInCurrentDataSource(item) ? "Yes" : "No");
				return item;
			});
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkDuplicateFieldsOnDrop = function(e)
	{
		const self = this;
		let validationText = "";
		if (e.source && e.destination && !self.checkDuplicateFieldsOnDrag(e.source, e.destination))
		{
			validationText = "You cannot have a duplicated question in the same section.";
		}

		self.obQuestionValidationText(validationText);
		self.resizeKendoTreeList();
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkDuplicateFieldsOnDrag = function(sourceItem, targetItem)
	{
		if (!sourceItem || !targetItem || sourceItem.isSection)
		{
			return true;
		}

		const sourceParentId = sourceItem.parentId;
		const targetParentId = targetItem.isSection ? targetItem.Sequence : targetItem.parentId;
		if (sourceParentId === targetParentId)
		{
			return true;
		}

		return this.checkDuplicateFieldsInOneSection(targetParentId, sourceItem.Name);
	}

	EditUserDefinedFieldGroupViewModel.prototype.checkDuplicateFieldsInOneSection = function(parentId, name, uid)
	{
		const self = this,
			data = self.kendoTreeList.dataSource.data();
		let questionsInSection = parentId ? data.filter(d => !d.isSection && d.parentId === parentId) : data;
		if (uid)
		{
			questionsInSection = questionsInSection.filter(q => q.uid !== uid);
		}
		name = name.trim().toLowerCase();
		const hasDuplicate = questionsInSection.some(q => q.Name.trim().toLowerCase() === name);
		return !hasDuplicate;
	};

	EditUserDefinedFieldGroupViewModel.prototype.checkUDGridFields = function(item)
	{
		const self = this;
		const treeNodes = self.kendoTreeList.dataSource.data();
		const questions = treeNodes.filter(t => !t.isSection);
		const sections = treeNodes.filter(t => t.isSection);
		let validationText = "";
		if (questions.length === 0)
		{
			validationText = "Please add at least one question for the form.";
		}
		else if (!self._validPublicFormHasPubicSettings(sections))
		{
			validationText = "Public Forms must have at least one Public Section";
		}
		else
		{
			const groupedDuplicatedQuestion = Enumerable.From(questions)
				.GroupBy("{parentId:$.parentId,Name:$.Name}", null, null, "$.parentId + ':' + $.Name")
				.Where(x => x.source.length > 1).FirstOrDefault();
			if (groupedDuplicatedQuestion)
			{
				const key = groupedDuplicatedQuestion.Key();
				const questionName = key.Name;
				validationText = `You can not have a duplicated question in the same section. Please remove duplicated question "${questionName}" or move it to a different section.`;
			}
		}

		this.obQuestionValidationText(validationText);
		this.resizeKendoTreeList();
		return !validationText || !validationText.length;
	}

	EditUserDefinedFieldGroupViewModel.prototype._validPublicFormHasPubicSettings = function(sections)
	{
		var self = this;
		if (!self.obPublic() ||
			!sections || !sections.length)
		{
			return true;
		}

		return sections.filter(section => section.IsPublic).length;
	}

	EditUserDefinedFieldGroupViewModel.prototype.resetUDGridFieldsIndex = function()
	{
		_tmpUDGridFields.forEach(function(item, index, arr)
		{
			item.Index = index + 1;
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.resetUDGridTreeItemsIndex = function(udGridTreeItems)
	{
		const udGridSections = udGridTreeItems.filter(u => u.isSection);
		if (udGridSections.length > 0)
		{
			udGridSections.forEach(function(item, index, arr)
			{
				if (item.hasChildren)
				{
					const itemChildren = udGridTreeItems.filter(u => !u.isSection && u.parentId === item.Sequence)
					item.UDGridFields = itemChildren;
				}
			});

			udGridSections.forEach(function(item, index, arr)
			{
				item.Sequence = index + 1;
				if (item.hasChildren)
				{
					item.UDGridFields.forEach(function(child, indexy, arr)
					{
						child.Index = indexy + 1;
						child.parentId = item.Sequence;
					});
				}
			});
		}
		else
		{
			udGridTreeItems.forEach(function(item, index, arr)
			{
				item.Index = index + 1;
				item.parentId = null;
			});
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.sortUDGridFieldsByIndex = function()
	{
		_tmpUDGridFields.sort(function(a, b)
		{
			return a.Index - b.Index
		});
	}

	EditUserDefinedFieldGroupViewModel.prototype.sortUDGridSectionsByIndex = function()
	{
		const self = this;
		if (_tmpUDGridSections && _tmpUDGridSections.length > 1)
		{
			_tmpUDGridSections.sort(function(a, b)
			{
				return a.Sequence - b.Sequence
			});
			_tmpUDGridSections.forEach(us =>
			{
				if (us.UdGridFields && us.UdGridFields.length > 1)
				{
					us.UdGridFields.sort(function(a, b)
					{
						return a.Index - b.Index
					});
				}
			})
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.copyFormUrlBtnClick = function(formId)
	{
		const self = this;
		if (self.obNotShowInFormfinder())
		{
			return;
		}
		if (!self.isEdit && !self.dataEntity.ID)
		{
			return false;
		}
		if (!self.validatePublicUrl("copyFormURL") || self.obCutoffExpiredWithPublic() || self.obCutoffExpiredWithForm())
		{
			return;
		}

		TF.DetailView.UserDefinedGridHelper.getFormURLbyId((self.dataEntity.ID || formId), self.obPublic())
			.then((publicURL) =>
			{
				TF.DetailView.UserDefinedGridHelper.copyPublicFormURL(publicURL, self.pageLevelViewModel);
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.exportQRClick = function()
	{
		const self = this;
		if (self.obNotShowInFormfinder())
		{
			return;
		}
		if (!self.validatePublicUrl("exportQR") || self.obCutoffExpiredWithPublic() || self.obCutoffExpiredWithForm())
		{
			return;
		}

		TF.DetailView.UserDefinedGridHelper.getFormURLbyId(self.dataEntity.ID, self.obPublic())
			.then((publicURL) =>
			{
				const dateTimeFormat = "YYMMDD_HHmmss";
				TF.URLHelper.generateQRCode(publicURL, `${self.dataEntity.Name}_${moment(self.dataEntity.LastUpdated).format(dateTimeFormat)}`);
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.validatePublicUrl = function(actionType)
	{
		const self = this;
		if (!self.isEdit && !self.dataEntity.ID)
		{
			return false;
		}

		if (self.obSelectedDataSources().findIndex(d => d.value === tf.datasourceManager.databaseId) < 0)
		{
			let actionDescription = "do it";
			switch (actionType)
			{
				case "exportQR":
					actionDescription = "download the QR code";
					break;
				case "copyFormURL":
					actionDescription = "copy the URL";
					break;
			}
			tf.promiseBootbox.alert(`Please add current Data Source into Form's Data Sources so you can ${actionDescription}`, "Warning");
			return false;
		}

		if (this.obPublic() && this.obSpecifyRecordTypeId() === SPECIFY_RECORD_TYPE_MY_RECORD)
		{
			return false;
		}

		if (this.obPublic() && this.obOneResponsePerRecipient())
		{
			return false;
		}

		return true;
	}

	EditUserDefinedFieldGroupViewModel.prototype.addGeofenceBtnClick = function()
	{
		var self = this;
		if (self.options.detailViewIsReadOnly)
		{
			return;
		}
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.AddGeofenceModalViewModel({
				gridType: self.dataType,
				geofenceBoundaries: self.obGeofenceBoundaries()
			}))
			.then(function(geofenceBoundaries)
			{
				// exclude button "Cancel"
				if (geofenceBoundaries !== false)
				{
					self.obGeofenceBoundaries(geofenceBoundaries);
				}
				self.countGeofences(self.obGeofenceBoundaries());
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.countGeofences = function(geofenceBoundaries)
	{
		let self = this, geofenceEle = self.$element.find(".geofence-count"), count;

		if (geofenceBoundaries && geofenceBoundaries.boundaries && geofenceBoundaries.boundaries.length > 0)
		{
			count = geofenceBoundaries.boundaries.length;
			const msg = count > 1 ? "Geofences" : "Geofence";
			geofenceEle.show().html(`${count} ${msg}`);
			geofenceEle.attr("title", `${count} ${msg}`);
		} else
		{
			geofenceEle.hide();
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.addIPRangeBtnClick = function()
	{
		var self = this;
		if (self.options.detailViewIsReadOnly)
		{
			return;
		}
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.AddIPRangeModalViewModel({
				gridType: self.dataType,
				currentIPRanges: self.obIPAddressBoundary(),
			}))
			.then(function(response)
			{
				if (response)
				{
					const iPRanges = response.savedIPRanges;
					self.obIPAddressBoundary(iPRanges);
					self.countIPRange(iPRanges);
				}
			});
	}

	EditUserDefinedFieldGroupViewModel.prototype.countIPRange = function(iPRanges)
	{
		let self = this, iprangeEle = self.$element.find(".iprange-count"), count;

		if (iPRanges && iPRanges.split(",").length > 0)
		{
			count = iPRanges.split(",").length;
			const msg = count > 1 ? "Ranges" : "Range";
			iprangeEle.show().html(`${count} ${msg}`);
		} else
		{
			iprangeEle.show().html('');
		}
	}

	EditUserDefinedFieldGroupViewModel.prototype.addGroupFieldBtnClick = function()
	{
		var self = this;
		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: self.dataType,
				public: self.obPublic(),
				isUDFGroup: true,
				UDGridFields: _tmpUDGridFields,
				checkDuplicatesCallback: (name) =>
				{
					const parentId = self.getLastSectionSequence();
					return self.checkDuplicateFieldsInOneSection(parentId, name);
				}
			}))
			.then(function(response)
			{
				if (response)
				{
					var requiredValue = response.Required;
					delete response.Required;

					var UDGridFieldEntity = {
						UDGridId: self.dataEntity.ID,
						DataTypeId: response.DataTypeId,
						DisplayName: response.DisplayName,
						Name: response.DisplayName,
						Description: response.Description,
						ExternalID: response.ExternalID,
						Type: response.TypeId,
						TypeName: response.TypeName,
						Required: requiredValue,
						FieldOptions: JSON.stringify(response)
					}

					if (response.hasOwnProperty("AttributeFlag"))
					{
						UDGridFieldEntity.AttributeFlag = response.AttributeFlag;
					}

					self.addNewQuestionInTreeList(UDGridFieldEntity);
					self.refreshCurrentUdfCount();
				}
				self.checkUDGridSections();
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.onCopyAndNewGroupFieldBtnClick = function(evt)
	{
		var self = this,
			$tr = $(evt.currentTarget).closest("tr"),
			dataType = self.dataType,
			dataItemtmp = self.kendoGrid.dataItem($tr[0]);
		var dataItem = JSON.parse(JSON.stringify(dataItemtmp));
		var originalName = dataItem.Name || dataItem.DisplayName;
		var existedNames = self.kendoGrid.dataSource.data().map(x => x.Name);
		dataItem.ExistedNames = existedNames;
		dataItem.Name = TF.Helper.NewCopyNameHelper.generateNewCopyName(originalName, existedNames);
		dataItem.TypeId = dataItem.Type;
		dataItem.Type = dataItem.TypeName;
		dataItem.DisplayName = dataItem.Name;
		dataItem.isCopy = true;

		if (dataItem.FieldOptions)
		{
			var typeData = JSON.parse(dataItem.FieldOptions);
			typeData.DisplayName = dataItem.DisplayName;
			$.extend(dataItem, typeData);
		}

		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: dataType,
				dataEntity: dataItem,
				isUDFGroup: true,
				UDGridFields: _tmpUDGridFields
			})).then(function(response)
			{
				if (response)
				{
					var requiredValue = response.Required;
					delete response.Required;

					self.refreshCurrentUdfCount();
					self.refreshGrid();
				}
				dataItem.Type = dataItem.TypeId;
				self.checkUDGridSections();
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.onEditGroupFieldBtnClick = function(evt)
	{
		var self = this,
			$tr = $(evt.currentTarget).closest("tr"),
			dataType = self.dataType;
		dataItemtmp = self.kendoGrid.dataItem($tr[0]);
		var dataItem = JSON.parse(JSON.stringify(dataItemtmp));
		dataItem.TypeId = dataItem.Type;
		dataItem.Type = dataItem.TypeName;
		dataItem.DisplayName = dataItem.Name;

		if (dataItem.FieldOptions)
		{
			var typeData = JSON.parse(dataItem.FieldOptions);
			$.extend(dataItem, typeData);
		}

		tf.modalManager.showModal(
			new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
				gridType: dataType,
				dataEntity: dataItem,
				isUDFGroup: true,
				UDGridFields: _tmpUDGridFields
			})).then(function(response)
			{
				if (response)
				{
					var udfindex = _tmpUDGridFields.findIndex(function(item) { return item.Name == response.Name; });
					if (udfindex >= 0)
					{
						var editdata = _tmpUDGridFields[udfindex];
						editdata.ID = response.ID;
						editdata.DataTypeId = response.DataTypeId;
						editdata.Description = response.Description;
						editdata.ExternalID = response.ExternalID;
						editdata.DisplayName = response.DisplayName;
						editdata.Index = response.Index;
						editdata.Name = response.DisplayName;
						editdata.Type = response.TypeId;
						editdata.TypeName = response.TypeName;
						editdata.Required = response.Required;

						delete response.FieldOptions;
						delete response.ID;
						delete response.ExternalID;
						delete response.Index;
						delete response.Name;
						delete response.Type;
						delete response.AttributeFlag;
						delete response.CreatedOn;
						delete response.Guid;
						delete response.LastUpdatedOn;
						delete response.UDFType;
						delete response.UDGrid;
						delete response.UDGridID;
						delete response.Required;

						editdata.FieldOptions = JSON.stringify(response);
						self.refreshGrid();
					}
				}
				dataItem.Type = dataItem.TypeId;
				self.checkUDGridSections();
			});
	};

	EditUserDefinedFieldGroupViewModel.prototype.onDeleteGroupFieldBtnClick = function(evt)
	{
		var self = this, $tr = $(evt.currentTarget).closest("tr"),
			dataItem = self.kendoGrid.dataItem($tr[0]), deleteIndex = null, deleteType = null;

		_tmpUDGridFields.forEach(function(item, index, arr)
		{
			if (item.Name === dataItem.Name)
			{
				deleteIndex = index;
				deleteType = dataItem.Type;
				return;
			}
		});

		if (self.isEdit)
		{
			if (deleteType === AttachmentTypeId && dataItem.ID)
			{ // for document checking association
				tf.promiseBootbox.yesNo({
					message: 'This operation will disassociate all affected documents. Click Yes to continue.',
					title: "Confirmation Message",
					closeButton: true
				}).then(function(result)
				{
					if (result)
					{
						var uDGridID = self.dataEntity.ID;
						tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "DocumentUDGridRecords"), {
							paramData: { uDGridID: uDGridID, questionId: dataItem.Guid },
							async: false
						}, { overlay: false }).then(function(response)
						{
							if (response)
							{
								self.refreshQuestions(deleteIndex);
								tf.promiseBootbox.alert("Affected documents have been disassociated.");
							}
							self.checkUDGridSections();
						})
					}
					self.checkUDGridSections();
				})
			}
			else if (deleteType === SignatureTypeId && dataItem.ID)
			{ // for signature checking using
				tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
					{
						paramData: {
							RecordDataType: self.dataEntity.DataTypeId,
							UDGridID: self.dataEntity.ID
						}
					}).then(function(ret)
					{
						if (!ret || !ret.Items || !ret.Items.length)
						{
							self.refreshQuestions(deleteIndex);
						} else
						{
							return tf.promiseBootbox.alert("You cannot delete Signature question because it is already in use.")
								.then(function()
								{
									self.dataEntity.GridOptions = self.getGridOptions();
									self.checkUDGridSections();
									return Promise.reject(false);
								});
						}
						self.checkUDGridSections();
					});
			}
			else
			{
				self.refreshQuestions(deleteIndex);
			}
		} else
		{
			self.refreshQuestions(deleteIndex);
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.refreshQuestions = function(deleteIndex)
	{
		var self = this;
		self.checkUDGridSections();
		self.refreshCurrentUdfCount();
		self.refreshGrid();
	};

	EditUserDefinedFieldGroupViewModel.prototype.refreshGrid = function()
	{
		var self = this,
			gridColumns = self.getGridColumnsByType();
		self.resetUDGridFieldsIndex();
		self.sortUDGridFieldsByIndex();
		self.kendoGrid.setOptions({
			dataSource: {
				data: _tmpUDGridFields
			},
			columns: gridColumns
		});

		self.checkUDGridFields();

		self.refreshGridFoot(self.kendoGrid);

		self.bindGridDraggable();
		self.bindGridDropTarget();
		self.createKendoDropTargetEvent();
		self.initGridScrollBar(self.gridcontainer);
	};

	EditUserDefinedFieldGroupViewModel.prototype.getGridColumnsByType = function()
	{
		var self = this,
			gridColumns;
		gridColumns = _PRIMARY_GRID_COLUMNS.filter(function(item)
		{
			return !item.hidden && item.onlyForReportType !== true;
		});

		return gridColumns.concat(self.commandGridColumns.slice());
	};

	EditUserDefinedFieldGroupViewModel.prototype._fullfillGridBlank = function()
	{
		var $canver = this.$container.find(".k-grid-content");
		$canver.children('.kendogrid-blank-fullfill').remove();

		var $blankFiller = $('<table class="kendogrid-blank-fullfill"></table>');
		var $trs = $canver.children('table[role=grid]').children('tbody').children('tr');
		$trs.map(function(idx, tr)
		{
			var $tr = $(tr);
			var uid = $tr.data('kendo-uid');
			var $td = $($tr.find('td')[0]);
			var fillItemColor = $td.css('background-color');
			var fillItemHeight = $td.outerHeight();
			var fillItemClass = (idx % 2 === 0) ? 'l' : 'l-alt';
			$blankFiller.append(
				'<tr data-id="' + uid + '" class="fillItem ' + fillItemClass + '"' +
				' style="height:' + fillItemHeight + 'px;background-color:' + fillItemColor + '">' +
				'</tr>'
			);
		});

		$canver.prepend($blankFiller).children('table').addClass('table-blank-fullfill');
	};

	EditUserDefinedFieldGroupViewModel.prototype.bindGridDraggable = function()
	{
		var self = this;
		self.gridcontainer.find(".k-grid-content").kendoDraggable({
			filter: "tbody > tr",
			threshold: 100,
			holdToDrag: TF.isMobileDevice,
			autoScroll: true,
			hint: function(e)
			{
				if (e.is(".doc-sigunature-defined-field"))
				{
					return null;
				}
				return _getHintElements(e, self.gridcontainer);
			}.bind(self),
			dragstart: function(e)
			{
			}.bind(self),
			cursorOffset: { top: -10, left: -10 },
			dragend: function(e)
			{
			}.bind(self)
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.bindGridDropTarget = function()
	{
		this.gridcontainer.parent().parent().kendoDropTarget({
			dragenter: function(e)
			{
				var helper = this.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_removeDropTargetCursorTriangle();
					_appendDropTargetCursorTriangle(helper.targetItem, helper.insertBeforeTarget);
				}
			}.bind(this),
			dragleave: function(e)
			{
				var selectedColItems = this.gridcontainer.find('tr');
				selectedColItems.removeClass("drag-target-insert-before-cursor");
				selectedColItems.removeClass("drag-target-insert-after-cursor"); // modify dropTarget element

				_removeDropTargetCursorTriangle();

			}.bind(this),
			drop: function(e)
			{
				var helper = this.gridDropTargetHelper(e);
				if (helper.targetItem)
				{
					_selectedDrop.bind(this)(e, helper.targetItem, helper.insertBeforeTarget)
					var selectedColItems = this.gridcontainer.find('tr');
					selectedColItems.removeClass("drag-target-insert-before-cursor");
					selectedColItems.removeClass("drag-target-insert-after-cursor");
					_removeDropTargetCursorTriangle();
					this.clearSelection();
				}
			}.bind(this)
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.gridDropTargetHelper = function(evt)
	{
		var selectedColItems = this.gridcontainer.find('tr'),
			targetItem = null,
			insertBeforeTarget = false

		if ((selectedColItems.length <= 2) || !evt.draggable.hint)
		{
			return {
				targetItem: null,
				insertBeforeTarget: null
			};
		}

		if (evt.draggable.hint.offset() && (evt.draggable.hint.offset().top - 35 <= this.$element.find('.udfGroup .grid-container .k-grid-content').offset().top))
		{
			targetItem = $(selectedColItems[1]);
			targetItem.addClass("drag-target-insert-before-cursor"); // modify dropTarget element
			insertBeforeTarget = true;
		}
		else
		{
			targetItem = $(selectedColItems[selectedColItems.length - 1]);
			if (targetItem.is(".doc-sigunature-defined-field"))
			{
				return {
					targetItem: null,
					insertBeforeTarget: null
				};
			}
			targetItem.addClass("drag-target-insert-after-cursor");
		}

		return {
			targetItem: targetItem,
			insertBeforeTarget: insertBeforeTarget
		};
	};

	EditUserDefinedFieldGroupViewModel.prototype.createKendoDropTargetEvent = function()
	{
		var self = this;
		this.gridcontainer.find("tbody tr").kendoDropTarget({
			dragenter: function(e)
			{
				if (!$(e.draggable.currentTarget).is("tr") || (e.draggable.currentTarget).is(".doc-sigunature-defined-field"))
				{
					e.preventDefault();
					return;
				}
				var selectedColItems = self.gridcontainer.find('tr');
				if (selectedColItems.length > 2)
				{
					targetItem = $(e.dropTarget[0]);
					if (targetItem.is(".doc-sigunature-defined-field"))
					{
						return;
					}
					targetItem.addClass("drag-target-insert-after-cursor");

					_removeDropTargetCursorTriangle();
					_appendDropTargetCursorTriangle(targetItem);
				}
			},
			dragleave: function(e)
			{
				$(e.dropTarget[0]).removeClass("drag-target-insert-after-cursor");
				_removeDropTargetCursorTriangle();
			},
			drop: function(e)
			{
				if (e.draggable.currentTarget.is(".doc-sigunature-defined-field"))
				{
					return;
				}
				targetItem = $(e.dropTarget[0]);
				_selectedDrop.bind(this)(e, targetItem, false);
			}.bind(this)
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.clearSelection = function()
	{
		_obGridSelectedUids([]);
		this.kendoGrid.clearSelection();
	};

	EditUserDefinedFieldGroupViewModel.prototype._moveItemUpDown = function(targetIdx)
	{
		var selectedRows = _getDataRowsBySelectedUids(_obGridSelectedUids(), this.kendoGrid.dataSource);

		var gridData = this.kendoGrid.dataSource.data();
		var insertBefore = Enumerable.From(gridData.slice(0, targetIdx)).Except(selectedRows).ToArray();
		var insertAfter = Enumerable.From(gridData.slice(targetIdx)).Except(selectedRows).ToArray();
		if (insertBefore.length > 0 && insertBefore[insertBefore.length - 1].locked == false)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = false;
			});
		}
		else if (insertAfter.length > 0 && insertAfter[0].locked == true)
		{
			selectedRows.forEach(function(item)
			{
				item.locked = true;
			});
		}
		_tmpUDGridFields = [insertBefore, selectedRows, insertAfter].reduce(function(a, b)
		{
			return a.concat(b);
		}, []);
		this.kendoGrid.dataSource.data(_tmpUDGridFields);

		_hightLightSelectedItems();

		this.createKendoDropTargetEvent();
	};


	var _selectedDrop = function(e, target, isfirst)
	{
		if (target.is(".doc-sigunature-defined-field"))
		{
			return;
		}
		if (e.draggable.hint)
		{
			e.draggable.hint.hide();
		}
		var insertIdx = _getInsertIdx(target, isfirst);
		var selectedUids = [e.draggable.currentTarget.data().kendoUid];
		_obGridSelectedUids(selectedUids);
		this._moveItemUpDown(insertIdx);
	};

	var _getInsertIdx = function(dest, isfirst)
	{
		var insertIdx = 0;

		if (isfirst)
		{
			insertIdx = 0;
		}
		else
		{
			destData = _selectedColGrid.dataSource.getByUid(dest.data(_KendoUid));
			var gridData = _selectedColGrid.dataSource.data();

			insertIdx = gridData.length;
			if (destData && gridData)
			{

				gridData.forEach(function(col, idx)
				{
					if (col === destData)
					{
						insertIdx = Math.min(idx + 1, gridData.length);
						return;
					}
				});
			}
		}

		return insertIdx;
	};


	var _getDataRowsBySelectedUids = function(selectedUids, dataSource)
	{
		var dataRows = $.map(selectedUids, function(uid)
		{
			return dataSource.getByUid(uid);
		}.bind(this));
		return dataRows;
	};

	var _hightLightSelectedItems = function()
	{
		var items = _selectedColGrid.items();
		_obGridSelectedUids().forEach(function(uid)
		{
			$.map(items, function(item)
			{
				if (item.dataset[_KendoUid] == uid)
				{
					_selectedColGrid.select(item);
					return;
				}
			});
		});
	};

	var _removeDropTargetCursorTriangle = function()
	{
		this.$element.find('#left-triangle').remove();
		this.$element.find('#right-triangle').remove();
	};

	var _appendDropTargetCursorTriangle = function(targetItem, insertBeforeTarget)
	{
		var leftTriangle = $('<div id="left-triangle"></div>').addClass('drag-target-cursor-left-triangle');
		var rightTriangle = $('<div id="right-triangle"></div>').addClass('drag-target-cursor-right-triangle');

		leftTriangle.css("left", -1 + "px");
		rightTriangle.css("left", targetItem.width() - 14 + "px");

		if (insertBeforeTarget)
		{
			leftTriangle.css("top", "-6px");
			rightTriangle.css("top", "-6px");
		}

		targetItem.find('td:first').append(leftTriangle);
		targetItem.find('td:first').append(rightTriangle);
	};

	var _getHintElements = function(item, container)
	{
		var hintElements = $('<div class="k-grid k-widget list-mover-drag-hint" style=""><table><tbody></tbody></table></div>'),
			maxWidth = container.width(), tooLong = false;
		hintElements.css({
			"background-color": "#FFFFCE",
			"opacity": 0.8,
			"cursor": "move"
		});

		tooLong = $(item).width() > maxWidth;
		hintElements.width(tooLong ? maxWidth : $(item).width());
		hintElements.find('tbody').append('<tr><td role="gridcell" style="width:28px"><div class="item-drag-icon"></div></td>' + $(item.html())[1].outerHTML + '</tr>');

		return hintElements;
	};

	EditUserDefinedFieldGroupViewModel.prototype.resizeImageInContainer = function()
	{
		var self = this;
		if (self.obCurrentImageUrl())
		{
			TF.DataView.ImageDataViewModelHelper.resizeImageInContainer(
				self.obCurrentImageUrl(),
				'.customize-setting .thumb',
				'.customize-setting .thumb-canvas',
				'.customize-setting .thumb-canvas > img',
				20);
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.getLastSectionId = function()
	{
		const self = this, treeData = self.kendoTreeList.dataSource.data();
		let lastSectionId = null;
		if (treeData && treeData.length > 0)
		{
			treeData.forEach(td =>
			{
				if (td.isSection)
				{
					lastSectionId = td.sectionId;
				}
			})
		}
		return lastSectionId;
	};

	EditUserDefinedFieldGroupViewModel.prototype.getMaxSectionSequence = function()
	{
		const self = this, treeData = self.kendoTreeList.dataSource.data();
		let lastSectionSequence = 0;
		if (treeData && treeData.length > 0)
		{
			treeData.forEach(td =>
			{
				if (td.isSection && td.Sequence > lastSectionSequence)
				{
					lastSectionSequence = td.Sequence
				}
			})
		}
		return lastSectionSequence;
	};

	EditUserDefinedFieldGroupViewModel.prototype.getLastSectionSequence = function()
	{
		const self = this, treeData = self.kendoTreeList.dataSource.data();
		let lastSectionSequence = 0;
		if (treeData && treeData.length > 0)
		{
			treeData.forEach(td =>
			{
				if (td.isSection)
				{
					lastSectionSequence = td.Sequence
				}
			})
		}
		return lastSectionSequence;
	};

	EditUserDefinedFieldGroupViewModel.prototype.getLastQuestionIndexByParentId = function(parentId)
	{
		const self = this, treeData = self.kendoTreeList.dataSource.data();
		let lastIndex = 0;
		if (treeData && treeData.length > 0)
		{
			treeData.forEach(td =>
			{
				if (!td.isSection && td.parentId === parentId && td.Index > lastIndex)
				{
					lastIndex = td.Index;
				}
			})
		}
		return lastIndex;
	};

	EditUserDefinedFieldGroupViewModel.prototype.addNewSectionInTreeList = function(sectionEntity)
	{
		const self = this, maxSectionSequence = self.getMaxSectionSequence();
		sectionEntity.Sequence = maxSectionSequence + 1;
		sectionEntity.parentId = null;
		sectionEntity.isSection = true;
		sectionEntity.UDGridId = self.dataEntity.ID;
		if (maxSectionSequence === 0)
		{
			const treeData = self.kendoTreeList.dataSource.data();
			if (treeData && treeData.length > 0)
			{
				treeData.forEach(td =>
				{
					if (!td.isSection)
					{
						td.parentId = sectionEntity.Sequence;
					}
				})
			}
		}
		self.kendoTreeList.dataSource.pushCreate(sectionEntity);
		self.obDisableShowOneSection(false);
	};

	EditUserDefinedFieldGroupViewModel.prototype.addNewQuestionInTreeList = function(questionEntity)
	{
		const self = this, parentId = self.getLastSectionSequence();
		questionEntity.index = self.getLastQuestionIndexByParentId(parentId) + 1;
		questionEntity.parentId = parentId === 0 ? null : parentId;
		questionEntity.isSection = false;
		questionEntity.Sequence = 0;
		questionEntity.UDGridId = self.dataEntity.ID;
		if (!questionEntity.UDGridSectionId || questionEntity.UDGridSectionId === 0)
		{
			questionEntity.UDGridSectionId = self.getLastSectionId();
		}
		self.kendoTreeList.dataSource.pushCreate(questionEntity);
	};

	EditUserDefinedFieldGroupViewModel.prototype.onCopyAndNewGroupSectionBtnClick = function(evt)
	{
		var self = this,
			dataType = self.dataType,
			dataItemtmp = self.kendoTreeList.dataItem(evt.currentTarget);
		var dataItem = JSON.parse(JSON.stringify(dataItemtmp));
		var originalName = dataItem.Name || dataItem.DisplayName;
		var existedSectionNames = self.kendoTreeList.dataSource.data().filter(x => x.isSection).map(x => x.Name);
		var existedFieldNames = self.kendoTreeList.dataSource.data().filter(x => !x.isSection).map(x => x.Name);

		if (dataItem.isSection)
		{
			dataItem.Name = TF.Helper.NewCopyNameHelper.generateNewCopyName(originalName, existedSectionNames);
			tf.modalManager.showModal(
				new TF.Modal.UserDefinedField.EditUserDefinedSectionModalViewModel({
					isPublic: self.obPublic(),
					isUDFGroup: true,
					dataEntity: {
						IsPublic: dataItem.IsPublic,
						AllRole: self.typeRoles.dataSource.options,
						HasRole: self.typeRoles.value(),
						RoleSections: dataItem.RoleSections,
						Name: dataItem.Name,
						isCopy: true,
						ExistedNames: existedSectionNames
					}
				}))
				.then(function(response)
				{
					if (response)
					{
						dataItem.Name = response.Name;
						dataItem.RoleSections = response.HasRole ? response.HasRole.map(x => ({ SectionID: 0, RoleID: x })) : [];
						dataItem.IsPublic = response.IsPublic;
						dataItem.Id = 0;
						dataItem.Sequence = self.getMaxSectionSequence() + 1;
						dataItem.expanded = true;
						self.kendoTreeList.dataSource.pushCreate(dataItem);
						if (dataItemtmp.hasChildren)
						{
							const currentChildrens = self.kendoTreeList.dataSource.data().filter(x => !x.isSection && x.parentId === dataItemtmp.Sequence);
							const currentChildrensItem = JSON.parse(JSON.stringify(currentChildrens));
							currentChildrensItem.forEach(cc =>
							{
								delete cc.Guid;
								cc.ID = 0;
								cc.parentId = dataItem.Sequence;
								cc.Name = TF.Helper.NewCopyNameHelper.generateNewCopyName(cc.Name, existedFieldNames);
								cc.DisplayName = cc.Name;
								var tempFieldOptions = JSON.parse(cc.FieldOptions);
								tempFieldOptions.DisplayName = cc.Name;
								cc.FieldOptions = JSON.stringify(tempFieldOptions);
								self.kendoTreeList.dataSource.pushCreate(cc);
							})
						}
					}
					self.refreshCurrentUdfCount();
				});
		}
		else
		{
			delete dataItem.Guid;
			dataItem.ExistedNames = existedFieldNames;
			dataItem.Name = TF.Helper.NewCopyNameHelper.generateNewCopyName(originalName, existedFieldNames);
			dataItem.TypeId = dataItem.Type;
			dataItem.Type = dataItem.TypeName;
			dataItem.DisplayName = dataItem.Name;
			dataItem.isCopy = true;

			if (dataItem.FieldOptions)
			{
				var typeData = JSON.parse(dataItem.FieldOptions);
				typeData.DisplayName = dataItem.DisplayName;
				$.extend(dataItem, typeData);
			}

			tf.modalManager.showModal(
				new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
					gridType: dataType,
					dataEntity: dataItem,
					isUDFGroup: true,
					UDGridFields: _tmpUDGridFields,
					checkDuplicatesCallback: (name) =>
					{
						return self.checkDuplicateFieldsInOneSection(dataItem.parentId, name);
					}
				})).then(function(response)
				{
					if (response)
					{
						var requiredValue = response.Required;
						delete response.Required;

						var UDGridFieldEntity = {
							DataTypeId: response.DataTypeId,
							DisplayName: response.DisplayName,
							Name: response.DisplayName,
							Description: response.Description,
							Type: response.TypeId,
							TypeName: response.TypeName,
							Required: requiredValue,
							FieldOptions: JSON.stringify(response),
							ID: 0,
							parentId: dataItem.parentId,
							sectionId: dataItem.sectionId,
							Index: self.getLastQuestionIndexByParentId(dataItem.parentId)
						}

						self.kendoTreeList.dataSource.pushCreate(UDGridFieldEntity);
					}
					dataItem.Type = dataItem.TypeId;
					self.refreshCurrentUdfCount();
				});
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.onEditGroupSectionBtnClick = function(evt)
	{
		var self = this,
			dataType = self.dataType;
		dataItemtmp = self.kendoTreeList.dataItem(evt.currentTarget);
		var dataItem = JSON.parse(JSON.stringify(dataItemtmp));
		dataItem.uid = dataItemtmp.uid;
		if (dataItem.isSection)
		{
			tf.modalManager.showModal(
				new TF.Modal.UserDefinedField.EditUserDefinedSectionModalViewModel({
					isPublic: self.obPublic(),
					isUDFGroup: true,
					dataEntity: {
						IsPublic: dataItemtmp.IsPublic,
						AllRole: self.typeRoles.dataSource.options,
						HasRole: self.typeRoles.value(),
						RoleSections: dataItemtmp.RoleSections,
						Name: dataItemtmp.Name,
						isCopy: false,
						ExistedNames: self.kendoTreeList.dataSource.data().filter(tl => tl.isSection && tl.Name !== dataItem.Name).map(tl => tl.Name)
					}
				}))
				.then(function(response)
				{
					if (response)
					{
						dataItemtmp.Name = response.Name;
						dataItemtmp.RoleSections = response.HasRole ? response.HasRole.map(x => ({ SectionID: dataItemtmp.Id, RoleID: x })) : [];
						dataItemtmp.IsPublic = response.IsPublic;
						self.kendoTreeList.dataSource.pushUpdate(dataItemtmp);
					}
					self.refreshCurrentUdfCount();
				});
		}
		else
		{
			dataItem.TypeId = dataItem.Type;
			dataItem.Type = dataItem.TypeName;
			dataItem.DisplayName = dataItem.Name;

			if (dataItem.FieldOptions)
			{
				var typeData = JSON.parse(dataItem.FieldOptions);
				$.extend(dataItem, typeData);
			}

			tf.modalManager.showModal(
				new TF.Modal.UserDefinedField.EditUserDefinedFieldModalViewModel({
					gridType: dataType,
					dataEntity: dataItem,
					isUDFGroup: true,
					UDGridFields: _tmpUDGridFields,
					checkDuplicatesCallback: (name) =>
					{
						return self.checkDuplicateFieldsInOneSection(dataItemtmp.parentId, name, dataItemtmp.uid);
					}
				})).then(function(response)
				{
					if (response)
					{
						var tempRes = JSON.parse(JSON.stringify(response));
						delete response.FieldOptions;
						delete response.ID;
						delete response.ExternalID;
						delete response.Index;
						delete response.Name;
						delete response.Type;
						delete response.AttributeFlag;
						delete response.CreatedOn;
						delete response.Guid;
						delete response.LastUpdatedOn;
						delete response.UDFType;
						delete response.UDGrid;
						delete response.UDGridID;
						delete response.Required;
						delete response.SectionName;
						delete response.Sequence;
						delete response.UDGridSection;
						delete response.UDGridSectionId;
						delete response.hasChildren;
						delete response.isSection;
						delete response.parentId;
						const fieldOptionsStr = JSON.stringify(response);

						var udfindex = _tmpUDGridFields.findIndex(function(item)
						{
							return item.uid === tempRes.uid;
						});

						// replace the Read Only text in System Field so that the FieldOption would have the right value.
						tempRes.TypeName = tempRes.TypeName.startsWith('System Field') > -1 ?
							tempRes.TypeName.replace('(Read Only)', '').trim() :
							tempRes.TypeName;

						if (udfindex >= 0)
						{
							var editdata = _tmpUDGridFields[udfindex];
							editdata.ID = tempRes.ID;
							editdata.DataTypeId = tempRes.DataTypeId;
							editdata.Description = tempRes.Description;
							editdata.ExternalID = tempRes.ExternalID;
							editdata.DisplayName = tempRes.DisplayName;
							editdata.Index = tempRes.Index;
							editdata.Name = tempRes.DisplayName;
							editdata.Type = tempRes.TypeId;
							editdata.TypeName = tempRes.TypeName;
							editdata.Required = tempRes.Required;
							editdata.FieldOptions = fieldOptionsStr;
						}

						dataItemtmp.DataTypeId = tempRes.DataTypeId;
						dataItemtmp.Description = tempRes.Description;
						dataItemtmp.ExternalID = tempRes.ExternalID;
						dataItemtmp.DisplayName = tempRes.DisplayName;
						dataItemtmp.Index = tempRes.Index;
						dataItemtmp.Name = tempRes.DisplayName;
						dataItemtmp.Type = tempRes.TypeId;
						dataItemtmp.TypeName = tempRes.TypeName;
						dataItemtmp.Required = tempRes.Required;
						dataItemtmp.FieldOptions = fieldOptionsStr;
						self.kendoTreeList.dataSource.data()?.forEach(item =>
							item.TypeName = (item.Type === SYSTEM_FIELD_TYPE_ID) ? "System Field (Read Only)" : item.TypeName);
						self.kendoTreeList.dataSource.sync();
					}
					self.refreshCurrentUdfCount();
					dataItem.Type = dataItem.TypeId;
				});
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.handleSections = function()
	{
		const self = this;

		self.dataEntity.UDGridSections.forEach(function(section, index, arr)
		{
			section.parentId = null;
			var currentFields = self.dataEntity.UDGridFields.filter(uf => uf.UDGridSectionId === section.Id);
			if (currentFields && currentFields.length > 0)
			{
				section.UDGridFields = currentFields;
				section.UDGridFields.forEach(function(field, index, arr)
				{
					field.parentId = section.Sequence;
					field.Sequence = 0;
				});
			}
		});
	};

	EditUserDefinedFieldGroupViewModel.prototype.handleSectionFieldRelationshipWhenImport = function(dataEntity)
	{
		if (dataEntity.UDGridSections && dataEntity.UDGridSections.length > 0)
		{
			dataEntity.UDGridSections.forEach(function(section, index, arr)
			{
				section.Sequence = index + 1;
				section.parentId = null;

				if (section.UDGridFields && section.UDGridFields.length > 0)
				{
					section.UDGridFields.forEach(function(field, index, arr)
					{
						field.Index = index + 1;
						field.parentId = section.Sequence;
						field.Sequence = 0;
					});
				}
			});
		}

		//this.refreshCurrentUdfCount();
	};

	EditUserDefinedFieldGroupViewModel.prototype.onDeleteGroupSectionBtnClick = function(evt)
	{
		var self = this, targetDataItem = self.kendoTreeList.dataItem(evt.currentTarget);
		const sectionCount = self.kendoTreeList.dataSource.data().filter(data => data.isSection).length;
		let messageStr = "";

		if (targetDataItem.isSection)
		{
			if (sectionCount > 1)
			{
				messageStr = "Deleting a section will delete all questions within the section. Are you sure you want to delete this section?";
			}
			else if (sectionCount === 1)
			{
				messageStr = "This is the only section on the Form. Questions within this section will remain on the form, they will not be deleted. Are you sure you want to delete this section?";
			}
		}
		else
		{
			messageStr = "Are you sure you want to delete this question?";
		}

		tf.promiseBootbox.yesNo({
			message: messageStr,
			title: "Confirmation Message",
			closeButton: true
		}).then(function(result)
		{
			if (result)
			{
				if (targetDataItem.isSection)
				{
					const childFields = self.kendoTreeList.dataSource.data().filter(data => data.parentId === targetDataItem.Sequence);
					if (childFields && childFields.length > 0)
					{
						if (sectionCount === 1)
						{
							childFields.forEach(field => field.parentId = null);
						}
						else
						{
							childFields.forEach(field => self.kendoTreeList.dataSource.remove(field));
						}
					}
				}
				self.kendoTreeList.dataSource.remove(targetDataItem);
				self.refreshCurrentUdfCount();
				self.obDisableShowOneSection(!self.hasSection());
			}
		})
	};

	EditUserDefinedFieldGroupViewModel.prototype.existFormSubmission = udGridId =>
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udgridrecords"),
			{
				paramData: {
					DBID: tf.datasourceManager.databaseId,
					UDGridID: udGridId,
					"@count": true
				}
			},
			{ overlay: false }
		).then(count => count > 0)

	EditUserDefinedFieldGroupViewModel.prototype._initThankYouMessageEditor = function()
	{
		var self = this, editorId = self.options.isDetailView ? "#ThankYouMessageEditor_forms" : "#ThankYouMessageEditor",
			htmlEditorId = self.options.isDetailView ? "#ThankYouMessageHtmlEditor_forms" : "#ThankYouMessageHtmlEditor",
			$editorWrapper = self.$element.find(".thank-you-message-editor-wrapper"),
			MessageBodyHtmlEditor = self.$element.find(htmlEditorId);

		$editorWrapper.css("visibility", "visible");
		if (self.messageBodyEditor)
		{
			self.messageBodyEditor.destroy();
		}
		self.messageBodyEditor = self.$element.find(editorId).kendoEditor({
			resizable: {
				toolbar: false,
				content: false
			},
			tools: ["formatting", "cleanFormatting", "undo", "redo", "fontName", "fontSize", "foreColor", "backColor", "bold", "italic", "underline", "justifyLeft",
				"justifyCenter", "justifyRight", "insertUnorderedList", "insertOrderedList", "indent", "createLink", "unlink", "createTable",
				"addRowAbove", "addRowBelow", "addColumnLeft", "addColumnRight", "deleteRow", "deleteColumn"],
			change: function()
			{
				self.messageBodyEditorChanged = (self.messageBodyEditor.value() !== self.obDisplayThankYouMessage());
			},
			select: function()
			{
				const $clearCssIcon = self.messageBodyEditor.toolbar.element.find("span.k-i-clear-css");
				const hasSelectedText = self.messageBodyEditor.selectedHtml().length > 0;
				if (!hasSelectedText)
				{
					$clearCssIcon.addClass("disabled");
				}
				else
				{
					$clearCssIcon.removeClass("disabled");
				}
			}
		}).data("kendoEditor");

		setTimeout(function()
		{
			$(self.messageBodyEditor.body).blur(function()
			{
				self.obDisplayThankYouMessage(self.messageBodyEditor.value());
				self.$element.find(thankYouMessageSelector).change();
			});
		}, 300);

		MessageBodyHtmlEditor.blur(function()
		{
			self.$element.find(thankYouMessageSelector).change();
		});

		$editorWrapper.find(".k-insertImage").closest(".k-tool").hide();
		var $head = self.$element.find("#messageBody").closest("#edit-message-control").find("iframe").contents().find("head");
		$head.append($("<link/>",
			{ rel: "stylesheet", href: "Global/ThirdParty/bootstrap/css/bootstrap.min.css", type: "text/css" }
		));

		self.messageBodyEditor.value(self.obDisplayThankYouMessage());
		self.messageBodyEditor.refresh();

		self.$element.find(".editor-options-wrap .design").addClass("selected");
		self.$element.find(".editor-options-wrap .html").removeClass("selected");
		self.messageBodyEditor.toolbar.element.find("span.k-i-clear-css").addClass("disabled");

		if (self.options.detailViewIsReadOnly)
		{
			const displayThankYouMessageDiv = $("<div>").attr("id", "ThankYouMessageHtmlEditor_div");
			displayThankYouMessageDiv.html(self.obDisplayThankYouMessage());
			$editorWrapper.find(".html-editor-wrapper").show();
			$editorWrapper.find(".html-editor-wrapper").append(displayThankYouMessageDiv);
			MessageBodyHtmlEditor.hide();
			$editorWrapper.find(".text-editor-wrapper").hide();
			self.$element.find(".editor-options-wrap .design").hide();
			self.$element.find(".editor-options-wrap .html").hide();
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.changePattern = function(viewModel, e)
	{
		var self = this, htmlEditorId = self.options.isDetailView ? "#ThankYouMessageHtmlEditor_forms" : "#ThankYouMessageHtmlEditor";
		$MessageBodyHtmlEditor = self.$element.find(htmlEditorId),
			$optionBtn = $(e.target).closest(".option");

		if ($optionBtn.hasClass("selected"))
		{
			return;
		}

		var $container = $optionBtn.closest(".thank-you-message-editor-wrapper");
		$container.find(".option").removeClass("selected");
		$optionBtn.addClass("selected");

		if ($optionBtn.hasClass("design"))
		{
			$container.find(".text-editor-wrapper").show();
			$container.find(".html-editor-wrapper").hide();
			self.messageBodyEditor.value($MessageBodyHtmlEditor.val());
		}
		else
		{
			$container.find(".html-editor-wrapper").show();
			$container.find(".text-editor-wrapper").hide();
			$MessageBodyHtmlEditor.val(self.messageBodyEditor.value());
		}
	};

	EditUserDefinedFieldGroupViewModel.prototype.hasRoleFormsChanged = function()
	{
		var self = this;
		const RoleForms = self.typeRoles ? self.typeRoles.value().filter(x => x >= 0) : [];
		if (!self.initialDataEntity || RoleForms.length == 0)
		{
			return false;
		}

		const initialRoleForms = self.initialDataEntity.RoleForms ? self.initialDataEntity.RoleForms.map(x => x.RoleID) : [];
		if (initialRoleForms.length !== RoleForms.length || initialRoleForms.sort().toString() !== RoleForms.sort().toString())
		{
			return true;
		}

		return false;
	};

	EditUserDefinedFieldGroupViewModel.prototype.hasRoleSectionsChanged = function(Sections)
	{
		var self = this;
		if (!self.initialDataEntity || !self.initialDataEntity.UDGridSections)
		{
			return false;
		}

		const initialSections = Array.isArray(self.initialDataEntity.UDGridSections) ? self.initialDataEntity.UDGridSections : [];
		if (Sections.length == 0 || initialSections.length == 0)
		{
			return false;
		}

		for (var i in initialSections)
		{
			var initialSectionId = initialSections[i].Id;
			var initialRoleSection = initialSections[i].RoleSections ? initialSections[i].RoleSections.map(x => x.RoleID) : [];
			for (var j in Sections)
			{
				var SectionId = Sections[j].Id;
				var RoleSection = Sections[j].RoleSections ? Sections[j].RoleSections.map(x => x.RoleID) : [];
				if (SectionId === initialSectionId && initialRoleSection.sort().toString() !== RoleSection.sort().toString())  
				{
					return true;
				}
			}
		}

		return false;
	};

	EditUserDefinedFieldGroupViewModel.prototype.changePermissions = function()
	{
		var self = this;
		self.canAdd(tf.authManager.hasFormsGridAccess('add'));
		self.canEdit(tf.authManager.hasFormsGridAccess('edit'));
		self.canAssignRole(tf.authManager.hasFormsGridAccess('save'));
	}

	EditUserDefinedFieldGroupViewModel.prototype.dispose = function()
	{
	};
})();
