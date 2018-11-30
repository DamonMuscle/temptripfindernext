(function()
{
	createNamespace("TF.Grid").GridAlertViewModel = GridAlertViewModel;
	var alertOptions = {
		alert: "Alert",
		warning: "Warning",
		sucess: "Success",
		danger: "Danger"
	};
	var defaults = {
		alert: alertOptions.alert,
		title: "",
		message: "",
		delay: 5 * 1000,
		position: { x: 65, y: 73 },
		width: 500
	};

	function GridAlertViewModel($alert)
	{
		this.alertOption = alertOptions;
		this.$alert = $alert;
	}

	GridAlertViewModel.prototype.show = function(options)
	{
		this.options = $.extend(true, {}, defaults, options);

		var alertClass = "";
		switch (this.options.alert)
		{
			case alertOptions.alert:
				alertClass = "gridAlert alert alert-info alert-small alert-dismissible ";
				break;
			case alertOptions.warning:
				alertClass = "gridAlert alert alert-warning alert-small alert-dismissible ";
				break;
			case alertOptions.sucess:
				alertClass = "gridAlert alert alert-success alert-small alert-dismissible ";
				break;
			case alertOptions.danger:
				alertClass = "gridAlert alert alert-danger alert-small alert-dismissible ";
				break;
		}

		this.$alert.attr("class", alertClass);
		this.$alert.css({
			position: "absolute",
			left: this.options.position.x,
			top: this.options.position.y,
			width: this.options.width,
			opacity: 1
		});



		var $closeBtn = this.$alert.find(".close")
		$closeBtn.on("click", function(e)
		{
			this.$alert.finish();
			this.$alert.hide();
		}.bind(this));

		if (options.title)
		{
			this.$alert.find(".title").show();
			this.$alert.find(".title").text(options.title);
		}
		else
		{
			this.$alert.find(".title").hide();
		}

		if (options.message)
		{
			this.$alert.find(".message").show();
			this.$alert.find(".message").text(options.message);
			$closeBtn.css("top", "0")
		}
		else
		{
			this.$alert.find(".message").hide();
			$closeBtn.css("top", "1px");
		}

		this.$alert.finish();
		this.delayHideAlert();
	};

	GridAlertViewModel.prototype.delayHideAlert = function()
	{
		this.$alert.fadeIn(1500);
		this.$alert.delay(this.options.delay).fadeOut(1500);
	}
})();