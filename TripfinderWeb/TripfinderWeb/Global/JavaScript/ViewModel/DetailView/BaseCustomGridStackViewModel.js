(function()
{
	createNamespace("TF.DetailView").BaseCustomGridStackViewModel = BaseCustomGridStackViewModel;

	function BaseCustomGridStackViewModel(recordId)
	{
		var self = this;
		/* 
			For Add new button in grid or quick add in mini grid,
			we will skip validation for the first time.
			However, when user toggle section header during the add new process,
			we will not skip validation again.
		*/
		self.skipValidation = !recordId;
		self.recordEntity = null;
		self.defaultRecordEntity = null;
		self.recordId = 0;
		self.calendarEvents = null;
		self.uploadDocumentHelper = null;
		self.allCalendars = {};
		self.newEntityRelationships = {};
		self.isCreateGridNewRecord = false;

		self.eventNameSpace = ".detailview" + Math.random().toString(36).substring(7);
		self.UNITHEIGHT = 58;
		self.PADDING = 1;
		self.INITINPUTWIDTH = 359;
		self.EXTRAWIDTH = 253;
		self.defaultSliderFontRate = 0.5;
		self.defaultLayout = {
			width: 4,
			items: [],
			id: 0,
			name: ''
		};

		self.obIsReadOnly = ko.observable(false);
		self.obEditing = ko.observable(false);
		self.isReadMode = ko.observable(true);
		self.isGroupMode = ko.observable(false);

		self.onCreateGridNewRecord = new TF.Events.Event();
		self.onCreateNewRecordSuccess = new TF.Events.Event();
		self.onEditRecordSuccess = new TF.Events.Event();
		self.fieldContentChangedEvent = new TF.Events.Event();	// Event for subscribing modification in detailview fields
		self.attachFileChangedEvent = new TF.Events.Event();
		self.onFieldChange = new TF.Events.Event();
		self.userDefinedFieldHelper = new TF.DetailView.UserDefinedFieldHelper();

		self.kendoGridHelper = tf.helpers.kendoGridHelper;
		self.detailViewHelper = tf.helpers.detailViewHelper;

		self.attachFileChangedEvent.subscribe(self.fileUploaded.bind(this));

		self.obIsReadOnly.subscribe(function(value)
		{
			if (self.fieldEditorHelper)
			{
				value ?
					self.fieldEditorHelper.deactivate() :
					self.fieldEditorHelper.activate();
			}
		});
	};

	/**
	 * Initialize this stack grid.
	 *
	 * @param {object} options
	 */
	BaseCustomGridStackViewModel.prototype.init = function(options)
	{
		var self = this;
		self.$scrollBody = options.$scrollBody;

		if (options.$element && options.gridType && options.pageLevelViewModel)
		{
			self.$element = options.$element;
			self.gridType = options.gridType;
			self.pageLevelViewModel = options.pageLevelViewModel;
		}
		self.$preload = self.$element.find(".preload");

		self.entityDataModel = new TF.DataModel.DetailScreenLayoutDataModel();

		// See whehter it is needed to init document uploader.
		var requiredDocumentPermission = self.gridType === "document" ? "edit" : "add";
		if (tf.authManager.isAuthorizedForDataType("document", requiredDocumentPermission))
		{
			self.uploadDocumentHelper = new TF.DetailView.UploadDocumentHelper(self);
		}

		switch (self.gridType)
		{
			case "fieldtrip":
				self.fieldEditorHelper = new TF.DetailView.FieldEditor.FieldtripFieldEditorHelper(self);
				break;
			case "student":
				self.fieldEditorHelper = new TF.DetailView.FieldEditor.StudentFieldEditorHelper(self);
				break;
			case "school":
				self.fieldEditorHelper = new TF.DetailView.FieldEditor.SchoolFieldEditorHelper(self);
				break;
			case "trip":
				self.fieldEditorHelper = new TF.DetailView.FieldEditor.TripFieldEditorHelper(self);
				break;
			default:
				self.fieldEditorHelper = new TF.DetailView.FieldEditor.FieldEditorHelper(self);
				break;
		}

		self.rootGridStack = new TF.DetailView.LightGridStack(self.$element.find(".grid-stack:not(.grid-stack-nested)"), {
			gridstackOptions: {
				cellHeight: 58,
				verticalMargin: 1
			},
			isRoot: true,
			viewModel: self
		});
		self.grid = self.rootGridStack.grid;
		self.initEvents();

		TF.DetailView.Validators.CustomizeValidators.applyValidators(self.gridType);
	};

	/**
	 * Apply the layout template.
	 *
	 * @param {Object} layoutEntity
	 * @param {Object} recordEntity
	 */
	BaseCustomGridStackViewModel.prototype.applyLayoutTemplate = function(layoutEntity, recordEntity)
	{
		var self = this,
			type = self.gridType;
		if (recordEntity)
		{
			self.recordEntity = recordEntity;
			self.recordId = recordEntity.Id;
		}
		else
		{
			self.startCreateNewMode();
		}

		return self.userDefinedFieldHelper.get(type)
			.then(function(response)
			{
				if (!response) return;

				// update data point json
				dataPointsJSON[type]['User Defined'] = response.filter(function(i) { return !!i; });

				self._userDefinedFields = response;
				self.setStackBlocks({
					layout: layoutEntity.Layout
				});
			});
	};

	/**
	 * remove all data blocks and start over to add data blocks
	 */
	BaseCustomGridStackViewModel.prototype.setStackBlocks = function(options)
	{
		var self = this,
			layoutObj = self._getLayoutObjInCache(options);

		self.dataPointsJSONVersion = layoutObj.version;
		self.uploadDocumentHelper && self.uploadDocumentHelper.init();
		layoutObj.mapToolOptions = $.extend({}, options == null ? null : options.mapToolOptions, layoutObj.mapToolOptions);
		self.rootGridStack.addStackBlocks(layoutObj);

		if (self.obSliderFontRate)
		{
			let rate = layoutObj.sliderFontRate === undefined ? self.defaultSliderFontRate : layoutObj.sliderFontRate;
			self.obSliderFontRate(rate);
			self.adjustFontSize(rate);
			self.detailViewHelper.updateSectionHeaderTextInputWidth(null, self.$element);
		}
	};

	/**
	 * return the only one active instance of LightGridStack
	 */
	BaseCustomGridStackViewModel.prototype.getActiveGridStack = function()
	{
		var self = this;

		if (self.isRootGridStackActive())
		{
			return self.rootGridStack;
		}
		else
		{
			var tabBlock = self.rootGridStack.dataBlocks.find(function(block)
			{
				return block instanceof TF.DetailView.DataBlockComponent.TabStripBlock && block.$el && block.$el.hasClass("active");
			});
			if (tabBlock)
			{
				var index = tabBlock.getCurrentIndex();
				return tabBlock.nestedGridStacks[index];
			}
		}
	}

	BaseCustomGridStackViewModel.prototype.isRootGridStackActive = function()
	{
		var self = this;
		return self.$element.find(".tab-block-overlay-mask").length == 0;
	};

	/**
	 * Get detail screen layout object.
	 *
	 * @param {object} options
	 * @returns
	 */
	BaseCustomGridStackViewModel.prototype._getLayoutObjInCache = function(options)
	{
		var self = this,
			layout = options && options.layout || self.entityDataModel.layout(),
			layoutObj = layout ? JSON.parse(layout) : self.defaultLayout;

		return layoutObj;
	};

	/**
	 * adjust data block unit height when font size changed
	 */
	BaseCustomGridStackViewModel.prototype.adjustBlockUnitHeight = function(rate)
	{
		var self = this,
			$hLines = self.$element.find(".hori-line"),
			$vLines = self.$element.find(".verti-line"),
			y, height, $vLine, $hLine;

		if (rate == 0.75)
		{
			self.UNITHEIGHT = 63;
		}
		else if (rate == 1)
		{
			self.UNITHEIGHT = 68;
		}
		else
		{
			self.UNITHEIGHT = 58;
		}

		self.rootGridStack.setCellHeight(self.UNITHEIGHT);

		if ($hLines.length > 0)
		{
			$.each($hLines, function(_, hLine)
			{
				$hLine = $(hLine);
				y = parseInt($hLine.attr("y"));
				$hLine.css({
					top: (y * self.UNITHEIGHT + (y - 1) - 2) + "px"
				});
			});
		}
		if ($vLines.length > 0)
		{
			$.each($vLines, function(_, vLine)
			{
				$vLine = $(vLine);
				y = parseInt($vLine.attr("y"));
				height = parseInt($vLine.attr("height"));
				$vLine.css({
					top: (y * self.UNITHEIGHT + (y - 1)) + "px",
					height: (height * (self.UNITHEIGHT + 1)) + "px"
				});
			});
		}

		var kendoGrids = self.$element.find(".grid-stack > .grid-stack-item .kendo-grid");
		if (kendoGrids.length > 0)
		{
			$.each(kendoGrids, function(_, grid)
			{
				var kendoGrid = $(grid).data("kendoGrid");
				if (kendoGrid)
				{
					kendoGrid.refresh();
				}
			});
		}
	};

	/**
	 * adjust font size of data blocks
	 */
	BaseCustomGridStackViewModel.prototype.adjustFontSize = function(rate)
	{
		var self = this,
			fontSizeRate;

		self.$element.find(".grid-stack .grid-stack-item").find(".item-content").removeClass("low-linehight");
		self.$element.find(".grid-stack .section-header-stack-item .item-toggle, .grid-stack .grid-stack-item .calendar-item").removeClass(function(index, className)
		{
			if (!className) return;
			return className.split(" ").filter(function(name)
			{
				return name.indexOf("percent") > -1;
			}).join(" ").trim();
		});

		switch (rate)
		{
			case 0:
				fontSizeRate = 0.8;
				self.$element.find(".grid-stack .section-header-stack-item .item-toggle").addClass("percent80");
				self.$element.find(".grid-stack .grid-stack-item .calendar-item").addClass("percent80");
				break;
			case 0.25:
				fontSizeRate = 0.9;
				self.$element.find(".grid-stack .section-header-stack-item .item-toggle").addClass("percent90");
				self.$element.find(".grid-stack .grid-stack-item .calendar-item").addClass("percent90");
				break;
			case 0.5:
				fontSizeRate = 1;
				break;
			case 0.75:
				fontSizeRate = 1.25;
				self.$element.find(".grid-stack .section-header-stack-item .item-toggle").addClass("percent125");
				self.$element.find(".grid-stack .grid-stack-item .calendar-item").addClass("percent125");
				break;
			case 1:
				fontSizeRate = 1.5;
				self.$element.find(".grid-stack .section-header-stack-item .item-toggle").addClass("percent150");
				self.$element.find(".grid-stack .grid-stack-item .calendar-item").addClass("percent150");
				break;
			default:
				fontSizeRate = 1;
				break;
		}

		var stackItems = self.$element.find(".grid-stack .grid-stack-item");
		stackItems.find(".k-tabstrip-wrapper .k-tabstrip-items li.k-item").css("font-size", 13 * fontSizeRate + "px");
		stackItems.find(".item-title").css("font-size", 11 * fontSizeRate + "px");
		stackItems.find(".item-content").css("font-size", 15 * fontSizeRate + "px");
		self.$element.find(".grid-stack .section-header-stack-item .item-title").css("font-size", 17 * fontSizeRate + "px");
		self.$element.find(".grid-stack .section-header-stack-item .item-title-ruler").css("font-size", 17 * fontSizeRate + "px");

		self.$element.find(".grid-stack .grid-stack-item .boolean-stack-item .item-content").css("font-size", 17 * fontSizeRate + "px");
		if (fontSizeRate == 0.8)
		{
			stackItems.find(".item-content").addClass("low-linehight");
		}
	}

	BaseCustomGridStackViewModel.prototype.manageLayout = function()
	{
		if (this.rootGridStack)
		{
			this.rootGridStack.manageLayout();
		}

		if (this.fieldEditorHelper)
		{
			this.fieldEditorHelper.relayout();
		}

		this.resizeModalDialog();
	};

	BaseCustomGridStackViewModel.prototype.resizeModalDialog = function()
	{
		var dialog = $('.tfmodal').find('.modal-dialog');
		if (dialog.length > 0 &&
			dialog.attr("class").indexOf("modal-fullscreen") === -1)
		{
			// initialize of max-height css is in ModalManager.prototype.modalAdd
			// keep the size same in ModalManager.prototype.modalAdd
			window.setTimeout(function () {
				dialog.find('.modal-body').css("max-height", window.innerHeight - 28 - 41 - 46 - 5);
			}, 0);
		}
	}

	/**
	 * Save current entity.
	 *
	 * @returns
	 */
	BaseCustomGridStackViewModel.prototype.saveCurrentEntity = function()
	{
		var self = this;
		return self.isCreateGridNewRecord ? self.createEntity() : self.updateEntity();
	};

	/**
	 * Create an entity.
	 *
	 * @returns
	 */
	BaseCustomGridStackViewModel.prototype.createEntity = function()
	{
		var self = this,
			dataType = self.gridType,
			pendingAssociations = null;

		return self.detailViewHelper._getUniqueValues(dataType).then(function(uniqueObjects)
		{
			// save pending associations
			if (dataType !== TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.CONTACT &&
				dataType !== TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.DOCUMENT &&
				self.fieldEditorHelper.editFieldList.RecordContacts &&
				Array.isArray(self.fieldEditorHelper.editFieldList.RecordContacts.value) &&
				self.fieldEditorHelper.editFieldList.RecordContacts.value.length > 0)
			{
				pendingAssociations = self.fieldEditorHelper.editFieldList.RecordContacts.value;
			}

			var studentRequirements = [], fieldtripResourceGroups = [], fieldTripInvoices = [];
			$.each(self.newEntityRelationships || {}, function(k, v)
			{
				switch (k)
				{
					case TF.Helper.KendoGridHelper.studentRequirementItemsUrl:
					case TF.Helper.KendoGridHelper.studentAdditionalRequirementUrl:
						var items = (v || []).map(TF.DataModel.StudentRequirementItemModel.getEntity);
						for (var i = 0; i < items.length; i++)
						{
							items[i]["Type"] = k == TF.Helper.KendoGridHelper.studentRequirementItemsUrl ? 0 : 1
						}
						studentRequirements = studentRequirements.concat(items);
						break;
					case "fieldtripresource":
						fieldtripResourceGroups = v;
						break;
					case "fieldtripinvoice":
						fieldTripInvoices = v;
						break;
				}
			});

			if (studentRequirements.length > 0)
			{
				self.fieldEditorHelper.editFieldList.StudentRequirements = {
					value: studentRequirements,
					relationshipKey: "StudentRequirements(@relationships=StudentLocation)"
				};
			}

			if (fieldtripResourceGroups.length > 0)
			{
				self.fieldEditorHelper.editFieldList.FieldTripResourceGroups = {
					value: fieldtripResourceGroups,
					relationshipKey: "FieldTripResourceGroup"
				};
			}

			if (fieldTripInvoices.length > 0)
			{
				fieldtripResourceGroups.forEach(function(item)
				{
					if (item.InvoiceDate && typeof item.InvoiceDate === "object")
					{
						item.InvoiceDate = item.InvoiceDate.toLocaleString("en-US");
					}

					if (item.paymentDate && typeof item.paymentDate === "object")
					{
						item.paymentDate = item.paymentDate.toLocaleString("en-US");
					}
				});

				self.fieldEditorHelper.editFieldList.FieldTripInvoices = {
					value: fieldTripInvoices,
					relationshipKey: "FieldTripInvoice"
				};
			}

			return self.fieldEditorHelper.createEntity(uniqueObjects)
				.then(function(result)
				{
					if (result && result.success)
					{
						if (self.gridType == "trip")
						{
							tf.dataTypeHelper.saveTripCalendarRecords([result.entity]);
						}
						self.recordEntity = result.entity;
						self.recordId = result.entity.Id;
						self.onCreateNewRecordSuccess.notify({
							entity: result.entity,
							type: self.gridType
						});
						self.stopCreateNewMode();
						result.isCreateGridNewRecord = true;
						if (pendingAssociations)
						{
							pendingAssociations.map(function(item)
							{
								item["RecordID"] = self.recordId;
							});
							self.detailViewHelper.updateRelationships(self.gridType, self.recordId, "contact", pendingAssociations.map(function(item)
							{
								return item.ContactID;
							}));
						}
					}

					return result;
				});
		});
	};

	/**
	 * Update the entity.
	 *
	 * @returns
	 */
	BaseCustomGridStackViewModel.prototype.updateEntity = function()
	{
		var self = this,
			dataType = self.gridType;

		return self.detailViewHelper._getUniqueValues(dataType).then(function(uniqueObjects)
		{
			return self.fieldEditorHelper.saveEntity(uniqueObjects).then(function(result)
			{
				if (result && result.success)
				{
					self.onEditRecordSuccess.notify(result.entity);
					self.obEditing(false);
				}

				return result;
			});
		});
	};

	/**
	 * Start create new record mode.
	 *
	 */
	BaseCustomGridStackViewModel.prototype.startCreateNewMode = function()
	{
		var self = this;
		self.defaultRecordEntity = tf.dataTypeHelper.getDataModelByGridType(self.gridType).toData();
		self.isCreateGridNewRecord = true;
		self.onCreateGridNewRecord.notify();
	};

	BaseCustomGridStackViewModel.prototype.highlightRequiredFieldByAsterisk = function()
	{
		const self = this;

		// need to distinguish between regular field and inner field
		self.$element.find(".grid-stack-item, .editable-field-container")
			.each((_, item) =>
			{
				let $item = $(item);
				const isInnerField = $item.hasClass("editable-field-container");
				const titleSelector = isInnerField ? "div.editable-field-title" : "div.item-title";
				const contentSelector = isInnerField ? "div.editable-field-value" : "div.item-content";
				let config = $item.data();

				if (config && config.editType
					&& (typeof config.editType.allowEdit !== 'function' || config.editType.allowEdit())
					&& (!self.allowEdit || self.allowEdit(config.field))
					&& config.editType.validators
					&& config.editType.validators.notEmpty
					&& $item.find(`${titleSelector} > i`).length === 0)
				{
					let $title = $item.find(titleSelector);

					// special handle for boolean item
					if ($title.length === 0)
					{
						$title = $item.find('.boolean-stack-item');
					}

					if ($title.length > 0)
					{
						$title.append("<i class='asterisk'>*</i>");
					}

					if (!self.skipValidation)
					{
						let $content = $item.find(contentSelector);
						const text = $content.text();

						if (!text || text === 'None' || $content.hasClass('not-specified'))
						{
							const fieldSelector = `div[data-block-field-name="${config.field}"]`;
							let $field = isInnerField ? $item : $content.find(fieldSelector);
							$field.addClass('validateError');
						}
					}
				}
			});

		if (self.skipValidation)
		{
			self.skipValidation = false;
		}
	}

	/**
	 * Initialize editor for fields in edit list.
	 *
	 */
	BaseCustomGridStackViewModel.prototype.initEditorsInFieldList = function()
	{
		var self = this,
			udfKey = self.fieldEditorHelper.UDF_KEY,
			list = self.fieldEditorHelper.editFieldList,
			elementList = [],
			findElements = function(blockName)
			{
				var selector = String.format(".grid-stack-item-content[data-block-field-name='{0}']", blockName);
				return self.$element.find(selector);
			};

		for (var field in list)
		{
			var data = list[field];

			if (field === udfKey)
			{
				data.forEach(function(item)
				{
					var blockName = item.Name,
						$fields = findElements(blockName);

					$.each($fields, function(_, el)
					{
						var $item = $(el).closest(".grid-stack-item");

						if ($item.data().UDFId === item.Id)
						{
							elementList.push($item[0]);
						}
					});
				})
			}
			else
			{
				var blockName = data["blockName"] || field,
					$fields = findElements(blockName);

				$.each($fields, function(_, el)
				{
					var $item = $(el).closest(".grid-stack-item");

					if (!$item.data().UDFId)
					{
						elementList.push($item[0]);
					}
				});
			}
		}

		elementList.forEach(function(item)
		{
			var content = $(item).find(".grid-stack-item-content");
			self.fieldEditorHelper.initFieldEditor(item, content, "validate", false);
		});
	};

	/**
	 * Stop create new record mode.
	 *
	 */
	BaseCustomGridStackViewModel.prototype.stopCreateNewMode = function()
	{
		var self = this;
		self.isCreateGridNewRecord = false;
		self.obEditing(false);
	};

	BaseCustomGridStackViewModel.prototype.serializeLayout = function(options)
	{
		var self = this;
		return self.rootGridStack.serializeLayout(options);
	}

	/**
	 * Get the record entity by type and id.
	 * @param {String} gridType
	 * @param {Number} recordId
	 */
	BaseCustomGridStackViewModel.prototype.getRecordEntity = function(gridType, recordId)
	{
		var requestUrl,
			typeEndpoint = tf.dataTypeHelper.getEndpoint(gridType),
			idParamName = "id";

		switch (gridType)
		{
			case 'trip':
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&{0}={1}', idParamName, recordId);
				break;
			case 'document':
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&@excluded=FileContent&{0}={1}', idParamName, recordId);
				break;
			case 'contact':
				requestUrl = pathCombine(tf.api.apiPrefixWithoutDatabase(), typeEndpoint, recordId);
				requestUrl += '?@relationships=all';
				break;
			case 'fieldtrip':
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all,fieldtripresourcegroup(@relationships=all)&{0}={1}', idParamName, recordId);
				break;
			default:
				requestUrl = pathCombine(tf.api.apiPrefix(), typeEndpoint);
				requestUrl += String.format('?@relationships=all&{0}={1}', idParamName, recordId);
				break;
		}

		return tf.promiseAjax.get(requestUrl).then(function(response)
		{
			return response.Items[0];
		});
	};

	/**
	 * Get calendar data.
	 * @param {Number} Id the entity id
	 * @returns {Promise} the calendar data
	 */
	BaseCustomGridStackViewModel.prototype.loadCalendarData = function(Id)
	{
		var self = this;
		var callback = function(data)
		{
			var startDate, endDate, firstDate, attendanceDate, events = {},
				key, startTime, endTime, formatDate, today = moment();

			if (self.gridType === 'trip' && data.Items.length > 0)
			{
				endTime = data.Items[1].Info1;
				startTime = data.Items[1].Info1;
			}
			data.Items.forEach(function(item)
			{
				if (self.gridType === 'trip')
				{
					if (item.Sequence)
					{
						attendanceDate = moment(item.AttendanceDate);

						formatDate = moment(attendanceDate.format("M/D/YYYY"));

						key = formatDate.format("M/D/YYYY");
						if (!events[key])
						{
							events[key] = {
								date: formatDate.format("ddd M/D/YY"),
								events: [],
								isToday: today.isSame(key, "day")
							};
						}

						var itemInfo = moment(item.Info1, "HH:mm:ss a"),
							minTime = moment(startTime, "HH:mm:ss a"),
							maxTime = moment(endTime, "HH:mm:ss a");

						endTime = itemInfo > maxTime ? item.Info1 : endTime;
						startTime = itemInfo > minTime ? startTime : item.Info1;

						events[key].events[0] = {
							name: self.recordEntity.Name,
							startTime: startTime,
							endTime: endTime,
							isAllDay: endTime - startTime === 86400000 || endTime - startTime === 86399000
						};
					}
				}
				else
				{
					startDate = moment(item.Start);
					endDate = moment(item.End);
					firstDate = moment(startDate.format("M/D/YYYY"));
					for (var t = firstDate; t < endDate; t = t.add(1, "days"))
					{
						key = t.format("M/D/YYYY");
						if (!events[key])
						{
							events[key] = {
								date: t.format("ddd M/D/YY"),
								events: [],
								isToday: today.isSame(key, "day")
							};
						}
						startTime = t > startDate ? t : startDate;
						endTime = moment(key).add(1, "days") > endDate ? endDate : t;
						events[key].events.push({
							name: item.Summary,
							startTime: startTime.format("h:mmA"),
							endTime: endTime.format("h:mmA"),
							isAllDay: endTime - startTime === 86400000 || endTime - startTime === 86399000
						});
					}
				}
			});

			self.calendarEvents = events;
		}

		switch (self.gridType)
		{
			case "district":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "calendarevents"), {
					paramData: {
						districtCodes: Id
					}
				}).then(callback);
			case "school":
				var param = {
					"id": Id
				};
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint("school")), {
					paramData: param
				}).then(function(response)
				{
					return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "calendarevents"), {
						paramData: {
							schoolCodes: response.Items[0].SchoolCode
						}
					}).then(callback);
				});
			case "trip":
				return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "attendances"), {
					paramData: {
						'DBID': tf.datasourceManager.databaseId,
						'tripId': self.recordEntity.Id
					}
				}).then(callback);
			default:
				return Promise.resolve();
		}
	};

	/**
	 * Update contact associations.
	 *
	 * @param {Array} associations
	 */
	BaseCustomGridStackViewModel.prototype.updateContactAssociationRecordEntity = function(associations)
	{
		var self = this;
		self.fieldEditorHelper.editFieldList['RecordContacts'] = {
			relationshipKey: 'contactAssociation',
			value: associations.map(function(item)
			{
				return {
					DataTypeId: tf.dataTypeHelper.getIdByName(item.Type),
					DBID: tf.datasourceManager.databaseId,
					RecordID: item.Id,
					ContactID: self.recordId || 0,
					ContactTypeID: TF.DetailView.DataBlockComponent.GridBlock.CONTACT_TYPE.General // TODO: assign correct ContactTypeID.
				};
			})
		};

		if (!!self.recordEntity)
		{
			self.updateEntity();
		}
	};

	/**
	 * Update document associations.
	 *
	 * @param {Array} associations
	 */
	BaseCustomGridStackViewModel.prototype.updateDocumentAssociationRecordEntity = function(associations)
	{
		var self = this;
		self.fieldEditorHelper.editFieldList['DocumentRelationships'] = {
			relationshipKey: 'DocumentRelationship',
			value: associations.map(function(item)
			{
				return {
					DocumentRelationshipID: 0,
					DBID: tf.datasourceManager.databaseId,
					DocumentID: self.recordId || 0,
					AttachedToID: item.Id,
					AttachedToType: tf.dataTypeHelper.getIdByName(item.Type)
				};
			})
		};

		if (!!self.recordEntity)
		{
			self.updateEntity();
		}
	};

	//#endregion


	//#region Detail View Grid Related
	/**
	 * Update grid columns.
	 *
	 * @param {Object} editColumnViewModel
	 * @param {JQuery} gridBlock
	 * @returns
	 */
	BaseCustomGridStackViewModel.prototype.changeGridColumns = function(editColumnViewModel, gridBlock)
	{
		var self = this,
			kendoGrid, $grid = gridBlock.find(".kendo-grid");
		if ($grid.length > 0)
		{
			gridBlock.data("columns", editColumnViewModel.selectedColumns);
			kendoGrid = $grid.data("kendoGrid");
			if (kendoGrid)
			{
				kendoGrid.setOptions({
					"columns": self.kendoGridHelper.getKendoColumnsExtend(editColumnViewModel.selectedColumns)
				});
				self.kendoGridHelper.updateGridFooter($grid, 0, 0);
			}
		}
	}
	//#endregion

	/**
	 * Initialize essential events.
	 *
	 */
	BaseCustomGridStackViewModel.prototype.initEvents = function()
	{
		var self = this;

		$(window).on("resize.managelayout", function()
		{
			self.manageLayout();
		});
	};

	/**
	 * Determine current page is active or not.
	 */
	BaseCustomGridStackViewModel.prototype.isActive = function()
	{
		var self = this;
		return self.$element && self.$element.is(":visible");
	};

	/**
	 * Handle the file uploaded events
	 * @param e
	 * @param data
	 */
	BaseCustomGridStackViewModel.prototype.fileUploaded = function(e, data)
	{
		var self = this;

		if (!data.isEmpty)
		{
			self.updateDetailView(data.file);
			self.obEditing(true);
		}

	}
	BaseCustomGridStackViewModel.prototype._shouldUpdateNameWithFileName = function()
	{
		var self = this, editedFileName = self.fieldEditorHelper.editFieldList["Name"];
		if (self.isCreateGridNewRecord)
		{
			return editedFileName == null || editedFileName.value == null || editedFileName.value.length === 0;
		}

		return editedFileName != null && editedFileName.value == null;
	};
	/**
	 * Update detailview 
	 * @param file
	 */
	BaseCustomGridStackViewModel.prototype.updateDetailView = function(file)
	{
		var self = this,
			$fileNameBlock = self.$element.find('.grid-stack-item-content[data-block-field-name="FileName"]'),
			$fileSizeBlock = self.$element.find('.grid-stack-item-content[data-block-field-name="FileSizeKB"]'),
			$fileTypeBlock = self.$element.find('.grid-stack-item-content[data-block-field-name="FileType"]'), // record entity's field name is "MimeType", but datablock's name is "FileType"
			$nameBlock = self.$element.find('.grid-stack-item-content[data-block-field-name="Name"]'),
			fileName, fileSize, fileType, name;

		if (file)
		{
			fileName = file.name;
			fileSize = file.size != null ? (file.size / 1024).toFixed(2) : null;
			fileType = file.type;
			if (self._shouldUpdateNameWithFileName())
			{
				name = fileName.split(".")[0];
			}
		}

		self.fieldEditorHelper.editFieldList['FileName'] = { 'value': fileName };
		self.fieldEditorHelper.editFieldList['FileSizeKB'] = { 'value': fileSize };
		self.fieldEditorHelper.editFieldList['MimeType'] = { 'value': fileType };

		if ($fileNameBlock.length > 0)
		{
			$fileNameBlock.find('.item-content').text(fileName || 'None');
		}

		if ($fileSizeBlock.length > 0)
		{
			$fileSizeBlock.find('.item-content').text(fileSize || 'None');
		}

		if ($fileTypeBlock.length > 0)
		{
			$fileTypeBlock.find('.item-content').text(fileType || 'None');
		}

		if (name && $nameBlock.length > 0)
		{
			$nameBlock.find('.item-content').text(name);
			self.fieldEditorHelper.editFieldList["Name"] = {
				value: name
			};
			$nameBlock.parent().find('small').remove();
		}
	};

	BaseCustomGridStackViewModel.prototype.refreshEditStatus = function()
	{
		if (this.fieldEditorHelper)
		{
			this.fieldEditorHelper.refresh();
		}
	};

	BaseCustomGridStackViewModel.prototype.closeFieldEditor = function()
	{
		if (this.fieldEditorHelper)
		{
			this.fieldEditorHelper.closeEditor();
		}
	};

	BaseCustomGridStackViewModel.prototype.resetFieldEditorTabStatus = function()
	{
		if (this.fieldEditorHelper)
		{
			this.fieldEditorHelper.relayout();
			this.fieldEditorHelper.markTabIndex();
		}
	};

	BaseCustomGridStackViewModel.prototype.getUploaderFiles = function()
	{
		var files = [];
		if (this.uploadDocumentHelper)
		{
			files = this.uploadDocumentHelper.getFiles()
		}

		return files;
	};

	BaseCustomGridStackViewModel.prototype.resetUploaderStatus = function()
	{
		if (this.uploadDocumentHelper)
		{
			this.uploadDocumentHelper.clearAllFiles();
		}
	};

	BaseCustomGridStackViewModel.prototype.dispose = function()
	{
		var self = this;

		$(window).off("resize.managelayout");
		$(document).off("click.sectionheader");
		$(document).off("click.detailView");

		self.userDefinedFieldHelper.dispose();

		if (self.uploadDocumentHelper)
		{
			self.uploadDocumentHelper.dispose();
		}

		self.onCreateGridNewRecord.unsubscribeAll();
		self.onCreateNewRecordSuccess.unsubscribeAll();
		self.onEditRecordSuccess.unsubscribeAll();
		self.fieldContentChangedEvent.unsubscribeAll();
		self.onFieldChange.unsubscribeAll();

		if (self.fieldEditorHelper)
		{
			self.fieldEditorHelper.dispose();
		}

		for (var i in self.allCalendars)
		{
			var calendar = self.allCalendars[i].data("kendoCalendar");
			if (calendar)
			{
				calendar.destroy();
			}
		}

		if (self.rootGridStack)
		{
			self.rootGridStack.dispose();
		}
	};

	BaseCustomGridStackViewModel.MapManagers = {}

})();