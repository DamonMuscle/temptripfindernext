(function()
{
	createNamespace("TF.DetailView.FieldEditor").FieldtripFieldEditorHelper = FieldtripFieldEditorHelper;

	var ERROR_MESSAGE = {
		STRICT_ACCOUNT_DEPT_ACTIVITY: "Strict account code is on, no account matches selected school and dept/activity.",
		//STRICT_ACCOUNT_INVOICE: "Strict account code is on, please remove any existing invoice that uses invalid account."
	};

	function FieldtripFieldEditorHelper(detailView)
	{
		var self = this;
		TF.DetailView.FieldEditor.FieldEditorHelper.call(self, detailView);
	}

	var FIELD_VALUE_PROP = {
		DistrictDepartmentId: "DistrictDepartmentName",
		FieldTripActivityId: "FieldTripActivityName",
	};

	var RELATED_FIELDS_MAPPING = {
		"Destination": [
			{ fieldName: 'DestinationCity', entityKey: 'City' },
			{ fieldName: 'DestinationContact', entityKey: 'Contact' },
			{ fieldName: 'DestinationContactTitle', entityKey: 'ContactTitle' },
			{ fieldName: 'DestinationEmail', entityKey: 'Email' },
			{ fieldName: 'DestinationFax', entityKey: 'Fax' },
			{ fieldName: 'DestinationNotes', entityKey: 'Notes' },
			{ fieldName: 'DestinationContactPhone', entityKey: 'Phone' },
			{ fieldName: 'DestinationPhoneExt', entityKey: 'PhoneExt' },
			{ fieldName: 'DestinationState', entityKey: 'State' },
			{ fieldName: 'DestinationStreet', entityKey: 'Street' },
			{ fieldName: 'DestinationZip', entityKey: 'Zip' },
			{ fieldName: 'FieldTripDestinationId', entityKey: 'Id' }
		],
		"DeptActivity": [
			{ fieldName: 'DistrictDepartmentName', entityKey: 'DistrictDepartmentId' },
			{ fieldName: 'FieldTripActivityName', entityKey: 'FieldTripActivityId' },
		],
		"DistrictDepartmentId": [
			{ fieldName: 'DeptActivity', entityKey: 'DeptActivity' },
		],
		"FieldTripActivityId": [
			{ fieldName: 'DeptActivity', entityKey: 'DeptActivity' },
		],
		"School": [
			{ fieldName: 'DeptActivity', entityKey: 'DeptActivity' },
			{ fieldName: 'DistrictDepartmentName', entityKey: 'DistrictDepartmentId' },
			{ fieldName: 'FieldTripActivityName', entityKey: 'FieldTripActivityId' },
		],
		"BillingClassification": [
			{ fieldName: 'FixedCost', entityKey: 'FixedCost' },
			// { fieldName: 'AideCost', entityKey: 'AideCost' },
			// { fieldName: 'DriverCost', entityKey: 'DriverCost' },
			// { fieldName: 'AideCost', entityKey: 'AideCost' },
			// { fieldName: 'SubTotalCost', entityKey: 'SubTotalCost' },
			// { fieldName: 'TotalCost', entityKey: 'TotalCost' },
			{ fieldName: 'MinimumCost', entityKey: 'MinimumCost' },
			{ fieldName: 'AideFixedCost', entityKey: 'AideFixedCost' },
			{ fieldName: 'DriverFixedCost', entityKey: 'DriverFixedCost' },
			{ fieldName: 'VehFixedCost', entityKey: 'VehFixedCost' },

			{ fieldName: 'FuelConsumptionRate', entityKey: 'FuelConsumptionRate' },
			{ fieldName: 'DriverRate', entityKey: 'DriverRate' },
			{ fieldName: 'DriverOtrate', entityKey: 'DriverOTRate' },
			{ fieldName: 'AideRate', entityKey: 'AideRate' },
			{ fieldName: 'AideOtrate', entityKey: 'AideOTRate' },
		]
	};

	var fieldRelatedMap = {
		DepartDateTime: {
			comparator: 'LessThan',
			relatedField: 'EstimatedReturnDateTime',
			option: {
				type: 'dateTime',
				message: 'Depart Date/Time should be earlier than Return Date/Time',
				format: 'MM/DD/YYYY hh:mm A'
			}

		},
		EstimatedReturnDateTime: {
			comparator: 'GreaterThan',
			relatedField: 'DepartDateTime',
			option: {
				type: 'dateTime',
				message: 'Return Date/Time should be later than Depart Date/Time',
				format: 'MM/DD/YYYY hh:mm A'
			}
		}
	}

	FieldtripFieldEditorHelper.prototype = Object.create(TF.DetailView.FieldEditor.FieldEditorHelper.prototype);
	FieldtripFieldEditorHelper.prototype.constructor = FieldtripFieldEditorHelper;

	FieldtripFieldEditorHelper.prototype._onEditorApplied = function(format, editor, e, result)
	{
		var self = this;
		TF.DetailView.FieldEditor.FieldEditorHelper.prototype._onEditorApplied.call(self, format, editor, e, result);

		self.updateRelatedFields(result.fieldName, result.selectedItem);

		if (editor.bootstrapValidator == null || editor.bootstrapValidator.isValid())
		{
			self.validateRelatedFields(result, fieldRelatedMap);
		}
	}

	FieldtripFieldEditorHelper.prototype.updateRelatedFields = function(field, data)
	{
		if (!data) return;

		var self = this, nullAvatar = "None";

		switch (field)
		{
			case "fieldtripinvoice":
				var totalAmount = self.calculateTotalAmount(data);
				self.updateFields("TotalAmount", 'TotalAmount', String.format("${0}", totalAmount.toFixed(2)), totalAmount);
				break;
			case "Destination":
				RELATED_FIELDS_MAPPING["Destination"]
					.forEach(function(mapping)
					{
						self.updateFields(mapping.fieldName, mapping.fieldName, data.text, data[mapping.entityKey]);
					});
				break;
			case "DeptActivity":
				RELATED_FIELDS_MAPPING["DeptActivity"]
					.forEach(function(mapping)
					{
						var text, value;
						if (data.affectedFields && data.affectedFields[mapping.fieldName]) 
						{
							text = data.affectedFields[mapping.fieldName].text;
							value = data.affectedFields[mapping.fieldName].value;
						}
						else
						{
							text = null;
							value = 0;
						}

						self.updateFields(mapping.entityKey, mapping.fieldName, text, value);
					});
				self.checkSchoolDeptActivityCombination()
					.then(function(isValid)
					{
						if (isValid)
						{
							self.toggleValidationErrorToFieldsByName(["DeptActivity"], false);
						}
					});
				break;
			case "DistrictDepartmentId":
				var newDepartmentName = data.value > 0 ? data.text : nullAvatar,
					name = self.getDeptActivityName(newDepartmentName),
					value = name === nullAvatar ? null : name;
				self.updateFields("DeptActivity", "DeptActivity", name, value);
				break;
			case "FieldTripActivityId":
				var newActivityName = data.value > 0 ? data.text : nullAvatar,
					name = self.getDeptActivityName(null, newActivityName),
					value = name === nullAvatar ? null : name;
				self.updateFields("DeptActivity", "DeptActivity", name, value);
				break;
			case "School":
				if (tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'])
				{
					var schoolCode = data.value;

					self.fetchMatchedAccounts(null, null, schoolCode)
						.then(function(response)
						{
							if (!Array.isArray(response.Items) || response.Items.length === 0)
							{
								self.updateFields("DeptActivity", "DeptActivity", null, null);
								self.updateFields("DistrictDepartmentId", "DistrictDepartmentName", null, 0);
								self.updateFields("FieldTripActivityId", "FieldTripActivityName", null, 0);
							}
						});
				}
				break;
			case "BillingClassificationId":
				var items = self.getFieldValue('FieldTripResourceGroups');
				if (data.value > 0)
				{
					RELATED_FIELDS_MAPPING["BillingClassification"]
						.forEach(function(mapping)
						{
							var datapoint = tf.helpers.detailViewHelper.getDataPointByIdentifierAndGrid(mapping.fieldName, self.dataType);
							if (!datapoint) return;
							var text = tf.helpers.detailViewHelper.formatDataContent(data[mapping.entityKey], datapoint.type, datapoint.format);

							self.updateFields(mapping.fieldName, mapping.fieldName, text, data[mapping.entityKey]);
						});
						
					data['FuelConsumptionRate'] = this._convertToMetric(data['FuelConsumptionRate']);
					self.updateFields('BillingClassification', '', null, data);
					var updatedResGroups = null
					if (items)
						updatedResGroups = self.applyBCtoResourceGroups(items.value ? items.value : items, data);
					self.updateFields('FieldTripResourceGroups', '', null, updatedResGroups);
					self.recalculateFieldTripCosts();
				}
				else
				{
					RELATED_FIELDS_MAPPING["BillingClassification"]
						.forEach(function(mapping)
						{
							self.updateFields(mapping.fieldName, mapping.fieldName, null, null);
						});
					self.updateFields('BillingClassification', '', null, null);
					self.updateFieldTripResourceGroups(items);
				}
				break;
			default:
				break;
		}
	};

	FieldtripFieldEditorHelper.prototype.updateFieldTripResourceGroups = function(fieldTripResourceGroups)
	{
		var self = this;
		if (!self._detailView.recordEntity)
		{
			return;
		}

		var promises = [tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'staff'), {
			paramData: {
				fieldTripIds: [self._detailView.recordEntity.Id]
			}
		}),
		tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), 'vehicles'), {
			paramData: {
				fieldTripIds: [self._detailView.recordEntity.Id]
			}
		})
		];
		Promise.all(promises).then(function(res)
		{
			var staffs = res[0].Items.reduce(function(map, obj)
			{
				map[obj.Id] = obj;
				return map;
			}, {});
			var vehicles = res[1].Items.reduce(function(map, obj)
			{
				map[obj.Id] = obj;
				return map;
			}, {});
			var updatedResGroups = fieldTripResourceGroups.map(function(item)
			{
				item['FuelConsumptionRate'] = item.VehicleId && vehicles[item.VehicleId].Cost;
				if (item.AideId && item.AideId !== -1)
				{
					item['AideOTRate'] = staffs[item.AideId].Otrate;
					item['AideRate'] = staffs[item.AideId].Rate;
				}

				item['DriverOTRate'] = item.DriverId && staffs[item.DriverId].Otrate;
				item['DriverRate'] = item.DriverId && staffs[item.DriverId].Rate;
				item['DriverFixedCost'] = null;
				item['AideFixedCost'] = null;
				item['VehFixedCost'] = null;
				return item;
			});
			self.updateFields('FieldTripResourceGroups', '', null, updatedResGroups);
			self.recalculateFieldTripCosts();
		})
	};

	FieldtripFieldEditorHelper.prototype.applyBCtoResourceGroups = function(resources, billingClassification)
	{
		if (resources != null && resources instanceof Array && billingClassification != null)
		{
			return resources.map(function(rs)
			{

				rs.DriverRate = billingClassification.DriverRate && billingClassification.DriverRate;
				rs.DriverOTRate = billingClassification.DriverOTRate && billingClassification.DriverOTRate;
				rs.DriverFixedCost = billingClassification.DriverFixedCost && billingClassification.DriverFixedCost;

				rs.FuelConsumptionRate = billingClassification.FuelConsumptionRate && billingClassification.FuelConsumptionRate;

				rs.VehFixedCost = billingClassification.FuelConsumptionRate && billingClassification.VehFixedCost;

				rs.AideRate = billingClassification.AideRate && billingClassification.AideRate;
				rs.AideOTRate = billingClassification.AideOTRate && billingClassification.AideOTRate;
				rs.AideFixedCost = billingClassification.AideFixedCost && billingClassification.AideFixedCost;

				rs.DriverTotalCost = rs.AideTotalCost = rs.VehicleTotalCost = rs.TotalCost = 0;

				rs.AideTotalCost += sumNubers(rs.AideTotalCost, rs.AideHours * rs.AideRate, rs.AideOTHours * rs.AideOTRate, rs.AideFixedCost);
				rs.DriverTotalCost += sumNubers(rs.DriverTotalCost, rs.DriverFixedCost, rs.DriverHours * rs.DriverRate, rs.DriverOTHours * rs.DriverOTRate, rs.DriverExpMeals, rs.DriverExpMisc, rs.DriverExpParking, rs.DriverExpTolls);
				rs.VehicleTotalCost += sumNubers(rs.VehicleTotalCost, (rs.EndingOdometer - rs.StartingOdometer) * rs.FuelConsumptionRate, rs.VehFixedCost);
				rs.TotalCost = sumNubers(rs.DriverTotalCost, rs.AideTotalCost, rs.VehicleTotalCost)
				return rs;
			})
		}
		else return null;
	}
	
	FieldtripFieldEditorHelper.prototype._convertToMetric = function(value)
	{
		if(!value)
		{
			return value;
		}

		return tf.measurementUnitConverter.convert({
			originalUnit: tf.measurementUnitConverter.getCurrentUnitOfMeasure(),
			targetUnit: tf.measurementUnitConverter.MeasurementUnitEnum.Metric,
			value: value,
			isReverse: true,
			keep2Decimal: true,
			precision: 18
		})
	}

	FieldtripFieldEditorHelper.prototype.recalculateFieldTripCosts = function()
	{
		var self = this, resourceGroups = self.getFieldValue("FieldTripResourceGroups");
		if (resourceGroups)
		{
			var newCosts = {
				AideCost: 0,
				DriverCost: 0,
				VehicleCost: 0,
				SubTotalCost: 0,
				TotalCost: 0,
			};
			resourceGroups.forEach(function(rs)
			{
				newCosts.AideCost = sumNubers(newCosts.AideCost, rs.AideTotalCost);
				newCosts.DriverCost = sumNubers(newCosts.DriverCost, rs.DriverTotalCost);
				newCosts.VehicleCost = Math.tfRound(sumNubers(newCosts.VehicleCost, rs.VehicleTotalCost), 2);
			})
			newCosts.SubTotalCost = Math.tfRound(sumNubers(newCosts.AideCost, newCosts.DriverCost, newCosts.VehicleCost), 2);
			var _minimum = self.getFieldValue("MinimumCost");
			var _extendTotal = sumNubers(newCosts.SubTotalCost, self.getFieldValue("FixedCost"));
			newCosts.TotalCost = Math.tfRound(Math.max(_minimum, _extendTotal), 2);
			Object.keys(newCosts).forEach(function(costName)
			{
				var datapoint = tf.helpers.detailViewHelper.getDataPointByIdentifierAndGrid(costName, self.dataType);
				var text = tf.helpers.detailViewHelper.formatDataContent(newCosts[costName], datapoint.type, datapoint.format);
				self.updateFields(costName, costName, text, newCosts[costName]);
			})
		}
	}

	FieldtripFieldEditorHelper.prototype.showConfirmationMessages = function()
	{
		var self = this, paramsUrl, key,
			endPoint = tf.dataTypeHelper.getEndpoint(self.dataType),
			idParamName = tf.dataTypeHelper.getIdParamName(self.dataType),
			blackList = tf.dataTypeHelper.getEntityUpdateConfirmBlackList(self.dataType),
			modifiedFields = {};

		for (key in self.editFieldList)
		{
			if (blackList.includes(key))
			{
				modifiedFields[key] = self.editFieldList[key].value;
			}
		}

		paramsUrl = String.format("{0}?{1}={2}", endPoint, idParamName, self._detailView.recordId);

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), paramsUrl), {
			paramData: {
				confirmData: JSON.stringify(modifiedFields)
			}
		}).then(function(response)
		{
			if (!response || !response.Items || !response.Items[0]) return false;

			var confirmMsgs = response.Items[0];

			var errors = confirmMsgs.Errors, warnings = confirmMsgs.Warnings;

			if (Object.values(errors).length > 0)
			{
				return tf.promiseBootbox.alert(Object.values(errors).join('\n'), "Failed").then(function(res)
				{
					return false;
				});
			}

			if (Object.values(warnings).length > 0)
			{
				return tf.promiseBootbox.confirm({
					title: 'Warning',
					message: Object.values(warnings).join('\n')
				});
			}

			return true;
		});
	}

	/**
	 * Get field trip department/activity name.
	 *
	 * @param {string} departmentName
	 * @param {string} activityName
	 * @returns
	 */
	FieldtripFieldEditorHelper.prototype.getDeptActivityName = function(departmentName, activityName)
	{
		var nullAvatar = "None",
			departmentName = departmentName || this.getFieldValue("DistrictDepartmentId", true) || nullAvatar,
			activityName = activityName || this.getFieldValue("FieldTripActivityId", true) || nullAvatar;

		return String.format("{0}/{1}", departmentName, activityName);
	};

	FieldtripFieldEditorHelper.prototype.getFieldValue = function(field, getLabel)
	{
		var self = this;
		var update = self.editFieldList[field];

		if (update)
		{
			return getLabel ? update.textValue : update.value;
		}
		else
		{
			var entity = self._detailView.recordEntity || self._detailView.defaultRecordEntity;
			return entity[getLabel ? FIELD_VALUE_PROP[field] : field];
		}
	}

	FieldtripFieldEditorHelper.prototype.validateEntityByType = function(entity)
	{
		var self = this,
			isStrictAccountCodeOn = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'];

		if (isStrictAccountCodeOn)
		{
			// validate if school and dept./activity match.
			return self.fetchMatchedAccounts(entity.DistrictDepartmentId, entity.FieldTripActivityId, entity.School)
				.then(function(res)
				{
					var resultList = [],
						account = res[0],
						checkInvoices = Promise.resolve();

					if (!account)
					{
						resultList.push({ fieldName: "DeptActivity", message: ERROR_MESSAGE.STRICT_ACCOUNT_DEPT_ACTIVITY });
					}
					else 
					{
						checkInvoices = self.getInvalidInvoices(res, entity.FieldTripInvoices)
							.then(invalidInvoices =>
							{
								if (invalidInvoices.length)
								{
									let errorMsg = `Strict account code is on, please remove `;
									if (invalidInvoices.length == 1)
									{
										errorMsg += 'this account: ';
									}
									else
									{
										errorMsg += 'these accounts: ';
									}

									errorMsg += invalidInvoices.map(i => i.AccountName).join(", ") + ".";
									return { fieldName: "FieldTripInvoiceGrid", message: errorMsg };
								}
							});
					}

					return checkInvoices.then(function(error)
					{
						if (error)
						{
							resultList.push(error);
						}
						return resultList;
					});
				});
		}

		return Promise.resolve([]);
	};

	FieldtripFieldEditorHelper.prototype.checkAndUpdateFieldTripInvoiceGridStatus = function(invoices)
	{
		this.getInvalidInvoices(invoices).then(invalidInvoices =>
		{
			if (invalidInvoices && invalidInvoices.length)
			{
				this.toggleValidationErrorToFieldsByName(["FieldTripInvoiceGrid"], false);
			}
		});
	};

	FieldtripFieldEditorHelper.prototype.checkSchoolDeptActivityCombination = function()
	{
		return this.fetchMatchedAccounts().then(function(res) { return res.length > 0; });
	};

	FieldtripFieldEditorHelper.prototype.getInvalidInvoices = function(accountData, invoices)
	{
		let fetchAccounts = accountData ? Promise.resolve(accountData) : this.fetchMatchedAccounts();
		return fetchAccounts.then(accounts =>
		{
			invoices = invoices || [];
			return invoices.filter(i => accounts.every(a => a.Id !== i.FieldTripAccountId));
		});
	};

	/**
	 * Fetch accounts that match all of department, activity, and school.
	 *
	 * @param {number} departmentId
	 * @param {number} activityId
	 * @param {string} schoolCode
	 * @returns
	 */
	FieldtripFieldEditorHelper.prototype.fetchMatchedAccounts = function(departmentId, activityId, schoolCode)
	{
		var self = this,
			isStrictAccountCodeOn = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'],
			departmentId = !departmentId ? self.getFieldValue("DistrictDepartmentId") : departmentId,
			activityId = !activityId ? self.getFieldValue("FieldTripActivityId") : activityId,
			schoolCode = !schoolCode ? self.getFieldValue("School") : schoolCode;

		if (isStrictAccountCodeOn && !schoolCode)
		{
			return Promise.resolve([]);
		}

		var departmentFilter = departmentId ? String.format("eq(DepartmentId,{0})", departmentId) : "isnull(DepartmentId,)",
			activityFilter = activityId ? String.format("eq(FieldTripActivityId,{0})", activityId) : "isnull(FieldTripActivityId,)",
			schoolFilter = String.format("eq(School,{0})", schoolCode),
			filter = String.format("eq(DBID,{0})&{1}&{2}&{3}",
				tf.datasourceManager.databaseId,
				departmentFilter,
				activityFilter,
				schoolFilter
			);
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"),
			{
				paramData: {
					"@fields": "Id,Code",
					"@filter": filter,
					"@relationships": "Department,Activity"
				}
			})
			.then(function(response)
			{
				return response.Items;
			});
	};

	/**
	 * Sum amount in all invoices.
	 *
	 */
	FieldtripFieldEditorHelper.prototype.calculateTotalAmount = function(invoices)
	{
		return (!invoices.length ? 0 :
			invoices.reduce(function(acc, cur)
			{
				return acc + (Number(cur.Amount) === cur.Amount ? cur.Amount : 0);
			}, 0));
	};
	/**
	 * To sum numbers with invalid number.
	 */
	function sumNubers()
	{
		var _numbers = [];
		_numbers = Array.prototype.slice.call(arguments).map(
			function(item)
			{
				if (isNaN(Number(item)))
					item = 0;
				return item;
			}
		)

		var total = _numbers.reduce(function(_sum, v)
		{
			return _sum + Number(v);
		}, 0);
		return total
	};
})()