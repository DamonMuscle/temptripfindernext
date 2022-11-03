(function()
{
	/**
	 * Grid Definition:
	 *              UnitOfMeasureSupported: A field supports conversion between Miles and Kilometers
	 *              UnitOfMeasureReverse: to support some fields like [FuelConsumptionRate] in field trip definition. the unit is in the denominator. example: [1/mile or 1/kilometer]
	 *              UnitInDatabase: For legacy GPS data, the unit in database is [Imperial]. And the rest data's unit is [Metric]. Default to [Metric]
	 * 
	 * Attention to MeasurementUnitConverter.prototype.convert
	 */

	createNamespace("TF").MeasurementUnitConverter = MeasurementUnitConverter;

	const currentUnitOfMeasure = ko.observable("Metric");
	const subscriptions = [];

	function MeasurementUnitConverter()
	{
	}

	MeasurementUnitConverter.prototype.init = function()
	{
		return this.updateCurrentUnitOfMeasure();
	};

	MeasurementUnitConverter.prototype.updateCurrentUnitOfMeasure = function(value)
	{
		var self = this;
		function getValue(config)
		{
			return config.UnitOfMeasure !== self.MeasurementUnitEnum.Imperial ? self.MeasurementUnitEnum.Metric : self.MeasurementUnitEnum.Imperial
		}
		if (!value)
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "clientconfigs"), { data: { clientId: tf.authManager.clientKey } }).then((response) =>
			{
				const config = response.Items[0];
				currentUnitOfMeasure(getValue(config));
				return currentUnitOfMeasure();
			});
		}

		if (value.hasOwnProperty("UnitOfMeasure"))
		{
			value = getValue(value);
		}

		if (!["Imperial", "Metric"].includes(value))
		{
			throw new Error("invalid value");
		}
		currentUnitOfMeasure(value);
		return Promise.resolve(currentUnitOfMeasure());
	}

	MeasurementUnitConverter.prototype.subscribeUnitOfMeasureChange = function(func)
	{
		subscriptions.push(currentUnitOfMeasure.subscribe(func));
	}

	MeasurementUnitConverter.prototype.getCurrentUnitOfMeasure = function()
	{
		return currentUnitOfMeasure();
	}

	MeasurementUnitConverter.prototype.isImperial = function()
	{
		return currentUnitOfMeasure() === this.MeasurementUnitEnum.Imperial;
	}

	MeasurementUnitConverter.prototype.getUnits = function()
	{
		return this.isImperial() ? "Miles" : "Kilometers";
	};

	MeasurementUnitConverter.prototype.getShortUnits = function()
	{
		return this.isImperial() ? "mi" : "km";
	}

	MeasurementUnitConverter.prototype.getSpeedUnits = function()
	{
		return this.isImperial() ? "mph" : "kph";
	}

	MeasurementUnitConverter.prototype.getRulerUnits = function()
	{
		return this.isImperial() ? "ft" : "m";
	}

	MeasurementUnitConverter.prototype.getOdometerUnits = function()
	{
		return this.isImperial() ? "Mileage" : "Odometer";
	}

	MeasurementUnitConverter.prototype.getRatio = function()
	{
		return this.isImperial() ? 5280 : 1000;
	}

	MeasurementUnitConverter.prototype.MeasurementUnitEnum = {
		Imperial: "Imperial",
		Metric: "Metric"
	};

	MeasurementUnitConverter.prototype.MeasurementUnitTypeEnum = {
		MileToKilometer: 1.609344,
		FootToMeter: 0.3048,
		GallonToLiter: 3.7854118,
		MpgToKml: 0.425143707,
		PoundToKilogram: 0.45359237
	};

	MeasurementUnitConverter.prototype.isNeedConversion = function(originalUnit)
	{
		originalUnit = originalUnit || this.MeasurementUnitEnum.Metric;
		if (!["Imperial", "Metric"].includes(originalUnit))
		{
			throw new Error("invalid value");
		}

		return originalUnit != currentUnitOfMeasure();
	};

	/**
	 * when converting data in db to web page, the targetUnit equals to currentUnitOfMeasure().
	 * on the other hand, when filtering data in db, the originalUnit equals to currentUnitOfMeasure().
	 * @param {*} options 
	 * @returns 
	 */
	MeasurementUnitConverter.prototype.convert = function(options)
	{
		const self = this;
		let { value, originalUnit, targetUnit, precision = 2, isReverse = false, unitType = self.MeasurementUnitTypeEnum.MileToKilometer } = options;
		if (originalUnit === targetUnit)
		{
			return value;
		}

		switch (targetUnit)
		{
			case this.MeasurementUnitEnum.Imperial:
				return !isReverse ? divide(value, precision) : multiply(value, precision);
			case this.MeasurementUnitEnum.Metric:
				return !isReverse ? multiply(value, precision) : divide(value, precision);
		}

		function multiply(v, p)
		{
			return Number((v * unitType).toFixed(p));
		}

		function divide(v, p)
		{
			return Number((v / unitType).toFixed(p));
		}
	};

	MeasurementUnitConverter.prototype.handleUnitOfMeasure = function(columns)
	{
		return columns.map(c =>
		{
			if (c.UnitOfMeasureSupported)
			{
				// if a specific column has a template function already, define it in grid definition
				c.template = (item) =>
				{
					return this.handleColumnUnitOfMeasure(item, c);
				};
			}

			return c;
		});
	};

	MeasurementUnitConverter.prototype.handleUnitOfMeasureValues = function(items, columns, field)
	{
		items.forEach(item =>
		{
			columns.forEach(c =>
			{
				if (c.UnitOfMeasureSupported || c[field])
				{
					item[c.FieldName || c.field] = this.handleColumnUnitOfMeasure(item, c);
				}
			});
		});
	};

	MeasurementUnitConverter.prototype.convertToDisplay = function(value, config)
	{
		var self = this;
		return this.convertData(value, config, (v, convertConfig) =>
		{
			return {
				value: v,
				originalUnit: convertConfig.UnitInDatabase || self.MeasurementUnitEnum.Metric,
				targetUnit: self.getCurrentUnitOfMeasure(),
				isReverse: !!convertConfig.UnitOfMeasureReverse,
			}
		})
	};

	MeasurementUnitConverter.prototype.convertToSave = function(value, config)
	{
		var self = this;
		return this.convertData(value, config, (v, convertConfig) =>
		{
			return {
				value: Number(v),
				originalUnit: self.getCurrentUnitOfMeasure(),
				targetUnit: convertConfig.UnitInDatabase || self.MeasurementUnitEnum.Metric,
				isReverse: !!convertConfig.UnitOfMeasureReverse,
				precision: 12
			}
		})
	};

	MeasurementUnitConverter.prototype.convertData = function(value, config, getSetting)
	{
		if (config.mapping)
		{
			if (!ko.isObservable(value) && $.isPlainObject(value))
			{
				for (var i = 0; i < config.mapping.length; i++)
				{
					value[config.mapping[i].from] = this.convertData(value[config.mapping[i].from], config.mapping[i], getSetting);
				}
			}
			else if (ko.isObservableArray(value) === true || ko.isObservable(value) === true)
			{
				this.convertData(value(), config, getSetting);
			}
			else if ($.isArray(value))
			{
				value.forEach(item =>
				{
					this.convertData(item, config, getSetting);
				});
			}
		}
		else if (config.UnitOfMeasureSupported && value !== null)
		{
			return this.convert(getSetting(value, config));
		}
		return value;
	};

	MeasurementUnitConverter.prototype.handleColumnUnitOfMeasure = function(item, column)
	{
		var originValue = item;
		const fieldName = column.FieldName || column.field;
		if (item.hasOwnProperty(fieldName))
		{
			originValue = item[fieldName];
		}

		if ([undefined, null].includes(originValue))
		{
			return "";
		}

		if (typeof originValue === "string" && originValue.trim() === "")
		{
			return "";
		}

		if (column.FieldName == "DrivingDirections" || column.field == "DrivingDirections")
		{
			return this.unifyDirectionMeasurementUnit(originValue, tf.measurementUnitConverter.isImperial());
		}

		if (!column.UnitOfMeasureSupported)
		{
			return originValue;
		}

		let v = this.convert({
			originalUnit: column.UnitInDatabase || this.MeasurementUnitEnum.Metric,
			targetUnit: currentUnitOfMeasure(),
			value: originValue,
			isReverse: !!column.UnitOfMeasureReverse,
			unitType: column.UnitTypeOfMeasureSupported
		});

		return Number(v) === v ? v.toFixed(2) : v;
	};

	MeasurementUnitConverter.prototype.processUnitsOfMeasureFilters = function(allColumns, filterSet)
	{
		if (!filterSet || !Array.isArray(allColumns)) { return; }

		const self = this;

		self.handlePrecisionForUnitsOfMeasureFilters(allColumns, filterSet);

		(filterSet.FilterItems || []).forEach(function(f)
		{
			let matchedField = self.getUnitOfMeasureSupportedField(allColumns, f.FieldName);
			if (matchedField && self.isNeedConversion(matchedField.UnitInDatabase))
			{
				f.Precision = 4;
				f.Value = self.convert({
					value: f.Value,
					originalUnit: currentUnitOfMeasure(),
					targetUnit: matchedField.UnitInDatabase || self.MeasurementUnitEnum.Metric,// the unit of legacy GPS data is Imperial. 
					isReverse: !!matchedField.UnitOfMeasureReverse,
					unitType: matchedField.UnitTypeOfMeasureSupported,
					precision: f.Precision
				});
			}
		});

		(filterSet.FilterSets || []).forEach(function(fs)
		{
			self.processUnitsOfMeasureFilters(allColumns, fs);
		});
	};

	MeasurementUnitConverter.prototype.handlePrecisionForUnitsOfMeasureFilters = function(allColumns, filterSet)
	{
		const self = this,
			filters = filterSet.FilterItems,
			equalItems = self.getFilterItemByType(allColumns, filterSet, "EqualTo"),
			notEqualItems = self.getFilterItemByType(allColumns, filterSet, "NotEqualTo"),
			lessThanOrEqualToItems = self.getFilterItemByType(allColumns, filterSet, "LessThanOrEqualTo"),
			lessThanItems = self.getFilterItemByType(allColumns, filterSet, "LessThan"),
			greaterThanOrEqualToItems = self.getFilterItemByType(allColumns, filterSet, "GreaterThanOrEqualTo"),
			greaterThanItems = self.getFilterItemByType(allColumns, filterSet, "GreaterThan"),
			remainingItems = (filters || []).filter(f => ![...equalItems, ...notEqualItems, ...lessThanOrEqualToItems, ...lessThanItems, ...greaterThanOrEqualToItems, ...greaterThanItems].includes(f));

		filterSet.FilterItems = remainingItems.concat(equalItems.reduce(function(result, currentItem)
		{
			if (currentItem.Operator !== "EqualTo")
			{
				return result;
			}

			return result.concat([
				{ ...currentItem, Operator: "GreaterThanOrEqualTo", alreadyHandled: true, Value: currentItem.Value - 10 ** (- currentItem.Precision) / 2 },
				{ ...currentItem, Operator: "LessThan", alreadyHandled: true, Value: currentItem.Value + 10 ** (- currentItem.Precision) / 2 }
			]);
		}, [])).concat(lessThanOrEqualToItems.reduce(function(result, currentItem)
		{
			return result.concat([
				{ ...currentItem, Operator: "LessThanOrEqualTo", alreadyHandled: true, Value: currentItem.Value + 10 ** (- currentItem.Precision) / 2 }
			]);
		}, [])).concat(lessThanItems.reduce(function(result, currentItem)
		{
			return result.concat([
				{ ...currentItem, Operator: "LessThan", alreadyHandled: true, Value: currentItem.Value - 10 ** (- currentItem.Precision) / 2 }
			]);
		}, [])).concat(greaterThanOrEqualToItems.reduce(function(result, currentItem)
		{
			return result.concat([
				{ ...currentItem, Operator: "GreaterThanOrEqualTo", alreadyHandled: true, Value: currentItem.Value - 10 ** (- currentItem.Precision) / 2 }
			]);
		}, [])).concat(greaterThanItems.reduce(function(result, currentItem)
		{
			return result.concat([
				{ ...currentItem, Operator: "GreaterThan", alreadyHandled: true, Value: currentItem.Value + 10 ** (- currentItem.Precision) / 2 }
			]);
		}, []));

		if (notEqualItems.length)
		{
			filterSet.FilterSets.push({
				FilterItems: notEqualItems.reduce(function(result, currentItem)
				{
					return result.concat([
						{ ...currentItem, Operator: "LessThan", alreadyHandled: true, Value: currentItem.Value - 10 ** (-currentItem.Precision) / 2 },
						{ ...currentItem, Operator: "GreaterThan", alreadyHandled: true, Value: currentItem.Value + 10 ** (-currentItem.Precision) / 2 }
					]);
				}, []),
				FilterSets: [],
				LogicalOperator: "or"
			})
		}
	};

	MeasurementUnitConverter.prototype.getUnitOfMeasureSupportedField = function(allColumns, fieldName)
	{
		return (allColumns || []).find(x => x.UnitOfMeasureSupported && x.FieldName === fieldName);
	};

	MeasurementUnitConverter.prototype.getFilterItemByType = function(allColumns, filterSet, type)
	{
		const self = this;

		return (filterSet && filterSet.FilterItems || []).filter(function(f)
		{
			const matchedField = self.getUnitOfMeasureSupportedField(allColumns, f.FieldName);
			return matchedField
				&& self.isNeedConversion(matchedField.UnitInDatabase)
				&& f.Operator === type
				&& !f.alreadyHandled
		});
	};

	MeasurementUnitConverter.prototype.unifyDirectionMeasurementUnit = function(rawDirectionString, convertToImperialUnit)
	{
		if (!rawDirectionString)
		{
			return rawDirectionString;
		}

		let regexp = /(\d+(\.\d+)*)((?: mi\.?)|(?: ft\.?))((?:((?:\r\n)|(?:\n))|$))/gm;
		if (convertToImperialUnit)
		{
			regexp = /(\d+(\.\d+)*)((?: km\.?)|(?: m\.?))((?:((?:\r\n)|(?:\n))|$))/gm;
		}

		const _replace = (match, g1, g2, g3) =>
		{
			const distance = tf.measurementUnitConverter.convert({
				originalUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Imperial,
				targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				precision: 5,
				isReverse: !!convertToImperialUnit,
				value: parseFloat(g1)
			});
			const feetInMeter = 1 / this.MeasurementUnitTypeEnum.FootToMeter;

			let unit = "";
			if (convertToImperialUnit)
			{
				unit = "mi";
				if (g3.trim() === "m." || g3.trim() === "m")
				{
					unit = "ft";
				}
			}
			else
			{
				unit = "km";
				if (g3.trim() === "ft." || g3.trim() === "ft")
				{
					unit = "m";
				}
			}

			if (unit === "ft")
			{
				return match.replace(g1, parseFloat(g1) * feetInMeter).replace("m", unit);
			}
			if (unit === "mi")
			{
				return match.replace(g1, distance).replace("km", unit);
			}
			if (unit === "m")
			{
				return match.replace(g1, (parseFloat(g1) / feetInMeter)).replace("ft", unit);
			}
			if (unit === "km")
			{
				return match.replace(g1, distance).replace("mi", unit);
			}
		}

		return rawDirectionString.trim().replace(regexp, _replace);
	}

	/**
	* convert measurement unit for aggregate
	* @param {number} value 
	* @param {string} operator 
	* @param {*} columnOrDataType column definition or data type
	* @param {string} field field name which need to convert
	* @returns 
	*/
	MeasurementUnitConverter.prototype.aggregateConvert = function(value, operator, columnOrDataType, field)
	{
		var column;
		if (!field)
		{
			column = columnOrDataType;
		} else
		{
			column = tf.dataTypeHelper.getGridDefinition(columnOrDataType).Columns.filter(x => x.FieldName === field)[0];
		}

		if (["sum", "min", "max", "average", "range"].includes(operator.toLowerCase())
			&& tf.measurementUnitConverter.isNeedConversion(column.UnitInDatabase)
			&& column.UnitOfMeasureSupported)
		{
			value = tf.measurementUnitConverter.convert({
				value: value,
				originalUnit: column.UnitInDatabase || tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
				targetUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
				isReverse: !!column.UnitOfMeasureReverse,
				unitType: column.UnitTypeOfMeasureSupported
			});

			return value;
		}

		return value;
	}

	MeasurementUnitConverter.prototype.dispose = function()
	{
		subscriptions.forEach(s => s.dispose());
	};
})();