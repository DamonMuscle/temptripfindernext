(function()
{
	createNamespace("TF.DetailView").DetailViewHelper = DetailViewHelper;

	function DetailViewHelper()
	{
		var self = this;
		self.defaultColors = {
			backgroundColor: "#FFFFFF",
			borderColor: "transparent",
			titleColor: "gray",
			contentColor: "#000000"
		};
		self.uniqueFields = {
			district: [{
				field: "IdString",
				title: "Code"
			}],
			school: [{
				field: "SchoolCode",
				title: "School Code"
			}]
		}
		self.defaultSectionHeaderTitle = "SECTION HEADER";
		self.NEW_LAYOUT_ID = -1;

		self.AvailableOperators = ["EqualTo", "NotEqualTo", "Empty", "NotEmpty", "LessThan",
			"LessThanOrEqualTo", "GreaterThan", "GreaterThanOrEqualTo", "Contains",
			"DoesNotContain", "StartsWith", "EndsWith", "On", "NotOn", "Before", "OnOrBefore",
			"After", "OnOrAfter", "Between"
		];

		// This is for fields that are not original table fields.
		self.requiredFields = {};

		self.imgUrl = TF.productName === "routefinder" ? "../../global/Img/detail-screen/" : "./global/Img/detail-screen/";
	}

	DetailViewHelper.prototype.init = function()
	{
		var self = this;
		self.updateRequiredFields();

		PubSub.subscribe(pb.REQUIRED_FIELDS_CHANGED, function(name, gridType)
		{
			self.updateRequiredFields(gridType);
		});
	};

	DetailViewHelper.prototype.updateRequiredFields = function(gridType)
	{
		var self = this, updatePromise = Promise.resolve();

		if (gridType)
		{
			updatePromise = tf.UDFDefinition.updateByType(gridType);
		}

		if (self.requiredFields == null)
		{
			self.requiredFields = {};
		}
		if (gridType)
		{
			self.requiredFields[gridType] = [];
		}

		return updatePromise.then(function()
		{
			var dbid = tf.storageManager.get("datasourceId");
			tf.UDFDefinition.collection.forEach(function(udfDefinition)
			{
				if (!self.requiredFields[udfDefinition.gridType])
				{
					self.requiredFields[udfDefinition.gridType] = [];
				}

				udfDefinition.userDefinedFields.forEach(function(udf)
				{
					if (udf.Required)
					{
						var ds = udf.UDFDataSources,
							hasDBID = ds.some(function(db)
							{
								return db.DBID === dbid;
							});

						if (hasDBID)
						{
							self.requiredFields[udfDefinition.gridType].push(
								{
									name: udf.OriginalName,
									title: udf.DisplayName,
									udfId: udf.UDFId
								}
							);
						}
					}
				});
			});

			var paramData = {
				"@filter": "eq(Required,true)|eq(SystemRequired,true)"
			};

			if (gridType)
			{
				paramData["DataTypeID"] = tf.DataTypeHelper.getId(gridType);
			}

			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "RequiredFields"), { paramData: paramData })
				.then(function(response)
				{
					response.Items.forEach(function(item)
					{
						var typeKey = tf.DataTypeHelper.getKeyById(item.DataTypeID),
							dataPoint = self.getDataPointByIdentifierAndGrid(item.FieldName, typeKey, true);

						self.requiredFields[typeKey] = self.requiredFields[typeKey] || [];

						self.requiredFields[typeKey].push({
							name: item.FieldName,
							title: dataPoint && dataPoint.title || item.Label,
							field: dataPoint && dataPoint.field || item.FieldName,
							dataPointTitle: dataPoint && dataPoint.title || item.Label,
						});
					});
				});
		});
	};

	DetailViewHelper.prototype.updateUDFRequiredFields = function(gridType)
	{
		let self = this,
			udfDefinition = tf.UDFDefinition.get(gridType),
			udfRequiredFields = udfDefinition ? udfDefinition.userDefinedFields.filter(udf =>
				(udf.SystemDefined || udf.UDFDataSources.some(db => db.DBID === tf.datasourceManager.databaseId)) && udf.Required
			).map(udf =>
			{
				return {
					name: udf.OriginalName,
					title: udf.DisplayName,
					udfId: udf.UDFId
				}
			}) : [];

		self.requiredFields[gridType] = self.requiredFields[gridType]
			? self.requiredFields[gridType].filter(field => !field.udfId).concat(udfRequiredFields)
			: udfRequiredFields;
	};

	/**
	 * handle layout which is stored before refactor. RW-6465
	 */
	DetailViewHelper.prototype.preprocessPreviousLayout = function(entity, gridType)
	{
		var self = this,
			handledEntity = {};
		$.extend(handledEntity, entity);
		handledEntity.Layout.items = entity.Layout.items.map(function(item)
		{
			if (!item.field) return self.compressDataBlockDescriptor(item);
			var dataPoint = self.getDataPointByIdentifierAndGrid(item.field, gridType);

			return dataPoint ? self.compressDataBlockDescriptor(item) : self.getCompatibleSpacer(item);
		});

		return handledEntity;
	};


	DetailViewHelper.prototype.processImportLayoutPipeline = function(entity, gridType)
	{
		var self = this;

		return Promise.resolve(entity).then(function(entity)
		{
			return self.reviseLayout(entity, gridType);
		}).then(function(entity)
		{
			return self.preprocessPreviousLayout(entity, gridType);
		});
	};

	//Same UDF id would be different, so we try to distinguish these UDFs by UDFGuid.
	DetailViewHelper.prototype.reviseLayout = function(entity, gridType)
	{
		var self = this,
			layout = entity.Layout,
			colNum = layout.width;

		gridType = gridType.toLowerCase();

		layout.items = layout.items.map(function(item)
		{
			return self.reviseDataBlockItem(item, colNum);
		}).filter(function(i)
		{
			return !!i;
		});

		return entity;
	};

	DetailViewHelper.prototype.reviseDataBlockItem = function(itemObj, colNum)
	{
		var self = this,
			w = parseInt(itemObj.w),
			h = parseInt(itemObj.h),
			x = parseInt(itemObj.x),
			y = parseInt(itemObj.y);

		switch (itemObj.type)
		{
			case "verticalLine":
				if (isNaN(h) || isNaN(x) || isNaN(y))
				{
					return "";
				}

				return x <= colNum ? itemObj : "";
			case "horizontalLine":
				if (isNaN(w) || isNaN(x) || isNaN(y))
				{
					return "";
				}

				return x + w <= colNum ? itemObj : "";
			case "section-header":
				return !isNaN(y) ? itemObj : "";
			case "image":
			case "spacer":
			case "Map":
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return "";
				}
				return itemObj;
			case "UDGrid":
			case "grid":
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return "";
				}

				if (!Array.isArray(itemObj.columns) || !itemObj.columns.length)
				{
					return "";
				}

				itemObj.columns = itemObj.columns.filter(function(column)
				{
					return Number(column) !== column;//Exported grid data block has a UDF column which don't have UDFGuid.
				}).map(function(column)
				{
					if (typeof column === "object")
					{
						if (!column.UDFGuid)
						{
							return "";
						}

						if (!tf.UDFDefinition.getUDFByGuid(column.UDFGuid))
						{
							return "";
						}
					}

					return column;
				}).filter(function(i)
				{
					return !!i;
				});

				return itemObj.columns.length ? itemObj : "";

			case "tab":
				itemObj.dataSource = (itemObj.dataSource || []).map(function(tabItem)
				{
					tabItem.items = (tabItem.items || []).map(function(item)
					{
						return self.reviseDataBlockItem(item, itemObj.w);
					}).filter(function(i)
					{
						return !!i;
					});

					return tabItem;
				});

				return itemObj;
			default:
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return "";
				}
				if (!itemObj.field)
				{
					if (!itemObj.UDFGuid)
					{
						return self.getCompatibleSpacer(itemObj);
					}
					else if (!tf.UDFDefinition.getUDFByGuid(itemObj.UDFGuid))
					{
						return self.getCompatibleSpacer(itemObj);
					}
				}
				return itemObj;
		}
	};

	/**
	 * Validate the layout entity.
	 * @param {Object} layoutEntity
	 * @param {String} gridType
	 * @return {Boolean}
	 */
	DetailViewHelper.prototype.validateLayoutEntity = function(entity, gridType)
	{
		var self = this,
			layout = entity.Layout,
			items = layout.items,
			colNum = layout.width;

		gridType = gridType.toLowerCase();

		return items.reduce(function(result, currentItem)
		{
			if (!result)
			{
				return result;
			}

			return self.validateDataBlockItem(currentItem, colNum);
		}, true);
	};

	/**
	 * Check if the data block item is valid.
	 * @param {Object} item
	 * @param {Number} colNum
	 * @return {Boolean}
	 */
	DetailViewHelper.prototype.validateDataBlockItem = function(itemObj, colNum)
	{
		var w = parseInt(itemObj.w),
			h = parseInt(itemObj.h),
			x = parseInt(itemObj.x),
			y = parseInt(itemObj.y);

		switch (itemObj.type)
		{
			case "verticalLine":
				if (isNaN(h) || isNaN(x) || isNaN(y))
				{
					return false;
				}

				return x <= colNum;
			case "horizontalLine":
				if (isNaN(w) || isNaN(x) || isNaN(y))
				{
					return false;
				}

				return x + w <= colNum;
			case "section-header":
				return !isNaN(y);
			case "image":
			case "spacer":
			case "Map":
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return false;
				}
				break;
			case "UDGrid":
			case "grid":
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return false;
				}
				return Array.isArray(itemObj.columns) && itemObj.columns.length > 0;
			case "tab":
				var i = j = 0;
				for (; i < itemObj.dataSource.length; i++)
				{
					var tabItem = itemObj.dataSource[i];
					for (; j < tabItem.items.length; j++)
					{
						if (!this.validateDataBlockItem(tabItem.items[j], itemObj.w))
						{
							return false;
						}
					}
				}
				break;
			default:
				if (isNaN(h) || isNaN(x) || isNaN(y) || isNaN(w))
				{
					return false;
				}
				if (!itemObj.field && !itemObj.UDFId)
				{
					return false;
				}
				break;
		}

		return true;
	};

	/**
	 * Get the matched data point.
	 * @param {String} gridType
	 * @param {Number/String} identifier
	 */
	DetailViewHelper.prototype.getDataPointByIdentifierAndGrid = function(identifier, gridType, includeEntityKey)
	{
		var key = typeof identifier === "number" ? "UDFId" : "field",
			udfDataPoints = gridType ? (dataPointsJSON[gridType]["User Defined"] || []) : [],
			generalPoints = _.flatMap(dataPointsJSON[gridType]).filter(function(p)
			{
				return !udfDataPoints.includes(p);
			}),
			matched = (typeof identifier === "number" ? udfDataPoints : generalPoints).filter(function(p)
			{
				return p[key] === identifier || (includeEntityKey && p.editType && p.editType.entityKey === identifier);
			});

		if (matched.length === 1)
		{
			return $.extend(true, {}, matched[0]);
		}
		else if (matched.length === 0)
		{
			console.warn(String.format("No data point for UDF id {0} found. Maybe deleted in data point json or UDF", identifier));
		}
		else
		{
			console.warn(String.format("Data point for UDF id {0} has duplicated items in data point json and UDF", identifier));
			return $.extend(true, {}, matched[0]);
		}
	};

	DetailViewHelper.prototype.getUDGridDataPoint = function(identifier, gridType)
	{
		var key = typeof identifier === "number" ? "UDFId" : "field",
			udfDataPoints = dataPointsJSON[gridType]["User Defined"] || [],
			DRTRSDataPoints = dataPointsJSON[gridType]["State Report Fields"] || [],
			udfDataPoints = udfDataPoints.concat(DRTRSDataPoints),
			card = (dataPointsJSON[gridType]["Primary Information"] || []).filter(e => e.field === 'Card'),
			cardPoints = card && card[0] ? card[0].innerFields : [];
		var generalPoints = [..._.flatMap(dataPointsJSON[gridType]), ...cardPoints].filter(function(p)
		{
			return !udfDataPoints.includes(p) || p.field == 'UDGrid';
		}),
			matched = (typeof identifier === "number" ? udfDataPoints : generalPoints).filter(function(p)
			{
				return p[key] === identifier || (includeEntityKey && p.editType && p.editType.entityKey === identifier);
			});

		if (matched.length === 1)
		{
			return $.extend(true, {}, matched[0]);
		}
		else if (matched.length === 0)
		{
			console.warn(String.format("No data point for UDF id {0} found. Maybe deleted in data point json or UDF", identifier));
		}
		else
		{
			console.warn(String.format("Data point for UDF id {0} has duplicated items in data point json and UDF", identifier));
			return $.extend(true, {}, matched[0]);
		}
	};

	/**
	 * Check whether a layout template's name is unique or not.
	 *
	 * @param {object} paramData
	 * @param {number} currentLayoutId
	 * @returns
	 */
	DetailViewHelper.prototype.isLayoutTemplateNameUnique = function(paramData, currentLayoutId)
	{
		var self = this;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), { paramData: paramData }, { overlay: false }).then(function(response)
		{
			return !(response.Items[0] && currentLayoutId !== self.NEW_LAYOUT_ID && response.Items[0].Id != currentLayoutId);
		});
	}

	/**
	 * TODO:
	 * It is a temporary solution of detail view template changed from Id to ID
	 * It will be removed after removing DetailScreenLayoutDataModel.js.
	 */
	DetailViewHelper.prototype.formatLayoutTemplate = function(layoutTemplate)
	{
		return {
			Id: layoutTemplate.Id ? layoutTemplate.Id : layoutTemplate.ID,
			Name: layoutTemplate.Name,
			DataTypeId: layoutTemplate.DataTypeId,
			Layout: layoutTemplate.Layout,
			SubTitle: layoutTemplate.SubTitle,
		}
	}

	/**
	 * Only for custom dasboard
	 */
	DetailViewHelper.prototype.compressWidgetItemDescriptor = function(layoutItem)
	{
		var self = this,
			descriptor = {
				x: layoutItem.x,
				y: layoutItem.y,
				w: layoutItem.w,
				h: layoutItem.h,
				type: layoutItem.type,
				isHidden: layoutItem.isHidden,
				uniqueClassName: layoutItem.uniqueClassName
			};

		switch (layoutItem.type)
		{
			case "DashboardMap":
				break;
			case "DashboardGrid":
				descriptor.gridLayout = layoutItem.gridLayout;
				break;
			case "DashboardVisualization":
				break;
			case "DashboardDataCard":
				break;
			case "image":
				descriptor = self.compressDataBlockDescriptor(layoutItem);
				delete descriptor.imageId;
				if (!descriptor.image)
				{
					delete descriptor.image;
				}
				break;
			case "verticalLine":
			case "horizontalLine":
				// convert undefined to false
				descriptor.isHidden = !!descriptor.isHidden;
				delete descriptor.uniqueClassName;
				break;
			default:
				descriptor = self.compressDataBlockDescriptor(layoutItem);
				break;
		}

		return descriptor;
	};

	/**
	 * Only save requried info to db, and we can retrieve the others from saved info.
	 */
	DetailViewHelper.prototype.compressDataBlockDescriptor = function(layoutItem)
	{
		var self = this,
			descriptor = {
				x: layoutItem.x,
				y: layoutItem.y,
				w: layoutItem.w,
				h: layoutItem.h,
				type: layoutItem.type,
				appearance: self.handleAppearance(layoutItem.appearance),
				isHidden: layoutItem.isHidden,
				distance: layoutItem.distance,
				ownedBy: layoutItem.ownedBy,
				uniqueClassName: layoutItem.uniqueClassName,
				UDFId: layoutItem.UDFId,
				id: layoutItem.id//for group item only
			};

		switch (layoutItem.type)
		{
			case "spacer":
				break;
			case "section-header":
				delete descriptor.x;
				delete descriptor.h;
				delete descriptor.w;
				delete descriptor.isHidden;
				if (layoutItem.isCollapsed)
				{
					descriptor.isCollapsed = layoutItem.isCollapsed;
				}
				if (layoutItem.title && layoutItem.title.toLowerCase() !== self.defaultSectionHeaderTitle.toLowerCase())
				{
					descriptor.title = layoutItem.title;
				}
				break;
			case "image":
				descriptor.image = layoutItem.image;
				descriptor.imageId = layoutItem.imageId;
				if (descriptor.image)
				{
					delete descriptor.image.fileName;
				}
				break;
			case "UDGrid":
				descriptor.UDGridId = layoutItem.UDGridId;
			case "grid":
				descriptor.sort = layoutItem.sort;
				descriptor.filter = layoutItem.filter;
				descriptor.columns = layoutItem.columns;
				descriptor.showQuickFilter = layoutItem.showQuickFilter;
				descriptor.showSummary = layoutItem.showSummary;
				descriptor.field = layoutItem.field;
				break;
			case "multipleGrid":
				descriptor.field = layoutItem.field;
				descriptor.customizedTitle = layoutItem.customizedTitle;
				descriptor.grids = layoutItem.grids;
				break;
			case "Map":
				descriptor.thematicId = layoutItem.thematicId;
				descriptor.thematicName = layoutItem.thematicName;
				descriptor.isLegendOpen = layoutItem.isLegendOpen;
				descriptor.legendNameChecked = layoutItem.legendNameChecked;
				descriptor.legendDescriptionChecked = layoutItem.legendDescriptionChecked;
				descriptor.basemap = layoutItem.basemap;
				descriptor.field = layoutItem.field;
				break;
			case "Calendar":
			case "File":
			case "Boolean":
			case "RecordPicture":
				descriptor.field = layoutItem.field;
				break;
			case "Schedule":
				descriptor.field = layoutItem.field;
				descriptor.customizedTitle = layoutItem.customizedTitle;
				break;
			case "tab":
				descriptor.dataSource = (layoutItem.dataSource || []).map(function(tabItem)
				{
					tabItem.items = (tabItem.items || []).map(function(item)
					{
						return self.compressDataBlockDescriptor(item);
					});

					return tabItem;
				});
				descriptor.defaultIndex = layoutItem.defaultIndex;
				break;
			case "verticalLine":
			case "horizontalLine":
				delete descriptor.uniqueClassName;
				break;
			default:
				descriptor.field = layoutItem.field;
				descriptor.conditionalAppearance = layoutItem.conditionalAppearance;
				descriptor.customizedTitle = layoutItem.customizedTitle;
				break;
		}

		Object.keys(descriptor).forEach(function(key)
		{
			if (descriptor[key] === null || descriptor[key] === undefined)
			{
				delete descriptor[key];
			}
		});

		if (!descriptor.appearance || Object.keys(descriptor.appearance).length == 0)
		{
			delete descriptor.appearance;
		}

		if (descriptor.customizedTitle === layoutItem.title)
		{
			delete descriptor.customizedTitle;
		}

		if (!descriptor.isHidden)
		{
			delete descriptor.isHidden;
		}

		if (!descriptor.columns || descriptor.columns.length == 0)
		{
			delete descriptor.columns;
		}
		else
		{
			descriptor.columns = descriptor.columns.map(function(column)
			{
				if (typeof column !== "object")
				{
					return column;
				}
				else if (column.UDFId)
				{
					var udf = tf.UDFDefinition.getUDFById(column.UDFId);

					return {
						UDFId: column.UDFId,
						UDFGuid: udf && udf.UDFGuid
					}
				}
				else if (descriptor.type == 'UDGrid')
				{
					return column.FieldName;	// For UDGrid, FieldName is Guid (which should be unique and unchanged during lifetime in DB)
				}

				return column.FieldName;
			});
		}

		if (descriptor.UDFId)
		{
			delete descriptor.field;
			var udf = tf.UDFDefinition.getUDFById(descriptor.UDFId);
			descriptor.UDFGuid = udf && udf.UDFGuid;
		}

		return descriptor;
	};

	DetailViewHelper.prototype.handleAppearance = function(appearance)
	{
		if (!appearance) return {};

		if (typeof appearance === "string")
		{
			try
			{
				appearance = JSON.parse(appearance);
			}
			catch (error)
			{
				return {};
			}
		}

		if (typeof appearance !== "object" || appearance === null)
		{
			return {};
		}

		var self = this;

		return Object.keys(self.defaultColors).reduce(function(result, key)
		{
			if (appearance[key] && appearance[key].toLowerCase() !== self.defaultColors[key].toLowerCase())
			{
				result[key] = appearance[key];
			}

			return result;
		}, {});
	};

	DetailViewHelper.prototype.decompressDataBlockDescriptor = function(descriptor, gridType)
	{
		if (!descriptor || (!descriptor.field && !descriptor.UDFId && !descriptor.UDGridFieldId && !descriptor.UDGridId))
		{
			return descriptor;
		}

		let originalDataPoint = null;

		if (descriptor.UDGridID != null)
		{
			if (descriptor.UDGridFieldId == null)
			{
				originalDataPoint = $.extend({}, descriptor, {
					columns: ["Name", "FileName", "Description", "Action"],
					field: "DocumentGrid",
					title: "Documents Grid",
					type: "grid",
					url: "document",
				});
			}
			else
			{
				originalDataPoint = tf.udgHelper.getDataPointByIdentifierAndGrid(descriptor.UDGridFieldId, descriptor.UDGridID, gridType);
			}
		}
		else if (descriptor.UDGridId)
		{
			originalDataPoint = tf.udgHelper.getDataPointByUDGridId(descriptor.UDGridId, gridType);
		}
		else
		{
			originalDataPoint = this.getDataPointByIdentifierAndGrid(descriptor.UDFId || descriptor.field, gridType);
		}

		if (!originalDataPoint)
		{
			return this.getCompatibleSpacer(descriptor);
		}

		/**
		 * The aim of invoking this.compressDataBlockDescriptor(descriptor) is
		 * to remove verbose data from saved template
		 * and apply latest value from data point json or udf config.
		 */

		var result = $.extend({ minHeight: originalDataPoint["min-height"] }, originalDataPoint, this.compressDataBlockDescriptor(descriptor));
		if (result.type == "grid" && result.columns && result.columns.length)
		{
			result.columns = result.columns.map(function(column)
			{
				if (Number(column) === column)
				{
					return tf.UDFDefinition.getFieldNameById(column);
				}
				else if (typeof column === "object")
				{
					return tf.UDFDefinition.getFieldNameById(column.UDFId);
				}
				return column;
			}).filter(function(c)
			{
				return !!c;
			});
		}

		return result;
	}

	DetailViewHelper.prototype.getCompatibleSpacer = function(descriptor)
	{
		var spacer = {
			type: "spacer",
			x: descriptor.x,
			y: descriptor.y,
			w: descriptor.w,
			h: descriptor.h,
			isHidden: descriptor.isHidden,
			uniqueClassName: descriptor.uniqueClassName,
			distance: descriptor.distance,
			ownedBy: descriptor.ownedBy
		};

		return this.compressDataBlockDescriptor(spacer);
	};

	DetailViewHelper.prototype._getDataPointsField = function(gridType)
	{
		var dataPointsField = [],
			dataPoints = dataPointsJSON[gridType];
		for (var key in dataPoints)
		{
			var fields = dataPoints[key].map(function(item)
			{
				if (item.UDFId)
				{
					return { field: item.field, udfId: item.UDFId };
				}
				return {
					field: item.field,
					entityKey: item.editType ? item.editType.entityKey : null,
					innerFields: item.innerFields
				};
			});
			dataPointsField = dataPointsField.concat(fields);
		}
		return dataPointsField;
	};

	/**
	 * Get specific data point data by type and field (entityKey)
	 *
	 * @param {string} type
	 * @param {string} field
	 * @returns
	 */
	DetailViewHelper.prototype.getDataPointByTypeAndField = function(type, field)
	{
		return _.flatMap(dataPointsJSON[type]).find(function(item)
		{
			return item.field === field || (item.editType && item.editType.entityKey === field);
		});
	};

	/**
	 * Check if the given field is editable.
	 *
	 * @param {string} type
	 * @param {string} field
	 * @returns
	 */
	DetailViewHelper.prototype.checkFieldEditability = function(type, field)
	{
		var dataPoint = this.getDataPointByIdentifierAndGrid(field, type, true);

		return dataPoint && dataPoint.editType && this.editableThroughEditType(dataPoint.editType);
	};

	DetailViewHelper.prototype.editableThroughEditType = function(editType, recordEntity)
	{
		return editType.allowEdit == null
			|| (typeof editType.allowEdit == 'boolean' && editType.allowEdit)
			|| (typeof editType.allowEdit == 'function' && editType.allowEdit(recordEntity));
	};
	
	DetailViewHelper.prototype.validateRequiredFields = function(layoutObj, gridType)
	{
		var self = this,
			requiredFields = self.getRequiredFields(gridType).filter(({ field }) => !(gridType === "fieldtrip" && ["AccountName", "PurchaseOrder"].includes(field))),
			dataPointsField = self._getDataPointsField(gridType),
			missingFields = [],
			layoutFields = [],
			filter = function(layout)
			{
				layout.items.forEach(function(item)
				{
					var dataPoint = dataPointsField.filter(function(pointField)
					{
						if (item.UDFId)
						{
							return item.UDFId === pointField.udfId;
						}
						return pointField.field === item.field;
					});
					layoutFields = layoutFields.concat(dataPoint);
					if (item.dataSource)
					{
						item.dataSource.forEach(function(child)
						{
							filter(child)
						})
					}
				})
			};

		filter(layoutObj);

		const compare = (a, b) => a.field === b.name || a.entityKey === b.name;

		for (var i = 0, count = requiredFields.length; i < count; i++)
		{
			var requiredField = requiredFields[i];
			if (!layoutFields.some(function(layoutField)
			{
				if (layoutField.udfId)
				{
					return layoutField.udfId === requiredField.udfId;
				}

				return compare(layoutField, requiredField) || (Array.isArray(layoutField.innerFields) && layoutField.innerFields.some(o => compare(o, requiredField)));
			}))
			{
				missingFields.push(requiredField);
			}
		}

		return missingFields;
	};

	DetailViewHelper.prototype.getRequiredFields = function(gridType)
	{
		return this.requiredFields[gridType] || [];
	};

	/**
	 * format number to the week day.
	 * @param {integer} dayNum
	 * @return {String}
	 */
	DetailViewHelper.prototype.formatWeekDay = function(dayNum)
	{
		var weekDay = "";
		switch (dayNum)
		{
			case 0:
				weekDay = "Monday";
				break;
			case 1:
				weekDay = "Tuesday";
				break;
			case 2:
				weekDay = "Wednesday";
				break;
			case 3:
				weekDay = "Thursday";
				break;
			case 4:
				weekDay = "Friday";
				break;
			case 5:
				weekDay = "Saturday";
				break;
			case 6:
				weekDay = "Sunday";
				break;
			case 7:
				weekDay = "Weekly";
				break;
			default:
				break;
		}
		return weekDay;
	};

	DetailViewHelper.prototype.tryConvertUDFSubTitle = function(subtitleField)
	{

		let templateSubtitle = subtitleField;
		if (templateSubtitle && templateSubtitle.length > 0)
		{
			if (!isNaN(Number(templateSubtitle)))
			{
				templateSubtitle = Number(templateSubtitle);
			}
		}
		return templateSubtitle;
	}


	/**
	 * Process the data content.
	 * @param {Object} item
	 * @param {String} content
	 * @return {String}
	 */
	DetailViewHelper.prototype.formatDataContent = function(content, type, format, UDFItem)
	{
		if (content === null || content === undefined)
		{
			return "";
		}

		var self = this;

		switch (type)
		{
			case "String":
			case "Email":
				content = self.formatStringContent(content, format);
				break;
			case "Number":
			case "Currency":
				content = self.formatNumberContent(content, format, UDFItem);
				break;
			case "Date":
				content = moment(content).format("MM/DD/YYYY");
				break;
			case "Time":
				content = self.formatTimeContent(content, format);
				break;
			case "Date/Time":
				content = moment(content).format("MM/DD/YYYY hh:mm A")
				break;
			case "Note":
				content = String(content).replace(" ", "&nbsp;").replace(/\n/g, '</br>');
				break;
			default:
				switch (format)
				{
					case "Time":
						var start = new Date();
						start.setHours(0, 0, content, 0);
						content = moment(start).format("HH:mm:ss");
						break;
					case "Money":
						content = "$" + parseFloat(content).toFixed(2);
						break;
					case "Public":
						content = content ? "Public" : "Private";
					default:
						break;

				}
				break;
		}

		return content;
	};

	/**
	 * Format number content in data blocks.
	 *
	 * @param {string} content
	 * @param {string} format
	 * @param {object} UDFItem
	 * @returns
	 */
	DetailViewHelper.prototype.formatNumberContent = function(content, format, UDFItem)
	{
		var value = parseFloat(content);

		if (isNaN(value)) return "None";

		if (UDFItem)
		{
			var precision = UDFItem.Type === "Currency" ? UDFItem.MaxLength : UDFItem.NumberPrecision;
			return value.toFixed(_.isNumber(precision) ? precision : 0);
		}

		var precisionRegExp = new RegExp(/^([0][.]*[0]*)$/);
		if (precisionRegExp.test(format))
		{
			var dotSplit = format.split("."),
				length;
			if (dotSplit.length === 1)
			{
				length = 0;
			}
			else
			{
				length = dotSplit[1].length;
			}

			content = value.toFixed(length);
		}
		else if (format === "Money")
		{
			content = "$" + value.toFixed(2);
		}
		else
		{
			var contentNumber = Number(content);
			if (!isNaN(contentNumber))
			{
				content = contentNumber;
			}
		}

		return content;
	};

	/**
	 * Format string content in data blocks.
	 *
	 * @param {string} content
	 * @returns
	 */
	DetailViewHelper.prototype.formatStringContent = function(content, format)
	{
		content = _.trim(content);
		while (content.startsWith('\n'))
		{
			content = content.replace('\n', '');
		}

		if (["Phone", "Fax"].includes(format))
		{
			content = tf.dataFormatHelper.phoneFormatter(content);
		}
		return content;
	}

	/**
	 * get unique class name of data block
	 * @param {JQuery Object} $dom
	 */
	DetailViewHelper.prototype.getDomUniqueClassName = function(dom)
	{
		var dom = dom instanceof jQuery ? dom[0] : dom;
		return Array.from(dom.classList).map(function(name)
		{
			return name.trim();
		}).find(function(name)
		{
			return name.startsWith('grid-unique');
		});
	}

	/**
	 * get unique class name of data block
	 * @param {Object} dataBlock
	 */
	DetailViewHelper.prototype.getBlockUniqueClassName = function(dataBlock)
	{
		return '.' + this.getDomUniqueClassName(dataBlock.$el);
	}

	/**
	 * get unique class name of data block
	 * @param {grid stack node} node
	 */
	DetailViewHelper.prototype.getNodeUniqueClassName = function(node)
	{
		return '.' + this.getDomUniqueClassName(node.el);
	};

	/**
	 * Create the dom with given content and styles.
	 *
	 * @param {string} content
	 * @param {object} dataBlockStyles
	 * @returns
	 */
	DetailViewHelper.prototype.getItemContent = function(content, dataBlockStyles)
	{
		content = (content.split ? content.split(" ").join("&nbsp;") : content);
		return $(String.format("<div data-placeholder='None' class='item-content' style='color:{0}'>{1}</div>", dataBlockStyles.contentColor, content));
	};

	/**
	 * Format time content in data blocks.
	 *
	 * @param {string} content
	 * @param {string} format
	 * @returns
	 */
	DetailViewHelper.prototype.formatTimeContent = function(content, format)
	{
		function formatNumber(num)
		{
			return num > 9 ? num : "0" + num;
		}

		if (format === "TimeSpan")
		{
			if (!isNaN(Number(content)))
			{
				var num = Number(content);
				var hours = parseInt(num / 3600);
				var remainder = num % 3600;
				content = formatNumber(hours) + ":" + formatNumber(parseInt(remainder / 60)) + ":" + formatNumber(remainder % 60);
			}
		} else
		{
			var time = moment(content);
			content = time.isValid() ? time.format("hh:mm A") : moment("2018-01-01T" + content).isValid() ? moment("2018-01-01T" + content).format("hh:mm A") : "";
		}

		return content;
	};

	/**
	 * Compare values with specified operator.
	 * @param {Array} values
	 * @param {String} operator
	 * @return {Boolean}
	 */
	DetailViewHelper.prototype.compareTwoValues = function(values, operator)
	{
		switch (operator)
		{
			case "EqualTo":
				return values[0] === values[1];
			case "NotEqualTo":
				return values[0] !== values[1];
			case "Empty":
				return !values[0];
			case "NotEmpty":
				return !!values[0];
			case "LessThan":
				return values[0] < values[1];
			case "LessThanOrEqualTo":
				return values[0] <= values[1];
			case "GreaterThan":
				return values[0] > values[1];
			case "GreaterThanOrEqualTo":
				return values[0] >= values[1];
			case "Contains":
				return values[0].indexOf(values[1]) !== -1;
			case "DoesNotContain":
				return values[0].indexOf(values[1]) === -1;
			case "StartsWith":
				return values[0].startsWith(values[1]);
			case "EndsWith":
				return values[0].endsWith(values[1]);
			case "On":
				return values[0].isValid() && values[0].isSame(values[1]);
			case "NotOn":
				return values[0].isValid() && !values[0].isSame(values[1]);
			case "Before":
				return values[0].isValid() && values[0].isBefore(values[1]);
			case "OnOrBefore":
				return values[0].isValid() && !values[0].isAfter(values[1]);
			case "After":
				return values[0].isValid() && values[0].isAfter(values[1]);
			case "OnOrAfter":
				return values[0].isValid() && !values[0].isBefore(values[1]);
			case "Between":
				return values[0].isValid() && !values[0].isBefore(values[1]) && !values[0].isAfter(values[2]);
			default:
				return false;
		}
	};

	/**
	 * Set item data into item dom.
	 * @returns {void}
	 */
	DetailViewHelper.prototype.setStackBlockData = function($itemDom, item, role)
	{
		let data = {
			field: item.field,
			defaultValue: item.defaultValue,
			type: item.type,
			nullAvatar: item.nullAvatar,
			editType: item.editType,
			UDFId: item.UDFId,
			format: item.format,
			title: item.title,
			customizedTitle: item.customizedTitle,
			appearance: JSON.stringify(item.appearance),
			role: role,
			conditionalAppearance: item.conditionalAppearance,
			url: item.url,
			subUrl: item.subUrl,
			uniqueClassName: item.uniqueClassName,
			positiveLabel: item.positiveLabel,
			negativeLabel: item.negativeLabel,
		};

		if (item.UDGridFieldId != null)
		{
			data.UDGridField = {
				UDGridFieldId: item.UDGridFieldId,
				Guid: item.Guid,
				FieldOptions: item.FieldOptions,
			};
		}

		$itemDom.data(data);
	};

	/**
	 * Get unique values for specified grid type.
	 *
	 * @param {String} gridType
	 * @returns
	 */
	DetailViewHelper.prototype._getUniqueValues = function(gridType)
	{
		var obj = this.uniqueFields[gridType];

		if (obj)
		{
			var result = {},
				endpoint = tf.DataTypeHelper.getEndpoint(gridType),
				fieldList = obj.map(function(item)
				{
					result[item.field] = {
						//key: item.field,
						title: item.title,
						values: []
					};

					return item.field;
				}),
				fieldStr = fieldList.join(",");

			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), endpoint + "?@fields=Id," + fieldStr))
				.then(function(response)
				{
					response.Items.map(function(item)
					{
						fieldList.map(function(field)
						{
							var stack = result[field].values,
								value = item[field];

							if (stack.indexOf(value) === -1)
							{
								stack.push(value);
							}
						});
					});

					return result;
				});
		}

		return Promise.resolve({});
	};

	/**
	 * Return a GUID (Global Unique ID).
	 *
	 * @returns
	 */
	DetailViewHelper.prototype.guid = function()
	{
		var s4 = function()
		{
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	};

	/**
	 * Check layout's eligibility to create a new record.
	 *
	 * @param {Object} layoutData
	 * @param {String} dataType
	 * @returns Error message if there is.
	 */
	DetailViewHelper.prototype.checkLayoutEligibilityToCreateNew = function(layoutData, dataType)
	{
		let errorMessage = "";
		let blameMessage = "";

		if (!layoutData)
		{
			blameMessage = "this layout is not available";
		}
		else
		{
			let missingFields = this.validateRequiredFields(layoutData, dataType);
			if (missingFields.length > 0)
			{
				const isSingle = missingFields.length === 1;
				const suffix = isSingle ? "" : "s";
				const link = isSingle ? "is" : "are";
				const fieldLabels = missingFields.map(field => `"${field.dataPointTitle}"`).join(", ");

				blameMessage = `required field${suffix} ${fieldLabels} ${link} missing`;
			}
		}

		if (blameMessage)
		{
			const dataTypeName = tf.dataTypeHelper.getFormalDataTypeName(dataType);

			errorMessage = `Cannot create a new ${dataTypeName} with current layout, because ${blameMessage}!`;
		}

		return errorMessage;
	};

	/**
	 * Get stored quick-add layout id for specified type.
	 *
	 * @param {String} type
	 * @returns
	 */
	DetailViewHelper.prototype.getQuickAddLayoutByType = function(type)
	{
		let self = this, getLayoutPromise = null, errMsg = "";
		const storageKey = `grid.detailscreenlayoutid.${type}.quickadd`;
		const quickAddLayoutId = tf.storageManager.get(storageKey);

		if (quickAddLayoutId)
		{
			getLayoutPromise = tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"),
				{ paramData: { "@filter": `eq(Id,${quickAddLayoutId})` } })
				.then(res => res && res.Items[0]);
		}

		return Promise.resolve(getLayoutPromise)
			.then(layout =>
			{
				if (!layout)
				{
					const typeName = tf.dataTypeHelper.getFormalDataTypeName(type);
					errMsg = `No quick-add layout available for ${typeName}, please select one first!`;
					return tf.promiseBootbox.alert(errMsg)
						.then(() =>
						{
							let manageModal = new TF.DetailView.ManageDetailScreenLayoutModalViewModel(type, null, true);
							return tf.modalManager.showModal(manageModal).then(() => null);
						});
				}
				else
				{
					let layoutData = JSON.parse(layout.Layout);
					errMsg = self.checkLayoutEligibilityToCreateNew(layoutData, type);
					if (errMsg)
					{
						tf.promiseBootbox.alert(errMsg);
						return;
					}
				}

				return layout;
			});
	};

	/**
	 * The the name of dafault layout by type.
	 *
	 * @param {String} type
	 * @returns
	 */
	DetailViewHelper.prototype.getDefaultLayoutNameByType = function(type)
	{
		var pluralName = tf.applicationTerm.getApplicationTermPluralByName(tf.DataTypeHelper.getFormalDataTypeName(type));
		return String.format('{0} DEFAULT LAYOUT', pluralName).toUpperCase();
	};

	DetailViewHelper.prototype.updateSectionHeaderTextInputWidth = function(sectionHeaders, $container)
	{
		var sectionHeaders = sectionHeaders || $container.find(".section-header-stack-item");

		$.each(sectionHeaders, function(index, item)
		{
			var $item = $(item),
				$div = $item.find("div.item-title-ruler"),
				$input = $item.find("input.item-title"),
				content = $input.val().toUpperCase(),
				width = Math.min($div.text(content).css("display", "inline").outerWidth(), $item.outerWidth() * 2 / 3);

			$item.attr("title", content);
			$input.width(width);
			$div.css("display", "none");
		});
	};

	DetailViewHelper.prototype.generateUniqueClassName = function()
	{
		return String.format("grid-unique-{1}{0}", Date.now(), Math.random().toString(36).substring(7));
	};

	/**
	 * Get default image for different data types.
	 * @param {string} gridType
	 */
	DetailViewHelper.prototype.getDefaultRecordPicture = function(gridType)
	{
		if (gridType === "student" || gridType === "staff")
		{
			return this.imgUrl + "staff-student.svg";
		} else if (gridType === "vehicle")
		{
			return this.imgUrl + "vehicle.svg";
		}
	};

	DetailViewHelper.prototype._getContactGridRecords = function(gridType, recordId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "contacts"), {
			paramData: {
				"databaseID": tf.datasourceManager.databaseId,
				"dataType": tf.DataTypeHelper.getFormalDataTypeName(gridType),
				"recordIds": recordId || 0
			}
		});
	};

	DetailViewHelper.prototype._getContactIds = function(gridType, recordId)
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "contacts"), {
			paramData: {
				"dataType": tf.dataTypeHelper.getDisplayNameByDataType(gridType),
				"recordIds": recordId || 0,
				"@fields": "Id"
			}
		}).then(response =>
		{
			return response;
		});
	};

	DetailViewHelper.prototype.getContactGridTotalCount = function(gridType, recordId)
	{
		var self = this;
		return self._getContactGridRecords(gridType, recordId).then(function(response)
		{
			return response.TotalRecordCount;
		});
	};

	DetailViewHelper.prototype._getDocumentGridRecords = function(columnFields, gridType, recordId)
	{
		var excludeFields = ['FileContent'];

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "documentrelationships"), {
			paramData: {
				"DBID": tf.datasourceManager.databaseId,
				"AttachedToID": recordId || 0,
				"AttachedToType": tf.DataTypeHelper.getId(gridType),
				"@fields": "DocumentID"
			}
		}).then(function(idResponse)
		{
			var includeIds = idResponse.Items.map(function(item)
			{
				return item.DocumentID;
			});

			return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "search", "documents"), {
				data: {
					fields: columnFields.filter(function(name)
					{
						return excludeFields.indexOf(name) === -1;
					}),
					filterClause: "",
					filterSet: null,
					idFilter: {
						IncludeOnly: includeIds,
						ExcludeAny: []
					},
					sortItems: [{
						Name: "Id",
						isAscending: "asc",
						Direction: "Ascending"
					}]
				}
			});
		});
	};

	DetailViewHelper.prototype.getDocumentGridTotalCount = function(gridType, recordId)
	{
		var self = this;
		return self._getDocumentGridRecords([], gridType, recordId).then(function(response)
		{
			return response.TotalRecordCount;
		});
	};

	DetailViewHelper.prototype.getMiniGridTotalCount = function(miniGridType, gridType, recordId)
	{
		var self = this,
			deferred = null;
		if (miniGridType === TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.CONTACT)
		{
			deferred = self.getContactGridTotalCount(gridType, recordId);
		} else if (miniGridType === TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.DOCUMENT)
		{
			deferred = self.getDocumentGridTotalCount(gridType, recordId);
		}

		return deferred;
	};

	DetailViewHelper.prototype.removeFromAllGridsDataSourceByIds = function($detailView, dataType, dataIds, total)
	{
		var self = this,
			updateSource = null,
			gridName = tf.dataTypeHelper.getGridNameByDataType(dataType),
			grids = self.getAllGridsAndColumns($detailView, gridName)["grids"];

		$.each(grids, function(_, item)
		{
			var $item = $(item),
				kendoGrid = $item.data("kendoGrid")

			if (!updateSource)
			{
				updateSource = kendoGrid.dataSource.data().slice();
				updateSource = updateSource.filter(function(entity)
				{
					return dataIds.indexOf(entity.Id) === -1;
				});
			}

			kendoGrid.dataSource.data(updateSource);
			tf.helpers.kendoGridHelper.updateGridFooter($item, updateSource.length, total || updateSource.length);
		});
	};

	DetailViewHelper.prototype.addEditRecordInQuickAddModal = function($detailView, recordType, gridType, recordEntity, recordId, pageLevelViewModel, isCreateGridNewRecord, attachedFile)
	{
		var self = this,
			hasPermission = tf.authManager.isAuthorizedForDataType(recordType, recordId ? "edit" : "add");

		if (!hasPermission)
		{
			// tf.promiseBootbox.alert(String.format("You don't have permission to create a new {0}.", tf.DataTypeHelper.getNameByType(recordType)));
			return;
		}

		return this.getQuickAddLayoutByType(recordType).then(function(layout)
		{
			if (!layout) return Promise.resolve(false);

			var options = {
				dataType: recordType,
				baseRecordType: gridType,
				baseRecordEntity: recordEntity,
				recordId: recordId,
				attachedFile: attachedFile,
				layoutEntity: layout,
				pageLevelViewModel: pageLevelViewModel
			};

			return tf.modalManager.showModal(new TF.DetailView.BasicQuickAddModalViewModel(options))
				.then(function(result)
				{
					if (result && result.success)
					{
						// In add new mode, and the associated equals to true.
						if (isCreateGridNewRecord)
						{
							if (result.associated)
							{
								if (recordId != null)
								{
									self.getMiniGridTotalCount(recordType, gridType, recordId)
										.then(function(totalCount)
										{
											self.updataGridDataById(recordType, [result.entity.Id], $detailView, totalCount);
										});
								}
								else
								{
									self.getMiniGridTotalCount(recordType, gridType, recordId)
										.then(function(totalCount)
										{
											self.appendToAllGridsDataSourceByIds(recordType, [result.entity.Id], totalCount, $detailView);
										});
								}
							}
						}
						// In edit mode and the associated equals to false.
						else if (!result.associated)
						{
							self.getMiniGridTotalCount(recordType, gridType, recordId)
								.then(function(totalCount)
								{
									self.removeFromAllGridsDataSourceByIds($detailView, recordType, [result.entity.Id], totalCount);
								});
						}
						else
						{
							self.getMiniGridTotalCount(recordType, gridType, recordId)
								.then(function(totalCount)
								{
									self.updataGridDataById(recordType, [result.entity.Id], $detailView, totalCount);
								});
						}
					}
				});
		});
	};

	DetailViewHelper.prototype.updataGridDataById = function(dataType, dataId, $detailView, total)
	{
		var self = this,
			gridName = tf.DataTypeHelper.getGridNameByDataType(dataType),
			info = self.getAllGridsAndColumns($detailView, gridName),
			grids = info["grids"],
			columns = info["columns"];
		tf.DataTypeHelper.getRecordByIdsAndColumns(tf.datasourceManager.databaseId, dataType, dataId, columns)
			.then(function(entities)
			{
				$.each(grids, function(_, item)
				{
					var $item = $(item);
					var preData = $item.data("kendoGrid").dataSource._pristineData;
					if (preData.map)
					{
						if (preData.filter(function(d) { return d.Id == entities[0].Id }).length > 0)
						{
							preData = preData.map(function(d)
							{
								if (d.Id == entities[0].Id)
								{
									return entities[0];
								}
								else
								{
									return d;
								}
							});
						}
						else
						{
							preData.push(entities[0]);
						}
					}
					$item.data("kendoGrid").dataSource.data(preData);
					tf.helpers.kendoGridHelper.updateGridFooter($item, preData.length, total != null ? total : preData.length);
				});
			});
	};

	DetailViewHelper.prototype.updateAllGridsDataSourceByIds = function(dataType, dataIds, total, $detailView)
	{
		var self = this,
			gridName = tf.DataTypeHelper.getGridNameByDataType(dataType),
			info = self.getAllGridsAndColumns($detailView, gridName),
			grids = info["grids"],
			columns = info["columns"];

		tf.DataTypeHelper.getRecordByIdsAndColumns(tf.datasourceManager.databaseId, dataType, dataIds, columns)
			.then(function(entities)
			{
				$.each(grids, function(_, item)
				{
					var $item = $(item);
					$item.data("kendoGrid").dataSource.data(entities);
					tf.helpers.kendoGridHelper.updateGridFooter($item, entities.length, total);
				});
			});
	};

	DetailViewHelper.prototype.appendToAllGridsDataSource = function(fieldName, appendList, total, $detailView)
	{
		var self = this,
			updateSource = null,
			grids = self.getAllGridsAndColumns($detailView, fieldName)["grids"];

		$.each(grids, function(_, item)
		{
			var $item = $(item),
				kendoGrid = $item.data("kendoGrid")

			if (!updateSource)
			{
				updateSource = kendoGrid.dataSource.data().slice();
				updateSource = updateSource.concat(appendList);
			}

			kendoGrid.dataSource.data(updateSource);
			tf.helpers.kendoGridHelper.updateGridFooter($item, updateSource.length, total);
		});
	};

	DetailViewHelper.prototype.getAllGridsAndColumns = function($detailView, fieldName)
	{
		var columns = [],
			grids = $detailView.find(".kendo-grid:not(.kendo-summarygrid-container)")
				.filter(function(_, item)
				{
					var $item = $(item),
						fieldData = $item.closest(".grid-stack-item").data();
					if (fieldData && fieldData.field === fieldName)
					{
						var kendoGrid = $item.data("kendoGrid");

						kendoGrid.columns.filter(x => x.field != "bulk_menu").forEach(function(col)
						{
							if (columns.indexOf(col.FieldName) === -1)
							{
								columns.push(col.FieldName);
							}
						});

						return true;
					}

					return false;
				});

		switch (fieldName)
		{
			case "DocumentGrid":
				ensureRequiredDocumentFields(columns);
				break;
		}

		return {
			grids: grids,
			columns: columns
		};
	};

	DetailViewHelper.prototype.appendToAllGridsDataSourceByIds = function(dataType, dataIds, total, $detailView)
	{
		var self = this,
			updateSource = null,
			gridName = tf.DataTypeHelper.getGridNameByDataType(dataType),
			info = self.getAllGridsAndColumns($detailView, gridName),
			grids = info["grids"],
			columns = info["columns"];

		tf.DataTypeHelper.getRecordByIdsAndColumns(tf.datasourceManager.databaseId, dataType, dataIds, columns)
			.then(function(entities)
			{
				$.each(grids, function(_, item)
				{
					var $item = $(item),
						kendoGrid = $item.data("kendoGrid")

					if (!updateSource)
					{
						updateSource = kendoGrid.dataSource.data().slice();
						updateSource = updateSource.concat(entities);
					}

					kendoGrid.dataSource.data(updateSource);
					tf.helpers.kendoGridHelper.updateGridFooter($item, updateSource.length, total);
				});
			});
	};

	DetailViewHelper.prototype.updateRelationships = function(mainRecordType, mainRecordId, associateRecordType, associateRecordIds)
	{
		var relationshipType, path, mainUrl = tf.api.apiPrefix(),
			dataTypeId = tf.DataTypeHelper.getId(mainRecordType),
			associations = associateRecordIds.map(function(id)
			{
				return tf.DataTypeHelper.createAssociationEntity(mainRecordType, mainRecordId, associateRecordType, id);
			});

		if (associateRecordType === TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.CONTACT)
		{
			var paramData = {
				DataTypeID: dataTypeId,
				RecordID: mainRecordId,
				databaseId: tf.datasourceManager.databaseId
			};

			return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), tf.DataTypeHelper.getAssociationEndpoint(associateRecordType)), {
				paramData: paramData,
				data: associations
			});
		} else if (associateRecordType === TF.DetailView.DataBlockComponent.GridBlock.MINI_GRID_TYPE.DOCUMENT)
		{
			relationshipType = "DocumentRelationship";
			path = "/DocumentRelationships";

			return tf.promiseAjax.patch(tf.DataTypeHelper.getApiPrefix(mainRecordType), {
				data: [{
					Id: mainRecordId,
					"op": "relationship",
					"path": path,
					"value": JSON.stringify(associations)
				}],
				paramData: {
					"@relationships": relationshipType
				}
			});
		}
	};

	DetailViewHelper.prototype.renderSpecialDefaultContent = function(data, type)
	{
		var self = this,
			content = "";

		switch (type.toLowerCase())
		{
			case "address":
				var content = $("<div/>", { class: "item-content" }),
					$street = self.createSingleEditableField(data.street.title, data.street.text, ["one-half", "left-align"]),
					$zip = self.createSingleEditableField(data.zip.title, data.zip.text, ["one-half", "right-align"]),
					$city = self.createSingleEditableField(data.city.title, data.city.text, ["one-half", "left-align"]),
					$confidence = self.createSingleEditableField(data.confidence.title, data.confidence.text, ["one-half", "right-align"]);

				content.append($street, $zip, $city, $confidence);
				break;
			default:
				break;
		}

		return content;
	};

	DetailViewHelper.prototype.createSingleEditableField = function(title, text, classList)
	{
		var $field = $("<div/>", { class: "editable-field-container" }),
			$title = $("<div/>", { class: "editable-field-title", text: title }),
			$label = $("<div/>", { class: "editable-field-value", text: text });

		$field.addClass(classList.join(" "))
			.append($title, $label);

		return $field;
	};

	DetailViewHelper.prototype.getLayoutStickyName = function(dataType)
	{
		return "grid.detailscreenlayoutid." + dataType;
	};

	DetailViewHelper.prototype.fetchActiveLayoutData = function(dataType)
	{
		const stickyName = "grid.detailscreenlayoutid." + dataType;
		const stickyLayoutId = tf.storageManager.get(stickyName);
		const fetchLayoutsByParam = param => tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "detailscreens"), { paramData: param }).then(res => res.Items);

		let fetchRecord = null;

		if (stickyLayoutId)
		{
			fetchRecord = fetchLayoutsByParam({ Id: stickyLayoutId }).then(res => res[0]);
		}

		return Promise.resolve(fetchRecord)
			.then(record =>
			{
				if (!record)
				{
					const dataTypeId = tf.DataTypeHelper.getId(dataType);
					return fetchLayoutsByParam({ dataTypeId: dataTypeId }).then(items => items[0]);
				}

				return record;
			})
			.then(record => record && JSON.parse(record.Layout));
	};

	DetailViewHelper.prototype.getUnitOfMeasureSupportedFields = function(gridType)
	{
		return _.flatMap(dataPointsJSON[gridType]).filter((x) => x.UnitOfMeasureSupported);
	};

	DetailViewHelper.prototype.dispose = function()
	{

	};

	/**
	 * Ensure all required fields for document entity type is included in the fields collection
	 * @param {Array} fields
	 */
	function ensureRequiredDocumentFields(fields)
	{
		var requiredDocumentFields = ['Name', 'FileName', 'MimeType'];
		$.each(requiredDocumentFields, function(_, field)
		{
			if (fields.indexOf(field) < 0) fields.push(field);
		});
	}

	DetailViewHelper.changeLayoutWidth = function(layout, newLayoutWidth)
	{
		if (layout.width <= newLayoutWidth)
		{
			return layout;
		}

		var layoutWidth = layout.width = newLayoutWidth;
		var filledBlocks = initFilledBlocks();
		var blocks = layout.items = filterAndSortBlocks(layout.items);

		blocks.forEach(function(block)
		{
			var w = block.w,
				h = block.h;

			if (w > layoutWidth)
			{
				w = layoutWidth;
			}

			var newPosition = getNewPosition(filledBlocks, w, layoutWidth);
			filledBlocks = getNewFilledBlocks(filledBlocks, newPosition, w, h);

			block = $.extend(block, { x: newPosition.x, y: newPosition.y, w: w });
		});

		return layout;

		function initFilledBlocks()
		{
			var filledBlocks = [];
			for (var i = 0; i < layoutWidth; i++)
			{
				filledBlocks.push({ x: i, y: -1 });
			}

			return filledBlocks;
		}

		function filterAndSortBlocks(blocks)
		{
			var ignoredTypeList = ["spacer", "verticalLine", "horizontalLine"];
			blocks = blocks.filter(function(b)
			{
				return b.w > 0 && ignoredTypeList.indexOf(b.type) < 0;
			});

			blocks = blocks.sort(function(a, b)
			{
				if (a.y === b.y)
				{
					return a.x - b.x;
				}
				return a.y - b.y;
			});

			return blocks;
		}

		function getScanStartPosition(filledBlocks)
		{
			var ret;
			var yStart = Number.MAX_VALUE;
			filledBlocks.forEach(function(b)
			{
				if (b.y < yStart)
				{
					ret = {
						x: b.x,
						y: b.y + 1
					};
					yStart = b.y;
				}
			});

			return ret;
		}

		function scanBlocks(filledBlocks, x, y, w, layoutWidth)
		{
			if (x + w <= layoutWidth)
			{
				var scanLength = w;
				var canPutNewBlockInThisPosition = true;
				for (var offsetX = x; (offsetX < layoutWidth && scanLength > 0); offsetX++)
				{
					scanLength--;
					var isFilledBlock = (filledBlocks[offsetX].y >= y);
					if (isFilledBlock)
					{
						canPutNewBlockInThisPosition = false;
						break;
					}
				}

				if (canPutNewBlockInThisPosition)
				{
					return {
						x: x,
						y: y
					};
				}
			}

			x = x + 1;
			if (x > layoutWidth - 1)
			{
				x = 0;
				y = y + 1;
			}

			return scanBlocks(filledBlocks, x, y, w, layoutWidth);
		}

		function getNewPosition(filledBlocks, blockWidth, layoutWidth)
		{
			if (!filledBlocks.length)
			{
				return { x: 0, y: 0 };
			}

			var scanStartPosition = getScanStartPosition(filledBlocks);
			var newPosition = scanBlocks(filledBlocks, scanStartPosition.x, scanStartPosition.y, blockWidth, layoutWidth);

			return {
				x: newPosition.x,
				y: newPosition.y
			};
		}

		function getNewFilledBlocks(filledBlocks, newPosition, w, h)
		{
			for (var i = 0; i < w; i++)
			{
				var x = newPosition.x + i;
				var y = newPosition.y + h - 1;
				filledBlocks[x] = { x: x, y: y };
			}

			return filledBlocks;
		}
	};
})();