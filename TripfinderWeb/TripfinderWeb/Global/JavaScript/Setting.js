(function()
{
	createNamespace("TF").Setting = Setting;

	function Setting()
	{
		this.userProfile = {
			RoutingProfile:
			{}
		};
	}

	Setting.prototype.getRoutingConfig = function()
	{
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles"))
			.then(function(data)
			{
				if (data.Items[0])
				{
					this.userProfile = data.Items[0];
					this.userProfile.DefaultTimeSpan = moment(this.userProfile.DefaultTime).format("HH:mm:ss");
					this.userProfile.RoutingProfile = data.Items[0].RoutingProfile ||
						{};
					this.userProfile.District = this.userProfile.District || "";
					this.userProfile.AreaCode = this.userProfile.AreaCode || "";
					this.userProfile.Mailcity = this.userProfile.Mailcity || "";
					this.userProfile.MailState = this.userProfile.MailState || "";
					this.userProfile.Mailzip = this.userProfile.Mailzip || "";
					Setting.setProfileStyle(this.userProfile);
					if (tf.colorSource && this.userProfile.TripColors)
					{

						tf.colorSource = this.userProfile.TripColors.split(";").map(function(c)
						{
							return TF.Color.toHTMLColorFromLongColor(c);
						});
					}
				}
			}.bind(this));
	};

	Setting.setProfileStyle = function(userProfile)
	{
		var css = '.icon-closed,.description-content-icon.closed{' +
			'background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16"> <rect width="16" height="16"  stroke="#999999" stroke-width="4" fill="@closed@"/></svg>\');' +
			'}' +
			'.icon-holiday,.description-content-icon.holiday{' +
			'background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16">  <circle cx="8" cy="8" r="8" fill="@holiday@"/></svg>\');' +
			'}' +
			'.icon-session,.description-content-icon.session{' +
			'background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16">  <rect width="16" height="16"   fill="@session@"/></svg>\');' +
			'}' +
			'.icon-schoolyear,.description-content-icon.schoolyear{' +
			'background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16">  <polygon points="0,0 16,0 16,16 0,0" fill="@schoolyear@"/></svg>\')' +
			'}' +
			'.icon-vacation,.description-content-icon.vacation{' +
			'background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16"><polygon points="8,0 13,16 0,6 16,6 3,16 8,0"  style="fill:@vacation@;fill-rule:nonzero;" /></svg>\')' +
			'}' +
			'.kendo-grid .k-alt td{' +
			'background-color:@gridAltRow@' +
			'}';

		var closed = TF.Color.toHTMLColorFromLongColor(userProfile.CalEventClosed),
			holiday = TF.Color.toHTMLColorFromLongColor(userProfile.CalEventHoliday),
			session = TF.Color.toHTMLColorFromLongColor(userProfile.CalEventOpen),
			schoolyear = TF.Color.toHTMLColorFromLongColor(userProfile.CalEventYear),
			vacation = TF.Color.toHTMLColorFromLongColor(userProfile.CalEventVacation),
			gridAltRow = TF.Color.toHTMLColorFromLongColor(userProfile.GridAltRow);
		css = css.replace(/@closed@/g, closed).replace('@holiday@', holiday).replace('@session@', session).replace('@schoolyear@', schoolyear).replace('@vacation@', vacation).replace(/@gridAltRow@/g, gridAltRow);
		addStyle("userProfile", css);
	};

})();
