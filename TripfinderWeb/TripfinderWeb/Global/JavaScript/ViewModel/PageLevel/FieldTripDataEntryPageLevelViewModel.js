(function()
{
	var namespace = createNamespace('TF.PageLevel');
	namespace.FieldTripDataEntryPageLevelViewModel = FieldTripDataEntryPageLevelViewModel;
	var ERROR_MESSAGE = {
		STRICT_ACCOUNT_DEPT_ACTIVITY: "Strict account code is on, no account matches selected school and dept/activity.",
	};
	function FieldTripDataEntryPageLevelViewModel(fieldTripDE)
	{
		var self = this;
		namespace.BasePageLevelViewModel.call(self);

		self.inactiveDateEmpty = true;
		self.activeDateEmpty = true;
		self.fieldTripDE = fieldTripDE;

		self.activeLostfouseName = "";
	}

	FieldTripDataEntryPageLevelViewModel.prototype.constructor = FieldTripDataEntryPageLevelViewModel;

	FieldTripDataEntryPageLevelViewModel.prototype = Object.create(namespace.BasePageLevelViewModel.prototype);

	FieldTripDataEntryPageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var self = this, validationErrors = [],
			returnDate = new moment(self.fieldTripDE.obEntityDataModel().returnDate()),
			departDate = new moment(self.fieldTripDE.obEntityDataModel().departDate()),
			start = new moment(self.fieldTripDE.obEntityDataModel().departTime()),
			end = new moment(self.fieldTripDE.obEntityDataModel().returnTime()),
			isEndUndefined = self.fieldTripDE.obEntityDataModel().returnTime() == undefined,
			isSameDay = returnDate.isSame(departDate, "day"),
			isDateAfter = departDate.isAfter(returnDate),
			isTimeAfter = false, $form = self.fieldTripDE.$form,
			message, departDateInput, endDateInput, departTimeInput, endTimeInput;

		start.year(2010);
		start.dayOfYear(1);

		end.year(2010);
		end.dayOfYear(1);
		isTimeAfter = !isEndUndefined && start.isValid() && end.isValid() && start.isAfter(end);
		departDateInput = $form.find("input[name='departDate']");
		endDateInput = $form.find("input[name='estimatedReturnDate']");
		departTimeInput = $form.find("input[name='departTime']");
		endTimeInput = $form.find("input[name='estimatedReturnTime']");
		
		if (self.fieldTripDE.obEntityDataModel().returnDate() && !self.fieldTripDE.obEntityDataModel().returnTime()) {
			message = 'Return time is required';
			validationErrors.push({ message: message, field: endTimeInput });
		}

		if (!isSameDay && isDateAfter)
		{
			if (self.activeLostfouseName === "departDate")
			{
				message = 'Depart Date must be less than or equal to Return Date';
				validationErrors.push({ message: message, field: departDateInput });
			}
			else
			{
				message = 'Return Date must be greater than or equal to Depart Date';
				validationErrors.push({ message: message, field: endDateInput });
			}
		}
		else if (isSameDay && isTimeAfter)
		{
			if (self.activeLostfouseName === "departTime")
			{
				message = 'Depart Time must be less than or equal to Return Time';
				validationErrors.push({ message: message, field: departTimeInput });
			}
			else
			{
				message = 'Return Time must be greater than or equal to Depart Time';
				validationErrors.push({ message: message, field: endTimeInput });
			}
		}

		// if (self.fieldTripDE.obRequiredFields() && self.fieldTripDE.obRequiredFields().FieldTripAccountID && self.fieldTripDE.obRequiredFields().FieldTripAccountID.Required &&
		// 	self.fieldTripDE.obInvoicingGridViewModel().obGridViewModel() && self.fieldTripDE.obInvoicingGridViewModel().obGridViewModel().searchGrid)
		// {
		// 	if (self.fieldTripDE.obInvoiceGridDataSource().length === 0)
		// 	{
		// 		validationErrors.push({ message: "Account is required.", field: $form.find(".gridController.invoice-grid") });
		// 	}
		// }

		if (self.fieldTripDE.obIsInvoiceRequired() && self.fieldTripDE.obInvoiceGridDataSource().length === 0)
		{
			validationErrors.push({ message: "Invoice Information is required.", field: $form.find(".gridController.invoice-grid") });
		}

		return validationErrors;
	};

	FieldTripDataEntryPageLevelViewModel.prototype.getValidationErrors = function(valid)
	{
		var self=this,baseValidationErrors = namespace.BasePageLevelViewModel.prototype.getValidationErrors.call(this),
		isStrictAccountCodeOn = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'];
		var validationErrors = [];
		if (isStrictAccountCodeOn)
		{
			var strictAccountCodeErrors = self.getStrictAccountCodeErrors();
			validationErrors = validationErrors.concat(strictAccountCodeErrors);
		}
		baseValidationErrors.forEach(function(error)
		{
			if (error.rightMessage.indexOf("must be greater than or equal to") >= 0 || error.rightMessage.indexOf("must be less than or equal to") >= 0)
			{
				return;
			}

			validationErrors.push(error);
		});
		return validationErrors;
	};

	FieldTripDataEntryPageLevelViewModel.prototype.getStrictAccountCodeErrors =  function()
	{
		var self = this, entity=self.fieldTripDE.obEntityDataModel();
		var res=self.fetchMatchedAccounts(entity.districtDepartmentId(), entity.fieldTripActivityId(), entity.school());
		var resultList = [],account = res[0];
		if (!account)
		{
			resultList.push({ name: "DeptActivity", rightMessage: ERROR_MESSAGE.STRICT_ACCOUNT_DEPT_ACTIVITY,leftMessage: "", field: null});
		}
		else 
		{
			var isValid  = self.checkFieldTripInvoices(account, entity.fieldTripInvoices());
			if (!isValid)
			{
				var errorMsg = `Strict account code is on, please remove any existing invoice that is not using account ${account.Code}.`;
				resultList.push({ name: "FieldTripInvoiceGrid", rightMessage: errorMsg,leftMessage: "", field: null });
			}
		}
		return resultList;
	}

	FieldTripDataEntryPageLevelViewModel.prototype.fetchMatchedAccounts = function(departmentId, activityId, schoolCode)
	{
		var isStrictAccountCodeOn = tf.fieldTripConfigsDataHelper.fieldTripConfigs['StrictAcctCodes'];
		if (isStrictAccountCodeOn && !schoolCode)
		{
			return [];
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
		var result = [];
		tf.ajax.get(pathCombine(tf.api.apiPrefix(), "fieldtripaccounts"),
		{
			paramData: {
				"@fields": "Id,Code",
				"@filter": filter,
				"@relationships": "Department,Activity"
			},
			async: false
		}).then(response => {
			if(response && response.Items)
			{
				result = response.Items;
			}
		});
		return result;
	};

	FieldTripDataEntryPageLevelViewModel.prototype.checkFieldTripInvoices = function(account, invoices)
	{
		var fetchAccount = account ? account:
			this.fetchMatchedAccounts()[0];
			return fetchAccount && (invoices || []).every(function(item)
			{
				return item.FieldTripAccountId === acc.Id;
			});
	};
})();

