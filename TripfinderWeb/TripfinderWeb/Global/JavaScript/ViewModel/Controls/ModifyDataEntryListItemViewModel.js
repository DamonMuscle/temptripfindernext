(function()
{
	createNamespace('TF.Control').ModifyDataEntryListItemViewModel = ModifyDataEntryListItemViewModel;

	ModifyDataEntryListItemViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	ModifyDataEntryListItemViewModel.prototype.constructor = ModifyDataEntryListItemViewModel;

	function ModifyDataEntryListItemViewModel(fieldName, modelType, localization, id, changeName)
	{
		this.modelType = modelType;
		this.fieldName = fieldName;
		this.fileText = ko.observable("");
		this.initFileText = "";
		this.fieldTitle = tf.applicationTerm.getApplicationTermSingularByName("Name");
		this.obMaxLength = ko.observable("");
		this.obWidth = ko.observable("");
		this.localization = localization;//observable
		this.changeName = changeName;
		switch (this.fieldName)
		{
			case 'mailzip':
				this.fieldName = "mail_zip";
				this.fieldTitle = this.localization().Postal;
				this.obWidth("120px");
				break;
			case 'mailcity':
				this.fieldName = "mail_city";
				this.fieldTitle = tf.applicationTerm.getApplicationTermSingularByName("Name");
				this.obMaxLength(25);
				this.obWidth("425px");
				break;
		}

		this.focusField = this.focusField.bind(this);

		this.id = id;
		if (this.id)
		{
			tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.id))
			.then(function(data)
			{
				this.initFileText = data.Items[0].Item;
				this.fileText(this.initFileText);
			}.bind(this));
		}
		this.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();
	}

	ModifyDataEntryListItemViewModel.prototype.save = function()
	{
		return this.saveValidate()
		.then(function(valid)
		{
			if (!valid)
			{
				return false;
			}
			else
			{
				if (this.fieldName === "fieldtriptemplate")
				{// no need to save data in DB, so direct return the value.
					return this.fileText();
				}
				if (this.id)
				{
					return tf.promiseAjax.put(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.id, this.fileText()))
					.then(function(data)
					{
						if (this.changeName)
							PubSub.publish(topicCombine(pb.DATA_CHANGE, this.changeName, pb.EDIT));
						return data.Items[0];
					}.bind(this));
				}
				else
				{
					return tf.promiseAjax.post(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.modelType, this.fieldName, this.fileText()))
					.then(function(data)
					{
						if (this.changeName)
							PubSub.publish(topicCombine(pb.DATA_CHANGE, this.changeName, pb.EDIT));
						return data.Items[0];
					}.bind(this));
				}
			}
		}.bind(this))
	}

	ModifyDataEntryListItemViewModel.prototype.saveValidate = function()
	{
		return this.pageLevelViewModel.saveValidate()
		.then(function(valid)
		{
			if (!valid)
			{
				return false;
			}
			else
			{
				return true;
			}
		}.bind(this));
	};

	ModifyDataEntryListItemViewModel.prototype.init = function(viewModel, el)
	{
		this._$form = $(el);
		var validatorFields = {}, isValidating = false, self = this;
		var validator;
		switch (this.fieldName)
		{// trip alias need to be unique either.
			case 'mail_city':
				validator = {
					notEmpty: {
						message: " required"
					},
					stringLength: {
						max: 25
					},
					regexp: {
						regexp: "[a-zA-Z0-9]",
						message: ' ' + tf.applicationTerm.getApplicationTermSingularByName(" invalid City Name")
					},
					callback: {
						message: ' must be unique',
						callback: function(value, validator, $field)
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.modelType, "mail_city"),
								null,
										{ overlay: false })
							.then(function(data)
							{
								return !data.Items.some(function(item)
								{
									return item.Item.toLowerCase() === value.toLowerCase() && item.Id !== this.id;
								}.bind(this));
							}.bind(this));
						}.bind(this)
					}
				};
				break;
			case 'mail_zip':
				validator = {
					notEmpty: {
						message: ' required'
					},
					stringLength: {
						min: this.localization().PostalCodeLength,
						max: this.localization().PostalCodeLength,
						message: ' invalid ' + this.localization().Postal
					},
					callback: {
						message: ' must be unique',
						callback: function(value, validator, $field)
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.modelType, "mail_zip"),
								null,
										{ overlay: false })
							.then(function(data)
							{
								return !data.Items.some(function(item)
								{
									return item.Item.toLowerCase() === value.toLowerCase() && item.Id != this.id;
								}.bind(this));
							}.bind(this));
						}.bind(this)
					}
				};
				break;
			case 'fieldtriptemplate':
				validator = {
					notEmpty: {
						message: ' required'
					},
					callback: {
						message: ' must be unique',
						callback: function(value, validator, $field)
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "fieldtriptemplate", "uniquenamecheck") + "?name=" + this.fileText(),
								null,
										{ overlay: false })
							.then(function(data)
							{
								return !data.Items.some(function(item)
								{
									return item;
								}.bind(this));
							}.bind(this));
						}.bind(this)
					}
				};
				break;
			default:
				validator = {
					notEmpty: {
						message: " required"
					},
					callback: {
						message: ' must be unique',
						callback: function(value, validator, $field)
						{
							return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "dataentry", "list", this.modelType, this.fieldName),
								null,
										{ overlay: false })
							.then(function(data)
							{
								return !data.Items.some(function(item)
								{
									return item.Item.toLowerCase() === value.toLowerCase() && item.Id !== this.id;
								}.bind(this));
							}.bind(this));
						}.bind(this)
					}
				};
				break;
		}

		this._$form.find("input[required]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: validator
			}
		});

		$(el).bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			message: 'This value is not valid',
			fields: validatorFields
		}).on('success.field.bv', function(e, data)
		{
			if (!isValidating)
			{
				isValidating = true;
				self.pageLevelViewModel.saveValidate(data.element);
				isValidating = false;
			}
		});

		this._$form.find("input[name=filetext]").focus();
		this.pageLevelViewModel.load(this._$form.data("bootstrapValidator"));
	};

	ModifyDataEntryListItemViewModel.prototype.focusField = function(viewModel, e)
	{
		this._$form.find("input[name=filetext]").focus();
	}

	ModifyDataEntryListItemViewModel.prototype.apply = function()
	{
		return this.save();
	};

	ModifyDataEntryListItemViewModel.prototype.dispose = function()
	{
		this.pageLevelViewModel.dispose();
	};

})();