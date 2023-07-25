(function()
{
	createNamespace("TF.UserDefinedField").DateTimeUserDefinedFieldViewModel = DateTimeUserDefinedFieldViewModel;

	function DateTimeUserDefinedFieldViewModel()
	{
		this.obIsEnable = ko.observable(true);
	};

	DateTimeUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return null;
	};

	DateTimeUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><!-- ko customInput:{type:'DateTime',value:obDefaultValue,disable:!obTypeModalData().obIsEnable(),attributes:{class:'form-control',format:'MM/DD/YYYY hh:mm A',tabindex:\"4\",name:'defaultValue', adjustPopupPosition: obTypeModalData().adjustPopupPosition}} --><!-- /ko --></div>";
	};

	DateTimeUserDefinedFieldViewModel.prototype.adjustPopupPosition = function (senderElement, calendarViewElement, dateView) 
	{
		setTimeout(function()
		{
			var zindex = Math.max(...Array.from(senderElement.parents()).map(el => parseInt($(el).css("z-index"))).filter(x => !Number.isNaN(x)));
			var rect = senderElement[0].getBoundingClientRect(),
				calendarWidth = calendarViewElement.closest(".k-animation-container").width(),
				calendarHeight = calendarViewElement.closest(".k-animation-container").height(),
				bodyWidth = $("body").width();

			let isPopupOnTop = rect.bottom + 1 + calendarHeight > document.body.clientHeight;
			// adjust calendar popup layer position: popup from associated textbox top if not enouch height in the bottom area, otherwise popup from the bottom
			const popupTop = isPopupOnTop ? rect.top - calendarHeight : rect.bottom - 1;
			calendarViewElement.closest(".k-animation-container").css({
				"z-index": zindex + 1,
				top: popupTop,
				left: rect.right + calendarWidth / 2 > bodyWidth ? bodyWidth - calendarWidth - 1 : rect.right - calendarWidth / 2
			});
			if (dateView) {
				dateView.css("left", "");
			}
		});
	};

	DateTimeUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultDatetime"] = defaultValue;
	};

	DateTimeUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultDatetime"];
	};
})();