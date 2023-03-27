(function()
{
	createNamespace("TF.DetailView").LightGridStack = LightGridStack;

	var NULL_AVATAR = 'None';

	var defaultGridStackOptions = {
		acceptWidgets: '.data-point-item',
		minWidth: 0,
		alwaysShowResizeHandle: true,
		resizable: {
			autoHide: true,
			handles: 'n, ne, e, se, s, sw, w, nw'
		},
		removable: '.data-points-panel',
		removeTimeout: 100,
		animate: true
	};

	function LightGridStack(el, options)
	{
		var self = this;
		self.detailViewHelper = tf.helpers.detailViewHelper;
		self.$wrapper = $(el);
		self.dataBlocks = [];
		self.gridStackItemOriginalHeight = [];
		self.heightenedGroups = [];
		self.collapsedSectionHeaderList = [];
		self.isRoot = !!options.isRoot;
		self.toggleSectionHeaderEvent = new TF.Events.Event();
		self.deleteDataBlockEvent = new TF.Events.Event();
		self.toggleResizableEvent = new TF.Events.Event();
		self.changeDataPointEvent = new TF.Events.Event();
		self.detailView = interceptObj(options.viewModel);
		self.lineBlockHelper = new TF.DetailView.LineBlockHelper(self);
		self.eventNameSpace = ".lightgridstack" + Math.random().toString(36).substring(7);
		self.init(el, options.gridstackOptions);
		self.initEvents();
		self.currentBlockUniqueClassName = '';
	}

	/**
	 * ensure data blocks access properties in detailview instance only.
	 */
	function interceptObj(detailView)
	{
		if (!this.isRoot)
		{
			return detailView;
		}

		var keys = Object.keys(detailView),
			lightDetailView = {};

		keys.forEach(function(key)
		{
			Object.defineProperty(lightDetailView, key, {
				get: function()
				{
					return detailView[key];
				},
				set: function(v)
				{
					detailView[key] = v;
				}
			})
		});

		return lightDetailView;
	}

	LightGridStack.prototype.init = function(el, gridstackOptions)
	{
		if ($(el).data('gridstack'))
		{
			$(el).data('gridstack').destroy();
		}

		$(el).gridstack($.extend({}, defaultGridStackOptions, gridstackOptions));
		this.grid = $(el).data("gridstack");
	};

	LightGridStack.prototype.initEvents = function()
	{
		var self = this;

		function updateBlocks(data)
		{
			let highlightBlocks = self.detailView.dataPointPanel.highlightBlocks();
			highlightBlocks.forEach(block =>
			{
				data.items.forEach(item =>
				{
					if (item.ownedBy)
					{
						if (item.type === 'tab')
						{
							item.dataSource.forEach(data =>
							{
								data.items.forEach(el =>
								{
									if (el.uniqueClassName === block.uniqueClassName || (el.field === 'Map' && el.uniqueClassName.includes(block.uniqueClassName)))
									{
										block.ownedBy = item.ownedBy;
									}
								})
							})
						} else if (item.uniqueClassName === block.uniqueClassName || (item.field === 'Map' && item.uniqueClassName.includes(block.uniqueClassName)))
						{
							block.ownedBy = item.ownedBy;
						}
					}
				})
			});
			self.detailView.dataPointPanel.highlightBlocks(highlightBlocks);
		}
		self.toggleSectionHeaderEvent.subscribe(function(e, v)
		{
			self.removeBlockField = [];
			let data = self.serializeLayout(v);
			updateBlocks(data);
			self.addStackBlocks(data);

			self.detailView.highlightRequiredFieldByAsterisk();

			self.detailView.initEditorsInFieldList();

			if (self.detailView.obSliderFontRate)
			{
				//quick does not have obSliderFontRate
				let rate = self.detailView.obSliderFontRate();
				self.detailView.adjustFontSize(rate);
			}

			self.detailViewHelper.updateSectionHeaderTextInputWidth(null, self.detailView.$element);
		});

		self.deleteDataBlockEvent.subscribe(self.onDataBlockDeleted.bind(self));
		self.changeDataPointEvent.subscribe(self.onDataBlockUpdated.bind(self));
		self.toggleResizableEvent.subscribe(function(e, isResizable)
		{
			self.grid.resizable(".grid-stack-item", isResizable);
		});

		self.$wrapper.on("dragstart" + self.eventNameSpace, self.onDataBlockDragStart.bind(self));
		self.$wrapper.on("dragstop" + self.eventNameSpace, self.onDataBlockDragStop.bind(self));
		self.$wrapper.on('added' + self.eventNameSpace, self.onNewElementAdded.bind(self));
		self.$wrapper.on("resizestart" + self.eventNameSpace, self.onDataBlockResizeStart.bind(self));
		self.$wrapper.on("resizestop" + self.eventNameSpace, self.onDataBlockResizeStop.bind(self));
		self.$wrapper.on("removed", function(e)
		{
			var $removingBlock = $(".data-point.dragging-helper.removing .dragging-helper-wrapper").find(">.grid-stack-item");
			if ($removingBlock.length == 0)
			{
				return;
			}

			var className = self.detailViewHelper.getDomUniqueClassName($removingBlock);
			self.dataBlocks = self.dataBlocks.filter(function(block)
			{
				return block.uniqueClassName !== className;
			});

			self.triggerTabContentChange();
		});
	};

	LightGridStack.prototype.addStackBlocks = function(layout)
	{
		var self = this;

		self.dataBlocks.forEach(function(block)
		{
			if (block.dispose)
			{
				block.dispose();
			}
		});

		self.startUpdateAfterAddBlock = true;

		if (self.grid && self.grid.grid && self.grid.grid.nodes)
		{
			self.grid.removeAll();
		}
		self.$wrapper.empty();
		self.dataBlocks.length = 0;

		var items = Array.isArray(layout.items) && layout.items.filter(function(item)
		{
			return !(item.isHidden && !item.ownedBy);
		});

		self.setGridWidth(layout.width);

		self.gridStackItemOriginalHeight = [];
		self.heightenedGroups = [];
		self.collapsedSectionHeaderList = [];

		if (items && items.length > 0)
		{
			var isLine = function(item)
			{
				return item.type && (item.type === 'horizontalLine' || item.type === 'verticalLine');
			};

			items.sort(function(a, b)
			{
				var aWeight = parseInt(a.x) + parseInt(a.y) * layout.width + (isLine(a) ? 0 : 0.1),
					bWeight = parseInt(b.x) + parseInt(b.y) * layout.width + (isLine(b) ? 0 : 0.1);
				return aWeight - bWeight;
			});

			var dataType = self.detailView.gridType,
				requiredFields = self.detailViewHelper.requiredFields[dataType].map(item => item.name);

			self.$wrapper.removeClass("full");
			$.each(items, function(_, item)
			{
				if (item.isCollapsed)
				{
					self.collapsedSectionHeaderList.push({
						headerClassName: item.uniqueClassName,
						items: []
					});
				}

				if (item.isHidden)
				{
					self._hiddenCollapsedSectionHeader(item);
					return;
				}

				// get related data from data point json
				item = self.detailViewHelper.decompressDataBlockDescriptor(item, dataType);

				// For inner fields
				if (Array.isArray(item.innerFields))
				{
					item.innerFields = item.innerFields.map(field =>
					{
						var defaultField = self.detailViewHelper.decompressDataBlockDescriptor(field, dataType);
						self.appendValidatorForRequiredField(requiredFields, defaultField);
						return $.extend(defaultField, field);
					});
				}

				item.appearance = item.appearance || {};

				item = $.extend(self.getMapToolOptions(), item);

				if (self.detailView.isReadMode())
				{
					item.minHeight = item.h;
				}

				// add validator for required fields
				self.appendValidatorForRequiredField(requiredFields, item);

				self._addDataBlocks(item);
			});
		}

		var uploadFiles = self.detailView.getUploaderFiles;
		if (uploadFiles.length > 0)
		{
			self.detailView.attachFileChangedEvent.notify({ empty: false, file: uploadFiles[0].rawFile })
		}

		self.startUpdateAfterAddBlock = false;

		if (self.detailView.isReadMode())
		{
			self.setStatic(true);
			self.dataBlocks.filter(function(d)
			{
				return d.type === "tab";
			}).forEach(function(tab)
			{
				tab.tabStrip.nestedGridStacks.forEach(function(nestedGridStack)
				{
					nestedGridStack.setStatic(true);
				});
			});

			if (self.uploadDocumentHelper)
			{
				self.uploadDocumentHelper.init();
			}
		}
		else
		{
			self.setStatic(false);
			self.updateDataBlocks();
			self.dataBlocks.filter(function(d)
			{
				return d.type === "tab";
			}).forEach(function(tab)
			{
				tab.tabStrip.nestedGridStacks.forEach(function(nestedGridStack)
				{
					nestedGridStack.setStatic(false);
					nestedGridStack.updateDataBlocks();
				});
			});
		}

		self.lineBlockHelper.addLineContainers();

		self.$wrapper.find('img').on('dragstart', function(e)
		{
			e.preventDefault();
		});
		//ensure tab 'key' works 

		self.detailView.resetFieldEditorTabStatus();

		self.lineBlockHelper.fixCollisions();

		if (self.isRoot)
		{
			self.manageLayout();
		}
		self.detailViewHelper.updateSectionHeaderTextInputWidth(undefined, self.$wrapper);
	};

	LightGridStack.prototype.addBlock = function(block)
	{
		if (!block.$el)
		{
			throw "property \"$el\" is required.";
		}

		if (!block.options)
		{
			throw "property \"options\" is required.";
		}

		block.options = $.extend(this.getMapToolOptions(), block.options);

		if (!block.uniqueClassName)
		{
			throw "property \"uniqueClassName\" is required.";
		}

		if (!tf.helpers.detailViewHelper.getDomUniqueClassName(block.$el))
		{
			throw "uniqueClassName does not add to $el";
		}

		var self = this,
			options = block.options;

		self.grid.addWidget(block.$el,
			options.x, options.y, options.w, options.h,
			options.autoPosition, options.minWidth, options.maxWidth, options.minHeight, options.maxHeight);

		self.gridStackItemOriginalHeight.push({
			className: block.uniqueClassName,
			height: options.h
		});
		options.uniqueClassName = block.uniqueClassName;
		self.currentBlockUniqueClassName = block.uniqueClassName;
		self.detailViewHelper.setStackBlockData(block.$el, options);
		self.dataBlocks.push(block);

		if (block.afterDomAttached)
		{
			block.afterDomAttached();
		}

		if (block.initEvents)
		{
			block.initEvents();
		}
	};

	/**
	 * @return {Array} UDF Id Array
	 */
	LightGridStack.prototype.getAssociatedUDFs = function()
	{
		var self = this;
		return _.uniq(self.dataBlocks.reduce(function(acc, block)
		{
			if (block instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
			{
				block.nestedGridStacks.forEach(function(nestedGridStack)
				{
					acc = acc.concat(nestedGridStack.getAssociatedUDFs());
				});
			}
			else if (block instanceof TF.DetailView.DataBlockComponent.GridBlock)
			{
				acc = acc.concat(block.$el.data("columns").map(function(c)
				{
					return c.UDFId;
				}).filter(function(udfId)
				{
					return !!udfId;
				}));
			}
			else if (block.options && block.options.UDFId)
			{
				acc = acc.concat(block.options.UDFId);
			}

			return acc;
		}, []));
	};

	/**
	 * Detect the barriers when decreasing detail view column count.
	 */
	LightGridStack.prototype.getBarriersByTargetWidth = function(targetWidth)
	{
		var self = this,
			barriers = [],
			needExpandSectionHeaders = [];

		(self.collapsedSectionHeaderList || []).forEach(function(collapsedSectionHeader)
		{
			collapsedSectionHeader.items.forEach(function(item)
			{
				if ((item.x + item.w) > targetWidth)
				{
					needExpandSectionHeaders.push(collapsedSectionHeader.headerClassName);
				}
			});
		});

		if (needExpandSectionHeaders.length > 0)
		{
			var currentLayout = self.serializeLayout(),
				targetLayout = {
					width: currentLayout.width,
					items: []
				};

			targetLayout.items = currentLayout.items.map(function(item)
			{
				if (item.ownedBy && needExpandSectionHeaders.includes(item.ownedBy))
				{
					item.isHidden = false;
				}

				if (needExpandSectionHeaders.includes(item.uniqueClassName))
				{
					item.isCollapsed = false;
				}

				return item;
			});

			self.addStackBlocks(targetLayout);
		}

		self.lineBlockHelper.serializeLines(self.$wrapper.find(">.verti-line, >.hori-line")).forEach(function(line)
		{
			if ((line.x + line.w) > targetWidth)
			{
				if (line.w > 0)
				{
					barriers.push(self.$wrapper.find(String.format(".hori-line[x={0}][y={1}][width={2}]", line.x, line.y, line.w)));
				}
				else
				{
					barriers.push(self.$wrapper.find(String.format(".verti-line[x={0}][y={1}][height={2}]", line.x, line.y, line.h)));
				}
			}
		});

		self.dataBlocks.forEach(function(block)
		{
			if (block instanceof TF.DetailView.DataBlockComponent.SectionHeaderBlock)
			{
				return;
			}

			if (Number(block.$el.attr("data-gs-x")) + Number(block.$el.attr("data-gs-width")) > targetWidth)
			{
				barriers.push(block.$el);
			}
		});

		return barriers;
	};

	LightGridStack.prototype.resetBarrierStatus = function()
	{
		var self = this;

		self.$wrapper.find(">.decrease-column-count-barrier").removeClass("decrease-column-count-barrier");
	};

	LightGridStack.prototype.getOccupiedWidth = function()
	{
		var self = this,
			lines = self.lineBlockHelper.serializeLines(self.$wrapper.find(">.verti-line, >.hori-line")),
			lineMaxWidth = Math.max.apply(null, lines.map(function(line)
			{
				return line.w + line.x;
			}));

		if (!Number.isInteger(lineMaxWidth))
		{
			lineMaxWidth = 0;
		}

		return self.dataBlocks.reduce(function(result, block)
		{
			if (block instanceof TF.DetailView.DataBlockComponent.SectionHeaderBlock)
			{
				return result;
			}

			return Math.max(Number(block.$el.attr("data-gs-x")) + Number(block.$el.attr("data-gs-width")), result);
		}, lineMaxWidth);
	};

	LightGridStack.prototype.getOccupiedHeight = function()
	{
		var self = this,
			lines = self.lineBlockHelper.serializeLines(self.$wrapper.find(">.verti-line, >.hori-line")),
			lineMaxHeight = Math.max.apply(null, lines.map(function(line)
			{
				return line.h + line.y;
			}));

		if (!Number.isInteger(lineMaxHeight))
		{
			lineMaxHeight = 0;
		}

		return self.dataBlocks.reduce(function(result, block)
		{
			return Math.max(Number(block.$el.attr("data-gs-y")) + Number(block.$el.attr("data-gs-height")), result);
		}, lineMaxHeight);
	};
	LightGridStack.prototype.getBadgeValue = function(item)
	{
		var self = this, rsGroups = self.detailView.recordEntity && self.detailView.recordEntity.FieldTripResourceGroups;
		if (!item.badgeFiled || !rsGroups)
		{
			return "(none)";
		}
		else
		{
			var count = 0;
			//Remove Duplicated V/D/A
			_.each(_.uniqBy(rsGroups, item.badgeFiled), function(rs)
			{
				if (rs[item.badgeFiled])
					count++
			})
			return "(" + count + ")"
		}
	}

	/**
	* Get data point content. For UDF, get content from RecordValue.
	* @param  {Object} item layout item
	* @returns {String/Object} layout item content / Object for Record Picture
	*/
	LightGridStack.prototype.getRawDataBlockValue = function(item)
	{
		var self = this,
			content = null,
			editFieldList = self.detailView.fieldEditorHelper && self.detailView.fieldEditorHelper.editFieldList || {};

		if (!self.detailView.isReadMode()) { return item.defaultValue; };

		if (item.UDGridFieldId != null)
		{
			let value = self.detailView.isCreateGridNewRecord ? self.detailView.defaultRecordEntity[item.Guid] : self.detailView.recordEntity[item.Guid];
			if (item.FieldOptions.TypeName == "List")
			{
				if (!item.FieldOptions.PickListMultiSelect)
				{
					return value;
				}

				return value.join(", ");
			}

			return value;
		}

		if (!item.UDFId)
		{
			if (Object.keys(editFieldList).includes(item.field))
			{
				return editFieldList[item.field].value;
			}

			if (self.detailView.newCopyContext &&
				self.detailView.newCopyContext.autoAssignedFields.map(f => typeof f === "string" ? f : f.field).some(f => f === item.field))
			{
				return self.detailView.newCopyContext.baseEntity[item.field]
			}

			content = self.detailView.isCreateGridNewRecord ?
				self.detailView.defaultRecordEntity[item.entityFieldName || item.field] : (self.detailView.recordEntity && self.detailView.recordEntity[item.entityFieldName || item.field]);
			const matchedUnitOfMeasureSupportedField = self.detailViewHelper.getUnitOfMeasureSupportedFields(self.detailView.gridType).find(x => x.field === item.field);
			if (matchedUnitOfMeasureSupportedField)
			{
				if (item.field === 'DrivingDirections')
				{
					return tf.measurementUnitConverter.unifyDirectionMeasurementUnit(content, tf.measurementUnitConverter.isImperial());
				}
				if (tf.measurementUnitConverter.isNeedConversion(matchedUnitOfMeasureSupportedField.UnitInDatabase))
				{
					return tf.measurementUnitConverter.convert({
						value: content,
						originalUnit: matchedUnitOfMeasureSupportedField.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
						targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
						isReverse: !!matchedUnitOfMeasureSupportedField.UnitOfMeasureReverse,
						unitType: matchedUnitOfMeasureSupportedField.UnitTypeOfMeasureSupported
					});
				}
				else
				{
					// handle precision
					return Number(content).toFixed(2);
				}
			}
			return content;
		}
		else
		{
			var udf = (editFieldList.UserDefinedFields || []).find(function(u)
			{
				return u.Id === item.UDFId;
			});

			if (!!udf)
			{
				if (udf.Type === "Boolean")
				{
					return udf.RecordValue.toLowerCase() === "true";
				}
				return udf.RecordValue;
			}

			if (self.detailView.isCreateGridNewRecord)
			{
				var findUdf = self.detailView._userDefinedFields.find(function(udf)
				{
					return udf.UDFId === item.UDFId;
				});

				if (findUdf.UDFType === "Boolean")
				{
					// As server Api will return "True" and "False" string value for Boolean UDF recordvalue (if value specified)
					// We need to convert default Value to String for consistency here
					return item.value === null ? null : (item.value ? "True" : "False");
				}
				else if (findUdf.UDFType === "List")
				{
					return findUdf.value.map(function(item)
					{
						return item.text;
					}).join(", ");
				}

				return findUdf.value || '';
			}
			else
			{
				var userDefinedFields = self.detailView.recordEntity["UserDefinedFields"] || [],
					match = userDefinedFields.filter(function(field)
					{
						return field.DisplayName === item.field
					})[0];

				if (!!match)
				{
					if (match.Type === "List")
					{
						var selectedOptions;
						if (Array.isArray(match.SelectPickListOptionIDs) && match.SelectPickListOptionIDs.length > 0)
						{
							selectedOptions = match.UDFPickListOptions
								.filter(function(opt)
								{
									return match.SelectPickListOptionIDs.indexOf(opt.ID) > -1;
								});

							content = selectedOptions.map(function(opt)
							{
								return opt.PickList;
							}).sort(function(a, b)
							{
								return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
							}).join(", ");
						}
					}
					else
					{
						content = match.RecordValue;
					}
				}
			}
		}

		return content;
	};

	LightGridStack.prototype.getDataBlockStyles = function(item)
	{
		var self = this,
			idx, condition,
			userSetting = item.appearance || {},
			conditionSetting = item.conditionalAppearance || [],
			styles = {
				backgroundColor: null,
				titleColor: null,
				contentColor: null,
				borderColor: null
			};

		if (userSetting)
		{
			styles = $.extend(styles, userSetting);
		}

		if (self.detailView.isReadMode())
		{
			for (idx = conditionSetting.length; idx > 0; idx--)
			{
				condition = conditionSetting[idx - 1];
				if (self.checkConditionMatch(condition, item))
				{
					styles.backgroundColor = condition.backgroundColor;
					styles.titleColor = condition.titleColor;
					styles.contentColor = condition.contentColor;
					styles.borderColor = condition.borderColor;
				}
			}
		}

		return styles;
	};

	LightGridStack.prototype.checkConditionMatch = function(condition, fieldDefinition)
	{
		if (this.detailView.isCreateGridNewRecord)
		{
			return false;
		}

		var self = this,
			helper = self.detailViewHelper,
			entity = self.detailView.recordEntity,
			entityFieldValue = entity[condition.field] || '',
			conditionType = condition.type.toLowerCase(),
			conditionValue = condition.value,
			conditionOperator = condition.operator.name;

		if (fieldDefinition.UnitOfMeasureSupported)
		{
			entityFieldValue = tf.measurementUnitConverter.convert({
				value: entityFieldValue,
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				isReverse: !!fieldDefinition.UnitOfMeasureReverse,
				unitType: fieldDefinition.UnitTypeOfMeasureSupported
			});
		}

		if (entity[condition.field] == null &&
			entity.UserDefinedFields !== null)
		{
			var udf = entity.UserDefinedFields.filter(function(item)
			{
				return item.DisplayName === condition.field;
			});
			if (udf.length === 0 || udf[0].RecordValue == null)
			{
				entityFieldValue = '';
			}
			else
			{
				entityFieldValue = udf[0].RecordValue;
			}
		}

		switch (conditionType)
		{
			case "string":
				entityFieldValue = entityFieldValue.toLowerCase();
				conditionValue = conditionValue.toLowerCase();
				return helper.compareTwoValues([entityFieldValue, conditionValue], conditionOperator);
			case "number":
			case "geodistance":
				entityFieldValue = self.detailViewHelper.formatDataContent(entityFieldValue, "Number", condition.format);
				conditionValue = self.detailViewHelper.formatDataContent(conditionValue, "Number", condition.format);
				entityFieldValue = (entityFieldValue === NULL_AVATAR) ? null : entityFieldValue;
				conditionValue = (conditionValue === NULL_AVATAR) ? null : conditionValue;
				return helper.compareTwoValues([entityFieldValue, conditionValue], conditionOperator);
			case "date":
				var actualDate = moment(entityFieldValue),
					beforeDate = moment(conditionValue),
					afterDate = moment(condition.extraValue);
				return helper.compareTwoValues([actualDate, beforeDate, afterDate], conditionOperator);
			case "time":
				var actualTime = moment(_.last((entityFieldValue || "").split("T")), "hh:mm:ss A"),
					beforeTime = moment(_.last((conditionValue || "").split("T")), "hh:mm:ss A"),
					afterTime = moment(_.last((condition.extraValue || "").split("T")), "hh:mm:ss A");
				return helper.compareTwoValues([actualTime, beforeTime, afterTime], conditionOperator);
			case "boolean":
				return entityFieldValue == conditionValue;
			default:
				return false;
		}
	};

	LightGridStack.prototype.generateDataBlock = function(item)
	{
		var self = this,
			dataBlockStyles = self.getDataBlockStyles(item),
			isReadMode = self.detailView.isReadMode(),
			udfItem = item.UDFId ? self.getUDFItem(item.UDFId) : null;

		if (item.UDFId && !self.detailView.userDefinedFieldHelper.isShowInCurrentDataSource(udfItem))
		{
			return new TF.DetailView.DataBlockComponent.UnavailableUDFBlock(item);
		}

		switch (item.type)
		{
			case "tab":
				//Tab can not be nested in tab.
				return new TF.DetailView.DataBlockComponent.TabStripBlock(item, self);
			case "spacer":
				return new TF.DetailView.DataBlockComponent.SpacerBlock(item);
			case "section-header":
				return new TF.DetailView.DataBlockComponent.SectionHeaderBlock(item, self.detailView, self.getCurrentWidth(), self.toggleSectionHeaderEvent);
			case "Boolean":
				var content = self.getRawDataBlockValue(item);
				return new TF.DetailView.DataBlockComponent.GeneralBlock(_.upperFirst(content), item, self.detailView);
			case "image":
				return new TF.DetailView.DataBlockComponent.ImageBlock(item, self.detailView);
			case "Map":
				return new TF.DetailView.DataBlockComponent.MapBlock(item, self);
			case "Calendar":
				return new TF.DetailView.DataBlockComponent.CalendarBlock(item, self.detailView, self.$wrapper);
			case "grid":
				if (self.detailView.udGrid)
				{
					return new TF.DetailView.DataBlockComponent.UDGridRecordGridBlock($.extend(item, { gridConfigs: self.detailView.generateDocumentGridConfigs(item) }), self.detailView);
				}
				if (tf.helpers.miniGridHelper.checkGridSupportFilter(item.field))
				{
					return new TF.DetailView.DataBlockComponent.LightGridBlock(item, self.detailView);
				}
				return new TF.DetailView.DataBlockComponent.GridBlock(item, self.detailView);
			case "RecordPicture":
				return new TF.DetailView.DataBlockComponent.RecordPictureBlock(self.getRawDataBlockValue(item), item, dataBlockStyles, self.$wrapper, self.detailView);
			case "Schedule":
				return new TF.DetailView.DataBlockComponent.ScheduleBlock(item, dataBlockStyles, self.getCurrentWidth(), self.detailView);
			case "Attach":
				return new TF.DetailView.DataBlockComponent.AttachBlock(item, self.detailView);
			case "address":
				return new TF.DetailView.DataBlockComponent.AddressBlock(item, dataBlockStyles, self.getCurrentWidth(), self.detailView);
			case "Geodistance":
				return new TF.DetailView.DataBlockComponent.GeoDistanceBlock(item, dataBlockStyles, {
					isReadMode: self.detailView.isReadMode,
					recordEntity: self.detailView.recordEntity,
					gridType: self.detailView.gridType,
					fieldContentChangedEvent: self.detailView.fieldContentChangedEvent,
					isCreateGridNewRecord: self.detailView.isCreateGridNewRecord,
					obIsReadOnly: self.detailView.obIsReadOnly
				});
			case "multipleGrid":
				return new TF.DetailView.DataBlockComponent.MultipleGridBlock(item, self.detailView);
			case "treeList":
				return new TF.DetailView.DataBlockComponent.TreeListBlock(item, self.detailView);
			case "UDGrid":
				return new TF.DetailView.DataBlockComponent.UDGridBlock(item, self.detailView);
			default:
				var content = self.getRawDataBlockValue(item),
					nullAvatar = item.nullAvatar || NULL_AVATAR;
				if (item.badgeFiled)
				{
					item.badgevalue = self.getBadgeValue(item);
				}
				content = [undefined, null, ""].includes(content) ? nullAvatar : self.detailViewHelper.formatDataContent(content, item.type, item.format, udfItem);
				return new TF.DetailView.DataBlockComponent.GeneralBlock(content, item, dataBlockStyles, self.detailView.isCreateGridNewRecord);
		}
	};

	LightGridStack.prototype._addDataBlocks = function(item)
	{
		var self = this;

		switch (item.type)
		{
			case "horizontalLine":
				self.lineBlockHelper.addHoriLine(item.x, item.y, item.w);
				break;
			case "verticalLine":
				self.lineBlockHelper.addVertiLine(item.x, item.y, item.h);
				break;
			default:
				self.addBlock(self.generateDataBlock(item));
				break;
		}

		if (!self.detailView.isReadMode())
		{
			self.$wrapper.find(">.grid-stack-item>.ui-resizable-handle").empty().append("<div class='handle'></div>");
		}

		if (self.isRoot)
		{
			self.dataBlocks.forEach(function(block)
			{
				if (block.options && block.options.type && ["map", "tab"].includes(block.options.type.toLowerCase()))
				{
					block.options.mapToolOptions = item.mapToolOptions;
				}
				if (block instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
				{
					block.nestedGridStacks.forEach(function(nestedGridStack)
					{
						nestedGridStack.setStatic(true);
					});
				}
			});
		}
	};

	LightGridStack.prototype.getUDFItem = function(id)
	{
		var self = this,
			udfItem;
		if (self.detailView.isCreateGridNewRecord || !self.detailView.isReadMode())
		{
			// For creating new record or editing layout template cases, we use UDF definition which is ensured to be update to date
			udfItem = tf.UDFDefinition.get(self.detailView.gridType).userDefinedFields.find(function(u)
			{
				return Number(id) === u.UDFId;
			});
		}
		else
		{
			var udfsInRecord = self.detailView.recordEntity.UserDefinedFields,
				udfItem = udfsInRecord ? udfsInRecord.filter(function(item)
				{
					return item.Id === id;
				})[0] : null;
		}

		return udfItem;
	};

	LightGridStack.prototype.onNewElementAdded = function(e, elements)
	{
		var self = this;

		if (!$.contains(e.currentTarget, elements[0].el[0]))
		{
			return;
		}

		if (self.isRoot &&
			elements && elements[0] &&
			elements[0].el instanceof jQuery &&
			elements[0].el.closest(".grid-stack").hasClass("grid-stack-nested"))
		{
			return;
		}

		if (!self.startUpdateAfterAddBlock)
		{
			self.startUpdateAfterAddBlock = true;
			self.grid.grid.nodes = self.grid.grid.nodes.filter(function(node)
			{
				return !node._temporary;
			});

			var config = self.formatGeneralDataItemToJSON($(elements[0].el));
			$(elements[0].el).remove();

			if (!(config instanceof Array))
			{
				config = [config];
			}

			let addBlockFields = [];
			config.forEach(function(item)
			{
				item = self.detailViewHelper.decompressDataBlockDescriptor(item, self.detailView.gridType);
				item.minHeight = item.h;
				item.mapToolOptions = self.getMapToolOptions();

				self._addDataBlocks(item);
				self.updateDataBlocks(self.$wrapper.find("." + item.uniqueClassName));
				if (item.field)
				{
					item.uniqueClassName = self.currentBlockUniqueClassName;
					addBlockFields.push(item);
				}
			});

			self.updateHighlightBlocks(addBlockFields, null);
			self.startUpdateAfterAddBlock = false;
			self.detailViewHelper.updateSectionHeaderTextInputWidth(undefined, self.$wrapper);

			self.triggerTabContentChange();
		}
	};

	LightGridStack.prototype.updateHighlightBlocks = function(addFields, removeField)
	{
		if (!!addFields)
		{
			this.detailView.dataPointPanel.highlightBlocks(this.detailView.dataPointPanel.highlightBlocks().concat(addFields));
		}

		if (!!removeField)
		{
			let blocks = this.detailView.dataPointPanel.highlightBlocks();
			if (Array.isArray(removeField))
			{
				removeField.forEach(item =>
				{
					let type = item.type || item.options.type;
					let isSectionHeader = type === 'section-header';
					let field = item.field || (item.options && item.options.field);
					if (isSectionHeader)
					{
						blocks = blocks.filter(e => !(e.ownedBy === item.uniqueClassName
							|| (e.field === 'Map' && item.uniqueClassName.includes(e.ownedBy))));
					} else
					{
						let i = blocks.findIndex(e => e.uniqueClassName === item.uniqueClassName
							|| e.ownedBy === item.uniqueClassName
							|| (e.field === 'Map' && item.uniqueClassName.includes(e.ownedBy))
							|| (e.field === 'Map' && item.uniqueClassName.includes(e.uniqueClassName)));
						if (i > -1)
						{
							blocks.splice(i, 1);
						}
					}
				});
			} else
			{
				let uniqueClassName = removeField.uniqueClassName || removeField.options.uniqueClassName;
				let field = removeField.field || (removeField.options && removeField.options.field);
				let i = blocks.findIndex(item => item.uniqueClassName === uniqueClassName || (item.field === 'Map' && uniqueClassName.includes(item.uniqueClassName)));
				if (removeField.options && removeField.options.type === 'section-header')
				{
					blocks = blocks.filter(item => !(item.ownedBy === removeField.uniqueClassName || (item.field === 'Map' && uniqueClassName.includes(item.uniqueClassName))));
				} else if (i > -1)
				{
					blocks.splice(i, 1);
				}
			}
			this.detailView.dataPointPanel.highlightBlocks(blocks);
		}
		this.detailView.dataPointPanel.updateColumns();
	}

	/**
	 * for nested grid stack only.
	 */
	LightGridStack.prototype.triggerTabContentChange = function()
	{
		var self = this;
		if (!self.isRoot)
		{
			self.$wrapper.trigger("tabContentChanged");
		}
	};

	LightGridStack.prototype.setGridWidth = function(width)
	{
		this.grid.setGridWidth(width);
	};

	/**
	 * only accept boolean true
	 */
	LightGridStack.prototype.setStatic = function(value)
	{
		var self = this;
		if (value === true)
		{
			self.grid.opts.acceptWidgets = "";
			self.grid.setStatic(true);
			self.lineBlockHelper.setStatic(true);
		}
		else
		{
			self.grid.opts.acceptWidgets = defaultGridStackOptions.acceptWidgets;
			self.grid.setStatic(false);
			self.lineBlockHelper.setStatic(false);
			self.grid.setRemovingBound();
		}
	};

	LightGridStack.prototype.getCurrentWidth = function()
	{
		return this.grid.grid.width;
	};

	LightGridStack.prototype.getCellHeight = function()
	{
		return this.grid.opts.cellHeight;
	};

	LightGridStack.prototype.setCellHeight = function(height)
	{
		var self = this;
		self.grid.cellHeight(height);
		self.dataBlocks.forEach(function(block)
		{
			if (block instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
			{
				block.nestedGridStacks.forEach(function(nestedGridStack)
				{
					nestedGridStack.grid.cellHeight(height);
				});
			}
		});
	};

	LightGridStack.prototype.getVerticalMargin = function()
	{
		return this.grid.opts.verticalMargin;
	};

	LightGridStack.prototype.getOptions = function()
	{
		return this.grid.opts;
	};

	LightGridStack.prototype.setRemovingBound = function()
	{
		var self = this;
		self.grid.setRemovingBound();
	}

	/**
	 * serialize the layout to JSON.
	 *
	 * when save detail view template and drag data point to detail view panel, this function will be invoked.
	 *
	 * When user drag a data point to detail view edit mode panel
	 * if a data point group dragged, $el.attr("type") === "group"
	 * if a data point which contained in a group dragged, $el.attr("isgroupitem")
	 *
	 * @returns {JSON}
	 */
	LightGridStack.prototype.serializeLayout = function(options)
	{
		var self = this,
			width = (options && options.width) || self.getCurrentWidth(),
			items = self.$wrapper.find(">.grid-stack-item:not(.grid-stack-placeholder)"),
			//only lines do not have class ".grid-stack-item"
			$lines = self.$wrapper.find(">.hori-line, >.verti-line"),
			serializedData = {
				width: width,
				items: []
			};
		if (!self.grid || (items.length <= 0 && $lines.length <= 0))
		{
			return serializedData;
		}

		$.each(items, function(_, el)
		{
			var $el = $(el),
				layoutItem = self.formatGeneralDataItemToJSON($el);
			if (layoutItem)
			{
				if (layoutItem instanceof Array)
				{
					Array.prototype.push.apply(serializedData.items, layoutItem)
				}
				else
				{
					//no class name means new added block
					var uniqueClassName = $el.data("uniqueClassName") || self.detailViewHelper.getDomUniqueClassName($el) || self.detailViewHelper.generateUniqueClassName();
					layoutItem.uniqueClassName = uniqueClassName;
					layoutItem.isHidden = self.isDataBlockHidden(uniqueClassName);
					layoutItem.isCollapsed = self.isCollapsedSectionHeader(uniqueClassName);
					layoutItem.mapToolOptions = options ? options.mapToolOptions : null;

					serializedData.items.push(layoutItem);
				}
			}
		});

		if ($lines.length > 0)
		{
			serializedData.items = serializedData.items.concat(self.lineBlockHelper.serializeLines($lines));
		}

		var collapsedHeaders = serializedData.items.filter(function(item)
		{
			return item.isCollapsed;
		});
		if (options && options.sectionHeader && options.sectionHeader.className)
		{
			// click section header arrow icon
			serializedData.items = self.handleRelatedBlocksWhenToggleSectionHeader(options.sectionHeader, serializedData);
			collapsedHeaders = collapsedHeaders.filter(function(item)
			{
				return item.uniqueClassName !== options.sectionHeader.className;
			});
		}

		collapsedHeaders.forEach(function(header)
		{
			serializedData.items = self.mergeHiddenBlockLayoutInfo({
				className: header.uniqueClassName,
				isCollapsed: true
			}, serializedData, false);
		});

		serializedData.items = serializedData.items.sort(function(a, b)
		{
			return a.y - b.y;
		}).map(self.detailViewHelper.compressDataBlockDescriptor.bind(self.detailViewHelper));

		return serializedData;
	}

	/**
	 * Format the data item into JSON.
	 *
	 * @param {JQuery} $el
	 * @param {Object} node
	 * @returns
	 */
	LightGridStack.prototype.formatGeneralDataItemToJSON = function($el)
	{
		var self = this,
			node = $el.data("_gridstack_node"),
			extData = {},
			elData = $el.data(),
			itemType = elData["type"] || $el.attr("type"),
			existingGroups = self.getExistingDataPointGroups(),
			baseData = {
				x: node && node.x,
				y: node && node.y,
				w: node && node.width,
				h: node && node.height,
				field: elData["field"] || $el.attr("field"),
				title: elData["title"] || $el.attr("title"),
				UDFId: elData["UDFId"] || $el.attr("UDFId"),
				UDGridId: Number(elData["UDGridId"] || $el.attr("UDGridId")),
				type: itemType,
				format: elData["format"] || $el.attr("format"),
				defaultValue: elData["defaultValue"] || $el.attr("defaultValue"),
				customizedTitle: elData["customizedTitle"],
				appearance: elData["appearance"] ? JSON.parse(elData["appearance"]) : null,
				conditionalAppearance: elData["conditionalAppearance"],
				thematicId: elData["thematicId"],
				thematicName: elData["thematicName"],
				isLegendOpen: elData["isLegendOpen"],
				legendNameChecked: elData["legendNameChecked"],
				legendDescriptionChecked: elData["legendDescriptionChecked"]
			};

		if (baseData.UDFId)
		{
			baseData.UDFId = Number(baseData.UDFId);
		}
		else
		{
			delete baseData.UDFId;
		}

		itemType = !!$el.attr("isgroupitem") ? "groupitem" : itemType;

		switch (itemType)
		{
			case "UDGrid":
			case "grid":
				var $grid = $el.find(".kendo-grid-container");	
				if ($grid.length == 0)
				{
					$grid = $el.find(".kendo-grid");
				}
				if ($grid.length > 0)
				{
					extData = {
						sort: $grid.data("kendoGrid") ? $grid.data("kendoGrid").dataSource.sort() : [],
						filter: $grid.data("kendoGrid") ? $grid.data("kendoGrid").dataSource.filter() : null,
						showSummary: elData["showSummary"] || $el.attr("showSummary"),
						showQuickFilter: elData["showQuickFilter"] || $el.attr("showQuickFilter"),
						url: elData["url"] || $el.attr("url"),
						subUrl: elData["subUrl"] || $el.attr("subUrl"),
						columns: elData["columns"]
					};
				}

				return $.extend(baseData, extData);
			case "multipleGrid":
				$grid = $el.find(".custom-grid");
				extData = { grids: [] };
				$grid.each(function(index, item)
				{
					extData.grids.push({
						columns: $(item).data("columns")
					});
				});
				return $.extend(baseData, extData);
			case "image":
				extData = {
					image: node.el.find("input").data("filePostData") || node.el.data("filePostData"),
					imageId: node.el.find("input").length > 0 ? node.el.find("input")[0].id.split("inputImage")[1] : self.detailViewHelper.guid()
				};

				return $.extend(baseData, extData);
			case "group":
				var matchedGroup = existingGroups.find(function(group)
				{
					return group.title === $el.attr("title");
				});

				if (matchedGroup && matchedGroup.items.length && matchedGroup.items.length > 0)
				{
					return matchedGroup.items.map(function(item)
					{
						var udfId = item.UDFId,
							obj = $.extend(true, item, {
								x: item.x + node.x,
								y: item.y + node.y
							});

						if (udfId > 0)
						{
							var udf = tf.UDFDefinition.getUDFById(udfId);
							obj.UDFGUid = udf && udf.UDFGuid;
						}

						return obj;
					});
				}

				return;
			case "groupitem":
				var matchedGroup = existingGroups.find(function(group)
				{
					return group.title === $el.attr("groupName");
				});

				if (matchedGroup && matchedGroup.items)
				{
					var groupItem = matchedGroup.items.find(function(item)
					{
						return item.id === Number($el.attr("id"));
					});

					if (groupItem)
					{
						return $.extend(true, groupItem, {
							x: node.x,
							y: node.y
						});
					}
				}
				return;

			case "tab":
				var block = self.dataBlocks.find(function(d)
				{
					return d.uniqueClassName === self.detailViewHelper.getDomUniqueClassName(node.el);
				});

				if (!block)
				{
					return baseData;
				}

				var tabNames = block.tabStrip.dataSource.data().toJSON(),
					dataSources = block.nestedGridStacks.map(function(nestedGridStack, index)
					{
						return {
							items: nestedGridStack.serializeLayout().items,
							Name: tabNames[index].Name
						};
					});

				return $.extend({}, baseData, {
					dataSource: dataSources,
					defaultIndex: block.getCurrentIndex()
				});

			default:
				return baseData;
		}
	};

	LightGridStack.prototype.getExistingDataPointGroups = function()
	{
		return this.detailView && this.detailView.dataPointPanel && this.detailView.dataPointPanel.groups || [];
	};

	LightGridStack.prototype.getMapToolOptions = function()
	{
		var self = this;
		return self.detailView && self.detailView.options ? { mapToolOptions: self.detailView.options.mapToolOptions } : null;
	};

	/**
	 * check data block is hidden
	 * @param {String} className
	 */
	LightGridStack.prototype.isDataBlockHidden = function(className)
	{
		return !!this.collapsedSectionHeaderList.find(function(item)
		{
			return item.uniqueClassName === className;
		});
	};

	/**
	 * check section header is collapsed
	 * @param {String} className
	 */
	LightGridStack.prototype.isCollapsedSectionHeader = function(className)
	{
		return !!this.collapsedSectionHeaderList.find(function(item)
		{
			return item.headerClassName === className;
		});
	};

	LightGridStack.prototype.handleRelatedBlocksWhenToggleSectionHeader = function(sectionHeaderInfo, layoutObj)
	{
		var self = this,
			result = [],
			sectionHeader = self.$wrapper.find("." + sectionHeaderInfo.className),
			headers = sectionHeader.siblings('.section-header-stack-item'),
			y = parseInt(sectionHeader.attr("data-gs-y")),
			nextY = Number.MAX_SAFE_INTEGER;

		for (var i = 0; i < headers.length; i++)
		{
			var temp = parseInt($(headers[i]).attr("data-gs-y"));
			if (temp > y && temp < nextY)
			{
				nextY = temp;
			}
		}

		if (layoutObj && layoutObj.items && layoutObj.items.length > 0)
		{
			if (sectionHeaderInfo.isCollapsed)
			{
				if (!self.collapsedSectionHeaderList)
				{
					self.collapsedSectionHeaderList = []
				}

				var sectionHeaderOwnedItems = [];
				result = layoutObj.items.map(function(item)
				{
					if ((y < item.y && item.y < nextY) || (item.y == nextY && item.type == "horizontalLine"))
					{
						item.distance = item.y - y;
						item.isHidden = true;
						item.ownedBy = sectionHeaderInfo.className;
						sectionHeaderOwnedItems.push(item);
					}

					return item;
				})

				self.collapsedSectionHeaderList.push({
					headerClassName: sectionHeaderInfo.className,
					items: sectionHeaderOwnedItems
				})
			}
			else
			{
				result = self.mergeHiddenBlockLayoutInfo(sectionHeaderInfo, layoutObj, true)
			}
		}

		var allCollapsedSectionHeader = self.collapsedSectionHeaderList.reduce(function(result, current)
		{
			return result.concat(current.headerClassName)
		}, []);

		return result.map(function(item)
		{
			if (allCollapsedSectionHeader.indexOf(item.uniqueClassName) > -1)
			{
				item.isCollapsed = true;
				item.isHidden = false;
			}

			return item;
		})
	};

	LightGridStack.prototype.mergeHiddenBlockLayoutInfo = function(sectionHeaderInfo, layoutObj, isToggleSectionHeader)
	{
		var self = this,
			result = [],
			sectionHeader = layoutObj.items.find(function(item)
			{
				return item.uniqueClassName === sectionHeaderInfo.className;
			}),
			matchedSectionHeaders = self.collapsedSectionHeaderList.filter(function(item)
			{
				return item.headerClassName === sectionHeaderInfo.className;
			});

		if (matchedSectionHeaders.length != 1) return [];
		var ownedItems = matchedSectionHeaders[0].items;

		if (isToggleSectionHeader)
		{
			self.collapsedSectionHeaderList = self.collapsedSectionHeaderList.filter(function(item)
			{
				return item.headerClassName !== sectionHeaderInfo.className;
			});
		}

		var topmost = Number.MAX_SAFE_INTEGER,
			bottommost = -1;
		for (var i = 0; i < ownedItems.length; i++)
		{
			var ownedItem = ownedItems[i];
			topmost = Math.min(topmost, ownedItem.y);
			bottommost = Math.max(ownedItem.y + ownedItem.h, bottommost);

			if (isToggleSectionHeader)
			{
				ownedItem.isHidden = false;
			}
			ownedItem.y = ownedItem.distance + sectionHeader.y;

			result.push(ownedItem);
		}

		var downDistance = 0;
		if (topmost < Number.MAX_SAFE_INTEGER && bottommost >= 0)
		{
			downDistance = bottommost - topmost;
		}

		return result.concat(layoutObj.items.map(function(item)
		{
			if (item.uniqueClassName === sectionHeaderInfo.className)
			{
				if (isToggleSectionHeader)
				{
					item.isCollapsed = false;
					item.isHidden = false;
				}
			}
			else if (item.y > sectionHeader.y)
			{
				item.y += downDistance;
			}

			return item;
		}));
	};

	LightGridStack.prototype._hiddenCollapsedSectionHeader = function(item)
	{
		var self = this,
			sectionHeader = self.collapsedSectionHeaderList.filter(function(collapsedItem)
			{
				return collapsedItem.headerClassName === item.ownedBy
			});

		if (sectionHeader.length == 0)
		{
			self.collapsedSectionHeaderList.push({
				headerClassName: item.ownedBy,
				items: [item]
			})
		}
		else
		{
			sectionHeader[0].items.push(item);
		}
	};

	LightGridStack.prototype.updateDataBlocks = function($stackItems)
	{
		var self = this,
			$stackItems = $stackItems || self.$wrapper.find(">.grid-stack-item");

		$stackItems.on("dragstart.grid-stack-item", function(e)
		{
			$(e.target).addClass('dragging');
		});
		$stackItems.on("dragstop.grid-stack-item", function(e)
		{
			$(e.target).removeClass('dragging');
			self.triggerTabContentChange();
		});
		$stackItems.on("drag.grid-stack-item", function(e)
		{
			if ($(e.target).closest(".grid-stack-nested").length > 0)
			{
				var draggingOffset = $(e.target).offset(),
					containerOffset = $(e.target).closest(".grid-stack-nested").offset();
			}
			else
			{
				var draggingOffset = $('.data-point.ui-draggable-dragging').offset(),
					containerOffset = self.grid.container.offset();
			}
			$(e.target).css({
				left: draggingOffset.left - containerOffset.left + 'px',
				top: draggingOffset.top - containerOffset.top + 'px'
			});
		});
		$stackItems.draggable("option", "containment", "body");
		$stackItems.draggable("option", "appendTo", "body");
		$stackItems.draggable("option", "helper", function(e)
		{
			var $gridItem = $(e.target).closest('.grid-stack-item'),
				$target = $gridItem.find('>.grid-stack-item-content'),
				width = $gridItem.width(),
				height = $gridItem.height(),
				$wrapper = $('<div class="dragging-helper-wrapper"></div>'),
				$helper = $('<div class="data-point dragging-helper"></div>'),
				isTab = $gridItem.find(".grid-stack").length > 0;

			//Create Dom Tree to apply styles when dragging.
			var $virtualGridItem = $('<div></div>').addClass($gridItem.attr('class').replace('dragging', ''));
			$virtualGridItem.append($target.clone());
			$virtualGridItem.width($gridItem.width());
			$virtualGridItem.height($gridItem.height());
			$wrapper.append($virtualGridItem);
			if (isTab)
			{
				$wrapper.addClass('grid-stack');
			}

			if ($gridItem.hasClass('section-header-stack-item'))
			{
				$wrapper.addClass('section-header-stack-item');
			}

			$helper.css({
				width: width + (isTab ? 8 : 0) + "px",
				height: height + (isTab ? 8 : 0) + "px"
			});
			$helper.append($wrapper);

			return $helper[0];
		});

		$stackItems.resizable("option", "containment", self.$wrapper);
		self.updateDragHandlerStatus();
	};

	/**
	 * Update the enable/disable status for data blocks.
	 * @return {void}
	 */
	LightGridStack.prototype.updateDragHandlerStatus = function()
	{
		var self = this,
			containerWidth = self.getCurrentWidth();

		$.each(self.grid.container.find(">.grid-stack-item:not(.grid-stack-placeholder)"), function(index, item)
		{
			var $el = $(item),
				data = $el.data("_gridstack_node"),
				isTopDraggable = data.y || data.height > 1,
				isLeftDraggable = data.x || data.width > 1,
				isRightDraggable = (data.x + data.width) < containerWidth || data.width > 1;

			$el.find(".ui-resizable-handle.ui-resizable-sw .handle").toggleClass("disable", !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-w .handle").toggleClass("disable", !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-nw .handle").toggleClass("disable", !isTopDraggable || !isLeftDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-n .handle").toggleClass("disable", !isTopDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-ne .handle").toggleClass("disable", !isTopDraggable || !isRightDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-e .handle").toggleClass("disable", !isRightDraggable);
			$el.find(".ui-resizable-handle.ui-resizable-se .handle").toggleClass("disable", !isRightDraggable);
		});
	};

	/**
	 * When the data block dragging stops.
	 * @param {Event} e
	 */
	LightGridStack.prototype.onDataBlockDragStop = function(e, helper)
	{
		this.updateDragHandlerStatus();
		let $target = $(e.target);
		if (!$target.hasClass('grid-stack-item-removing')) return;

		if ($target.hasClass('tab-strip-stack-item'))
		{
			let $blocks = $target.find('[class^="grid-unique-"]');
			if ($blocks.length === 0)
			{
				$blocks = $target.find('.section-header-stack-item');
			}
			this.removeBlockField = [];
			$blocks.each((index, item) =>
			{
				this.removeBlockField.push($(item).data());
			})
		} else if ($target.hasClass('section-header-stack-item'))
		{
			this.removeBlockField = $target.find('.caret.up').length === 0 ? [] : this.detailView.dataPointPanel.highlightBlocks().filter(el => $target.hasClass(el.ownedBy));
		}
		else
		{
			let className = this.detailViewHelper.getDomUniqueClassName($target);
			this.removeBlockField = $(`.${className}`).data();
			this.removeBlockField.uniqueClassName = this.removeBlockField.uniqueClassName || className;
		}

		this.updateHighlightBlocks(null, this.removeBlockField)
	};

	LightGridStack.prototype.onDataBlockDragStart = function(e, helper)
	{

	};

	/**
	 * When the data block resizing start.
	 * @param {Event} e
	 */
	LightGridStack.prototype.onDataBlockResizeStart = function(e)
	{
		e.stopPropagation();
		var self = this;

		self.dataBlocks.forEach(function(block)
		{
			if (block.fixedCalendarStatus)
			{
				block.fixedCalendarStatus(e.target);
			}
		});

		var tabBlock = self.dataBlocks.find(function(block)
		{
			return block.uniqueClassName == self.detailViewHelper.getDomUniqueClassName($(e.target)) && block instanceof TF.DetailView.DataBlockComponent.TabStripBlock;
		});

		if (tabBlock)
		{
			tabBlock.$el.find(".ui-resizable-handle").empty();
		}

		$(e.target).closest(".grid-stack").addClass("grid-stack-resizing");
		$(e.target).addClass("item-resizing");
	};

	/**
	 * When the data block resizing stops.
	 * @param {Event} e
	 */
	LightGridStack.prototype.onDataBlockResizeStop = function(e, extraData)
	{
		e.stopPropagation();
		var self = this,
			$target = $(e.target);

		self.updateDragHandlerStatus();
		self.dataBlocks.forEach(function(block)
		{
			if (block.fixedCalendarStatus)
			{
				block.fixedCalendarStatus(e.target);
			}
		});

		$target.closest(".grid-stack").removeClass("grid-stack-resizing");
		$target.removeClass("item-resizing");
		if (!$target.hasClass("ui-resizable-autohide"))
		{
			$target.addClass("ui-resizable-autohide");
			$target.find(".ui-resizable-handle").hide()
		}
		self.handleGridBlockResized(e);
		self.handleTabStripBlockResized(e);

		if ($(e.target).parents(".tab-strip-stack-item").length > 0 && !(extraData && extraData.triggeredByTab))
		{
			//resizing nested block only (except resizing tab what leads to nested block resize)
			self.triggerTabContentChange();
		}
	};

	LightGridStack.prototype.handleTabStripBlockResized = function(e)
	{
		var self = this,
			tabBlock = self.dataBlocks.find(function(item)
			{
				return item.$el[0] == e.target && item instanceof TF.DetailView.DataBlockComponent.TabStripBlock;
			});

		if (tabBlock)
		{
			setTimeout(function()
			{
				var width = Number(tabBlock.$el.attr("data-gs-width"));

				tabBlock.nestedGridStacks.forEach(function(nestedGridStack)
				{
					nestedGridStack.addStackBlocks(nestedGridStack.serializeLayout({ width: width }));
				});

				tabBlock.resize();
			}, 20);

			tabBlock.$el.find(".ui-resizable-handle").empty().append("<div class='handle'></div>");
		}
	};

	/**
	 * Event handler when grid data block is resized.
	 *
	 * @param {Event} e
	 * @returns
	 */
	LightGridStack.prototype.handleGridBlockResized = function(e)
	{
		var self = this,
			uniqueClassName = this.detailViewHelper.getDomUniqueClassName($(e.target)),
			$miniGrid = $("." + uniqueClassName).find(">.grid-stack-item-content.custom-grid").find(".kendo-grid"),
			$miniGridWithFilter = $("." + uniqueClassName).find(">.grid-stack-item-content.custom-grid").find(".kendo-grid-container");

		if ($miniGrid.length == 0)
		{
			$miniGrid = $("." + uniqueClassName).find(">.grid-stack-item-content>.custom-grid").find(".kendo-grid").last();
		}

		if ($miniGridWithFilter.length == 0)
		{
			$miniGridWithFilter = $("." + uniqueClassName).find(">.grid-stack-item-content>.custom-grid").find(".kendo-grid-container").last();
		}

		if ($miniGridWithFilter.length > 0)
		{
			setTimeout(function()
			{
				self.fitContainer(uniqueClassName);
			}, 250);
		}
		else if ($miniGrid.length > 0)
		{
			setTimeout(function()
			{
				var kendoGrid = $miniGrid.data("kendoGrid");
				if (kendoGrid)
				{
					kendoGrid.refresh();
				}
			}, 250);
		}
	};

	LightGridStack.prototype.fitContainer = function(uniqueClassName)
	{
		const $targetBlock = this.dataBlocks.filter(function(dataBlock)
		{
			return dataBlock.uniqueClassName == uniqueClassName;
		})[0];

		$targetBlock?.lightKendoGrid?.fitContainer();
	}

	/**
	 * Event handler when data block is deleted.
	 *
	 * @param {Event} e
	 * @param {Object} data
	 */
	LightGridStack.prototype.onDataBlockDeleted = function(e, data)
	{
		var self = this,
			$target = $(data.target),
			isLine = $target.closest(".hori-line, .verti-line").length > 0,
			$item = $target.closest('.grid-stack-item'),
			block = self.dataBlocks.find(function(block)
			{
				return !isLine && block.uniqueClassName == self.detailViewHelper.getDomUniqueClassName($item)
			});

		this.removeBlockField = block.nestedGridStacks ? block.nestedGridStacks.reduce((acc, item) => acc.concat(item.dataBlocks), []) : $item.hasClass('section-header-stack-item') && $target.find('.caret.up').length === 0 ? [] : block;
		this.updateHighlightBlocks(null, this.removeBlockField);
		if (block instanceof TF.DetailView.DataBlockComponent.TabStripBlock)
		{
			block.disableTabStatus();
		}

		if (block && block.dispose)
		{
			block.dispose();
		}

		if (isLine)
		{
			$target.closest(".hori-line, .verti-line").remove();
			self.lineBlockHelper.refresh();
		}
		else
		{
			self.dataBlocks = self.dataBlocks.filter(function(b)
			{
				return b != block;
			});
			self.grid.removeWidget($item[0]);
		}

		self.triggerTabContentChange();
	};

	/**
	 * On when any data point is updated.
	 *
	 * @param {Event} evt
	 * @param {Object} data
	 */
	LightGridStack.prototype.onDataBlockUpdated = function(evt, data)
	{
		var self = this,
			$target = $(data.target);
		switch (data.modifiedType)
		{
			case 'Appearance':
				var $targetItem = $target.closest('.grid-stack-item'),
					curAppearance = JSON.parse($targetItem.data("appearance"));
				$targetItem.data({
					appearance: JSON.stringify($.extend(curAppearance, data.appearance)),
					customizedTitle: data.customizedTitle
				});
				break;
			default: //switch data block
				var defaultWidth = 1,
					defaultHeight = 1,
					gridItem = $target.parents('.grid-stack-item'),
					resetGridItem = function(el)
					{
						self.grid.minHeight(el, 1);
						self.grid.minWidth(el, 1);
					};
				switch (data.dataPoint.type)
				{
					case 'Calendar':
						defaultHeight = parseInt(data.dataPoint['min-height']);
						break;
					case "grid":
						defaultHeight = 3;
						break;
					default:
						break;
				}

				resetGridItem(gridItem);
				self.grid.resize(gridItem, defaultWidth, defaultHeight);
				$target.find('.item-title').text(data.dataPoint.title);
				$target.find('.item-content').text(data.dataPoint.defaultValue);
				var currentData = {
					type: data.dataPoint.type,
					field: data.dataPoint.field,
					title: data.dataPoint.title,
					appearance: '',
					customizedTitle: '',
					defaultValue: data.dataPoint.defaultValue
				};
				if (data.dataPoint.type === "Boolean")
				{
					currentData.negativeLabel = data.dataPoint.negativeLabel;
					currentData.positiveLabel = data.dataPoint.positiveLabel;
				}
				if (data.dataPoint.type === "grid")
				{
					currentData.subUrl = data.dataPoint.subUrl;
					currentData.url = data.dataPoint.url;
					$target.closest('.grid-stack-item').data("columns", []);
				}
				$target.closest('.grid-stack-item').data(currentData);
				break;
		}

		self.addStackBlocks(self.serializeLayout());
		self.detailView.dataPointPanel.updateHighlightBlocks(self.serializeLayout().items);
		self.detailView.dataPointPanel.updateColumns();
		self.triggerTabContentChange();
	};

	LightGridStack.prototype.handleAttchDocumentDataBlock = function()
	{
		var self = this;
		self.$wrapper.find(">.grid-stack-item>.attach-document-stack.with-content").each(function(_, el)
		{
			var width = $(el).closest(".grid-stack-item").width();
			$(el)[width < 200 ? "addClass" : "removeClass"]("small");
		});
	};

	//#region Manage Layout Associated

	LightGridStack.prototype.manageLayout = function()
	{
		var self = this,
			helper = self.detailViewHelper;
		if (!self.grid || !self.detailView.isReadMode())
		{
			return;
		}

		self.grid.setAnimation(false);

		self.heightenedGroups = self.heightenedGroups || [];

		var shorteningCandidateGroups = [],
			shorteningTabCandidates = [],
			//if existing data block which want to increase height, that means no data block will decrease height
			isExistingHeightening = false;

		self.dataBlocks.forEach(function(dataBlock)
		{
			if (!(dataBlock instanceof TF.DetailView.DataBlockComponent.TabStripBlock)) return;

			dataBlock.tabStrip._scrollable();
			var currentGridStack = dataBlock.nestedGridStacks[dataBlock.getCurrentIndex()];
			currentGridStack.manageLayout();
		});

		self.grid.grid.nodes.forEach(function(node)
		{
			/**
			 * height increase when heightChange > 0
			 * height decrease when heightChange < 0
			 */
			var heightChange;

			if (!node.el.hasClass("tab-strip-stack-item"))
			{
				heightChange = self.getNormalDataBlockHeightChange(node);
			}
			else
			{
				heightChange = self.getTabDataBlockHeightChange(node);

				if (heightChange < 0)
				{
					var currentTabWidth = node.el[0].getBoundingClientRect().width,
						currentTabClassName = helper.getNodeUniqueClassName(node),
						latestWidthWhenTabHeightening = self.heightenedGroups.reduce(function(acc, group)
						{
							var tab = group.find(function(b)
							{
								return b.className == currentTabClassName;
							});

							return tab ? Math.min(tab.width, acc) : acc;
						}, Number.MAX_SAFE_INTEGER);

					if (currentTabWidth < latestWidthWhenTabHeightening)
					{
						// The condition means that the dragging bar is moving to the right.
						heightChange = 0;
					}
				}
			}

			if (!heightChange) return;

			if (heightChange > 0)
			{
				isExistingHeightening = true;

				var heightenAffectedNodes = self.getAffectedNodes(node),
					heighteningNodes = [node].concat(heightenAffectedNodes);

				heighteningNodes.forEach(function(heighteningNode)
				{
					self.grid.resize(heighteningNode.el[0], heighteningNode.width, heighteningNode.height + heightChange);
				});

				self.getAffectedLines(node).forEach(function(line)
				{
					self.lineBlockHelper.resizeHeight(line, line.height + heightChange);
				});

				for (var m = 0; m < heightChange; m++)
				{
					/**
					 * heightChange could be more than 1
					 * (when initialize, data block content may be extremely long and add one unit height is not enough)
					 * 
					 * First item of each group in heightenedGroups is voluntary to heighten, and others are effected.
					 */
					self.heightenedGroups.push(heighteningNodes.map(function(heighteningNode)
					{
						return {
							className: helper.getNodeUniqueClassName(heighteningNode),
							width: heighteningNode.el.hasClass("tab-strip-stack-item") ? heighteningNode.el[0].getBoundingClientRect().width : undefined
						};
					}));
				}
			}
			else
			{
				shorteningCandidateGroups[node.y] = shorteningCandidateGroups[node.y] || [];

				if (!node.el.hasClass("tab-strip-stack-item"))
				{
					shorteningCandidateGroups[node.y].push({
						node: node,
						heightChange: heightChange
					});
				}
				else
				{
					shorteningTabCandidates.push({
						node: node,
						heightChange: heightChange
					});
				}
			}
		});

		if (!isExistingHeightening)
		{
			// try to decrease data blocks when every data blocks in one row can be decreased
			self.shorteningBlocks(shorteningCandidateGroups, shorteningTabCandidates);
		}

		var kendoGrids = self.$wrapper.find('>.grid-stack-item .kendo-grid-container');
		if (kendoGrids && kendoGrids.length > 0)
		{
			$.each(kendoGrids, function(_, kendoGrid)
			{
				if ($(kendoGrid).hasClass("kendo-grid-container") || $(kendoGrid).hasClass("kendo-summarygrid-container"))
				{
					return;
				}

				var grid = $(kendoGrid).data("kendoGrid");
				if (grid)
				{
					grid.refresh();
					//TF.DetailView.DataBlockComponent.UDGridBlock.renderCommandBtn(grid, grid.dataSource.data());
				}
			})
		}

		self.grid.setAnimation(true);

		self.handleAttchDocumentDataBlock();
		self.detailViewHelper.updateSectionHeaderTextInputWidth(null, self.detailView.$element);
	};

	/**
	 * @param {grid stack node} node
	 */
	LightGridStack.prototype.getTabDataBlockHeightChange = function(node)
	{
		var self = this,
			tab = self.dataBlocks.find(function(dataBlock)
			{
				return dataBlock.$el[0] == node.el[0];
			}),
			occupiedHeight = tab.nestedGridStacks[tab.getCurrentIndex()].getOccupiedHeight(),
			targetHeight = occupiedHeight + tab.titleHeight + tab.nestedGridStackBottomBlankHeight[tab.getCurrentIndex()],
			actualHeight = Number(node.el.attr("data-gs-height"));
		if (targetHeight > actualHeight)
		{
			return targetHeight - actualHeight;
		}
		else
		{
			// need to decrease height
			return -1 * Math.min(actualHeight - targetHeight, actualHeight - tab.options.h);
		}
	};

	/**
	 * @param {grid stack node} node
	 */
	LightGridStack.prototype.getNormalDataBlockHeightChange = function(node)
	{
		var self = this, $contentContainer = $(node.el).find(".grid-stack-item-content");

		if ($contentContainer.length == 0) return null;

		var heightChange = 0,
			height = node.height,
			$content = node.el.find('div.item-content'),
			helper = self.detailViewHelper;

		/*
		 * total height: self.getCellHeight() * node.height + (node.height - 1) * self.getVerticalMargin()
		 * $contentContainer border height: 1*2
		 * $contentContainer padding top & bottom: 8 * 2
		 */
		var availableContentHeight = self.getCellHeight() * node.height + (node.height - 1) * self.getVerticalMargin() - node.el.find('.item-title:not(:hidden)').outerHeight() - 8 * 2 - 1 * 2;

		if ($content.length > 0 && $content[0].scrollHeight > availableContentHeight)
		{
			if (["custom-grid", "document"].some(function(className) { return $contentContainer.hasClass(className); }))
			{
				heightChange = 0;
			}
			else
			{
				heightChange = Math.ceil(($content[0].scrollHeight - availableContentHeight) / (self.getCellHeight() + self.getVerticalMargin()));
			}
		}
		else if (node.height > 1)
		{
			if ($contentContainer.hasClass('custom-grid') || $contentContainer.hasClass('document'))
			{
				if (self.getHeightenedBlockClassNames().includes(helper.getNodeUniqueClassName(node)))
				{
					heightChange = self.getBlockOriginalHeight(node) - height;
				}
				else
				{
					heightChange = 0;
				}
			}
			else
			{
				$content.css("height", "auto");
				heightChange = 0 - Math.floor((availableContentHeight - $content.outerHeight()) / (self.getCellHeight() + self.getVerticalMargin()));
				if (height + heightChange < self.getBlockOriginalHeight(node))
				{
					if (self.getHeightenedBlockClassNames().includes(helper.getNodeUniqueClassName(node)))
					{
						heightChange = self.getBlockOriginalHeight(node) - height;
					}
					else
					{
						heightChange = 0;
					}
				}
			}
		}

		return heightChange;
	};

	LightGridStack.prototype.getAffectedLines = function(node)
	{
		var self = this;
		return self.lineBlockHelper.getVerticalLines().filter(function(line)
		{
			return ((node.y + node.height <= line.y + line.height && node.y >= line.y) ||
				(node.y > line.y && node.y < line.y + line.height) ||
				(node.y < line.y + line.height && node.y + node.height > line.y));
		});
	};

	LightGridStack.prototype.isExistingShortableTab = function()
	{
		var self = this;
		return self.grid.grid.nodes.filter(function(node)
		{
			return node.el.hasClass("tab-strip-stack-item");
		}).map(function(tabNode)
		{
			return self.getTabDataBlockHeightChange(tabNode)
		}).some(function(heightChange)
		{
			return heightChange < 0;
		});
	};

	LightGridStack.prototype.shorteningBlocks = function(shorteningCandidateGroups, shorteningTabCandidates)
	{
		var self = this,
			matchedGroups = [];

		self.heightenedGroups.forEach(function(group)
		{
			var tabs = group.filter(function(i) { return !!i.width; }),
				generalItems = _.difference(group, tabs),
				allCandidateTabClassNames = shorteningTabCandidates.map(function(c)
				{
					return self.detailViewHelper.getNodeUniqueClassName(c.node);
				}),
				matchedIndex,
				matched = tabs.every(function(tab)
				{
					return allCandidateTabClassNames.includes(tab.className);
				}) && shorteningCandidateGroups.some(function(g, index)
				{
					var result = generalItems.every(function(i)
					{
						return g.map(function(a)
						{
							return self.detailViewHelper.getNodeUniqueClassName(a.node);
						}).includes(i.className);
					});

					if (result)
					{
						matchedIndex = index;
					}

					return result;
				}),
				isGroupAffecteByTab = $(group[0].className).hasClass("tab-strip-stack-item"),
				isExistingOthersAffectTab = self.heightenedGroups.filter(function(g)
				{
					return !matchedGroups.includes(g);
				}).reduce(function(r, g)
				{
					return r.concat(g.map(function(item, index)
					{
						if (!index) return "";
						return item.className;
					}));
				}, []).includes(group[0].className);

			if (matched && (!isGroupAffecteByTab || (isGroupAffecteByTab && !isExistingOthersAffectTab)))
			{
				matchedGroups.push(group);
				shorteningCandidateGroups[matchedIndex].forEach(function(i)
				{
					i.heightChange += 1;
				});

				shorteningCandidateGroups = shorteningCandidateGroups.filter(function(g)
				{
					return g.every(function(item)
					{
						return item.heightChange < 0;
					});
				});

				shorteningTabCandidates.forEach(function(tc)
				{
					tabs.forEach(function(tab)
					{
						if (tab.className == self.detailViewHelper.getNodeUniqueClassName(tc.node))
						{
							tc.heightChange += 1;
						}
					});
				});

				shorteningTabCandidates = shorteningTabCandidates.filter(function(c)
				{
					return c.heightChange < 0;
				});
			}
		});

		matchedGroups.forEach(function(g)
		{
			var firstNode;

			g.forEach(function(i, index)
			{
				var $dom = $(i.className),
					node = $dom.data("_gridstack_node");

				if (node == null)
				{
					return;
				}
				if (!index)
				{
					firstNode = node;
				}
				self.grid.resize($dom[0], node.width, node.height - 1);
			});

			if (firstNode == null)
			{
				return;
			}
			self.getAffectedLines(firstNode).forEach(function(line)
			{
				self.lineBlockHelper.resizeHeight(line, line.height - 1);
			});
		});

		self.heightenedGroups = self.heightenedGroups.filter(function(g)
		{
			return !matchedGroups.includes(g);
		});
	};

	/**
	 * get data block original height
	 * @param {Object} block
	 */
	LightGridStack.prototype.getBlockOriginalHeight = function(block)
	{
		return this.gridStackItemOriginalHeight.find(function(i)
		{
			return block.el.hasClass(i.className);
		}).height;
	};

	/**
	 * flatten self.heightenedGroups
	 */
	LightGridStack.prototype.getHeightenedBlockClassNames = function()
	{
		var self = this;
		if (!self.heightenedGroups || self.heightenedGroups.length == 0) return [];

		return self.heightenedGroups.reduce(function(accumulator, current)
		{
			return accumulator.concat(current.map(function(i) { return i.className; }));
		}, []);
	};

	/**
	 * get affected blocks when a block heightening
	 */
	LightGridStack.prototype.getAffectedNodes = function(heighteningNode)
	{
		var self = this,
			affectedItems = [],
			blocksGroupByColumn = [],
			width = self.getCurrentWidth();

		for (var i = 0; i < width; i++)
		{
			blocksGroupByColumn[i] = self.grid.grid.nodes.filter(function(item)
			{
				return item.x == i;
			});
		}

		blocksGroupByColumn.forEach(function(group)
		{
			if (group.length == 0 || heighteningNode.x == group[0].x) return;

			group.forEach(function(item)
			{
				if ((heighteningNode.y + heighteningNode.height <= item.y + item.height && heighteningNode.y >= item.y) ||
					(heighteningNode.y > item.y && heighteningNode.y < item.y + item.height) ||
					(heighteningNode.y < item.y + item.height && heighteningNode.y + heighteningNode.height > item.y) &&
					!affectedItems.map(function(affectItem)
					{
						return affectItem.x
					}).includes(item.x))
				{
					affectedItems.push(item);
				}
			});
		});

		return affectedItems;
	};

	/**
	 * Append not empty validator for a "required field"
	 *
	 * @param {object} item
	 */
	LightGridStack.prototype.appendValidatorForRequiredField = function(requiredFields, item)
	{
		if (item && item.editType && (typeof item.editType.allowEdit !== "function" || item.editType.allowEdit()))
		{
			if (!item.editType.validators)
			{
				item.editType.validators = {};
			}

			var fieldName = item.editType.entityKey || item.field;
			if (requiredFields.indexOf(fieldName) > -1)
			{
				item.editType.validators["notEmpty"] = { message: 'required' };
			}
			else
			{
				delete item.editType.validators["notEmpty"];
			}
		}
	};

	//#endregion

	LightGridStack.prototype.getBlocks = function(type)
	{
		let results = [];
		this.dataBlocks.forEach(i =>
		{
			if (i instanceof type)
			{
				results.push(i);
				return;
			}

			if (i.nestedGridStacks)
			{
				i.nestedGridStacks.forEach(n =>
				{
					let nResults = n.getBlocks(type);
					results = results.concat(nResults);
				});
			}
		});

		return results;
	}

	LightGridStack.prototype.dispose = function()
	{
		var self = this;

		self.$wrapper.off(self.eventNameSpace);

		self.deleteDataBlockEvent.unsubscribeAll();
		self.toggleResizableEvent.unsubscribeAll();
		self.changeDataPointEvent.unsubscribeAll();
		self.toggleSectionHeaderEvent.unsubscribeAll();

		self.dataBlocks.forEach(function(block)
		{
			if (block.nestedGridStacks)
			{
				block.nestedGridStacks.forEach(function(nestedGridStack)
				{
					nestedGridStack.dispose();
				});
			}

			if (block.dispose)
			{
				block.dispose();
			}
		});

		if (self.$wrapper)
		{
			self.$wrapper.off(".gridStack");
		}
		if (self.grid && self.grid.destroy)
		{
			self.grid.destroy();
		}
	};
})();