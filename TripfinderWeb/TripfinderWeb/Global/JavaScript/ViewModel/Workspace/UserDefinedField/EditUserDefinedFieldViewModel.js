(function()
{
	createNamespace("TF.UserDefinedField").EditUserDefinedFieldViewModel = EditUserDefinedFieldViewModel;
	function EditUserDefinedFieldViewModel(options)
	{
		var self = this;
		self.gridType = options.gridType;
		self.isEdit = options.dataEntity != null && !options.dataEntity.isCopy;
		self.isCopy = options.dataEntity != null && options.dataEntity.isCopy;
		self.dataEntity = options.dataEntity;
		self.isSystemDefined = options.isSystemDefined;
		self.isUDFGroup = options.isUDFGroup;
		self.UDGridFields = options.UDGridFields;
		self.checkDuplicatesCallback = options.checkDuplicatesCallback;
		self.public = options.public;

		self.TYPES = [
			{
				name: "Boolean",
				id: 1,
				getTypeData: function()
				{
					return new TF.UserDefinedField.BooleanUserDefinedFieldViewModel();
				}
			},
			{
				name: "Date",
				id: 2,
				getTypeData: function()
				{
					return new TF.UserDefinedField.DateUserDefinedFieldViewModel();
				}
			},
			{
				name: "Date/Time",
				id: 3,
				getTypeData: function()
				{
					return new TF.UserDefinedField.DateTimeUserDefinedFieldViewModel();
				}
			},
			// {
			// 	name: "List",
			// 	id: 10,// todo: change id to correct value when API done.
			// 	getTypeData: function()
			// 	{
			// 		return new TF.UserDefinedField.ListUserDefinedFieldViewModel({
			// 			dataEntity: self.dataEntity,
			// 			isUDFGroup: self.isUDFGroup
			// 		});
			// 	}
			// },
			{
				name: "Memo",
				id: 4,
				getTypeData: function()
				{
					return new TF.UserDefinedField.NotesUserDefinedFieldViewModel(self);
				}
			},
			{
				name: "Number",
				id: 5,
				getTypeData: function()
				{
					return new TF.UserDefinedField.NumberUserDefinedFieldViewModel(self);
				}
			},
			{
				name: "Phone Number",
				id: 6,
				getTypeData: function()
				{
					return new TF.UserDefinedField.PhoneNumberUserDefinedFieldViewModel();
				}
			},
			{
				name: "Text",
				id: 7,
				getTypeData: function()
				{
					return new TF.UserDefinedField.TextUserDefinedFieldViewModel(self);
				}
			},
			{
				name: "Time",
				id: 8,
				getTypeData: function()
				{
					return new TF.UserDefinedField.TimeUserDefinedFieldViewModel();
				}
			},
			{
				name: "Currency",
				id: 12,
				getTypeData: function()
				{
					return new TF.UserDefinedField.CurrencyUserDefinedFieldViewModel(self);
				}
			},
		];

		self.nameMaxlength = 30;
		if (self.isUDFGroup)
		{
			self.TYPES.push(
				{
					name: "Rating Scale",
					id: 11,
					getTypeData: function()
					{
						return new TF.UserDefinedField.RatingScaleUserDefinedFieldViewModel(self);
					}
				},
				{
					name: "Rating Scale Matrix",
					id: 21,
					getTypeData: function()
					{
						return new TF.UserDefinedField.RatingScaleMatrixUserDefinedFieldViewModel(self);
					}
				},
				{
					name: "System Field (Read Only)",
					id: 13,
					getTypeData: function()
					{
						return new TF.UserDefinedField.SystemFieldUserDefinedFieldViewModel({
							gridDefinition: self.gridDefinition,
							gridType: self.gridType,
							isEdit: self.isEdit,
						});
					}
				},
				{
					name: "Attachment",
					id: 14,
					getTypeData: function()
					{
						return new TF.UserDefinedField.DocumentUserDefinedFieldViewModel(self);
					}
				},
				{
					name: "Signature",
					id: 15,
					getTypeData: function()
					{
						return new TF.UserDefinedField.SignatureUserDefinedFieldViewModel(self);
					}
				},
				{
					name: "Map",
					id: 16,
					getTypeData: function()
					{
						return new TF.UserDefinedField.MapUserDefinedFieldViewModel(self);
					}
				}
			);

			self.TYPES.push({
				name: "List From Data",
				id: 17,
				getTypeData: function()
				{
					return new TF.UserDefinedField.ListFromDataUserDefinedFieldViewModel(self);
				}
			}, {
				name: "QR and Barcode",
				id: 18,
				getTypeData: function()
				{
					return new TF.UserDefinedField.QRandBarcodeUserDefinedFieldViewModel(self);
				}
			});

			self.nameMaxlength = 1024;
		}
		else
		{
			self.TYPES.push({
				name: "Email",
				id: 22,
				getTypeData: function()
				{
					return new TF.UserDefinedField.EmailUserDefinedFieldViewModel(self);
				}
			});

			// if (self.gridType !== "report")
			// {
			// 	self.TYPES.push({
			// 		name: "Roll-up",
			// 		id: 19,
			// 		getTypeData: function()
			// 		{
			// 			return new TF.UserDefinedField.RollupUserDefinedFieldViewModel(self);
			// 		}
			// 	});
			// 	self.TYPES.push({
			// 		name: "Case",
			// 		id: 20,
			// 		getTypeData: function()
			// 		{
			// 			return new TF.UserDefinedField.CaseUserDefinedFieldViewModel(self);
			// 		}
			// 	});
			// }
		}

		self.TYPES.sort((x, y) => (x.name < y.name) ? -1 : (x.name > y.name ? 1 : 0));

		self.obTypeSource = ko.observableArray(self.TYPES.map(function(item)
		{
			return item.name;
		}));
		self.obTypeModal = ko.observable(null);
		self.obSelectedType = ko.observable(null);
		self.obSelectedType.subscribe(self.onTypeSourceChanged.bind(self));
		self.obDefaultValueTemplate = ko.observable(null);
		self.obDefaultValue = ko.observable(null);
		self.obDefaultValueSource = ko.observable(null);
		self.obDefaultValueVisible = ko.observable(true);
		self.obName = ko.observable((self.isEdit || self.isCopy) ? self.dataEntity.DisplayName : null);
		self.rawName = self.obName();
		self.obPreAnnouncementBody = ko.observable();
		self.obDescription = ko.observable((self.isEdit || self.isCopy) ? self.dataEntity.Description : null);
		self.obExternalID = ko.observable(self.isEdit || self.isCopy ? self.dataEntity.ExternalID : null);
		self.obTypeEnabled = ko.observable(!self.isEdit);
		self.obTypeModalData = ko.observable(null);
		self.obNeedAdditionalValidator = ko.computed(function()
		{
			return ["Phone Number", "Date", "Date/Time"].indexOf(self.obSelectedType()) !== -1;
		});
		self.obRequired = ko.observable(self.isUDFGroup);
		self.obShowRequired = ko.observable(self.isUDFGroup);
		self.obRequiredEnable = ko.observable(true);
		self.obShowDuplicateMessage = ko.observable(false);
		self.kendoGridHelper = tf.helpers.kendoGridHelper;

		self.allDataources = tf.datasourceManager.datasources.map(function(x) { return { value: x.DBID, text: x.Name } });
		self.allDataources.sort(function(a, b)
		{
			return a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1;
		});
		self.selectedIds = Array.from((self.dataEntity || {}).UDFDataSources || []).map(function(i) { return i.DBID; });
		if (self.selectedIds.length === 0 && (!self.isEdit && !self.isCopy))
		{
			self.selectedIds.push(parseInt(localStorage.getItem("datasourceId")));
		}
		var selectedList = self.allDataources.filter(function(item) { return self.selectedIds.includes(item.value); });

		self.obSelectedDataSources = ko.observableArray(selectedList);
		self.rawDataSources = self.obSelectedDataSources();
		self.displayDsText = self.displayDsText.bind(self);
		self.onCloseListMover = new TF.Events.Event();
	};

	EditUserDefinedFieldViewModel.prototype.init = function(vm, el)
	{
		var self = this;
		self.$element = $(el);

		self._initializing = true;
		if (self.isEdit || self.isCopy)
		{
			var type = self.TYPES.filter(function(item)
			{
				return item.id === self.dataEntity.TypeId;
			})[0],
				typeName = type.name;
			self.obSelectedType(typeName);
		}
		else
		{
			if (self.TYPES.length > 0)
			{
				self.obSelectedType(self.TYPES[0].name);
			}
		}

		if (self.dataEntity && self.dataEntity.Required !== null)
		{
			self.obRequired(self.dataEntity.Required);
		}

		self.$element.parent().scroll(() =>
		{
			// hide kendo editor color picker when scroll the modal box
			self.messageBodyEditor && self.messageBodyEditor.toolbar.refreshTools();
		});

		self._initializing = false;
		self.initEditor();

		let $exnternalIdInput = self.$element.find(".external-id-input");
		TF.DetailView.UserDefinedFieldHelper.bindValidateOnExternalIDInput($exnternalIdInput);
	};

	EditUserDefinedFieldViewModel.prototype.initEditor = function()
	{
		if (!this.isUDFGroup)
		{
			return;
		}

		var self = this,
			$editorWrapper = $(".question-wrapper"),
			MessageBodyHtmlEditor = $("#QuestionBodyHtmlEditor");

		$editorWrapper.css("visibility", "visible");
		if (self.messageBodyEditor)
		{
			self.messageBodyEditor.destroy();
		}
		self.messageBodyEditor = $("#QuestionBodyEditor").kendoEditor({
			resizable: {
				toolbar: !TF.isPhoneDevice,
				content: false
			},
			tools: ["formatting", "cleanFormatting", "undo", "redo", "fontName", "fontSize", "foreColor", "backColor", "bold", "italic", "underline", "justifyLeft",
				"justifyCenter", "justifyRight", "insertUnorderedList", "insertOrderedList", "indent", "createLink", "unlink", "createTable",
				"addRowAbove", "addRowBelow", "addColumnLeft", "addColumnRight", "deleteRow", "deleteColumn"],
			change: function()
			{
				self.messageBodyEditorChanged = (self.messageBodyEditor.value() !== self.obPreAnnouncementBody());
			}
		}).data("kendoEditor");
		setTimeout(function()
		{
			$(self.messageBodyEditor.body).blur(function()
			{
				self.obName(self.messageBodyEditor.value());
				self.$element.find("input[name=name]").change();
			});

			$(self.messageBodyEditor.body).on("mouseup mouseout touchmove keyup focus blur", function()
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
			});

			tf.udgHelper.bindCounterBoxEvent($(self.messageBodyEditor.body),
				self.nameMaxlength,
				self.$element.find("small.name-text-counter"),
				false,
				target => $(`<div>${self.messageBodyEditor.value()}</div>`).text().replace(/\s+/g, '').length);

			tf.udgHelper.bindCounterBoxEvent(MessageBodyHtmlEditor,
				self.nameMaxlength,
				self.$element.find("small.name-text-counter"),
				false,
				target => $(`<div>${self.messageBodyEditor.value()}</div>`).text().replace(/\s+/g, '').length);

			if (self.isUDFGroup)
			{
				function moveCaretToEditorContentEnd(editor)
				{
					var range = editor.getRange();
					if (range.collapsed)
					{
						var textNode = editor.body.lastChild;
						if (textNode)
						{
							range.setStartAfter(textNode);
							range.collapse(true);
							editor.selectRange(range);
							if (textNode && textNode.scrollIntoView)
							{
								textNode.scrollIntoView(false);
							}
						}
					}
				}

				self.messageBodyEditor.focus();
				moveCaretToEditorContentEnd(self.messageBodyEditor);
			}
		}, 300);

		MessageBodyHtmlEditor.blur(function()
		{
			self.$element.find("input[name=name]").change();
		});

		$editorWrapper.find(".k-insertImage").closest(".k-tool").hide();
		var $head = $("#messageBody").closest("#edit-message-control").find("iframe").contents().find("head");
		$head.append($("<link/>",
			{ rel: "stylesheet", href: "Global/ThirdParty/bootstrap/css/bootstrap.min.css", type: "text/css" }
		));
		self.messageBodyEditor.value(self.obName());
		self.obPreAnnouncementBody(self.obName());
		self.messageBodyEditor.refresh();

		$(".editor-options-wrap .design").addClass("selected");
		$(".editor-options-wrap .html").removeClass("selected");
	};

	EditUserDefinedFieldViewModel.prototype.changePattern = function(viewModel, e)
	{
		var self = this,
			$MessageBodyHtmlEditor = $("#QuestionBodyHtmlEditor"),
			$optionBtn = $(e.target).closest(".option");

		if ($optionBtn.hasClass("selected"))
		{
			return;
		}

		var $container = $optionBtn.closest(".question-wrapper");
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

	EditUserDefinedFieldViewModel.prototype._updateValidation = function(type)
	{
		var self = this,
			checkUniqueTimeout = null,
			validatorFields = {};

		validatorFields.name = {
			container: self.$element.find("input[name='name']").closest("div"),
			validators:
			{
				notEmpty: {
					message: `${self.isUDFGroup ? 'Question' : 'Field'} is required`
				},
				noUnsafeHtmlTagsAndHtmlEscapes: {
					message: `Please remove special character(s) from ${self.isUDFGroup ? 'Question' : 'Field'} Name above`
				},
				callback:
				{
					message: " must be unique",
					callback: function(value, validator, $field)
					{
						self.obShowDuplicateMessage(false);
						value = self.trimName(value);
						if (value === "")
						{
							return true;
						}
						if (!self.isUDFGroup && self.dataEntity && self.dataEntity.ExistedNames)
						{
							if (self.dataEntity.ExistedNames.some(x => x.toLowerCase() === value.toLowerCase()))
							{
								return false;
							}
						}

						if (self.isUDFGroup)
						{
							// forbid use the names as fields' names since it will conflicted with report field
							const forbidToUseNames = ["created by", "created on", "last updated by", "last updated on",
								"form answer id", "x coord", "y coord", "created location map"];
							if (forbidToUseNames.find(f => f === value.toLowerCase()))
							{
								return false;
							}

							if (self.checkDuplicatesCallback && !self.checkDuplicatesCallback(value))
							{
								self.obShowDuplicateMessage(true);
								return false;
							}

							return true;
						}

						// Because AccountName or PurchaseOrder are in Field Trip Invoice, and these fields have a close relationship with Field Trip.
						// Suppress adding udf named AccountName or PurchaseOrder to field trip grid.
						if (self.gridType === "fieldtrip" && ["AccountName", "PurchaseOrder"].map(x => x.toLowerCase()).includes(value.trim().toLowerCase()))
						{
							return false;
						}

						// check entity name unique.
						var entity = tf.dataTypeHelper.getDataModelByGridType(self.gridType).toData(),
							entityKeys = Object.keys(entity), lowerValue = value.toLowerCase();
						if (entityKeys.some(function(key) { return key.toLowerCase() === lowerValue; }))
						{
							return false;
						}

						// check grid definition name unique.
						var gridDefinitionColumns = self.kendoGridHelper.getGridColumnsFromDefinitionByType(self.gridType);
						if (gridDefinitionColumns.some(function(column) { return column.FieldName.toLowerCase() === lowerValue; }))
						{
							return false;
						}

						// check duplicate name after the last input change, which is invoked at <CHECK_DELAY_TIMEOUT> ms after the last input
						return new Promise(resolve =>
						{
							const CHECK_DELAY_TIMEOUT = 1000;
							checkUniqueTimeout && clearTimeout(checkUniqueTimeout);
							checkUniqueTimeout = setTimeout(() =>
							{
								resolve(tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userdefinedfields"), {
									paramData: { dataTypeId: tf.dataTypeHelper.getId(self.gridType), "@fields": "Id,DisplayName" }
								}, { overlay: false }).then(function(result)
								{
									value = value.toLowerCase();
									result.Items = result.Items.filter(udf => tf.exagoBIHelper.removeUnsupportChars(udf.DisplayName, false).toLowerCase() == value);

									if (result.Items.length === 0)
									{
										return true;
									}

									if (self.dataEntity != null && result.Items.length === 1 && result.Items[0].Id === self.dataEntity.Id)
									{
										return true;
									}

									return false;
								}));
							}, CHECK_DELAY_TIMEOUT);
						});
					}
				}
			}
		};

		if (self.isUDFGroup)
		{
			validatorFields.name.validators.textCharacterLength = {
				message: `Only allow maximum ${self.nameMaxlength} characters`,
				max: self.nameMaxlength
			}

			validatorFields.name.validators.notAllBlankHtml = {
				message: `Name should not contain only blank characters`
			}

			validatorFields.name.validators.noUnsafeHtmlTagsAndHtmlEscapes = {
				message: `Please remove special character(s) from Question above`
			}
		}

		if (type === "List")
		{
			if (self.obTypeModalData() && self.obTypeModalData().obComponentLoaded && !self.obTypeModalData().obComponentLoaded())
			{
				setTimeout(() => self._updateValidation(type), 0)
				return;
			}

			validatorFields.udfListType = {
				trigger: "blur change",
				container: self.$element.find("div[name='udfListType']"),
				validators: {
					callback: {
						message: "List Item is required",
						callback: function(value, validator, $field)
						{
							return (self.obTypeModalData().pickListOptions.length > 0);
						}
					}
				}
			}
			if (self.obTypeModalData() && self.obTypeModalData().obOptions)
			{
				self.listSubscription = self.obTypeModalData().obOptions.subscribe(function()
				{
					var validator = self.$element.data("bootstrapValidator");
					validator.validate();
				});
			}
		}
		else if (type === "List From Data")
		{
			if (self.obTypeModalData() && self.obTypeModalData().obComponentLoaded && !self.obTypeModalData().obComponentLoaded())
			{
				setTimeout(() => self._updateValidation(type), 0)
				return;
			}

			if (self.obTypeModalData().extendValidatorFields)
			{
				self.obTypeModalData().extendValidatorFields(validatorFields, self.$element);
			}
		}
		else if (type === "Rating Scale" || type === "Map")
		{
			if (self.obTypeModalData() && self.obTypeModalData().obComponentLoaded && !self.obTypeModalData().obComponentLoaded())
			{
				setTimeout(() => self._updateValidation(type), 0)
				return;
			}

			if (self.obTypeModalData().extendValidatorFields)
			{
				self.obTypeModalData().extendValidatorFields(validatorFields, self.$element);
			}
		}
		else if (type === "Rating Scale Matrix")
		{
			if (self.obTypeModalData() && self.obTypeModalData().obComponentLoaded && !self.obTypeModalData().obComponentLoaded())
			{
				setTimeout(() => self._updateValidation(type), 0)
				return;
			}

			validatorFields.udfListType = {
				trigger: "blur change",
				container: self.$element.find("div[name='udfListType']"),
				validators: {
					callback: {
						message: "Rating Scale Matrix Question is required",
						callback: function(value, validator, $field)
						{
							return (self.obTypeModalData().pickListOptions.length > 0);
						}
					}
				}
			};

			if (self.obTypeModalData().extendValidatorFields)
			{
				self.obTypeModalData().extendValidatorFields(validatorFields, self.$element);
			}
		}

		if (self.$element.find(".default-value input").length > 0)
		{
			var additionalValidators = {};
			switch (type)
			{
				case "Number":
					additionalValidators.between = {
						inclusive: true,
						min: -9999999999.999999,
						max: 9999999999.999999,
						message: 'The default value should be between -9999999999 and 9999999999.'
					};
					break;
				case "Phone Number":
					additionalValidators.callback =
					{
						message: 'Invalid phone number.',
						callback: function(value)
						{
							return value === '' || tf.dataFormatHelper.isValidPhoneNumber(value);
						}
					};
					break;
				case "Date":
					additionalValidators.date = {
						format: 'MM/DD/YYYY',
						message: 'invalid date'
					};
					break;
				case "Date/Time":
					additionalValidators.date = {
						format: 'MM/DD/YYYY hh:mm A',
						message: 'invalid date'
					};
					break;
				case "Email":
					additionalValidators.emailAddress = {
						message: "Please enter a valid email address."
					};
					break;
				default:
					break;
			}

			validatorFields.defaultValue = {
				trigger: "blur change",
				container: self.$element.find(".default-value"),
				validators: $.extend({
					//general validators here
				}, additionalValidators)
			};
		}

		if (type === "Roll-up")
		{
			if (self.obTypeModalData() && self.obTypeModalData().obComponentLoaded && !self.obTypeModalData().obComponentLoaded())
			{
				setTimeout(() => self._updateValidation(type), 0)
				return;
			}

			if (self.obTypeModalData().extendValidatorFields)
			{
				self.obTypeModalData().extendValidatorFields(validatorFields, self.$element);
			}
		}

		if (type === "Text" || type === "Currency" || type === "Number")
		{
			if (self.obTypeModalData().extendValidatorFields)
			{
				self.obTypeModalData().extendValidatorFields(validatorFields, self.$element);
			}
		}

		self.$element.bootstrapValidator(
			{
				excluded: [':hidden', ':not(:visible)'],
				live: 'enabled',
				message: 'This value is not valid',
				fields: validatorFields
			});

		if (self.obTypeModalData().updateValidator)
		{
			var validator = self.$element.data("bootstrapValidator");
			self.obTypeModalData().updateValidator(validatorFields, validator);
		}
	};

	EditUserDefinedFieldViewModel.prototype.onTypeSourceChanged = function(type)
	{
		var self = this,
			selectedType = self.TYPES.filter(function(item) { return item.name === type; })[0],
			typeData = selectedType.getTypeData(),
			defaultValue = self.dataEntity ? typeData.getDefaultValue(self.dataEntity) : null,
			validator = this.$element.data("bootstrapValidator");

		self.obDefaultValueVisible(!this.isUDFGroup && selectedType.id !== 19);

		if (validator)
		{
			validator.destroy();
		}

		self.obTypeModal(null);
		self.obShowRequired(self.isUDFGroup);
		self.resetWhenTypeSourceChanged(typeData);

		self.obDefaultValue(defaultValue);
		self.obTypeModalData(typeData);
		self.obTypeModal(typeData.getTemplate());
		self.selectedTypeId = selectedType.id;

		var defaultValueTemplate = typeData.getDefaultValueTemplate();

		if (typeof typeData.showDefaultCase === "function")
		{
			self.showDefaultCase = function()
			{
				typeData.showDefaultCase({ Case: "", Value: self.obDefaultValue() });
			}
		}

		if (!!defaultValueTemplate)
		{
			defaultValueTemplate = $(defaultValueTemplate);
			self.$element.find(".default-value").empty().append(defaultValueTemplate);

			if (!self._initializing && defaultValueTemplate.length > 0)
			{
				ko.cleanNode(defaultValueTemplate[0]);
				ko.applyBindings(ko.observable(self), defaultValueTemplate[0]);
			}
		}

		/*
		 * When data type changed,  we may need loadd additional template html file from server, that will spend serveral time based internet network environment.
		 * After the template loaded completed, then load bootstrap validator rule. since some component cannot loaded in 200ms, we moniotr "obComponentLoaded" whether it set to "true",
		 * if true, means component load completed, go to next steop to load validation rule.
		 * For other component which didn't have "obComponentLoaded", we still use legency logic(settimeout)  to handle that
		 */
		if (typeData.obComponentLoaded)
		{
			typeData.obComponentLoaded.subscribe(newValue =>
			{
				newValue && self._updateValidation(type);
			});
		}
		else
		{
			setTimeout(function()
			{
				self._updateValidation(type);
			}, 200);
		}
	};

	EditUserDefinedFieldViewModel.prototype.resetWhenTypeSourceChanged = function(typeData)
	{
		const self = this;
		if (typeData.isRequiredFieldVisable)
		{
			self.obShowRequired(typeData.isRequiredFieldVisable());
		}
		if (typeData.isRequiredFieldEnabled)
		{
			self.obRequiredEnable(typeData.isRequiredFieldEnabled());
		} else
		{
			self.obRequiredEnable(true);
		}
		if (typeData.updateSpecialValue)
		{
			typeData.updateSpecialValue(self.dataEntity);
		}
		if (typeData.getDefaultValueSource)
		{
			self.obDefaultValueSource(typeData.getDefaultValueSource());
		}
		if (typeData.obIsEnable)
		{
			typeData.obIsEnable(!self.isSystemDefined)
		}
	}

	EditUserDefinedFieldViewModel.prototype.apply = function()
	{
		var self = this;
		var validator = this.$element.data("bootstrapValidator");
		if (!validator)
		{
			self._updateValidation(self.obSelectedType());
			validator = this.$element.data("bootstrapValidator");
		}

		if (validator)
		{
			return validator.validate().then(function(valid)
			{
				if (!valid) return false;

				return self.isEdit ? self.edit() : self.add();
			}.bind(self));
		}
		else
		{
			return Promise.resolve(false);
		}
	};

	EditUserDefinedFieldViewModel.prototype.cancel = function()
	{
		$("body").find(".symbols-panel.pin-icon-selector").hide();
		return Promise.resolve(false);
	};

	EditUserDefinedFieldViewModel.prototype.getDataTypeId = function()
	{
		var self = this;

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "dataTypes"))
			.then(function(result)
			{
				return result.Items.filter(function(item)
				{
					var fullName = tf.dataTypeHelper.getDisplayNameByDataType(self.gridType);
					if (!fullName)
					{
						return false;
					}
					return item.Type.toLowerCase() === fullName.toLowerCase();
				})[0].ID;
			});
	};

	EditUserDefinedFieldViewModel.prototype.saveDataSources = function(udfId)
	{
		var self = this,
			p = Promise.resolve(),
			originalSelectedIds = (self.dataEntity && self.dataEntity.isCopy) ? [] : Array.from((self.dataEntity || {}).UDFDataSources || []).map(function(i) { return i.DBID; });

		if (!_.isEqual(originalSelectedIds, self.selectedIds))
		{
			if (!self.selectedIds.length)
			{
				p = tf.promiseAjax.delete(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udfdatasources"), {
					paramData: {
						UDFID: udfId
					}
				});
			}
			else
			{
				p = tf.promiseAjax.post(pathCombine(tf.api.apiPrefixWithoutDatabase(), "udfdatasources"), {
					data: self.selectedIds.map(function(item)
					{
						return {
							UDFID: udfId, DBID: item
						};
					})
				});
			}
		}

		return p;
	};

	EditUserDefinedFieldViewModel.prototype.add = function()
	{
		var self = this;

		return self.getDataTypeId().then(function(dataTypeId)
		{
			var udfEntity = {
				DisplayName: self.trimName(self.obName()),
				Description: self.obDescription(),
				DataTypeId: dataTypeId,
				TypeId: self.selectedTypeId,
				Required: self.obRequired()
			}, typeData = self.obTypeModalData();

			if (typeData.saveSpecialValue)
			{
				typeData.saveSpecialValue(udfEntity);
			}

			if (self.isUDFGroup)
			{
				udfEntity.TypeName = self.obSelectedType();
				if (self.selectedTypeId === 13)
				{
					typeData.updateDefaultValue(udfEntity, self.obDefaultValue());
				}
				return udfEntity;
			}

			typeData.updateDefaultValue(udfEntity, self.obDefaultValue());
			udfEntity.ExternalID = self.obExternalID();

			if (udfEntity.DefaultDatetime)
			{
				let formatResult = moment(udfEntity.DefaultDatetime, 'MM/DD/YYYY hh:mm A').format("YYYY-MM-DDTHH:mm:ss");
				if (formatResult !== "Invalid date")
				{
					udfEntity.DefaultDatetime = formatResult;
				}
			}
			return TF.DetailView.UserDefinedFieldHelper.saveUserdefinedfield(udfEntity)
				.then(function(response)
				{
					var udfId = response && response.Items && response.Items[0] && response.Items[0].Id;
					return self.saveDataSources(udfId);
				}).then(function()
				{
					return true;
				});
		});
	};

	EditUserDefinedFieldViewModel.prototype.checkUDFUsed = function(dataTypeId)
	{
		const SystemFieldTypeId = 13;
		const UDGridDataTypeId = 32;
		var self = this;
		var rawName = this.rawName;
		var filterString = "";

		if (self.isUDFGroup)
		{
			if (!self.dataEntity || self.dataEntity.TypeId != SystemFieldTypeId)
			{
				// UDGrid question should not check Used in filter except system fields.
				return Promise.resolve(true);
			}

			rawName = self.dataEntity.Guid;
			dataTypeId = UDGridDataTypeId;
			filterString = String.format("&eq(udgridId,{0})", self.dataEntity.UDGridID);
		}

		return Promise.all([
			checkUdfInGridFilter(rawName),
			checkUdfInCaseUDF(rawName)
		]).then(values =>
		{
			var gridFilters = values[0],
				caseUDFs = values[1],
				messages = [];

			if (gridFilters.length > 0)
			{
				messages.push(`filters "${gridFilters.map(x => x.Name).join(",")}"`);
			}
			if (caseUDFs.length > 0)
			{
				messages.push(`case user defined fields "${caseUDFs.map(x => x.DisplayName).join(",")}"`);
			}

			var usedDBIDs = gridFilters.filter(x => x.DBID).map(x => x.DBID);
			caseUDFs.forEach(x => { usedDBIDs = usedDBIDs.concat(x.UDFDataSources.map(u => u.DBID)); });

			if (self.isUDFGroup)
			{
				let saveValueWithForm = this.obTypeModalData().obSaveValueWithForm();
				if (!saveValueWithForm && messages.length > 0)
				{
					return tf.promiseBootbox.alert(
						{
							message: `You cannot deselect the “Save Value with Form” because this question is being used in ${messages.join(" and ")}`,
							title: "Confirmation Message",
						}).then(function()
						{
							return false;
						});
				}
			}
			else
			{
				if (this.rawName != this.obName() && messages.length > 0)
				{
					return tf.promiseBootbox.alert(
						{
							message: `This User Defined Field can't change name because it is being used in ${messages.join(" and ")}`,
							title: "Confirmation Message",
						}).then(function()
						{
							return false;
						});
				}

				var newDatasources = this.obSelectedDataSources().map(x => x.value);
				var withoutDBIDs = usedDBIDs.filter(x => newDatasources.indexOf(x) < 0)

				if (withoutDBIDs.length > 0)
				{
					var withoutDBNames = self.allDataources.filter(x => withoutDBIDs.indexOf(x.value) >= 0).map(x => x.text);
					return tf.promiseBootbox.alert(
						{
							message: `This User Defined Field can't save without datasource${withoutDBNames.length == 1 ? "" : "s"} "${withoutDBNames.join(",")}" because it is being used in ${messages.join(" and ")}`,
							title: "Confirmation Message",
						}).then(function()
						{
							return false;
						});
				}
			}

			return true;
		});

		function checkUdfInGridFilter(udfName)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "gridfilters"), {
				paramData: {
					"@filter": String.format("eq(datatypeId,{0}){1}", dataTypeId, filterString),
				}
			}).then(function(r)
			{
				var checkName = `[${udfName}]`;
				return r.Items.filter(function(filter)
				{
					return (filter.WhereClause || "").indexOf(checkName) > -1;
				});
			});
		}

		function checkUdfInCaseUDF(udfName)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userdefinedfields"), {
				paramData: {
					"@filter": String.format("eq(datatypeId,{0})&eq(TypeId,20){1}", dataTypeId, filterString),
					"fields": "DefaultCase,CaseDetail",
					"@relationships": "UDFDataSources"
				}
			}).then(function(r)
			{
				var checkName = `[${udfName}]`;
				return r.Items.filter(function(udf)
				{
					return (udf.DefaultCase || "").indexOf(checkName) > -1 || (udf.CaseDetail || "").indexOf(checkName) > -1;
				});
			});
		}
	};

	EditUserDefinedFieldViewModel.prototype.edit = function()
	{
		var self = this,
			typeData = self.obTypeModalData();

		return self.getDataTypeId().then(function(dataTypeId)
		{
			return self.checkUDFUsed(dataTypeId).then((result) =>
			{
				if (!result) { return; }
				self.dataEntity.DisplayName = self.trimName(self.obName());
				self.dataEntity.Description = self.obDescription();
				self.dataEntity.Required = self.obRequired();
				self.dataEntity.DataTypeId = dataTypeId;

				if (typeData.saveSpecialValue)
				{
					typeData.saveSpecialValue(self.dataEntity);
				}

				if (self.isUDFGroup)
				{
					self.dataEntity.TypeName = self.obSelectedType();
					if (self.dataEntity.TypeId === 13)
					{
						typeData.updateDefaultValue(self.dataEntity, self.obDefaultValue());
					}
					return self.dataEntity;
				}

				typeData.updateDefaultValue(self.dataEntity, self.obDefaultValue());
				self.dataEntity.ExternalID = self.obExternalID();
				var dataEntryParam = JSON.parse(JSON.stringify(self.dataEntity));
				if (self.dataEntity.DefaultDatetime)
				{
					let formatResult = moment(self.dataEntity.DefaultDatetime, 'MM/DD/YYYY hh:mm A').format("YYYY-MM-DDTHH:mm:ss");
					if (formatResult !== "Invalid date")
					{
						dataEntryParam.DefaultDatetime = formatResult;
					}
				}
				return self.saveDataSources(self.dataEntity.Id).then(function()
				{
					return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userdefinedfields", self.dataEntity.Id), {
						paramData: { "@Relationships": "UDFPickListOptions" },
						data: dataEntryParam
					}).then(function()
					{
						return true;
					})
				});
			})
		});
	};

	EditUserDefinedFieldViewModel.prototype.trimName = (name) => name.trim().replace(/(?:^(?:&nbsp;[ ]?)+)|(?:(?:[ ]?&nbsp;)+$)/g, '').replace('&nbsp;', ' ').trim()

	EditUserDefinedFieldViewModel.prototype.displayDsText = function(item)
	{
		return item.text;
	};

	EditUserDefinedFieldViewModel.prototype.selectDatasource = function()
	{
		var self = this;
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
	};

	EditUserDefinedFieldViewModel.prototype.dispose = function()
	{
		if (this.messageBodyEditor)
		{
			this.messageBodyEditor.destroy();
			this.messageBodyEditor = null;
		}
		if (this.obTypeModalData() && this.obTypeModalData().dispose)
		{
			this.obTypeModalData().dispose();
		}
	};
})();
