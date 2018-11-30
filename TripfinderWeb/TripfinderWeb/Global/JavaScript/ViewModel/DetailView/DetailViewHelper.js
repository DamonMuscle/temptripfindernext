(function()
{
	createNamespace("TF.DetailView").DetailViewHelper = DetailViewHelper;

	function DetailViewHelper()
	{
		var self = this;
		self.nonDataPoints = ["verticalLine", "horizontalLine", "section-header", "spacer", "image"];
	}

	/**
	 * Validate the layout entity.
	 * @param {Object} layoutEntity 
	 * @param {String} gridType 
	 * @return {Boolean}
	 */
	DetailViewHelper.prototype.validateLayoutEntity = function(entity, gridType)
	{
		var self = this, isValid = true,
			layout = entity.Layout,
			dataPoints = dataPointsJSON[gridType],
			items = layout.items,
			colNum = layout.width;

		$.each(items, function(index, item)
		{
			isValid = self.validateDataBlockItem(item, gridType, colNum);
			return isValid;
		});

		return isValid;
	};

	/**
	 * Check if the data block item is valid.
	 * @param {Object} item 
	 * @param {Number} colNum
	 * @return {Boolean} 
	 */
	DetailViewHelper.prototype.validateDataBlockItem = function(itemObj, gridType, colNum)
	{
		var self = this,
			w = itemObj.w, h = itemObj.h, x = itemObj.x, y = itemObj.y,
			isValid = true;

		// Vertical and horizontal lines have different layout validating criterias.
		if (itemObj.type === "verticalLine")
		{
			if (h === null || x === null || y === null) { return false; }

			h = parseInt(h);
			x = parseInt(x);
			y = parseInt(y);

			itemObj.w = 0;
			return x <= colNum;
		}
		else if (itemObj.type === "horizontalLine") 
		{
			if (w === null || x === null || y === null) { return false; }

			w = parseInt(w);
			x = parseInt(x);
			y = parseInt(y);

			itemObj.h = 0;
			return x + w <= colNum;
		}
		else
		{
			if (w === null || h === null || x === null || y === null) { return false; }

			w = parseInt(w);
			h = parseInt(h);
			x = parseInt(x);
			y = parseInt(y);

			if (isNaN(w) || isNaN(h) || isNaN(x) || isNaN(y)
				|| w < 1 || h < 1 || x < 0 || y < 0 || w > colNum)
			{
				return false;
			}

			// Non-data elements are not in dataPointsJson
			if (self.nonDataPoints.indexOf(itemObj.type) === -1)
			{
				var fieldObj = self.getDataPointObj(gridType, itemObj.field, itemObj.type);

				if (!fieldObj) { return false; }

				itemObj.defaultValue = fieldObj.defaultValue;
				itemObj.title = fieldObj.title;
				itemObj.type = fieldObj.type;
			}

			// Validate specific attributes for each data type.
			switch (itemObj.type)
			{
				case "Boolean":
					itemObj.defaultValue = fieldObj.defaultValue;
					itemObj.displayValue = fieldObj.displayValue;
					itemObj.positiveLabel = fieldObj.positiveLabel;
					itemObj.negativeLabel = fieldObj.negativeLabel;
					break;
				case "grid":
					itemObj.url = fieldObj.url;
					itemObj.subUrl = fieldObj.subUrl;
					isValid = Array.isArray(itemObj.columns) && itemObj.columns.length > 0;
					break;
				case "Map":
					if (Number.isNaN(parseInt(itemObj.thematicId)))
					{
						delete itemObj.thematicId;
					}
					break;
				case "image":
					if (Number.isNaN(parseInt(itemObj.imageId)))
					{
						delete itemObj.imageId;
					}
					break;
				case "spacer":
				case "Calendar":
				case "section-header":
				case "RecordPicture":
				case "Schedule":
				case "File":
				default:
					break;
			}
		}

		return isValid;
	};

	/**
	 * Get the matched data point object.
	 * @param {String} gridType 
	 * @param {String} fieldName
	 * @param {String} dataType
	 */
	DetailViewHelper.prototype.getDataPointObj = function(gridType, fieldName, dataType)
	{
		var match, dataPoints = dataPointsJSON[gridType];
		for (var key in dataPoints)
		{
			var tempList = dataPoints[key];
			$.each(tempList, function(index, item)
			{
				if ((fieldName && fieldName === item.field) || (!fieldName && dataType === item.type))
				{
					match = item;
				}

				return !match;
			});
		}
		return match;
	};

	DetailViewHelper.prototype.calculatedMileageRateComputer = function(fieldTripResourceDataEntry)
	{
		if (fieldTripResourceDataEntry.FieldTripId == 0)
		{
			return 0 //FT-296 When add a new field trip the Endingodometer will be disable and the MileageRate will not be calculated.
		}
		return (Number(fieldTripResourceDataEntry.Endingodometer) - Number(fieldTripResourceDataEntry.Startingodometer)) * Number(fieldTripResourceDataEntry.MileageRate);
	};

	DetailViewHelper.prototype.vehicleCostComputer = function(fieldTripResourceDataEntry)
	{
		return this.calculatedMileageRateComputer(fieldTripResourceDataEntry) + Number(fieldTripResourceDataEntry.VehFixedCost);
	};

	DetailViewHelper.prototype.driverCostComputer = function(fieldTripResourceDataEntry)
	{
		if (!fieldTripResourceDataEntry || !fieldTripResourceDataEntry.DriverHours)
		{
			return 0;
		}
		return Number(fieldTripResourceDataEntry.DriverHours) * Number(fieldTripResourceDataEntry.DriverRate) + Number(fieldTripResourceDataEntry.DriverOthours) * Number(fieldTripResourceDataEntry.DriverOtrate) + Number(fieldTripResourceDataEntry.DriverFixedCost);
	};

	DetailViewHelper.prototype.driverTotalCostComputer = function(fieldTripResourceDataEntry)
	{
		return this.driverCostComputer(fieldTripResourceDataEntry) + this.expensesComputer(fieldTripResourceDataEntry);
	};

	DetailViewHelper.prototype.busAideCostComputer = function(fieldTripResourceDataEntry)
	{
		return Number(fieldTripResourceDataEntry.AideHours) * Number(fieldTripResourceDataEntry.AideRate) + Number(fieldTripResourceDataEntry.AideOthours) * Number(fieldTripResourceDataEntry.AideOtrate) + Number(fieldTripResourceDataEntry.AideFixedCost);
	};

	DetailViewHelper.prototype.resourceSubTotalComputer = function(fieldTripResourceDataEntry)
	{
		return this.vehicleCostComputer(fieldTripResourceDataEntry) +
			this.driverTotalCostComputer(fieldTripResourceDataEntry) +
			this.busAideCostComputer(fieldTripResourceDataEntry);
	};

	DetailViewHelper.prototype.expensesComputer = function(fieldTripResourceDataEntry)
	{
		return Number(fieldTripResourceDataEntry.DriverExpMeals) + Number(fieldTripResourceDataEntry.DriverExpMisc) + Number(fieldTripResourceDataEntry.DriverExpParking) + Number(fieldTripResourceDataEntry.DriverExpTolls);
	};

	DetailViewHelper.prototype.resourcesTotalComputer = function(entity)
	{
		var resourcesTotal = 0, fixedCost = parseFloat(entity.FixedCost || 0), minimumCost = parseFloat(entity.MinimumCost || 0);
		if (entity.FieldTripResourceGroups)
		{
			for (var i = 0; i < entity.FieldTripResourceGroups.length; i++)
			{
				resourcesTotal = resourcesTotal + this.resourceSubTotalComputer(entity.FieldTripResourceGroups[i]);
			}
		}

		if (resourcesTotal + fixedCost < minimumCost)
		{
			resourcesTotal = minimumCost;
		}
		else
		{
			resourcesTotal += fixedCost;
		}

		return '$' + this.formatCurrency(resourcesTotal);
	};

	DetailViewHelper.prototype.formatCurrency = function(currency)
	{
		if (typeof currency !== "number")
		{
			currency = Number(currency);
		}
		var currency = currency || 0;
		return currency.toFixed(2);
	}
})();