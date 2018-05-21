
(function()
{
	createNamespace("TF").LoginViewModel = LoginViewModel;

	LoginViewModel.prototype = Object.create(TF.Control.BaseControl.prototype);
	LoginViewModel.prototype.constructor = LoginViewModel;

	function LoginViewModel(clientKey)
	{
		this.obClientKey = ko.observable(clientKey);
		this.obUsername = ko.observable('admin');
		this.obPassword = ko.observable('admin');
	}

	LoginViewModel.prototype.init = function(viewModel, el)
	{
		var signature = getQueryString("signature"),
			clientid = getQueryString("clientid");
		if (signature && clientid)
		{//reset form
			this.$form = $(el).find(".resetForm");
		}
		else
		{
			this.$form = $(el).find(".loginform");
		}

		var validatorFields = {};

		this.$form.find("input[required]").each(function(n, field)
		{
			var name = $(field).attr("name");
			validatorFields[name] = {
				trigger: "blur change",
				validators: {
					notEmpty: {
						message: "required"
					},
					callback: {
						message: "required",
						callback: function(value, validator, $field)
						{
							if (value == " None")
							{
								return false;
							}
							return true;
						}
					}
				}
			}
		});

		this.$form.bootstrapValidator({
			excluded: [':hidden', ':not(:visible)'],
			live: 'enabled',
			fields: validatorFields
		});

		this.$form.data('bootstrapValidator')
			.disableSubmitButtons(false)
			.$hiddenButton.remove();
	};

	LoginViewModel.prototype.apply = function()
	{
		var _validator = this.$form.data("bootstrapValidator");

		_validator.$submitButton = null;
		return _validator
			.validate()
			.then(function(result)
			{
				if (result)
				{
					return this.signIn();
				}
			}.bind(this));
	};

	LoginViewModel.prototype.signIn = function()
	{
		tf.storageManager.save("token", "", true);
		return tf.promiseAjax.post(pathCombine(tf.api.server(), $.trim(this.obClientKey()), "auth", "authentication?vendor=Transfinder&prefix=" + tf.storageManager.prefix.split('.')[0] + "&username=" + this.obUsername()),
			{
				data: '"' + this.obPassword() + '"'
			},
			{
				auth:
				{
					noInterupt: true
				}
			})
			.then(function(apiResponse)
			{
				var token = apiResponse.Items[0];
				tf.storageManager.save("token", token, true);
				tf.authManager.token = token;
				return { clientKey: $.trim(this.obClientKey()), username: this.obUsername(), password: this.obPassword() };
			}.bind(this))
	};

	LoginViewModel.prototype._trimClientKey = function()
	{
		var clientKey = this.obClientKey().trim();
		this.obClientKey(clientKey);
	}
})();